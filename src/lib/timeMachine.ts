import { runGraph, type RunHooks, type RunResult } from './parallelEngine';
import { classifyAssets, type ClassifiedAsset } from './assetClassifiers';
import type { PipeGraph } from './pipelineGraph';

/* ─────────────────── Time Machine tournament ──────────────────────
   Replays many strategies over the SAME week of real market history,
   in 10 sequential sessions, and produces one comparison table.

   NO-CHEATING RULES (structural, not promises):
   • At tick k of a session the hooks only ever expose bars with
     index ≤ the session cursor — series are SLICES ending at the
     cursor; the future bars exist in the array but are never handed
     to a screen, a program, an exit check or an agent.
   • Agent verdicts come from a fixed deterministic rule that reads
     only the same causal slice (the live desk uses Groq specialists;
     a week of history × 18 strategies × live AI calls is neither
     feasible nor necessary to compare STRATEGY STRUCTURE fairly —
     every strategy faces the identical rule).
   • Every strategy gets the identical bars, sessions and rules.
   • Results are only totalled after each session ends.

   Disclosed compressions (same as the replay scorecard): cooldowns
   and max-hold are wall-clock based, so in fast-forward they compress;
   bars are closes only (no spread/wicks beyond the engine's own exit
   logic).
   ──────────────────────────────────────────────────────────────── */

export const TM_UNIVERSE = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'META', 'AMD', 'COIN', 'SPY', 'QQQ'];
/** The wider pool scenarios draw their 10-name universe from. */
export const TM_POOL = [...TM_UNIVERSE, 'AVGO', 'PLTR', 'NFLX', 'CRM'];

/* ─── Seeded scenarios ─────────────────────────────────────────────
   The old tournament replayed the SAME week, the SAME sessions and
   zero execution friction every time, so the table never changed —
   the founder called it out. Now every run draws a fresh scenario
   from the real fetched bars: a rotated 10-name universe, a shifted
   window across the full history, varied session lengths, and a
   per-run execution friction — all derived from one seed, so any
   scenario can be replayed exactly by re-entering its seed, and no
   two seeds give the same tournament. The bars are always real
   market history and the causal rule (never see past the cursor)
   is unchanged. */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export interface TmScenario {
  seed: number;
  universe: string[];
  startBar: number;
  segLen: number;
  sessions: number;
  frictionBps: number;
  totalBars: number;
}

export const pickScenario = (seed: number, pool: string[], bars: Bars): TmScenario => {
  const rand = mulberry32(seed);
  const shuffled = [...pool].sort(() => rand() - 0.5);
  const usable = shuffled.filter((s) => (bars[s]?.length ?? 0) > WARM + 50);
  const universe = usable.slice(0, 10);
  const subset: Bars = {};
  for (const s of universe) subset[s] = bars[s];
  const aligned = alignBars(subset);
  const anySym = Object.keys(aligned)[0];
  const totalBars = anySym ? aligned[anySym].length : 0;
  const baseSeg = Math.max(10, Math.floor((totalBars - WARM) / TM_SESSIONS));
  const fitSeg = Math.max(8, Math.floor((totalBars - WARM) / TM_SESSIONS));
  const segLen = Math.max(8, Math.min(fitSeg, Math.round(baseSeg * (0.8 + rand() * 0.4))));
  const span = Math.max(0, totalBars - WARM - segLen * TM_SESSIONS);
  const startBar = WARM + Math.floor(rand() * (span + 1));
  const frictionBps = 2 + Math.floor(rand() * 4);
  return { seed, universe, startBar, segLen, sessions: TM_SESSIONS, frictionBps, totalBars };
};
export const TM_SESSIONS = 10;
const WARM = 90;

export interface SessionStat {
  session: number;
  trades: number;
  wins: number;
  losses: number;
  realised: number;
  errors: number;
  peakDeployed: number;
}

export interface StrategyScore {
  id: string;
  name: string;
  budget: number;
  sessions: SessionStat[];
  trades: number;
  wins: number;
  losses: number;
  realised: number;
  errors: number;
  peakDeployed: number;
  sessionsWon: number;
  winRatePct: number;
  returnOnBudgetPct: number;
}

export type Bars = Record<string, number[]>;

export const alignBars = (bars: Bars): Bars => {
  const syms = Object.keys(bars).filter((s) => bars[s]?.length > WARM + 50);
  const n = Math.min(...syms.map((s) => bars[s].length));
  const out: Bars = {};
  for (const s of syms) out[s] = bars[s].slice(bars[s].length - n);
  return out;
};

export const sessionLength = (bars: Bars): number => {
  const syms = Object.keys(bars);
  if (!syms.length) return 0;
  const n = bars[syms[0]].length;
  return Math.max(10, Math.floor((n - WARM) / TM_SESSIONS));
};

