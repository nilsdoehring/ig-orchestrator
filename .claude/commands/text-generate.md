---
description: Reimplement the n8n POST /text-generate endpoint locally — resolve knowledge, splice the briefing, generate, return the same envelope
argument-hint: "[--slot=headline] [--language=de-DE] [--market=DE] [--product=NAME] [--channel=email] [--mode=skip|enrich_from_keys|enrich_from_data] [--prompt-key=KEY] [--budget=12] [--parity] \"what to write\""
allowed-tools: [Bash, Read, Glob, Grep]
---

# /text-generate

You are standing in for the n8n `POST /text-generate` endpoint. Same request keys in, same
`{status, result, metadata}` envelope out — so a diff against the real endpoint is meaningful rather
than approximate.

Arguments: `$ARGUMENTS`

## Why this is faithful and not a re-imagining

The n8n router, in an enrichment mode, reads six Data Tables. **All six are in this repo:**
`briefing/brands.json`, `briefing/products.json`, `briefing/target_groups.json`,
`briefing/goals.json`, `briefing/languages.json`, and `prompts/*.md`. They are mirrors of the same
rows the router reads, generated from the same database in the same publish. So the enrichment you do
here is the enrichment the endpoint does — not an approximation of it.

What you add that the endpoint does not have: **knowledge resolution.** The endpoint receives a
pre-flattened briefing. You have the rule cascade, so you can resolve the rules that actually bind
this slot in this market and inject those instead of a whole brand book. That is the point of the hub.

## Step 1 — resolve the context

Read the arguments. Anything unspecified is `null`, which means "no opinion" and is NOT the same as
"all" — an unpinned coordinate matches every rule, a pinned one must match exactly.

```bash
node scripts/resolve.mjs --slot=<slot> --language=<lang> --market=<market> \
  --product=<product> --channel=<channel> --budget=<budget> --json
```

That returns the instruction track, the check track, the line count, and **every dropped rule with
its reason**. Read the drops. If a `must` was dropped over budget, say so before generating — that is
a data problem a human has to resolve, not something to quietly work around.

## Step 2 — assemble the prompt exactly as the router does

Branch on `--mode`, default `skip`:

**`skip`** — pure pass-through. `system_prompt` and `user_prompt` go to the model untouched. No
Data Table reads, no prompt-key lookup. This is what most callers use.

**`enrich_from_keys`** — the router's own sequence, in this order:

1. If `--prompt-key` is given and `prompts/<key>.md` exists, that file **REPLACES** the system prompt
   entirely. It does not append. PHP depends on this: in delegated mode it deliberately sends an
   empty system prompt because n8n is expected to supply it. Appending instead of replacing diverges
   silently and the output still looks plausible.
2. Prepend the brand block to the system prompt as Markdown `##` sections, from
   `briefing/brands.json` filtered by team: context, tone, visual style, writing rules, glossary.
3. Append to the **user** prompt, as `##` sections: the product (matched by name), the target group
   (by name), the goal (by name), the language (by code) from their respective mirrors.
4. Append `briefing.custom_prompt` last, as `## Custom Instructions`.

**`enrich_from_data`** — same Markdown-section splicing, but every value comes from flat keys the
caller supplied rather than from a mirror lookup. Only the prompt-key lookup still happens.

Then inject the resolved knowledge. Put the instruction track in the **system** prompt under
`## Rules you must follow`, using the exact block `scripts/resolve.mjs` prints — it is byte-identical
to what the PHP resolver produces, and matching it means the local and remote paths differ in the
model call and nothing else.

## Step 3 — generate

**Default: generate it yourself.** You are the model. Produce JSON matching whatever shape the prompt
asks for. No API key, no network, no cost. Obey the resolved rules — all of them, and read the
`must` lines twice.

**`--parity`: call the real provider.** `node scripts/text-generate.mjs` with the assembled prompts,
which routes exactly as the n8n router does (substring match on the model hint: `claude`/`anthropic`
→ Anthropic, `gpt`/`openai` → **a dead branch that returns "Provider Not Available", faithfully
reproduced because the endpoint really does that**, `qwen`/`gemma`/`local`/`omlx` → the local
endpoint, everything else → Gemini). Needs `GEMINI_API_KEY` or `ANTHROPIC_API_KEY`. Use this to check
whether a prompt behaves the same through the real provider as it does through you.

Two provider quirks that are contract, not bugs, and are reproduced deliberately:

- Gemini enforces JSON at the API level (`responseMimeType`). Anthropic has **no** structured-output
  flag — it is asked for JSON by convention and the response is `JSON.parse`d, so malformed output is
  an expected failure mode there and not on Gemini.
- `images` are consumed by Gemini **only**. Anthropic and the local model ignore them entirely. If
  you were handed images and the model hint is not Gemini, they are dropped — the local path
  **warns** where the endpoint is silent, because a reimplementation that hides a known data loss is
  worse than the endpoint it replaces.

## Step 4 — check the output before returning it

```bash
node scripts/check.mjs --slot=<slot> --language=<lang> --market=<market> --text-file=<file>
```

The check track is rules verified against output rather than instructed into a prompt — orthography,
punctuation, number formatting. Verifying them is exact where instructing them is probabilistic, and
they cost no prompt budget. If a check fails, fix the text and re-check. Do not return failing text
with a note; the whole reason the track exists is that this is mechanically decidable.

Also lint against the forbidden terms:

```bash
node scripts/check.mjs --forbidden --text-file=<file>
```

## Step 5 — return the envelope

```json
{
  "status": "completed",
  "result": { },
  "metadata": {
    "model_used": "self|<provider model id>",
    "tokens_used": null,
    "knowledge": {
      "bundle": "<contents of VERSION>",
      "rules_delivered": 0,
      "checks_run": 0,
      "dropped_mandatory": [],
      "budget": 12,
      "needs_retuning": false
    }
  }
}
```

On failure use the endpoint's own shape: `{"status": "failed", "error": {"message": "…"}}`.

The `metadata.knowledge` block is an addition, and it is the honest half of the envelope: it says
which bundle answered, how many rules actually reached the model, and — the question owners really
ask — **which of their mandatory rules did not**.

## Say so when you cannot be faithful

If a mirror file is missing, a prompt key does not resolve, or `--parity` is asked for without a key,
report exactly which input was unavailable and what you did instead. A silent substitution here is
indistinguishable from a working endpoint, which is the failure mode that makes a reimplementation
worse than nothing.
