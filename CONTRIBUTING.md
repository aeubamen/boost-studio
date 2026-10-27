# Contributing

Thanks for helping. Good first contributions:

1. **Wording:** fix a Kurdish or Arabic line in `scripts/hooks.json`, a template, or a skill.
2. **Hook formulas:** add one to `scripts/hooks.json` (id, name, pattern, example). Keep examples neutral, with no real brands or numbers.
3. **Checks:** add a rule to `scripts/lint_caption.py` and test it on a sample caption.
4. **Templates:** add a neutral Remotion template under `templates/video/`. It must render with no private assets.

Rules:
- No logos, fonts, photos, music or sound effects you do not have the right to share.
- No real client names, phone numbers, prices or account data.
- Keep skills honest: they must never invent proof, and nothing may post without the user's explicit yes.

Before opening a pull request, run `python3 scripts/lint_caption.py` on any sample you add and `npx tsc --noEmit` inside a template you changed.
