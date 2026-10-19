import { describe, it, expect } from 'vitest';
import { runGraph, type RunHooks } from '@/lib/parallelEngine';
import { emptyGraph, makeLane, makeStep } from '@/lib/pipelineGraph';
import { classifyAssets, type AssetMetrics } from '@/lib/assetClassifiers';
import { applyRunBudget, previewRunBudget } from '@/lib/runBudget';
import { buildMicroGraph, buildApexGraph } from '@/lib/apexPreset';
import { buildBlitzGraph } from '@/lib/blitzPreset';

describe('run capital — the typed budget rules', () => {
  it('MICRO-100 at $100 keeps its $10 tickets (designed at $100)', () => {
    const p = previewRunBudget(buildMicroGraph(), 100);
    expect(p.budget).toBe(100);
    expect(p.lanes.length).toBeGreaterThanOrEqual(3);
    for (const l of p.lanes) expect(l.ticket).toBe(10);
  });

  it('a $25K strategy run on $100 adapts: budget is $100, tickets shrink to the $5 floor, cap fits the budget', () => {
    const g = buildApexGraph();
    const adapted = applyRunBudget(g, 100);
    expect(adapted.risk.maxTotalInvestmentUsd).toBe(100);
    expect(adapted.risk.maxPerAssetUsd).toBeLessThanOrEqual(100);
    const tickets = adapted.lanes.flatMap((l) => l.steps.filter((s) => s.kind === 'buy').map((s) => Number(s.config.amountUsd)));
    expect(tickets.length).toBeGreaterThan(0);
    for (const t of tickets) {
      expect(t).toBeGreaterThanOrEqual(5);
      expect(t).toBeLessThanOrEqual(100);
    }
    // the saved design is never mutated
    expect(g.risk.maxTotalInvestmentUsd).toBe(25000);
  });

  it('BLITZ at its designed $5,000 keeps $50 tickets', () => {
    const p = previewRunBudget(buildBlitzGraph(), 5000);
    for (const l of p.lanes) expect(l.ticket).toBe(50);
  });

  it('the engine can never deploy more than the typed budget', async () => {
    const g = buildMicroGraph();
    const adapted = applyRunBudget(g, 100);
    adapted.session = { durationMin: 0.2, tickSec: 1, flattenOnStop: true };
    // rising tape so entries fire
    const t0 = Date.now();
    const hooks: RunHooks = {
      getPrice: () => 100 * (1 + Math.min(0.02, ((Date.now() - t0) / 1000) * 0.0005)),
      getSeries: () => Array.from({ length: 60 }, (_, i) => 100 + i * 0.05),
      classified: classifyAssets(['AAA', 'BBB', 'CCC'].map((t) => ({
        ticker: t, label: t, cat: 'stock', symbolKey: t, last: 100, change24h: 3,
        samples: Array.from({ length: 40 }, (_, i) => 100 + i * 0.1),
      } as AssetMetrics))),
      blocks: [],
      getAccount: () => ({ equity: 100000, totalPnl: 0, startingBalance: 100000, cash: 100000 }),
      submitOrder: ({ price }) => ({ id: `o_${Math.random().toString(36).slice(2, 8)}`, price, fees: 0 }),
      closePosition: () => {},
    };
    const res = await runGraph(adapted, hooks, () => {});
    expect(res.peakDeployed).toBeLessThanOrEqual(100.01);
  }, 60000);
});

/* ── The adaptive governor ──────────────────────────────────────── */

const govGraph = () => {
  const g = emptyGraph();
  g.name = 'Governor test';
  g.risk = { maxDrawdownPct: 50, maxTotalInvestmentUsd: 10000, adaptive: true };
  g.session = { durationMin: 0.3, tickSec: 1, flattenOnStop: true };
  const lane = makeLane('Gov lane', 0);
  lane.steps = [
    makeStep('asset', 'Pick an asset', { ticker: 'TEST', label: 'Test asset' }),
    makeStep('buy', 'Buy', { amountUsd: 100, takeProfitPct: 50, stopLossPct: 50, maxHoldMin: 30, maxEntries: 9, cooldownMin: 0 }),
  ];
  g.lanes = [lane];
  return g;
};

const govHooks = (change24h: number): RunHooks => ({
  getPrice: () => 100,
  getSeries: () => Array.from({ length: 60 }, () => 100),
  classified: classifyAssets(['A1', 'A2', 'A3', 'A4', 'A5', 'A6'].map((t) => ({
    ticker: t, label: t, cat: 'stock', symbolKey: t, last: 100, change24h,
    samples: Array.from({ length: 40 }, () => 100),
  } as AssetMetrics))),
  blocks: [],
  getAccount: () => ({ equity: 100000, totalPnl: 0, startingBalance: 100000, cash: 100000 }),
  submitOrder: ({ price }) => ({ id: `o_${Math.random().toString(36).slice(2, 8)}`, price, fees: 0 }),
  closePosition: () => {},
});

describe('adaptive governor — realtime strategy adaptation', () => {
  it('pauses new entries when market breadth collapses', async () => {
    const res = await runGraph(govGraph(), govHooks(-4), () => {});
    expect(res.trades.length).toBe(0);
    expect(res.events.some((e) => e.laneName === 'Governor' && e.message.includes('PAUSED'))).toBe(true);
  }, 60000);

  it('presses ticket size above the design ticket in a hot, broad tape', async () => {
    const res = await runGraph(govGraph(), govHooks(4), () => {});
    expect(res.trades.length).toBeGreaterThan(0);
    const amounts = res.trades.map((t) => t.amountUsd);
    expect(Math.max(...amounts)).toBeGreaterThan(100);
    expect(res.events.some((e) => e.laneName === 'Governor' && e.message.includes('PRESSING'))).toBe(true);
  }, 60000);
});
