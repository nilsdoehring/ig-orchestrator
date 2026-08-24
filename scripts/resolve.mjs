#!/usr/bin/env node
// The local `unima:knowledge:explain` — resolves ONE concrete context through lib/resolve.mjs and
// prints exactly what a generator would receive: the instruction-track prompt block, the check-track
// rule list, the line count against budget, and — this is the part "just read knowledge/rules/" can
// never give you — every rule that did NOT make it through, with the reason.
//
// WHY A DROPPED `must` IS A BLOCKER, NOT A LINE ITEM. Most drops are ordinary and expected — a rule
// scoped to the `email_subject` slot has nothing to do with a `headline` request, and printing that
// as an alarm on every run would bury the real signal. The one class that is NEVER routine is a
// `must` that WAS applicable in this context (it survived scope, slot, channel, discipline,
// machine-actionability, its effective window, `applies_when` — every filter in step 1) and still did
// not reach the output, because something inside the applicable set removed it: shadowed by a
// LESS-obligated rule at the same key, explicitly suppressed, explicitly superseded, or (structurally
// should be impossible per decision 5, and therefore doubly worth surfacing if it ever happens)
// evicted by the budget. That is exactly the failure this whole ranking design exists to prevent —
// resolve.mjs's own header tells the story of the Sie-form rule vanishing from a German email subject
// this way, silently, because of an ordering bug. So: printed as a blocker, non-zero exit, in EVERY
// mode — human, --json, --human — never folded quietly into a line item you'd only see with
// --show-dropped, and never confused with the routine case of a rule that simply did not apply here.
//
// Two tracks, two audiences:
//   (default)  the MACHINE track — what scripts/check.mjs and a real generation prompt would see.
//              Budgeted (default 12 lines), and machine_actionable rules only.
//   --human    the HUMAN track — for a person deciding whether a rule is right, not for a prompt.
//              No budget (nothing truncates), and INCLUDES rules no prompt could satisfy (e.g. "test
//              readability on a physical smartphone"). The machine track must never see those; this
//              flag exists so a person still can.

import { argv as ARGV, exit } from 'node:process'
import { ALLOWED_CONDITION_KEYS, DROP_REASONS, loadRules, resolve } from '../lib/resolve.mjs'

const MODALITY_RANK = { must: 3, should: 2, may: 1 }

/**
 * Is this `must` drop a genuine weakening of an obligation, rather than the routine case of a rule
 * that simply did not apply here? `rejectionReason`'s filter-stage reasons (out of scope, wrong slot,
 * wrong channel, wrong discipline, not machine-actionable, outside its effective window, condition not
 * met) never reach `dropped` for a rule this check should flag — those mean the rule was never a
 * candidate for this context at all, which is normal and would make every run noisy if flagged. Only
 * a rule that survived every one of those filters and was THEN removed counts:
 *
 * - `suppressed` / `superseded`: the key is gone with no replacement — always a real loss.
 * - `over_budget`: structurally should be impossible for a `must` (mandatory lines always ship,
 *   never truncated) — if this ever fires, something upstream broke the guarantee, so flag it harder.
 * - `shadowed_by_more_specific`: only a loss if what WON at that key is not itself a `must`. A `must`
 *   overridden by a more specific `must` is a normal, equally-obligatory override; a `must` overridden
 *   by a `should`/`may`, or by nothing findable among the survivors, is the obligation quietly
 *   weakening — the exact class of bug that motivated this whole check.
 */
function isGenuineObligationLoss(drop, result) {
  if (drop.reason === DROP_REASONS.Suppressed || drop.reason === DROP_REASONS.Superseded || drop.reason === DROP_REASONS.OverBudget) {
    return true
  }
  if (drop.reason !== DROP_REASONS.ShadowedByMoreSpecific) return false

  const winner = result.rules.find((r) => r.key === drop.beaten_by) ?? result.checks.find((r) => r.key === drop.beaten_by)
  return winner === undefined || MODALITY_RANK[winner.modality] < MODALITY_RANK.must
}

// ── CLI ────────────────────────────────────────────────────────────────────────────────────────────

const FLAG_TO_CONTEXT_KEY = {
  slot: 'slot',
  language: 'language',
  market: 'market',
  product: 'product',
  'audience-segment': 'audience_segment',
  channel: 'channel',
  discipline: 'discipline',
  budget: 'budget',
}

