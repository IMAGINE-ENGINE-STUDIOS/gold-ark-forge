import { describe, it, expect } from 'vitest';
import { buildJournalRow } from '@/lib/tradeJournal';
import { pickScenario, mulberry32, TM_POOL, type Bars } from '@/lib/timeMachine';

describe('trade journal rows', () => {
  it('maps a fill into an idempotent journal row', () => {
    const row = buildJournalRow({
      clientOrderId: 'ord-1', ticker: 'AAPL', side: 'sell', qty: 0.5, price: 200,
      fees: 0.02, closedPnl: 3.5, filledAt: 1700000000000, source: 'pipeline', runId: 'run-9',
    }, 'user-1');
    expect(row.user_id).toBe('user-1');
    expect(row.client_order_id).toBe('ord-1');
    expect(row.run_id).toBe('run-9');
    expect(row.closed_pnl).toBe(3.5);
    expect(row.filled_at).toBe(new Date(1700000000000).toISOString());
  });
  it('opens carry no pnl and default the run to null', () => {
    const row = buildJournalRow({
      clientOrderId: 'ord-2', ticker: 'TSLA', side: 'buy', qty: 1, price: 250,
      fees: 0, filledAt: 1700000000000, source: 'swap',
    }, 'user-1');
    expect(row.closed_pnl).toBeNull();
    expect(row.run_id).toBeNull();
  });
});

describe('time machine scenarios', () => {
  const bars: Bars = {};
  for (const s of TM_POOL) bars[s] = Array.from({ length: 400 }, (_, i) => 100 + i * 0.01);

  it('the rng is deterministic per seed', () => {
    const a = mulberry32(42); const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it('the same seed replays the same scenario exactly', () => {
    expect(pickScenario(7, TM_POOL, bars)).toEqual(pickScenario(7, TM_POOL, bars));
  });
  it('different seeds draw different scenarios', () => {
    const sig = (seed: number) => JSON.stringify(pickScenario(seed, TM_POOL, bars));
    const sigs = new Set([1, 2, 3, 4, 5].map(sig));
    expect(sigs.size).toBe(5);
  });
  it('scenario shape is sane: 10 names, window inside the bars, friction 2-5bps', () => {
    const sc = pickScenario(99, TM_POOL, bars);
    expect(sc.universe.length).toBe(10);
    expect(sc.startBar).toBeGreaterThanOrEqual(90);
    expect(sc.startBar + sc.segLen * sc.sessions).toBeLessThanOrEqual(sc.totalBars);
    expect(sc.frictionBps).toBeGreaterThanOrEqual(2);
    expect(sc.frictionBps).toBeLessThanOrEqual(5);
  });
});
