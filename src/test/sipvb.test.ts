import { describe, it, expect, beforeEach } from 'vitest';
import { buildSipvbGraph } from '@/lib/sipvbPreset';
import { validateGraph, saveGraph, loadGraph } from '@/lib/pipelineGraph';
import { PROGRAM_BY_ID } from '@/lib/analysisPrograms';
import { BLOCK_BY_ID } from '@/lib/pipelineBlocks';
import { loadRunMemory, recordRun, clearRunMemory } from '@/lib/pipelineMemory';
import type { RunResult } from '@/lib/parallelEngine';

describe('6X SIP-VB preset', () => {
  it('builds a graph that passes validation with no errors', () => {
    const g = buildSipvbGraph();
    const issues = validateGraph(g, {
      hasProgram: (id) => PROGRAM_BY_ID.has(id),
      hasBlock: (id) => BLOCK_BY_ID.has(id),
    });
    expect(issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(g.lanes.filter((l) => !l.consensus).length).toBe(3);
    expect(g.lanes.some((l) => l.consensus)).toBe(true);
    expect(g.risk.maxDrawdownPct).toBe(3);
    // every buy step harvests at +1%
    const buys = g.lanes.flatMap((l) => l.steps).filter((s) => s.kind === 'buy');
    expect(buys.length).toBe(3);
    buys.forEach((b) => expect(b.config.takeProfitPct).toBe(1.0));
  });

  it('BREAKOUT program fires bullish only on a real range break', () => {
    const prog = PROGRAM_BY_ID.get('breakout_30');
    expect(prog).toBeDefined();
    const flat = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i) * 0.2);
    expect(prog!.run(flat, { window: 30 }).verdict).toBe('neutral');
    const broken = [...flat.slice(0, 39), 102];
    const r = prog!.run(broken, { window: 30 });
    expect(r.verdict).toBe('bullish');
    expect(r.value).toBeGreaterThan(1);
  });
});

describe('pipeline memory', () => {
  beforeEach(() => {
    localStorage.clear();
    clearRunMemory();
  });

  it('graph survives a corrupted main save via the backup', () => {
    const g = buildSipvbGraph();
    saveGraph(g);
    saveGraph({ ...g, name: 'Second save' }); // first save becomes the backup
    localStorage.setItem('ga_pipeline_v4_graph', '{corrupted');
    const loaded = loadGraph();
    expect(loaded.name).toBe('6X — Stocks-in-Play Volatility Breakout');
  });

  it('records runs and reloads them', () => {
    const result = {
      events: [], lanes: [], consensus: [], ticks: 12,
      trades: [{ id: 't1', laneId: 'l', laneName: 'L', stepId: null, ticker: 'XAU', label: 'Gold', side: 'buy', qty: 1, entryPrice: 100, entryAt: 0, exitPrice: 101, exitAt: 1, exitReason: 'target', fees: 0, amountUsd: 100, pnl: 1 }],
      invested: 100, fees: 0, realised: 1, errors: 0, stoppedByRisk: false, startedAt: 0, finishedAt: 1000,
    } as unknown as RunResult;
    recordRun(result, 'Test graph', null);
    const mem = loadRunMemory();
    expect(mem.length).toBe(1);
    expect(mem[0].wins).toBe(1);
    expect(mem[0].realised).toBe(1);
  });
});