function usage() {
  return [
    'Usage: node scripts/resolve.mjs [options]',
    '',
    '  --slot=X --language=X --market=X --product=X --audience-segment=X',
    '  --channel=X --discipline=X (default: writing)  --budget=N (default: 12)',
    '  --condition key=value            repeatable; key must be in the closed vocabulary:',
    `                                    ${ALLOWED_CONDITION_KEYS.join(', ')}`,
    '  --human                           human track: no budget, includes non-machine-actionable rules',
    '  --json                            emit the full resolved set as JSON instead of prose',
    '  --show-dropped                    list every dropped rule, grouped by reason',
    '',
    'Every flag you omit is null — "no opinion" — which is NOT the same as "matches everything";',
    'a pinned rule is out of scope for a request that leaves that coordinate null. See',
    '.claude/skills/knowledge-model/SKILL.md, decision 3.',
  ].join('\n')
}

function usageError(message) {
  console.error(`resolve.mjs: ${message}\n`)
  console.error(usage())
  exit(1)
}

function parseArgs(argv) {
  const context = { conditions: {} }
  let human = false
  let json = false
  let showDropped = false

  const setCondition = (pair) => {
    const ceq = pair.indexOf('=')
    if (ceq === -1) usageError(`--condition needs key=value, got "${pair}".`)
    const key = pair.slice(0, ceq)
    if (!ALLOWED_CONDITION_KEYS.includes(key)) {
      usageError(`--condition key "${key}" is not in the closed predicate vocabulary: ${ALLOWED_CONDITION_KEYS.join(', ')}.`)
    }
    context.conditions[key] = pair.slice(ceq + 1)
  }

  // Index-based, not for...of: `--condition key=value` is TWO argv tokens (space-separated, matching
  // how every doc in this repo shows it), so this flag alone needs to look ahead and consume one.
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i]

    if (raw === '--human') {
      human = true
      continue
    }
    if (raw === '--json') {
      json = true
      continue
    }
    if (raw === '--show-dropped') {
      showDropped = true
      continue
    }
    if (raw === '--help' || raw === '-h') {
      console.log(usage())
      exit(0)
    }
    if (raw === '--condition') {
      const pair = argv[i + 1]
      if (pair === undefined) usageError('--condition needs a following key=value argument.')
      setCondition(pair)
      i += 1
      continue
    }

    const eq = raw.indexOf('=')
    if (!raw.startsWith('--') || eq === -1) {
      usageError(`unrecognised argument "${raw}" — flags take the form --name=value (or "--condition key=value").`)
    }

    const name = raw.slice(2, eq)
    const value = raw.slice(eq + 1)

    if (name === 'condition') {
      setCondition(value)
      continue
    }

    const contextKey = FLAG_TO_CONTEXT_KEY[name]
    if (contextKey === undefined) usageError(`unknown flag --${name}. See --help.`)
    context[contextKey] = value
  }

  if (context.budget !== undefined) {
    const n = Number(context.budget)
    if (!Number.isFinite(n) || n < 0) usageError(`--budget must be a non-negative number, got "${context.budget}".`)
    context.budget = n
  }

  if (human) {
    if (context.budget !== undefined) {
      console.error('resolve.mjs: --human ignores --budget — the human track is never truncated. Continuing without it.')
    }
    context.budget = Infinity
  }
  context.machine_actionable_only = !human

  return { context, human, json, showDropped }
}

// ── main ───────────────────────────────────────────────────────────────────────────────────────────

const { context, human, json, showDropped } = parseArgs(ARGV.slice(2))

let rows
try {
  rows = await loadRules('.')
} catch (err) {
  console.error(`resolve.mjs: could not load knowledge/rules/index.yaml: ${err.message}`)
  console.error('Run this from the repo root — the directory containing knowledge/, lib/, scripts/.')
  exit(1)
}

const result = resolve(rows, context)
const mustDrops = result.dropped.filter((d) => d.modality === 'must' && isGenuineObligationLoss(d, result))

if (json) {
  console.log(
    JSON.stringify(
      {
        context: { ...context, budget: human ? null : context.budget },
        rules: result.rules,
        checks: result.checks,
        lines: result.lines,
        prompt: result.prompt,
        dropped: result.dropped,
        dropped_mandatory: mustDrops,
        budget: human ? null : result.budget,
        candidate_count: result.candidate_count,
        line_count: result.line_count,
        mandatory_exceeds_budget: result.mandatory_exceeds_budget,
      },
      null,
      2,
    ),
  )
} else {
  printHuman(result, { human, showDropped, mustDrops })
}

