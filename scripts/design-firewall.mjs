#!/usr/bin/env node
// The leak scan, re-run in the consuming repo so the guarantee is enforced where the content is
// READ and not only where it was written.
//
// This mirrors `App\AI\Domain\Service\Knowledge\AgentRepo\DesignFirewall` (the PHP export-time scan)
// pattern for pattern. It is deliberately NOT the structural firewall the original plan claimed to
// have — see that class's own docblock for why "photography lives in its own table" and
// `ReferenceAsset::$excludedFromPrompts` were both false when checked. It is a grep with good
// messages over the export's own output, run a second time here because the export happened in a
// different repository and the guarantee is only real if it also holds at the point a coding agent
// actually reads these files.
//
// A WRONG REFUSAL MUST BE DISCOVERABLE. The guard this replaces blocked four pages of legitimate
// writing rules and three correct photography statements — over-refusal is a real, previously-
// realised failure mode, not a hypothetical one. So every finding prints its path, its line, the
// exact matched text and the rule that caught it; nothing is dropped silently.
//
//   node scripts/design-firewall.mjs

import { readFile, readdir } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { exit } from 'node:process'

const repoRoot = '.'

/**
 * Blocking patterns: [rule name, regex, pointer to where this content actually belongs].
 *
 * Hex needs a word boundary `#` itself does not provide, so the lookahead excludes 7+ hex runs —
 * git SHAs and content hashes (MANIFEST.yaml's sha256 column, VERSION's 12-hex content hash) — which
 * are legitimate here and are not colours.
 */
