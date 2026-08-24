// Zero-dependency calls to the same model providers n8n's text/image generation workflows call,
// using global `fetch` (Node >= 20 ships it — no `node-fetch`, no SDK).
//
// WHY THIS FILE REPRODUCES BUGS INSTEAD OF FIXING THEM. This is the --parity path: the thing that
// lets someone check "does my prompt behave the same through the real provider as it does through a
// model reading it directly". That check is only meaningful if a divergence found here is a real
// divergence from the endpoint, not an artefact of this file being a nicer-behaved reimplementation.
// So every quirk below that looks like a bug — the dead openai branch, the naive chain-of-thought
// strip, images silently dropped on two of three providers — is called out in a comment and kept
// exactly as `integrations/n8n/workflows/text-generation-router.json` and its three
// `sub-*-text-generation.json` sub-workflows implement it. If you are fixing a real bug, fix the n8n
// workflow first and port the fix here — never the other way around.
//
// ROUTING is a SUBSTRING match on `metadata.model_hint`, case-sensitive except where the router
// itself is (it is not — `includes()` on the raw string, both cases checked separately for Qwen and
// Gemma). See `route()` below for the exact, ordered condition list from the router's "Extract &
// Route" Code node.

/** Extract & Route's own fallback when `metadata.model_hint` is absent. */
export const GEMINI_DEFAULT_MODEL = 'gemini-3-flash-preview'

/** oMLX API's own fallback when the caller's model hint is falsy. */
const LOCAL_DEFAULT_MODEL = 'Qwen3.5-35B-A3B-4bit'

const LOCAL_DEFAULT_BASE_URL = 'http://localhost:8000'
const LOCAL_DEFAULT_TOKEN = 'omlx-local'

/** Raised only for "this script cannot proceed without a credential" — never for a provider's own
 * failure response, which is returned as a normal `{status:'failed', ...}` envelope instead. Callers
 * catch this specifically so a missing key prints one clean line instead of a stack trace. */
export class ProviderError extends Error {}

/**
 * `metadata.model_hint || GEMINI_DEFAULT_MODEL` — the exact fallback "Extract & Route" applies before
 * anything else happens. Call this once and pass the result everywhere a model hint is needed, so the
 * value routed and the value sent to the provider are guaranteed to be the same string.
 */
export function resolveModelHint(modelHint) {
  return modelHint || GEMINI_DEFAULT_MODEL
}

/**
 * The router's provider decision, verbatim — including the order. Mirrors
 * `text-generation-router.json`'s "Extract & Route" Code node:
 *
 *     let provider = 'gemini';
 *     if (modelHint.includes('claude') || modelHint.includes('anthropic')) provider = 'anthropic';
 *     else if (modelHint.includes('gpt') || modelHint.includes('openai')) provider = 'openai';
 *     else if (modelHint.includes('Qwen') || modelHint.includes('qwen') || modelHint.includes('Gemma')
 *              || modelHint.includes('gemma') || modelHint.includes('local') || modelHint.includes('omlx'))
 *       provider = 'local';
 *
 * `gemini` is the default outcome, not a matched branch — a hint that matches nothing above (e.g.
 * `"mistral-large"`) routes to Gemini, exactly as the real router would.
 *
 * @param {string|null|undefined} modelHint
 * @returns {'anthropic'|'openai'|'local'|'gemini'}
 */
export function route(modelHint) {
  const hint = resolveModelHint(modelHint)

  if (hint.includes('claude') || hint.includes('anthropic')) return 'anthropic'
  if (hint.includes('gpt') || hint.includes('openai')) return 'openai'
  if (
    hint.includes('Qwen') ||
    hint.includes('qwen') ||
    hint.includes('Gemma') ||
    hint.includes('gemma') ||
    hint.includes('local') ||
    hint.includes('omlx')
  ) {
    return 'local'
  }
  return 'gemini'
}

/**
 * Mirrors `sub-gemini-text-generation.json`: `generateContent`, `responseMimeType: 'application/json'`
 * (Gemini's only structured-output guarantee among the three providers), `temperature: 0.7`.
 *
 * Images are folded in as `inlineData` parts AFTER the text part — `[{ text }].concat(images.map(...))`
 * in the sub-workflow's `jsonBody`. Gemini is the only provider that receives them at all; see
 * `callAnthropic` and `callLocal` for the silent-drop-plus-warning the other two do instead.
 *
 * @param {{systemPrompt?: string, userPrompt?: string, model?: string, images?: Array<{mimeType: string, data: string}>, env?: NodeJS.ProcessEnv}} args
 */
