#!/usr/bin/env node
// Runs the CHECK track (lib/resolve.mjs's `checks` — rules with `enforcement: check` or `both`)
// against a piece of already-generated text, plus the forbidden-terms lint. This is the "verify"
// half of the pair with scripts/resolve.mjs's "instruct" half: rules on this track cost no prompt
// budget and are decided exactly, not obeyed probabilistically (knowledge-model SKILL.md, step 4).
//
// WHY "UNVERIFIABLE" IS A THIRD STATUS, NOT A SILENT PASS. A rule lands on the check track because
// its family is the kind that CAN be mechanically decided in general — punctuation, numbers,
// currency, measurement, capitalization, spelling, abbreviation, typography, hyphenation. That does
// not mean every individual rule's wording is something this script can reliably decide today. The
// whole value of this track is that a PASS here is a real, exact fact — the moment a checker fakes a
// pass for a rule it cannot actually verify, that fact stops being trustworthy for every rule, not
// just the one that got faked. So: a rule with no reliable detector is reported as `unverifiable`,
// loudly, with its instruction and source locator printed so a human can check it by eye — never
// silently counted as a pass, and never silently dropped from the report either.
//
// Detectors below are deliberately narrow and driven by the RULE'S OWN WORDING (a quoted example, an
// explicit number, an explicit unit string) rather than by which corpus this happens to be. A rule
// whose wording doesn't give a detector enough to work with reliably falls through to unverifiable —
// that is a feature of this design, not a gap to be closed by guessing.

import { readFile } from 'node:fs/promises'
import { argv as ARGV, exit, stdin } from 'node:process'
import { loadRules, resolve } from '../lib/resolve.mjs'
import { parse } from '../lib/yaml.mjs'

// ── CLI ────────────────────────────────────────────────────────────────────────────────────────────

function usage() {
  return [
    'Usage: node scripts/check.mjs [options]',
    '',
    '  --text-file=PATH | --text="..."   the text to check; otherwise read from stdin',
    '  --slot=X --language=X --market=X --product=X --channel=X',
    '  --forbidden                       run ONLY the forbidden-terms lint (skips the check track)',
    '  --json                            emit the full result as JSON instead of prose',
  ].join('\n')
}

function usageError(message) {
  console.error(`check.mjs: ${message}\n`)
  console.error(usage())
  exit(1)
}

function parseArgs(argv) {
  const opts = {
    textFile: null,
    text: null,
    slot: null,
    language: null,
    market: null,
    product: null,
    channel: null,
    forbidden: false,
    json: false,
  }

  for (const raw of argv) {
    if (raw === '--forbidden') {
      opts.forbidden = true
      continue
    }
    if (raw === '--json') {
      opts.json = true
      continue
    }
    if (raw === '--help' || raw === '-h') {
      console.log(usage())
      exit(0)
    }

    const eq = raw.indexOf('=')
    if (!raw.startsWith('--') || eq === -1) {
      usageError(`unrecognised argument "${raw}" — flags take the form --name=value.`)
    }
    const name = raw.slice(2, eq)
    const value = raw.slice(eq + 1)

    switch (name) {
      case 'text-file':
        opts.textFile = value
        break
      case 'text':
        opts.text = value
        break
      case 'slot':
        opts.slot = value
        break
      case 'language':
        opts.language = value
        break
      case 'market':
        opts.market = value
        break
      case 'product':
        opts.product = value
        break
      case 'channel':
        opts.channel = value
        break
      default:
        usageError(`unknown flag --${name}. See --help.`)
    }
  }

  return opts
}

