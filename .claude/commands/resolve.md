---
description: Show every rule that resolves for a context, and every rule that was dropped with its reason — the local equivalent of Unima's unima:knowledge:explain
argument-hint: "[--slot=headline] [--language=de-DE] [--market=DE] [--product=NAME] [--audience-segment=KEY] [--channel=email] [--discipline=writing|photography] [--budget=12] [--condition=key=value ...] [--as-of=YYYY-MM-DD] [--human] [--show-dropped] [--json]"
allowed-tools: [Bash, Read, Glob, Grep]
---

# /resolve

You are standing in for `unima:knowledge:explain`, the acceptance tool for the whole knowledge
cascade. Wrap `scripts/resolve.mjs`, which wraps `lib/resolve.mjs` — the JS port of Unima's
`KnowledgeResolver`, proven against `knowledge/_conformance/cases.json` by `scripts/conformance.mjs`.

Arguments: `$ARGUMENTS`

## Why this command exists at all

An owner asking about a rule asks one of two questions, and they are indistinguishable without this
command:

1. "Did the model ignore my rule?"
2. "Was my rule even sent?"

The second is far more often the true answer, and the only way to tell them apart is a drop list
where **every** candidate that did not reach the prompt carries a reason. `/resolve` is that list.
Run it before blaming the model.

## Step 1 — run the resolver

```bash
node scripts/resolve.mjs --slot=<slot> --language=<lang> --market=<market> \
  --product=<product> --audience-segment=<segment> --channel=<channel> \
  --discipline=<writing|photography> --budget=<budget> \
  --condition=<key>=<value> --as-of=<YYYY-MM-DD> [--human] [--show-dropped] [--json]
```

Anything unspecified is `null`, meaning "no opinion" — **not** "all". An unpinned coordinate matches
every rule; a pinned one must match exactly. Asking for brand-wide rules with no market must not hand
back one market's override, and it doesn't: `scopeMatches()` in `lib/resolve.mjs` treats a `null` in
the request as "this dimension has no opinion", not as a wildcard on the rule's side.

`--discipline` defaults to `writing`. `writing` is what every text slot resolves against; the
photography rows in `knowledge/rules/index.yaml` only surface with `--discipline=photography`, and
even then this command's real audience for image work is `design/photography/rules.md` — see
`/image-generate` for why the prose file, not this resolver, is what image-prompt assembly reads.

`--human` mirrors `KnowledgeContext::forHumanReader()`: no budget (everything applicable is kept,
nothing truncated) and non-machine-actionable rules are included instead of dropped. Use it to see
everything a human reviewer needs to know about a context, not what a model will actually receive.

Without `--json` you get the same tables `unima:knowledge:explain` prints: the resolved context, the
resolved-rules table, the check-track table, a dropped-by-reason summary, and — with
`--show-dropped` — every individual drop. With `--json` you get the raw object `lib/resolve.mjs`
returns: `{ rules, checks, lines, dropped, budget, candidate_count, line_count,
mandatory_exceeds_budget, prompt }`. `prompt` is the exact block `renderPrompt()` produces — byte-
identical to what the PHP resolver would inject into a system prompt for this context.

## Step 2 — read the resolved side first

