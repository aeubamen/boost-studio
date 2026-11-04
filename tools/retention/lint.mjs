#!/usr/bin/env node
// retention lint: checks a tagged script against the story rules in skills/studio-retention.
// Usage: node lint.mjs <script.txt> [--target S] [--wpm 160] [--min 1.2]
// Line format: "[tag] text"  tags: hook stakes setup turn payoff cta  (optional: mid-loop, cta-soft = early mention in the first quarter). Lines starting with # are ignored.
// Exit: 0 ok, 1 warnings, 2 failures.
import {readFileSync, existsSync} from 'node:fs';
const a = process.argv.slice(2);
const file = a[0];
const opt = (n, d) => { const i = a.indexOf(`--${n}`); return i >= 0 ? Number(a[i + 1]) : d; };
if (!file || !existsSync(file)) { console.error('usage: lint.mjs <script.txt> [--target S] [--wpm 160] [--min 1.2]'); process.exit(2); }
const wpm = opt('wpm', 160), min = opt('min', 1.2), target = opt('target', 0);
const TAGS = ['hook', 'stakes', 'setup', 'turn', 'payoff', 'cta'];
const beats = [];
for (const raw of readFileSync(file, 'utf8').split('\n')) {
  const l = raw.trim(); if (!l || l.startsWith('#')) continue;
  const m = l.match(/^\[([a-z-]+)\]\s*(.*)$/i);
  const tag = m ? m[1].toLowerCase() : 'untagged'; const text = m ? m[2] : l;
  beats.push({tag, text, words: text.split(/\s+/).filter(Boolean).length});
}
let t = 0; for (const b of beats) { b.start = t; b.dur = Math.max(min, b.words / wpm * 60); t += b.dur; b.end = t; }
const total = t;
const out = []; const add = (sev, msg) => out.push({sev, msg});
const first = (tag) => beats.find((b) => b.tag === tag);
const idx = (tag) => beats.findIndex((b) => b.tag === tag);
const lastIdx = (tag) => beats.map((b) => b.tag).lastIndexOf(tag);

if (beats.some((b) => b.tag === 'untagged')) add('warn', `untagged lines: ${beats.filter((b) => b.tag === 'untagged').length} (use [${TAGS.join('] [')}])`);
const soft = first('cta-soft');
if (soft && soft.start / total > 0.3) add('warn', `[cta-soft] starts at ${(soft.start / total * 100).toFixed(0)}%; early mention should sit in the first quarter`);
const hook = first('hook'), payoff = first('payoff'), cta = first('cta');
if (!hook) add('fail', 'no [hook] line'); else {
  if (idx('hook') !== 0) add('fail', 'the hook is not the first line');
  if (hook.words > 9) add('warn', `hook has ${hook.words} words; aim for 9 or fewer so it reads in about 1.5 s`);
  if (hook.end > 3.5) add('warn', `hook ends at ${hook.end.toFixed(1)} s; the loop should be open and the stakes seen by about 3 s`);
}
if (!first('stakes') && !first('setup')) add('warn', 'no [stakes] or [setup] right after the hook');
if (!payoff) add('fail', 'no [payoff] line: the promise is never kept');
else {
  const pos = payoff.start / total;
  const [failBelow, warnBelow] = total < 12 ? [0.4, 0.6] : [0.6, 0.7]; // very short videos cannot hold the answer as late
  if (pos < failBelow) add('fail', `payoff starts at ${(pos * 100).toFixed(0)}% of the video; keep the answer back until about 70-90%`);
  else if (pos < warnBelow) add('warn', `payoff starts at ${(pos * 100).toFixed(0)}%; aim for ${total < 12 ? '60' : '70'}-90%`);
  if (pos > 0.92) add('warn', `payoff starts at ${(pos * 100).toFixed(0)}%; leave room to land it and hold`);
}
if (!cta) add('fail', 'no [cta] line');
else {
  if (payoff && idx('cta') < idx('payoff')) add('fail', 'the CTA comes before the payoff');
  if (idx('cta') !== beats.length - 1 || lastIdx('cta') !== beats.length - 1) add('fail', 'the CTA must be the last line, and only one');
  if (beats.filter((b) => b.tag === 'cta').length > 1) add('fail', 'more than one [cta] line: one action only');
  if (cta.dur > 3.2) add('warn', `CTA lasts ${cta.dur.toFixed(1)} s; keep it under 3 s`);
  if (cta.words > 7) add('warn', `CTA has ${cta.words} words; aim for 7 or fewer`);
}
if (payoff && cta) { const after = beats.filter((b, i) => i > idx('payoff') && b.tag !== 'cta' && b.tag !== 'cta-soft'); if (after.length > 1) add('warn', 'more than one line between the payoff and the CTA; the video feels finished after the payoff'); }
const turns = beats.filter((b) => b.tag === 'turn' || b.tag === 'mid-loop').length;
if (total > 12 && turns === 0) add('warn', 'no [turn]: a long video needs a new fact or obstacle every 5-8 s to renew the question');
if (total > 12 && turns > 0 && total / (turns + 1) > 9) add('warn', `only ${turns} turn(s) in ${total.toFixed(0)} s; add one so no stretch goes over about 8 s`);
for (const b of beats) {
  if (b.words > 12) add('warn', `line "${b.text.slice(0, 30)}..." has ${b.words} words; keep on-screen text to about 7-12`);
  if (b.dur > 4.5 && b.tag !== 'payoff') add('warn', `line "${b.text.slice(0, 30)}..." lasts ${b.dur.toFixed(1)} s; split it or give it a cut/motion change at ${(b.start + 2.5).toFixed(1)} s`);
}
if (target && total > target) add('fail', `${(total - target).toFixed(1)} s over the ${target} s target`);
if (hook && cta) { const fw = hook.text.split(/\s+/)[0], lw = cta.text.split(/\s+/).slice(-1)[0]; add('info', `loop-back: make the last frame equal to the first (first word "${fw}", last word "${lw}")`); }

console.log(`${'#'.padStart(2)}  start   end  tag      text`);
beats.forEach((b, i) => console.log(`${String(i + 1).padStart(2)}  ${b.start.toFixed(1).padStart(5)} ${b.end.toFixed(1).padStart(5)}  ${b.tag.padEnd(8)} ${b.text}`));
console.log(`total ${total.toFixed(1)} s`);
for (const o of out) console.log(`${o.sev.toUpperCase().padEnd(5)} ${o.msg}`);
const fails = out.filter((o) => o.sev === 'fail').length, warns = out.filter((o) => o.sev === 'warn').length;
console.log(fails ? 'RESULT: fail' : warns ? 'RESULT: warnings' : 'RESULT: ok');
process.exit(fails ? 2 : warns ? 1 : 0);
