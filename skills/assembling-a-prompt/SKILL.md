---
name: assembling-a-prompt
description: Build a brand-governed system prompt from this repository's atoms, without the Hub running. Use when writing copy or image prompts for a brand held here.
---

# Assembling a system prompt

## Read this first: this route is an approximation

**Assembly exists exactly once, and it is not here.** It is the Hub's `kh/assemble`
workflow in n8n, which reads the live tables and returns both the prompt and the atoms
that produced it. If you can reach the Hub, call it (`commands/kh-assemble.md`) and use
what it hands back.

This file is a DESCRIPTION of that algorithm, for the case where you cannot — no network,
an editor-only agent, an offline review. Expect the two to differ, for three reasons that
are properties of the route rather than bugs in it:

- **you are applying the rule by hand**, and a model following four written steps is not a
  deterministic filter;
- **this tree is a snapshot** taken at the last publish, while the workflow reads live rows;
- **skills are not carried here.** A skill's appetite lives in the Hub's `kh_skills` table,
  so nothing in this repository can tell you which dimensions your skill is entitled to.
  You must be told, or you must decide — and deciding is exactly the caller-side
  configuration the appetite exists to abolish.

Say which route produced a prompt when you hand one over. A prompt from here is
reproducible only in the sense that the atoms are on disk.

## The appetite

An appetite is an explicit **include list** of `dimension/category` — `*` allowed for a
whole dimension. Never an exclusion: *"everything except image guidelines"* is written out
in full, because negation is cascade thinking. The vocabulary to write one against is in
`reference/vocabulary.md`.

Two real shapes, as worked examples and not as a registry:

- an **imagen prompt writer** takes `image guidelines/*` and nothing else;
- a **copywriter** takes every dimension except image guidelines, written out one by one.

## The four operations, in this order, and nothing else

No conflict resolution, no cascade, no weighing one atom against another. If two atoms
disagree, that is a review problem for a person and not something to resolve while writing.

### 1. Filter

Keep an atom when every one of these holds:

- it is in the brand you are writing for — one directory under `knowledge/`, resolved
  through `knowledge/brands.md`. Never read a second brand's directory, for any reason;
- its dimension and category are in your appetite;
- for each of `product`, `language`, `platform`, `segment`: the atom's tag is `*`, or it
  **equals** your scope value. `segment` is an audience-segment KEY, never its display name.

On the shelves a tag is printed only where it narrows, so **an axis with no tag shown is
`*`** and matches everything.

A scope value you did not name is **restrictive**: omit the language and you get only what
applies regardless of language, never every language. That is the safe direction — a call
with no platform must not inherit social's rules, and a call with no segment must not
inherit another audience's.

### 2. Rank

Sort by the number in front of each atom, highest first. The shelves are already printed in
that order, ties included.

### 3. Cap

Take the top **12 per dimension-category** — not per dimension, and not overall. Twelve
terminology atoms PLUS twelve formatting atoms.

**Cap after filtering.** The first 12 lines of a category are not the answer: they are the
top 12 before your scope removed anything. Nothing here pre-computes them, deliberately,
because the pre-computed set would be wrong for every caller who names a scope.

**Global atoms get no separate slice.** An atom tagged `*` competes in the same
12-per-dimension-category cap as a specifically-tagged one, ranked together. This
paragraph previously described the opposite — a dedicated per-dimension slice added on
top — which the assembler has never implemented, and it was printed into this file for
every reader to follow. A published instruction to apply a cap that does not exist is
worse than no instruction: it produces prompts nobody can reproduce, and it is exactly
the drift this target is supposed to be immune to, since the whole point of shipping the
RULES rather than the ANSWERS is that the rules can be checked against one Code node.

The consequence is real and worth knowing rather than hiding: a brand's
best-documented product can crowd its own brand-wide rules out of a category. If that
becomes a problem the fix belongs in the assembler, not here.

### 4. Order

Emit the dimensions in your appetite's order, except that the two OVERRIDING dimensions go
last, in this order: **target group, then platforms.** Follow the whole prompt with one
sentence naming whichever of the two you actually emitted:

> Where the rules above conflict, the target-group rules take precedence over the base
> dimensions, and the platform rules take precedence over everything including the
> target-group rules. So a target-group rule that contradicts a product rule is the one to
> follow, and a platform rule that contradicts a target-group rule is the one to follow.

That sentence is the entire override mechanism. There is no resolver, no weighting and no
cascade — the prompt is allowed to contain the contradiction, and this tells the model how
to settle it. **The audience wins over the base dimensions** because it is who the copy is
for; **the surface wins over the audience** because a platform rule is bound to where the
copy appears.

A `platform` or `segment` tag on an atom in some OTHER dimension is an ordinary filter
carrying no precedence at all.

## What not to do

**Do not paraphrase an atom.** Reproduce it as written. They are already compressed, and a
rewrite loses the qualifier that makes a rule conditional — a proof point carries its own
guardrail inside its sentence (*"99.9% uptime guaranteed — safe to claim; never claim
100%"*), and a summary is exactly what drops the second half.

**Do not resolve a contradiction.** Two atoms that disagree are a review finding. Carry
both, or carry the one your filter kept; do not invent the merge.

**Do not include a dimension your appetite does not name.** An image director receiving
claim constraints, or a copywriter receiving photographic direction, is the failure the
appetite exists to prevent.
