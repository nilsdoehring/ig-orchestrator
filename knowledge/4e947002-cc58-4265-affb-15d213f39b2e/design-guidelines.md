# STRATO — design guidelines

Partition key: `4e947002-cc58-4265-affb-15d213f39b2e` · 60 published atoms

Each line is `(rank) atom`, ranked highest first, followed by the tags that NARROW it. An
axis with no tag shown is `*` and matches every value — so a line with no tags at all is
global on all four axes. A global atom gets NO separate slice: it competes in the same
per-dimension-category cap as every specifically-tagged atom here, ranked together with them.

Headings are the frozen categories for this dimension; a category with nothing published is
omitted. The cap of 12 applies per category AFTER your scope filters these, so the first 12
lines are not the answer.

## color_usage

- (100) Do not use off-palette hex codes, transparency, or effects that shift a color.
- (100) Gradients must never use a third color, another combination, or have a single color used on its own.
- (100) Interactive elements and buttons use Blu1000 Blue with the hex value #272CB2.
- (100) Primary website text uses Blu1100 Dark Blue with the hex value #2F2F70.
- (100) Status colors are strictly functional, never illustrative, and must always be used with their paired Bright background.
- (100) Text placed on the orange gradient must exclusively use Blu1200 with the hex value #29294D.
- (100) The Blue gradient transitions from #2F2F70 to #272CB2.
- (100) The Brand Orange gradient is horizontal, left to right, based on #FF8800.
- (100) The Promo gradient transitions from #25C6EC to #2AF7BB.
- (100) The Value gradient is diagonal, top-left to bottom-right, transitioning from #1FD7FF to #E498FF.
- (100) The error or danger status color is #E20000 and must sit on its Bright background #FFF5F5.
- (100) The hover state for interactive elements and buttons is Blu900 with the hex value #2944CC.
- (100) The pending status color is #FBC000 and must sit on its Bright background #FEF6D1.
- (100) The primary CTA must be exactly one color everywhere on the page.
- (100) The primary brand color is Or1000 Brand Orange with the hex value #FF8800.
- (100) The success status color is #2E8540 and must sit on its Bright background #FBFFF5.
- (90) Body text for internal comms, blogs, and help uses Gr900 Grey with the hex value #555555.
- (90) Highlighted card and tile backgrounds use Blu300 Light Blue with the hex value #EDEEF3.
- (90) Standard card and tile backgrounds use Gr50 Soft Grey with the hex value #F9F9F9.
- (90) Sub-H3 text in text-dense areas uses Blu800 with the hex value #5A6782.
- (90) The dark brand color is Or1100 Dark Orange with the hex value #FF5C00.
- (90) The light brand color is Or800 Light Orange with the hex value #FFC700.
- (90) The soft brand color is Or300 Soft Orange with the hex value #FFEAD3.
- (90) The standard website background is Blu100 Soft Blue with the hex value #F7F7F9.
- (80) The palette includes Gr500 Light Grey with the hex value #BBBBBB.

## typography_scale

- (100) Body text is 16px with a 24px line-height, used as standard body copy and the minimum size for longer text.
- (100) H1 Display text is 64px with an 80px line-height, used for stage headlines and ads.
- (100) H2 Big Section text is 48px with a 64px line-height, used for short headlines.
- (100) H3 Small Section text is 32px with a 48px line-height, used for precise headlines below H2.
- (100) H4 Title text is 24px with a 32px line-height, used for section dividers, price tiles, accordions, and cards.
- (100) Label and small text is 12px with a 16px line-height, used for chips, dividers, footers, legal, and price details.
- (100) The brand typeface is Poppins throughout, using Light, Regular, Semibold, and Bold weights.
- (90) Letter-spacing remains unchanged, specifically set to 0 on body text.
- (90) No line of text may be longer than 80 characters.
- (90) Text must be left-aligned, and centered text must not exceed 90 characters.
- (90) When combining weights in H1-H3 text, skip at least one step, such as pairing Light with Bold.
- (80) Small caps are permitted only for very short phrases.

## components

- (100) Buttons and interactive elements use #272CB2 and change to #2944CC on hover.
- (100) Price tags use 64px for the price and 12px for the supporting line, maintaining a ~5:1 ratio.
- (100) Promo badges use a Promo gradient background and #2F2F70 text reading "NEW", "INCLUSIVE", or "OUR TIP" in capitals.
- (100) Value badges feature an icon on the left or right, max 20 mixed-case characters in #2F2F70, and a Value gradient outline and icon.
- (90) A stage may have a maximum of one promo badge.
- (90) All icons must come from the Font Awesome 6 Pro set and be used consistently.
- (90) For text below 24px, use the standard "check" icon with sufficient contrast instead of "circle-check".
- (90) Large lists of 3 to 4 items use the "circle-check" icon in the text color.
- (90) Main navigation allows one top-level promo disturber and up to three in categories, displayed for a maximum of six weeks.
- (90) Price tags require clear space around them, a calm background, and a structure of regular price, payment rhythm, and fee note.

## logo_and_brand_elements

- (100) The "STRATO" logo must always be in capitals with a minimum on-screen size of 16px.
- (100) The Brand Wave is a stepped, 45°-rotated logo corner moving upward, permitted only in Brand Orange, white, or #F7F7F9.
- (100) The Brand Wave must never cover text and must never cross the edge of the layout.
- (100) The logo must not have any change of shape, color, formatting, shadow, outline, or distortion.
- (90) The logo should preferably be Orange #FF8800 or white rather than black.

## layout_and_responsiveness

- (100) Breakpoints are defined at 1440px, 1200px, 992px, 768px, and mobile.
- (90) The stage background edge angle is fixed at ~6° pointing up, and the stripe is ~5° on web.
- (90) The stage background uses the Brand Orange gradient with a semi-transparent stripe.

## accessibility

- (100) Do not place Blu1100 Dark Blue #2F2F70 or any lighter color on the orange gradient.
- (100) Do not use white text at or below 16px, or any weight lighter than Regular, on Brand Orange or the orange gradient.
- (100) Text to background contrast must meet a minimum ratio of 4.5:1 to satisfy WCAG 2.2.
- (90) Do not mix colors within a single run of text.

## misc

- (90) Where the Style Guide 2024 and Brand Book 2023 disagree on visual or UI rules, the newer Style Guide takes precedence.