// The blocker prints to stderr regardless of --json, so a caller piping stdout into a JSON parser
// still sees it on the terminal, and the exit code carries it even when nobody is watching.
if (mustDrops.length > 0) {
  console.error('')
  console.error(`BLOCKER: ${mustDrops.length} mandatory ("must") rule(s) did not reach this context. See above.`)
  console.error('A dropped must is never just a line item — re-run with --show-dropped and fix it before generating.')
  exit(1)
}

exit(0)

// ── human-readable rendering ──────────────────────────────────────────────────────────────────────

function printHuman(result, { human, showDropped, mustDrops }) {
  console.log('== Instruction track (the prompt block, byte-identical to what a generator would receive) ==')
  console.log('')
  console.log(result.prompt === '' ? '(nothing — no instruct-track rule applies in this context)' : result.prompt)

  if (human) {
    const nonActionable = result.rules.filter((r) => r.machine_actionable === false)
    if (nonActionable.length > 0) {
      console.log('')
      console.log(
        `NOTE: ${nonActionable.length} rule(s) above are NOT machine-actionable — no prompt could satisfy them. ` +
          'The machine track (this script without --human) never includes these:',
      )
      for (const r of nonActionable) console.log(`  - ${r.key}: ${r.instruction}`)
    }
  }

  console.log('')
  console.log('== Check track (verified against generated output by scripts/check.mjs — never injected into a prompt) ==')
  console.log('')
  if (result.checks.length === 0) {
    console.log('(none)')
  } else {
    for (const rule of result.checks) {
      const tag = rule.machine_actionable === false ? ' [HUMAN-ONLY]' : ''
      console.log(`- [${rule.modality.toUpperCase()}]${tag} ${rule.key} (${rule.family}) — ${rule.instruction}`)
    }
  }

  console.log('')
  console.log('== Budget ==')
  console.log('')
  if (human) {
    console.log('Human track — no budget applied. Every applicable rule is shown above, truncated by nothing.')
  } else {
    const remaining = result.budget - result.line_count
    console.log(`${result.line_count} of ${result.budget} line(s) used` + (remaining >= 0 ? ` (${remaining} remaining).` : '.'))
    if (result.mandatory_exceeds_budget) {
      console.log('')
      console.log('NOTE: mandatory ("must") lines alone exceed the budget. Every must line still shipped —')
      console.log('budgets shrink should/may lines, never must (knowledge-model SKILL.md, decision 5).')
      console.log('This is a corpus-tuning problem, not something to resolve by picking which must to drop.')
    }
  }

  if (mustDrops.length > 0) {
    console.log('')
    console.log(`== BLOCKER: ${mustDrops.length} mandatory rule(s) dropped ==`)
    console.log('')
    for (const d of mustDrops) {
      const beaten = d.beaten_by ? ` — beaten by ${d.beaten_by}` : ''
      console.log(`- ${d.key}  [reason: ${d.reason}]${beaten}`)
      if (d.source_locator) console.log(`    ${d.source_locator}`)
    }
  }

  if (showDropped) {
    console.log('')
    printDroppedGrouped(result.dropped)
  }
}

function printDroppedGrouped(dropped) {
  console.log('== Dropped, grouped by reason ==')
  console.log('')
  if (dropped.length === 0) {
    console.log('(nothing dropped)')
    return
  }

  // Canonical order straight from lib/resolve.mjs's DROP_REASONS, not insertion order — insertion
  // order is an artefact of which loop in the walk found a rule first, and is not part of the
  // contract (conformance.mjs makes the same call when comparing drop sets).
  for (const reason of Object.values(DROP_REASONS)) {
    const group = dropped.filter((d) => d.reason === reason).sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    if (group.length === 0) continue

    console.log(`-- ${reason} (${group.length}) --`)
    for (const d of group) {
      const beaten = d.beaten_by ? ` — beaten by ${d.beaten_by}` : ''
      console.log(`  ${d.key} [${d.modality}] specificity=${d.specificity}${beaten}`)
      if (d.source_locator) console.log(`      ${d.source_locator}`)
    }
    console.log('')
  }
}
