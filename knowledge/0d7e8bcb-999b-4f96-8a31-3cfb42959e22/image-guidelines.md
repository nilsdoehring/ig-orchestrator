# IONOS — image guidelines

Partition key: `0d7e8bcb-999b-4f96-8a31-3cfb42959e22` · 52 published atoms

Each line is `(rank) atom`, ranked highest first, followed by the tags that NARROW it. An
axis with no tag shown is `*` and matches every value — so a line with no tags at all is
global on all four axes. A global atom gets NO separate slice: it competes in the same
per-dimension-category cap as every specifically-tagged atom here, ranked together with them.

Headings are the frozen categories for this dimension; a category with nothing published is
omitted. The cap of 12 applies per category AFTER your scope filters these, so the first 12
lines are not the answer.

## photographic_style

- (100) Imagery should feel professional, optimistic, and bright, featuring confident people in lived-in, warm environments, never dark or moody.
- (90) Give characters a mid-shift appearance with functional workwear, effortless hair, and genuine expressions focused on tasks.
- (90) Imagery must feel professional, warm, and optimistic, using bright, airy, and uplifting aesthetics rather than dark, moody, or dramatically shadowed treatments.
- (90) Show lived-in environments with appropriate disorder, where characters actively hold or engage with profession-relevant items.
- (90) Use bright, natural, varied lighting (5000-6500K) with clear tonal contrast, avoiding flat lighting or default golden-hour treatments.
- (80) Use natural, varied lighting between 5000–6500K, such as cool-neutral morning light for offices or bright window light for cafes, ensuring clear subject contrast.
- (70) Never specify camera equipment or brand names in prompts, allowing the model to draw naturally from its photographic repertoire.

## composition_and_framing

- (100) Backgrounds must be solid brand colors or two-stop gradients, never technical grid lines, dot patterns, sweeping curves, or geometric line-art.
- (100) The input pop-out must overlap the main frame's left edge by 25-40% of its own width, never floating clear or fully enclosed.
- (90) Always state face and body framing positively in the prompt, such as 'full body in frame from head to floor', because negative prompts are weak composition signals.
- (90) Always state framing positively (e.g., "full body in frame from head to floor"), as negative prompts are weak against center-crop bias.
- (90) Center a single unambiguous subject on a plain, evenly lit, high-contrast background without semi-transparent elements for clean alpha matting.
- (90) Default to a full-body long shot of a subject engaged mid-action in their environment, avoiding posed or symmetrical framing.
- (90) Focus sharply on the product or device screen, keeping people cropped, blurred, or backgrounded with faces out of focus.
- (90) For avatar images, use a 1:1 crop where the face is 100% visible from full forehead to chin, varying the shot distance and camera angle across generations.
- (90) For avatars, use a square crop with the face 100% visible from forehead to chin, varying the shot distance and camera angle.
- (90) For cutout assets, center a single clear subject on a plain, evenly lit, high-contrast background to ensure an unambiguous silhouette for the matting model.
- (90) For feature highlights, place a dense, dark navy main output frame center-right, overlapped on its left edge by a smaller, light-colored input pop-out.
- (90) In product-focused scenario images, the screen or device is the hero in sharp focus, while people must be cropped, blurred, or backgrounded with faces not visible.
- (90) Person-scenario images default to a head-to-floor long shot showing the subject mid-action in their environment, avoiding symmetrical framing or plain backdrops.
- (90) Place the dense output result in the center-right main frame, with a light-themed user-input pop-out overlapping its left edge by 25-40%.
- (90) Use solid flat brand colors or two-stop gradients, avoiding technical grid lines, dot grids, or decorative geometric paths.
- (90) When a UI component specifies a side, anchor the subject in that third of the frame with their body and gaze angled slightly toward the opposite text column.
- (80) Account for center-crop bias by adjusting subject positioning to keep key elements in the surviving central band, as landscape targets trim top/bottom and portraits trim sides.
- (80) Anchor the subject in the third opposite the text column, angling their body and gaze slightly toward the text.
- (80) Compose with three depth planes: a colorful foreground bokeh, a sharp mid-ground subject, and a softly blurred, dense background.
- (80) Environments must feel lived-in with appropriate density and disorder, using three planes of depth: colorful foreground bokeh, a sharp subject, and a softly blurred background.
- (80) For 'Celebrity Backdrop' compositions, feature scaled N-shaped elements with a 26-degree inclination protruding from the lower right of the frame.
- (80) For customer testimonial images, leave a calm, dead-center negative-space region clear for overlaid quote cards, avoiding tight face close-ups.
- (70) Create a "Celebrity Backdrop" using scaled N-elements with a 26-degree inclination protruding from the lower right of the composition.

