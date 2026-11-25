# Lessons from production

Things we learned the hard way while running this toolkit for several brands. Each one changed a tool or a rule.

## Publishing
- **Instagram "trial reels" cannot be made through the API.** Sending `trial_params` posted every test reel as a normal public reel in the feed. The publisher now refuses a `trial` field; post trial reels by hand in the Instagram app.
- **Store schedule times with their time zone.** A server runs in UTC: a form time typed as local time and parsed without an offset posts hours early or late. Parse local input with an explicit offset (for example `+03:00`) and store ISO UTC.
- **One source of truth for the queue.** Running a local queue and an online queue side by side produced the same post twice. Pick one; keep the other read-only or retire it.

## Video
- **Let a second agent judge the work.** A reel scored 93/100 on the retention gate and still had six visible problems (cut-off text, an empty panel, an off-brand button, long static stretches). The `reel-reviewer` agent, which did not make the reel, caught them. See `.claude/agents/`.
- **Check the renderer's output, not only the sources.** One editor render added a corrupted first frame and a single bright flash that the source clips did not have. Scan rendered frames for single-frame outliers, and cut with ffmpeg when the editor's render is the cause; keep the editor for colour grading.
- **Never put another project's text on screen.** A reused template still showed the previous reel's script. Every on-screen line must belong to the reel being made.

## Voice
- **Pick a voice by ear on the same script**, then store it per brand (`brand.json` `tts`). The voice that sounds best in English can pronounce Kurdish badly.
- **One request per video.** Generate the whole script as one take and cut it into lines: same voice and tone across lines, and it fits free-tier daily limits.
- **Measure, do not guess.** Some text-to-speech output arrives above 0 dBFS and clips. Attenuate a few dB, normalize to about -16 LUFS with the peak at or below -1 dBFS, then measure again.
- **Know the output format.** One API returned raw PCM (s16le, 24 kHz, mono) by default, not mp3: wrap it before playing.
- **Correct the script before the voice.** For Kurdish Sorani, a local corrector (`tools/rastnus/check.mjs`) shows a before/after diff and never applies changes on its own. Kurdish text stays a draft until a native speaker reviews it.

## Testing
- **Test with 10 ideas x 5 variants.** One control and four variants (hook, production, voiceover, whole concept) per idea. A variant wins only if it beats the control in at least 7 of 10 ideas with a median lift of 15% or more. See `skills/studio-experiments`.
- **Randomize order and time.** The last posts in a batch behave differently; never post an idea's variants in the same order or at the same hour.
