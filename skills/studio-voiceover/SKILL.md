---
name: studio-voiceover
description: Turn a finished script into a voiceover with ElevenLabs (tools/elevenlabs/voiceover.mjs). Use for "add a voiceover", "make the voice", "text to speech". Only after the user says yes to spending credits.
---

# studio-voiceover

**Before anything:** the ElevenLabs plan terms decide whether the audio may be used in client ads (the free plan was non-commercial when last checked). Kurdish Sorani support in ElevenLabs is **unconfirmed**: test a short line first and have a native speaker judge it. Most brand videos here are silent with text and sound effects; use voice only when asked.

1. Prepare the script: one beat per line in `scripts/<name>.txt` (see `studio-script`).
2. Dry run, no cost: `cd tools/elevenlabs && npm run voiceover -- ../../scripts/<name>.txt --dry-run` shows lines and the character count.
3. Ask the user's yes for the real run (it uses credits), and which voice (`--voice <voiceId>`; list voices in the ElevenLabs dashboard). Optional: `--lang ku`, `--model eleven_v4`, `--merge`.
4. Run: `npm run voiceover -- ../../scripts/<name>.txt --voice <id> --merge`. Output goes to `tools/elevenlabs/out/` (git-ignored).
5. Put the audio on the video timeline in Remotion with `<Audio src={staticFile(...)}>`; re-time beats to the spoken length.

**Rules:** the key lives only in `.env.local` (git-ignored). Never print, open or ask for it; never put it in code or chat.
