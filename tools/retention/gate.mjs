#!/usr/bin/env node
// retention gate: scores one build stage and says whether to go on or go back.
// Usage:
//   node gate.mjs script <script.txt> [--target S]        (wraps lint.mjs)
//   node gate.mjs plan   <plan.json>                      (shots, cuts, animation, keyframes, timing, text, sound)
//   node gate.mjs render <video.mp4>                      (measured on the real file)
// Common: --project <dir>  keeps history in <dir>/retention.json and counts rounds (max 2 per stage, then ask the user).
// Exit: 0 pass (score >= 80, no fail), 1 revise (go back, fix, run again), 2 fail (go back), 3 stop after 2 rounds (ask the user).
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const a = process.argv.slice(2);
const stage = a[0], file = a[1];
const opt = (n, d) => { const i = a.indexOf(`--${n}`); return i >= 0 ? a[i + 1] : d; };
if (!['script', 'plan', 'render'].includes(stage) || !file || !existsSync(file)) {
  console.error('usage: gate.mjs script|plan|render <file> [--target S] [--project dir]'); process.exit(2);
}
const here = dirname(fileURLToPath(import.meta.url));
const items = []; // {sev: fail|warn|info, msg, back, fix}
const add = (sev, msg, fix = '') => items.push({sev, msg, fix});
const BACK = {script: 'studio-script: rewrite the flagged lines', plan: 'the beat map / storyboard (studio-retention sections 2-3): change cuts, scenes, timing', render: 'studio-video: edit timings or animation in the project, re-render'};
const run = (c, args) => spawnSync(c, args, {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});

if (stage === 'script') {
  const args = [join(here, 'lint.mjs'), file]; const t = opt('target'); if (t) args.push('--target', t);
  const r = run('node', args);
  for (const l of r.stdout.split('\n')) {
    const m = l.match(/^(FAIL|WARN|INFO)\s+(.*)$/); if (m) add(m[1] === 'FAIL' ? 'fail' : m[1] === 'WARN' ? 'warn' : 'info', m[2]);
  }
}

