# ig-orchestrator

Claude Code plugin for the IONOS Group's public-facing brand, localization, and product
knowledge. It carries what each brand claims, how it writes, who it writes to and what
it may not say — as **one-liner atoms** — plus the skills that turn that into finished
work: a storyline, copy, or a review of a page. Anything.

This repository is GENERATED. The Knowledge Hub regenerates it wholesale on every
publish and is its only committer; `MANIFEST.yaml` records a checksum per file so a hand
edit is detectable rather than merely discouraged. No generated file carries a
timestamp, so an unchanged corpus regenerates byte for byte and the diff is the change.

## Installation

**Option A: via marketplace (recommended for teams)**

```
/plugin marketplace add nilsdoehring/ig-orchestrator
/plugin install knowledge-hub@ig-orchestrator
```

Installation scopes:

- Default (`user`): available in all your projects (`~/.claude/settings.json`)
- `--scope project`: shared with the team via version control (`.claude/settings.json`)
- `--scope local`: this machine only (`.claude/settings.local.json`)

For team-wide adoption use `--scope project`, so every collaborator gets the plugin
automatically.

**Option B: direct install from GitHub**

```
/plugin install knowledge-hub@nilsdoehring/ig-orchestrator
```

**Updating:**

```
/plugin update knowledge-hub@ig-orchestrator
```

The plugin's version is the corpus: `2.<published atoms>.<fingerprint>`. It changes when
the knowledge changes, which is what makes an update worth installing.

## Local development & testing

```
git clone https://github.com/nilsdoehring/ig-orchestrator
cd ig-orchestrator
claude --plugin-dir .
```

Check that the skills below appear and that one of them loads a brand's knowledge.
`/reload-plugins` picks up changes without restarting.

**Do not hand-edit `skills/` or `knowledge/` in a clone.** Both are overwritten by the
next publish, and `MANIFEST.yaml` will report the edit in the meantime. A change to a
skill's body or to an atom belongs in the Hub, which is where the next regeneration
reads from.

## Skills

### `copywriter`

Write a piece of text in a named brand's voice from a plain brief — an ad, a
headline, a landing-page section, a product description, an email, a social
post — using that brand's stored tone, writing rules, glossary and audience
knowledge, and return it as finished prose, ready to paste.

**Activates when** you ask it to write, rewrite, shorten or retone marketing
or product copy for a brand.

**Carries** the Hub's `textgen` skill verbatim, in `skills/copywriter/` ·
**reads** `brand identity/*`, `writing & tone/*`, `target group/*`,
`product/*`, `language/*`, `platforms/*`.

### `storyline-creator`

Turn a product, audience and campaign goal into the storyline for a landing
page — narrative arc, key message, emotional hook, conversion intent, a
ranked USP focus and a purpose, tone and headline angle per section —
grounded in a named brand's stored knowledge and returned as JSON.

**Activates when** you ask it to plan the narrative, messaging framework or
section-by-section direction for a campaign or landing page, before any copy
is written.

**Carries** the Hub's `campaign.storyline` skill verbatim, in
`skills/storyline-creator/` · **reads** `brand identity/*`, `writing &
tone/*`, `target group/*`, `product/*`, `language/*`, `platforms/*`.

### `website-po-review`

Review a website draft, landing page, staging URL, screenshot, Figma frame or
marketing copy as a senior product owner — spelling, consistency,
brand-standard conformance, clarity, UX, desktop-vs-mobile parity and
conversion — against a named brand's stored knowledge, and return
prioritised blocker/major/minor findings with a concrete fix for each.

**Activates when** you ask it to review, check, QA or sign off a page before
go-live.

**Carries** the Hub's `review.website_po` skill verbatim, in
`skills/website-po-review/` · **reads** `brand identity/*`, `writing &
tone/*`, `target group/*`, `product/*`, `language/*`, `platforms/*`.

### `assemble`

Build a brand-governed system prompt out of `knowledge/` by hand — filter, rank, cap at
12 per dimension-category, order. Needed only for a Hub skill that is NOT one of the
ones above; `knowledge/skills.md` lists every skill the Hub runs.

**Activates when** you ask for the prompt behind a Hub skill that ships here as data
rather than as a plugin skill.

**Carries** an APPROXIMATION of the Hub's `kh/assemble` workflow, and says so on its
first screen.

## Supported brands

One directory per brand, keyed by partition key — never by name, which can collide. Atom
counts are as of this publish.

| Brand | Partition key | Published knowledge |
|---|---|---|
| Arsys | `83b881f9-2d3b-4df3-962b-e5c0213acb0e` | 9 atoms |
| Fasthosts | `8aa9afcc-f2bf-4388-9066-482448eaa32d` | 14 atoms |
| IONOS | `0d7e8bcb-999b-4f96-8a31-3cfb42959e22` | 1013 atoms |
| SEO | `be49fc21-15b8-4b1a-a436-8bb07051e58b` | *none published yet* |
| STRATO | `4e947002-cc58-4265-affb-15d213f39b2e` | 403 atoms |
| Strefa | `7f29907c-2b09-4034-a78e-c920230b1599` | 11 atoms |
| UDAG | `2c8dbf9f-db4f-41ef-a62c-beac1c8f6384` | 10 atoms |
| home.pl | `4af13eab-54c2-4444-86ed-9d0ffbe2317b` | 9 atoms |
| world4you | `b3b16375-5373-4fb1-be97-ed0f20a86339` | 10 atoms |

A brand with nothing published has no directory. That is a real state, not a missing
file, and a skill reading it is required to say so rather than improvise.

For the same brands' design system — UDS components, design tokens and Figma-to-code —
see [`uds-orchestrator`](https://github.com/IONOS-Web-Design-System/uds-orchestrator). It
covers how a page is built; this plugin covers what it should say.

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
platforms last. The whole rule is in `skills/assemble/SKILL.md`, including the part that
matters most: **this route is an approximation.** Assembly exists exactly once, in the
Hub's n8n workflow. This repository describes it for the case where the Hub cannot be
reached; when it can, call `kh/assemble` and use what it returns.

## What is here

| Path | What it is |
|---|---|
| `knowledge/brands.md` | brand name → partition key. Start here. |
| `knowledge/<partition key>/` | one brand. `index.md` summarises it, one file per dimension holds the atoms. |
| `knowledge/<partition key>/entries.md` | the legal product / language / platform / segment values for that brand. |
| `knowledge/<partition key>/reference/` | checkable standards a brand ships as a document rather than as atoms. Not every brand has one. |
| `knowledge/skills.md` | every skill the Hub runs, the knowledge it asks for, and the model it runs on. |
| `skills/assemble/` | how to build a system prompt out of those files, and the frozen vocabulary. |
| `skills/lookup/` | how to read a brand's entry vocabulary. |
| `skills/endpoints/` | the Hub's six webhooks, for when it IS reachable. |
| `skills/<name>/` | a Hub skill promoted to a plugin skill that does the work. |

Anything else in this repository belongs to another target and is not generated here.
