---
name: studio-video
description: Build and render a 9:16 motion video (Remotion) from the toolkit's templates - phone UI stories, product-to-box-to-map delivery, app-install demos - in the brand's colours and fonts, with sound effects and quiet music. Use for "make a video", "motion", "reel".
---

# studio-video

**New reels start with `studio-brief`**: ask first, show the style board, lock the picks, then build here.

**Templates** are in `templates/video/`:
Copy a template to a working folder, link `node_modules` (or run `npm i`), then edit `src/*.tsx` constants (`T` timeline, copy strings, brand colours).

**Workflow.** (1) script with `studio-script`; (2) build; (3) check text-only first (`npx tsc --noEmit`), then 1-2 low-scale stills (`npx remotion still ... --scale=0.3`); (4) full render only at the end: `npx remotion render src/index.ts <CompId> out/<name>.mp4 --concurrency=4`.

**Engine: lemo-opuscar is primary.** Every video starts here. Read `brands/<brand>/lemo.json`: it names the brand's own lemo style (base style, brand colour roles, fonts, open decisions) and doubles as the answers to lemo's one round of questions. Invoke the `lemo-opuscar` skill with it; it writes a treatment, builds the film in code and delivers an mp4 in the project folder. How to pick a brand's style: `docs/lemo-brand-styles.md`. Use another style only when the owner asks, or a brief needs one the brand style cannot do (`alt_styles` in `lemo.json`).

**Other creation tools are options, not the default**, used only when lemo cannot do the job:
- **Remotion** (`tools/remotion`, `templates/video/`): phone-UI and app-flow templates, assembling and retiming (a lemo mp4 goes in as a clip with `OffthreadVideo`), visual timeline editing (`npm run studio`).
- **HyperFrames**: transparent layers (`--format webm`, `HFLayer`), caption overlays, a look lemo has no style for.
- Others (motion-prompt, motionvideo references, shotcraft, vox-director): reference or special cases; ask the owner before paid steps.
lemo films are finished pictures, not transparent layers. Its voice and music steps cost credits or download models: ask first. Studio rules apply on top: brand rules, retention gates, `studio-review`, no posting without the owner's yes.

**With lemo-opuscar:** run G1 on the script before it writes the treatment; copy the beats of its `TREATMENT.md` into `plan.json` (G2) before the build; run G4 and `studio-review` on the delivered mp4. Fix by going back to the treatment or the style timings, not by patching the mp4.

**Retention gates.** G2 on `plan.json` before the first still, G3 before the full render, G4 on the finished file (`tools/retention/gate.mjs`); anything but a pass means back, fix, run again (2 rounds, then ask the owner). Plan the beat map with `studio-retention` before building: a cut or motion change at every turn, no unchanged shot over about 3 s, payoff hold, short last-shot CTA.

**Motion craft.** For timing and feel read `skills/motionmaxxing` (measured eases and durations: a typical move is about 0.33 s, landings slow down, exits speed up, overshoot under 9%, cut on motion, end on a short quiet hold) and `motion-doctrine`/`seam-craft`/`cut-the-curve`. Use these as rules for scenes made in HyperFrames or plain HTML. Its voice, image and site-capture scripts call paid or online services: ask the owner first.

**Review before showing.** After every render run `studio-review` (`node tools/render-check/check.mjs <file> --expect-audio --expect-duration <s>`). Present only a pass.

**Rules.** RTL text, brand font from the brand folder, keep important content out of the bottom ~250px and top ~150px (Instagram UI). Real UI and real product data only; no invented prices or claims. Sound effects come from the user's own `public/audio` folder (see `templates/video/AUDIO.md`); do not redistribute them. Always keep earlier versions; name new ones v2, v3.
