#!/usr/bin/env node
// List Gemini TTS voices: node --env-file=.env.local tools/gemini-tts/voices.mjs [--lang ckb] [--persona Narrator] [--json] [--all] [--featured]
const a = process.argv.slice(2);
const opt = (n, d) => { const i = a.indexOf(`--${n}`); return i >= 0 ? a[i + 1] : d; };
const key = process.env.GEMINI_API_KEY; if (!key) { console.error('needs GEMINI_API_KEY'); process.exit(2); }
const q = new URLSearchParams({page_size: '100'});
if (opt('lang')) q.append('language_code', opt('lang'));
if (opt('persona')) q.append('persona', opt('persona'));
let v = [], tok = '', j = {};
for (let page = 0; page < 60; page++) {
  const qq = new URLSearchParams(q); if (tok) qq.set('page_token', tok);
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/voices?${qq}`, {headers: {'x-goog-api-key': key}});
  j = await r.json().catch(() => ({}));
  if (!r.ok) { console.error('HTTP', r.status, JSON.stringify(j).slice(0, 300)); process.exit(1); }
  v = v.concat(j.voices || []); tok = j.next_page_token || j.nextPageToken || '';
  if (!tok || !a.includes('--all')) break;
}
if (a.includes('--featured')) v = v.filter((x) => !String(x.id).includes('-'));
if (a.includes('--json')) { console.log(JSON.stringify(v, null, 1)); process.exit(0); }
console.log(`${v.length} voices${j.next_page_token || j.nextPageToken ? ' (more pages)' : ''}`);
for (const x of v.slice(0, 60)) console.log(JSON.stringify({name: x.id, ...Object.fromEntries(Object.entries(x).filter(([k]) => /persona|gender|language|region|description|type/i.test(k)).map(([k, val]) => [k, typeof val === 'string' ? val.slice(0, 60) : val]))}).slice(0, 300));
