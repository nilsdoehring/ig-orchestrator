---
description: Assemble a system prompt for a skill, inside one brand, at one scope. Returns the prompt and the atoms that produced it, and runs no model.
---

# kh assemble

Assemble a system prompt for a skill, inside one brand, at one scope. Returns the prompt and the atoms that produced it, and runs no model.

```
POST /webhook/kh/assemble
```

```json
{
  "mode":   "keys",
  "skill":  "copywriter",
  "brand":  "<partition key from knowledge/brands.md>",
  "scope":  { "product": "hosting", "language": "de-DE", "platform": "social" },
  "budget": 12
}
```

Every `scope` key is optional, and an omitted key is RESTRICTIVE: leaving out `language` asks for what applies regardless of language, never for every language. There is no dimension list in
the request — the skill declares its own appetite.

When the Hub is reachable, prefer this endpoint — it reads the live corpus and it is the
one implementation of assembly. The tree under `knowledge/` is the offline copy, current
as of the last publish.
