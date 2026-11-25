#!/usr/bin/env node
// Voiceover for a script: RastNus Kurdish check -> Gemini TTS per line in the brand's voice -> one WAV (-> optional earshot measure).
// node --env-file=.env.local tools/voiceover/run.mjs <script.txt> --brand <brand> [--provider gemini|openrouter (default: the brand's tts.provider)] [--out out.wav] [--accept-fixes] [--skip-rastnus] [--gap 0.35] [--earshot]
// Option 1 provider gemini = Google free tier (GEMINI_API_KEY, rate limited); option 2 openrouter = paid (OPENROUTER_API_KEY).
// Voice and default style come from brands/<brand>/brand.json "tts". Lines starting with # are ignored; a leading [tag] is stripped.
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {homedir} from 'node:os';
const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '../..');
const a = process.argv.slice(2); const file = a[0];
const opt = (n, d) => { const i = a.indexOf(`--${n}`); return i >= 0 ? a[i + 1] : d; };
const brand = opt('brand'); if (!file || !existsSync(file) || !brand) { console.error('usage: run.mjs <script.txt> --brand <brand> [--provider gemini|openrouter] [--out f.wav] [--accept-fixes] [--skip-rastnus] [--earshot]'); process.exit(2); }
const tts = JSON.parse(readFileSync(join(root, 'brands', brand, 'brand.json'), 'utf8')).tts; if (!tts?.voice) { console.error(`brand ${brand} has no tts.voice`); process.exit(2); }
const provider = opt('provider', tts.provider || 'gemini'), out = resolve(opt('out', `${file.replace(/\.[^.]+$/, '')}.${brand}.wav`)), gap = opt('gap', '0.35');
const work = join(dirname(out), `.${brand}-vo-work`); mkdirSync(work, {recursive: true});
let src = file;
if (!a.includes('--skip-rastnus')) {
  const fixed = join(work, 'script.rastnus.txt');
  const r = spawnSync('node', [join(root, 'tools/rastnus/check.mjs'), file, '--out', fixed], {stdio: 'inherit'});
  if (r.status === 1 && !a.includes('--accept-fixes')) { console.error('\nRastNus changed some lines. Review the diff, fix the script (or rerun with --accept-fixes to use the corrected copy). Stopping before any TTS call.'); process.exit(3); }
  if (r.status === 1) src = fixed; else if (r.status !== 0) { console.error('RastNus failed; rerun with --skip-rastnus only if you accept the risk.'); process.exit(2); }
}
const lines = readFileSync(src, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.replace(/^\[[a-z-]+\]\s*/i, ''));
console.log(`${lines.length} line(s), voice ${tts.voice}, provider ${provider}`);
const wavs = [];
lines.forEach((text, i) => {
  const f = join(work, `l${String(i + 1).padStart(2, '0')}.wav`);
  const r = spawnSync('node', [join(root, 'tools/gemini-tts/say.mjs'), text, '--voice', tts.voice, '--style', tts.style_default || '', '--provider', provider, '--out', f], {stdio: ['ignore', 'inherit', 'inherit'], env: process.env});
  if (r.status !== 0) { console.error(`line ${i + 1} failed`); process.exit(1); }
  wavs.push(f);
});
spawnSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', `anullsrc=r=24000:cl=mono`, '-t', gap, join(work, 'gap.wav')]);
const list = wavs.flatMap((w, i) => (i ? [join(work, 'gap.wav'), w] : [w])).map((w) => `file '${w}'`).join('\n');
writeFileSync(join(work, 'list.txt'), list);
spawnSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', join(work, 'list.txt'), '-ar', '24000', '-ac', '1', out]);
// normalize: TTS output can be hot or clip (an OpenRouter sample read peak +0.5 dBFS, -10.7 LUFS); target about -16 LUFS for dialogue, true peak -1.5
const norm = out.replace(/\.wav$/, '.norm.wav'); spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', out, '-af', `loudnorm=I=${opt('lufs', '-16')}:TP=-1.5:LRA=11`, '-ar', '24000', '-ac', '1', norm]);
if (existsSync(norm)) { spawnSync('mv', ['-f', norm, out]); }
const d = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out], {encoding: 'utf8'}).stdout.trim();
console.log(`voiceover: ${out} (${Number(d).toFixed(1)} s)`);
if (a.includes('--earshot')) spawnSync(process.env.EARSHOT_PYTHON || 'python3', ['-m', 'earshot', 'measure', out], {stdio: 'inherit'});
