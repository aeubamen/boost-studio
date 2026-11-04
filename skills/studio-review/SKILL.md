---
name: studio-review
description: Self-review a finished reel or video before the user sees it. Runs the render checker (size, duration, black frames, freezes, loudness, clipping, safe-area frame sheet), looks at the frames, writes findings with a concrete fix each, and only shows the user a pass. Use right after any render, or for "check this video", "review the reel", "is it ready".
---

# studio-review

Nothing goes to the user, and nothing is published, until this review says **pass**. The user is the last judge of taste; this step catches the mistakes a person should never have to find.

## 1. Run the checker (free, about 10 seconds)
`node tools/render-check/check.mjs <file.mp4> --expect-audio --expect-duration <planned seconds>`
(drop `--expect-audio` for a reel planned as silent). It writes `<file>.review/report.json` and `sheet.png` (8 frames with red safe-area lines at top 150 px and bottom 250 px) and exits 0 pass, 1 revise, 2 fail.

## 1b. Retention gate on the render
`node tools/retention/gate.mjs render <file.mp4> --project videos/<name>`. Not a pass means the reel goes back to `studio-video` before any further review.

## 2. Look at `sheet.png` yourself
The tool cannot see these. Check each and write what you saw, per frame number:
- Text cut off, or important content inside the red lines.
- Kurdish letters joined and right to left; no boxes or missing letters.
- First frame shows the hook; no empty first second.
- The copy equals the approved text; no invented price, claim, or forbidden word (`brand.json`).
- Motion craft: no page chrome (brand name in a corner, counters, timecodes, progress bars, scene labels), nothing grows from zero (things arrive moving, from oversize), a hold before the key moment, only one emphasised thing per frame, the ending quieter and smaller than the start.
- Retention (from `studio-retention`, section 6): hook in frame 1 with motion, question open until the payoff, no shot over about 3 s without change, a change at every turn, payoff at 70-90%, one short CTA last, last frame matches the first.
- The brand look matches the choices you approved in the brief (colour, layout, text, animation, speed).

## 3. Write the findings
Each finding must be **accurate** (points to a time, frame, or file), **complete** (after one problem, look for others of the same kind), and **constructive** (a critical finding carries the exact fix; if you cannot name a fix, call it "investigation"). Add them to the tool's report as a short list.

## 4. Decide
- **pass**: show the user the file and the sheet, plus a one-line list of any suggestions.
- **revise**: fix the criticals, re-render, run again. At most 2 rounds. Keep the old version (v2, v3).
- **fail** or still failing after 2 rounds: do not present it as ready. Say what is wrong and what you need.
Never tell the user "looks good" without having run the tool and looked at the sheet.

## Notes
- Loudness target is about -14 LUFS with peaks under -1 dB. A calm reel with long holds is fine: freezes are only suggestions.
- Review the first and the final version, not every draft.
- Ideas (final-render self-review, critique that carries a fix) follow the approach of OpenMontage (AGPLv3). No code was copied.