const runSession = async (
  graph: PipeGraph, aligned: Bars, segStart: number, segLen: number, equity: number,
  frictionBps = 0,
): Promise<RunResult> => {
  const syms = Object.keys(aligned);
  const n = aligned[syms[0]].length;
  let cursor = segStart;
  const seriesAt = (sym: string) => (aligned[sym] ?? []).slice(Math.max(0, cursor - 90), cursor + 1);
  const priceAt = (sym: string) => (aligned[sym] ?? [])[cursor] ?? 0;

  const hooks = {
    getPrice: (t: string) => priceAt(t),
    getSeries: (t: string) => seriesAt(t),
    getAccount: () => ({ equity, totalPnl: 0, startingBalance: equity, cash: equity }),
    submitOrder: ({ price, side }: { price: number; side?: string }) => {
      // Execution friction for this scenario: buys fill a hair above
      // the bar, sells a hair below — real tournaments pay the spread.
      const f = frictionBps / 10000;
      const fill = side === 'sell' ? price * (1 - f) : price * (1 + f);
      return { id: `tm-${Math.random().toString(36).slice(2, 8)}`, price: fill, fees: 0 };
    },
    runAgent: async (_step: any, ctx: any) => {
      const series = ctx?.ticker ? seriesAt(ctx.ticker) : [];
      const mom = series.length > 13 ? (series[series.length - 1] / series[series.length - 13] - 1) * 100 : 0;
      const bullish = ctx?.lastAnalysis?.verdict === 'bullish' || mom > 0.15;
      return { verdict: bullish ? 'bullish' : 'neutral', confidence: 0.65, reason: 'time-machine rule verdict (causal data only)' };
    },
    onEvent: () => undefined,
    onTickStart: (tick: number) => { cursor = Math.min(n - 1, segStart + tick - 1); },
    fastForward: true,
  } as unknown as RunHooks;

  Object.defineProperty(hooks, 'classified', {
    get: (): ClassifiedAsset[] => classifyAssets(
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

  const g = structuredClone(graph);
  g.session = { ...g.session, tickSec: 5, durationMin: (segLen * 5) / 60, flattenOnStop: true, tradeWindowEt: undefined };
  return runGraph(g, hooks, () => undefined);
};

export const runTournamentV2 = async (
  entries: Array<{ id: string; name: string; build: () => PipeGraph }>,
  rawBars: Bars,
  onProgress?: (done: number, total: number, current: string) => void,
  seed: number = Date.now() % 2147483647,
): Promise<{ scores: StrategyScore[]; scenario: TmScenario }> => {
  const scenario = pickScenario(seed, TM_POOL, rawBars);
  const subset: Bars = {};
  for (const s of scenario.universe) subset[s] = rawBars[s];
  const aligned = alignBars(subset);
  const segLen = scenario.segLen;
  const total = entries.length * TM_SESSIONS;
  let done = 0;
  const scores: StrategyScore[] = [];

  for (const entry of entries) {
    const graph = entry.build();
    const budget = Math.max(1, graph.risk.maxTotalInvestmentUsd);
    const sessions: SessionStat[] = [];
    for (let k = 0; k < TM_SESSIONS; k++) {
      const res = await runSession(graph, aligned, scenario.startBar + k * segLen, segLen, budget, scenario.frictionBps);
      const closed = res.trades.filter((t) => !t.open);
      sessions.push({
        session: k + 1,
        trades: closed.length,
        wins: closed.filter((t) => (t.pnl ?? 0) > 0).length,
        losses: closed.filter((t) => (t.pnl ?? 0) <= 0).length,
        realised: res.realised,
        errors: res.errors,
        peakDeployed: res.peakDeployed,
      });
      done += 1;
      onProgress?.(done, total, entry.name);
      // keep the tab responsive between sessions
      await new Promise((r) => setTimeout(r, 0));
    }
    const trades = sessions.reduce((a, s) => a + s.trades, 0);
    const wins = sessions.reduce((a, s) => a + s.wins, 0);
    const losses = sessions.reduce((a, s) => a + s.losses, 0);
    const realised = sessions.reduce((a, s) => a + s.realised, 0);
    scores.push({
      id: entry.id,
      name: graph.name,
      budget,
      sessions,
      trades, wins, losses, realised,
      errors: sessions.reduce((a, s) => a + s.errors, 0),
      peakDeployed: Math.max(0, ...sessions.map((s) => s.peakDeployed)),
      sessionsWon: sessions.filter((s) => s.realised > 0).length,
      winRatePct: trades ? (wins / trades) * 100 : 0,
      returnOnBudgetPct: (realised / budget) * 100,
    });
  }
  return { scores: scores.sort((a, b) => b.realised - a.realised), scenario };
};

export const runTournament = async (
  entries: Array<{ id: string; name: string; build: () => PipeGraph }>,
  rawBars: Bars,
  onProgress?: (done: number, total: number, current: string) => void,
): Promise<StrategyScore[]> => (await runTournamentV2(entries, rawBars, onProgress)).scores;
