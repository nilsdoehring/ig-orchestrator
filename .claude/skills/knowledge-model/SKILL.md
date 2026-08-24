---
name: knowledge-model
description: Load before reading, resolving, or writing anything under knowledge/ or design/photography/ — explains the scope/tri-state/exception/budget model so you don't silently undo the five decisions that were expensive to get right.
---

# The knowledge model

This repo does not hand you a brand book and ask you to read it. It hands you rows — rules,
statements, metrics, exemplars, concepts, terms, and three product-side record types — each carrying
a scope, a modality, and an enforcement track, plus a resolver (`lib/resolve.mjs`, run via
`scripts/resolve.mjs`) that answers "which of these actually apply here" for one concrete context.
Every consumer (this repo's scripts, the PDF, the admin's layer panel, the n8n router) goes through
the same walk, so none of them can drift from another.

Read this before you resolve anything, and **especially** before you touch `resolve.mjs`,
`knowledge/rules/index.yaml`, or any script that filters or ranks rows by hand instead of calling the
resolver. The five things below were each broken once, in a way nothing caught until a human noticed
the output was wrong. Re-breaking any one of them is invisible again by construction.

## The five-step walk, in order

The order is load-bearing, not incidental. `scripts/resolve.mjs --json` runs exactly this:

1. **Scope match, then every filter.** An unpinned scope coordinate matches anything; a pinned one
   must equal the request's value. Then: slot, channel, discipline, machine-actionability, effective
   window, `applies_when` conditions — a rule surviving to step 2 is a rule that **actually applies
   in this context**, not just one that exists.
2. **Shadow by key.** Among rules sharing a key, the highest-specificity survivor wins; an explicit
   `supersedes` edge then removes its target outright. Ties are impossible — specificity is a sum of
   four distinct powers of two, so every one of the sixteen scope combinations has a unique value.
3. **Suppress.** A surviving `effect: suppress` row removes its key from the set entirely and offers
   no replacement. This is not the same as absence (which inherits) or `status: retired` (which is
   lifecycle and stays queryable) — suppression is "a market said explicitly: not this, and nothing
   in its place."
4. **Split tracks.** `enforcement: instruct` rules compete for prompt budget. `enforcement: check`
   rules don't — they're verified against generated output instead. `both` does both. On the loaded
   IONOS data this moves 32 of 69 rules (number formatting, punctuation, hyphenation, orthography) off
   the probabilistic track entirely.
5. **Rank, compact, budget.** Modality first, then slot relevance, then channel relevance, then
   priority, then specificity, then key — see decision 1 below for why this is a *different* order
   than step 2's. Same-family rules compact into one line. Only the optional tail truncates.

## The five decisions you must not undo

**1. Two orderings, not one.** Step 2 (shadowing) sorts by specificity: "of the rules sharing a key,
which is in force here?" Step 5 (budget) sorts by modality first: "of the rules in force, which
twelve reach the model?" These are different questions and a single specificity-first sort answers
both of them wrong. The IONOS corpus has ~70 product-layer rules against ~34 German-language rules;
specificity-first ranking let product messaging exhaust a 12-line budget before it ever reached "use
the Sie form" — evicting the mandatory German form-of-address rule from every product context. The
rules most expensive to break were the first ones evicted. If you ever write a sort that touches both
concerns, it needs two comparators, not one, however tempting the deduplication looks.

**2. Filter before shadow.** A rule may only be superseded by a rule that actually applies in *this*
context. Reverse that order and a channel-scoped exception can shadow the general rule at step 2 and
then get filtered out at step 1 for being channel-specific — leaving a German email subject with no
form-of-address rule at all, silently, because nothing downstream knew to report it. `resolve.mjs`
computes `applicable` (post-filter) before it ever builds the `winners` map. Never reorder those two
blocks.

**3. The tri-state.** Every scope coordinate and both filter axes (channel, slot) carry three states,
not two: `null` with the dimension unasserted means *the source never addressed this*; `null` with the
dimension in `broadcast_asserted` means *the source explicitly said "all of them"*; a pinned value
means exactly that value. **`null` and asserted-broadcast match identically at resolution time** — a
resolver has no reason to treat them differently, because both mean "this rule doesn't narrow on this
dimension." The distinction exists for three other consumers: `explain()`, which must say "applies to
all markets (asserted)" rather than "market never considered"; validators, which ask "is this rule's
channel scope unreviewed?"; and a reviewer UI, which should prompt a human to confirm an unasserted
dimension rather than broadcast it by default. The other direction matters too: a request that leaves
a coordinate `null` means *the requester has no opinion*, so a **pinned** rule is NOT in scope for
that request — asking for brand-wide rules must never hand back one market's override.

**4. `exception_to` direction is fixed.** `from` is the exception; `to` is the general rule it
qualifies. Read every edge as "*from* is an exception to *to*." Two independent annotators, given the
same document, pointed the same German-compounding edge in opposite directions — both syntactically
valid, and nothing could tell them apart from the data alone. **An exception is never a drop.** Both
rules stay in the resolved set, with the relationship stated, because a rule shipped without its
exception is confidently wrong: case 3 of the German compounding rules defers to case 6, and a
generator that sees only case 3 hyphenates "WordPress Hosting" incorrectly. If you write anything that
walks `relations`, look for edges pointing *at* the rule you're resolving, not edges *on* it, and never
remove the target of an `exception_to` edge the way you would for `supersedes`.

