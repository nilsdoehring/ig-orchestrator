#!/usr/bin/env node
// Local stand-in for n8n's `POST /image-generate` — the deterministic half of it.
//
// The real `image-generation-single-v2.json` workflow is two model calls: a text model FIRST writes
// an elaborate photographic prompt from the briefing context, and only THEN is that written prompt
// sent to Gemini's image model. This script deliberately does not reproduce the first call — an
// LLM-authored prompt is not something a script can assemble deterministically, and turning this
// script into a second orchestrator of two API calls would make it exactly as hard to run offline as
// the endpoint it stands in for. What it reproduces is the DETERMINISTIC assembly the real workflow
// also does before that first call: photography rules, the brand's image style, a persona prefix, and
// reference images placed as `inlineData` parts in the same order the real "Build Enriched Payload"
// node uses. Then it calls Gemini's image model directly on that assembled prompt.
//
// `--prompt-only` needs no key and makes no network call — print the assembled prompt, exit 0. That
// is the mode to reach for when the question is "what would be sent", which is most of them.
//
//   node scripts/image-generate.mjs --request-file=request.json --prompt-only
//   node scripts/image-generate.mjs --request-file=request.json --out=hero.png
//
// NEVER writing rules into this prompt is structural, not a filter: this file only ever reads a
// brand's `image_style` field, never `writing_rules` — see `design/photography/rules.md`'s own
// header for why that discipline split exists.

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { stripProvenanceHeader } from '../lib/enrich.mjs'
import { callGeminiImage, ProviderError } from '../lib/providers.mjs'

function fail(message) {
  console.error(`image-generate: ${message}`)
  process.exit(1)
}

function parseArgs(argv) {
  const opts = { requestFile: null, promptOnly: false, repoRoot: '.', out: null }

  for (const arg of argv) {
    if (arg === '--prompt-only') opts.promptOnly = true
    else if (arg.startsWith('--request-file=')) opts.requestFile = arg.slice('--request-file='.length)
    else if (arg.startsWith('--repo-root=')) opts.repoRoot = arg.slice('--repo-root='.length)
    else if (arg.startsWith('--out=')) opts.out = arg.slice('--out='.length)
    else fail(`unrecognised argument "${arg}". Expected --request-file=<path>, --repo-root=<path>, --out=<path>, --prompt-only.`)
  }

  return opts
}

async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

async function readRequest(opts) {
  const raw = opts.requestFile ? await readFile(opts.requestFile, 'utf8') : await readStdin()
  if (!raw.trim()) fail('no request JSON given. Pass --request-file=<path>, or pipe JSON on stdin.')

  try {
    return JSON.parse(raw)
  } catch (e) {
    fail(`request is not valid JSON: ${e.message}`)
  }
}

/** `design/photography/rules.md` minus its provenance header, or null if the export carries none. */
async function readPhotographyRules(repoRoot) {
  try {
    const raw = await readFile(join(repoRoot, 'design', 'photography', 'rules.md'), 'utf8')
    return stripProvenanceHeader(raw)
  } catch (err) {
    if (err.code === 'ENOENT') return null
    throw err
  }
}

/**
 * The brand's `image_style` ONLY — never `writing_rules`, never `visual_style` (that field feeds the
 * illustration/pictogram skill path in the real workflow, which this script does not implement).
 *
 * `enrich_from_keys` looks the team up in `briefing/brands.json`; `enrich_from_data` reads the flat
 * `briefing.brand_image_style` key the caller supplied directly. Any other mode (including `skip`)
 * contributes no brand style at all, matching "Resolve Context"'s own `if (mode === ...)` gating.
 */
async function resolveBrandImageStyle(request, repoRoot) {
  const mode = request.enrichment_mode || 'skip'
  const briefing = request.briefing || {}

  if (mode === 'enrich_from_keys' && briefing.brand) {
    let rows
    try {
      rows = JSON.parse(await readFile(join(repoRoot, 'briefing', 'brands.json'), 'utf8'))
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
      rows = [] // BriefingMirrorWriter writes no briefing/*.json for an unresolved team
    }
    const brandRow = rows.find((r) => r.team === briefing.brand)
    return brandRow?.image_style || null
  }

  if (mode === 'enrich_from_data') {
    return briefing.brand_image_style || null
  }

  return null
}

/** Mirrors "Build Enriched Payload"'s persona-prefix text verbatim. */
function personaPrefix(persona) {
  if (!persona?.description) return ''

  let prefix = 'Feature this person as the main subject. Adapt the scene to match their character and style'
  prefix += ` — they are: ${persona.description}`
  if (persona.vertical) prefix += `. Setting: a ${persona.vertical}-themed environment that fits this character`
  return `${prefix}. `
}

async function assemblePrompt(request, repoRoot) {
  const [photographyRules, brandImageStyle] = await Promise.all([readPhotographyRules(repoRoot), resolveBrandImageStyle(request, repoRoot)])

  const sections = []
  if (photographyRules) sections.push(`## Photography Rules\n\n${photographyRules}`)
  if (brandImageStyle) sections.push(`## Brand Image Style\n\n${brandImageStyle}`)

  const basePrompt = request.params?.image_base_prompt || request.prompt || 'A professional photograph'
  const prefixed = personaPrefix(request.persona) + basePrompt
  sections.push(prefixed)

  return sections.join('\n\n')
}

/** Reference images as `inlineData` parts, persona image first — same order "Build Enriched Payload"
 * pushes them in. Neither list is required; both default to empty. */
function referenceParts(request) {
  const parts = []

  const persona = request.persona
  if (persona?.reference_image_data) {
    parts.push({ inlineData: { mimeType: persona.reference_image_mime || 'image/png', data: persona.reference_image_data } })
  }

  for (const img of request.reference_images_data || []) {
    if (img.data && img.mime_type) parts.push({ inlineData: { mimeType: img.mime_type, data: img.data } })
  }

  return parts
}

function extensionFor(mimeType) {
  const subtype = (mimeType || 'image/png').split('/')[1] || 'png'
  return subtype === 'jpeg' ? 'jpg' : subtype
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const request = await readRequest(opts)

  const prompt = await assemblePrompt(request, opts.repoRoot)
  const parts = [...referenceParts(request), { text: prompt }]
  const aspectRatio = request.params?.aspect_ratio || '1:1'

  if (opts.promptOnly) {
    console.log(
      JSON.stringify(
        {
          prompt,
          aspect_ratio: aspectRatio,
          reference_image_parts: parts.length - 1,
          model: request.metadata?.model_hint || 'gemini-3.1-flash-image',
        },
        null,
        2,
      ),
    )
    return
  }

  let envelope
  try {
    envelope = await callGeminiImage({ parts, aspectRatio, model: request.metadata?.model_hint })
  } catch (e) {
    if (e instanceof ProviderError) {
      console.log(JSON.stringify({ status: 'failed', error: { message: e.message } }, null, 2))
      fail(e.message)
    }
    throw e
  }

  if (envelope.status !== 'completed') {
    console.log(JSON.stringify({ ...envelope, metadata: request.metadata || {} }, null, 2))
    process.exit(1)
  }

  const ext = extensionFor(envelope.image.mime_type)
  const outPath = opts.out || `generated-image.${ext}`
  await writeFile(outPath, Buffer.from(envelope.image.data, 'base64'))
  console.error(`image-generate: wrote ${outPath}`)

  console.log(
    JSON.stringify(
      {
        status: 'completed',
        image: envelope.image,
        provider: envelope.provider,
        model: envelope.model,
        prompt_used: prompt,
        metadata: request.metadata || {},
      },
      null,
      2,
    ),
  )
}

await main()
