---
description: Reimplement POST /catalog-generate's three-stage chain — catalog-select, network-only SFTP asset fetch, then image-generate — and say plainly which stage cannot run offline
argument-hint: "[--brand=NAME] [--selection-set-key=KEY] [--text-to-match=TEXT] [--prompt=TEXT] [--enrichment-mode=skip|enrich_from_keys|enrich_from_data] [--model-hint=gemini] [--prompt-only]"
allowed-tools: [Bash, Read, Glob, Grep]
---

# /catalog-generate

You are standing in for the n8n `POST /catalog-generate` endpoint. It is not one operation — it is
three, chained, and exactly one of the three has no offline path and never will:

1. **catalog-select** — pick an asset from a curated selection set.
2. **asset fetch** — retrieve that asset's bytes from an external SFTP-backed API.
3. **image-generate** — the same generation this repo's `/image-generate` reimplements.

Arguments: `$ARGUMENTS`

## The request shape

```json
{
  "brand": "<team>",
  "selection_set_key": "<catalog selection set>",
  "text_to_match": "<free text the router matches against catalog entries>",
  "prompt": "<caller's generation prompt>",
  "params": { },
  "enrichment_mode": "skip",
  "briefing": { },
  "persona": null,
  "metadata": { "model_hint": "<hint>" }
}
```

## Stage 1 — catalog-select: cannot be reproduced from this repo either

`selection_set_key` names a curated catalog of assets — an icon library, a photo set — synced by
`unima:ai:sync-library-catalogs` and served from the same asset infrastructure Stage 2 hits. This
repo carries no mirror of that catalog: it isn't in the published tree (`design/`, `knowledge/`,
`briefing/`, `prompts/` cover the knowledge and briefing surfaces this repo makes reproducible; the
asset catalog is a different system entirely). Do not invent a plausible-looking asset id or pretend
`text_to_match` was matched against something real — there is nothing local to match it against.

## Stage 2 — the SFTP asset fetch: network-only, no offline equivalent

Once an asset is selected, the real endpoint fetches its base64 bytes from an **external SFTP asset
API.** This is the one link in the chain the task briefing is explicit about, and the honest thing to
do here is exactly what it says: **the asset library is network-only and has no offline equivalent.**
Do not build a local fallback, a cached stand-in, or a stub image and call it equivalent — a fabricated
asset returned as if it were the real one is worse than an honest failure, because a caller acting on
it has no way to tell the difference.

If you have working network access and real SFTP credentials configured for `scripts/catalog-generate.mjs`,
say so and let the script attempt the real chain (see below). If you don't — which is the common case
for a cloned repo with no infrastructure access — say so plainly and stop at the boundary rather than
past it.

## Stage 3 — image-generate: the part that IS reproducible

Once an asset's bytes exist (fetched, not fabricated), Stage 3 is exactly `/image-generate`'s job:
assemble a prompt from `design/photography/rules.md` and the brand's `image_style`/`visual_style` in
`briefing/brands.json` — never from `knowledge/rules/**`, for the same reason `/image-generate`
enforces it — with the fetched asset substituted for `/image-generate`'s `reference_images`. Read
`/image-generate` for the full prompt-assembly contract; this command does not duplicate it, it feeds
it.

## `--prompt-only`: the honest default when no asset API is reachable

```bash
node scripts/catalog-generate.mjs --prompt-only --brand=<brand> --selection-set-key=<key> \
  --text-to-match=<text> --prompt=<prompt>
```

This **skips Stages 1 and 2 entirely** — no catalog lookup, no network call, no fabricated asset — and
runs only Stage 3's prompt assembly, using `text_to_match` and `prompt` as the description of what an
asset would have contributed. It prints the assembled image-generation prompt and stops. Say
explicitly, in the output, that asset selection and asset fetch were skipped rather than performed —
never let a `--prompt-only` result read as if a real catalog asset informed it, because it didn't.

This mode has the same properties that make `/image-generate --prompt-only` valuable: no key, no
network, no cost, and it is available in every environment this repo is cloned into, unlike Stages 1
and 2.

## The full chain, when you actually have network and credentials

```bash
node scripts/catalog-generate.mjs --brand=<brand> --selection-set-key=<key> \
  --text-to-match=<text> --prompt=<prompt> --model-hint=<hint>
```

This attempts all three stages for real. It needs the SFTP asset API reachable and credentialed, plus
whatever provider key Stage 3's generation needs (see `/image-generate` Step 4 — Claude cannot produce
images either way, so this still ends at a real provider call, not at Claude generating pixels). If
any stage fails, report **which stage** failed and why — "catalog-select found no match for
`text_to_match`" and "the SFTP asset API is unreachable" are different failures with different fixes,
and collapsing them into one generic error hides which one actually happened.

## The envelope

The task briefing does not pin down `/catalog-generate`'s response shape the way it pins down
`/image-generate`'s, so treat this as inferred rather than verified: the honest expectation is that
Stage 3 produces the same envelope `/image-generate` returns —

```json
{
  "status": "completed",
  "image": { "data": "<base64>", "mime_type": "image/png" },
  "provider": "<gemini|anthropic|local>",
  "model": "<model id>",
  "prompt_used": "<the final assembled prompt>",
  "metadata": { }
}
```

— since `/catalog-generate` is `/image-generate` with the selected catalog asset standing in for a
caller-supplied reference image. Flag this inference as an inference if a caller is relying on an
exact field-for-field match against the real endpoint; don't present a guess with the same confidence
as a verified fact.

## Say so when you cannot be faithful

This whole command is one long instance of that instruction, but say it again at the point of use:
if you cannot reach the asset catalog or the SFTP API, do not simulate Stage 1 or Stage 2 with
plausible-looking output. Report exactly which stage you could not reach, fall back to
`--prompt-only`, and let the caller decide whether a prompt-only result is useful to them or whether
they need to run this from an environment that actually has network access to the asset
infrastructure.
