# Boost Studio

*A product of [Boost Iraq](https://boostiraq.com).*

A content toolkit for small businesses in Kurdistan and Iraq: research, script, caption, plan,
video and (optionally) publish. Everything is a Claude Code skill plus small scripts, with one
folder per brand so voice, colours and rules never get mixed up. Kurdish (Sorani) and Arabic, right-to-left, are first-class.

## Pick your way of working
| Mode | Who posts | When to use |
|---|---|---|
| manual | you | default; nothing leaves your Mac |
| assisted | you | Claude lints and previews the exact post |
| scheduled | PostZen, after your yes on each post | when you want it queued |

## Skills
`studio-start` (router) · `studio-research` · `studio-script` · `studio-caption` · `studio-plan` ·
`studio-video` · `studio-transcribe` · `studio-publish`

## Layout
```
brands/_example/                       copy to brands/<your-brand>/ and fill in (your own brands stay local)
brands/<brand>/{brand.json,voice.md}   identity, claims allowed/forbidden, voice
skills/                                the eight skills
scripts/                               hooks.json, lint_caption.py, beat_sheet.py
templates/video/starter-story/         neutral Remotion template (edit src/brand.ts)
posts/ plans/ research/ videos/        working output
```

## Setup
1. Copy `brands/_example` to `brands/<your-brand>` and fill in `brand.json` and `voice.md`.
2. Run:
```bash
./install.sh        # links skills into ~/.claude/skills and checks tools
```
External tools (separate licences): `agent-reach` (research), `ai-media-editor` (optional
transcription), Remotion (video), PostZen MCP (optional publishing).

## Principles
- Kurdish Sorani first, RTL; every Kurdish line is a draft until a native speaker approves it.
- Real data only: no invented prices, proof, delivery times or warranty terms.
- No logged-in scraping, no password handling, nothing posted without a "yes" on the exact preview.

See `NOTICE.md` for credits to the four MIT projects that inspired it.

## Video templates
`templates/video/starter-story` is a neutral Remotion composition. Fonts, logos, product photos and sound effects are not included: add your own under `public/` (see `templates/video/AUDIO.md`).

## Contributing
Issues and pull requests are welcome, especially Kurdish wording fixes and new hook formulas. Please do not add logos, fonts or media you do not have the right to share.

## About
Made by [Boost Iraq](https://boostiraq.com), a Meta-ads agency for local businesses.