if (stage === 'plan') {
  const p = JSON.parse(readFileSync(file, 'utf8'));
  const D = p.duration, shots = p.shots || [];
  if (!D || !shots.length) { add('fail', 'plan has no duration or shots'); }
  else {
    // coverage
    let t = 0; for (const s of shots) { if (Math.abs(s.start - t) > 0.05) add('fail', `shot ${s.id}: gap or overlap at ${t.toFixed(2)} s (starts ${s.start})`, 'make shots contiguous'); t = s.end; }
    if (Math.abs(t - D) > 0.1) add('fail', `shots end at ${t.toFixed(2)} s but duration is ${D} s`);
    // events timeline: cut at every shot start + listed events
    const ev = []; for (const s of shots) { ev.push({t: s.start, type: 'cut', shot: s.id}); for (const e of s.events || []) ev.push({...e, shot: s.id}); }
    ev.sort((x, y) => x.t - y.t);
    // hook
    const hook = shots.find((s) => s.beat === 'hook');
    if (!hook) add('fail', 'no hook shot');
    else {
      const first = (hook.events || []).filter((e) => e.type !== 'cut').sort((x, y) => x.t - y.t)[0];
      if (!first || first.t > 0.5) add('fail', 'nothing moves in the first 0.5 s', 'start the hook shot already moving: push-in, slide or text in at t<=0.3 s');
      if (hook.end > 3.5) add('warn', `hook shot ends at ${hook.end} s; stakes should be seen by about 3 s`, 'cut the hook shot or add the stakes line earlier');
    }
    // gaps between changes
    const pay = shots.find((s) => s.beat === 'payoff');
    let prev = 0;
    for (const e of [...ev.map((x) => x.t), D]) {
      const gap = e - prev;
      const inPay = pay && prev >= pay.start - 0.01 && e <= pay.end + 0.01;
      const limit = inPay ? 2.0 : 3.0;
      if (gap > limit + 1) add('fail', `no change between ${prev.toFixed(1)} s and ${e.toFixed(1)} s (${gap.toFixed(1)} s)`, 'add a cut, punch-in, text change or sound accent in that stretch');
      else if (gap > limit) add('warn', `quiet stretch ${prev.toFixed(1)}-${e.toFixed(1)} s (${gap.toFixed(1)} s)`, 'add a small move or text change');
      prev = e;
    }
    // turns
    for (const s of shots.filter((x) => x.beat === 'turn' || x.beat === 'mid-loop')) {
      const near = (s.events || []).concat([{t: s.start, type: 'cut'}]).filter((e) => e.t - s.start <= 0.5);
      if (!near.length) add('fail', `turn at ${s.start} s has no change in its first 0.5 s`, 'cut or move on the new information');
      if (!(s.events || []).some((e) => e.type === 'sound') && !s.sound) add('warn', `turn at ${s.start} s has no sound accent`, 'add a small accent');
    }
    // payoff
    if (!pay) add('fail', 'no payoff shot');
    else {
      const pos = pay.start / D;
      if (pos < 0.55) add('fail', `payoff starts at ${(pos * 100).toFixed(0)}%`, 'hold the answer back: add a turn before it');
      else if (pos < (D < 12 ? 0.6 : 0.7)) add('warn', `payoff starts at ${(pos * 100).toFixed(0)}%`, 'add a turn before it or trim the setup');
      const evIn = (pay.events || []).filter((e) => e.t > pay.start + 0.01);
      const lastEv = evIn.length ? Math.max(...evIn.map((e) => e.t)) : pay.start;
      if (pay.end - lastEv < 0.5) add('warn', 'payoff has no quiet hold of 0.5 s at its end', 'stop moving things 0.5-1 s before the cut to the CTA');
    }
    // cta
    const ctas = shots.filter((s) => s.beat === 'cta');
    if (ctas.length !== 1) add('fail', `${ctas.length} CTA shots; need exactly 1`);
    else {
      const c = ctas[0]; if (shots[shots.length - 1] !== c) add('fail', 'the CTA shot is not last');
      if (c.end - c.start > 3.2) add('warn', `CTA shot lasts ${(c.end - c.start).toFixed(1)} s`, 'keep it under 3 s');
      if (pay && shots.indexOf(c) < shots.indexOf(pay)) add('fail', 'CTA before payoff');
    }
    // text
    for (const s of shots) {
      if (!s.text) continue; const w = s.text.trim().split(/\s+/).length, dur = s.end - s.start, need = Math.max(1.2, w * 0.3);
      if (w > 9) add('warn', `shot ${s.id}: ${w} words on screen`, 'cut to 7 or fewer');
      if (dur < need - 0.05) add('fail', `shot ${s.id}: text needs ${need.toFixed(1)} s to read, shot is ${dur.toFixed(1)} s`, 'lengthen the shot or shorten the text');
    }
    // keyframes / animation sanity
    for (const s of shots) for (const e of s.events || []) {
      if (e.type === 'move' && e.dur !== undefined && (e.dur < 0.1 || e.dur > 1.2)) add('warn', `shot ${s.id}: move at ${e.t} s lasts ${e.dur} s`, 'typical move is 0.2-0.5 s; payoff landing can be slower');
      if (e.t < s.start - 0.01 || e.t > s.end + 0.01) add('fail', `shot ${s.id}: event at ${e.t} s lies outside the shot (${s.start}-${s.end})`);
    }
    const emph = shots.filter((s) => (s.emphasis || []).length > 1); for (const s of emph) add('warn', `shot ${s.id}: ${s.emphasis.length} emphasised things`, 'one thing per frame');
    if (!p.loop) add('info', 'loop-back not planned (last frame = first frame); optional');
  }
}

