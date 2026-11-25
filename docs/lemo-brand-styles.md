# lemo-opuscar brand styles

Primary video engine: [lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) (MIT, 66 styles). Each brand gets one base style and a colour mapping in `brands/<brand>/lemo.json` (see `brands/_example/lemo.json`). Remotion stays for phone-UI templates, overlays and assembly.

## How to pick a brand's style
1. Match the subject first: software and AI fit `dark-keynote` or `living-screencast`; physical products fit `glass-product`; playful retail fits `memphis-diorama`; luxury services fit `art-deco`; collage-style ads fit `risograph`.
2. Keep the style's own colour logic (light and dark structure, number of inks or accents) and put the brand colour where that logic allows: usually the one accent, the key number and the call to action.
3. If the style forbids the brand colour, write it down as an open decision for the owner instead of forcing it.
4. List 2 `alt_styles` for the style board, so the owner still chooses by looking.

## First film per brand
Render one style frame and check that the Kurdish or Arabic font shapes letters correctly and that text runs right to left, before any full render.
