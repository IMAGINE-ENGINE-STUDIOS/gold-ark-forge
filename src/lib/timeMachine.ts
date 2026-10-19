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
    submitOrder: ({ price }: { price: number }) => ({ id: `tm-${Math.random().toString(36).slice(2, 8)}`, price, fees: 0 }),
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

export const runTournament = async (
  entries: Array<{ id: string; name: string; build: () => PipeGraph }>,
  rawBars: Bars,
  onProgress?: (done: number, total: number, current: string) => void,
): Promise<StrategyScore[]> => {
  const aligned = alignBars(rawBars);
  const segLen = sessionLength(aligned);
  const total = entries.length * TM_SESSIONS;
  let done = 0;
  const scores: StrategyScore[] = [];

  for (const entry of entries) {
    const graph = entry.build();
    const budget = Math.max(1, graph.risk.maxTotalInvestmentUsd);
    const sessions: SessionStat[] = [];
    for (let k = 0; k < TM_SESSIONS; k++) {
      const res = await runSession(graph, aligned, WARM + k * segLen, segLen, budget);
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
  return scores.sort((a, b) => b.realised - a.realised);
};
