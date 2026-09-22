# Knowledge Hub

Brand knowledge as **one-liner atoms**, and the rules for turning them into a system prompt.

This repository is generated wholesale from the Hub and is never hand-edited — the Hub is
its only committer, and `MANIFEST.yaml` records a checksum per file so an edit is
detectable rather than merely discouraged. No generated file carries a timestamp, so an
unchanged corpus regenerates byte for byte and the diff is the change.

## What is here

| Path | What it is |
|---|---|
| `knowledge/brands.md` | brand name → partition key. Start here. |
| `knowledge/<partition key>/` | one brand. `index.md` summarises it, one file per dimension holds the atoms. |
| `skills/assembling-a-prompt/` | how to build a system prompt out of those files, and the frozen vocabulary. |
| `commands/` | the Hub's webhooks, for when it IS reachable. |

Anything else in this repository belongs to another target and is not generated here.

## The model, in one screen

Every atom is **one sentence**. It belongs to exactly one **dimension** and one
**category** inside that dimension, carries a **rank** of 0-100, and is attributed by
four flat tags: `product`, `language` (a locale code such as `de-DE`), `platform` and
`segment` (an audience-segment key). A tag holds a concrete value or the global marker
`*`, meaning *every value on this axis*. Each tag names an entry of its own dimension —
four columns, one idea.

**Brand is not a tag — it is the partition.** One directory per brand, no cross-brand
view, and no "applies to all brands" state: that state is one bad atom away from leaking
one brand's voice into another.

| Dimension | Holds | Override |
|---|---|---|
| `brand identity` | what is TRUE about the brand — the claims a writer must not contradict | — |
| `writing & tone` | HOW to write, in a form that survives translation | — |
| `product` | what a product is, why it wins, and what may not be claimed about it | — |
| `language` | grammar, orthography, terminology and locale conventions | — |
| `image guidelines` | what an image-prompt writer needs and a copywriter never sees | — |
| `target group` | who we write to, and what moves them | **overrides the others** (see the assembly skill) |
| `platforms` | per-surface practice — the only atoms that override others | **overrides the others** (see the assembly skill) |

## Assembling a prompt

Filter, rank, cap at 12 per dimension-category, order with target group and then
platforms last. The whole
rule is in `skills/assembling-a-prompt/SKILL.md`, including the part that matters most:
**this route is an approximation.** Assembly exists exactly once, in the Hub's n8n
workflow. This repository describes it for the case where the Hub cannot be reached; when
it can, call `kh/assemble` and use what it returns.
