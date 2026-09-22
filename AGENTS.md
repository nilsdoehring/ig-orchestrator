# AGENTS.md

Instructions for any coding agent working in this repository — Claude Code, Cursor, Codex, Gemini
CLI, Copilot, or a human reading over one's shoulder. Nothing below depends on a feature only one
of them has.

## What this repository is

The **IONOS Knowledge Hub**, published as a git tree: every brand's reviewed writing and
image-direction knowledge, as one-sentence **atoms**, plus the rules for turning them into a system
prompt. It is a read-only snapshot of a live database, regenerated wholesale on every publish.

It is **not** a copy of the Unima editor, the render pipeline, or any product code. It carries
knowledge and the documentation of how that knowledge is used, and nothing else.

## Start here: `knowledge/brands.md`

Resolve the brand name you were given to its **partition key** in
[`knowledge/brands.md`](knowledge/brands.md), then read only that directory.

```
knowledge/brands.md                      Brand name -> partition key. The index.
knowledge/<partition key>/index.md       One brand's summary: atom counts per dimension/category.
knowledge/<partition key>/<dimension>.md One shelf of atoms, already ranked.
```

The partition key is the brand's **team id** (a UUID), and it is also the literal string the Hub's
API expects as `brand`, so the offline route and the API name a brand identically. It is not the
brand's name, because names carry no unique index: two teams can be renamed to the same name, and
from that moment they would share one directory — one brand's voice assembling into another's
prompts. A brand listed in `brands.md` with no directory has nothing published yet. That is a real
state, not a missing file.

**Never read a second brand's directory for any reason.** There is no cross-brand view and no
"applies to all brands" state, by design.

## The model, in one screen

An **atom** is one sentence. It belongs to exactly one **dimension** and one **category** inside
that dimension, carries a **rank** of 0-100, and is attributed by four flat tags.

The seven dimensions, one file each under a brand's directory:

| Dimension | File | Holds |
|---|---|---|
| brand identity | `brand-identity.md` | what is TRUE about the brand — claims a writer must not contradict |
| writing & tone | `writing-tone.md` | HOW to write, in a form that survives translation |
| product | `product.md` | what a product is, why it wins, what may not be claimed about it |
| language | `language.md` | grammar, orthography, terminology, locale conventions |
| image guidelines | `image-guidelines.md` | what an image-prompt writer needs and a copywriter never sees |
| target group | `target-group.md` | who we write to, and what moves them — **overrides the base dimensions** |
| platforms | `platforms.md` | per-surface practice — **overrides everything, target group included** |

The four **attribution axes**, one tag each per atom: `product`, `language` (a locale code such as
`de-DE`), `platform`, and `segment` (an audience-segment key, never its display name). A tag holds
either a concrete value or the global marker `*`, meaning *every value on this axis*. On the
published shelves a tag is printed only where it narrows, so **an axis with no tag shown is `*`**.

Brand is **not** a tag. Brand is the partition — the directory.

A scope value you did not name is **restrictive**, not permissive: asking without a `language` asks
for what applies regardless of language, never for every language. That is the safe direction — a
call with no platform must not inherit social's rules, and a call with no segment must not inherit
another audience's.

## Assembly is not in this repository

Turning atoms into a prompt is four operations — filter, rank, cap at 12 per dimension-category,
order with the two overriding dimensions last. **That algorithm exists exactly once, and it is not
here.** It is the Hub's `kh/assemble` workflow in n8n, which reads the live tables and returns both
the prompt and the atoms that produced it.

- **If you can reach the Hub, call it.** See [`skills/endpoints/SKILL.md`](skills/endpoints/SKILL.md),
  which documents all six endpoints. Use what `assemble` returns.
- **If you cannot**, [`skills/assemble/SKILL.md`](skills/assemble/SKILL.md) describes the algorithm
  so you can approximate it by hand. Read it there; it is not restated in this file, and a second
  copy of it anywhere is a bug.

Doing it by hand **is an approximation**, for three reasons that are properties of the route and
not defects in it: a model following written steps is not a deterministic filter; this tree is a
snapshot while the workflow reads live rows; and a skill's *appetite* — the explicit
`dimension/category` include-list it is entitled to — lives in the Hub's `kh_skills` table and is
not carried here.

**Say which route produced a prompt when you hand one over.**

Do not write a resolver, a cascade, a weighting scheme, or a second assembler in this repository or
anywhere else. If two atoms contradict each other, that is a review finding for a person — carry
both, or carry the one your filter kept, and say so. Do not invent the merge.

## The Hub's API

Six webhooks, all `POST`, all at `https://n8nwh.ionos.org/webhook`. The full OpenAPI spec is
[`contracts/knowledge-hub-api.yaml`](contracts/knowledge-hub-api.yaml); the three an agent calls
most have a short usage note under `commands/`.

