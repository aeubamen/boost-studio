---
name: studio-experiments
description: Run a content test program: 10 ideas x 5 variants (hook, production, voiceover, whole concept) posted as Instagram trial reels, measured with real insights, to learn which factors raise success for a brand. Use for "test variants", "which hook works", "50 content test", "trial reels", or when continuing an experiment file in brands/<brand>/experiments/.
---

# studio-experiments

**The owner's method (2026-11-18):** trial reels are for testing video production. Pick 10 content ideas, make 5 variants of each (50 pieces), vary hook, production, voiceover and the whole concept, post trial reels BY HAND (the API cannot), read the numbers, and use what wins for future content. This skill is how the studio runs that, and how a session continues it.

## The design (one control, four single changes)
Per idea, 5 variants (letters A-E):
| | Role | What changes (everything else equals A) |
|---|---|---|
| A | control | plain-statement hook, the brand's lemo style, the brand voice |
| B | hook | only the first ~3 s: a question or twist hook |
| C | production | a different visual production: one of the brand's `alt_styles` (`brands/<brand>/lemo.json`) or a Remotion UI/screen-recording version |
| D | voiceover | another voice (or no voice: captions + music/effects only) |
| E | concept | a different angle: new story, structure and opening for the same topic |
Because B-E each change one thing versus A inside the same idea, the difference is the effect of that factor. Repeating over 10 ideas separates a real effect from luck. Never change two things in one variant (except E, which is a different concept on purpose).

## Files
- Plan and tracking: `brands/<brand>/experiments/<id>.json` (ideas, variants, status, queue names, ids). Update it after every step; this is the single source of truth.
- Report: `node tools/experiments/report.mjs brands/<brand>/experiments/<id>.json` (reads the publisher's `queue/insights.json`; per variant: reach, views, avg watch time, retention, shares/interactions per reach; and per factor: wins vs control, median lift, verdict).

## Producing the variants
1. Pick the next idea that is not finished. Write the control script first (`scripts/<brand>-<idea>-A.txt`, tagged lines, Kurdish through RastNus, retention gate G1). Hooks follow `studio-retention`; the control uses a plain statement hook (in the first the brand tests plain statement hooks beat question and twist hooks; still a hypothesis).
2. Write B-E by changing exactly one thing as in the table; record `hook_text`, `lemo_style`, `voice`, `script`, `duration_s` in the experiment file.
3. Build with `studio-video` (lemo-opuscar primary), voiceover with `tools/voiceover/run.mjs --brand <brand>` (cheap: about $0.004 per 15 s on OpenRouter), pass G2/G4 and `studio-review` (render-check + earshot). Keep files small and delete test renders afterwards, keep PNG frames.
4. **Trial reels are posted by hand in the Instagram app, never through the publisher.** On 2026-11-18 the publisher's `trial_params` did NOT create trial reels: Meta posted 18 test reels as normal public reels in the feed. The `trial` field is now blocked in the publisher and console. For each finished variant put the mp4 and its caption in `outbox/<brand>/` and give the owner a pack (file + caption + suggested time) to post as a Trial reel by hand. If a variant is meant to be a normal public reel, queue it as a normal draft only after telling the owner it will be public. Drafts only; the owner approves.
5. Schedule: 2 posts a day, randomize the order of an idea's 5 variants, never the same hour, spread an idea over at least 3 days (order and time effects are real: in our first test batches the last posted reels may have had an advantage). Record `queue` name and `scheduled_for`.
6. After 72 hours, refresh analytics (GitHub "publish" workflow with Refresh analytics, or wait for the 06:15 UTC run), pull the publisher repo, run the report.

## Reading results (be honest about small numbers)
- Primary metric: retention = average watch time / video length. Secondary: shares, saves, interactions per reach. Posts with reach under 300 do not count.
- A factor is called a **win** only if it beats the control in at least 7 of 10 ideas and the median lift is at least 15%. Anything else is "no clear effect" or "too early".
- After every 10 posted variants, write one dated line in the brand's `MOTION.md` Log with the real numbers; never guess. Promote to Preferred only with the owner's yes.
- Trial reels reach non-followers first; posting them and graduating a winner to followers is done by the owner by hand in the Instagram app. Insights for hand-posted trial reels appear in the console as posts made outside the console.

## Rules that stay
Never invent claims (only `claims_allowed`), no prices/delivery times/"cheapest"/"guaranteed"/"100%", Kurdish is a draft until native review, nothing is approved or posted without the owner's yes, no pushes of the private repo, no paid calls beyond the stated voice cost without asking. See `docs/studio-pipeline.md`.