`lines` is what actually gets sent, already compacted: same-family rules collapse into one line
(`RuleCompactor`'s job), so six German compounding rules cost one line of budget, not six. A line's
modality is the **strongest** modality among its rules — one `must` inside a compacted line makes the
whole line untruncatable.

`rules` is the flat list underneath those lines, in resolution order (modality, then slot relevance,
then channel relevance, then priority, then specificity, then key — see `rank()` in
`lib/resolve.mjs`). Order is part of the contract, not incidental: it is the budget's selection order,
so a set-equal-but-differently-ordered result is a real divergence, not a rounding error.

`checks` is the check track: rules with `enforcement: check` or `enforcement: both`. They never
compete for budget and never appear in `prompt` — they are verified against generated output by
`/check` instead. See `/check` for that half.

## Step 3 — read the drops, and know what to do about each reason

This is the part a human actually needs, so read every row, not just the count:

| reason | meaning | what to do |
|---|---|---|
| `out_of_scope` | pinned to a scope this request doesn't match | expected if you didn't target that scope. If you thought you did, check the request's business-key values (language code, market code, product name) match the rule's scope **exactly** — a pinned coordinate never matches a `null`. |
| `wrong_slot` | the rule's `slots` list doesn't include this slot | expected if the rule genuinely doesn't apply here. If it should, add this slot to the rule's `slots` in the source, not here — this command only reports, it never edits. |
| `wrong_channel` | same, for `channels` | same fix as `wrong_slot`, on the `channels` list. |
| `wrong_discipline` | the rule is `photography` and you asked for `writing` (or vice versa) | almost always correct behaviour — the discipline split is deliberate. Re-run with `--discipline=photography` only if you actually meant to inspect image-side rules; don't use this resolver for image-prompt assembly regardless (see `/image-generate`). |
| `not_machine_actionable` | the rule asks for something no prompt can satisfy | not a bug. Re-run with `--human` to confirm it's real and see its text, then route it to whatever human process handles it. Never construct a prompt instruction from it — that is the one thing this reason exists to prevent. |
| `outside_effective_window` | `effective_from`/`effective_to` excludes the requested date | check `--as-of` (defaults to today) against the rule's window in `knowledge/rules/index.yaml`. If the window looks wrong, that's a source-data problem, not a resolver bug. |
| `condition_not_met` | the rule's `applies_when` predicate evaluated false | supply the `--condition=key=value` the predicate needs. A key your request says nothing about **never** matches — conditions fail safe on purpose, so an unset condition is not a silent pass. |
| `shadowed_by_more_specific` | a more specific rule with the same key won | not a problem to fix — this is the cascade working. The winner is named in `beaten_by`; go check that rule is the one you actually want, not this one. |
| `suppressed` | a more specific scope explicitly suppressed this key | intentional: some rule at a narrower scope has `effect: suppress` for this key. There is no replacement rule to look for — suppression removes the key outright. |
| `superseded` | a newer rule named this one in `supersedes` and retired it | intentional. If this rule should still be in force, the `supersedes` edge on the newer rule is wrong — fix it at the source, don't expect this command to un-retire it. |
| `over_budget` | ranked below the budget cutoff | **the one that actually needs action.** Raise `--budget`, downgrade the rule's modality, scope it to fewer slots so it competes in a smaller pool, or — if it's mechanically verifiable — move its `enforcement` to `check` and stop paying for it in every prompt at all. |

## A dropped `must` is a publish blocker, not a warning

Every mandatory line is emitted even when the mandatory lines alone exceed the budget — an
obligation is not negotiable, so `/resolve` never quietly drops a `must` to make room. What it does
instead is set `mandatory_exceeds_budget: true` and still print every mandatory line. If you see that
flag, or any drop with `modality: must` and `reason: over_budget`, **stop and fix the data before
generating anything** — raise the budget, split the slot, or downgrade the rule. Do not treat this as
advisory. A model handed more mandatory lines than it can hold starts dropping them silently, and
nothing downstream will tell you which one it lost.

## If you're not sure `lib/resolve.mjs` is still correct

```bash
node scripts/conformance.mjs
```

This replays every case in `knowledge/_conformance/cases.json` — generated by Unima's own PHP
resolver — through `lib/resolve.mjs` and fails on any divergence. If it fails, the JS port is wrong
until proven otherwise; never edit a case to make the gate pass.

## Say so when you cannot be faithful

If `knowledge/rules/index.yaml` is missing or empty, or a requested product/market/language has no
corresponding row anywhere in the corpus, report that plainly and say what you resolved instead of
silently returning an empty set as if it were a real answer. An empty result that looks the same as
"this context genuinely has no rules" is the exact failure mode this command exists to prevent.