async function readStdin() {
  const chunks = []
  for await (const chunk of stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

async function loadText(opts) {
  if (opts.text !== null) return opts.text
  if (opts.textFile !== null) {
    try {
      return await readFile(opts.textFile, 'utf8')
    } catch (err) {
      usageError(`could not read --text-file="${opts.textFile}": ${err.message}`)
    }
  }
  if (stdin.isTTY) {
    usageError('no text given — pass --text="...", --text-file=PATH, or pipe text on stdin.')
  }
  return await readStdin()
}

// ── detectors ──────────────────────────────────────────────────────────────────────────────────────
//
// Each detector is `(rule, text) => null | { status: 'pass'|'fail', detail }`. `null` means "this
// rule's wording doesn't give me anything reliable to act on" — NOT "this rule passed". The first
// detector to return non-null decides the rule; if none does, evaluateRule() reports `unverifiable`.

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** A unicode-aware "whole word" boundary, so „White Paper" isn't half-matched inside a longer word. */
function wordBoundedRegex(term, flags) {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(term)}(?![\\p{L}\\p{N}])`, flags)
}

/**
 * Rules stated as `"preferred" statt/instead of "forbidden"` (spelling, anglicism, terminology
 * families all use this shape). Generalises directly from the rule's own quoted example — nothing
 * about this is specific to any one corpus.
 */
function extractTermSwapPairs(instruction) {
  const pairs = []
  for (const re of [/"([^"]+)"\s+statt\s+"([^"]+)"/gi, /"([^"]+)"\s+instead of\s+"([^"]+)"/gi]) {
    for (const m of instruction.matchAll(re)) pairs.push({ preferred: m[1], forbidden: m[2] })
  }
  return pairs
}

function genericTermSwap(rule, text) {
  const pairs = extractTermSwapPairs(rule.instruction)
  if (pairs.length === 0) return null

  const hits = []
  for (const { preferred, forbidden } of pairs) {
    const matches = [...text.matchAll(wordBoundedRegex(forbidden, 'giu'))]
    if (matches.length > 0) hits.push({ preferred, forbidden, occurrences: matches.length })
  }

  return hits.length === 0
    ? { status: 'pass', detail: `none of the ${pairs.length} forbidden spelling(s) this rule names were found.` }
    : {
        status: 'fail',
        detail: hits.map((h) => `found "${h.forbidden}" (${h.occurrences}×) — use "${h.preferred}" instead`).join('; '),
      }
}

const EXCLAMATION_WORD_LIMITS = { einmal: 1, zweimal: 2, dreimal: 3, viermal: 4, fünfmal: 5 }

/** "never in an email subject" / "at most N per page" — the two shapes this corpus's rules use. */
function exclamationMarkLimit(rule, text) {
  if (!/ausrufezeichen|exclamation mark/i.test(rule.instruction)) return null

  let limit = null
  if (/niemals|never/i.test(rule.instruction)) {
    limit = 0
  } else {
    const numeric = rule.instruction.match(/(?:nicht mehr als|max(?:imal)?)\s*(\d+)/i)
    if (numeric) {
      limit = Number(numeric[1])
    } else {
      for (const [word, n] of Object.entries(EXCLAMATION_WORD_LIMITS)) {
        if (new RegExp(`\\b${word}\\b`, 'i').test(rule.instruction)) {
          limit = n
          break
        }
      }
    }
  }
  if (limit === null) return null // mentions exclamation marks but states no decidable threshold

  const count = (text.match(/!/g) ?? []).length
  return count > limit
    ? { status: 'fail', detail: `found ${count} "!" — this rule allows at most ${limit}.` }
    : { status: 'pass', detail: `found ${count} "!", within the limit of ${limit}.` }
}

/**
 * Trailing-punctuation rules (headline/subline/preline/bullet/info-text). Distinguishes "no period"
 * from "no punctuation at all" by whether the instruction says "Satzzeichen" (any mark) or just
 * "Punkt" (period specifically) — collapsing that distinction would make this fail rules it should
 * pass. The one stated exception (a headline that is a question) is honoured only when the
 * instruction itself names it.
 */
function trailingPunctuation(rule, text) {
  const instruction = rule.instruction

  // NEGATION IS TESTED FIRST, AND IT MUST BE. The two patterns overlap: the German for "must NOT end
  // with a period" — "Überschriften werden nicht mit einem Punkt abgeschlossen" — CONTAINS the exact
  // substring "mit einem Punkt abgeschlossen" that the requires pattern looks for. Testing requires
  // first inverted the polarity of every such rule, so this check failed correct text and passed
  // incorrect text.
  //
  // That is worse than having no check at all. An absent check is a known gap; a check that reports
  // the opposite of the truth is trusted, and it teaches a writer to break the rule. The whole reason
  // the check track exists is that these are mechanically DECIDABLE — a wrong decision forfeits that.
  const forbids =
    /kein(?:en)?\s+(?:Punkt|Satzzeichen)/i.test(instruction) ||
    /ohne\s+(?:Punkt|Satzzeichen)/i.test(instruction) ||
    /nicht\s+mit\s+(?:einem\s+)?(?:Punkt|Satzzeichen)/i.test(instruction) ||
    /(?:no|never|not)\s+(?:end\w*\s+with\s+)?(?:a\s+)?(?:trailing\s+)?(?:period|full stop|punctuation)/i.test(instruction)

  // Only consultable once negation is ruled out.
  const requires =
    !forbids &&
    (/mit einem Punkt abgeschlossen/i.test(instruction) ||
      /schließ\w* mit einem Punkt/i.test(instruction) ||
      /ends? with a period/i.test(instruction))

  if (!forbids && !requires) return null

  const trimmed = text.trim()
  const last = trimmed.slice(-1) || '(empty)'

  if (requires) {
    return last === '.'
      ? { status: 'pass', detail: 'ends with a period, as required.' }
      : { status: 'fail', detail: `ends with "${last}" instead of a period.` }
  }

  // forbids
  const questionAllowed = /Frage|question/i.test(instruction)
  if (last === '?' && questionAllowed) {
    return { status: 'pass', detail: 'ends with "?" — allowed by this rule\'s stated question exception.' }
  }
  const broad = /Satzzeichen/i.test(instruction)
  const forbiddenChars = broad ? ['.', '!', ',', ';', ':', '?'] : ['.']
  return forbiddenChars.includes(last)
    ? { status: 'fail', detail: `ends with "${last}", which this rule forbids.` }
    : { status: 'pass', detail: `ends with "${last}" — no forbidden trailing punctuation.` }
}

/** German quotation marks (Anführungszeichen): a straight ASCII quote is always wrong here. */
function germanQuotationMarks(rule, text) {
  if (!/anführungszeichen/i.test(rule.instruction)) return null

  const count = (text.match(/"/g) ?? []).length
  return count === 0
    ? { status: 'pass', detail: 'no straight double-quote characters found.' }
    : { status: 'fail', detail: `found ${count} straight double-quote character(s) ("); this rule requires German „…" marks.` }
}

/** A number-then-symbol rule that explicitly requires a separating space (e.g. "99 %", not "99%"). */
function numberSymbolSpace(rule, text) {
  if (!/%/.test(rule.instruction) || !/leerzeichen|space/i.test(rule.instruction)) return null

  const tight = text.match(/\d%/g) ?? []
  return tight.length === 0
    ? { status: 'pass', detail: 'every "%" is separated from its number by a space.' }
    : { status: 'fail', detail: `found ${tight.length} occurrence(s) of a digit touching "%" with no separating space.` }
}

/** Euro symbol must follow the amount, separated by a space: "1 €", never "€1" or "1€". */
function euroSymbolPosition(rule, text) {
  if (!/€/.test(rule.instruction) || !/hinter der zahl|after the amount/i.test(rule.instruction)) return null

  const before = text.match(/€\s*\d/g) ?? []
  const touching = text.match(/\d€/g) ?? []
  if (before.length === 0 && touching.length === 0) {
    return { status: 'pass', detail: 'every "€" follows its amount, separated by a space.' }
  }
  const parts = []
  if (before.length > 0) parts.push(`"€" appears before the number ${before.length}×`)
  if (touching.length > 0) parts.push(`a number touches "€" with no space ${touching.length}×`)
  return { status: 'fail', detail: parts.join('; ') }
}

/** Whole amounts must drop the decimals: "1 €", never "1,00 €" (but "1,50 €" is a real decimal). */
function noDecimalForWholeAmounts(rule, text) {
  if (!/,00/.test(rule.instruction) || !/€/.test(rule.instruction)) return null

  const hits = text.match(/\b\d+,00\s?€/g) ?? []
  return hits.length === 0
    ? { status: 'pass', detail: 'no whole amount written with a redundant ",00".' }
    : { status: 'fail', detail: `found whole amount(s) with a redundant ",00": ${hits.join(', ')} — drop the decimals.` }
}

/** German thousands separator is a period; a comma-grouped number ("1,000") is the US convention. */
function thousandsSeparatorPeriod(rule, text) {
  if (!/tausendertrennzeichen|thousands separator/i.test(rule.instruction)) return null

  const hits = text.match(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g) ?? []
  return hits.length === 0
    ? { status: 'pass', detail: 'no comma-grouped (US-style) thousands found.' }
    : { status: 'fail', detail: `found US-style comma thousands separator: ${hits.join(', ')} — German uses a period.` }
}

const GERMAN_NUMBER_WORDS = ['eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf']

/** "Always write numbers as digits" — flags spelled-out German number words 1 through 12. */
function numbersAsDigits(rule, text) {
  if (!/als ziffern|as digits/i.test(rule.instruction)) return null

  const found = GERMAN_NUMBER_WORDS.filter((word) => wordBoundedRegex(word, 'iu').test(text))
  return found.length === 0
    ? { status: 'pass', detail: 'no spelled-out number word from one to twelve found.' }
    : { status: 'fail', detail: `found spelled-out number word(s): ${found.join(', ')} — write as digits.` }
}

/**
 * Unit-string casing (GHz, Gbit/s, KB/MB/GB/…), pulled straight from the rule's own quoted or
 * parenthetical examples. Single-letter abbreviations (Bit="b", Byte="B") are deliberately excluded:
 * a case-insensitive scan cannot tell "b" and "B" apart from each other reliably, so checking them
 * would be guessing, not verifying.
 */
function measurementUnitCasing(rule, text) {
  const quoted = [...rule.instruction.matchAll(/"([A-Za-z]{2,6}(?:\/[A-Za-z]{1,3})?)"/g)].map((m) => m[1])
  const parenthetical = [...rule.instruction.matchAll(/\(([A-Za-z]{2,3})\)/g)].map((m) => m[1])
  const canonical = [...new Set([...quoted, ...parenthetical])]
  if (canonical.length === 0) return null

  const failures = []
  for (const unit of canonical) {
    const re = new RegExp(`(?<![A-Za-z0-9])${escapeRegex(unit)}(?![A-Za-z0-9])`, 'gi')
    for (const m of text.matchAll(re)) {
      if (m[0] !== unit) failures.push(`"${m[0]}" should be "${unit}"`)
    }
  }
  return failures.length === 0
    ? { status: 'pass', detail: `every occurrence of ${canonical.join(', ')} uses the required casing.` }
    : { status: 'fail', detail: [...new Set(failures)].join('; ') }
}

const DETECTORS = [
  genericTermSwap,
  exclamationMarkLimit,
  trailingPunctuation,
  germanQuotationMarks,
  numberSymbolSpace,
  euroSymbolPosition,
  noDecimalForWholeAmounts,
  thousandsSeparatorPeriod,
  numbersAsDigits,
  measurementUnitCasing,
]

function evaluateRule(rule, text) {
  for (const detector of DETECTORS) {
    const result = detector(rule, text)
    if (result !== null) {
      return {
        key: rule.key,
        family: rule.family,
        modality: rule.modality,
        instruction: rule.instruction,
        source_locator: rule.source_locator ?? null,
        ...result,
      }
    }
  }
  return {
    key: rule.key,
    family: rule.family,
    modality: rule.modality,
    instruction: rule.instruction,
    source_locator: rule.source_locator ?? null,
    status: 'unverifiable',
    detail: "no mechanised check exists for this rule's wording — verify by eye against the instruction and source below.",
  }
}

// ── check track ────────────────────────────────────────────────────────────────────────────────────

async function runCheckTrack(text, opts) {
  let rows
  try {
    rows = await loadRules('.')
  } catch (err) {
    console.error(`check.mjs: could not load knowledge/rules/index.yaml: ${err.message}`)
    console.error('Run this from the repo root — the directory containing knowledge/, lib/, scripts/.')
    exit(1)
  }

  const resolved = resolve(rows, {
    slot: opts.slot,
    language: opts.language,
    market: opts.market,
    product: opts.product,
    channel: opts.channel,
  })

  const results = resolved.checks.map((rule) => evaluateRule(rule, text))

  return {
    results,
    passed: results.filter((r) => r.status === 'pass').length,
    failed: results.filter((r) => r.status === 'fail').length,
    unverifiable: results.filter((r) => r.status === 'unverifiable').length,
    total: results.length,
  }
}

// ── forbidden-terms lint ───────────────────────────────────────────────────────────────────────────

/** A scoped entry is in scope for this context unless the context pins a dimension it contradicts. */
function inScope(entry, opts) {
  if (opts.language !== null && entry.language !== null && entry.language !== opts.language) return false
  if (opts.market !== null && entry.market !== null && entry.market !== opts.market) return false
  return true
}

function findHits(entries, text, opts) {
  const hits = []
  for (const entry of entries) {
    if (!inScope(entry, opts)) continue
    const matches = [...text.matchAll(wordBoundedRegex(entry.term, 'giu'))]
    if (matches.length > 0) {
      hits.push({
        term: entry.term,
        concept: entry.concept ?? null,
        occurrences: matches.length,
        reason: entry.reason ?? null,
        instead_use: entry.instead_use ?? null,
      })
    }
  }
  return hits
}

async function runForbiddenLint(text, opts) {
  let doc
  try {
    const raw = await readFile('knowledge/terms/forbidden.yaml', 'utf8')
    doc = parse(raw)
  } catch (err) {
    console.error(`check.mjs: could not load knowledge/terms/forbidden.yaml: ${err.message}`)
    console.error('Run this from the repo root — the directory containing knowledge/, lib/, scripts/.')
    exit(1)
  }

  return {
    hits: findHits(doc.forbidden ?? [], text, opts),
    deprecated_hits: findHits(doc.deprecated ?? [], text, opts),
  }
}

// ── human-readable rendering ──────────────────────────────────────────────────────────────────────

function printChecksHuman(checkResult) {
  console.log('== Check track ==')
  console.log('')
  if (checkResult.results.length === 0) {
    console.log('(no checkable rule applies in this context)')
    return
  }
  for (const r of checkResult.results) {
    const badge = r.status === 'pass' ? 'PASS' : r.status === 'fail' ? 'FAIL' : 'UNVERIFIABLE'
    console.log(`[${badge}] ${r.key} (${r.family}, ${r.modality})`)
    console.log(`    ${r.detail}`)
    if (r.status === 'unverifiable') {
      console.log(`    Instruction: ${r.instruction}`)
      if (r.source_locator) console.log(`    Source: ${r.source_locator}`)
    }
  }
  console.log('')
  console.log(
    `${checkResult.passed} passed, ${checkResult.failed} failed, ${checkResult.unverifiable} unverifiable, ` +
      `of ${checkResult.total} checkable rule(s).`,
  )
}

function printForbiddenHuman(forbiddenResult) {
  console.log('== Forbidden-terms lint ==')
  console.log('')
  if (forbiddenResult.hits.length === 0) {
    console.log('No forbidden terms found.')
  } else {
    for (const hit of forbiddenResult.hits) {
      console.log(`[FAIL] "${hit.term}" found ${hit.occurrences}×${hit.reason ? ` — ${hit.reason}` : ''}`)
      console.log(`    Instead use: ${hit.instead_use ?? '(no replacement on file for this scope)'}`)
    }
  }
  if (forbiddenResult.deprecated_hits.length > 0) {
    console.log('')
    console.log('Deprecated (not a failure — prefer the replacement going forward):')
    for (const hit of forbiddenResult.deprecated_hits) {
      console.log(`- "${hit.term}" found ${hit.occurrences}× — instead use: ${hit.instead_use ?? '(none on file)'}`)
    }
  }
}

// ── main ───────────────────────────────────────────────────────────────────────────────────────────

const opts = parseArgs(ARGV.slice(2))
const text = await loadText(opts)

const forbiddenResult = await runForbiddenLint(text, opts)
const checkResult = opts.forbidden ? null : await runCheckTrack(text, opts)

const failedChecks = checkResult?.failed ?? 0
const unverifiable = checkResult?.unverifiable ?? 0
const forbiddenFailed = forbiddenResult.hits.length > 0
const ok = failedChecks === 0 && !forbiddenFailed

if (opts.json) {
  console.log(JSON.stringify({ checks: checkResult, forbidden: forbiddenResult, unverifiable_count: unverifiable, ok }, null, 2))
} else {
  if (checkResult) {
    printChecksHuman(checkResult)
    console.log('')
  }
  printForbiddenHuman(forbiddenResult)
  console.log('')
  // Prominent and unconditional: a clean exit must never be mistaken for "everything was verified".
  if (unverifiable > 0) {
    console.log(`UNVERIFIABLE: ${unverifiable} check rule(s) could not be mechanically verified — read them by eye above.`)
  }
  console.log(ok ? 'RESULT: PASS' : 'RESULT: FAIL')
}

exit(ok ? 0 : 1)