| Endpoint | What it does |
|---|---|
| `/kh/assemble` | Returns a brand-governed system prompt plus the atoms that produced it. Runs no model. |
| `/kh/ingest` | Digests a document into **draft** atoms through its dimension's expert skill. Nothing publishes itself. |
| `/kh/publish` | Publishes a brand's reviewed atoms and prunes what was retired, for the dimensions the call names. |
| `/kh/skill-upsert` | Registers or updates a skill and its appetite. |
| `/kh/lookup` | Reads a brand's vocabulary for an axis — products, languages, platforms, target groups. |
| `/kh/lookup-publish` | Publishes the current vocabulary for one axis. |

There is **no `generate` endpoint**. The Hub hands you a prompt; you make your own model call with it.

## Rules

1. **Reproduce an atom as written.** Do not paraphrase or summarise it. Atoms are already
   compressed, and a rewrite drops the qualifier that makes a rule conditional — a proof point
   carries its own guardrail inside its sentence (*"99.9% uptime guaranteed — safe to claim; never
   claim 100%"*), and a summary is exactly what loses the second half.
2. **Never invent a product name, a locale, a platform or a segment key.** Use what the brand's
   shelves carry, or ask `/kh/lookup`. If the value you need is not there, say so.
3. **Do not use a dimension your task has no appetite for.** An image director receiving claim
   constraints, or a copywriter receiving photographic direction, is the failure the appetite exists
   to prevent.
4. **Do not cross brands.** One partition, one directory, no fallback.
5. **Do not hand-edit anything under `knowledge/`, `skills/` or `commands/`** — see below.

## This repository is generated

`knowledge/`, `skills/`, `commands/`, plus `README.md`, `MANIFEST.yaml`,
`.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, are written by Unima's
`unima:kh:publish-agent-repo`. The publish **prunes**: anything under those three directories that a
run did not write is deleted. A file you place there by hand does not survive the next publish.

`MANIFEST.yaml` records a sha256 per generated path, and `scripts/verify-manifest.mjs` re-hashes
them in CI, so a hand-edit is detectable rather than merely discouraged.

**The plugin version is the corpus**, and it lives in `.claude-plugin/plugin.json` as
`2.<published atoms>.<fingerprint>`. It is not a build number: an unchanged corpus republishes to the
same version and produces no diff, and any edited atom changes it — which is the whole update
mechanism, because Claude Code skips a plugin whose version matches the one already installed.
(There used to be a root `VERSION` file claiming to do this. Nothing wrote it: it was a leftover from
the retired generator, still holding that generator's last bundle id, and it has been deleted.)

There is one writable home per kind of change:

- **An atom is wrong, missing or misattributed** → fix it in the Hub (upload → digest → review →
  publish), then re-publish. Nothing is authored in this tree.
- **The assembly rule is wrong** → fix the n8n workflow. It is the only implementation.
- **The generated prose around the atoms is wrong** (a shelf header, a command note, the assembly
  skill) → fix the generator, `src/Unima/Infrastructure/Command/PublishHubAgentRepoCommand.php` in
  the Unima repository, then re-publish.

Hand-authored and safe to edit here: **this file**, `CLAUDE.md`, `contracts/`, `scripts/`, `lib/`,
`.github/`, `.claude/`, `.gitignore`.

## Layout

```
AGENTS.md CLAUDE.md README.md MANIFEST.yaml .gitignore
.claude-plugin/plugin.json          generated — plugin manifest
knowledge/brands.md                 generated — the index; start here
knowledge/<partition key>/*.md      generated — one directory per brand, one file per dimension
knowledge/<partition key>/entries.md generated — the legal product/language/platform/segment values
knowledge/skills.md                 generated — every skill, its appetite and its model
.claude-plugin/marketplace.json     generated — what makes the repo installable
skills/assemble/                    generated — how to build a prompt offline, and the vocabulary
skills/lookup/                      generated — how to read a brand's entry vocabulary
skills/endpoints/                   generated — the Hub's six webhooks, for when it IS reachable
contracts/*.yaml                    hand-kept — OpenAPI specs for the Hub and sibling services
scripts/selftest.mjs                hand-kept — proves lib/yaml.mjs parses the generator's grammar
scripts/verify-manifest.mjs         hand-kept — proves no generated path was hand-edited
lib/yaml.mjs                        hand-kept — the only dependency either script has
.github/workflows/validate.yml      hand-kept — CI
.claude/                            hand-kept — project-scope only; NOT shipped to plugin installers
```

This repository has **zero npm dependencies** and is meant to stay that way. Both scripts are plain
Node ESM and import nothing outside `node:` and `lib/yaml.mjs`.

## Installing it as a plugin

This tree is also a Claude Code plugin (`.claude-plugin/plugin.json`, name `knowledge-hub`),
published from the personal marketplace at `github.com/nilsdoehring/ig-orchestrator`. Installing the
plugin gives you `skills/` and `commands/`; it does **not** give you `.claude/`, which is
project-scope and visible only to someone who clones this repository directly.

Nothing above requires the plugin. A plain `git clone` and this file are enough.
