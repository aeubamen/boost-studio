---
name: studio-video
description: Build and render a 9:16 motion video (Remotion) from the toolkit's templates - phone UI stories, product-to-box-to-map delivery, app-install demos - in the brand's colours and fonts, with sound effects and quiet music. Use for "make a video", "motion", "reel".
---

# studio-video

**Templates** are in `templates/video/`:
- `starter-story`: neutral 15 s phone-chat story (hook, chat, button, end card). Configure it in `src/brand.ts`.
Copy it to a working folder, run `npm i`, edit, then render. Add more templates as you build them (phone-UI flows, delivery maps, app-install demos).

**Workflow.** (1) script with `studio-script`; (2) build; (3) check text-only first (`npx tsc --noEmit`), then 1-2 low-scale stills (`npx remotion still ... --scale=0.3`); (4) full render only at the end: `npx remotion render src/index.ts <CompId> out/<name>.mp4 --concurrency=4`.

**Rules.** RTL text, brand font from the brand folder, keep important content out of the bottom ~250px and top ~150px (Instagram UI). Real UI and real product data only; no invented prices or claims. Sound effects come from the user's own `public/audio` folder (see `templates/video/AUDIO.md`); never redistribute them. Always keep earlier versions; name new ones v2, v3.
