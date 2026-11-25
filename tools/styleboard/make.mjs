#!/usr/bin/env node
// Style board maker: renders small sample scenes of a brand for each reel choice and a board.html to pick from.
//
//   node make.mjs --brand _example --out projects/my-reel/styleboard
//        [--hook "..."] [--sub "..."] [--cta "..."]         sample copy (defaults come from brands/<brand>/styleboard.json)
//        [--only style,color,layout,text,animation,speed,sound]
//        [--recommend style=C,color=A,...]                   marks the recommended option (defaults from styleboard.json)
//        [--defaults style=C,color=A,layout=B,text=A,animation=B,speed=B]   what stays fixed while one choice varies
//        [--audio <folder of your own sound files>]               local sound files for the sound samples (never redistributed)
//        [--picks "Style B, Color C, ..."]                   render ONE combined preview of the owner's picks (combo.png, combo.mp4, picks.json) into --out without touching the board
//        [--open]                                            open board.html in the default browser when done
//        [--inline]                                          embed all samples in board.html (one file for sharing, several MB)
//
// Needs Google Chrome, ffmpeg, and playwright-core (from ./node_modules, or set NODE_DEPS_DIR). Nothing is posted or paid for.
import { readFile, writeFile, mkdir, rm, access } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { homedir, tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { sceneHtml, palettes, LAYOUTS } from "./scene.mjs";

const sh = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const STUDIO = resolve(HERE, "..", "..");
const PUB = process.env.NODE_DEPS_DIR || process.cwd(); // folder whose node_modules has playwright-core and @fontsource/* (run `npm i playwright-core @fontsource/zain @fontsource/kanit` there)
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith("--") ? [...a, [x.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : true]] : a), []));
const kv = (s) => Object.fromEntries(String(s || "").split(",").filter(Boolean).map((p) => p.split("=")));
if (!args.brand || !args.out) { console.error("usage: make.mjs --brand <brand> --out <folder> [--hook ..] [--only a,b] [--recommend k=V,..]"); process.exit(1); }

const exists = (p) => access(p).then(() => true, () => false);
const brandDir = join(STUDIO, "brands", args.brand);
const cfgFile = join(brandDir, "styleboard.json");
if (!(await exists(cfgFile))) { console.error(`no ${cfgFile}; copy brands/_example/styleboard.json and edit it`); process.exit(1); }
const B = JSON.parse(await readFile(cfgFile, "utf8"));
const OUT = resolve(String(args.out).replace(/^~/, homedir()));
const ALL = ["style", "color", "layout", "text", "animation", "speed", "sound"];
const only = args.only ? String(args.only).split(",") : ALL;
const rec = { ...(B.recommend || {}), ...kv(args.recommend) };
const fixed = { style: "A", color: "A", layout: "A", text: "A", animation: "A", speed: "B", ...(B.recommend || {}), ...kv(args.defaults) };
fixed.speed = fixed.speed || "B";

// ---------- fonts
const fonts = { display: B.fonts.display, latin: B.fonts.latin, css: "", link: "" };
if (B.fonts.files) {
  fonts.css = B.fonts.files.map((f) => {
    const p = f.path.startsWith("fontsource:") ? join(PUB, "node_modules", "@fontsource", f.path.slice(11)) : resolve(brandDir, f.path);
    return `@font-face{font-family:"${f.family}";font-weight:${f.weight};src:url("file://${p}")}`;
  }).join("");
}
if (B.fonts.google) fonts.link = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${B.fonts.google}&display=swap">`;

const copy = { hook: args.hook || B.sample.hook, sub: args.sub || B.sample.sub, cta: args.cta || B.sample.cta, wordmark: B.wordmark };
const PAL = palettes(B.palette);
const SPEED = { A: 1.45, B: 1.0, C: 0.65 };
const DESC = {
  style: { A: "Clean UI: soft cards, rounded shapes", B: "Paper collage: cream paper, tape, marker highlight", C: "Bold type: hard shadows, square edges" },
  color: { A: PAL.A.name, B: PAL.B.name, C: PAL.C.name },
  layout: { A: LAYOUTS.A.name, B: LAYOUTS.B.name, C: LAYOUTS.C.name },
  text: { A: "Big headline, all at once", B: "Word by word", C: "Caption rail over the picture" },
  animation: { A: "Spring pop", B: "Slide up, then hold", C: "Zoom-through with blur" },
  speed: { A: "Calm: long holds", B: "Normal", C: "Fast: short beats" },
  sound: { A: "Quiet music pad", B: "Click and whoosh effects", C: "Kurdish voiceover" },
};
const TITLES = { style: "Style", color: "Color", layout: "Layout", text: "Text", animation: "Animation", speed: "Speed", sound: "Sound" };
const KIND = { style: "image", color: "image", layout: "image", text: "image", animation: "video", speed: "video", sound: "audio" };

