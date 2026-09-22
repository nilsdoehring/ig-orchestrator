@AGENTS.md

Everything that governs work in this repository is in `AGENTS.md`, imported above. Claude Code
v2.1.277+ reads `AGENTS.md` natively, but only when no `CLAUDE.md` is present — this file exists so
the two never disagree, and it must stay a pointer. Do not restate the model here.

Claude-Code-specific, and true only here:

- **Skills.** `skills/assemble/`, `skills/lookup/` and `skills/endpoints/` load automatically when a
  request matches their description, and each is also invocable as `/knowledge-hub:<name>` — the
  frontmatter `name`, not the directory, is the last segment of that command. All three are
  generated; see AGENTS.md, "This repository is generated".
- **There is no `commands/` directory any more.** Its three files documented three of the Hub's six
  endpoints; `skills/endpoints/` documents all six and reaches surfaces a flat command file does not
  (a plugin's skills work in Claude Code, claude.ai web chat and the Claude Desktop Chat tab). They
  remain notes, not scripts: they describe a request to make, and none of them runs a model.
- **`.claude/` is project scope, not plugin scope.** A plugin installer never sees it. Anything that
  has to reach an installer belongs in `skills/`, which the generator owns — so it has to be emitted
  by `unima:kh:publish-agent-repo`, not placed here by hand.
