# IONOS — design rules reference

Checkable standard for the `review.website_po` skill. Distilled from IONOS Style Guide v2.2
(Basics, 2024-06-13), IONOS Brand Identity (Official) and, supplementarily, Digital Ads —
Principles & Practices.

NOT KNOWLEDGE ATOMS, and deliberately so: almost every value below is refused by
`ingest.image_guidelines`' drop rule, which admits only palette and fonts as `visual_tokens`. That
rule is not weakened for the reviewer — this file is how the reviewer gets the rest, whole and
uncapped.

**Precedence.** Style Guide v2.2 governs everything visual/UI on the website, plus form of address.
Brand Identity governs mission, values, claim and positioning. Channel guides (email, social,
publications, partners, events, digital ads, video) govern their own channel only. Newest version
wins.

## Colours

| Name | Hex | Use |
| --- | --- | --- |
| IONOS Blue (B6) | `#003d8f` | Logo on light backgrounds; core brand colour |
| Dark Blue (B7) | `#0b2a63` | Background behind the white logo |
| Dark Midnight (B8) | `#001b41` | Screen text |
| Blue Black (B9) | `#02102b` | End of the Basic Blue gradient |
| Horizon (B3) | `#3196d6` | CTA buttons, text links |
| Link hover (B4) | `#1474c4` | Link hover state |
| Sky | `#11c7e6` | CTA accent |
| B5 | `#095bb1` | Dark-background badges |
| Cool Gray C2 | `#dbe2e8` | Light-background functional badges |

Secondary colours — Amber `#ffaa00`, Rose `#ff6159`, Green `#12cf76`, Purple `#d746f5` — only with
brand-contact approval, sparingly, for spot badges and illustration; preferably one per asset, never
disturbing the hierarchy.

Status colours are functional only: success green `#0fa954`, error red `#c80a00`, warning yellow.

Gradients: Basic Blue runs B6 `#003d8f` -> B9 `#02102b`, preferably at 60° or -60°. Monochrome only
within one colour family, max three steps apart; stronger gradients only between neighbouring
families on the brand colour wheel. Never more than two colours, never more than three steps apart,
never non-adjacent families, and never a gradient over a photo.

No off-palette hex, no rainbow look, no effect or tint that shifts a colour.

## Typography

Two families: **Overpass** for display and headlines (Overpass Mono for code) and **Open Sans** for
titles, body and button text. Base is body3 = 1rem = 16px on desktop; everything scales from it.

| Style | Family / weight | rem | Element |
| --- | --- | --- | --- |
| display1 | Overpass Regular | 3 | Document headline (stage) |
| display2 | Overpass Regular | 2.25 | Section headline |
| display3 | Overpass Semibold | 1.75 | Feature headline (card) |
| display4 | Overpass Regular | 2.5 | Document subheadline |
| display5 | Overpass Regular | 2.25 | Section subheadline |
| display6 | Overpass Semibold | 1.75 | Feature subheadline |
| display8 | Overpass Regular | 1.5 | Pull quote |
| display9 | Open Sans Semibold | 1 | Highlight badge |
| heading1 | Open Sans Semibold | 1.5 | Document title |
| heading2 | Open Sans Semibold | 1.25 | Section title |
| heading3 | Open Sans Bold | 1 | Feature title |
| heading4 / heading5 | Open Sans Bold | 0.75 | Paragraph title / overline, caption title |
| heading6 | Open Sans Semibold | 1 | CTA button |
| body1 | Open Sans Regular | 1.5 | Page lead |
| body2 | Open Sans Regular | 1.25 | Section lead |
| body3 / body4 | Open Sans Regular | 1 | Body long / body short |
| body5 | Open Sans Regular | 0.8 | Caption large |
| body6 | Open Sans Regular | 0.75 | Caption small (legal, metadata) |

Text is always flush left; centring is an exception (CTA buttons, special headlines). Line length
30–80 characters; avoid widows and orphans. Body line-height 125–150%; letter-spacing 0 on body,
looser on captions, tighter on large headlines. **Never all-caps in headlines or body copy** —
all-caps only for scannable phrases of at most three words. Correct glyphs per language (quotation
marks, apostrophe, dash).

## Contrast

