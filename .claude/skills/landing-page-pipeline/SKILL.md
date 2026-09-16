---
name: landing-page-pipeline
description: Load before designing or building a landing-page (or similar content) generation pipeline on top of a Knowledge Hub — the fixed 12-stage build order, the one Hub call shape every skill uses, and which stage gets a human vs. an automated checkpoint. Process only, portable to any system; not specific to this repo's own resolver.
---

# Landing-page generation pipeline

A build spec, not an essay: the fixed, ordered sequence of decisions a landing-page generator
runs on top of a Knowledge Hub. Apply it directly — build stage N before stage N+1, wire each
skill to the read scope in its row, place a human exactly at the two rows marked `Human`. Nothing
below names a class, controller or file from any specific codebase; it is the process, the skill
roles, and the one call shape they all use, so it transfers to a different Hub implementation
without translation.

## The one call shape every skill uses

Whichever stage is running, a skill reaches the Hub with exactly this request shape and nothing
else:

```json
{
  "skill": "<skill key>",
  "brand": "<partition id — never a name>",
  "scope": { "product": null, "language": null, "platform": null, "segment": null },
  "budget": 12,
  "appetite": null
}
```

- **brand** is the hard partition. No cross-brand fallback, no shared default.
- **scope** keys are sent even when `null` — a `null` key is restrictive (matches only knowledge
  tagged "applies to everything on this axis"), never permissive. Omitting a key is not the same
  as widening it.
- **budget** caps returned facts per dimension-category, not per call.
- **appetite**, left `null`, uses the skill's own declared read scope (see the table below);
  passing a list overrides it for that one call only, and `[]` is a real instruction meaning "see
  nothing."

Response, every time:

```json
{ "system": "<assembled prompt text>", "used": [ { "fact": "…", "dimension": "…", "category": "…" } ] }
```

`used` is not optional decoration — it is what makes a surprising prompt traceable back to a
specific fact instead of shrugged off.

## The 12 stages, in build/run order

| # | Stage | Trigger | Skill | Checkpoint |
|---|---|---|---|---|
| 1 | Brief intake | Human submits brand, product, target group, language, goal; optionally reference images and free text. | none | — |
| 2 | Storyline | Brief is complete. | `campaign.storyline` | — |
| 3 | Storyline review | Storyline skill returns. | none | **Human — 1st** |
| 4 | Module selection | Storyline is approved. | `campaign.module_selection` | — |
| 5 | Component selection | A selected module has a fixed-variant slot. | `campaign.lookup_slots` | — |
| 6 | Page composition | Modules are final. | none (mechanical) | — |
| 7 | Content briefing | Page structure + open slots are known. | `campaign.content_briefing` | — |
| 8 | Coherence review | Copy + image briefs exist. | `campaign.coherence_review` | **Automated** |
| 9 | Reference / key visual | A persona is defined for this run. | `imagen` | — |
| 10 | Image fill | Per remaining image slot, per its fill mode. | `imagen` (generate) or `catalog.select_hint` (select) | — |
| 11 | Render + distribute | Every slot is filled. | none (mechanical) | — |
| 12 | Final review | Page(s) are rendered. | none | **Human — 2nd** |

Read the checkpoint column before wiring anything else downstream of it:

- **Row 3 is deliberately the cheapest place to catch a wrong narrative.** Nothing downstream of
  it has cost anything yet — no image, no per-section copy.
- **Row 12 is deliberately the last row.** Nothing earlier substitutes for judging the actual
  rendered result as a whole.
- **Row 8 is `Automated`, not human.** Place any self-consistency check you build between your
  most expensive text stage and your most expensive generation stage — checking any earlier has
  nothing substantial to check yet; any later has already let the expensive step run on drifted
  content.

## Per-skill reference: what it decides, what it may read

| Skill | Decides | Hub appetite (reads) |
|---|---|---|
| `campaign.storyline` | Narrative arc, core message, emotional hook, ranked USPs, per-section guidance. | brand identity, writing & tone, target group, product, language, platform — broadest appetite in the pipeline. |
| `campaign.module_selection` | Which page sections to include and in what order, given the approved storyline. | brand identity, product — no writing/tone knowledge; a structure decision, not a phrasing one. |
| `campaign.lookup_slots` | Which single pre-built component variant best fits a slot offering a fixed set of options. | brand identity, product — same narrow appetite as module selection, same reason. |
| `campaign.content_briefing` | Final copy for every text slot, plus a generation brief for every image slot, in one pass. | brand identity, writing & tone, target group, product, language, platform — full text appetite. |
| `campaign.coherence_review` | Whether copy + image briefs still agree with the approved storyline; patches drifted sections in place. | its own already-generated content, not fresh Hub knowledge — a self-consistency check, not a new fact source. |
| `imagen` | Generates a new image (key visual, or any slot marked generate). | image guidelines, brand identity, target group, product — never writing/tone; excludes product claims explicitly. |
| `catalog.select_hint` | Picks the closest-matching existing catalogue asset for a slot marked select, by visual concept. | image guidelines only — deliberately excludes product claims: an art director is told how to shoot, never what to claim. |

## The read/write boundary — generation never crosses it

No stage above uploads a document, proposes a fact, or publishes anything. Writing to the Hub is a
distinct loop, gated by a human at every step:

```
upload(document, declared_scope)
  -> digest(document) => draft_facts[]
  -> human_review(draft_facts) => approved_facts[]
  -> publish(approved_facts)
```

- A generation run must have **no code path** into the write loop — if it did, one run's
  unreviewed guess could become the next run's fact.
- A reviewer editing knowledge mid-flight must never be able to break a run already in progress —
  the two loops share storage, not a call stack.

## Build checklist for an equivalent pipeline elsewhere

1. **One skill, one decision, one declared appetite.** A skill that both plans structure and
   writes final copy will eventually need the appetite of both, which defeats scoping in the
   first place.
2. **Decide the narrative once (stage 2).** Every later stage, and every language/platform
   variant of the same run, reuses it rather than re-deriving its own.
3. **Order human checkpoints by cost of a miss.** Cheapest decision first, full rendered result
   last. Nothing earlier substitutes for the last one.
4. **Put the one automated self-consistency check between the most expensive text stage and the
   most expensive generation stage** — not before, not after.
5. **Split "generate new" from "select existing" into two skills with two different appetites.**
   Do not ask one generation call to also behave like a search.
6. **Keep the write loop unreachable from every generation code path**, full stop.

## Related

- `commands/kh-assemble.md`, `commands/kh-ingest.md`, `commands/kh-publish.md` — this repo's own
  copies of three of the Hub's webhooks, for when the live Hub cannot be reached.
- `contracts/knowledge-hub-api.yaml` — the full OpenAPI spec for all six (plus one addendum)
  webhooks these skills call through.
- `skills/assembling-a-prompt/` — the Hub-generated skill for the assembly algorithm itself
  (filter/rank/cap/order) that backs the one call shape above; this skill is about the pipeline
  that calls it, not the assembly algorithm.
