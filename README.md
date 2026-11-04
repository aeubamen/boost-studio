<p align="center">
  <img src="docs/assets/banner.svg" alt="Boost Studio: content toolkit for Kurdish and Arabic brands" width="100%" />
</p>

<p align="center">
  <a href="#quick-start">Quick start</a> ·
  <a href="#skills">Skills</a> ·
  <a href="#retention-gates">Retention</a> ·
  <a href="#three-ways-to-work">Modes</a> ·
  <a href="#video-templates">Video</a> ·
  <a href="#contributing">Contributing</a> ·
  <a href="https://boostiraq.com">Boost Iraq</a>
</p>

<p align="center">
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-1100ff?style=flat" /></a>
  <img alt="claude code skills" src="https://img.shields.io/badge/Claude%20Code-skills-d6006e?style=flat" />
  <img alt="remotion" src="https://img.shields.io/badge/video-Remotion-111111?style=flat" />
  <img alt="languages" src="https://img.shields.io/badge/Kurdish%20%C2%B7%20Arabic-RTL%20first-8cff8c?style=flat&labelColor=111111" />
  <img alt="prs welcome" src="https://img.shields.io/badge/PRs-welcome-1100ff?style=flat" />
</p>

---

## What is Boost Studio

Boost Studio is a **content toolkit for small businesses in Kurdistan and Iraq**. It turns Claude Code into a small content studio: research what works, write the hook and script, lint the caption, build a 9:16 video, **check that people will watch it to the end**, and (only if you want) publish.

It is a folder of **Claude Code skills plus small scripts**, with one folder per brand so each brand keeps its own voice, colours and rules. Kurdish (Sorani) and Arabic, right to left, are first-class, not an afterthought.

