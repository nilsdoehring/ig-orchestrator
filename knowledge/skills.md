# Skills

Every skill the Hub publishes, with the knowledge it asks for and the model it runs on.
This is the appetite you would otherwise have to guess.

**A skill never asks for a dimension list at call time.** It declares an appetite once,
here, and the caller passes only a brand, a scope and a budget. An appetite is an explicit
INCLUDE list of `dimension/category`; `*` means a whole dimension. It is never an
exclusion — "everything except image guidelines" is written out in full, because negation
is cascade thinking and cascades drift.

## Task skills

| Skill | Appetite | Model |
|---|---|---|
| `campaign.coherence_review` | `brand identity/*`, `writing & tone/*`, `target group/*`, `product/*`, `language/*`, `platforms/*` | `gemini-3.7-flash` |
| `campaign.content_briefing` | `brand identity/*`, `writing & tone/*`, `target group/*`, `product/*`, `language/*`, `platforms/*` | `gemini-3.7-flash` |
| `campaign.intent_parse` | — | `gemini-3.7-flash` |
| `campaign.lookup_slots` | `brand identity/*`, `product/*` | `gemini-3.7-flash` |
| `campaign.module_selection` | `brand identity/*`, `product/*` | `gemini-3.7-flash` |
| `campaign.node_html` | — | `gemini-3.7-flash` |
| `campaign.storyline` | `brand identity/*`, `writing & tone/*`, `target group/*`, `product/*`, `language/*`, `platforms/*` | `gemini-3.7-flash` |
| `catalog.generate_hint` | — | `gemini-3.7-flash` |
| `catalog.icon_metadata` | `image guidelines/*` | `gemini-3.7-flash` |
| `catalog.pictogram_analysis` | `image guidelines/*` | `gemini-3.7-flash` |
| `catalog.select_hint` | — | `gemini-3.7-flash` |
| `copy.slot_text` | `brand identity/*`, `writing & tone/*`, `target group/*`, `product/*`, `language/*`, `platforms/*` | `gemini-3.7-flash` |
| `copy.variants` | `brand identity/*`, `writing & tone/*`, `target group/*`, `product/*`, `language/*`, `platforms/*` | `gemini-3.7-flash` |
| `explainer.curated_slotfill` | `brand identity/*`, `writing & tone/*`, `target group/*`, `product/*`, `language/*`, `platforms/*` | `gemini-3-flash-preview` |
| `explainer.storyline` | `brand identity/*`, `writing & tone/*`, `target group/*`, `product/*`, `language/*`, `platforms/*` | `gemini-3.7-flash` |
| `imagen` | `image guidelines/*`, `brand identity/*`, `target group/*`, `product/*` | `gemini-3-pro-image` |
| `layout.uds_plan` | `brand identity/*`, `product/*` | `gemini-3.7-flash` |
| `persona.profile` | `brand identity/*`, `target group/*` | `gemini-3.7-flash` |
| `review.website_po` | `brand identity/*`, `writing & tone/*`, `target group/*`, `product/*`, `language/*`, `platforms/*`, `design guidelines/*` | `gemini-3-flash-preview` |
| `textgen` | `brand identity/*`, `writing & tone/*`, `target group/*`, `product/*`, `language/*`, `platforms/*` | `gemini-3-flash-preview` |

## Ingest skills

One per dimension. An ingest skill PRODUCES atoms and reads none back, so its appetite is
always empty — that is not an omission.

| Skill | Appetite | Model |
|---|---|---|
| `ingest.brand_identity` | — | `gemini-3.7-flash` |
| `ingest.design_guidelines` | — | `gemini-3.1-pro-preview` |
| `ingest.image_guidelines` | — | `gemini-3.7-flash` |
| `ingest.language` | — | `gemini-3.7-flash` |
| `ingest.platforms` | — | `gemini-3.7-flash` |
| `ingest.product` | — | `gemini-3.7-flash` |
| `ingest.target_group` | — | `gemini-3.7-flash` |
| `ingest.writing_tone` | — | `gemini-3.7-flash` |

## Coverage

NOT PUBLISHED, because no appetite is declared for them: `knowledge.ingest.atoms`, `knowledge.ingest.document_type`, `knowledge.validate.metric_drift`, `knowledge.validate.rule_conflicts`. A skill with no appetite entry is skipped by the n8n publisher too — it is not a repo-only gap.
