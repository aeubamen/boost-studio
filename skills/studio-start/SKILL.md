---
name: studio-start
description: Entry point for the boost-studio toolkit. Use when the user says "studio", "make content for <brand>", "start a post/video", or is unsure which studio-* skill to use. Picks the brand and the working mode, then hands off.
---

# studio-start

1. **Brand.** Ask which brand (the folders under brands/) unless the folder or request makes it obvious. Load `brands/<brand>/brand.json` and `brands/<brand>/voice.md` from the toolkit repo (default `~/boost-studio`). Never invent anything marked TODO.
2. **Mode.** Offer exactly these three and remember the answer for the session:
   - **manual**: Claude writes and renders; the user posts by hand.
   - **assisted**: Claude also previews the exact caption, account and time; the user posts.
   - **scheduled**: after an explicit "yes" on each item, publish or queue through PostZen (`studio-publish`).
3. **Route** the goal:
   - find ideas or competitor patterns -> `studio-research`
   - hook, script, beat sheet -> `studio-script`
   - caption or hashtags -> `studio-caption`
   - weekly plan -> `studio-plan`
   - animated video -> `studio-video`
   - recorded voice or footage -> `studio-transcribe`
   - post it -> `studio-publish`
4. Language defaults come from `brand.json` (Kurdish Sorani, RTL, unless stated). Flag every Kurdish line as "draft, needs native review".
