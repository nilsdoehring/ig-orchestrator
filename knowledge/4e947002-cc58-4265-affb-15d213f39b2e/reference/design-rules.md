# STRATO — design rules reference

Checkable standard for the `review.website_po` skill. Distilled from STRATO Style Guide v1.0 (BLUE,
2024-12-03) and STRATO Brand Book (05/2023).

NOT KNOWLEDGE ATOMS, and deliberately so: almost every value below is refused by
`ingest.image_guidelines`' drop rule, which admits only palette and fonts as `visual_tokens`. That
rule is not weakened for the reviewer — this file is how the reviewer gets the rest, whole and
uncapped.

**Precedence.** Style Guide 2024 governs everything visual/UI and the form of address. Brand Book
2023 governs tone of voice, personas, brand values and name spelling. Where the two disagree on the
same subject, the newer Style Guide wins.

## Colours

| Role | Name | Hex |
| --- | --- | --- |
| Brand / primary | Or1000 Brand Orange | `#FF8800` |
| | Or1100 Dark Orange | `#FF5C00` |
| | Or800 Light Orange | `#FFC700` |
| | Or300 Soft Orange | `#FFEAD3` |
| Interactive, buttons | Blu1000 Blue | `#272CB2` |
| Hover | Blu900 | `#2944CC` |
| Primary website text | Blu1100 Dark Blue | `#2F2F70` |
| Text on orange gradient (only) | Blu1200 | `#29294D` |
| Sub-H3 text in text-dense areas | Blu800 | `#5A6782` |
| Highlighted card/tile background | Blu300 Light Blue | `#EDEEF3` |
| Website background | Blu100 Soft Blue | `#F7F7F9` |
| Body text, internal comms/blog/help | Gr900 Grey | `#555555` |
| | Gr500 Light Grey | `#BBBBBB` |
| Card/tile background | Gr50 Soft Grey | `#F9F9F9` |

Status colours are functional only, never illustrative, and each is paired with the Bright tint it
sits on: success `#2E8540` on `#FBFFF5`, error/danger `#E20000` on `#FFF5F5`, pending `#FBC000` on
`#FEF6D1`. A status message using the foreground colour without its Bright background is a deviation
— which is exactly the kind of thing a reviewer cannot flag if only the foreground is on file.

Gradients exist only as defined pairs: Brand Orange (horizontal, left to right, based on `#FF8800`);
Blue `#2F2F70` -> `#272CB2`; Value `#1FD7FF` -> `#E498FF` (diagonal, top-left to bottom-right);
Promo `#25C6EC` -> `#2AF7BB`. Never a
third colour, never another combination, never a gradient's single colour used on its own.

No off-palette hex. No transparency or effect that shifts a colour. Same meaning, same colour — the
primary CTA is one colour everywhere on the page.

## Typography

Poppins throughout (Light, Regular, Semibold, Bold).

| Style | Size / line-height | Use |
| --- | --- | --- |
| H1 / Display | 64 / 80 | Stage headlines, ads |
| H2 / Big Section | 48 / 64 | Short headlines |
| H3 / Small Section | 32 / 48 | Precise headlines below H2 |
| H4 / Title | 24 / 32 | Section dividers, price tiles, accordions, cards |
| Body | 16 / 24 | Standard body copy, minimum for longer text |
| Label / small | 12 / 16 | Chips, dividers, footer, legal and price detail |

Line-heights as assigned. Letter-spacing unchanged (0 on body). When combining weights, skip at
least one step (e.g. Light with Bold) — H1–H3 only. Text left-aligned. No centred text longer than
90 characters. No line longer than 80 characters. Small caps only for very short phrases.

## Contrast

Minimum 4.5:1 text to background (WCAG 2.2). Text on the Brand Orange gradient is `#29294D` only.
No white text at or below 16px, and no weight lighter than Regular, on Brand Orange or the orange
gradient (contrast is 2.39:1). Do not place `#2F2F70` or lighter on the orange gradient. Do not mix
colours within a run of text.

## Buttons, badges, price tags, icons

- Buttons and interactive elements `#272CB2`; hover `#2944CC`.
- Price tags: price 64px, supporting line 12px (~5:1). Clear space around, calm background.
  Structure: regular price + payment rhythm + fee note.
- Value badge: icon left or right, text `#2F2F70`, max 20 characters, mixed case, outline and icon
  in the Value gradient.
- Promo badge: text is `NEW`, `INCLUSIVE` or `OUR TIP` (or its localised equivalent) in capitals,
  Promo gradient background, text `#2F2F70`. Max one badge on the stage. In main navigation: one
  top-level disturber, up to three in categories, max six weeks.
- Checkmarks: `circle-check` for large lists (3, max 4 items), icon in the text colour; below 24px
  text use the `check` icon with sufficient contrast.
- Icons come from one set (Font Awesome 6 Pro), used consistently.

## Layout and brand elements

- Breakpoints 1440 / 1200 / 992 / 768 and mobile — the basis for the desktop-vs-mobile check.
- Brand Wave (the stepped, 45°-rotated logo corner, moving upward): Brand Orange, white or `#F7F7F9`
  only. Never covers text, never crosses the edge.
- Stage background: Brand Orange gradient with a semi-transparent stripe. Edge angle ~6°, stripe ~5°
  on web. Angles are fixed; the edge always points up.
- Logo: `STRATO` always in capitals, minimum 16px on screen, no change of shape, colour or
  formatting, no shadow, outline or distortion. Orange `#FF8800` or white preferred over black.

## Form of address (DE)

Website, shop, advertising and customer communication use **Sie**, consistently. Social media,
careers and blog use **Du**. Mixing Sie and Du on one page is a defect. A landing page aimed at a
younger audience may deliberately use Du — then check that Du is held across the whole page and
report it as a deliberate deviation, not an error.

## Naming

`STRATO` always in capitals, never "Strato" or "strato". No hyphen when combined with a product name
("STRATO Mail-Archivierung", "STRATO HiDrive" — not "STRATO-Server"). The company speaks as "wir",
not about itself in the third person.

## Tone of voice

Fresh, lively, unconventional, explaining rather than lecturing, at eye level, direct address,
vivid, close to the customer, no tech-speak. Pace comes from short, precise sentences — no nested
clauses.

Avoid: the modal verbs "möchten, müssen, können, würden"; asterisked small print or hidden extra
costs; too many anglicisms; the filler words "ja, halt, auch, doch, schon, denn, etwa, nur, bloß,
eben, mal, gar, ruhig, eigentlich, eh, nun, erstmal, gleich, zumindest, wohl, durchaus, sicher".

Prioritise customer benefit over a bare feature list; explain a technical term or flag it before
abbreviating it; keep structure clear and scannable.

## Gender-inclusive language

Websites and landing pages use gender-neutral phrasing or the paired form ("Kundinnen und Kunden")
in preference to the generic masculine: neutral plurals ("Führungskräfte", "Teilnehmende"),
nominalised participles ("Nutzende"), plural over singular ("alle" over "jeder"), the thing over the
person ("die Kundschaft"), neutral role names ("Leitung", "Team"). No gender star on websites —
recruiting and employer branding are the only exception.
