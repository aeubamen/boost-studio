#!/usr/bin/env node
// Design a custom Gemini voice from a text description (stored in your Google project, id voice_...):
// Remix an existing voice (keeps its character, changes what you describe): add --base voice_xxx
// node --env-file=.env.local tools/gemini-tts/design-voice.mjs --name "Marketer v1" --gender male --lang ckb --prompt "<description>" --out preview.wav
import {writeFileSync} from 'node:fs';
const a = process.argv.slice(2);
const opt = (n, d) => { const i = a.indexOf(`--${n}`); return i >= 0 ? a[i + 1] : d; };
const key = process.env.GEMINI_API_KEY; if (!key || !opt('prompt')) { console.error('needs GEMINI_API_KEY and --prompt'); process.exit(2); }
const voice = {model: opt('model', 'gemini-3.8-flash-tts'), type: 'prompted', display_name: opt('name', 'designed voice'), gender: opt('gender', 'male'), language_code: opt('lang', 'ckb'), prompted: opt('base') ? {base_voice: opt('base'), input: opt('prompt')} : {input: opt('prompt')}};
const r = await fetch('https://generativelanguage.googleapis.com/v1beta/voices', {method: 'POST', headers: {'content-type': 'application/json', 'x-goog-api-key': key}, body: JSON.stringify({store: true, voice})});
const j = await r.json().catch(() => ({}));
if (!r.ok) { console.error('HTTP', r.status, JSON.stringify(j).slice(0, 500)); process.exit(1); }
const id = j.id || j.name || j.voice?.id; const wav = j.sample_audio?.data || j.voice?.sample_audio?.data;
console.log('voice id:', id);
if (wav && opt('out')) { writeFileSync(opt('out'), Buffer.from(wav, 'base64')); console.log('preview saved', opt('out')); }
else console.log('response keys:', Object.keys(j).join(','));
