#!/usr/bin/env node
// CI gate: this repo is generated and has exactly one writable home — the Unima repository's
// `integrations/agent-repo/template/` for tooling, and the knowledge database for data. A hand-edit
// made straight in a clone of THIS repo is silently reverted the next time it is published, so it
// has to be caught here, at PR time, rather than discovered later as lost work.
//
// MANIFEST.yaml is the bundle's own claim about itself: `path -> sha256 of that path's bytes`,
// written by AgentRepoBundle::manifest() at publish time. This script re-hashes every listed path
// and fails loudly on any mismatch — that is the entire mechanism. It does not and cannot check
// MANIFEST.yaml's own bytes or VERSION's: AgentRepoBundle deliberately excludes both from the
// manifest it writes, because a file cannot contain its own hash.
//
//   node scripts/verify-manifest.mjs

import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { exit } from 'node:process'
import { parse } from '../lib/yaml.mjs'

const repoRoot = '.'

let raw
try {
  raw = await readFile(join(repoRoot, 'MANIFEST.yaml'), 'utf8')
} catch (err) {
  console.error(`Cannot read MANIFEST.yaml: ${err.message}`)
  console.error('This repo is generated — if MANIFEST.yaml is missing, the publish that produced this checkout was broken.')
  exit(1)
}

const manifest = parse(raw)
const files = manifest.files ?? {}
const listedPaths = Object.keys(files).sort()

if (listedPaths.length === 0) {
  console.error('MANIFEST.yaml lists no files. Either the corpus is empty or the export is broken — re-run unima:knowledge:publish-agent-repo.')
  exit(1)
}

const missing = []
const mismatched = []

for (const path of listedPaths) {
  const expectedHash = files[path]
  let bytes
  try {
    bytes = await readFile(join(repoRoot, path))
  } catch {
    missing.push(path)
    continue
  }

  const actualHash = createHash('sha256').update(bytes).digest('hex')
  if (actualHash !== expectedHash) {
    mismatched.push(path)
  }
}

for (const path of missing) {
  console.error(`listed but missing: ${path}`)
  console.error('  MANIFEST.yaml promises this path exists and it does not. Re-checkout, or if it was')
  console.error('  deleted on purpose the deletion has to happen at the source and be re-published —')
  console.error('  not here.')
}

for (const path of mismatched) {
  console.error(`hand-edited (or corrupted): ${path}`)
  console.error(`  ${pointerFor(path)}`)
}

// Informational only, never a failure: a file the manifest does not list is not necessarily a
// problem — a human's own notes (a scratch file, a checked-out README they dropped in) are
// legitimate here. Only manifest-listed paths are governed; this just tells a reviewer what else is
// sitting in the tree.
const onDisk = await walk(repoRoot)
const listedSet = new Set(listedPaths)
const unlisted = onDisk.filter((path) => !listedSet.has(path) && path !== 'MANIFEST.yaml' && path !== 'VERSION').sort()

if (unlisted.length > 0) {
  console.log(`\n${unlisted.length} file(s) present but not listed in MANIFEST.yaml (informational, not a failure):`)
  for (const path of unlisted) console.log(`  ${path}`)
}

const failureCount = missing.length + mismatched.length

if (failureCount === 0) {
  console.log(`\nverify-manifest: ${listedPaths.length} file(s) match MANIFEST.yaml.`)
  exit(0)
}

console.error(`\nverify-manifest: ${failureCount} of ${listedPaths.length} listed file(s) failed (${missing.length} missing, ${mismatched.length} hash mismatch).`)
exit(1)

/**
 * Where to actually make the change. Data paths are rendered from database rows by writers under
 * `src/AI/Domain/Service/Knowledge/AgentRepo/Writer/`; everything else is copied byte-for-byte from
 * the template directory by `TemplateCopier`. Both facts are recorded in
 * `.publish/template-provenance.md`, which this points at implicitly by naming the two homes.
 */
function pointerFor(path) {
  const dataPrefixes = ['knowledge/', 'briefing/', 'prompts/', 'design/photography/']
  if (dataPrefixes.some((prefix) => path.startsWith(prefix))) {
    return (
      'Generated from the knowledge database. Edit the source rows in Unima (rules, terms, ' +
      'statements, briefing, prompts, …), then re-run unima:knowledge:publish-agent-repo — ' +
      'do not edit the published bytes directly.'
    )
  }

  return (
    `Part of the static template. Edit integrations/agent-repo/template/${path} in the Unima ` +
    'repository, then re-publish — do not edit the published bytes directly.'
  )
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
