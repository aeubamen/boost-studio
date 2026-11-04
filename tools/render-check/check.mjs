#!/usr/bin/env node
// render-check: automatic self-review of a finished reel before the user sees it.
// Usage: node check.mjs <file.mp4> [--expect-audio] [--expect-duration 15] [--max-freeze 2.5] [--out dir] [--frames 8]
// Writes <out>/report.json and <out>/sheet.png (contact sheet with safe-area lines). Exit code: 0 pass, 1 revise, 2 fail.
import {spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync, existsSync} from 'node:fs';
import {basename, dirname, join, resolve} from 'node:path';

const args = process.argv.slice(2);
const file = args[0] && !args[0].startsWith('--') ? args[0] : null;
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
if (!file || !existsSync(file)) { console.error('usage: check.mjs <file.mp4> [--expect-audio] [--expect-duration S] [--max-freeze S] [--out dir] [--frames N]'); process.exit(2); }

const abs = resolve(file);
const out = resolve(opt('out', join(dirname(abs), `${basename(abs).replace(/\.[^.]+$/, '')}.review`)));
mkdirSync(out, {recursive: true});
const run = (cmd, a) => spawnSync(cmd, a, {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
const findings = [];
const add = (severity, check, problem, proposed_fix) => findings.push({severity, check, problem, proposed_fix});

// 1. technical probe
const pr = run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', abs]);
let probe; try { probe = JSON.parse(pr.stdout); } catch { probe = null; }
const v = probe?.streams?.find((s) => s.codec_type === 'video');
const a = probe?.streams?.find((s) => s.codec_type === 'audio');
const dur = Number(probe?.format?.duration || 0);
const [num, den] = (v?.r_frame_rate || '0/1').split('/').map(Number);
const fps = den ? num / den : 0;
const tech = {container: probe?.format?.format_name, duration: dur, width: v?.width, height: v?.height, fps, video_codec: v?.codec_name, pix_fmt: v?.pix_fmt, audio_codec: a?.codec_name, size_mb: +(Number(probe?.format?.size || 0) / 1048576).toFixed(2)};
if (!v) add('critical', 'probe', 'No readable video stream.', 'Re-render; confirm the output path and that the render finished.');
else {
  if (v.width !== 1080 || v.height !== 1920) add('critical', 'probe', `Size is ${v.width}x${v.height}, reels need 1080x1920.`, 'Set width 1080 and height 1920 in the composition and re-render.');
  if (fps < 24 || fps > 60) add('suggestion', 'probe', `Frame rate ${fps.toFixed(2)} is unusual.`, 'Render at 30 fps.');
  if (v.pix_fmt === 'yuvj420p') add('suggestion', 'probe', 'Pixel format yuvj420p (full range). Usually plays, but colours can shift on some phones.', 'Optional: ffmpeg -i in.mp4 -vf scale=in_range=full:out_range=tv -pix_fmt yuv420p -c:a copy out.mp4');
  else if (v.pix_fmt && v.pix_fmt !== 'yuv420p') add('critical', 'probe', `Pixel format ${v.pix_fmt} may not play on Instagram/Facebook.`, 'Re-encode with: ffmpeg -i in.mp4 -pix_fmt yuv420p -c:a copy out.mp4');
  if (v.codec_name && v.codec_name !== 'h264') add('suggestion', 'probe', `Video codec is ${v.codec_name}, Meta expects H.264.`, 'Re-encode to h264 (libx264).');
  if (dur < 3) add('critical', 'probe', `Duration ${dur.toFixed(1)}s is too short.`, 'Check the timeline length in the composition.');
  if (dur > 90) add('critical', 'probe', `Duration ${dur.toFixed(1)}s exceeds the 90s reel limit.`, 'Cut to 90s or less.');
  const want = Number(opt('expect-duration', 0));
  if (want && Math.abs(dur - want) > 1) add('critical', 'probe', `Duration ${dur.toFixed(1)}s differs from the planned ${want}s.`, 'Fix the timeline or update the plan, then re-render.');
  if (tech.size_mb > 250) add('suggestion', 'probe', `File is ${tech.size_mb} MB, large for upload.`, 'Re-encode with crf 23.');
}

// 2. black frames and freezes
let black = [], freeze = [];
if (v) {
  const f = run('ffmpeg', ['-hide_banner', '-nostats', '-i', abs, '-vf', 'blackdetect=d=0.3:pix_th=0.06,freezedetect=n=-55dB:d=1', '-an', '-f', 'null', '-']).stderr;
  for (const m of f.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)) black.push([+m[1], +m[2]]);
  const st = [...f.matchAll(/freeze_start: ([\d.]+)/g)].map((m) => +m[1]);
  const du = [...f.matchAll(/freeze_duration: ([\d.]+)/g)].map((m) => +m[1]);
  st.forEach((s, i) => freeze.push([s, s + (du[i] ?? dur - s)]));
  const maxF = Number(opt('max-freeze', 2.5));
  for (const [s, e] of black) {
    if (s < 0.05 && e - s < 0.6) add('suggestion', 'black', `Black at start ${s.toFixed(1)}-${e.toFixed(1)}s.`, 'Start the first scene at frame 0 so the hook shows at once.');
    else add('critical', 'black', `Black frames ${s.toFixed(1)}-${e.toFixed(1)}s.`, 'Find the gap between scenes at that time and extend the neighbouring scene or fix the missing asset.');
  }
  for (const [s, e] of freeze) {
    if (e - s > maxF && e < dur - 0.2) add('suggestion', 'freeze', `Picture is frozen ${s.toFixed(1)}-${e.toFixed(1)}s (${(e - s).toFixed(1)}s).`, 'Add movement (slow zoom or drift), or shorten that hold. Ignore if it is an intended calm hold.');
    if (s < 0.3 && e - s > 1.5) add('critical', 'freeze', `The first ${(e - s).toFixed(1)}s do not move, the hook is lost.`, 'Start motion in the first 0.5s.');
  }
}

// 3. audio
const audio = {present: !!a};
if (a) {
  const r = run('ffmpeg', ['-hide_banner', '-nostats', '-i', abs, '-vn', '-af', 'ebur128=peak=true,silencedetect=n=-50dB:d=1.5', '-f', 'null', '-']).stderr;
  const sum = r.slice(r.lastIndexOf('Summary:'));
  audio.lufs = Number((sum.match(/I:\s+(-?[\d.]+) LUFS/) || [])[1]);
  audio.true_peak_db = Number((sum.match(/Peak:\s+(-?[\d.]+) dBFS/) || [])[1]);
  audio.silences = [...r.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  if (Number.isFinite(audio.lufs)) {
    if (audio.lufs <= -60) add('critical', 'audio', 'The audio track is silent (about -70 LUFS), nothing audible.', 'Check the audio files and volume props in the composition, then re-render.');
    else if (audio.lufs < -23) add('critical', 'audio', `Very quiet: ${audio.lufs} LUFS (target about -14).`, 'Raise music/voice gain, or normalise: ffmpeg -i in.mp4 -af loudnorm=I=-14:TP=-1.5 -c:v copy out.mp4');
    else if (audio.lufs < -18) add('suggestion', 'audio', `Quiet: ${audio.lufs} LUFS (target about -14).`, 'Raise gain by about ' + Math.round(-14 - audio.lufs) + ' dB.');
    else if (audio.lufs > -9) add('critical', 'audio', `Too loud: ${audio.lufs} LUFS.`, 'Lower gain by about ' + Math.round(audio.lufs + 14) + ' dB.');
  }
  if (Number.isFinite(audio.true_peak_db) && audio.true_peak_db > -0.5) add('critical', 'audio', `Clipping risk, true peak ${audio.true_peak_db} dBFS.`, 'Lower gain or add: -af alimiter=limit=0.89');
  if (audio.silences.length && audio.silences[0] < 0.3) add('suggestion', 'audio', 'Audio is silent at the very start.', 'Start the sound or music on frame 0.');
} else if (flag('expect-audio')) add('critical', 'audio', 'No audio track, but sound was planned.', 'Check the Audio/Sequence entries in the composition and the public/audio files, then re-render.');
else add('suggestion', 'audio', 'No audio track. Fine only if the reel is meant to be silent.', 'Add music or sound effects if the brief asked for them.');

// 4. contact sheet with Instagram safe-area lines (top 150, bottom 250 of 1920)
let sheet = null;
if (v) {
  const n = Number(opt('frames', 8));
  const h = v.height || 1920, s = h / 1920;
  const vf = `fps=${n}/${Math.max(dur, 1)},drawbox=x=0:y=${Math.round(150 * s)}:w=iw:h=3:color=red@0.9:t=fill,drawbox=x=0:y=${Math.round((1920 - 250) * s)}:w=iw:h=3:color=red@0.9:t=fill,scale=270:-1,tile=4x${Math.ceil(n / 4)}`;
  const p = join(out, 'sheet.png');
  const r = run('ffmpeg', ['-hide_banner', '-v', 'error', '-y', '-i', abs, '-vf', vf, '-frames:v', '1', p]);
  if (existsSync(p)) sheet = p; else add('suggestion', 'frames', 'Could not make the frame sheet.', 'Run ffmpeg manually on the file to see why.');
}

const status = findings.some((f) => f.severity === 'critical') ? (!v || findings.some((f) => f.check === 'probe' && f.severity === 'critical') ? 'fail' : 'revise') : 'pass';
const report = {file: abs, checked_at: new Date().toISOString(), status, technical_probe: tech, black_frames: black, freezes: freeze, audio_spotcheck: audio, contact_sheet: sheet, findings,
  still_needs_human_eyes: ['Open sheet.png: is any text cut off or inside the red safe-area lines (top 150 / bottom 250)?', 'Kurdish letters joined and right-to-left correct?', 'Does the first frame show the hook?', 'Copy matches the approved text, no invented price or claim?']};
writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));

console.log(`render-check: ${status.toUpperCase()}  ${basename(abs)}  ${tech.width}x${tech.height} ${dur.toFixed(1)}s ${fps.toFixed(0)}fps ${tech.size_mb}MB` + (audio.lufs !== undefined ? `  ${audio.lufs} LUFS` : ''));
for (const f of findings) console.log(`  [${f.severity}] ${f.check}: ${f.problem}\n      fix: ${f.proposed_fix}`);
console.log(`report: ${join(out, 'report.json')}` + (sheet ? `\nsheet:  ${sheet}` : ''));
process.exit(status === 'pass' ? 0 : status === 'revise' ? 1 : 2);
