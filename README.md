# Agent Repo

A generated, private snapshot of one Unima team's writing-knowledge corpus and the offline tooling
to resolve it — the same rule cascade and n8n prompt-assembly logic Unima runs internally, usable from
a plain `git clone` with no network call, no Unima login, and no install step (`node scripts/...` runs
immediately; see `AGENTS.md` for why zero dependencies matters here).

If you are an agent (Claude Code or otherwise) working in this repo, start at `AGENTS.md` — it is the
real entry point and this file does not repeat it.

## Who owns which part

| Path | Owner | Change it by |
|---|---|---|
| `knowledge/`, `briefing/`, `prompts/` | The team's corpus authors, in Unima | Editing the knowledge rows / briefing / prompts in Unima, then re-publishing |
| `design/photography/` | Same corpus, photography discipline | Same as above |
| `design/statements/` | Same corpus — **quarantined migrated brand prose.** Contains colour values, font names and measurements, because the image-generation workflow reads it and has nothing else to read. Image-prompt assembly only; never copy, never a source of design truth | Same as above |
| `lib/`, `scripts/`, `.claude/`, `.github/` | This repo's tooling, authored in Unima's `integrations/agent-repo/template/` | Editing that template in the Unima codebase, then re-publishing |
| `MANIFEST.yaml`, `VERSION` | Nobody — derived | Never edited directly; they are the hash of everything else |

## Generated — do not hand-edit

Every file in this tree is written by Unima's `unima:knowledge:publish-agent-repo` command in one
run, and `MANIFEST.yaml` lists the sha256 of every one of them. CI recomputes those hashes on every
push and fails if a listed file no longer matches — so a hand-edit here does not survive review, and
even if it did, the next publish overwrites it silently.

This is a deliberate design, not an oversight: there is exactly **one writable home** for any given
change — the corpus in Unima for content, `integrations/agent-repo/template/` in Unima for tooling —
and a second writable copy of the same fact is how the two quietly diverge. If something here is
wrong, the fix belongs upstream.

## Opening a bundle PR

Unima opens the PR against this repo itself, one per publish, containing the new bundle as a diff
against the current tree. Reviewing one:

1. Check that `VERSION` changed. If the diff touches any file but `VERSION` is unchanged, something is
   wrong with the publish — say so rather than merging.
2. Read the diff itself; `knowledge/rules/<family>.md` and `design/photography/rules.md` are the
   human-readable form of the same rows `knowledge/rules/index.yaml` carries, so a content change is
   readable directly in the PR.
3. Confirm CI's manifest check passed. It is the proof that what got committed is exactly what the
   publish command produced — nothing hand-adjusted on the way in.
4. Merge. There is nothing else to reconcile — this repo has no other branch doing independent work
   on these paths, by construction.

## `MANIFEST.yaml` and `VERSION`

`MANIFEST.yaml` is every path in the tree (except itself and `VERSION`) mapped to the sha256 of its
bytes. `VERSION` is the sha256 of `MANIFEST.yaml`, truncated to 12 hex characters — a hash of hashes,
so it changes if and only if some file's bytes changed.

That makes `VERSION` a **content hash, not a build counter**: publishing the same corpus twice
produces the same `VERSION` both times, and the second publish is a no-op rather than an empty commit
that churns history for no reason. If you ever see `VERSION` change with no visible diff, look harder
— some file changed in a way the diff view is hiding (whitespace, line endings), because the hash does
not lie.
