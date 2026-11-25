#!/usr/bin/env node
// Gemini 3.8 TTS test: node --env-file=.env.local tools/gemini-tts/say.mjs "<text>" --out file.wav [--voice Kore] [--style "calm"] [--model gemini-3.8-flash-tts]
// Uses the Interactions API (v1beta). Key from GEMINI_API_KEY (never printed). Text is spoken verbatim; put delivery in --style, pauses as <short pause>.
import {writeFileSync} from 'node:fs';
const a = process.argv.slice(2);
const text = a[0];
const opt = (n, d) => { const i = a.indexOf(`--${n}`); return i >= 0 ? a[i + 1] : d; };
const provider = opt('provider', 'gemini'); // gemini = Google free tier (option 1), openrouter = paid, works where Google billing is blocked (option 2)
const key = provider === 'openrouter' ? process.env.OPENROUTER_API_KEY : process.env.GEMINI_API_KEY;
if (!text || !key) { console.error(`usage: say.mjs "<text>" --out f.wav [--voice Kore] [--style s] [--provider gemini|openrouter]; needs ${provider === 'openrouter' ? 'OPENROUTER_API_KEY' : 'GEMINI_API_KEY'}`); process.exit(2); }
if (provider === 'openrouter') { // POST /api/v1/audio/speech (from the model page; UNTESTED until a key exists). Custom voice_... ids may not work here: use a prebuilt name.
  const {spawnSync} = await import('node:child_process');
  const out = opt('out', 'out.wav'); const asMp3 = out.endsWith('.mp3'); const tmp = asMp3 ? out : out.replace(/\.wav$/, '.or.pcm'); // default format is raw PCM s16le 24 kHz mono
  const r = await fetch('https://openrouter.ai/api/v1/audio/speech', {method: 'POST', headers: {'content-type': 'application/json', authorization: `Bearer ${key}`}, body: JSON.stringify({model: opt('model', 'google/gemini-3.8-flash-tts'), input: text, voice: opt('voice', 'Kore'), response_format: asMp3 ? 'mp3' : 'pcm', ...(opt('style') ? {instructions: opt('style')} : {})})});
  if (!r.ok) { console.error('HTTP', r.status, (await r.text()).slice(0, 300).replace(key, '<key>')); process.exit(1); }
  const buf = Buffer.from(await r.arrayBuffer()); writeFileSync(tmp, buf);
  const secs = asMp3 ? null : +(buf.length / 48000).toFixed(2); // PCM s16le 24 kHz mono = 48000 bytes/s
  try { // local log for tools/openrouter/usage.mjs (cost is read from the real OpenRouter usage, not guessed)
    const {appendFileSync, mkdirSync} = await import('node:fs'); const lp = new URL('../../logs/', import.meta.url).pathname; mkdirSync(lp, {recursive: true});
    appendFileSync(lp + 'tts.jsonl', JSON.stringify({at: new Date().toISOString(), provider: 'openrouter', model: opt('model', 'google/gemini-3.8-flash-tts'), voice: opt('voice', 'Kore'), chars: text.length, seconds: secs, genId: r.headers.get('x-generation-id') || undefined, brand: opt('brand')}) + '\n');
  } catch {}
  if (!asMp3) { spawnSync('ffmpeg', ['-y', '-v', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', tmp, out]); (await import('node:fs')).unlinkSync(tmp); }
  console.log(`saved ${out} via openrouter`); process.exit(0);
}
const part = {type: 'text', text};
if (opt('style')) part.annotations = [{type: 'speech_metadata', style: opt('style')}];
const body = {
  model: opt('model', 'gemini-3.8-flash-tts'),
  input: [{type: 'user_input', content: [part]}],
  response_format: {type: 'audio'},
  generation_config: {speech_config: [{voice: opt('voice', 'Kore')}]},
};
let r, j;
for (let t = 0; t < 4; t++) { // free tier rate limit (429): wait and retry
  r = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {method: 'POST', headers: {'content-type': 'application/json', 'x-goog-api-key': key}, body: JSON.stringify(body)});
  j = await r.json().catch(() => ({}));
  if (r.status !== 429) break;
  if (/per day|daily/i.test(JSON.stringify(j))) { console.error('DAILY LIMIT reached on the Gemini free tier (10 requests per day per model). Use --provider openrouter or retry tomorrow:', JSON.stringify(j).slice(0, 200).replace(key, '<key>')); process.exit(4); }
  console.error('rate limited, waiting 30 s'); await new Promise((res) => setTimeout(res, 30000));
}
if (!r.ok) { console.error('HTTP', r.status, JSON.stringify(j).slice(0, 400).replace(key, '<key>')); process.exit(1); }
const find = (o) => { if (!o || typeof o !== 'object') return null; if (typeof o.data === 'string' && o.data.length > 1000) return o.data; for (const v of Object.values(o)) { const f = find(v); if (f) return f; } return null; };
const data = j.output_audio?.data || find(j);
if (!data) { console.error('no audio in response; keys:', Object.keys(j).join(',')); process.exit(1); }
const buf = Buffer.from(data, 'base64'); const out = opt('out', 'out.wav'); writeFileSync(out, buf);
console.log(`saved ${out} (${buf.length} bytes, header ${buf.subarray(0, 4).toString()})`, j.usage ? `usage ${JSON.stringify(j.usage)}` : '');
