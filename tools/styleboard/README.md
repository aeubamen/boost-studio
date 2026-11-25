# styleboard

Renders small sample scenes of a brand for each reel choice, plus a `board.html` the owner picks from. Used by the `studio-brief` skill (step 3). Free to run: stills, short loops and local sounds only. Nothing is posted or paid for.

```
node tools/styleboard/make.mjs --brand boost --out projects/<name>/styleboard --open
  [--hook "..."] [--sub "..."] [--cta "..."]        sample copy (defaults: brands/<brand>/styleboard.json "sample")
  [--only style,color,layout,text,animation,speed,sound]
  [--recommend style=C,color=A,...]                 which option gets the "recommended" tag
  [--defaults style=C,color=A,layout=B,...]         what stays fixed while one choice varies
  [--picks "Style B, Color C, ..."]                 one combined preview of the owner's picks (combo.png, combo.mp4 with sound, picks.json); leaves the board alone
  [--inline]                                        embed everything in board.html (one big file for sharing)
  [--audio <folder>]                                local sound files (pad.mp3, ui-select-click.mp3, air-woosh-quick.mp3, ui-message-pop.mp3)
```

Output: `board.html` (open it in a browser; it needs the files next to it), `board.json` (the options and the recommendation, for Claude), and one folder per choice with A, B, C. A full board takes about 15 seconds.

## What it needs
Google Chrome, ffmpeg, and `playwright-core` and the `@fontsource/*` fonts installed with npm in the repo root (or set `NODE_DEPS_DIR`). Per brand: `brands/<brand>/styleboard.json` (palette, fonts, wordmark, sample copy, default recommendation). Copy `brands/_example/styleboard.json` to start a new brand. Fonts: local files via `fontsource:` paths, or `google` (needs internet).

## The 7 choices
style, color, layout, text, animation, speed, sound. Each shows A, B, C of the same scene with only that one thing changed. Sound C (voiceover) makes no clip, because a Kurdish voice uses ElevenLabs credits.

## Notes
- The sample copy is placeholder text. Kurdish in samples is a draft until the owner approves it.
- Sound files are the owner's own Mixkit downloads; they are used locally and never copied into the repo.
