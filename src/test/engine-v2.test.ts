import { describe, it, expect } from 'vitest';
import { runGraph, type RunHooks } from '@/lib/parallelEngine';
import { emptyGraph, makeLane, makeStep, validateGraph } from '@/lib/pipelineGraph';
import { PROGRAM_BY_ID } from '@/lib/analysisPrograms';
import { BLOCK_BY_ID } from '@/lib/pipelineBlocks';
import { classifyAssets, rankByClass, type AssetMetrics } from '@/lib/assetClassifiers';
import { BUILT_IN_STRATEGIES } from '@/lib/strategyLibrary';

/* Price as a function of elapsed time, so a run can be scripted:
   flat at 100, step to 101.5 (past the +1% target), then to 102.2
   (past the +2% runner target), then back to 100. */
const scriptedPrice = (t0: number) => () => {
  const el = Date.now() - t0;
  if (el < 3500) return 100;
  if (el < 8000) return 101.5;
  if (el < 11500) return 102.2;
  return 100;
};

const makeHooks = (getPrice: () => number, extra: Partial<RunHooks> = {}): RunHooks => ({
  getPrice,
  getSeries: () => Array.from({ length: 60 }, () => 100),
  classified: [],
  blocks: [],
  getAccount: () => ({ equity: 100000, totalPnl: 0, startingBalance: 100000, cash: 100000 }),
  submitOrder: ({ price }) => ({ id: `o_${Math.random().toString(36).slice(2, 8)}`, price, fees: 0 }),
  closePosition: () => {},
  ...extra,
});

const oneLaneGraph = (buyConfig: Record<string, any>, budget = 1000) => {
  const g = emptyGraph();
  g.name = 'Engine test';
  g.risk = { maxDrawdownPct: 50, maxTotalInvestmentUsd: budget };
  g.session = { durationMin: 0.22, tickSec: 2, flattenOnStop: true };
  const lane = makeLane('Test lane', 0);
  lane.steps = [
    makeStep('asset', 'Pick an asset', { ticker: 'TEST', label: 'Test asset' }),
    makeStep('buy', 'Buy', {
      amountUsd: 1000, takeProfitPct: 1.0, stopLossPct: 0.5, maxHoldMin: 30,
      maxEntries: 3, cooldownMin: 0, scaleOutPct: 0, takeProfit2Pct: 0, trailPct: 0,
      ...buyConfig,
    }),
  ];
  g.lanes = [lane];
  return g;
};

describe('engine v2 — capital accounting', () => {
  it('releases capital when a position closes, so the budget recycles', async () => {
    const t0 = Date.now();
    const res = await runGraph(oneLaneGraph({}), makeHooks(scriptedPrice(t0)), () => {});
    // budget was $1,000 and each position is $1,000: a second entry is only
    // possible if the first position's capital was released on close.
    const buys = res.events.filter((e) => e.message.startsWith('Bought $')).length;
    expect(buys).toBeGreaterThanOrEqual(2);
    expect(res.peakDeployed).toBe(1000);
    expect(res.invested).toBeGreaterThanOrEqual(2000);
  }, 30000);

  it('banks the scale-out harvest, then closes the runner at the second target', async () => {
    const t0 = Date.now();
    const res = await runGraph(
      oneLaneGraph({ scaleOutPct: 50, takeProfit2Pct: 2.0, trailPct: 0.4 }),
      makeHooks(scriptedPrice(t0)),
      () => {},
    );
    const banked = res.events.find((e) => e.message.includes('Banked the +1% harvest on 50%'));
    expect(banked).toBeDefined();
    // The scaled trade must show a genuinely banked leg (scripted at +1.5% or
    // better on $500 of the $1,000 position = +$7.50 or more before fees of 0).
    const scaled = res.trades.find((t) => t.scaledOut);
    expect(scaled).toBeDefined();
    expect(scaled!.realisedPnl ?? 0).toBeGreaterThan(5);
  }, 30000);
});

