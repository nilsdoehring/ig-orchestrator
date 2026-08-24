# Image Generation API — `enrich_from_keys` Mode

**Endpoint**: `POST /webhook/brand-official-image-generate` (locally: `POST http://localhost:5678/webhook/image-generate`)
**Auth**: Header `ai-website-builder: <API_KEY>` on the enterprise instance. The local-dev workflow
export has `authentication: none`; the in-cluster PHP caller uses `Authorization: Bearer <key>`.
**Content-Type**: `application/json`

This document covers the `enrichment_mode: "enrich_from_keys"` path only. The full contract —
including the fields this endpoint accepts and then ignores — is in `image-generation-api.yaml`.

---

## How It Works

1. You provide a base image `prompt` plus lookup keys in `briefing.*` (brand, product, target_group, goal)
2. The workflow calls the shared **`Resolve Briefing Context`** sub-workflow (`W43MTmDsamhA7AsQ`),
   pinning `discipline: "photography"`. That sub-workflow loads products, target groups and goals
   from their n8n Data Tables (all filtered by `briefing.brand`) and resolves the brand's own copy
   — image style, visual style — from the composed knowledge corpus.
3. It reconstructs a nested context object and hands back a bundle
4. Gemini Text rewrites your prompt into a detailed, brand-aware image generation prompt (~200 words).
   That rewriting call is hard-coded to `gemini-3-flash-preview` and is **not** affected by
   `metadata.model_hint`.
5. Gemini Image generates the final image from the enriched prompt, using the model named in
   `metadata.model_hint`
6. The response includes the enriched `prompt_used` so you can see what was sent to the image model

**Changed since this document was first written**: steps 2-3 used to be five chained flat Data Table
loads (`brands`, `languages`, `products`, `target_groups`, `goals`) copy-pasted into this router.
The `brands` and `languages` tables were retired with M2b-3; their content is now composed per
request from the knowledge corpus, so it tracks published knowledge without a re-export. The
remaining three tables are unchanged.

If the sub-workflow is mis-wired or stale, the router **throws** (`resolve-briefing-context: bundle
missing`) rather than quietly generating an image with no brand context.

---

## Simple Request

For AI Taskforce "landing page":
- `prompt` is the user prompt (by human or AI)
- `aspect_ratio`: 1:1, 1:4, 1:8, 2:3, 3:2, 3:4, 4:1, 4:3, 4:5, 5:4, 8:1, 9:16, 16:9, 21:9

Keep the other fields as-is.

```json
{
  "prompt": "A product hero shot for the landing page",
  "params": {
    "aspect_ratio": "16:9"
  },
  "enrichment_mode": "enrich_from_keys",
  "briefing": {
    "brand": "IONOS",
    "target_group": "KMU-Inhaber",
    "goal": "Conversion"
  },
  "metadata": {
    "model_hint": "gemini-3.1-flash-image"
  }
}
```

### `image_base_prompt` was removed from this example, and here is why

Earlier versions of this document told you to put the technical image prompt (the one from Figma)
into `params.image_base_prompt`, alongside `params.style` and `params.quality`. **No node in
`image-generation-single-v2.json` reads any of those three.** PHP still forwards them, so they
round-trip through the request looking authoritative and change nothing about the output.

Put the technical direction in `prompt` instead — it is the only text that reaches the model.

---

## Simple Request with persona

```json
{
  "prompt": "A product hero shot for the landing page",
  "params": {
    "aspect_ratio": "16:9"
  },
  "persona": {
    "description": "35-year-old female entrepreneur, casual business attire, confident smile",
    "vertical": "technology",
    "reference_image_data": "<base64-encoded-image>",
    "reference_image_mime": "image/png"
  },
  "enrichment_mode": "enrich_from_keys",
  "briefing": {
    "brand": "IONOS",
    "product": "Cloud Server",
    "target_group": "KMU-Inhaber",
    "goal": "Brand Awareness"
  },
  "metadata": {
    "campaign_id": "abc-123",
    "model_hint": "gemini-3.1-flash-image"
  }
}
```

The persona `description` is prefixed onto the enhanced prompt, and `reference_image_data` goes in
as the **first** `inlineData` part. Only base64 is read — there is no URL form.

---

## Reference images

If you need reference images, send them **top level** as `reference_images_data`, not as URLs in
`params.reference_images`:

```json
{
  "reference_images_data": [
    { "mime_type": "image/png", "data": "<base64>" }
  ]
}
```

Gemini `inlineData` needs bytes, and an n8n Code node has neither a filesystem nor a fetch helper,
so the encoding has to happen before the call. PHP callers can keep passing
`params.reference_images` — `ExternalImageGeneratorAdapter` resolves URLs, absolute paths and
root-relative paths and emits `reference_images_data` for you. Direct HTTP callers get no such
help: a URL in `params.reference_images` is silently ignored.

---

## The model

`metadata.model_hint` is interpolated **directly** into the Gemini image URL, defaulting to
`gemini-3.1-flash-image`. A typo surfaces as a Gemini 404, not as a validation error.

A hint containing `flux`, `local`, `omlx` or `mflux` routes the whole request to the local MFLUX
provider instead, which answers with `provider: "local-omlx"` and `model: "flux2-klein-4b"`.

**`params.gemini_image_model` no longer exists.** It was removed on 2026-08-23. It had been the only
key the workflow's Gemini URL trusted, while production always sent `metadata.model_hint` — so every
production image was silently generated by the workflow's literal fallback rather than the
configured model. Sending it now does nothing at all.

---

## Response

For AI Taskforce "landing page":
- good practice: persist `prompt_used` with the image
- `metadata` is passed through from the request

```json
{
  "status": "completed",
  "image": {
    "data": "<base64-encoded-image>",
    "mime_type": "image/png"
  },
  "provider": "google-gemini",
  "model": "gemini-3.1-flash-image",
  "prompt_used": "A sweeping, low-angle photograph of a modern data center corridor...",
  "metadata": {
    "campaign_id": "abc-123"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"completed"` on success, `"failed"` on error |
| `image.data` | string | Base64-encoded image (typically 500KB–1.5MB) |
| `image.mime_type` | string | `"image/png"`, `"image/jpeg"`, or `"image/webp"` |
| `provider` | string | `"google-gemini"` or `"local-omlx"` |
| `model` | string | **Echo** of the requested `model_hint` — not read back from the provider |
| `prompt_used` | string | The enriched prompt that was actually sent to the image model |
| `metadata` | object | Passthrough from request |

On failure the body is `{"status": "failed", "error": {"code": "NO_IMAGE", "message": "..."},
"metadata": {...}}`. `NO_IMAGE` is the only code this workflow emits — it means the provider
answered but the answer contained no image. A provider HTTP error or the 120s timeout aborts the
n8n execution instead, so the caller sees an n8n-level error rather than this envelope.

---

## Failure modes that do not look like failures

- **An unmatched `briefing` key does not error.** A `product` with no Data Table row puts the raw
  key string into the prompt (`"Product: Cloud Server"`) instead of the resolved description.
- **A missing `briefing.brand` skips the entire brand branch** — no image style, no product, no
  goal, no target audience — and generates anyway.
- **An unrecognised `enrichment_mode` takes the skip branch.** The routing test is
  `startsWith("enrich")`, so a typo means no enrichment at all, silently.
- **An unknown `params.skill` yields an empty skill prompt** and falls through to the generic
  creative-director path. No skill prompt is published today; see `ImageParams.skill` in
  `image-generation-api.yaml`.
