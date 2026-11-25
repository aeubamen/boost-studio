---
name: studio-voiceover
description: Turn a finished script into a voiceover with ElevenLabs (tools/elevenlabs/voiceover.mjs). Use for "add a voiceover", "make the voice", "text to speech". Only after the user says yes to spending credits.
---

# studio-voiceover

**Gemini 3.8 Flash TTS is the first choice for Kurdish Sorani** (owner liked the sample, 2026-11-17); ElevenLabs stays as an option. Each brand has its own voice in `brands/<brand>/brand.json` (`tts.voice`, `tts.style_default`; table in `docs/brand-voices.md`).
- **Two providers, one command** (`--provider`): **1 = `gemini`, Google free tier** (default; `GEMINI_API_KEY`; limits seen on 2026-11-18: **10 requests per day per model** and about 5 per minute, so it suits tests and short scripts) and **2 = `openrouter`** (paid per use, `OPENROUTER_API_KEY`, works where Google billing is blocked; about $0.014 per minute of voice by list price; implemented from the model page and not tested yet, and stored `voice_...` ids may need a prebuilt voice name there). On a daily-limit error the script stops and says so.
- **Whole script, one WAV:** `node --env-file=.env.local tools/voiceover/run.mjs scripts/<name>.txt --brand <brand> [--provider openrouter] [--out f.wav] [--earshot]`. It (1) runs the Kurdish lines through **RastNus** and stops if it changed anything, so you review the diff (`--accept-fixes` uses the corrected copy), (2) speaks each line in the brand's voice (`brands/<brand>/brand.json` `tts`), (3) joins the lines with short gaps, (4) with `--earshot` measures the result.
- **RastNus alone:** `node tools/rastnus/check.mjs scripts/<name>.txt` (starts the local 5B model on :8080 if needed and stops it after; needs about 4 GB RAM). Shows before/after per line, never overwrites the script; keep brand and model names as written.
- **earshot on the result** (you cannot hear): `python -m earshot measure <wav>` (earshot, optional) gives peak, LUFS, noise floor. Example: one test line read -11.1 LUFS and -1.5 dBFS peak, hotter than the -14 LUFS target, so lower it before mixing. Use `realness`, `describe`, `compare` for sound effects too (see `skills/earshot`).
- One line: `node --env-file=.env.local tools/gemini-tts/say.mjs "<text>" --voice <tts.voice> --style "<style>" --out out.wav`. The text is spoken verbatim, so delivery goes in `--style`, and pauses/vocal events as `<short pause>`, `<breath>`, `<sigh>`.
- A script, line by line: call it once per beat and join the WAV files (ffmpeg concat); keep the same voice and style for the whole video.
- Cost: a short line is about 100 tokens; say the cost and test one line first, as below. The key lives only in `.env.local`; never print or ask for it. Free-tier limits return 429 (the script retries).
- Kurdish text is a draft until a native speaker approves it; listen before use.

**Before anything:** the ElevenLabs plan terms decide whether the audio may be used in client ads (the free plan was non-commercial when last checked). Kurdish Sorani support in ElevenLabs is **unconfirmed**: test a short line first and have a native speaker judge it. Most brand videos here are silent with text and sound effects; use voice only when asked.

1. Prepare the script: one beat per line in `scripts/<name>.txt` (see `studio-script`).
2. Dry run, no cost: `cd tools/elevenlabs && npm run voiceover -- ../../scripts/<name>.txt --dry-run` shows lines and the character count.
3. Ask the user's yes for the real run (it uses credits), and which voice (`--voice <voiceId>`; list voices in the ElevenLabs dashboard). Optional: `--lang ku`, `--model eleven_v4`, `--merge`.
4. Run: `npm run voiceover -- ../../scripts/<name>.txt --voice <id> --merge`. Output goes to `tools/elevenlabs/out/` (git-ignored).
5. Put the audio on the video timeline in Remotion with `<Audio src={staticFile(...)}>`; re-time beats to the spoken length.

**Rules:** the key lives only in `.env.local` (git-ignored). Never print, open or ask for it; never put it in code or chat.

## Direct the voice, then test one line first
Before generating a whole narration, write a one-line delivery plan: pace (calm / measured / fast), energy (warm / urgent), words to stress, and where to pause (a short pause after the setup, a longer one before a reversal or the key claim). Generate only the most important line as a sample and let the owner hear it; spend credits on the rest only after a yes. Write spoken sentences, short, with clear punctuation. Say the price (credits) first. Kurdish voice is draft until a native speaker approves it.
