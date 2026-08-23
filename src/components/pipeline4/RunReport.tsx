/**
 * Pipeline V4 — the low-level run report.
 *
 * The old panel was a raw trace list. This one answers the questions an
 * operator actually asks after a session:
 *
 *   1. Did I make or lose money, and where did it come from?
 *   2. What did each position do — entry, exit, why it closed, how long it held?
 *   3. What was every lane looking at when it decided, tick by tick?
 *
 * Everything shown here comes from the real run: real fills, real prices, real
 * timings. Nothing is estimated.
 */

import { useMemo, useState } from 'react';
import type { ConsensusVerdict, RunEvent, RunResult, TradeRecord } from '@/lib/parallelEngine';

const money = (n: number) => `${n >= 0 ? '+' : '−'}$${Math.abs(n).toFixed(2)}`;
const clock = (ts: number) => new Date(ts).toLocaleTimeString([], { hour12: false });
const secs = (ms: number) => `${Math.max(0, Math.round(ms / 1000))}s`;

const STATUS_TINT: Record<RunEvent['status'], string> = {
  ok: 'text-emerald-300',
  skip: 'text-amber-300/80',
  error: 'text-rose-300',
  info: 'text-white/50',
};

interface Props {
  events: RunEvent[];
  result: RunResult | null;
  running: boolean;
  equityCurve: number[];
  startEquity: number | null;
}

type Tab = 'summary' | 'trades' | 'decisions' | 'trace';

