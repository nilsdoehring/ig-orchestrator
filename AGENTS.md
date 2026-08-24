# AGENTS.md

## What this is

A generated snapshot of one Unima team's writing-knowledge corpus, plus zero-dependency Node tooling
to resolve and check it **offline** — no network, no Unima login, no n8n. It exists so an agent
working on copy for this brand can get the same rule cascade and the same n8n prompt-assembly logic
Unima runs internally, from a plain `git clone`.

## What this is not

- Not a copy of the editor, the database, or the render pipeline. It carries writing knowledge, plus
  **photography guidance** (`design/photography/`) and one **quarantine** (`design/statements/`). See
  `design/README.md` for what is refused and where it actually lives.
- **Not a place to resolve a design question**, with one narrow and deliberate exception.
  `design/statements/` holds migrated brand prose that DOES contain colour values, font names and
  measurements. It is there because a live consumer — the image-generation workflow — reads it and has
  nothing else to read, so deleting it would break that workflow. It is quarantined outside
  `knowledge/` so nothing writing-side can glob it, and it is for **image-prompt assembly only**.
  Never answer a design question from it, and never use it for copy: it is unreviewed migrated prose,
  not maintained design guidance. The real owners are named in `design/README.md`.
- Everything else design-shaped — logo construction, spacing, type scale, component names — is refused
  at export and is not here.
- Not editable. See "This is generated" below.

## Tree

```
AGENTS.md CLAUDE.md README.md MANIFEST.yaml VERSION
.claude/{settings.json,commands/*.md,skills/*/SKILL.md}
knowledge/rules/<family>.md          knowledge/rules/index.yaml
knowledge/slots/index.yaml           knowledge/statements/<type>.md
knowledge/terms/glossary.yaml        knowledge/terms/forbidden.yaml
knowledge/exemplars/<group>.md       knowledge/metrics.yaml
knowledge/products/<slug>.md         knowledge/products/index.yaml
knowledge/vocabulary.yaml            knowledge/discards.md   knowledge/UNGUARDED.md
knowledge/_conformance/cases.json
design/README.md                     design/photography/rules.md
design/statements/index.yaml         design/statements/<type>.md      <- quarantine, image prompts only
briefing/{brands,products,target_groups,goals,languages}.json  briefing/README.md
prompts/<key>.md                     prompts/index.yaml
lib/*.mjs  scripts/*.mjs  .github/workflows/validate.yml
```

`knowledge/rules/*.md` is the same rows as `knowledge/rules/index.yaml`, rendered for a human instead
of a script — read the Markdown to understand a rule, read the YAML to resolve one. `prompts/` and
`briefing/*.json` are byte mirrors of the Data Tables the real n8n router reads, so enrichment done
here matches enrichment done there.

## Five things to do before you write anything

**1. Resolve before writing.** Never paste a rule family into a prompt from memory or from a partial
read of `knowledge/rules/`. The cascade (scope → filter → shadow → budget) decides what actually
applies, and it is not something to eyeball:

```bash
node scripts/resolve.mjs --slot=<slot> --language=<lang> --market=<market> \
  --product=<product> --channel=<channel> --budget=12 --json
```

**2. Obey `must` absolutely.** A `must` line is never dropped for budget, by design — if the result
says `mandatory_exceeds_budget: true`, that is a data problem the corpus owner has to retune, not
something to quietly resolve yourself by skipping one. Stop and report it instead of picking.

**3. Check the output before you hand it back.** Some rules are verified against the finished text,
not instructed into the prompt — they cost no budget and are checked exactly, not obeyed
probabilistically:

```bash
node scripts/check.mjs --slot=<slot> --language=<lang> --market=<market> --text-file=<file>
node scripts/check.mjs --forbidden --text-file=<file>
```

**4. Never invent a product name.** Use only what is in `knowledge/products/index.yaml` or
`briefing/products.json`. If the product you need is not there, say so — do not paraphrase your way
to something close.

**5. Never answer a design question from this repo.** Colour, typography, spacing, logo rules and
component names are refused at export on purpose. Read `design/README.md` (German — the owners are
German-speaking) for who actually owns each of those, and `knowledge/UNGUARDED.md` for the known,
named cases where design content still reached a prompt anyway. The colour-name stoplist is a floor,
not a guarantee — it does not catch everything.

Full resolution mechanics — scope matching, shadowing, the budget split, family compaction — are in
`.claude/skills/knowledge-model/SKILL.md`. How to write or judge a rule that survives the cascade is
in `.claude/skills/writing-rules/SKILL.md`.

## This is generated — do not hand-edit

Every file here is produced by Unima's `unima:knowledge:publish-agent-repo` and listed with its
sha256 in `MANIFEST.yaml`. CI (`.github/workflows/validate.yml`) recomputes those hashes and fails the
build on any mismatch, so a hand-edit does not survive the next publish and does not survive review
either — it is not a style preference, it is enforced.

There is exactly one writable home for each kind of change:

- **A knowledge row is wrong or missing** (a rule, a term, a statement, a product) → fix it in Unima,
  where the corpus is authored, then re-run the publish command.
- **The tooling itself is wrong** (`lib/`, `scripts/`, `.claude/commands/`, `.claude/skills/`) → fix
  it in Unima's `integrations/agent-repo/template/`, the source this whole tree is copied from, then
  re-run the publish command.

`VERSION` is a content hash, not a build number — an unchanged corpus re-publishes to the same
`VERSION` and produces no new commit. If you changed nothing here and `VERSION` changed, something
upstream changed; if you changed something here and `VERSION` did not, your edit did not survive.

## Before you trust `lib/resolve.mjs`

It is a JS port of Unima's PHP resolver, proven against `knowledge/_conformance/cases.json` by:

```bash
node scripts/conformance.mjs
```

PHP is normative. A divergence here is a bug in this file until proven otherwise — never edit a case
to make the script pass.
