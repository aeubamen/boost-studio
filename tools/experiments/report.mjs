#!/usr/bin/env node
// Experiment report: reads brands/<brand>/experiments/<id>.json and the publisher's queue/insights.json,
// prints one line per variant and a summary per factor (hook, production, voiceover, concept) against each idea's control (A).
// node tools/experiments/report.mjs brands/<brand>/experiments/<plan>.json [--insights <publisher>/queue/insights.json]
import {readFileSync, existsSync} from 'node:fs';
import {homedir} from 'node:os';
const a = process.argv.slice(2);
const file = a[0];
const opt = (n, d) => { const i = a.indexOf(`--${n}`); return i >= 0 ? a[i + 1] : d; };
if (!file || !existsSync(file)) { console.error('usage: report.mjs <experiment.json> [--insights path]'); process.exit(2); }
const exp = JSON.parse(readFileSync(file, 'utf8'));
const insPath = opt('insights', 'queue/insights.json'); // the publisher's analytics file
const ins = existsSync(insPath) ? JSON.parse(readFileSync(insPath, 'utf8')) : {items: {}};
const minReach = exp.metrics?.min_reach_to_count ?? 300;

const metricsOf = (v) => {
  const item = (v.queue && ins.items[v.queue]) || (v.ig_media_id && ins.items[`ig-${v.ig_media_id}`]) || null;
  const m = item?.networks?.instagram?.metrics;
  if (!m) return null;
  const reach = m.reach || 0, views = m.views || 0;
  const avgWatchS = m.ig_reels_avg_watch_time != null ? m.ig_reels_avg_watch_time / 1000 : null; // the API reports milliseconds
  const retention = avgWatchS != null && v.duration_s ? avgWatchS / v.duration_s : null;
  const per = (x) => (reach > 0 && x != null ? x / reach : null);
  return {reach, views, avgWatchS, retention, shares: per(m.shares), saves: per(m.saved), inter: per(m.total_interactions)};
};
const pct = (x) => (x == null ? '   -  ' : `${(x * 100).toFixed(1).padStart(5)}%`);
const num = (x) => (x == null ? '    -' : String(Math.round(x)).padStart(5));
const median = (xs) => { const s = xs.filter((x) => x != null && Number.isFinite(x)).sort((p, q) => p - q); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };

let measured = 0, planned = 0, done = 0;
const lifts = {hook: [], production: [], voiceover: [], concept: []};
console.log(`${exp.id}: ${exp.ideas.length} ideas, insights generated ${ins.generated_at || 'never'}\n`);
for (const idea of exp.ideas) {
  const rows = idea.variants.map((v) => ({v, m: metricsOf(v)}));
  planned += rows.length; done += rows.filter((r) => r.v.status === 'posted' || r.m).length;
  console.log(`${idea.id} ${idea.topic}`);
  const ctl = rows.find((r) => r.v.role === 'control')?.m;
  for (const {v, m} of rows) {
    if (m) measured++;
    console.log(`  ${v.id.padEnd(8)} ${v.role.padEnd(10)} ${v.status.padEnd(9)} reach ${num(m?.reach)} views ${num(m?.views)} watch ${m?.avgWatchS == null ? '   - ' : m.avgWatchS.toFixed(1).padStart(4) + 's'} retention ${pct(m?.retention)} shares/reach ${pct(m?.shares)} inter/reach ${pct(m?.inter)}${m && m.reach < minReach ? '  (reach below ' + minReach + ': not counted)' : ''}`);
    if (m && ctl && v.role !== 'control' && m.reach >= minReach && ctl.reach >= minReach) {
      const base = ctl.retention != null && m.retention != null ? ['retention', ctl.retention, m.retention] : ['views', ctl.views, m.views];
      if (base[1] > 0) lifts[v.role]?.push({idea: idea.id, metric: base[0], lift: base[2] / base[1] - 1});
    }
  }
}
console.log(`\nprogress: ${done}/${planned} variants posted or measured, ${measured} with insights`);
console.log('\nfactor vs control (lift of the variant over its idea control; retention when available, else views):');
for (const [role, xs] of Object.entries(lifts)) {
  const wins = xs.filter((x) => x.lift > 0).length, med = median(xs.map((x) => x.lift));
  const verdict = xs.length >= 8 && wins >= 7 && med >= 0.15 ? 'WIN' : xs.length >= 8 ? 'no clear effect' : `too early (${xs.length} of 10 ideas measured)`;
  console.log(`  ${role.padEnd(11)} compared ${String(xs.length).padStart(2)} | beat control in ${wins} | median lift ${med == null ? '-' : (med * 100).toFixed(0) + '%'} | ${verdict}`);
}
console.log(`\nrule: a win needs the variant to beat control in >= 7 of 10 ideas and a median lift >= 15%. Numbers are small; treat anything else as a hypothesis.`);
