---
name: endpoints
description: The Knowledge Hub's six HTTP endpoints — assemble, ingest, publish, skill-upsert, lookup, lookup-publish — with their request shapes. Use when the Hub is reachable and you want live knowledge instead of this repository's offline snapshot.
---

# The Hub's endpoints

Six endpoints, all `POST /webhook/kh/<name>` except `lookup`, which is a `GET`. When you
can reach them, prefer them: they read the live corpus, and `assemble` is the ONE
implementation of prompt assembly. Everything under `knowledge/` here is a snapshot taken
at the last publish.

| Endpoint | What it does |
|---|---|
| `assemble` | Build a system prompt for a skill, one brand, one scope. Returns the prompt AND the atoms that produced it. Runs no model. |
| `ingest` | Digest a document into DRAFT atoms through that dimension's expert skill. Nothing publishes itself. |
| `publish` | Push a brand's reviewed atoms to the live tables, pruning what was retired. |
| `skill-upsert` | Write a skill's body, kind, appetite and model. Upsert-only — there is no prune. |
| `lookup` | Read the entry vocabulary for an axis (`GET`). The offline copy is each brand's `entries.md`. |
| `lookup-publish` | Replace a brand's vocabulary for one axis. Full replacement: anything absent is pruned. |

## assemble

```json
{
  "mode":   "keys",
  "skill":  "textgen",
  "brand":  "<partition key from knowledge/brands.md>",
  "scope":  { "product": "hosting", "language": "de-DE", "platform": "Social Media" },
  "budget": 12
}
```

Every `scope` key is optional, and an omitted key is **restrictive**: leaving out
`language` asks for what applies regardless of language, never for every language. There
is no dimension list in the request — the skill declares its own appetite, which you can
read offline in `knowledge/skills.md`.

Legal `scope` values are per brand and are listed in `knowledge/<partition>/entries.md`.
A value that is not in that list matches nothing and fails silently.

## ingest

```json
{
  "brand":       "<partition key>",
  "dimension":   "language",
  "document":    "…the text…",
  "scope":       { "language": "de-DE" },
  "instruction": "optional per-document steer"
}
```

`scope` is the DECLARED attribution. The expert skill may narrow it and may never widen
it, which is why it travels in the request rather than being inferred from the text.

## publish

```json
{
  "brand":      "<partition key>",
  "dimensions": ["language"],
  "atoms":      [ { "atom_id": "…", "dimension": "language", "category": "terminology",
                    "body": "…", "rank": 80,
                    "product": "*", "language": "de-DE", "platform": "*", "segment": "*",
                    "state": "published", "source_doc": "…" } ]
}
```

The run names the dimensions it speaks for, and only published atoms travel — that is what
makes a dimension whose atoms were all retired prune to empty instead of being silently
skipped. An atom with a BLANK tag on any of the four axes is refused, not defaulted.

## skill-upsert · lookup · lookup-publish

`skill-upsert` takes `{ skill, kind, brand, prompt, appetite, model }`. `appetite` is an
explicit include list of `dimension/category`, never an exclusion — "everything except
image guidelines" is written out in full.

`lookup` is a `GET` and answers "what values exist on this axis for this brand". Its
offline equivalent is `knowledge/<partition>/entries.md`, and `skills/lookup` explains it.

`lookup-publish` replaces one brand's vocabulary for one axis in full.
