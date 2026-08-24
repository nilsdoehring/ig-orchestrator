---
description: Reimplement POST /image-generate's prompt assembly locally from design/photography/rules.md and brand visual style — generation itself needs a key
argument-hint: "[--brand=NAME] [--prompt=TEXT] [--aspect-ratio=1:1] [--style=NAME] [--quality=high] [--skill=NAME] [--reference-images=PATH,...] [--model-hint=gemini|claude|qwen] [--prompt-only] [--parity]"
allowed-tools: [Bash, Read, Glob, Grep]
---

# /image-generate

You are standing in for the n8n `POST /image-generate` endpoint. Be honest with yourself about the
split before you start: **prompt assembly is fully faithful and is the valuable part of this
command.** Generation is not, and cannot be — read Step 3 before you assume otherwise.

Arguments: `$ARGUMENTS`

## The one rule you must not break

Read **only** `design/photography/rules.md` and the `image_style` / `visual_style` fields of
`briefing/brands.json`. **Never** read anything under `knowledge/rules/` — not by name, not through
a glob, not "just to check."

This is not caution for its own sake. `knowledge/rules/` holds writing rules — tone, hyphenation,
form of address, product messaging. Photography rules exist in the same underlying table
(`discipline` is a column, not a separate schema) but the export deliberately writes them to
`design/photography/rules.md` instead, precisely so a glob like `knowledge/rules/*.md` can never pick
them up and precisely so a writing-side rule can never leak into an image prompt either. If you read
`knowledge/rules/**` here, you have personally recreated the bug this directory split exists to
prevent — a copywriting instruction ("use the Sie-form") ending up inside an *image* generation
request, or a photography instruction silently absent from every text prompt that should never have
seen it anyway.

`design/photography/rules.md` is also, by design, **the only design discipline this repo carries.**
Colour values, type, spacing, logo construction and component names are refused at export entirely —
see `design/README.md` for why — so they are not available to read even if you go looking. If a
caller's ask needs a hex value or a font name, that request cannot be satisfied from this repo at
all; say so rather than inventing one.

## Step 1 — read the photography rules

```bash
cat design/photography/rules.md
```

Prose, grouped by family, one `###` heading per rule key. Each block carries modality
(`MUST`/`SHOULD`/`MAY`), the instruction, and — unlike the writing-side prompt injection — the
rationale, caveats, exhaustiveness, scope and slot/channel restrictions in full. Nothing here is
budget-truncated the way `/resolve`'s output is; this file is the complete authored surface for
image-side rules, not a resolved slice of it.

If the file says "No published photography rules for this team," that is a real, complete answer —
not a broken export. Proceed with brand style alone and say so in the assembled prompt's provenance,
not silently.

## Step 2 — read the brand's visual identity

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('briefing/brands.json','utf8')).find(b => b.team === '<brand>'))"
```

`briefing/brands.json` is keyed by `team` and mirrors the same n8n Data Table `/text-generate` reads
for its brand block — but for image work you want exactly two of its columns: `image_style` and
`visual_style`. Splice them into the prompt the way the endpoint's own enrichment step would: as
plain descriptive text feeding `params.image_base_prompt`, not as a separate rules block — photography
rules and brand visual style are both prose inputs to one generation prompt, not two competing
instruction sets.

If no row matches the requested brand, say so — do not fall back to another team's row. A brand's
`image_style` is exactly the kind of unreleased positioning `BriefingMirrorWriter` refuses to leak
across teams by falling back to an unscoped query, and an image command has no more license to do
that than the text path does.

## Step 3 — assemble the request exactly

```json
{
  "prompt": "<caller's ask, unchanged>",
  "params": {
    "aspect_ratio": "<--aspect-ratio>",
    "style": "<--style>",
    "quality": "<--quality>",
    "image_base_prompt": "<photography rules + brand image_style/visual_style, spliced as prose>",
    "skill": "<--skill>",
    "reference_images": ["<--reference-images, if any>"]
  },
  "briefing": { },
  "persona": null,
  "reference_images_data": [],
  "enrichment_mode": "skip",
  "preserve_reference_dimensions": false,
  "metadata": { "model_hint": "<--model-hint>" }
}
```

This is the assembled request — printing it, faithfully, is what `--prompt-only` does and it is a
mode with **no dependency at all**: no key, no network, no cost. It is genuinely the most useful mode
of this command, because it is the only one that answers "what will the model actually be told" with
zero risk and zero spend.

```bash
node scripts/image-generate.mjs --prompt-only [same flags]
```

## Step 4 — generation is where the honesty ends

**Claude cannot produce images.** There is no local, no-key path for the generation half of this
command the way there is for `/text-generate`'s "you are the model" step — a language model has
nothing to substitute for pixels. Say this plainly rather than returning a placeholder image or a
description dressed up as a result.

The only way to actually generate is to call the real provider:

```bash
node scripts/image-generate.mjs [same flags]
```

This needs a provider key (`GEMINI_API_KEY` typically — Gemini is the image-capable default;
`ANTHROPIC_API_KEY` routes through the same substring match `/text-generate` uses on
`metadata.model_hint`: `claude`/`anthropic` → Anthropic, `gpt`/`openai` → the same dead branch that
returns "Provider Not Available", `qwen`/`gemma`/`local`/`omlx` → the local endpoint, everything else
→ Gemini). Without a key, the command has one honest thing left to do: assemble and print the prompt,
which is exactly what `--prompt-only` already did — don't repeat the work, point back at it.

## Step 5 — the envelope

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

On failure: `{"status": "failed", "error": {"message": "…"}}` — including when the failure is simply
"no key configured." That is a real failure state of the real endpoint too, not a gap you need to
paper over.

## Say so when you cannot be faithful

If `design/photography/rules.md` is missing entirely (not "empty," which is a valid and reportable
state, but literally absent from the tree), that is a broken export, not a green light to invent
photographic direction from general knowledge. If the requested brand has no row in
`briefing/brands.json`, or `image_style`/`visual_style` on that row is null, report exactly that and
proceed on photography rules alone. A prompt that quietly substitutes invented style guidance for
missing brand data is indistinguishable from one that used the real thing, and that is worse than
refusing.
