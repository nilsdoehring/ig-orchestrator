---
description: Run the check-track rules and the forbidden-terms lint against generated text — verified exactly, at zero prompt budget
argument-hint: "[--slot=headline] [--language=de-DE] [--market=DE] [--product=NAME] [--channel=email] [--text-file=PATH | stdin] [--forbidden] [--json]"
allowed-tools: [Bash, Read, Glob, Grep]
---

# /check

You are standing in for the enforcement half of the knowledge cascade: rules with
`enforcement: check` or `enforcement: both` in `knowledge/rules/index.yaml`, plus the forbidden-terms
lint from `knowledge/terms/forbidden.yaml`. Wrap `scripts/check.mjs`.

Arguments: `$ARGUMENTS`

## Why a separate track exists

Two ways to make a model follow a rule about number formatting: instruct it into the prompt and hope,
or verify it against the output and know. Orthography, punctuation, hyphenation, number and date
formatting are all **mechanically decidable** — a regex or a small parser either confirms them or
doesn't. Instructing them into a prompt spends budget on something probabilistic when the exact
answer is one string comparison away.

This is not a marginal optimisation. On the loaded IONOS corpus, moving decidable rules off the
instruction track and onto this one moves **32 of 69 rules** off the budget entirely. Those are 32
rules that a `/resolve` budget of 12 would otherwise be ranking, compacting and sometimes dropping —
for a class of fact that doesn't need a model's judgement at all.

## Step 1 — get the text

```bash
node scripts/check.mjs --slot=<slot> --language=<lang> --market=<market> --product=<product> \
  --channel=<channel> --text-file=<path>
```

Omit `--text-file` and the script reads stdin instead — pipe generated output straight in:

```bash
echo "$GENERATED_TEXT" | node scripts/check.mjs --slot=<slot> --language=<lang> --market=<market>
```

The context flags (`--slot`, `--language`, `--market`, `--product`, `--channel`) resolve the same
scope cascade `/resolve` does, filtered down to `enforcement: check` / `both` rules only — the check
track is never truncated by budget, so every applicable checkable rule runs, not just the ones that
would have fit.

## Step 2 — read the per-rule result

Default output is a table: rule key, family, modality, result, and `source_locator` so a human can go
find the sentence that authored the rule. `--json` gives the same rows as data.

Three results, not two — **never collapse the third into a pass**:

- **PASS** — the rule's condition held against the text. Mechanically verified, not a guess.
- **FAIL** — the rule's condition did not hold. Fix the text and re-check; do not return failing text
  with an explanatory note. The entire point of this track is that the failure is decidable, so there
  is no ambiguity to append a caveat to.
- **NOT_MECHANIZED** — this rule's family or key has no check implemented in `scripts/check.mjs` yet,
  even though the source marked it `enforcement: check` or `both`. This is **not** a pass. Report it
  as unchecked, say plainly that a human needs to read the text against this rule themselves, and
  exit non-zero-adjacent (the summary line, not the pass/fail exit code) so it can't be mistaken for
  a clean run. Faking a pass here is worse than not running the check at all — it tells a caller a
  fact was verified when it wasn't.

## Step 3 — the forbidden-terms lint

```bash
node scripts/check.mjs --forbidden --text-file=<path>
```

Scans the text against `knowledge/terms/forbidden.yaml`'s `forbidden` list, scoped by
concept/language/market. A hit is a **hard fail** — `forbidden.yaml` is the file every other
generated file in this repo is linted against; it is a gate, not a report. Each hit prints the
matched term, its scope, the `reason` from the source, and `instead_use` when the same concept has a
rank-1 preferred term for that language/market — that lookup is the whole reason a forbidden term
hangs off a concept instead of standing alone.

`deprecated` terms in the same file are informational only and are **not** part of this gate:
deprecated means "prefer something else going forward," forbidden means "must never appear." Report
deprecated hits separately, at a lower severity, and never let one block on the strength of the other.

## Exit behaviour

Exit `0` only when every checkable rule that ran returned PASS and, if `--forbidden` was requested,
zero forbidden terms matched. Exit non-zero on any FAIL or any forbidden-term hit. `NOT_MECHANIZED`
rows do not flip the exit code on their own — they are neither a pass nor a failure, they're an
admission the tool can't decide — but they must always be visible in the summary, never silently
dropped from the output the way a truncated table might drop a row nobody asked to see.

## Say so when you cannot be faithful

If `knowledge/terms/forbidden.yaml` or `knowledge/rules/index.yaml` is missing, or the requested
scope resolves zero checkable rules where you expected some, report that directly — don't run the
lint against an empty rule set and call it a clean pass. A check that silently checked nothing is
indistinguishable from a check that passed, and that is precisely the ambiguity this track exists to
remove.
