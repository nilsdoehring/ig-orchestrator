# The frozen vocabulary

Seven dimensions, each owning its own categories, each ending in `misc`. An atom declares
its dimension and category; nothing computes them at read time.

`misc` is for material that belongs to THIS dimension and fits no category. It is not a
dumping ground for what another dimension should hold — that gets dropped at intake.

An appetite entry is one of these strings, or `<dimension>/*` for a whole dimension.

## `brand identity`

what is TRUE about the brand — the claims a writer must not contradict.

- `brand identity/brand_context`
- `brand identity/personality`
- `brand identity/benefits`
- `brand identity/misc`

## `writing & tone`

HOW to write, in a form that survives translation.

- `writing & tone/voice_register`
- `writing & tone/web_readability`
- `writing & tone/ux_microcopy`
- `writing & tone/cta_conventions`
- `writing & tone/audience_framing`
- `writing & tone/misc`

## `product`

what a product is, why it wins, and what may not be claimed about it.

- `product/description`
- `product/value_proposition`
- `product/differentiators`
- `product/proof_points`
- `product/claim_constraints`
- `product/misc`

## `language`

grammar, orthography, terminology and locale conventions.

- `language/terminology`
- `language/formatting_conventions`
- `language/orthography_typography`
- `language/address_and_gender_form`
- `language/market_variants`
- `language/misc`

## `image guidelines`

what an image-prompt writer needs and a copywriter never sees.

- `image guidelines/photographic_style`
- `image guidelines/composition_and_framing`
- `image guidelines/subject_and_diversity`
- `image guidelines/color_direction`
- `image guidelines/visual_tokens`
- `image guidelines/misc`

## `design guidelines`

the exact, checkable design-system values a finished page is reviewed against.

- `design guidelines/color_usage`
- `design guidelines/typography_scale`
- `design guidelines/components`
- `design guidelines/logo_and_brand_elements`
- `design guidelines/layout_and_responsiveness`
- `design guidelines/accessibility`
- `design guidelines/misc`

## `target group`

who we write to, and what moves them.

Emitted **last** (override rank 1 of 2), and one of the two dimensions whose atoms override the
base ones — by that ordering plus one sentence, never by a resolver. Target group is emitted
before platforms, so the surface has the final word.

- `target group/segment_definition`
- `target group/needs_and_pains`
- `target group/decision_drivers`
- `target group/addressing_the_segment`
- `target group/misc`

## `platforms`

per-surface practice — the only atoms that override others.

Emitted **last** (override rank 2 of 2), and one of the two dimensions whose atoms override the
base ones — by that ordering plus one sentence, never by a resolver. Target group is emitted
before platforms, so the surface has the final word.

- `platforms/format_constraints`
- `platforms/register_override`
- `platforms/platform_conventions`
- `platforms/misc`

