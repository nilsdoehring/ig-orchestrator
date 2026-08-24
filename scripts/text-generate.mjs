#!/usr/bin/env node
// Local stand-in for n8n's `POST /text-generate`: same request shape in, same envelope out.
//
// Reads the endpoint's OWN request shape — `{system_prompt, user_prompt, enrichment_mode, prompt_key,
// briefing, images, metadata}` — enriches it locally against `briefing/*.json` and `prompts/*.md`
// (lib/enrich.mjs, which is the router's "Reconstruct Context" + "Resolve Text Context" ported), then
// routes to a provider exactly as `lib/providers.mjs`'s `route()` does.
//
// Default mode needs no network and no key at all: `--dry-run` prints the fully assembled prompts and
// the provider they would route to, then exits. That is the mode most debugging actually wants — the
// question is almost always "what did enrichment build", not "does the API key work". Omit
// `--dry-run` and a real key to exercise the full --parity path against the real provider.
//
//   echo '{"system_prompt":"...","user_prompt":"...","enrichment_mode":"skip"}' | node scripts/text-generate.mjs --dry-run
//   node scripts/text-generate.mjs --request-file=request.json --dry-run
//   node scripts/text-generate.mjs --request-file=request.json          # calls the routed provider

import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { enrich } from '../lib/enrich.mjs'
import { callAnthropic, callGemini, callLocal, callOpenAi, ProviderError, resolveModelHint, route } from '../lib/providers.mjs'

function parseArgs(argv) {
  const opts = { requestFile: null, dryRun: false, repoRoot: '.' }

  for (const arg of argv) {
    if (arg === '--dry-run') opts.dryRun = true
    else if (arg.startsWith('--request-file=')) opts.requestFile = arg.slice('--request-file='.length)
    else if (arg.startsWith('--repo-root=')) opts.repoRoot = arg.slice('--repo-root='.length)
    else fail(`unrecognised argument "${arg}". Expected --request-file=<path>, --repo-root=<path>, --dry-run.`)
  }

  return opts
}

function fail(message) {
  console.error(`text-generate: ${message}`)
  process.exit(1)
}

async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

async function readRequest(opts) {
  const raw = opts.requestFile ? await readFile(opts.requestFile, 'utf8') : await readStdin()

  if (!raw.trim()) {
    fail('no request JSON given. Pass --request-file=<path>, or pipe JSON on stdin.')
  }

  try {
    return JSON.parse(raw)
  } catch (e) {
    fail(`request is not valid JSON: ${e.message}`)
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const request = await readRequest(opts)

  // Extract & Route's own validation: skip mode with no prompt at all is refused before anything else
  // runs, not silently generated against an empty prompt.
  const enrichmentMode = request.enrichment_mode || 'skip'
  if (!request.system_prompt && !request.user_prompt && enrichmentMode === 'skip') {
    console.log(JSON.stringify({ status: 'failed', error: { message: 'No prompts provided and mode is skip' } }, null, 2))
    process.exit(1)
  }

  const enriched = await enrich(request, opts.repoRoot)

  if (enriched.promptKeyMissing) {
    // The real router is silent here — PHP relies on that silence and sends an empty system_prompt
    // for every enriched call. Warning instead of matching the silence exactly is the one deliberate
    // divergence this repo takes everywhere: hiding a known data loss is worse than the endpoint that
    // has it.
    console.error(
      `warning: prompt_key "${request.prompt_key}" has no prompts/${request.prompt_key}.md in this repo — ` +
        'system_prompt was left exactly as the request sent it, matching what the real router does on a ' +
        'missing Data Table row (silently — this repo just isn\'t silent about it).',
    )
  }

  const modelHint = resolveModelHint(request.metadata?.model_hint)
  const provider = route(modelHint)
  const images = request.images || []

  if (opts.dryRun) {
    console.log(
      JSON.stringify(
        {
          provider,
          model: modelHint,
          enrichment_mode: enriched.mode,
          system_prompt: enriched.systemPrompt,
          user_prompt: enriched.userPrompt,
          images_supplied: images.length,
          images_used: provider === 'gemini' ? images.length : 0,
        },
        null,
        2,
      ),
    )
    return
  }

  const callArgs = { systemPrompt: enriched.systemPrompt, userPrompt: enriched.userPrompt, model: modelHint, images }

  let envelope
  try {
    if (provider === 'anthropic') envelope = await callAnthropic(callArgs)
    else if (provider === 'local') envelope = await callLocal(callArgs)
    else if (provider === 'openai') envelope = await callOpenAi()
    else envelope = await callGemini(callArgs)
  } catch (e) {
    if (e instanceof ProviderError) fail(e.message)
    throw e
  }

  console.log(JSON.stringify(envelope, null, 2))
  process.exit(envelope.status === 'completed' ? 0 : 1)
}

await main()
