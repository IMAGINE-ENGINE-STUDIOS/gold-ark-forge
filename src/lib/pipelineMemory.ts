/* ─────────────────────── Pipeline run memory ───────────────────────
   The builder's long-term memory of what it has done: every finished run
   is recorded (compact summary only) so the operator can see the track
   record across sessions, refreshes and days — not just the last run.
   Stored in localStorage next to the graph; capped at MAX_RUNS entries.
   ──────────────────────────────────────────────────────────────────── */

import type { RunResult } from './parallelEngine';

export interface RunMemoryEntry {
  id: string;
  at: number;               // epoch ms when the run finished
  graphName: string;
  ticks: number;
  trades: number;           // closed trades
  wins: number;
  losses: number;
  realised: number;         // realised P&L $
  fees: number;
  invested: number;
  errors: number;
  stoppedByRisk: boolean;
  summary: string | null;
  /** Per-specialist verdict tallies for this run (name → counts). */
  agentStats?: Record<string, { calls: number; bullish: number; neutral: number; bearish: number; confSum: number }>;
}

const KEY = 'ga_pipeline_v4_run_memory';
const MAX_RUNS = 30;

export const loadRunMemory = (): RunMemoryEntry[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((e) => e && typeof e.at === 'number') : [];
  } catch {
    return [];
  }
};

export const recordRun = (result: RunResult, graphName: string, summary: string | null): RunMemoryEntry => {
  const closed = result.trades.filter((t) => t.exitPrice !== null);
  const agentStats: RunMemoryEntry['agentStats'] = {};
  for (const e of result.events) {
    const v = (e as any).data?.verdict as string | undefined;
    if (!v || !e.stepLabel) continue;
    const name = e.stepLabel.replace(/\s*\(consensus\)\s*/i, '');
    const st = (agentStats[name] ??= { calls: 0, bullish: 0, neutral: 0, bearish: 0, confSum: 0 });
    st.calls += 1;
    if (v === 'bullish') st.bullish += 1;
    else if (v === 'bearish' || v === 'sell') st.bearish += 1;
    else st.neutral += 1;
    st.confSum += Number((e as any).data?.confidence ?? 0);
  }
  const entry: RunMemoryEntry = {
    id: `run_${result.finishedAt}_${Math.random().toString(36).slice(2, 7)}`,
    at: result.finishedAt,
    graphName,
    ticks: result.ticks,
    trades: closed.length,
    wins: closed.filter((t) => t.pnl > 0).length,
    losses: closed.filter((t) => t.pnl <= 0).length,
    realised: result.realised,
    fees: result.fees,
    invested: result.invested,
    errors: result.errors,
    stoppedByRisk: result.stoppedByRisk,
    summary,
    agentStats,
  };
  try {
    const next = [entry, ...loadRunMemory()].slice(0, MAX_RUNS);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* storage full/blocked — memory is best-effort */ }
  return entry;
};

export const clearRunMemory = () => {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
};

/** Lifetime totals across every remembered run. */
export const memoryTotals = (entries: RunMemoryEntry[]) => ({
  runs: entries.length,
  trades: entries.reduce((a, e) => a + e.trades, 0),
  wins: entries.reduce((a, e) => a + e.wins, 0),
  losses: entries.reduce((a, e) => a + e.losses, 0),
  realised: entries.reduce((a, e) => a + e.realised, 0),
  fees: entries.reduce((a, e) => a + e.fees, 0),
});
