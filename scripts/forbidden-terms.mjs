#!/usr/bin/env node
// Asserts no term listed as `forbidden` in knowledge/terms/forbidden.yaml appears anywhere else in
// this tree. That file is not a report — it is the gate every other generated file is linted
// against, and this script is the lint.
//
// FORBIDDEN VS DEPRECATED. Only the `forbidden` list is checked here. `deprecated` is a strictly
// weaker claim ("prefer something else going forward") that TermsWriter deliberately keeps in the
// same file but out of this gate — conflating the two would make CI reject content the source merely
// discourages.
//
// WORD BOUNDARY, CASE-INSENSITIVE. A forbidden term matches as a whole word (or, for a multi-word
// term, the whole phrase) regardless of case, so "Cloud Server" catches "cloud server" but "cloud
// servers" only if the term itself is a substring bounded by non-word characters on both sides —
// this is a lint over prose, not a stemmer.
//
//   node scripts/forbidden-terms.mjs

import { readFile, readdir } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { exit } from 'node:process'
import { parse } from '../lib/yaml.mjs'

const repoRoot = '.'
const FORBIDDEN_PATH = 'knowledge/terms/forbidden.yaml'

// Same reasoning as design-firewall.mjs: prompts/ and briefing/ are verbatim mirrors of an existing
// consumer's input and must not be rewritten to satisfy a lint, and the static template halves
// (.claude/, lib/, scripts/, .github/) are this repo's own tooling, not brand copy. Additionally
// exempt here, and only here: forbidden.yaml itself (it is the list, not a use) and discards.md (a
// discard legitimately QUOTES rejected content, including a forbidden term, as the reason it was
// rejected).
const EXEMPT_FILES = new Set([
  'design/README.md',
  'AGENTS.md',
  'CLAUDE.md',
  'README.md',
  'MANIFEST.yaml',
  'VERSION',
  FORBIDDEN_PATH,
  'knowledge/discards.md',
])
const EXEMPT_PREFIXES = ['prompts/', 'briefing/', '.claude/', 'lib/', 'scripts/', '.github/']

let raw
try {
  raw = await readFile(join(repoRoot, FORBIDDEN_PATH), 'utf8')
} catch (err) {
  console.error(`Cannot read ${FORBIDDEN_PATH}: ${err.message}`)
  exit(1)
}

const data = parse(raw)
const forbidden = data.forbidden ?? []

if (forbidden.length === 0) {
  console.log('forbidden-terms: no forbidden terms recorded for this team. Nothing to check.')
  exit(0)
}

const rules = forbidden.map((entry) => ({
  term: entry.term,
  insteadUse: entry.instead_use,
  reason: entry.reason,
  pattern: wordBoundaryPattern(entry.term),
}))

const paths = await walk(repoRoot)
const hits = []

for (const path of paths.sort()) {
  if (isExempt(path)) continue

  let text
  try {
    text = await readFile(join(repoRoot, path), 'utf8')
  } catch {
    continue // not UTF-8 text; out of scope for a term lint
  }

  const lines = text.split('\n')
  lines.forEach((line, i) => {
    const lineNo = i + 1
    for (const rule of rules) {
      if (rule.pattern.test(line)) {
        hits.push({ path, lineNo, line: line.trim(), rule })
      }
    }
  })
}

if (hits.length === 0) {
  console.log(`forbidden-terms: clean. ${forbidden.length} forbidden term(s) checked against ${paths.length - paths.filter(isExempt).length} file(s).`)
  exit(0)
}

console.error(`forbidden-terms: ${hits.length} hit(s) of a forbidden term outside its own ledger.\n`)
for (const hit of hits) {
  console.error(`${hit.path}:${hit.lineNo}  forbidden term "${hit.rule.term}"`)
  console.error(`    ${hit.line}`)
  console.error(
    hit.rule.insteadUse
      ? `    instead_use: "${hit.rule.insteadUse}"`
      : '    (no instead_use on record for this scope — see knowledge/terms/forbidden.yaml)',
  )
  if (hit.rule.reason) console.error(`    reason: ${hit.rule.reason}`)
  console.error('')
}
console.error(`forbidden-terms: FAILED. See knowledge/terms/forbidden.yaml, then fix the offending text at its source.`)
exit(1)

function isExempt(path) {
  return EXEMPT_FILES.has(path) || EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix))
}

/**
 * A case-insensitive, global, word-bounded regex for one term. Escapes every regex metacharacter in
 * the term itself first — a term is prose, never a pattern, and one containing e.g. a literal "(" is
 * real (a parenthetical brand aside), not regex syntax to honour.
 */
function wordBoundaryPattern(term) {
  const escaped = String(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`, 'i')
}

/** Every file under root, as relative POSIX paths. `.git` is excluded — a checkout always has one. */
async function walk(root) {
  const out = []

  async function recurse(dir) {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name === '.git') continue
      const absolute = join(dir, entry.name)
      if (entry.isDirectory()) {
        await recurse(absolute)
      } else if (entry.isFile()) {
        out.push(relative(root, absolute).split(sep).join('/'))
      }
    }
  }

  await recurse(root)
  return out
}
