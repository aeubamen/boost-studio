# starter-story

A neutral 15 s, 9:16 Remotion template: hook card, phone chat, call-to-action button, end card.
Edit `src/brand.ts` (name, url, colours, Kurdish/Arabic text) and render:

```bash
npm install
npx remotion still src/index.ts Story out/check.png --frame=100 --scale=0.4
npx remotion render src/index.ts Story out/video.mp4
```
For your own font, logo or sound effects, add files under `public/` and load them with `staticFile()`.
