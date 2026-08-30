# Knowledge Hub

Brand knowledge as **one-liner atoms**, and the skills that consume them.

This repository is generated wholesale from the Hub and is never hand-edited — the Hub is
its only committer, and `MANIFEST.yaml` records a checksum per file so an edit is
detectable rather than merely discouraged.

## How the knowledge is organised

Every atom belongs to exactly one **dimension** and one **category** inside it, and carries
up to three flat tags: `product`, `language` (a locale code) and `platform`. An empty tag
means *applies to all*. Brand is not a tag — it is the **partition**, one directory per
brand under `knowledge/`, and there is no cross-brand view.

| Dimension | Holds |
|---|---|
| brand identity | what is TRUE about the brand |
| writing & tone | HOW to write, in a form that survives translation |
| target group | who we write to |
| product | what a product is, why it wins, what may not be claimed |
| language | grammar, orthography, terminology, locale conventions |
| platforms | per-surface practice — and the only atoms that OVERRIDE others |
| image guidelines | what an image-prompt writer needs and a copywriter never sees |

## Assembling a prompt

See `skills/assembling-a-prompt/SKILL.md`. In short: pick the skill, read only the
dimensions its appetite names, keep atoms whose tags match your scope or are empty, take
the top 12 per dimension-category by rank, and emit platforms last.

Brands in this bundle: Arsys, Fasthosts, IONOS, STRATO, Strefa, UDAG, home.pl, world4you.