export async function callGemini({ systemPrompt = '', userPrompt = '', model, images = [], env = process.env }) {
  const apiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new ProviderError('GEMINI_API_KEY (or GOOGLE_API_KEY) is not set. Export one of them and retry.')
  }

  const resolvedModel = resolveModelHint(model)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(resolvedModel)}:generateContent?key=${encodeURIComponent(apiKey)}`

  const parts = [{ text: userPrompt }, ...images.map((im) => ({ inlineData: { mimeType: im.mimeType, data: im.data } }))]

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
  }

  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const response = await res.json().catch(() => ({}))

  if (!res.ok) {
    return { status: 'failed', error: { message: response.error?.message || `Gemini HTTP ${res.status}` } }
  }

  // From here down, mirrors "Parse Response" in sub-gemini-text-generation.json exactly.
  const textPart = response.candidates?.[0]?.content?.parts?.[0]?.text
  if (!textPart) {
    return { status: 'failed', error: { message: 'No text in Gemini response' } }
  }

  try {
    const parsed = JSON.parse(textPart)
    return {
      status: 'completed',
      result: parsed,
      metadata: {
        model_used: response.modelVersion ?? null,
        tokens_used: response.usageMetadata?.totalTokenCount ?? null,
      },
    }
  } catch (e) {
    return {
      status: 'failed',
      error: { message: `Failed to parse JSON from Gemini response: ${e.message}`, raw_text: textPart.slice(0, 500) },
    }
  }
}

/**
 * Mirrors `sub-anthropic-text-generation.json`: `POST /v1/messages`, `max_tokens: 8192`, `system` is a
 * plain string and `messages[0].content` is a plain string — NOT the content-block array shape some
 * Anthropic examples use. There is deliberately no `response_format`/structured-output flag: Anthropic
 * has none, so the sub-workflow asks for JSON by convention in the prompt and bare-`JSON.parse`s the
 * reply. A malformed reply is therefore an EXPECTED failure mode on this path and not a bug in this file.
 *
 * Images are accepted in the signature only to be dropped, with a warning — the real sub-workflow's
 * `jsonBody` never references `$json.images` at all, so they are silently absent there. Warning here
 * where the endpoint is silent is a deliberate divergence in the direction of not hiding data loss.
 */
export async function callAnthropic({ systemPrompt = '', userPrompt = '', model, images = [], env = process.env }) {
  const apiKey = env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new ProviderError('ANTHROPIC_API_KEY is not set. Export it and retry.')
  }

  if (images.length > 0) {
    console.error(
      `warning: dropping ${images.length} image(s) before calling Anthropic — the real Anthropic sub-workflow ` +
        'never references them either. Only Gemini receives images.',
    )
  }

  const body = {
    model: resolveModelHint(model),
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  })
  const response = await res.json().catch(() => ({}))

  if (!res.ok) {
    return { status: 'failed', error: { message: response.error?.message || `Anthropic HTTP ${res.status}` } }
  }

  const textPart = response.content?.[0]?.text
  if (!textPart) {
    return { status: 'failed', error: { message: 'No text in Anthropic response' } }
  }

  try {
    // Bare JSON.parse — no structured-output flag exists on this provider. See docblock above.
    const parsed = JSON.parse(textPart)
    return {
      status: 'completed',
      result: parsed,
      metadata: {
        model_used: response.model ?? null,
        tokens_used: response.usage?.output_tokens ?? null,
      },
    }
  } catch (e) {
    return {
      status: 'failed',
      error: { message: `Failed to parse JSON from Anthropic response: ${e.message}`, raw_text: textPart.slice(0, 500) },
    }
  }
}

/**
 * Mirrors `sub-omlx-text-generation.json`: an OpenAI-compatible `/v1/chat/completions` call against a
 * local endpoint, `response_format: {type: 'json_object'}`, bearer auth.
 *
 * Base URL and token come from `LOCAL_BASE_URL` / `LOCAL_API_TOKEN`, defaulting to what the n8n
 * container reaches oMLX at (`host.docker.internal:8000`, bearer `omlx-local`) translated to what a
 * plain `git clone` on the same machine reaches instead (`localhost:8000`) — same server, different
 * network path, so the defaults differ but the contract does not.
 *
 * Images are dropped with a warning, same reasoning as `callAnthropic`.
 */
export async function callLocal({ systemPrompt = '', userPrompt = '', model, images = [], env = process.env }) {
  const baseUrl = env.LOCAL_BASE_URL || LOCAL_DEFAULT_BASE_URL
  const token = env.LOCAL_API_TOKEN || LOCAL_DEFAULT_TOKEN

  if (images.length > 0) {
    console.error(
      `warning: dropping ${images.length} image(s) before calling the local model — the real oMLX sub-workflow ` +
        'never references them either. Only Gemini receives images.',
    )
  }

  const body = {
    model: model || LOCAL_DEFAULT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt || '' },
      { role: 'user', content: userPrompt || '' },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  }

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const response = await res.json().catch(() => ({}))

  if (!res.ok) {
    return { status: 'failed', error: { message: response.error?.message || `Local model HTTP ${res.status}` } }
  }

  const textContent = response.choices?.[0]?.message?.content
  if (!textContent) {
    return { status: 'failed', error: { message: 'No text in oMLX response' } }
  }

  // Qwen 3.5 emits a thinking block before the actual JSON. The real "Parse Response" Code node does
  // NOT do a balanced-brace scan for the outermost JSON value — it takes the LAST '{' or '[' anywhere
  // in the string, full stop, which can land inside a nested object if the payload itself nests one.
  // Reproduced exactly, deliberate bug-compatibility: turning this into a real scanner would make this
  // file agree with the model's intent instead of with what the endpoint actually returns, which
  // defeats the entire purpose of a --parity path.
  let jsonStr = textContent.trim()
  try {
    JSON.parse(jsonStr)
  } catch {
    const lastBrace = jsonStr.lastIndexOf('{')
    const lastBracket = jsonStr.lastIndexOf('[')
    const start = Math.max(lastBrace, lastBracket)
    if (start > 0) jsonStr = jsonStr.slice(start)
  }

  try {
    const parsed = JSON.parse(jsonStr)
    return {
      status: 'completed',
      result: parsed,
      metadata: {
        model_used: response.model ?? null,
        tokens_used: response.usage?.total_tokens ?? null,
      },
    }
  } catch (e) {
    return {
      status: 'failed',
      error: { message: `Failed to parse JSON from oMLX response: ${e.message}`, raw_text: textContent.slice(0, 500) },
    }
  }
}

/**
 * Mirrors the "Provider Not Available" Code node verbatim. `gpt`/`openai` in `model_hint` routes here
 * in the real router too, and this branch has NEVER called anything — there is no
 * `sub-openai-text-generation.json`, only three sub-workflows for gemini/anthropic/local. This is not
 * a stub for future work; reproducing it is the point, so a caller that accidentally routes to openai
 * sees the same failure locally that it would see against the real endpoint.
 */
export async function callOpenAi() {
  return {
    status: 'failed',
    error: { message: 'Provider not available: openai text generation sub-workflow not yet configured.' },
  }
}

/**
 * Mirrors the "Gemini Image API" node in `image-generation-single-v2.json`: `generateContent` with
 * `responseModalities: ['TEXT', 'IMAGE']` and `imageConfig.aspectRatio` — a different call shape from
 * `callGemini` above (no `system_instruction`, no `responseMimeType`, and the response is scanned for
 * an `inlineData` part rather than a `text` part). The model defaults to `gemini-3.1-flash-image`,
 * matching `metadata.model_hint || 'gemini-3.1-flash-image'` in that node's URL expression.
 *
 * `parts` is the caller's responsibility (text + any `inlineData` reference images, in whatever order
 * the caller built them) — this function only makes the call and parses the reply, the same division
 * of labour `callGemini` uses.
 *
 * @param {{parts: Array<object>, aspectRatio?: string, model?: string, env?: NodeJS.ProcessEnv}} args
 */
export async function callGeminiImage({ parts, aspectRatio = '1:1', model, env = process.env }) {
  const apiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new ProviderError('GEMINI_API_KEY (or GOOGLE_API_KEY) is not set. Export one of them and retry.')
  }

  const resolvedModel = model || 'gemini-3.1-flash-image'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(resolvedModel)}:generateContent?key=${encodeURIComponent(apiKey)}`

  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio } },
  }

  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const response = await res.json().catch(() => ({}))

  if (!res.ok) {
    return { status: 'failed', error: { code: 'HTTP_ERROR', message: response.error?.message || `Gemini HTTP ${res.status}` } }
  }

  // Mirrors "Format Response": scan the candidate's parts for the first one carrying inlineData.
  const responseParts = response.candidates?.[0]?.content?.parts ?? []
  const imagePart = responseParts.find((p) => p.inlineData)

  if (!imagePart) {
    return { status: 'failed', error: { code: 'NO_IMAGE', message: 'Gemini returned no image data' } }
  }

  return {
    status: 'completed',
    image: { data: imagePart.inlineData.data, mime_type: imagePart.inlineData.mimeType || 'image/png' },
    provider: 'google-gemini',
    model: resolvedModel,
  }
}
