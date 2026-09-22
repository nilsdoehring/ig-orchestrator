---
name: lookup
description: List the legal product, language, platform and target-group values for a brand held in this repository. Use before scoping a prompt, before tagging an atom, or when a scope value returned nothing.
---

# Entry vocabulary

Four axes: `product`, `language`, `platform`, `target_group`. Every brand has its own; one brand's product names are not another's.

Read `knowledge/<partition key>/entries.md`. Partition keys are listed in
`knowledge/brands.md`. When this plugin is INSTALLED rather than cloned, that path is
`${CLAUDE_PLUGIN_ROOT}/knowledge/<partition key>/entries.md` — see the note at the end.

## What these values are for

They are the only legal values of a `scope`, and the only legal values of an atom's tag.
A scope naming something absent from this list does not error: it matches nothing, and you
get a prompt built from fewer atoms than you expected, with no warning. That silence is
the reason to read the list first.

`*` is not in these lists and never will be. It is the marker meaning "applies to
every value on this axis", and it is a property of an ATOM's tag, not a value a brand
owns. Do not put it in a vocabulary and do not scope by it.

## Which axis holds what

- **product** — the brand's own product names, verbatim.
- **language** — locale codes (`de-DE`, `en-GB`), never bare language codes. A bare `de`
  matches nothing, silently.
- **platform** — surfaces. Some are shared across every brand in the account rather than
  owned by one brand; both appear here because both are legal for this brand.
- **target_group** — audience-segment keys. Labels are deduplicated: several keys can
  share one label, so match on the key.

## Paths, when installed

A plugin installed from a marketplace does not live in your project directory. Address
every file in this repository through `${CLAUDE_PLUGIN_ROOT}`, which is the absolute path
to the plugin's own installation directory. It CHANGES on every plugin update, so resolve
it each time and never cache the absolute result.
