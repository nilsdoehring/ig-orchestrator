---
name: writing-rules
description: Load before writing, editing, or reviewing copy in this repo — resolve knowledge first, obey must absolutely, use verbatim statements and glossary rank correctly, check before returning, and never guess at design guidance.
---

# Writing rules

This is the practical half of the knowledge model. `knowledge-model` teaches the resolution
mechanics; this teaches what to actually do when a request lands: write a headline, a subject line,
a product blurb, anything that becomes copy. Load `knowledge-model` too if you haven't — the rules
below assume you already know what a tri-state coordinate and an `exception_to` edge mean.

## Resolve first. Never inject a whole brand book.

```bash
node scripts/resolve.mjs --slot=<slot> --language=<lang> --market=<market> \
  --product=<product> --channel=<channel> --budget=12 --json
```

The `prompt` field in the result is the exact block that goes in front of the model — not a summary
of it, not "the relevant parts of it," the actual bytes. Pasting brand-document prose instead of this
block defeats the entire reason the resolution model exists: a request scoped to one slot, one market,
one product gets the dozen rules that actually bind it, not sixty-nine rules re-read and re-filtered
by eye. If the result's `dropped` list contains a `must` dropped for `over_budget`, say so before you
write anything — that's a data problem for a human to retune, not something to route around by
quietly picking which rule to disobey.

## Obey `must` absolutely.

`should` and `may` yield to the budget, in that order. `must` never does — and it never yields to your
judgment either. If a `must` rule and your instinct for good copy disagree, the rule wins. That's not
a stylistic preference; it's the same guarantee decision 5 in `knowledge-model` describes: the budget
mechanism exists specifically so a `must` is never the thing quietly sacrificed.

## Read a caveat as part of its rule, never as a footnote.

If a resolved rule carries a `caveat`, it is not a hedge you can drop to save space — it changes what
the rule is asking for. The single content unit that **both** independent extraction passes lost, in
this exact corpus, was a caveat: "this list is only a first overview, consult Duden or the
localisation team when in doubt" attached to a set of hyphenation rules. Drop the caveat and those
rules read as harder, more absolute obligations than their own source ever claimed. When a resolved
line has a caveat, treat the instruction-plus-caveat as one unit, always, not instruction-then-maybe.

The same goes for `exceptions`: if `resolve.mjs` attaches an exception to a rule you're using, both
travel together. Applying the general rule and silently ignoring its exception is the "WordPress
Hosting" hyphenation failure by name — case 3 without case 6 is confidently wrong, not conservatively
right.

## Use `verbatim_required` statements exactly. Never paraphrase them.

A `STATEMENT` row with `verbatim_required: true` — a tagline, an approved elevator pitch — is a
governed asset, not raw material for a rewrite. Reproduce it exactly, punctuation included. If the
slot you're writing needs something shorter or differently angled than the verbatim statement
provides, that's a sign you need a different statement or a different rule, not a license to edit this
one.

## Follow `preference_rank` in the glossary. Rank 1 is the term to use.

A CONCEPT's terms are ranked, not merely listed: rank 1 is what a generator should actually write;
rank 2 and 3 are acceptable, in descending preference, never interchangeable with rank 1 by default.
A shorter ranked list for one market than another (three US synonyms for "storage," two for UK) is
what the source states — don't treat a missing rank 3 as a gap to fill in, and don't reach for rank 2
or 3 just because it reads more naturally to you. `do_not_translate` on a concept binds every term
under it, in every language, with no exceptions to negotiate.

## Never invent a product or tariff name. `governed_by: IMC` means a ticket plus Brand Approval.

A concept with `governed_by` set is not asking you to be careful — it's telling you that naming under
it requires a process outside this repo entirely. If a slot needs a product or tariff name that isn't
already an approved term under that concept, that is a blocker to raise, not a gap to fill with a
plausible-sounding name. A generated name that reads correctly and wasn't approved is worse than an
obvious placeholder, because nothing about the output signals that it needs review.

## Check the output before returning it.

```bash
node scripts/check.mjs --slot=<slot> --language=<lang> --market=<market> --text-file=<file>
node scripts/check.mjs --forbidden --text-file=<file>
```

The check track (`enforcement: check` or `both`) exists because some rules — number formatting,
punctuation, hyphenation, orthography — are exactly decidable against output and only probabilistically
followed as instructions. Verifying them costs nothing and catches what obeying them by convention
doesn't. If a check fails, fix the text and re-check; do not return failing text with a note explaining
the failure. The entire point of routing a rule onto this track is that "probably fine" isn't the
standard once a mechanical check exists — use it.

## This repo carries no design content beyond photography.

`knowledge/rules/` and `knowledge/statements/` are writing-discipline only. Photography direction
lives in `design/photography/rules.md` for image-prompt assembly, and nothing else — colour, type,
spacing, and logo construction have **no home in this repo at all**, deliberately. If a request asks
for hex values, a font choice, spacing/grid numbers, or logo usage, do not guess at an answer and do
not synthesize one from adjacent writing rules. Point to `design/README.md` for which system owns each
of those (design tokens live in the Unima editor; type and component styling live in the React
component library; anything else, ask the owning team) and say plainly that this repo doesn't carry
the answer. A plausible-looking colour or font value fabricated here is indistinguishable from a real
constraint until someone ships it.
