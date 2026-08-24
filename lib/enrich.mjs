// The router's own prompt-assembly logic, ported so `scripts/text-generate.mjs` and the
// `/text-generate` slash command mean the same thing by "enrich".
//
// SOURCE OF TRUTH: `integrations/n8n/workflows/text-generation-router.json`, specifically the
// "Reconstruct Context" and "Resolve Text Context" Code nodes. Read those two nodes before changing
// anything here — this file is a faithful port, not a redesign, and a "cleaner" rewrite that changes
// section order, wording, or which branch nests inside which is a silent divergence from the real
// endpoint that nothing on this side of the fence would catch.
//
// THE ONE RULE MOST LIKELY TO BE GOTTEN WRONG: `prompt_key` REPLACES `system_prompt`, it does not
// prepend or append to it. PHP relies on this — `ExternalTextGeneratorAdapter` sends an EMPTY
// `system_prompt` for every enriched call and counts on n8n to supply the whole thing from
// `prompts/<key>.md`. Appending here instead of replacing would double every non-enriched prompt and
// silently diverge from the router for every enriched one.
//
// THE SECOND RULE: in `enrich_from_keys` mode, the product/target-group/goal/language sections (and
// their raw-string fallbacks) only exist AT ALL when the brand itself resolves. The router's
// "Resolve Text Context" node nests all four of them inside
// `if (mode === 'enrich_from_keys' && briefing.brand && brands[briefing.brand])` — if the team's row
// is missing, NONE of the four sections appear, not even as fallback text. That is reproduced exactly
// below; it is not a bug in this port.

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Strips a generated file's `<!-- ... -->` provenance header (see
 * `src/AI/.../AgentRepo/Provenance.php`) and the single blank line that separates it from the
 * payload, returning the payload verbatim. Used for `prompts/<key>.md` here, and reused by
 * `scripts/image-generate.mjs` for `design/photography/rules.md`.
 *
 * Returns the input unchanged if no `-->` is found — a file with no header is passed through rather
 * than mangled, since that is a more informative failure than silently returning nothing.
 */
export function stripProvenanceHeader(text) {
  const closeIdx = text.indexOf('-->')
  if (closeIdx === -1) return text

  let rest = text.slice(closeIdx + '-->'.length)
  rest = rest.replace(/^\n+/, '') // the one blank separator line PromptsWriter/RulesWriter both emit
  return rest
}

