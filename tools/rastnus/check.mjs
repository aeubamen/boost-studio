#!/usr/bin/env node
// RastNus (local Sorani spell/grammar/punctuation corrector) over a script file, one line per beat.
// node tools/rastnus/check.mjs <script.txt> [--out fixed.txt] [--keep-server]
// Starts llama-server on :8080 if it is not running (and stops it afterwards), shows a before/after diff per line, writes the
// corrected text to --out (default <script>.rastnus.txt) and NEVER overwrites the original. Exit 0 = no changes, 1 = changes found.
// Rules (from the 5B model's known risks): keep brand and model names as written, review every diff, never apply blindly.
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {homedir} from 'node:os';
const a = process.argv.slice(2);
const file = a[0]; if (!file || !existsSync(file)) { console.error('usage: check.mjs <script.txt> [--out f] [--keep-server]'); process.exit(2); }
const out = a.includes('--out') ? a[a.indexOf('--out') + 1] : file.replace(/(\.[^./]+)?$/, '.rastnus.txt');
const MODEL = `${homedir()}/models/rastnus-small/RastNus-Small-5B-Q4_K_M.gguf`, BASE = 'http://127.0.0.1:8080';
const up = async () => { try { return (await fetch(`${BASE}/health`)).ok; } catch { return false; } };
let child = null;
if (!(await up())) {
  if (!existsSync(MODEL)) { console.error('RastNus model not found:', MODEL); process.exit(2); }
  console.error('starting llama-server (RastNus 5B, about 4 GB RAM)...');
  child = spawn('llama-server', ['-m', MODEL, '--jinja', '-ngl', '99', '--port', '8080'], {stdio: 'ignore', detached: false});
  for (let i = 0; i < 120 && !(await up()); i++) await new Promise((r) => setTimeout(r, 2000));
  if (!(await up())) { console.error('server did not start'); child.kill(); process.exit(2); }
}
const lines = readFileSync(file, 'utf8').split('\n');
let changed = 0; const fixed = [];
for (const raw of lines) {
  const m = raw.match(/^((?:\[[a-z-]+\]\s*)?)(.*)$/i); const tag = m[1], text = m[2].trim();
  if (!text || raw.trim().startsWith('#') || !/[؀-ۿ]/.test(text)) { fixed.push(raw); continue; }
  const r = await fetch(`${BASE}/v1/chat/completions`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({messages: [{role: 'user', content: text}], temperature: 0, chat_template_kwargs: {punctuationEnabled: true, kurdishPureMode: false}})});
  const j = await r.json(); const fix = (j.choices?.[0]?.message?.content || '').trim() || text;
  fixed.push(tag + fix);
  if (fix !== text) { changed++; console.log(`- ${text}\n+ ${fix}\n`); }
}
writeFileSync(out, fixed.join('\n'));
console.log(changed ? `${changed} line(s) changed; review the diff above. Corrected copy: ${out} (original untouched). Keep brand/model names as written.` : 'no changes');
if (child && !a.includes('--keep-server')) child.kill();
process.exit(changed ? 1 : 0);