*A product of [Boost Iraq](https://boostiraq.com), a Meta-ads agency for local businesses.*

---

## See it

<p align="center">
  <img src="docs/assets/demo.gif" alt="Starter story template: hook, chat, button, end card" width="240" />
</p>

<table>
<tr>
<td width="33%" valign="top"><img src="docs/assets/still-hook.png" alt="Hook card" /><br/><sub><b>1 · Hook</b>: one clear line in the first two seconds.</sub></td>
<td width="33%" valign="top"><img src="docs/assets/still-chat.png" alt="Chat scene" /><br/><sub><b>2 · Story</b>: a phone chat, a button, a reason to click.</sub></td>
<td width="33%" valign="top"><img src="docs/assets/still-end.png" alt="End card" /><br/><sub><b>3 · Call to action</b>: name, link, one ask.</sub></td>
</tr>
</table>

The `starter-story` template above is neutral. Change the text, colours and brand name in one file (`src/brand.ts`) and render.

---

## How it works

<p align="center">
  <img src="docs/assets/flow.svg" alt="Research, script, caption, video, publish" width="100%" />
</p>

Each step is its own skill, so you can use one, some, or all of them.

### Three ways to work

| Mode | Who posts | When to use |
|---|---|---|
| **manual** | you | default; nothing leaves your computer |
| **assisted** | you | Claude lints the caption and shows the exact post first |
| **scheduled** | PostZen, after your "yes" on each post | when you want posts queued |

Nothing is ever posted without your explicit yes on the exact preview.

---

## Skills

| Skill | What it does |
|---|---|
| `studio-start` | Picks the brand and the mode, then routes the request |
| `studio-research` | Reads public pages, YouTube and GitHub without logging in to any account |
| `studio-script` | Three hook options from 12 original formulas, a script, a timed beat sheet |
| `studio-caption` | Writes the caption and lints it (visible text before "... more", dashes, hashtags, forbidden claims) |
| `studio-plan` | A week of posts: format, idea, hook, asset, status |
| `studio-retention` | Plans the story so viewers reach the last shot: open loop, beat map, one short ask. Includes four retention gates (see below) |
| `studio-video` | Builds and renders 9:16 motion videos from the Remotion templates |
| `studio-review` | Checks a finished render before you see it: size, duration, black frames, freezes, loudness, safe-area frame sheet |
| `studio-transcribe` | Transcribes and cuts your own recordings (optional) |
| `studio-voiceover` | Turns a script into speech with ElevenLabs (optional, uses credits, Kurdish unconfirmed) |
| `studio-publish` | Manual, assisted or scheduled publishing with an approval gate |

Scripts you can run on their own:

```bash
python3 scripts/lint_caption.py caption.txt --brand brands/<brand>/brand.json
python3 scripts/beat_sheet.py script.txt --target 20
node tools/retention/lint.mjs script.txt --target 20      # tagged script: [hook] [stakes] [turn] [payoff] [cta]
node tools/retention/gate.mjs plan videos/<name>/plan.json
node tools/render-check/check.mjs out/video.mp4 --expect-duration 20
```

---

## Retention gates

A video nobody watches to the end does not help a brand. Four gates score each stage from 0 to 100 (**pass = 80 or more and no failure**). Anything less goes back to the step that caused it, with a concrete fix per finding. After two rounds on the same stage, the skill stops and asks you.

| Gate | Checks | Goes back to |
|---|---|---|
| **G1 script** | hook first, a question open until the payoff, payoff late (about 70-90%), one short ask last | `studio-script` |
| **G2 plan** | scenes and cuts, motion in the first 0.5 s, a change at every turn, quiet stretches, payoff hold, text read time, one emphasis per shot | the shot plan |
| **G3 build** | the same checks on the real timeline before the full render | `studio-video` |
| **G4 render** | measured on the file: cuts, frozen stretches, motion at the start, last frame vs first | `studio-video`, re-render |

Every rule is labelled **platform**, **research**, **vendor** or **hypothesis** in [`skills/studio-retention/references/sources.md`](skills/studio-retention/references/sources.md). Most numbers are rules of thumb from creator guides, not measured facts, so test them on your own analytics (skip rate, retention chart, average watch time, sends per reach). The gates check structure only; they cannot tell you whether the story is good.

---

## Quick start

```bash
git clone https://github.com/aeubamen/boost-studio.git
cd boost-studio
./install.sh          # links the skills into ~/.claude/skills and checks your tools
```

1. Copy `brands/_example` to `brands/<your-brand>` and fill in `brand.json` and `voice.md`.
2. Open Claude Code in the folder and try:

```text
/studio-start  make a 20 second reel for my shop
```

**You need:** [Claude Code](https://claude.com/claude-code), Node.js 22+, ffmpeg.
**Optional:** [`uv`](https://docs.astral.sh/uv/) + [Agent-Reach](https://github.com/Panniantong/Agent-Reach) for login-free research, [ai-media-editor](https://github.com/ellmos-ai/ai-media-editor) for transcribing recordings, a [PostZen](https://www.postzen.dev) account for scheduled posting, an [ElevenLabs](https://elevenlabs.io) account for voiceover (see `tools/elevenlabs/README.md`).

### A brand folder

```text
brands/your-brand/
├── brand.json   name, site, colours, font, claims you may make, words you may not
└── voice.md     who you talk to, how you sound, real captions, proof you can use
```

Skills read these files and **never invent** what is missing: no made-up prices, numbers, delivery times or warranty terms. Unknown fields stay `TODO` until you fill them in.

---

## Video templates

`templates/video/starter-story` is a 15-second, 9:16 [Remotion](https://www.remotion.dev) composition: hook card, phone chat, button, end card. Right-to-left text works out of the box.

```bash
cd templates/video/starter-story
npm install
npx remotion still src/index.ts Story out/check.png --frame=100 --scale=0.4
npx remotion render src/index.ts Story out/video.mp4
```

Fonts, logos, product photos and sound effects are not included. Add your own under `public/` (see [`templates/video/AUDIO.md`](templates/video/AUDIO.md)).

---

## Principles

- **Kurdish Sorani first, right to left.** Every Kurdish line is a draft until a native speaker approves it.
- **Real data only.** No invented proof.
- **No logged-in scraping, no password handling.** Research uses public sources.
- **Keys stay out of git.** API keys live only in a git-ignored `.env.local`.
- **You stay in control.** No post goes out without your yes.

---

## Repository layout

```text
brands/_example/                  copy this to start a brand
skills/                           the eleven studio-* skills
scripts/                          hooks.json, lint_caption.py, beat_sheet.py
tools/elevenlabs/                 optional voiceover script (ElevenLabs)
tools/retention/                  lint.mjs (script) and gate.mjs (script, plan, render)
tools/render-check/               check.mjs: automatic review of a finished render
templates/video/starter-story/    neutral Remotion template
docs/assets/                      images used by this README
posts/ plans/ research/ videos/   your working output (git-ignored)
```

---

## Ideas

Not promises, just directions that would be useful:

- An Arabic-first starter template
- More neutral templates: product-to-delivery, app-install demo, before/after
- Better Kurdish hook examples reviewed by native speakers
- Carousel and story skills

---

## Contributing

Issues and pull requests are welcome, especially:

- Kurdish and Arabic wording fixes
- New hook formulas and caption checks
- New neutral video templates

Please read [CONTRIBUTING.md](CONTRIBUTING.md). Do not add logos, fonts, photos or sound you do not have the right to share.

---

## Credits

Boost Studio is original work, inspired by four MIT-licensed projects and, for the render self-review idea, one AGPL project (ideas only, no code). See [NOTICE.md](NOTICE.md).

## License

[MIT](LICENSE) © 2026 Boost Iraq