const base = () => ({ palette: PAL[fixed.color], layout: fixed.layout, text: fixed.text, style: fixed.style, anim: fixed.animation, speed: SPEED[fixed.speed], ...copy, fonts });

// ---------- browser
const require = createRequire(join(PUB, "package.json"));
const { chromium } = require("playwright-core");
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const SCENE_FILE = join(tmpdir(), `styleboard-scene-${process.pid}.html`);
// Each scene is loaded from a real file so file:// fonts are allowed; every load is a fresh document, so no stale state.
const load = async (cfg) => { await writeFile(SCENE_FILE, sceneHtml(cfg)); await page.goto("file://" + SCENE_FILE, { waitUntil: "load" }); await page.waitForFunction(() => window.__ready === true, null, { timeout: 15000 }); await page.waitForTimeout(120); };

const AUDIO = resolve(String(args.audio || join(process.cwd(), "assets", "audio")).replace(/^~/, homedir()));
// ---------- --picks "Style B, Color C, Layout B, Text A, Animation C, Speed C, Sound B": one combined preview (still + short clip with the sound)
if (args.picks) {
  const pk = {}; for (const m of String(args.picks).matchAll(/(style|color|layout|text|animation|speed|sound)\s*[:=]?\s*([ABC])/gi)) pk[m[1].toLowerCase()] = m[2].toUpperCase();
  const miss = ALL.filter((k) => !pk[k]);
  if (miss.length) { console.error(`--picks is missing: ${miss.join(", ")}`); await browser.close(); process.exit(1); }
  await mkdir(OUT, { recursive: true });
  const cfg = { ...base(), style: pk.style, palette: PAL[pk.color], layout: pk.layout, text: pk.text, anim: pk.animation, speed: SPEED[pk.speed] };
  await still({ ...cfg, t: 99 }, join(OUT, "combo.png"));
  const secs = 2.9 * cfg.speed + 0.9, silent = join(OUT, "combo-silent.mp4");
  await clip(cfg, silent, secs, 20);
  let audio = null;
  if (pk.sound !== "C") { const s = await soundSamples(OUT); audio = pk.sound === "A" ? s.A : s.B; }
  if (audio) { await sh("ffmpeg", ["-y", "-loglevel", "error", "-i", silent, "-i", join(OUT, audio), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-t", String(secs), join(OUT, "combo.mp4")]); await rm(silent, { force: true }); }
  else await sh("mv", [silent, join(OUT, "combo.mp4")]);
  for (const f of ["A.m4a", "B.m4a"]) await rm(join(OUT, f), { force: true });
  const labels = Object.fromEntries(ALL.map((k) => [k, `${pk[k]} = ${DESC[k][pk[k]]}`]));
  await writeFile(join(OUT, "picks.json"), JSON.stringify({ brand: args.brand, made: new Date().toISOString(), picks: pk, meaning: labels, copy, note: "Combined preview with sample text, not the final reel." }, null, 2) + "\n");
  await browser.close(); await rm(SCENE_FILE, { force: true });
  console.log(`combo: ${join(OUT, "combo.png")}  ${join(OUT, "combo.mp4")}${pk.sound === "C" ? "  (no sound: voiceover picked)" : ""}`);
  if (args.open) await sh("open", [join(OUT, "combo.mp4")]).catch(() => {});
  process.exit(0);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
const board = { brand: args.brand, made: new Date().toISOString(), copy, note: "Sample scenes with sample text, not the final reel. Kurdish text is a draft until the owner approves it.", choices: [] };

async function still(cfg, file) { await load(cfg); await page.screenshot({ path: file, type: "png" }); }
async function clip(cfg, file, seconds, fps) {
  const tmp = join(tmpdir(), `styleboard-${process.pid}-${Math.random().toString(36).slice(2)}`);
  await mkdir(tmp, { recursive: true });
  await load({ ...cfg, t: 0 });
  const n = Math.round(seconds * fps);
  for (let i = 0; i < n; i++) { await page.evaluate((t) => window.__t(t), i / fps); await page.screenshot({ path: join(tmp, `f${String(i).padStart(4, "0")}.jpg`), type: "jpeg", quality: 88 }); }
  await sh("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", join(tmp, "f%04d.jpg"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart", file]);
  await rm(tmp, { recursive: true, force: true });
}

// ---------- sound samples (local files only; nothing is generated with credits)
async function soundSamples(dir) {
  const have = async (f) => (await exists(join(AUDIO, f))) ? join(AUDIO, f) : null;
  const pad = await have("pad.mp3"), click = await have("ui-select-click.mp3"), woosh = await have("air-woosh-quick.mp3"), pop = await have("ui-message-pop.mp3");
  const out = { A: null, B: null, C: null };
  if (pad) { await sh("ffmpeg", ["-y", "-loglevel", "error", "-t", "6", "-i", pad, "-af", "afade=t=in:d=0.8,afade=t=out:st=5:d=1,volume=0.9", "-c:a", "aac", join(dir, "A.m4a")]); out.A = "A.m4a"; }
  if (click && woosh) {
    await sh("ffmpeg", ["-y", "-loglevel", "error", "-i", click, "-i", woosh, "-i", pop || click, "-filter_complex", "[0]adelay=300|300[a];[1]adelay=1100|1100[b];[2]adelay=2300|2300[c];[a][b][c]amix=inputs=3:normalize=0,atrim=0:3.5,afade=t=out:st=3:d=0.5", "-c:a", "aac", join(dir, "B.m4a")]);
    out.B = "B.m4a";
  }
  return out;
}

const t0 = Date.now();
for (const key of ALL.filter((k) => only.includes(k))) {
  const dir = join(OUT, key); await mkdir(dir, { recursive: true });
  const options = [];
  for (const opt of ["A", "B", "C"]) {
    const o = { id: opt, label: DESC[key][opt], recommended: rec[key] === opt, file: null, kind: KIND[key] };
    const cfg = base();
    if (key === "style") cfg.style = opt;
    if (key === "color") cfg.palette = PAL[opt];
    if (key === "layout") { cfg.layout = opt; cfg.safeGuide = true; }
    if (key === "text") { cfg.text = opt; if (opt === "B") cfg.t = 0.1 * cfg.speed + 0.18 * cfg.speed * 2.2; }
    if (key === "animation") { cfg.anim = opt; cfg.speed = SPEED.B; }
    if (key === "speed") { cfg.speed = SPEED[opt]; cfg.anim = fixed.animation; }
    if (key === "sound") { o.file = null; }
    else if (KIND[key] === "image") { o.file = `${key}/${opt}.png`; await still(cfg, join(OUT, o.file)); }
    else { const secs = key === "animation" ? 3.2 : 2.9 * cfg.speed + 0.9; o.file = `${key}/${opt}.mp4`; await clip(cfg, join(OUT, o.file), secs, key === "animation" ? 20 : 15); }
    options.push(o);
  }
  if (key === "sound") {
    const s = await soundSamples(dir);
    for (const o of options) { if (s[o.id]) o.file = `sound/${s[o.id]}`; else o.note = o.id === "C" ? "A Kurdish voiceover uses ElevenLabs credits, so no sample is made. Pick it and Claude states the price before generating." : "Sound files not found; point --audio at a folder with pad.mp3, ui-select-click.mp3, air-woosh-quick.mp3."; }
    options.forEach((o) => { o.kind = o.file ? "audio" : "note"; });
  }
  board.choices.push({ key, title: TITLES[key], options });
  console.log(`✓ ${key}`);
}
await browser.close();
await rm(SCENE_FILE, { force: true });
await writeFile(join(OUT, "board.json"), JSON.stringify(board, null, 2) + "\n");

// ---------- board.html (static; open it in a browser)
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const media = (o) => o.kind === "image" ? `<img src="${esc(o.file)}" alt="">` : o.kind === "video" ? `<video src="${esc(o.file)}" muted loop playsinline autoplay></video>` : o.kind === "audio" ? `<div class="aud"><span>♪</span><audio src="${esc(o.file)}" controls preload="none"></audio></div>` : `<div class="aud note">${esc(o.note || "")}</div>`;
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Style board: ${esc(args.brand)}</title>
<style>:root{--bg:#f7f9fb;--ink:#191c1e;--mute:#5b5f70;--line:#e0e3e5;--acc:#1100ff;--ok:#0b6b2e}@media(prefers-color-scheme:dark){:root{--bg:#0f1115;--ink:#e6e8ec;--mute:#a3a8b8;--line:#272b34;--acc:#9fa2ff;--ok:#7ee08e}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 -apple-system,Inter,system-ui,sans-serif;padding:24px 16px 120px;max-width:1100px;margin-inline:auto}
h1{font-size:24px;margin:0 0 4px}p.s{color:var(--mute);margin:0 0 22px}h2{font-size:18px;margin:30px 0 10px}
.row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
label.o{display:block;border:2px solid var(--line);border-radius:14px;overflow:hidden;cursor:pointer;background:color-mix(in srgb,var(--bg) 92%,var(--ink));position:relative}
label.o:has(input:checked){border-color:var(--acc);box-shadow:0 0 0 3px color-mix(in srgb,var(--acc) 25%,transparent)}
label.o input{position:absolute;opacity:0}label.o img,label.o video{width:100%;aspect-ratio:9/16;object-fit:cover;display:block;background:#000}
.aud{aspect-ratio:9/16;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:14px;text-align:center}.aud span{font-size:44px}.aud audio{width:100%}.aud.note{color:var(--mute);font-size:13px}
.cap{padding:10px 12px}.cap b{font-size:16px}.cap small{display:block;color:var(--mute)}.rec{display:inline-block;margin-left:6px;background:var(--ok);color:#fff;font-size:11px;border-radius:99px;padding:1px 8px;vertical-align:middle}
.bar{position:fixed;left:0;right:0;bottom:0;background:var(--bg);border-top:1px solid var(--line);padding:12px 16px;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap}
.bar code{background:color-mix(in srgb,var(--bg) 85%,var(--ink));padding:6px 10px;border-radius:8px}.bar button{border:0;background:var(--acc);color:#fff;border-radius:10px;padding:9px 16px;font:inherit;cursor:pointer}
@media(max-width:700px){.row{grid-template-columns:1fr 1fr 1fr;gap:8px}.cap{padding:6px}.cap small{font-size:12px}}</style>
<h1>Style board: ${esc(args.brand)}</h1>
<p class="s">Same scene, one change at a time. Pick one option per choice (the green tag is Claude's recommendation), then press <b>Copy my picks</b> and paste them to Claude. These are samples with sample text, not the final reel; Kurdish text is a draft.</p>
${board.choices.map((c) => `<h2>${esc(c.title)}</h2><div class="row">${c.options.map((o) => `<label class="o"><input type="radio" name="${c.key}" value="${o.id}"${o.recommended ? " checked" : ""}>${media(o)}<div class="cap"><b>${o.id}</b>${o.recommended ? '<span class="rec">recommended</span>' : ""}<small>${esc(o.label)}</small></div></label>`).join("")}</div>`).join("")}
<div class="bar"><code id="out"></code><button id="copy">Copy my picks</button></div>
<script>const keys=${JSON.stringify(board.choices.map((c) => [c.key, c.title]))};
function picks(){return keys.map(([k,t])=>{const r=document.querySelector('input[name='+k+']:checked');return t+" "+(r?r.value:"?")}).join(", ")}
function show(){document.getElementById("out").textContent=picks()}
document.addEventListener("change",show);show();
document.getElementById("copy").onclick=async()=>{try{await navigator.clipboard.writeText(picks());document.getElementById("copy").textContent="Copied"}catch{prompt("Copy:",picks())}setTimeout(()=>document.getElementById("copy").textContent="Copy my picks",1500)};</script></html>`;
// By default board.html links to the files next to it (small page; open it from Finder). --inline embeds everything into one file for sharing (it can be several MB).
const MIME = { png: "image/png", mp4: "video/mp4", m4a: "audio/mp4" };
let inlined = html;
if (args.inline) {
  const refs = [...new Set([...html.matchAll(/src="([^"]+\.(?:png|mp4|m4a))"/g)].map((m) => m[1]))];
  let total = 0;
  const data = {};
  for (const rel of refs) { const buf = await readFile(join(OUT, rel)); total += buf.length; data[rel] = `data:${MIME[rel.split(".").pop()]};base64,${buf.toString("base64")}`; }
  if (total < 25 * 1024 * 1024) for (const rel of refs) inlined = inlined.split(`src="${rel}"`).join(`src="${data[rel]}"`);
}
await writeFile(join(OUT, "board.html"), inlined);
console.log(`board: ${join(OUT, "board.html")}  (${((Date.now() - t0) / 1000).toFixed(0)} s)`);

if (args.open) await sh("open", [join(OUT, "board.html")]).catch(() => {});