describe('engine v2 — agent discipline', () => {
  it('throttles agent calls and never errors the lane when the agent fails', async () => {
    let calls = 0;
    const g = oneLaneGraph({});
    g.lanes[0].steps = [
      makeStep('asset', 'Pick an asset', { ticker: 'TEST', label: 'Test asset' }),
      makeStep('agent', 'Entry Sniper', { agentName: 'Entry Sniper', everyTicks: 6, minConfidence: 0.5 }),
      makeStep('buy', 'Buy', { amountUsd: 100, takeProfitPct: 1, stopLossPct: 0.5, maxHoldMin: 30, maxEntries: 1, cooldownMin: 0 }),
    ];
    const res = await runGraph(g, makeHooks(() => 100, {
      runAgent: async () => { calls += 1; throw new Error('groq busy'); },
    }), () => {});
    expect(calls).toBeLessThanOrEqual(2); // first tick + at most one interval retry — never an every-tick error storm
    expect(res.errors).toBe(0);
    expect(res.events.some((e) => e.message.includes('unavailable this tick'))).toBe(true);
  }, 30000);
});

describe('precision programs', () => {
  it('BREAKOUT CONFIRM ignores a one-print poke but blesses a held break', () => {
    const prog = PROGRAM_BY_ID.get('breakout_confirm')!;
    const base = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i) * 0.2);
    const poke = [...base.slice(0, 39), 102];
    expect(prog.run(poke, { window: 30, hold: 3 }).verdict).toBe('neutral');
    const held = [...base.slice(0, 36), 101.5, 101.6, 101.7, 101.8];
    expect(prog.run(held, { window: 30, hold: 3 }).verdict).toBe('bullish');
  });

  it('PULLBACK ENTRY fires on an orderly retest that holds above the break', () => {
    const prog = PROGRAM_BY_ID.get('pullback_entry')!;
    const base = Array.from({ length: 30 }, () => 100);
    const series = [...base, 100.5, 101.2, 101.4, 101.2, 101.05, 101.1, 101.08, 101.12, 101.1, 101.15, 101.1, 101.12];
    const r = prog.run(series, { window: 30 });
    expect(r.verdict).toBe('bullish');
  });
});

describe('screens — evidence discipline', () => {
  const asset = (samples: number[], change24h: number): AssetMetrics => ({
    ticker: 'TST', label: 'Test', cat: 'stocks', symbolKey: 'TST',
    last: samples[samples.length - 1], change24h, samples,
  });

  it('rankByClass refuses thin evidence', () => {
    const thin = classifyAssets([asset([100, 101, 103], 9)]);
    expect(rankByClass(thin, 'hottest').length).toBe(0);
    const deep = classifyAssets([asset(Array.from({ length: 30 }, (_, i) => 100 + i * 0.3), 9)]);
    expect(rankByClass(deep, 'hottest').length).toBe(1);
  });

  it('STOCKS IN PLAY needs a move, volatility and deep samples', () => {
    const mk = (n: number, drift: number) => classifyAssets([asset(Array.from({ length: n }, (_, i) => 100 * (1 + (drift * i) / n / 100) + Math.sin(i) * 0.15), drift)]);
    expect(rankByClass(mk(30, 4), 'in_play').length).toBe(1);
    expect(rankByClass(mk(4, 4), 'in_play').length).toBe(0);
  });

  it('MOMENTUM SURGE is directional now — a crash does not qualify', () => {
    const crash = classifyAssets([asset(Array.from({ length: 30 }, (_, i) => 100 - i * 0.25), -6)]);
    expect(rankByClass(crash, 'momentum_surge').length).toBe(0);
    expect(rankByClass(crash, 'momentum_crash').length).toBe(1);
  });
});

describe('strategy library', () => {
  it('every built-in strategy validates with no errors', () => {
    for (const entry of BUILT_IN_STRATEGIES) {
      const g = entry.build();
      const issues = validateGraph(g, {
        hasProgram: (id) => PROGRAM_BY_ID.has(id),
        hasBlock: (id) => BLOCK_BY_ID.has(id),
      });
      expect(issues.filter((i) => i.level === 'error'), entry.name).toEqual([]);
    }
  });
});

