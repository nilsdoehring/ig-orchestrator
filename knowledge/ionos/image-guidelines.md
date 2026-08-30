# IONOS — image guidelines

Brand partition key: `0d7e8bcb-999b-4f96-8a31-3cfb42959e22`

Categories are the frozen vocabulary for this dimension. The number after each atom is its
rank; only the top 12 per category reach a prompt.

## photographic_style

- (90) Imagery must feel professional, warm, and optimistic, using bright, airy, and uplifting aesthetics rather than dark, moody, or dramatically shadowed treatments.
- (80) Use natural, varied lighting between 5000–6500K, such as cool-neutral morning light for offices or bright window light for cafes, ensuring clear subject contrast.
- (70) Never specify camera equipment or brand names in prompts, allowing the model to draw naturally from its photographic repertoire.

## composition_and_framing

- (100) Backgrounds must be solid brand colors or two-stop gradients, never technical grid lines, dot patterns, sweeping curves, or geometric line-art.
- (100) The input pop-out must overlap the main frame's left edge by 25-40% of its own width, never floating clear or fully enclosed.
- (90) For avatar images, use a 1:1 crop where the face is 100% visible from full forehead to chin, varying the shot distance and camera angle across generations.
- (90) Person-scenario images default to a head-to-floor long shot showing the subject mid-action in their environment, avoiding symmetrical framing or plain backdrops.
- (90) In product-focused scenario images, the screen or device is the hero in sharp focus, while people must be cropped, blurred, or backgrounded with faces not visible.
- (90) When a UI component specifies a side, anchor the subject in that third of the frame with their body and gaze angled slightly toward the opposite text column.
- (90) Always state face and body framing positively in the prompt, such as 'full body in frame from head to floor', because negative prompts are weak composition signals.
- (90) For cutout assets, center a single clear subject on a plain, evenly lit, high-contrast background to ensure an unambiguous silhouette for the matting model.
- (90) For feature highlights, place a dense, dark navy main output frame center-right, overlapped on its left edge by a smaller, light-colored input pop-out.
- (80) For 'Celebrity Backdrop' compositions, feature scaled N-shaped elements with a 26-degree inclination protruding from the lower right of the frame.
- (80) Account for center-crop bias by adjusting subject positioning to keep key elements in the surviving central band, as landscape targets trim top/bottom and portraits trim sides.
- (80) Environments must feel lived-in with appropriate density and disorder, using three planes of depth: colorful foreground bokeh, a sharp subject, and a softly blurred background.
- (80) For customer testimonial images, leave a calm, dead-center negative-space region clear for overlaid quote cards, avoiding tight face close-ups.

## subject_and_diversity

- (90) Always explicitly encode character demographics positively early in the prompt, defaulting to working adults in their 30s to 50s unless context dictates otherwise.
- (90) Characters must show a mid-shift appearance with effortlessly worn hair, functional workwear, and genuine expressions, actively holding or engaging with relevant items.
- (80) Match body shapes to roles by specifying 'stocky' or 'solid, muscular build' for manual trades, and 'average' or 'lean build' for office work.
- (80) Default ethnicity pools favor White/Northern-European and Black, but for Spain and Italy, specify 'olive complexion and dark hair' instead of 'Latino'.

## color_direction

- (90) Keep backgrounds in warm neutrals like cream, sand, or light wood, while using two to three saturated accent colors like cobalt, terracotta, or mustard for props.
- (90) Only apply the IONOS brand colors (#003D8F, #11C7E6) when explicitly requested; otherwise, let natural object and environment colors drive the palette.
- (90) Anchor compositions with IONOS Blue #003D8F and Dark Midnight #001B41, using Cloud #F4F7FA and White #FFFFFF strictly as backgrounds.
- (90) Use Sky #11C7E6 exclusively as a directional signal for focal elements like a single CTA, never as decorative noise.

## visual_tokens

- (100) Primary brand colors are IONOS Blue #003D8F, Sky #11C7E6, Dark Blue #0B2A63, Dark Midnight #001B41, Cloud #F4F7FA, Blue Black #02102B, and White #FFFFFF.
- (100) AI features use a static 45-degree gradient from blue #095BB1 to magenta #D746F5, or a subtle gradient from light purple #FAE7FE to white #FFFFFF.
- (90) Secondary colors Amber #FFAA00, Purple #D746F5, Green #12CF76, and Rose #FF6159 may only be used when brand blues dominate over 60% of the color space.
- (90) Use Overpass (fallback sans-serif) for headlines, Open Sans (fallback sans-serif) for body text, and Overpass Mono (fallback monospace) for code.

## misc

- (90) Always include a standard negative prompt blocking text, watermarks, UI chrome, distorted hands, logos, dark moody lighting, flat shadowless lighting, and all-grey palettes.
- (80) Construct prompts in a strict order: face anchor and camera distance first, then character details, background density, lighting, natural appearance, and photography style.
