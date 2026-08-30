---
name: assembling-a-prompt
description: Build a brand-governed system prompt from this repository's atoms, without the Hub running. Use when writing copy or image prompts for a brand held here.
---

# Assembling a system prompt

Four operations, in this order, and nothing else. No conflict resolution, no cascade, no
weighing one atom against another — if two atoms disagree, that is a review problem for a
person and not something to resolve while writing.

## 1. Filter

Keep an atom when every one of these holds:

- it is in the brand you are writing for (`knowledge/<brand>/`), and
- its dimension and category are in your skill's **appetite**, and
- for each of `product`, `language`, `platform`: the atom's tag is **empty**, or it
  **equals** your scope value.

An empty tag applies everywhere. A scope value you did not name is **restrictive**: omit
the language and you get only what applies regardless of language, never every language.

## 2. Rank

Sort by the rank shown against each atom, highest first.

## 3. Cap

Take the top **12 per dimension-category** — not per dimension, and not overall. Twelve
terminology atoms PLUS twelve formatting atoms.

## 4. Order

Emit the dimensions in your appetite's order, except **platforms always last**, and follow
it with one sentence:

> Where the rules above conflict, the platform rules take precedence.

That sentence is the entire override mechanism.

## What not to do

Do not summarise the atoms — they are already compressed, and rewriting them loses the
qualifier that makes a rule conditional. Do not include a dimension your skill's appetite
does not name; an image director receiving claim constraints, or a copywriter receiving
photographic direction, is the failure the appetite exists to prevent.
