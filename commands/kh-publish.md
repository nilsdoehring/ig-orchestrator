---
description: Publish a brand's reviewed atoms to the live tables, pruning what was retired. The run declares the dimensions it speaks for.
---

# kh publish

Publish a brand's reviewed atoms to the live tables, pruning what was retired. The run declares the dimensions it speaks for.

```
POST /webhook/kh/publish
```

```json
{
  "brand":      "<partition key>",
  "dimensions": ["language"],
  "atoms":      [ { "atom_id": "…", "dimension": "language", "category": "terminology",
                    "body": "…", "rank": 80,
                    "product": "", "language": "de-DE", "platform": "",
                    "state": "published", "source_doc": "…" } ]
}
```

The run names the dimensions it speaks for, and only published atoms travel. That is what makes a dimension whose atoms were all retired prune to empty instead of being silently skipped.

When the Hub is reachable, prefer this endpoint — it reads the live corpus and it is the
one implementation of assembly. The tree under `knowledge/` is the offline copy, current
as of the last publish.