describe('agent blackboard + committee voting', () => {
  const verdicts: Record<string, { verdict: string; confidence: number }> = {
    Sniper: { verdict: 'bullish', confidence: 0.8 },
    Breadth: { verdict: 'bullish', confidence: 0.7 },
    Captain: { verdict: 'neutral', confidence: 0.6 },
    Guardian: { verdict: 'bullish', confidence: 0.7 },
  };
  const seenPeers: Record<string, string[]> = {};

  const committeeGraph = () => {
    const g = emptyGraph();
    const trade = makeLane('Trading', 0);
    trade.steps = [
      makeStep('agent', 'Sniper', { agentName: 'Sniper', systemPrompt: 'Sniper', taskPrompt: 'judge', everyTicks: 99, minConfidence: 0 }),
      makeStep('buy', 'Buy', { amountUsd: 100, takeProfitPct: 1, stopLossPct: 0.5, maxEntries: 1 }),
    ];
    const committee = makeLane('Committee', 1);
    committee.consensus = true;
    committee.agree = { mode: 'any', expects: 'bullish', minConfidence: 0, veto: true };
    committee.steps = ['Breadth', 'Captain', 'Guardian'].map((n) =>
      makeStep('agent', n, {
        agentName: n, systemPrompt: n, taskPrompt: 'judge', everyTicks: 99, minConfidence: 0,
        committeeVeto: n === 'Guardian',
      }));
    g.lanes = [trade, committee];
    g.session = { durationMin: 0.1, tickSec: 2, flattenOnStop: true };
    return g;
  };

  const hooks = () => ({
    ...makeHooks(() => 100),
    runAgent: async (req: any) => {
      const name = req.systemPrompt as string;
      if (req.context?.peerVerdicts) seenPeers[name] = req.context.peerVerdicts.map((p: any) => p.agent);
      const v = verdicts[name] ?? { verdict: 'neutral', confidence: 0.5 };
      return { verdict: v.verdict, confidence: v.confidence, reason: `${name} test verdict` } as any;
    },
  });

  it('committee majority rules the lane signal and the vote is reported', async () => {
    const res = await runGraph(committeeGraph(), hooks(), () => {});
    const committee = res.lanes.find((l) => l.laneName === 'Committee');
    expect(committee?.signal).toBe('bullish'); // 2 bullish of 3
    expect(res.events.some((e) => e.message.includes('Committee vote'))).toBe(true);
  }, 30000);

  it('a veto member blocks the committee with a bearish verdict', async () => {
    verdicts.Guardian = { verdict: 'bearish', confidence: 0.9 };
    const res = await runGraph(committeeGraph(), hooks(), () => {});
    const committee = res.lanes.find((l) => l.laneName === 'Committee');
    expect(committee?.signal).toBe('bearish');
    expect(res.events.some((e) => e.message.includes('VETO member blocking'))).toBe(true);
    verdicts.Guardian = { verdict: 'bullish', confidence: 0.7 };
  }, 30000);

  it('agents see each other on the blackboard (peerVerdicts in context)', async () => {
    await runGraph(committeeGraph(), hooks(), () => {});
    // The Captain runs after the Sniper and the Breadth Reader: both must
    // already be on the blackboard in the Captain's context.
    expect(seenPeers.Captain).toContain('Sniper');
    expect(seenPeers.Captain).toContain('Breadth');
  }, 30000);
});