**5. Obligations are never dropped by the budget.** Every `must` line ships, even when the mandatory
lines alone exceed the budget — the resolved set then reports `mandatory_exceeds_budget: true` (repo
field: `dropped_mandatory` in the envelope's `metadata.knowledge`) rather than silently picking which
brand rules to disobey. Two mechanisms make this survivable rather than merely honest: **family
compaction** (same-family rules render as one labelled line, verbatim, never paraphrased — six
hyphenation rules cost one line of twelve instead of six) and the **check track** (step 4 above —
lint-shaped rules cost zero budget because they're verified against output, not instructed into a
prompt). Measured effect of both together, on the same corpus that used to lose the Sie-form rule:
12 rules delivered / 11 mandatory dropped became 38 delivered / 0 dropped. If a budget ever needs to
shrink further, shrink `should`/`may` lines. Never touch `must`.

## Entity types, and which files hold them

| Entity | Shape | Files |
|---|---|---|
| **RULE** | One imperative instruction, scoped + filtered + ranked. ~85% of corpus row count. | `knowledge/rules/<family>.md` (prose, family-grouped), `knowledge/rules/index.yaml` (flat, resolver-facing), `design/photography/rules.md` (discipline: photography — never globbed by a text path) |
| **STATEMENT** | Named, non-instruction content: mission, taglines, brand facet groups (Benefits, RTB, Personality, Image, Content Goals, Hero Principles), approved pitches, scope declarations. Identity is `(type, key, ordinal)` — grouping by key alone loses every multi-row facet. | `knowledge/statements/<type>.md`, `knowledge/statements/index.yaml` |
| **METRIC** | A dated, quantitative brand claim with an arithmetic comparator (`>`, `>=`, `=`, `~`) — never collapse `>` to `>=`; a live-but-superseded figure is kept and flagged, not discarded. | `knowledge/metrics.yaml` |
| **EXEMPLAR** | A do/don't specimen, grouped by `pair_group` (donts then dos), with `explanation` as the teachable part and `fidelity` (`verified`/`normalised`/`unchecked`) shown, never silently upgraded. | `knowledge/exemplars/<group>.md` (`ungrouped.md` for rows with no group) |
| **CONCEPT + TERM** | Two levels: a CONCEPT carries `definition`, `do_not_translate`, `governed_by` exactly once; a TERM under it carries only what varies by naming — language, market, `preference_rank`, status. | `knowledge/terms/glossary.yaml` (both levels), `knowledge/terms/forbidden.yaml` (forbidden + deprecated, the file CI lints every other generated file against) |
| **AUDIENCE_SEGMENT / BENEFIT_LADDER / MARKET_POSITION** | The three product-side record types, rendered together per product as one dossier because that's how a product manager reads them — not as three unrelated tables. | `knowledge/products/<slug>.md`, `knowledge/products/index.yaml` |

`knowledge/vocabulary.yaml` holds the controlled vocabularies (rule family, slot, statement type,
channel) that keep `slots`/`channels`/`family` values from drifting between annotators.
`knowledge/discards.md` is the discard pile — why a passage produced no atom — and is itself a
first-class record, not a log line, because an invisible non-extraction is exactly how a caveat gets
silently lost (see decision 5's sibling case: a lost "this list is only a first overview" caveat made
six hyphenation rules ship harder than their source claimed).

## Running the resolver

```bash
node scripts/resolve.mjs --slot=<slot> --language=<lang> --market=<market> \
  --product=<product> --channel=<channel> --budget=<n> --json
```

Every argument you omit is `null` — "no opinion" — which is not the same as "matches everything you
didn't ask about" (see decision 3). Business keys only: language code, market code, product name,
segment key — never a uuid, which is v4 and changes on every fixture reload. The JSON result carries
the instruction track (`rules`/`lines`/`prompt`), the check track (`checks`), and — read this part —
**every dropped rule with its reason**, so a `must` that fell out over budget is visible without
re-deriving it by hand.

## The firewall is not total

`knowledge/UNGUARDED.md` names briefing content that reaches n8n's `/text-generate` and
`/image-generate` **without passing through any entity type in this document** — specifically,
`Product.processedBriefing/competitiveEdge/seoKeywords/valuePropositions`,
`Goal.description/promptGuidance`, and `BrandProfile.processedContext`, which are still read straight
off legacy entity getters rather than through the knowledge model. None of it carries a discipline, a
source locator, budget participation, or the design-leak scan that produces `discards.md`'s
`refused_design_content` rows. Read that file before assuming "clean discard pile" means "everything
reaching a briefing was checked" — for these fields, nothing was.

## Honest limits — say these out loud rather than assume they don't apply

- **Slot fill rate is 33–35%.** Most rules have never been slot-reviewed. Resolving *for* a slot means
  reading that slot's rules **plus** the unslotted ones (`knowledge/slots/index.yaml`'s `_unslotted`
  bucket, inside the same map a real slot key lives in) — reading only the named slot silently drops
  most of the corpus, which is the exact failure a slot-scoped resolver exists to prevent.
- **`applies_when`, `EXEMPLAR.channels`, `overrides_cldr`, and the `body_compact`/`body_verbose`
  split are retained but UNVALIDATED.** They are kept on corpus evidence from source documents the
  validation spikes never atomised into cases that exercise them — which is different from being
  proven correct in use. Treat a row that relies on one of these fields as plausible, not as verified,
  and say so if you're reporting on it.
