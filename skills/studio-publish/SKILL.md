---
name: studio-publish
description: Publish or queue a finished post. Three modes - manual (print a copy-ready block), assisted (preview then user posts), scheduled (PostZen MCP after explicit approval). Use for "post it", "schedule this", "publish".
---

# studio-publish

**Hard rule: nothing is posted without an explicit "yes" to the exact preview.** Show: account, media file, full caption, date/time. One approval covers one post only.

- **manual**: print the caption in a code block and the path of the media file. Stop.
- **assisted**: same, plus run `scripts/lint_caption.py`; stop.
- **scheduled**: needs the PostZen MCP (`claude mcp list` must show `postzen` connected, and the Instagram account connected in PostZen). Use PostZen's tools through the installed `ig-publish` skill's flow: list accounts, upload media, create the post, then **verify it actually went out** and log it in `posts/log.md`.

Never ask for or handle an Instagram password or token. If PostZen is not connected, fall back to manual mode and say so. Media uploaded to PostZen leaves the user's machine; mention this the first time.
