#!/usr/bin/env node
// OpenRouter spend monitor for this studio's key: node --env-file=.env.local tools/openrouter/usage.mjs
// Shows usage and limit of OPENROUTER_API_KEY (GET /api/v1/key) and, when the key may read it, account credits (GET /api/v1/credits).
// Per-request detail (model, tokens, cost) is in the Activity dashboard: https://openrouter.ai/activity . The key is never printed.
const key = process.env.OPENROUTER_API_KEY;
if (!key) { console.error('needs OPENROUTER_API_KEY'); process.exit(2); }
const get = async (p) => {
  const r = await fetch(`https://openrouter.ai/api/v1/${p}`, {headers: {authorization: `Bearer ${key}`}});
  return {status: r.status, body: await r.json().catch(() => ({}))};
};
const usd = (n) => (typeof n === 'number' ? `$${n.toFixed(4)}` : 'n/a');
const k = await get('key');
const d = k.body.data || {};
console.log(k.status === 200
  ? `key "${d.label || '?'}": usage ${usd(d.usage)} total, today ${usd(d.usage_daily)}, this month ${usd(d.usage_monthly)}; limit ${d.limit == null ? 'none' : usd(d.limit)}; remaining ${d.limit_remaining == null ? 'n/a' : usd(d.limit_remaining)}; free tier ${d.is_free_tier}`
  : `key check failed: HTTP ${k.status} ${JSON.stringify(k.body).slice(0, 160)}`);
const c = await get('credits');
if (c.status === 200 && c.body.data) {
  const t = c.body.data;
  console.log(`account credits: bought ${usd(t.total_credits)}, used ${usd(t.total_usage)}, left ${usd(t.total_credits - t.total_usage)}`);
} else {
  console.log('account credits: not readable with this key (needs a management key); see https://openrouter.ai/credits');
}