describe('execution order guarantees', () => {
  it('steps run strictly in order within a lane, no step is skipped, and lanes run simultaneously', async () => {
    const trace: string[] = [];
    const g = emptyGraph();
    g.session = { durationMin: 0.1, tickSec: 2, flattenOnStop: true };
    g.risk = { maxDrawdownPct: 50, maxTotalInvestmentUsd: 100000 };

    const mkLane = (name: string, idx: number, delayMs: number) => {
      const lane = makeLane(name, idx);
      lane.steps = [
        makeStep('asset', 'Bind TEST', { ticker: 'TEST', label: 'Test Asset' }),
        makeStep('agent', `${name} agent`, { agentName: name, systemPrompt: name, taskPrompt: 'judge', everyTicks: 99, minConfidence: 0 }),
        makeStep('analysis', 'TREND SCORE', { programId: 'trend', params: {} }),
        makeStep('buy', `${name} buy`, { amountUsd: 100, takeProfitPct: 50, stopLossPct: 50, maxEntries: 1 }),
      ];
      return lane;
    };
    g.lanes = [mkLane('LaneA', 0, 60), mkLane('LaneB', 1, 5)];

    const stepEvents: Record<string, string[]> = { LaneA: [], LaneB: [] };
    const res = await runGraph(g, {
      ...makeHooks(() => 100),
      getSeries: () => Array.from({ length: 60 }, (_, i) => 100 + i * 0.05),
      runAgent: async (req: any) => {
        const name = req.systemPrompt as string;
        trace.push(`${name}:agent:start`);
        await new Promise((r) => setTimeout(r, name === 'LaneA' ? 60 : 5));
        trace.push(`${name}:agent:end`);
        return { verdict: 'bullish', confidence: 0.9, reason: 'order test' } as any;
      },
    }, (e) => {
      if (e.stepId && (e.laneName === 'LaneA' || e.laneName === 'LaneB')) {
        stepEvents[e.laneName].push(e.stepLabel);
      }
    });

    // 1 — within each lane the tick-1 step events are exactly the lane's
    // steps, in order, none missing (asset, agent, analysis, buy).
    for (const name of ['LaneA', 'LaneB'] as const) {
      const firstFour = stepEvents[name].slice(0, 4);
      expect(firstFour[0]).toContain('Bind TEST');
      expect(firstFour[1]).toContain(`${name} agent`);
      expect(firstFour[2]).toContain('TREND SCORE');
      expect(firstFour[3]).toContain(`${name} buy`);
    }
    // 2 — simultaneity: LaneB's agent STARTED before LaneA's agent
    // finished (LaneA's agent is deliberately slow) — the lanes truly
    // run in parallel, not one after the other.
    expect(trace.indexOf('LaneB:agent:start')).toBeLessThan(trace.indexOf('LaneA:agent:end'));
    // 3 — both lanes actually traded.
    expect(res.trades.length).toBe(2);
  }, 30000);
});

describe('diversification mechanics', () => {
  const classified3: AssetMetrics[] = ['AAA', 'BBB', 'CCC'].map((t) => ({
    ticker: t, label: t, cat: 'stock', symbolKey: t, last: 100, change24h: 5,
    samples: Array.from({ length: 40 }, (_, i) => 100 + i * 0.1),
  }));

  it('screen rotation cycles the lane across its top matches', async () => {
    const g = emptyGraph();
    g.session = { durationMin: 0.16, tickSec: 2, flattenOnStop: true };
    const lane = makeLane('Rotator', 0);
    lane.steps = [
      makeStep('screen', 'Find assets', { classId: 'hottest', limit: 3, bindTop: true, rotate: 3 }),
      makeStep('buy', 'Buy', { amountUsd: 100, takeProfitPct: 50, stopLossPct: 50, maxEntries: 9 }),
    ];
    g.lanes = [lane];
    const hooks: RunHooks = {
      ...makeHooks(() => 100),
      classified: classifyAssets(classified3),
      getSeries: () => Array.from({ length: 40 }, (_, i) => 100 + i * 0.1),
    };
    const res = await runGraph(g, hooks, () => {});
    const tickers = new Set(res.trades.map((t) => t.ticker));
    expect(tickers.size).toBeGreaterThanOrEqual(2); // not married to one name
  }, 30000);

  it('the per-asset cap refuses to pile the whole book into one name', async () => {
    const g = emptyGraph();
    g.session = { durationMin: 0.1, tickSec: 2, flattenOnStop: true };
    g.risk = { maxDrawdownPct: 50, maxTotalInvestmentUsd: 100000, maxPerAssetUsd: 250 };
    const lane = makeLane('Piler', 0);
    lane.steps = [
      makeStep('asset', 'Bind AAA', { ticker: 'AAA', label: 'AAA' }),
      makeStep('buy', 'Buy', { amountUsd: 200, takeProfitPct: 50, stopLossPct: 50, maxEntries: 9 }),
    ];
    g.lanes = [lane];
    const res = await runGraph(g, { ...makeHooks(() => 100), getSeries: () => Array.from({ length: 40 }, () => 100) }, () => {});
    // $200 tickets against a $250 per-name cap: exactly ONE position may
    // ever open (the session-end flatten closes it, so count all trades).
    expect(res.trades.length).toBe(1);
    expect(res.events.some((e) => e.message.includes('Diversification cap'))).toBe(true);
  }, 30000);
});
