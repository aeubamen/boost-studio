---
name: studio-script
description: Turn an idea into a short-video script - three hook options from scripts/hooks.json, on-screen text, and a timed beat sheet. Use for "make a reel about X", "script this", "what should the first line be".
---

# studio-script

1. Read the brand folder. State the one audience and the one action.
2. Pick **three different hook formulas** from `scripts/hooks.json`; write one hook per formula in the brand language. Score them yourself 1-5 on: clear in 2 seconds, specific, true, one action. Recommend one and say why.
3. Write the script as one beat per line in `scripts/<name>.txt`: hook, 3-5 beats, one call to action. Keep each line short enough to read on screen in about 1.5 seconds.
4. Run `python3 scripts/beat_sheet.py <file> --target <seconds>` and fix pacing until it fits. Videos for these brands usually have no voiceover: text on screen, sound effects, quiet music.
5. Mark proof lines with their source from `brand.json` (`claims_allowed`). If proof is missing, write `{{proof needed}}`; never invent numbers, prices, delivery times or warranty terms.
