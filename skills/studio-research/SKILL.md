---
name: studio-research
description: Research a niche, a competitor or a topic without logging in to any social account. Use for "what is working in <niche>", "read this link", "find videos about X", "what do competitors post". Uses the agent-reach CLI, the web, YouTube, and GitHub public pages.
---

# studio-research

**Rules.** Public sources only. Never use the user's logged-in social accounts for scraping, never bypass anti-bot protection, never ask for passwords. If a page needs a login, tell the user and stop.

**Tools (in order of preference).**
1. `agent-reach read <url>` for any public link. `agent-reach channels` lists what is available. Default channels need no login: github, youtube, web, bilibili, v2ex. Do not enable the experimental instagram/twitter/facebook channels or run `agent-reach login`. (The `--backend` flag is per channel; check `agent-reach channels` before using it.)
2. `agent-reach youtube search "<topic>"` and `agent-reach youtube ...` for video info and subtitles.
3. Built-in web search/fetch for everything else.
4. For Instagram specifically, ask the user to paste links or screenshots of reels; do not scrape the platform.

**Output** (save to `research/<brand>-<topic>-<date>.md`):
- 5-10 findings, each with source link, what the format is, which hook formula from `scripts/hooks.json` it uses, and a "how we would do it for <brand>" line.
- A "do not copy" list: anything that makes claims the brand may not make.
Rank by evidence, not by raw views: a small account that beats its own average is a stronger signal.
