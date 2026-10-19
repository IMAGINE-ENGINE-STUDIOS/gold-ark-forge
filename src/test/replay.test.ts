/* ─────────────────── REPLAY SCORECARD (manual, gated) ───────────────────
   Replays APEX, 6X v2 and MICRO-100 through the REAL engine over REAL
   recent 5-minute bars from the app's own market-history function.

   Run with:  RUN_REPLAY=1 npx vitest run src/test/replay.test.ts

   Honest limits of this harness (read before quoting its numbers):
   - Agent verdicts are a deterministic rules stub (the live desk uses
     Groq specialists); screens, programs, exits and accounting are the
     real engine, unmodified.
   - Cooldowns and max-hold exits are wall-clock based, so in
     fast-forward they compress: entry frequency is mildly optimistic
     and positions exit via TP / SL / trailing stop / end-of-run flatten.
   - Bars are closes only — no spread, no slippage, no intraday wicks.
   ──────────────────────────────────────────────────────────────────── */

import { describe, it, expect } from 'vitest';
import { runGraph, type RunHooks, type RunResult } from '@/lib/parallelEngine';
import { classifyAssets, type ClassifiedAsset } from '@/lib/assetClassifiers';
import { buildApexGraph, buildMicroGraph } from '@/lib/apexPreset';
import { buildSipvbGraph } from '@/lib/sipvbPreset';
import { buildSwarmGraph } from '@/lib/swarmPreset';
import type { PipeGraph } from '@/lib/pipelineGraph';

const RUN = process.env.RUN_REPLAY === '1';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuZWNlZ3lianVsdHJqamp3cnIiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4ODgxNjU4NSwiZXhwIjoyMTA0MTcyNTg1fQ.LAjusTWiLNihOj6hisAwSuAhCdBSIGyUnc3itgNU9UA';
const UNIVERSE = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'META', 'AMD', 'COIN', 'SPY', 'QQQ'];

interface Bars { [sym: string]: number[] }

const fetchBars = async (): Promise<Bars> => {
  const r = await fetch('https://vnecegybjluntrjhjwrr.supabase.co/functions/v1/market-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ANON}` },
    body: JSON.stringify({ symbols: UNIVERSE, interval: '5m', range: '5d', points: 480 }),
  });
  const j = await r.json();
  return (j.series ?? {}) as Bars;
};

const replay = async (graph: PipeGraph, bars: Bars, equity: number): Promise<RunResult> => {
  const syms = Object.keys(bars);
  const n = Math.min(...syms.map((s) => bars[s].length));
  const aligned: Bars = {};
  for (const s of syms) aligned[s] = bars[s].slice(bars[s].length - n);

  const SEGMENT = 78; // one trading day of 5m bars = one session, as she runs it
  const WARM = 90;
  const segments = Math.max(1, Math.floor((n - WARM) / SEGMENT));
  const merged: RunResult = {
    trades: [], events: [], realised: 0, fees: 0, ticks: 0,
    stoppedByRisk: false, deployed: 0, peakDeployed: 0, invested: 0,
  } as unknown as RunResult;

  for (let k = 0; k < segments; k++) {
    const segStart = WARM + k * SEGMENT;
    let cursor = segStart;
    const seriesAt = (sym: string) => aligned[sym].slice(Math.max(0, cursor - 90), cursor + 1);
    const priceAt = (sym: string) => aligned[sym][cursor];

    const hooks: RunHooks = {
      getPrice: (t) => priceAt(t),
      getSeries: (t) => seriesAt(t),
      getAccount: () => ({ equity, totalPnl: 0, startingBalance: equity, cash: equity }),
      submitOrder: ({ price }: { price: number }) => ({ id: `replay-${Math.random().toString(36).slice(2, 8)}`, price, fees: 0 }),
      runAgent: async (_step, ctx) => {
        const series = ctx.ticker ? seriesAt(ctx.ticker) : [];
        const mom = series.length > 13 ? (series[series.length - 1] / series[series.length - 13] - 1) * 100 : 0;
        const bullish = ctx.lastAnalysis?.verdict === 'bullish' || mom > 0.15;
        return { verdict: bullish ? 'bullish' : 'neutral', confidence: 0.65, summary: 'replay stub verdict', actions: [] } as any;
      },
      onEvent: () => undefined,
      onTickStart: (tick: number) => { cursor = Math.min(n - 1, segStart + tick - 1); },
    } as unknown as RunHooks;

    Object.defineProperty(hooks, 'classified', {
      get: (): ClassifiedAsset[] =>
        classifyAssets(
          syms.map((s) => {
            const series = seriesAt(s);
            const ref = cursor >= 78 ? aligned[s][cursor - 78] : series[0];
            return {
              ticker: s, label: s, cat: 'stock', symbolKey: s,
              last: priceAt(s),
              change24h: ref ? (priceAt(s) / ref - 1) * 100 : 0,
              samples: series,
            };
          }),
        ),
    });
    (hooks as any).fastForward = true;

    const g = structuredClone(graph);
    g.session = { ...g.session, tickSec: 5, durationMin: (SEGMENT * 5) / 60, flattenOnStop: true };
    const res = await runGraph(g, hooks, () => undefined);
    merged.trades.push(...res.trades);
    merged.events.push(...res.events);
    merged.realised += res.realised;
    merged.fees += res.fees;
    merged.ticks += res.ticks;
    merged.peakDeployed = Math.max(merged.peakDeployed, res.peakDeployed);
    merged.invested += res.invested;
    if (res.stoppedByRisk) merged.stoppedByRisk = true;
  }
  return merged;
};