if (stage === 'render') {
  const pr = JSON.parse(run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file]).stdout || '{}');
  const dur = Number(pr.format?.duration || 0);
  if (!dur) add('fail', 'cannot read the video'); else {
    const sc = run('ffmpeg', ['-hide_banner', '-i', file, '-vf', "select='gt(scene,0.3)',showinfo", '-an', '-f', 'null', '-']).stderr;
    const cuts = [...sc.matchAll(/pts_time:([\d.]+)/g)].map((m) => Number(m[1]));
    const fz = run('ffmpeg', ['-hide_banner', '-i', file, '-vf', 'freezedetect=n=-50dB:d=0.8', '-an', '-f', 'null', '-']).stderr;
    const freezes = []; let st = null;
    for (const l of fz.split('\n')) { const s1 = l.match(/freeze_start: ([\d.]+)/), e1 = l.match(/freeze_end: ([\d.]+)/); if (s1) st = Number(s1[1]); if (e1 && st !== null) { freezes.push([st, Number(e1[1])]); st = null; } }
    if (st !== null) freezes.push([st, dur]);
    const edges = [0, ...cuts, dur]; let maxGap = 0; for (let i = 1; i < edges.length; i++) maxGap = Math.max(maxGap, edges[i] - edges[i - 1]);
    console.log(`measured: ${dur.toFixed(1)} s, ${cuts.length} hard cuts, longest shot ${maxGap.toFixed(1)} s, freezes ${freezes.map((f) => f.map((x) => x.toFixed(1)).join('-')).join(', ') || 'none'}`);
    // motion in the first 0.5 s: ssim of frame 0 vs frame at 0.5 s
    const tmp = join(process.env.TMPDIR || '/tmp', `ret-${process.pid}`); mkdirSync(tmp, {recursive: true});
    run('ffmpeg', ['-y', '-v', 'error', '-ss', '0', '-i', file, '-frames:v', '1', join(tmp, 'f0.png')]);
    run('ffmpeg', ['-y', '-v', 'error', '-ss', '0.5', '-i', file, '-frames:v', '1', join(tmp, 'f5.png')]);
    run('ffmpeg', ['-y', '-v', 'error', '-ss', String(Math.max(0, dur - 0.1)), '-i', file, '-frames:v', '1', join(tmp, 'fl.png')]);
    const ssim = (x, y) => { const o = run('ffmpeg', ['-hide_banner', '-i', x, '-i', y, '-lavfi', 'ssim', '-f', 'null', '-']).stderr.match(/All:([\d.]+)/); return o ? Number(o[1]) : NaN; };
    const s05 = ssim(join(tmp, 'f0.png'), join(tmp, 'f5.png')), sLoop = ssim(join(tmp, 'f0.png'), join(tmp, 'fl.png'));
    console.log(`measured: change in first 0.5 s (ssim ${s05.toFixed(3)}), last vs first frame (ssim ${sLoop.toFixed(3)})`);
    if (s05 > 0.985) add('fail', 'first frame and the frame at 0.5 s are almost identical: nothing moves at the start', 'start motion on frame 1 in the hook shot');
    for (const [s0, e0] of freezes) { const len = e0 - s0, tail = s0 > dur * 0.8; if (len > 2.5 && !tail) add('fail', `picture frozen ${s0.toFixed(1)}-${e0.toFixed(1)} s`, 'add motion or a cut there'); else if (len > 1.2 && !tail) add('warn', `picture still ${s0.toFixed(1)}-${e0.toFixed(1)} s (${len.toFixed(1)} s)`, 'add a small move; a 0.5-1 s hold is only fine before the CTA'); }
    if (maxGap > 5 && freezes.length === 0) add('info', `longest cut-to-cut shot is ${maxGap.toFixed(1)} s; fine if the picture keeps moving inside it`);
    if (dur > 12 && cuts.length < 2) add('warn', `only ${cuts.length} hard cut(s) in ${dur.toFixed(0)} s`, 'check there is a visible change at every turn (see the frame sheet)');
    if (Number.isFinite(sLoop) && sLoop < 0.5) add('info', 'last frame differs from the first; loop-back not used (optional)');
  }
}

// score + history
const fails = items.filter((i) => i.sev === 'fail').length, warns = items.filter((i) => i.sev === 'warn').length;
const score = Math.max(0, 100 - fails * 25 - warns * 7);
let verdict = fails ? 'fail' : score >= 80 ? 'pass' : 'revise';
let round = 1, stop = false;
const proj = opt('project');
if (proj) {
  const hf = join(resolve(proj), 'retention.json'); const h = existsSync(hf) ? JSON.parse(readFileSync(hf, 'utf8')) : {runs: []};
  const prior = h.runs.filter((r) => r.stage === stage && r.verdict !== 'pass');
  const done = h.runs.some((r) => r.stage === stage && r.verdict === 'pass');
  round = done ? 1 : prior.length + 1;
  if (verdict !== 'pass' && round > 2) stop = true;
  h.runs.push({at: new Date().toISOString(), stage, file, score, verdict, round, fails, warns}); writeFileSync(hf, JSON.stringify(h, null, 2));
}
for (const i of items) console.log(`${i.sev.toUpperCase().padEnd(5)} ${i.msg}${i.fix ? `  -> fix: ${i.fix}` : ''}`);
console.log(`RETENTION GATE [${stage}] score ${score}/100 -> ${verdict.toUpperCase()}${proj ? ` (round ${Math.min(round, 3)} of 2)` : ''}`);
if (verdict !== 'pass') console.log(stop ? 'STOP: two rounds did not fix it. Tell the user what is wrong and ask.' : `GO BACK to ${BACK[stage]}, then run this gate again.`);
process.exit(stop ? 3 : verdict === 'pass' ? 0 : verdict === 'revise' ? 1 : 2);
