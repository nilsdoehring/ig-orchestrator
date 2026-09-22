---
description: Digest a document into draft atoms through its dimension's expert skill. Atoms land as drafts; nothing publishes itself.
---

# kh ingest

Digest a document into draft atoms through its dimension's expert skill. Atoms land as drafts; nothing publishes itself.

```
POST /webhook/kh/ingest
```

```json
{
  "brand":       "<partition key>",
  "dimension":   "language",
  "document":    "…the text…",
  "scope":       { "language": "de-DE" },
  "instruction": "optional per-document steer"
}
```

The `scope` is the DECLARED attribution. The expert skill may narrow it and may never widen it, which is why it travels in the request rather than being inferred from the text.

When the Hub is reachable, prefer this endpoint — it reads the live corpus and it is the
one implementation of assembly. The tree under `knowledge/` is the offline copy, current
as of the last publish.