WCAG 2.1 AA: body at least 4.5:1, large text at least 3:1. Screen text is `#001b41`. Links `#3196d6`,
hover `#1474c4`. Highlight is B4 on a light background, Sky on a dark one. No gradient text, no
arbitrary hues, no coloured body copy — it kills the functional colours. Callout colours only for
real callouts.

## Logo

`IONOS` always in capitals. Prefer the IONOS Blue `#003d8f` logo; the white logo sits on Dark Blue
`#0b2a63`; black or white only when necessary; never on a busy background. Minimum height 16px on
screen (12px in partner contexts), 3.2mm in print. Clear space wider than the letter "N". Never
transform, outline, shadow, skew or use a retired logo. In the current transition the lockup is
`IONOS by 1&1` for owned channels and DE outbound, `IONOS` for international outbound; suffix set in
Overpass at three quarters of the logo height, original files only.

## Buttons, badges, checkmarks, price tags

- CTA button in Horizon `#3196d6` (or Sky); button text is heading6 (Open Sans Semibold 1rem);
  centred text inside the button is allowed.
- Highlight badges: at most three words, used sparingly. **Price badges are Amber** (`Save 30%`,
  `Gratis`, `Sale`); **value badges are Purple** (`New`, `Recommended`, `50% Faster`, `Easy set-up`);
  functional/neutral badges are C2 on light, B5 on dark. Amber is for price communication only.
- Checkmarks on web: 24px marks against 16px body text; on dark, circle white 15% with a 100% white
  tick; on light, circle B3 at 40% with a 100% B6 tick. Typically 3–4 USPs, centre-aligned.
- Price tags in Open Sans Bold: base text 2X, price 8X, currency symbol and decimals 5X, pre- and
  postline 2X, with X at least 8pt on web. As a premium brand, use price communication selectively —
  the focus is the product and the benefit.
- Icons and illustrations follow the IONOS illustration style; product icons are never isolated
  (overlay only); third-party marks keep their own colours and are never recoloured to blue or grey.

## Brand element, photography, responsiveness

- Nlement / celebrity backdrop: derived from the "N", tilted 26°. In the backdrop N1 is 100% Sky,
  N2 50% Horizon, N3 30% B5, N4 15% Horizon at 20% opacity. Three to five Nlements, entering from
  the lower right corner. The Nlement inside the static logo is never recoloured.
- Photography: authentic, diverse, natural light, calm background, no overstyling, no heavy filters,
  no gradients or text boxes laid over images.
- Responsive: define the 16px desktop base and scale. The style guide names no fixed breakpoints —
  check desktop and mobile separately and check that the two stay consistent.

## Form of address

| Condition | DE | FR |
| --- | --- | --- |
| Default (website, customer comms, ads) | Sie | Vous |
| TikTok, Spotify, influencer content | Du | Tu |
| Customer addresses us informally (care/social) | Du (mirrored) | Tu |

Website rule: **Sie** throughout, for a professional B2B audience. Mixing is a defect. Ads insight:
with tech startups and cloud natives Sie can read as a barrier — the default is still Sie, and any
deviation must be deliberate and held across the whole page.

Sender rule: `Ihr IONOS Team` / `Your IONOS Team` is no longer used as a sender. Depending on the
mailing type the sender is the PSA/KAM (informative, advisory, transactional, benefit-led) or the
CCO (discount-driven sales campaigns). Do not mix PSA with pure discount messaging.

## Naming, claim, voice

- `IONOS` always in capitals — never "Ionos" or "ionos". Product names exactly as the portfolio
  spells them; third-party brands spelled correctly.
- Claim: "Digital an Ihrer Seite" (DE) / "Your digital partner" (EN) / "Votre partenaire digital"
  (FR) / "Tu solución digital" (ES) / "Il tuo partner digitale" (IT).
- Brand values: simple, honest, helpful, reliable. Positioning: premium B2B, consultative — the
  Personal Advisor advises rather than sells.
- Tone: clear, functional, reliable, honest. No hyperbole, no hollow superlatives, no jargon. Short
  readable sentences and scannable structure (checkmark lists of 3–4 USPs instead of walls of text).
- Segments to address distinctly: web pros and agencies, SMB and public sector, micro and small
  businesses, resellers and MSPs, sovereign platform.
