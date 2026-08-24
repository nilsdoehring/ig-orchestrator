#!/usr/bin/env node
// Proves lib/yaml.mjs parses exactly the grammar unima:knowledge:publish-agent-repo emits, and
// refuses everything outside it.
//
// WHY THIS EXISTS SEPARATELY FROM conformance.mjs. Conformance proves the RESOLVER agrees with PHP
// on real corpus data — it never exercises a YAML construct the exporter does not currently produce.
// This file exercises the parser directly: every shape the grammar allows, and every shape it must
// refuse. A silent misparse of, say, a single-quoted scalar would still let conformance pass on
// today's corpus and then produce a wrong rule set the day someone hand-edits a file to use one — a
// silent misparse would produce a wrong rule set with no error, which is why refusal is the designed
// behaviour and why it has to be proven here, not left to be discovered by conformance.mjs later.
//
// Each refusal case below is written to match what the parser ACTUALLY rejects, not what its own
// comments aspire to reject: an anchor embedded inline after "key: " (e.g. `a: &x 1`) is not caught
// by this parser — only a line whose trimmed text itself STARTS with `&`/`*`/`!!`/`<<` is. That is a
// narrower guard than "no anchors anywhere", but it is the real one, and the exporter's own dumper
// never emits an inline anchor in the first place. Testing a case the parser does not actually catch
// would make this file lie about what protection exists.

import assert from 'node:assert/strict'
import { exit } from 'node:process'
import { parse, YamlError } from '../lib/yaml.mjs'

let passed = 0
const failures = []

function test(name, fn) {
  try {
    fn()
    passed += 1
  } catch (err) {
    failures.push({ name, err })
  }
}

function throwsYamlError(fn) {
  assert.throws(fn, YamlError)
}

// ── shapes the grammar must parse ──────────────────────────────────────────────────────────────────

test('nested maps', () => {
  const text = ['a:', '  b:', '    c: 1', '  d: 2'].join('\n')
  assert.deepStrictEqual(parse(text), { a: { b: { c: 1 }, d: 2 } })
})

test('a map of lists-of-maps (the rules: shape: key: then rulekey: then - then field: v)', () => {
  const text = [
    'rules:',
    '  some_key:',
    '    -',
    '      field: v',
    '      other: 2',
    '    -',
    '      field: w',
  ].join('\n')
  assert.deepStrictEqual(parse(text), {
    rules: {
      some_key: [
        { field: 'v', other: 2 },
        { field: 'w' },
      ],
    },
  })
})

test('empty list [] and empty map {}', () => {
  const text = ['a: []', 'b: {}'].join('\n')
  assert.deepStrictEqual(parse(text), { a: [], b: {} })
})

test('a quoted scalar containing a colon and an escaped newline', () => {
  // The colon inside the quotes must not be mistaken for the key/value separator, and the JSON
  // newline escape must decode to an actual newline character, not the two literal characters "\n".
  const text = 'note: "caveat: watch the colon\\nsecond line"'
  assert.deepStrictEqual(parse(text), { note: 'caveat: watch the colon\nsecond line' })
})

test('a bare scalar that looks numeric-ish stays a string (two dots is not a float)', () => {
  const text = 'version: 1.2.3'
  assert.deepStrictEqual(parse(text), { version: '1.2.3' })
})

test('an ordinary bare word stays a string', () => {
  const text = 'family: tone_pillar'
  assert.deepStrictEqual(parse(text), { family: 'tone_pillar' })
})

test('true, false and null (both null spellings)', () => {
  const text = ['a: true', 'b: false', 'c: null', 'd: ~'].join('\n')
  assert.deepStrictEqual(parse(text), { a: true, b: false, c: null, d: null })
})

test('integers and floats, including negatives', () => {
  const text = ['a: 12', 'b: -3', 'c: 1.5', 'd: -0.25'].join('\n')
  assert.deepStrictEqual(parse(text), { a: 12, b: -3, c: 1.5, d: -0.25 })
})

test('comment lines and blank lines are ignored, not just skipped-but-counted', () => {
  const text = ['# a leading comment', '', 'a: 1', '', '# a trailing comment'].join('\n')
  assert.deepStrictEqual(parse(text), { a: 1 })
})

test('an empty file parses to {}', () => {
  assert.deepStrictEqual(parse(''), {})
})

// ── constructs the grammar must refuse, loudly ─────────────────────────────────────────────────────

test('refuses a tab character anywhere on a line', () => {
  throwsYamlError(() => parse('a:\tb'))
})

test('refuses a single-quoted scalar (the exporter only emits double quotes)', () => {
  throwsYamlError(() => parse("a: 'x'"))
})

test('refuses a line whose content is itself an anchor/alias/tag/merge marker', () => {
  // See the file-level comment: this is the actual, narrower guard the parser implements — a bare
  // leading &, *, !! or << on the line, not an anchor buried after "key: ".
  throwsYamlError(() => parse('&anchor: 1'))
  throwsYamlError(() => parse('*alias'))
  throwsYamlError(() => parse('!!str value'))
  throwsYamlError(() => parse('<<: 1'))
})

test('refuses a flow collection with content ([...] or {...} that is not exactly empty)', () => {
  throwsYamlError(() => parse('a: [1, 2]'))
  throwsYamlError(() => parse('a: {b: 1}'))
})

test('refuses a block scalar (the exporter quotes multi-line strings instead)', () => {
  throwsYamlError(() => parse('a: |'))
  throwsYamlError(() => parse('a: >'))
})

test('refuses odd indentation (the exporter emits exactly two spaces per level)', () => {
  throwsYamlError(() => parse('a:\n   b: 1'))
})

test('refuses a sequence item found inside a mapping at the same depth', () => {
  throwsYamlError(() => parse('a: 1\n- 2'))
})

test('refuses an unterminated quoted string', () => {
  throwsYamlError(() => parse('a: "unterminated'))
})

// ── report ─────────────────────────────────────────────────────────────────────────────────────────

if (failures.length > 0) {
  console.error(`selftest: ${failures.length} of ${passed + failures.length} case(s) FAILED.\n`)
  for (const failure of failures) {
    console.error(`FAIL: ${failure.name}`)
    console.error(`  ${failure.err.message}`)
  }
  exit(1)
}

console.log(`selftest: ${passed}/${passed} cases pass.`)
exit(0)