export default function RunReport({ events, result, running, equityCurve, startEquity }: Props) {
  const [tab, setTab] = useState<Tab>('summary');
  const [laneFilter, setLaneFilter] = useState<string>('all');

  const lanes = useMemo(
    () => Array.from(new Set(events.map((e) => e.laneName).filter((n) => n && n !== 'Session'))),
    [events],
  );

  const trades: TradeRecord[] = result?.trades ?? [];
  const closed = trades.filter((t) => !t.open);
  const wins = closed.filter((t) => t.pnl > 0);
  const realised = closed.reduce((s, t) => s + t.pnl, 0);
  const openPnl = trades.filter((t) => t.open).reduce((s, t) => s + t.pnl, 0);
  const equityDelta = startEquity !== null && equityCurve.length ? equityCurve[equityCurve.length - 1] - startEquity : 0;

  const filtered = laneFilter === 'all' ? events : events.filter((e) => e.laneName === laneFilter);
  const decisions = filtered.filter((e) => e.detail?.decision);

  if (!events.length) {
    return (
      <div className="p-4 text-[11px] leading-relaxed text-white/50">
        No session has run yet. Press <span className="text-amber-200">Run</span> to start a live session — the
        strategy will trade on real prices for the configured duration and this report will explain, in plain
        English, everything it did and why.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* tabs */}
      <div className="flex items-center gap-1 border-b border-white/10 px-2 py-1.5">
        {(['summary', 'trades', 'decisions', 'trace'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-2 py-1 text-[10px] uppercase tracking-wider transition ${
              tab === t ? 'bg-amber-400/15 text-amber-200' : 'text-white/45 hover:text-white/80'
            }`}
          >
            {t}
          </button>
        ))}
        {running && <span className="ml-auto animate-pulse text-[10px] text-emerald-300">session live</span>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 text-[11px] leading-relaxed">
        {tab === 'summary' && (
          <div className="space-y-3">
            <p className="text-white/80">
              {running
                ? 'The session is live. Lanes are being re-checked on every tick against real prices.'
                : result
                  ? `The session ran ${result.ticks} tick${result.ticks === 1 ? '' : 's'} over ${secs(result.finishedAt - result.startedAt)}. ` +
                    `It opened ${trades.length} position${trades.length === 1 ? '' : 's'}, closed ${closed.length}, ` +
                    `paid $${result.fees.toFixed(2)} in fees and finished ${money(realised)} realised.`
                  : 'The session ended.'}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Stat label="Realised P&L" value={money(realised)} tone={realised >= 0 ? 'good' : 'bad'} />
              <Stat label="Open P&L" value={money(openPnl)} tone={openPnl >= 0 ? 'good' : 'bad'} />
              <Stat label="Capital deployed" value={`$${Math.round(result?.invested ?? 0).toLocaleString()}`} />
              <Stat label="Fees paid" value={`$${(result?.fees ?? 0).toFixed(2)}`} tone="bad" />
              <Stat label="Win rate" value={closed.length ? `${Math.round((wins.length / closed.length) * 100)}%` : '—'} />
              <Stat label="Account change" value={money(equityDelta)} tone={equityDelta >= 0 ? 'good' : 'bad'} />
            </div>

            {!!closed.length && (
              <div>
                <h4 className="mb-1 text-[10px] uppercase tracking-wider text-white/40">Where the money came from</h4>
                <ul className="space-y-1">
                  {closed.map((t) => (
                    <li key={t.id} className="flex items-baseline justify-between gap-2">
                      <span className="text-white/70">
                        {t.label} · {t.laneName} · closed because the {t.exitReason}
                      </span>
                      <span className={t.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{money(t.pnl)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!trades.length && !running && (
              <p className="rounded border border-amber-400/20 bg-amber-400/5 p-2 text-amber-100/80">
                No position was ever opened. Usually that means a condition step never saw the signal it wanted, the
                consensus lane blocked trading, or a lane still had too few real prices to compute its indicator.
                The Decisions tab shows exactly which step stopped each lane.
              </p>
            )}

            {!!result?.consensus.length && (
              <div>
                <h4 className="mb-1 text-[10px] uppercase tracking-wider text-white/40">Consensus rulings</h4>
                <ul className="space-y-1">
                  {result.consensus.slice(-8).map((c: ConsensusVerdict, i) => (
                    <li key={i} className={c.passed ? 'text-emerald-300/85' : 'text-amber-300/85'}>
                      Tick {c.tick} · {c.laneName}: {c.reason} {c.passed ? 'Trading allowed.' : 'Trading blocked.'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result?.stoppedByRisk && (
              <p className="rounded border border-rose-400/25 bg-rose-500/10 p-2 text-rose-200">
                The session was ended early because the strategy loss limit was breached.
              </p>
            )}
          </div>
        )}

        {tab === 'trades' && (
          trades.length ? (
            <div className="space-y-2">
              {trades.map((t) => (
                <div key={t.id} className="rounded border border-white/10 bg-white/[0.03] p-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-white/85">{t.side.toUpperCase()} {t.label}</span>
                    <span className={t.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{money(t.pnl)}</span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-white/55">
                    <span>Lane: {t.laneName}</span>
                    <span>Size: ${Math.round(t.amountUsd).toLocaleString()}</span>
                    <span>Entry: {t.entryPrice.toFixed(4)} at {clock(t.entryAt)}</span>
                    <span>Exit: {t.exitPrice ? `${t.exitPrice.toFixed(4)} at ${clock(t.exitAt!)}` : 'still open'}</span>
                    <span>Target: {t.takeProfit ? t.takeProfit.toFixed(4) : 'none'}</span>
                    <span>Stop: {t.stopLoss ? t.stopLoss.toFixed(4) : 'none'}</span>
                    <span>Held: {t.exitAt ? secs(t.exitAt - t.entryAt) : secs(Date.now() - t.entryAt)}</span>
                    <span>Fees: ${t.fees.toFixed(2)}</span>
                  </div>
                  {t.exitReason && <p className="mt-1 text-[10px] text-white/60">Closed because the {t.exitReason}.</p>}
                </div>
              ))}
            </div>
          ) : <p className="text-white/50">No positions were opened in this session.</p>
        )}

        {(tab === 'decisions' || tab === 'trace') && (
          <>
            <div className="mb-2 flex flex-wrap gap-1">
              {['all', ...lanes].map((l) => (
                <button
                  key={l}
                  onClick={() => setLaneFilter(l)}
                  className={`rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${
                    laneFilter === l ? 'bg-white/15 text-white' : 'bg-white/5 text-white/45'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <ul className="space-y-1.5">
              {(tab === 'decisions' ? decisions : filtered).map((e, i) => (
                <li key={i} className="border-l border-white/10 pl-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[9px] text-white/30">t{e.tick} {clock(e.ts)}</span>
                    <span className="text-[9px] uppercase tracking-wider text-white/35">{e.laneName} › {e.stepLabel}</span>
                  </div>
                  <p className={STATUS_TINT[e.status]}>{e.message}</p>
                  {e.detail?.inputs && (
                    <p className="text-[9px] text-white/35">
                      Looked at — {Object.entries(e.detail.inputs)
                        .map(([k, v]) => `${k}: ${typeof v === 'number' ? Number(v.toFixed?.(4) ?? v) : String(v)}`)
                        .join(' · ')}
                    </p>
                  )}
                  {e.detail?.reason && <p className="text-[9px] text-white/45">Because — {e.detail.reason}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

const Stat = ({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) => (
  <div className="rounded border border-white/10 bg-white/[0.03] px-2 py-1.5">
    <div className="text-[9px] uppercase tracking-wider text-white/40">{label}</div>
    <div className={`text-[13px] ${tone === 'good' ? 'text-emerald-300' : tone === 'bad' ? 'text-rose-300' : 'text-white/85'}`}>
      {value}
    </div>
  </div>
);