## subject_and_diversity

- (90) Always explicitly encode character demographics positively early in the prompt, defaulting to working adults in their 30s to 50s unless context dictates otherwise.
- (90) Characters must show a mid-shift appearance with effortlessly worn hair, functional workwear, and genuine expressions, actively holding or engaging with relevant items.
- (80) Default ethnicity pools favor White/Northern-European and Black, but for Spain and Italy, specify 'olive complexion and dark hair' instead of 'Latino'.
- (80) Match body shapes to roles by specifying 'stocky' or 'solid, muscular build' for manual trades, and 'average' or 'lean build' for office work.

## color_direction

- (100) For AI features, use a static 45-degree linear gradient from blue (#095BB1) to magenta (#D746F5), never for ordinary CTAs.
- (90) Anchor compositions with IONOS Blue #003D8F and Dark Midnight #001B41, using Cloud #F4F7FA and White #FFFFFF strictly as backgrounds.
- (90) Keep backgrounds in warm neutrals like cream, sand, or light wood, while using two to three saturated accent colors like cobalt, terracotta, or mustard for props.
- (90) Only apply the IONOS brand colors (#003D8F, #11C7E6) when explicitly requested; otherwise, let natural object and environment colors drive the palette.
- (90) Represent AI generating states with a slow-oscillating subtle gradient from light pink (#FAE7FE) to white (#FFFFFF).
- (90) Use Sky #11C7E6 exclusively as a directional signal for focal elements like a single CTA, never as decorative noise.
- (90) Use Sky (#11C7E6) as a directional accent for focal elements like CTAs, limiting it to one per section to avoid visual noise.
- (80) Secondary colors like Amber (#FFAA00) or Purple (#D746F5) require brand blues to dominate over 60% of the color space.
- (80) Use warm neutral backgrounds and 2-3 saturated accent props, applying brand blues only if explicitly requested by the brief.

## visual_tokens

- (100) AI features use a static 45-degree gradient from blue #095BB1 to magenta #D746F5, or a subtle gradient from light purple #FAE7FE to white #FFFFFF.
- (100) Lead with IONOS Blue (#003D8F) and Dark Midnight (#001B41) to anchor the brand, using Cloud (#F4F7FA) and White (#FFFFFF) strictly for backgrounds.
- (100) Primary brand colors are IONOS Blue #003D8F, Sky #11C7E6, Dark Blue #0B2A63, Dark Midnight #001B41, Cloud #F4F7FA, Blue Black #02102B, and White #FFFFFF.
- (100) The all-caps IONOS logo must be unmodified, placed on IONOS Blue (#003D8F) if light, or white on Dark Blue (#0B2A63) if dark.
- (90) Secondary colors Amber #FFAA00, Purple #D746F5, Green #12CF76, and Rose #FF6159 may only be used when brand blues dominate over 60% of the color space.
- (90) Use Overpass (fallback sans-serif) for headlines, Open Sans (fallback sans-serif) for body text, and Overpass Mono (fallback monospace) for code.
- (90) Use Overpass for impactful headlines and Open Sans for informative body text, never mixing them within the same text block.

## misc

- (90) No text, watermarks, UI chrome, distorted hands, logos, dark moody lighting, flat shadowless lighting, and all-grey palettes.
- (80) Construct prompts in a strict order: face anchor and camera distance first, then character details, background density, lighting, natural appearance, and photography style.
