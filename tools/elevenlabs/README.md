# elevenlabs (optional voiceover)

Turns a script file (one beat per line) into speech with [ElevenLabs](https://elevenlabs.io).

```bash
cd tools/elevenlabs
npm install
npm run voiceover -- ../../scripts/my-script.txt --dry-run          # shows lines + character count, no API call
npm run voiceover -- ../../scripts/my-script.txt --voice <voiceId> --merge
```

Options: `--voice <id>` (or `ELEVENLABS_VOICE_ID`), `--model` (default `eleven_v4`), `--lang <code>`, `--out <dir>`, `--merge` (needs ffmpeg), `--dry-run`.

## API key
Run `npx -y @elevenlabs/cli@latest onboard init` in the repo root. It signs you in through your browser and saves the key to `.env.local`, which git ignores. Never paste a key into chat, code or a commit. See `.env.example`.

## Know before you use it
- **Kurdish (Sorani) support is not confirmed** by ElevenLabs. Test one short line and have a native speaker judge it before relying on it.
- **Plan terms matter.** Check whether your ElevenLabs plan allows the audio in commercial or client work.
- Each real run uses credits. `--dry-run` uses none.