const BLOCKING = [
  [
    'hex_colour',
    /#[0-9a-fA-F]{6}\b(?![0-9a-fA-F])/g,
    'Colour values belong in the Unima editor design tokens, not a knowledge file.',
  ],
  [
    'colour_function',
    /\b(?:rgba?|hsla?|cmyk)\s*\(/gi,
    'Colour values belong in the Unima editor design tokens, not a knowledge file.',
  ],
  [
    'font_family',
    /\b(?:Overpass|Open Sans|Helvetica|Arial|Roboto|Inter|Lato|Montserrat)\b/gi,
    'Typefaces and the type scale live in the React component library (uds-orchestrator), not here.',
  ],
  [
    'font_property',
    /\bfont-(?:family|weight|size)\b/gi,
    'Typefaces and the type scale live in the React component library (uds-orchestrator), not here.',
  ],
  [
    'measurement',
    /\b\d+(?:[.,]\d+)?\s*(?:px|pt|mm|cm|rem|em)\b/gi,
    'Spacing, grid and minimum sizes live in the Unima editor / the logo rulebook, not here.',
  ],
  [
    'design_component',
    /\b(?:Nlement|price tag|clear space|Schutzraum|Logo-?Lockup)\b/gi,
    'Component names and logo construction live in the React component library / brand portal, not here.',
  ],
  [
    'base64_payload',
    /data:image\/[a-z]+;base64,/gi,
    'Image bytes belong in the asset library, never inline in a knowledge file.',
  ],
]

/**
 * Curated brand-colour name stoplist, blocking.
 *
 * A stoplist and not a regex, because the corpus can name a colour with no hex anywhere near it —
 * "IONOS Midnight Blue" contains no `#` — and no pattern over English words distinguishes a colour
 * name from a product name. This list is a floor, not a guarantee: it is known incomplete against a
 * corpus that also says things like "Amber" or "Purple" bare. The real guard for the rest belongs at
 * ingest, where the source document is.
 */
const COLOUR_STOPLIST = [
  'midnight blue',
  'ionos blue',
  'cool black',
  'warm grey',
  'warm gray',
  'amber',
  'magenta',
  'cyan',
  'teal',
  'ochre',
  'ocher',
]

/**
 * Warning-only, never blocking.
 *
 * Widening the two-character-code pattern to a hard blocker was tried and measured: run against this
 * corpus, `\b[A-Z][0-9]\b` matches exactly four things, and all four are the fixture's OWN
 * acceptance-case labels ("A2", "A4") sitting in provenance comments (one literally reads
 * "CONSTRUCTED — no source locator; see NOTES.md §A4"). Blocking on it reddens CI on provably clean
 * data. The real guard for actual design-token codes belongs at ingest, over the source PDF — this
 * only flags a look-alike for a human to glance at.
 */
const WARNING = [
  [
    'possible_token_code',
    /\b[A-Z][0-9]\b/g,
    'Looks like a design-token code (e.g. B3, C2, Y3) — please check by hand. The real guard runs at ingest, not here.',
  ],
]

/**
 * Exempt from the scan entirely: files whose whole job is to talk ABOUT the boundary, plus every
 * mirror of an existing consumer's own input. Rewriting `prompts/` or `briefing/` to satisfy this
 * lint would change what the n8n path actually receives — a generation change disguised as a fix —
 * so those are out of scope here by design, not by oversight.
 */
const EXEMPT_FILES = new Set(['design/README.md', 'AGENTS.md', 'CLAUDE.md', 'README.md', 'MANIFEST.yaml', 'VERSION'])
// `design/statements/` is THE QUARANTINE and must be exempt here exactly as it is in the exporter's
// own DesignFirewall::isExempt(). The migrated visual_identity and image_style prose is a full colour
// palette, font families, px measurements and the corpus's two-character token codes — precisely what
// this script refuses everywhere else. It is also LIVE: n8n's image workflow injects it for
// illustration and pictogram generation and has nothing else to read, so deleting it causes an outage.
// It is routed out of knowledge/ so no text path can glob it, and quarantined here.
//
// If this list ever disagrees with the PHP side, CI rejects a bundle the exporter deliberately passed —
// two gates with different rules is worse than one gate.
//
// `design/photography/rules.md` is deliberately NOT exempt: photography is writing-adjacent guidance
// and new design content in it should still be refused.
const EXEMPT_PREFIXES = ['design/statements/', 'prompts/', 'briefing/', '.claude/', 'lib/', 'scripts/', '.github/']

/**
 * `knowledge/discards.md` quotes refused excerpts verbatim so a wrong refusal is discoverable — that
 * is the entire point of a discard pile. But it lives inside `knowledge/`, which this scan polices, so
 * any correctly-refused design mention anywhere in the corpus (a colour name, a px value) turns the
 * excerpt quoting it into a second, unpublishable copy of content the ingest guard already declined to
 * store as a rule. Unlike `design/statements/`, nothing reads this file at runtime, so there is no
 * downstream consumer to protect — downgrading its findings to warnings keeps them visible without
 * permanently blocking on data already handled once. Mirrors
 * `DesignFirewall::isDowngradedToWarning()` on the exporter side; if the two ever disagree, CI here
 * would reject a bundle the exporter deliberately passed.
 */
const isDowngradedToWarning = (path) => path === 'knowledge/discards.md'

/**
 * The matched line, trimmed to something a human can read in a terminal.
 *
 * Untruncated, a single finding inside a migrated `body_verbose` printed an entire multi-thousand-word
 * document as its "excerpt" — which buries every other finding and makes the report unusable, the
 * opposite of the purpose. The exporter's PHP side caps at 160 characters; matching it.
 */
const excerptOf = (line) => {
  const trimmed = line.trim()

  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}…` : trimmed
}

const paths = await walk(repoRoot)
const blocking = []
const warnings = []

for (const path of paths.sort()) {
  if (isExempt(path)) continue

  let text
  try {
    text = await readFile(join(repoRoot, path), 'utf8')
  } catch {
    // Not readable as UTF-8 text (e.g. a binary asset). This scan only makes claims about text
    // content, so it skips rather than crashing on something outside its remit.
    continue
  }

  const downgrade = isDowngradedToWarning(path)
  const target = downgrade ? warnings : blocking

  const lines = text.split('\n')
  lines.forEach((line, i) => {
    const lineNo = i + 1

    for (const [rule, pattern, pointer] of BLOCKING) {
      for (const match of matchesOnLine(line, pattern)) {
        target.push({ path, lineNo, rule, match, line: excerptOf(line), pointer })
      }
    }

    for (const colour of colourStoplistHits(line)) {
      target.push({
        path,
        lineNo,
        rule: 'brand_colour_name',
        match: colour,
        line: excerptOf(line),
        pointer: 'Brand colours — even spelled out as words — belong in the design tokens, not a knowledge file.',
      })
    }

    for (const [rule, pattern, pointer] of WARNING) {
      for (const match of matchesOnLine(line, pattern)) {
        warnings.push({ path, lineNo, rule, match, line: excerptOf(line), pointer })
      }
    }
  })
}

if (warnings.length > 0) {
  console.log(`design-firewall: ${warnings.length} warning(s) (not blocking):\n`)
  for (const w of warnings) {
    console.log(`${w.path}:${w.lineNo}  [${w.rule}] "${w.match}"`)
    console.log(`    ${w.line}`)
    console.log(`    ${w.pointer}\n`)
  }
}

if (blocking.length > 0) {
  console.error(`design-firewall: ${blocking.length} BLOCKING finding(s):\n`)
  for (const b of blocking) {
    console.error(`${b.path}:${b.lineNo}  [${b.rule}] "${b.match}"`)
    console.error(`    ${b.line}`)
    console.error(`    ${b.pointer}\n`)
  }
  console.error('design-firewall: FAILED. Design content leaked into a knowledge file — see findings above.')
  exit(1)
}

console.log(`design-firewall: clean. Scanned ${paths.length - paths.filter(isExempt).length} file(s), ${warnings.length} warning(s), 0 blocking.`)
exit(0)

function isExempt(path) {
  return EXEMPT_FILES.has(path) || EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix))
}

/** @returns {string[]} every match on this one line, in order, duplicates included (one per hit). */
function matchesOnLine(line, pattern) {
  const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g')
  const out = []
  let m
  while ((m = re.exec(line)) !== null) {
    out.push(m[0])
    if (m.index === re.lastIndex) re.lastIndex += 1 // guard against a zero-width match looping forever
  }
  return out
}

/** @returns {string[]} stoplist colour names found in this line, case-insensitive substring match. */
function colourStoplistHits(line) {
  const haystack = line.toLowerCase()
  return COLOUR_STOPLIST.filter((colour) => haystack.includes(colour))
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
