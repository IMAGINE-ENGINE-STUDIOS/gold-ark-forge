/**
 * Spot metals adapter — polls the free public gold-api.com endpoint
 * every 5s for XAU/XAG/XPT/XPD USD spot prices. No key, no CORS issues.
 */
import { FeedRouter } from '../router';

const METALS: Array<{ code: string; symbol: string }> = [
  { code: 'XAU', symbol: 'XAU/USD' },
  { code: 'XAG', symbol: 'XAG/USD' },
  { code: 'XPT', symbol: 'XPT/USD' },
  { code: 'XPD', symbol: 'XPD/USD' },
];

let started = false;

async function tick() {
  await Promise.all(METALS.map(async ({ code, symbol }) => {
    const t0 = Date.now();
    try {
      const r = await fetch(`https://api.gold-api.com/price/${code}`);
      if (!r.ok) return;
      const j = await r.json();
      const last = Number(j?.price);
      if (!Number.isFinite(last) || last <= 0) return;
      FeedRouter.publish({
        symbol,
        assetClass: 'metals',
        last,
        ts: Date.now(),
        source: 'gold-api',
        latencyMs: Date.now() - t0,
      });
    } catch { /* silent — no synthetic fallback */ }
  }));
}

export function startMetals() {
  if (started || typeof window === 'undefined') return;
  started = true;
  tick();
  window.setInterval(tick, 5000);
}