/** PHP's / n8n's `safeParse`: a JSON-encoded string column, or `fallback` if absent or malformed. */
function safeParse(value, fallback) {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

async function readJsonMirror(repoRoot, table) {
  try {
    const raw = await readFile(join(repoRoot, 'briefing', `${table}.json`), 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    // Absent is not an error here: BriefingMirrorWriter writes NO briefing/*.json at all when the
    // corpus names a team with no matching database row — only briefing/README.md explaining why.
    // Treating that the same as "team not found" is exactly what the real router does when its Data
    // Table lookup comes back with zero rows.
    if (err.code === 'ENOENT') return []
    throw err
  }
}

/** Loads the five team-scoped mirrors `enrich_from_keys` reads. The sixth, prompts, is keyed by
 * `prompt_key` rather than by team and is loaded separately by `readPromptText`. */
async function loadBriefingMirrors(repoRoot) {
  const [brands, products, targetGroups, goals, languages] = await Promise.all([
    readJsonMirror(repoRoot, 'brands'),
    readJsonMirror(repoRoot, 'products'),
    readJsonMirror(repoRoot, 'target_groups'),
    readJsonMirror(repoRoot, 'goals'),
    readJsonMirror(repoRoot, 'languages'),
  ])
  return { brands, products, targetGroups, goals, languages }
}

/** Reads `prompts/<key>.md` and returns the prompt text verbatim, or `null` if the file is absent. */
async function readPromptText(repoRoot, key) {
  try {
    const raw = await readFile(join(repoRoot, 'prompts', `${key}.md`), 'utf8')
    return stripProvenanceHeader(raw)
  } catch (err) {
    if (err.code === 'ENOENT') return null
    throw err
  }
}

/**
 * Runs the request through the same steps `text-generation-router.json` runs, against this repo's
 * briefing mirrors and prompt files instead of n8n's Data Tables.
 *
 * @param {{system_prompt?: string, user_prompt?: string, enrichment_mode?: string, prompt_key?: string|null, briefing?: object}} request
 *   The endpoint's own request shape. `images` and `metadata` pass through untouched at the caller —
 *   this function only ever touches prompt text.
 * @param {string} repoRoot
 * @returns {Promise<{systemPrompt: string, userPrompt: string, mode: string, promptKeyMissing: boolean}>}
 */
export async function enrich(request, repoRoot = '.') {
  const mode = request.enrichment_mode || 'skip'
  const briefing = request.briefing || {}
  const rawUserPrompt = request.user_prompt || ''

  // "Build Skip Payload": pure pass-through, no Data Table reads, no prompt_key lookup.
  if (mode === 'skip') {
    return { systemPrompt: request.system_prompt || '', userPrompt: rawUserPrompt, mode, promptKeyMissing: false }
  }

  // "Resolve Text Context" runs for any mode reaching this branch ("Route by Mode" only tests
  // `enrichment_mode.startsWith('enrich')`) — prompt_key replacement happens before the mode switch
  // and independently of which of the two enrich modes is in effect.
  let systemPrompt = request.system_prompt || ''
  let promptKeyMissing = false

  if (request.prompt_key) {
    const promptText = await readPromptText(repoRoot, request.prompt_key)
    if (promptText !== null) {
      systemPrompt = promptText // REPLACES, never appends — see file header
    } else {
      promptKeyMissing = true
    }
  }

  const userPromptParts = []

  if (mode === 'enrich_from_keys') {
    const mirrors = await loadBriefingMirrors(repoRoot)
    const brandRow = briefing.brand ? mirrors.brands.find((r) => r.team === briefing.brand) : undefined

    // Everything below — brand prefix AND all four sections, including their raw-string fallbacks —
    // exists only when the brand resolves. See file header: this nesting is deliberate, not a bug.
    if (brandRow) {
      let prefix = ''
      if (brandRow.context) prefix += `## Brand Identity\n\n${brandRow.context}\n\n`
      if (brandRow.tone) prefix += `## Brand Tone\n\n${brandRow.tone}\n\n`
      if (brandRow.visual_style) prefix += `## Brand Visual Style\n\n${brandRow.visual_style}\n\n`
      const writingRules = safeParse(brandRow.writing_rules, {})
      if (Object.keys(writingRules).length > 0) prefix += `## Writing Rules\n\n${JSON.stringify(writingRules)}\n\n`
      const glossary = safeParse(brandRow.glossary, {})
      if (Object.keys(glossary).length > 0) prefix += `## Brand Glossary\n\n${JSON.stringify(glossary)}\n\n`
      if (prefix) systemPrompt = prefix + systemPrompt

      const productRow = briefing.product
        ? mirrors.products.find((r) => r.team === briefing.brand && r.name === briefing.product)
        : undefined
      if (productRow) {
        const seoKeywords = safeParse(productRow.seo_keywords, [])
        const valueProps = safeParse(productRow.value_propositions, [])
        userPromptParts.push('## Product\n')
        userPromptParts.push(`**Name**: ${briefing.product}`)
        if (productRow.description) userPromptParts.push(`**Description**: ${productRow.description}`)
        if (productRow.briefing) userPromptParts.push(`**Briefing Summary**: ${productRow.briefing}`)
        if (seoKeywords.length > 0) userPromptParts.push(`**SEO Keywords**: ${JSON.stringify(seoKeywords)}`)
        if (valueProps.length > 0) userPromptParts.push(`**Value Propositions**: ${JSON.stringify(valueProps)}`)
        if (productRow.competitive_edge) userPromptParts.push(`**Competitive Edge**: ${productRow.competitive_edge}`)
      } else if (briefing.product) {
        userPromptParts.push('## Product\n')
        userPromptParts.push(`**Description**: ${briefing.product}`)
      }

      const targetRow = briefing.target_group
        ? mirrors.targetGroups.find((r) => r.team === briefing.brand && r.name === briefing.target_group)
        : undefined
      if (targetRow) {
        const painPoints = safeParse(targetRow.pain_points, [])
        const motivations = safeParse(targetRow.motivations, [])
        userPromptParts.push('\n## Target Group\n')
        userPromptParts.push(`**Name**: ${briefing.target_group}`)
        if (targetRow.context) userPromptParts.push(`**Profile**: ${targetRow.context}`)
        if (painPoints.length > 0) userPromptParts.push(`**Pain Points**: ${JSON.stringify(painPoints)}`)
        if (motivations.length > 0) userPromptParts.push(`**Motivations**: ${JSON.stringify(motivations)}`)
      } else if (briefing.target_group) {
        userPromptParts.push('\n## Target Group\n')
        userPromptParts.push(`**Profile**: ${briefing.target_group}`)
      }

      const goalRow = briefing.goal
        ? mirrors.goals.find((r) => r.team === briefing.brand && r.name === briefing.goal)
        : undefined
      if (goalRow) {
        userPromptParts.push('\n## Campaign Goal\n')
        userPromptParts.push(`**Goal**: ${briefing.goal}`)
        if (goalRow.description) userPromptParts.push(`**Description**: ${goalRow.description}`)
        if (goalRow.guidance) userPromptParts.push(`**Prompt Guidance**: ${goalRow.guidance}`)
      } else if (briefing.goal) {
        userPromptParts.push('\n## Campaign Goal\n')
        userPromptParts.push(`**Goal**: ${briefing.goal}`)
      }

      const langRow = briefing.language
        ? mirrors.languages.find((r) => r.team === briefing.brand && r.code === briefing.language)
        : undefined
      if (langRow) {
        const langGlossary = safeParse(langRow.glossary, {})
        userPromptParts.push('\n## Language\n')
        userPromptParts.push(`**Target Language**: ${langRow.name} (${briefing.language})`)
        userPromptParts.push(`ALL text content MUST be written in ${langRow.name}.`)
        if (langRow.writing_style) userPromptParts.push(`**Writing Style**: ${langRow.writing_style}`)
        if (langRow.localization) userPromptParts.push(`**Localization Notes**: ${langRow.localization}`)
        if (Object.keys(langGlossary).length > 0) userPromptParts.push(`**Glossary**: ${JSON.stringify(langGlossary)}`)
      } else if (briefing.language) {
        userPromptParts.push('\n## Language\n')
        userPromptParts.push(`**Target Language**: ${briefing.language}`)
        userPromptParts.push(`ALL text content MUST be written in ${briefing.language}.`)
      }
    }
  } else if (mode === 'enrich_from_data') {
    // Same sections, but every value is a flat key the caller supplied directly — no mirror lookup,
    // no team resolution, so there is no "brand not found" case here at all.
    let prefix = ''
    if (briefing.brand_context) prefix += `## Brand Identity\n\n${briefing.brand_context}\n\n`
    if (briefing.brand_tone) prefix += `## Brand Tone\n\n${briefing.brand_tone}\n\n`
    if (briefing.brand_visual_style) prefix += `## Brand Visual Style\n\n${briefing.brand_visual_style}\n\n`
    if (briefing.brand_writing_rules) {
      const wr = typeof briefing.brand_writing_rules === 'string' ? briefing.brand_writing_rules : JSON.stringify(briefing.brand_writing_rules)
      prefix += `## Writing Rules\n\n${wr}\n\n`
    }
    if (briefing.brand_glossary) {
      const bg = typeof briefing.brand_glossary === 'string' ? briefing.brand_glossary : JSON.stringify(briefing.brand_glossary)
      prefix += `## Brand Glossary\n\n${bg}\n\n`
    }
    if (prefix) systemPrompt = prefix + systemPrompt

    if (briefing.page_catalog) {
      const catalog = typeof briefing.page_catalog === 'string' ? briefing.page_catalog : JSON.stringify(briefing.page_catalog, null, 2)
      systemPrompt += `\n\n## Available Components\n\n${catalog}\n`
    }
    if (briefing.available_modes && Array.isArray(briefing.available_modes)) {
      let modesSection = '\n\n## Available Token Modes\n\n'
      for (const group of briefing.available_modes) {
        modesSection += `**${group.collectionName || ''}:**\n`
        for (const [modeId, modeName] of Object.entries(group.modes || {})) {
          const isDefault = modeId === group.defaultModeId ? ' [default]' : ''
          modesSection += `  - ${modeName}: collectionId=${group.collectionId}, modeId=${modeId}${isDefault}\n`
        }
        modesSection += '\n'
      }
      systemPrompt += modesSection
    }
    if (briefing.module_catalog) {
      const catalog = typeof briefing.module_catalog === 'string' ? briefing.module_catalog : JSON.stringify(briefing.module_catalog, null, 2)
      systemPrompt += `\n\n## Available Modules\n\n${catalog}\n`
    }

    if (briefing.base_user_prompt) userPromptParts.push(briefing.base_user_prompt)
    if (briefing.product_name) {
      userPromptParts.push('## Product\n')
      userPromptParts.push(`**Name**: ${briefing.product_name}`)
      if (briefing.product_description) userPromptParts.push(`**Description**: ${briefing.product_description}`)
      if (briefing.product_briefing) userPromptParts.push(`**Briefing Summary**: ${briefing.product_briefing}`)
      if (briefing.seo_keywords) userPromptParts.push(`**SEO Keywords**: ${JSON.stringify(briefing.seo_keywords)}`)
      if (briefing.value_propositions) userPromptParts.push(`**Value Propositions**: ${JSON.stringify(briefing.value_propositions)}`)
      if (briefing.competitive_edge) userPromptParts.push(`**Competitive Edge**: ${briefing.competitive_edge}`)
    }
    if (briefing.target_name) {
      userPromptParts.push('\n## Target Group\n')
      userPromptParts.push(`**Name**: ${briefing.target_name}`)
      if (briefing.target_context) userPromptParts.push(`**Profile**: ${briefing.target_context}`)
      if (briefing.pain_points) userPromptParts.push(`**Pain Points**: ${JSON.stringify(briefing.pain_points)}`)
      if (briefing.motivations) userPromptParts.push(`**Motivations**: ${JSON.stringify(briefing.motivations)}`)
    }
    if (briefing.goal_name) {
      userPromptParts.push('\n## Campaign Goal\n')
      userPromptParts.push(`**Goal**: ${briefing.goal_name}`)
      if (briefing.goal_description) userPromptParts.push(`**Description**: ${briefing.goal_description}`)
      if (briefing.goal_guidance) userPromptParts.push(`**Prompt Guidance**: ${briefing.goal_guidance}`)
    }
    if (briefing.language_name) {
      userPromptParts.push('\n## Language\n')
      userPromptParts.push(`**Target Language**: ${briefing.language_name}${briefing.language_code ? ` (${briefing.language_code})` : ''}`)
      userPromptParts.push(`ALL text content MUST be written in ${briefing.language_name}.`)
      if (briefing.writing_style) userPromptParts.push(`**Writing Style**: ${briefing.writing_style}`)
      if (briefing.localization_notes) userPromptParts.push(`**Localization Notes**: ${briefing.localization_notes}`)
      if (briefing.language_glossary) userPromptParts.push(`**Glossary**: ${JSON.stringify(briefing.language_glossary)}`)
    }
  }

  // Appended last, for ANY non-skip mode reaching this point — including a mode string that matched
  // neither branch above, which the router would also fall through on without erroring.
  if (briefing.custom_prompt && briefing.custom_prompt.trim() !== '') {
    userPromptParts.push(`\n## Custom Instructions\n${briefing.custom_prompt}`)
  }

  let userPrompt
  if (userPromptParts.length > 0) {
    userPrompt = userPromptParts.join('\n')
    if (rawUserPrompt) userPrompt += `\n\n${rawUserPrompt}`
  } else {
    userPrompt = rawUserPrompt
  }

  return { systemPrompt, userPrompt, mode, promptKeyMissing }
}
