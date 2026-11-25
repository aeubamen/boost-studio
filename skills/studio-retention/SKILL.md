---
name: studio-retention
description: Make viewers watch to the end. Plans a short video as one story with an open loop, a timed beat map (hook, stakes, turns, payoff), cut and animation rules per beat, a last-shot CTA that does not end the video early, and a loop-back ending. Use for "keep viewers watching", "retention", "storytelling reel", "hook and CTA", or right after studio-script and before studio-video.
---

# studio-retention

Goal: the viewer reaches the last shot, and the one action is clear. Evidence is mostly practitioner advice plus a few platform statements, not controlled studies. Each rule below is tagged **[platform]** (said by the platform), **[research]** (a study), **[vendor]** (one company's data), or **[hypothesis]** (reasonable, untested). Test every number on your own analytics; sources and caveats are in `references/sources.md`.

## 0. What the platforms actually measure
- Instagram, Mosseri (Jan 2025): top ranking signals are **watch time, likes per reach, sends per reach** (likes matter slightly more for followers, sends for non-followers). Watch for average watch time, likes/reach and sends/reach in Insights. [platform, via Social Media Today quoting his post]
- Instagram **skip rate** = share of views that left in the first 3 s; the **retention chart** shows where viewers leave. [platform] Compare with your own median, not a universal number; no official benchmark exists.
- YouTube Shorts: since 31 Mar 2025 every start and every loop counts as a view; **Engaged Views** exclude loops. Studio shows Viewed vs Swiped Away. [platform/secondary] So a loop-back inflates views but not engaged views.

## Retention gates (mandatory; low retention goes back a step)
`tools/retention/gate.mjs` scores a stage 0-100: pass = 80 or more with no fail. Each fail costs 25 points, each warning 7. Not a pass means **go back to the step named in its output, fix, run it again**. After 2 rounds on the same stage it prints STOP: tell the owner what is wrong and ask. Keep history with `--project projects/<name>`.

| Gate | When | Command | Covers | If not pass, go back to |
|---|---|---|---|---|
| G1 script | after `studio-script`, before the style board | `node tools/retention/gate.mjs script scripts/<name>.txt --target <s> --project projects/<name>` | hook, loop, stakes, turns, payoff position, one CTA | `studio-script` |
| G2 plan | after the beat map and storyboard, before the first still | `node tools/retention/gate.mjs plan projects/<name>/plan.json --project projects/<name>` | scenes and cuts, motion in the first 0.5 s, change at every turn, quiet stretches, payoff hold, text read time, one emphasis, keyframe and move durations, sound accents | the beat map (sections 2-3) |
| G3 build | after the build, before the full render: rewrite `plan.json` from the real Remotion timeline (`T`) and run G2 again | same as G2 | catches drift between plan and build | `studio-video` |
| G4 render | right after the render, before `studio-review` | `node tools/retention/gate.mjs render out/<name>.mp4 --project projects/<name>` | measured on the file: cuts, frozen stretches, motion at the start, last vs first frame | `studio-video`, re-render |

`plan.json` has a template at `references/plan-template.json` (shots with start, end, beat, text, and timed events for each cut, move, zoom, text change or sound). G4 measures the picture only; the frame sheet and `studio-review` still cover meaning, Kurdish shaping and the copy.

## 1. One story, one loop
- **One promise per video.** A second idea splits attention and the middle sags.
- **Open the loop in the first second** (a question, a gap, a visible problem). Add stakes in seconds 2-4. Keep the answer back until the last third. [hypothesis: from creator guides; the 3-7-21 test is a handy check: attention by 3 s, setup by 7 s, reward by 21 s]
- **The gap must be real and closeable.** Curiosity grows when people know a little and the answer feels reachable; too vague or too wide and they leave. The payoff must deliver exactly what the hook promised, or trust and sends drop. [research: Loewenstein's information-gap theory; no video-specific test]
- **Never answer early.** Once the main loop closes, the video feels finished: no talking after the payoff except the CTA.
- **Small loops in the middle.** Every 5-8 s, close one tiny question and open the next ("but there is one catch"). Promise, keep it, make the next promise.

## 2. Story shape (15-30 s)
| Beat | Share | Job | Cut / motion |
|---|---|---|---|
| hook | 0-3 s | loop + stakes, already moving | first frame is the hook, no logo or intro, motion starts on frame 1 |
| setup | to ~25% | the problem, shown not told | 1 cut every 1.5-3 s |
| turn(s) | middle | new fact, obstacle, reveal, each opens the next question | cut on the change of information, not on a timer |
| payoff | ~70-90% | the answer the hook promised | slow down, hold 0.5-1 s, biggest motion of the video |
| cta | last 2-3 s | ONE action, same words as in the brief | quiet, short, big text, no new information |
| loop-back | last frame | ends where it begins | last frame equals first, so replay feels seamless |

Story forms that fit a brand with no presenter: problem -> failed fix -> real fix; before -> after; "what happened when..."; mistake -> lesson; myth -> truth; countdown (#3 -> #1 with the best last).

## 3. Cuts, animation, keyframes, timing
- **Pattern interrupt** = any change that resets attention: cut, new angle, full-screen text, size jump, sound change. Creator guides suggest one every 1.5-3 s in short-form; no study ties cut rate to retention. [hypothesis] An eye-tracking study found faster editing shortens gaze fixations, nothing about completion. [research, small] So place changes where the information changes; a cut with no new information is noise. Test with the retention chart.
- **Cut on motion.** End a shot while something moves and start the next moving the same direction (see `cut-the-curve`, `seam-craft`).
- **Keyframes per beat:** hook = fast in (about 0.2 s), turn = a clear move plus a sound accent, payoff = slow landing and a 0.5-1 s hold, CTA = small and calm. Timing and easing values come from `motionmaxxing`.
- **One emphasised thing per frame.** The eye follows the biggest moving item, so make it the item the story needs.
- **Text:** at most about 7 words per screen, 1.2-1.5 s minimum read time, text changes with the beat, safe area top 150 / bottom 250.
- **Sound:** a small accent on every turn, music dips under the payoff, a quiet last second.
- **Scene length:** if one shot stays unchanged longer than 3 s (short-form), add motion, a punch-in or a cut, unless it is the payoff hold.

## 4. The CTA (placement is an open question, so test it)
- Evidence: Wistia's data on 36,000+ clickable CTAs in hosted videos says that for videos **under 1 minute the best spot is the first quarter**, for 1-3 minutes the last quarter; mid-roll beat end-roll in earlier years. [vendor, hosted marketing video with a pause-and-click button, not Reels] About 96% of creators still put it at the very end.
- Reels have no click button, so the real asks are **send, save, follow, comment, tap the link in bio**. Sends per reach is a top signal, so write the ask as a reason to send ("send this to someone who...") and tie it to the payoff.
- Default for this studio (until our own data says otherwise): a **soft early mention** (one word or a small tag by the first quarter, `[cta-soft]`) plus **one short ask in the last 2-3 s after the payoff**, never replacing the payoff. A/B it across similar reels: A = end only, B = soft early + end; compare sends/reach, saves, follows and average watch time.
- One action only, the brief's wording, from `brand.json`. No new claims, prices or offers in it.
- Loop-back (last frame = first frame) is cheap but unproven for ranking; use it when it costs nothing. [hypothesis]

## 5. Workflow
1. After `studio-script`, tag the script lines and run the checker:
   `node tools/retention/lint.mjs scripts/<name>.txt --target 20`
   Tags: `[hook] [stakes] [setup] [turn] [payoff] [cta]` at the start of a line; optional `[mid-loop]` and `[cta-soft]` (early mention, must sit in the first quarter).
2. Fix every `fail`; read each `warn` and decide.
3. Put the beat map in `projects/<name>/brief.md` under "Retention plan" (beat, start, end, cut idea, motion, sound).
4. Build with `studio-video`. After the render `studio-review` also reads the retention list below.
5. After posting, read Instagram Insights (skip rate, retention chart, average watch time, sends/reach, likes/reach, follows) and add one line to the brand's `MOTION.md` Log. Never guess numbers.
6. **Diagnose by the chart.** Steep drop in the first 3 s = hook/first frame problem. Slow slide through the middle = pacing: cut 20-30% of the middle and compare. Drop in the last 10-20% = the value ended before the CTA, so move the payoff later or shorten the ask. Change one thing per reel so the result means something.

## 6. Retention review list (used by studio-review)
- First frame already shows the hook and something moves in the first 0.5 s.
- A question is open until the payoff; the answer is not given earlier in text or voice.
- No shot longer than 3 s without change (payoff hold excepted).
- Something changes (cut, move, text, sound) at every turn.
- Payoff lands between 70% and 90% of the length; the final ask is last, under 3 s, one action; any early mention is small.
- The hook promise and the payoff match (no bait).
- Last frame matches the first (optional).

## 7. vidIQ
The vidIQ MCP is useful for research and for measuring, not for editing: `vidiq_outliers`, `vidiq_trending_videos`, `vidiq_instagram_tiktok_outlier_search` (what hooks win in a niche), `vidiq_video_transcript` and `vidiq_watch_shortform_content` (copy the structure, not the words), `vidiq_channel_analytics` (retention after posting). Its generators (script, video, voiceover) use credits: ask the owner first. Do not use it for Kurdish copy.