const scorecard = (name: string, res: RunResult, equity: number) => {
  const closed = res.trades.filter((t) => !t.open);
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0).length;
  const grossWin = closed.filter((t) => (t.pnl ?? 0) > 0).reduce((a, t) => a + (t.pnl ?? 0), 0);
  const grossLoss = closed.filter((t) => (t.pnl ?? 0) <= 0).reduce((a, t) => a + (t.pnl ?? 0), 0);
  return {
    strategy: name,
    trades: closed.length,
    winRatePct: closed.length ? Number(((wins / closed.length) * 100).toFixed(1)) : 0,
    realised: Number(res.realised.toFixed(2)),
    returnOnCapitalPct: Number(((res.realised / equity) * 100).toFixed(2)),
    grossWin: Number(grossWin.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    expectancyPerTrade: closed.length ? Number((res.realised / closed.length).toFixed(2)) : 0,
    peakDeployed: Number(res.peakDeployed.toFixed(0)),
    ticks: res.ticks,
    errors: res.events.filter((e) => e.status === 'error').length,
    errorSamples: [...new Set(res.events.filter((e) => e.status === 'error').map((e) => e.message))].slice(0, 4),
    eventSamples: [...new Set(res.events.slice(0, 400).map((e) => e.message))].slice(0, 6),
  };
};

describe.skipIf(!RUN)('replay scorecard on real bars', () => {
  it('APEX vs 6X vs MICRO over the last 5 days of 5m bars', async () => {
    const bars = await fetchBars();
    expect(Object.keys(bars).length).toBeGreaterThan(5);

    const rows = [];
    rows.push(scorecard('SWARM', await replay(buildSwarmGraph(), bars, 100_000), 25_000));
    rows.push(scorecard('APEX', await replay(buildApexGraph(), bars, 100_000), 25_000));
    rows.push(scorecard('6X v2', await replay(buildSipvbGraph(), bars, 100_000), 25_000));
    rows.push(scorecard('MICRO-100', await replay(buildMicroGraph(), bars, 100), 100));
    // eslint-disable-next-line no-console
    console.log('\n=== REPLAY SCORECARD (real 5m bars, last 5 days) ===\n' + JSON.stringify(rows, null, 2));
    try {
      const fs = await import('node:fs');
      fs.writeFileSync(process.env.REPLAY_OUT ?? '/tmp/replay-results.json', JSON.stringify(rows, null, 2));
    } catch { /* console output is the record */ }
    expect(rows.every((r) => r.errors === 0)).toBe(true);
  }, 900_000);
});
