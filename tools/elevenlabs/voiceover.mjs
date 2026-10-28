#!/usr/bin/env node
// Turn a script file (one beat per line) into speech with ElevenLabs.
//
// usage (from tools/elevenlabs):
//   npm run voiceover -- ../../scripts/my-script.txt --voice <voiceId> [--lang ku] [--model eleven_v4]
//                        [--out out] [--merge] [--dry-run]
//
// The API key is read from ELEVENLABS_API_KEY (loaded from ../../.env.local by the npm script).
// Never put the key in this file. --dry-run makes no API call and uses no credits.
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const file = args.find((a, i) => !a.startsWith("--") && !(args[i - 1] || "").startsWith("--"));
if (!file) {
  console.error("usage: npm run voiceover -- <script.txt> --voice <voiceId> [--lang ku] [--model eleven_v4] [--out out] [--merge] [--dry-run]");
  process.exit(2);
}

const voiceId = opt("voice", process.env.ELEVENLABS_VOICE_ID);
const modelId = opt("model", process.env.ELEVENLABS_MODEL || "eleven_v4");
const languageCode = opt("lang");
const outDir = opt("out", "out");

const lines = (await readFile(file, "utf8"))
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));
const chars = lines.reduce((n, l) => n + [...l].length, 0);
console.log(`${lines.length} lines, ${chars} characters, model ${modelId}${languageCode ? `, language ${languageCode}` : ""}`);

if (flag("dry-run")) {
  lines.forEach((l, i) => console.log(`${String(i + 1).padStart(2, "0")}  ${l}`));
  console.log("dry run: no API call made, no credits used");
  process.exit(0);
}
if (!voiceId) {
  console.error("missing --voice <voiceId> (or ELEVENLABS_VOICE_ID)");
  process.exit(2);
}
if (!process.env.ELEVENLABS_API_KEY) {
  console.error("ELEVENLABS_API_KEY is not set. Run through `npm run voiceover` so .env.local is loaded.");
  process.exit(2);
}

const client = new ElevenLabsClient();
await mkdir(outDir, { recursive: true });
const name = basename(file, extname(file));
const written = [];

for (let i = 0; i < lines.length; i++) {
  const audio = await client.textToSpeech.convert(voiceId, {
    text: lines[i],
    modelId,
    ...(languageCode ? { languageCode } : {}),
    ...(i > 0 ? { previousText: lines[i - 1] } : {}),
    ...(i < lines.length - 1 ? { nextText: lines[i + 1] } : {}),
  });
  const buf = Buffer.from(await new Response(audio).arrayBuffer());
  const path = join(outDir, `${name}-${String(i + 1).padStart(2, "0")}.mp3`);
  await writeFile(path, buf);
  written.push(path);
  console.log("wrote", path);
}

if (flag("merge") && written.length > 1) {
  const list = join(outDir, `${name}-concat.txt`);
  await writeFile(list, written.map((p) => `file '${basename(p)}'`).join("\n"));
  const merged = join(outDir, `${name}-all.mp3`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", merged]);
  console.log("merged", merged);
}
