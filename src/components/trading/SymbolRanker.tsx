import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Target, TrendingUp, Shield, Activity, RefreshCw, Sparkles, Info, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ALL_SYMBOLS } from '@/data/tradingSymbols';
import { buildPrecisionRow, rankRows, toAICandidate, verdictFor, type Direction, type PrecisionRow, type RiskLabel } from '@/lib/precision';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Column definitions — one place that holds the label + the exact tooltip
 * explaining what the metric measures and how it is computed.
 */
const COLS: { key: string; label: string; help: string; align?: 'left' | 'right' }[] = [
  { key: '#', label: '#', help: 'Row rank after sorting by risk (lowest first) then score (highest first).', align: 'left' },
  { key: 'symbol', label: 'Symbol', help: 'Ticker and display name. Click a row to open the full breakdown.', align: 'left' },
  { key: 'verdict', label: 'Verdict', help: 'One-glance action call synthesized from P(Goal), risk, score and MTF alignment. STRONG BUY / BUY / HOLD / AVOID. Bots and users act on this.', align: 'left' },
  { key: 'price', label: 'Price', help: 'Live spot price resolved from the same real-time feed used by Showroom, Intelligence and Oil & Gas widgets.' },
  { key: 'atr', label: 'ATR%', help: 'Average True Range as % of price on the 1h series (period 14). Higher = wider candles = more volatile.' },
  { key: 'mtf', label: 'MTF', help: 'Multi-timeframe alignment × 100. Weighted mean of directional bias across 1h (25%), 4h (35%) and 1d (40%). Positive = bullish agreement, negative = bearish.' },
  { key: 'regime', label: 'Regime', help: 'Majority regime across timeframes. TREND = ADX > 20 with directional structure. SQUEEZE = Bollinger width compressed. RANGE = oscillating. MIXED = no clear consensus.' },
  { key: 'setup', label: 'Setup', help: 'Detected setup on the 1h series: DONCHIAN BREAKOUT · MEAN REVERSION · MACD CROSS · TREND CONTINUATION · NO CLEAN SETUP. Drives the SetupFactor multiplier.' },
  { key: 'pgoal', label: 'P(Goal)', help: 'Probability of hitting the goal % before the horizon expires. Computed by an 800-path Monte-Carlo GBM using drift = MTF·ATR·0.5 and sigma = max(realized vol, ATR·0.7).' },
  { key: 'eret', label: 'E[Ret%]', help: 'Expected terminal return over the horizon across 800 Monte-Carlo paths (mean of final returns).' },
  { key: 'edd', label: 'E[DD%]', help: 'Expected worst-case drawdown along a path (mean across 800 sims). Tail risk indicator — bigger absolute value = more painful path.' },
  { key: 'risk', label: 'Risk', help: 'Deterministic risk label from (ATR + 0.15·MaxDrawdown). LOW < 0.008, MEDIUM < 0.02, HIGH < 0.045, else EXTREME. AI mode may override by one step.' },
  { key: 'score', label: 'Score', help: 'Composite 0–100 score:  100 · P(Goal) · SetupFactor · AlignBonus · TrendBonus · TailPenalty. Higher = better risk-adjusted expected outcome.' },
  { key: 'ai', label: 'AI', help: 'Marker shown when Gemini-3.5 has produced a rationale, entry / SL / TP and an adjusted risk label for this candidate.' },
];

type CandleFn = (ticker: string) => { closes: number[]; highs: number[]; lows: number[] } | null;
type PriceFn = (ticker: string) => number;

interface Props {
  getCandleData: CandleFn;
  resolvePrice: PriceFn;
  activeCategory?: string;
  onSelectSymbol?: (ticker: string) => void;
  onRowsChange?: (rows: PrecisionRow[], direction: Direction) => void;
}

const CATS = ['all', 'metals', 'crypto', 'forex', 'energy', 'stocks', 'indices'] as const;

const riskColor = (r: RiskLabel) =>
  r === 'LOW' ? 'text-emerald-400'
  : r === 'MEDIUM' ? 'text-gold-light'
  : r === 'HIGH' ? 'text-orange-400' : 'text-red-500';

const finiteNum = (value: unknown, fallback = 0) => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const fixed = (value: unknown, digits = 2, fallback = '—') => {
  const n = finiteNum(value, NaN);
  return Number.isFinite(n) ? n.toFixed(digits) : fallback;
};

const pct = (value: unknown, digits = 1, fallback = '—') => {
  const n = finiteNum(value, NaN);
  return Number.isFinite(n) ? `${(n * 100).toFixed(digits)}%` : fallback;
};

const priceText = (value: unknown, fallback = '—') => {
  const n = finiteNum(value, NaN);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: n < 10 ? 4 : 2,
    maximumFractionDigits: n < 10 ? 4 : 2,
  });
};

export function SymbolRanker({ getCandleData, resolvePrice, activeCategory, onSelectSymbol, onRowsChange }: Props) {
  const [goalPct, setGoalPct] = useState(2);
  const [horizonH, setHorizonH] = useState(24);
  const [direction, setDirection] = useState<Direction>('long');
  const [capitalUsd, setCapitalUsd] = useState(10000);
  const [category, setCategory] = useState<string>(
    activeCategory && (CATS as readonly string[]).includes(activeCategory) ? activeCategory : 'all',
  );
  const [mode, setMode] = useState<'stat' | 'ai'>('stat');
  const [rows, setRows] = useState<PrecisionRow[]>([]);
  const [scanning, setScanning] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lastAiAt, setLastAiAt] = useState(0);
  const scanTokenRef = useRef(0);
  // Live tick — forces the table cells (price + P&L math) to re-read
  // resolvePrice() every second so the Price column is truly live,
  // independent of the 25s stat rescan cadence.
  const [, setLiveTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setLiveTick(t => (t + 1) % 1_000_000), 1000);
    return () => window.clearInterval(id);
  }, []);

  const scope = useMemo(() => {
    const list = category === 'all' ? ALL_SYMBOLS : ALL_SYMBOLS.filter(s => s.cat === category);
    return list.slice(0, 60);
  }, [category]);

  const runStatScan = useCallback(async () => {
    const token = ++scanTokenRef.current;
    setScanning(true);
    const out: PrecisionRow[] = [];
    for (const s of scope) {
      const candles = getCandleData(s.ticker);
      if (!candles) continue;
      const row = buildPrecisionRow({
        key: s.key, ticker: s.ticker, label: s.label, cat: s.cat,
        price: resolvePrice(s.ticker),
        candles1h: candles,
        goalPct, horizonH, direction,
      });
      if (row) out.push(row);
      if (out.length % 6 === 0) await new Promise(r => setTimeout(r, 0));
      if (scanTokenRef.current !== token) return; // superseded
    }
    setRows(rankRows(out));
    setScanning(false);
  }, [scope, getCandleData, resolvePrice, goalPct, horizonH, direction]);

  useEffect(() => {
    runStatScan();
    const id = window.setInterval(runStatScan, 25000);
    return () => window.clearInterval(id);
  }, [runStatScan]);

  const refineWithAI = useCallback(async () => {
    if (Date.now() - lastAiAt < 10_000) {
      toast.info('AI refine is throttled — try again in a moment.');
      return;
    }
    const top = rows.slice(0, 12);
    if (top.length === 0) {
      toast.error('Run a stat scan first.');
      return;
    }
    setAiLoading(true);
    setLastAiAt(Date.now());
    try {
      const { data, error } = await supabase.functions.invoke('rank-symbols-ai', {
        body: {
          goalPct, horizonH, direction, capitalUsd,
          candidates: top.map(toAICandidate),
        },
      });
      if (error) throw error;
      type AIRanking = { ticker: string } & NonNullable<PrecisionRow['ai']>;
      const rankings = (data?.rankings ?? []) as AIRanking[];
      const byTicker = new Map<string, NonNullable<PrecisionRow['ai']>>(
        rankings.map(r => {
          const { ticker: _t, ...rest } = r;
          return [r.ticker, rest];
        }),
      );
      setRows(prev => rankRows(prev.map(r => {
        const ai = byTicker.get(r.ticker);
        return ai ? { ...r, ai } : r;
      })));
      // Persist snapshot (best-effort)
      const { data: userRes } = await supabase.auth.getUser();
      if (userRes.user) {
        const insertRow = {
          user_id: userRes.user.id,
          goal_pct: goalPct,
          horizon_h: horizonH,
          direction,
          scope: category,
          mode: 'ai' as const,
          payload: rows.map(r => ({
            ticker: r.ticker, label: r.label, price: r.price,
            score: r.compositeScore, risk: r.riskLabel,
            ai: byTicker.get(r.ticker) ?? null,
          })),
        };
        await supabase.from('rank_snapshots').insert(insertRow as never);
      }
      toast.success(`AI re-ranked ${rankings.length} candidates`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'AI refine failed';
      toast.error(msg);
    } finally {
      setAiLoading(false);
    }
  }, [rows, goalPct, horizonH, direction, capitalUsd, category, lastAiAt]);

  const summary = useMemo(() => {
    if (!rows.length) return null;
    const top = rows[0];
    const avgP = rows.reduce((a, r) => a + r.monteCarlo.pGoal, 0) / rows.length;
    const tradable = rows.filter(r =>
      r.monteCarlo.pGoal >= 0.55 && (r.riskLabel === 'LOW' || r.riskLabel === 'MEDIUM'),
    ).length;
    return { top, avgP, tradable };
  }, [rows]);

  // Bubble the latest ranked set up so the parent page can render the
  // hero Directive card and Top-5 Conviction board without re-scanning.
  useEffect(() => {
    if (onRowsChange) onRowsChange(rows, direction);
  }, [rows, direction, onRowsChange]);

  return (
    <div className="border border-gold/20 rounded-lg bg-navy-dark/60 p-3 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-gold-light" />
          <span className="font-display text-sm tracking-wider text-gold-light">
            PRECISION RANK · GOAL SEEKER
          </span>
          <span className="text-[8px] text-marble/40 font-mono">v2 · MTF + Monte-Carlo + AI</span>
          <button
            type="button"
            title={
              'HOW SCORES ARE BUILT\n' +
              '• P(Goal): probability of reaching the goal before the horizon, from 800 Monte-Carlo GBM paths using drift = MTF·ATR·0.5 and sigma = max(realized vol, ATR·0.7).\n' +
              '• SetupFactor = 0.55 + 0.45·setupStrength (0..1 from Donchian / MACD / MR detector).\n' +
              '• AlignBonus: 1.0 if 1h direction matches trade direction, 0.7 if neutral, 0.45 if opposite.\n' +
              '• TrendBonus: 1.1 in trend+continuation or range+mean-reversion, 0.85 in squeeze, else 1.0.\n' +
              '• TailPenalty = 1 / (1 + 15·ATR + 0.6·MaxDrawdown).\n' +
              '• Risk = LOW/MED/HIGH/EXTREME from (ATR + 0.15·MaxDrawdown) with thresholds 0.008 / 0.02 / 0.045.\n' +
              '• Final: Score = clamp(100 · P(Goal) · SetupFactor · AlignBonus · TrendBonus · TailPenalty, 0, 100).'
            }
            className="text-marble/40 hover:text-gold-light"
          >
            <HelpCircle className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gold/20 rounded overflow-hidden">
            <button onClick={() => setMode('stat')}
              className={`text-[9px] font-mono px-2 py-1 ${mode === 'stat' ? 'bg-gold/20 text-gold-light' : 'text-marble/50'}`}>
              STAT
            </button>
            <button onClick={() => setMode('ai')}
              className={`text-[9px] font-mono px-2 py-1 flex items-center gap-1 ${mode === 'ai' ? 'bg-gold/20 text-gold-light' : 'text-marble/50'}`}>
              <Sparkles className="w-3 h-3" /> AI
            </button>
          </div>
          <button onClick={runStatScan} disabled={scanning}
            className="flex items-center gap-1 text-[9px] font-mono px-2 py-1 border border-gold/30 hover:border-gold/60 text-gold/80 rounded disabled:opacity-40">
            <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'SCANNING' : 'RESCAN'}
          </button>
          {mode === 'ai' && (
            <button onClick={refineWithAI} disabled={aiLoading || rows.length === 0}
              className="flex items-center gap-1 text-[9px] font-mono px-2 py-1 rounded bg-gold text-navy-dark hover:bg-gold-light disabled:opacity-40">
              <Sparkles className={`w-3 h-3 ${aiLoading ? 'animate-pulse' : ''}`} />
              {aiLoading ? 'REFINING…' : 'REFINE WITH AI'}
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px] font-mono">
        <label className="flex flex-col gap-1">
          <span className="text-marble/50 text-[8px] uppercase tracking-wider">Goal %</span>
          <input type="number" step="0.1" value={goalPct}
            onChange={e => setGoalPct(Math.max(0.1, parseFloat(e.target.value) || 0))}
            className="bg-navy border border-gold/20 rounded px-2 py-1 text-gold-light" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-marble/50 text-[8px] uppercase tracking-wider">Horizon (h)</span>
          <input type="number" step="1" min={1} value={horizonH}
            onChange={e => setHorizonH(Math.max(1, parseFloat(e.target.value) || 1))}
            className="bg-navy border border-gold/20 rounded px-2 py-1 text-gold-light" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-marble/50 text-[8px] uppercase tracking-wider">Direction</span>
          <select value={direction} onChange={e => setDirection(e.target.value as Direction)}
            className="bg-navy border border-gold/20 rounded px-2 py-1 text-gold-light">
            <option value="long">LONG</option>
            <option value="short">SHORT</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-marble/50 text-[8px] uppercase tracking-wider">Capital $</span>
          <input type="number" step="100" min={100} value={capitalUsd}
            onChange={e => setCapitalUsd(Math.max(100, parseFloat(e.target.value) || 0))}
            className="bg-navy border border-gold/20 rounded px-2 py-1 text-gold-light" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-marble/50 text-[8px] uppercase tracking-wider">Scope</span>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="bg-navy border border-gold/20 rounded px-2 py-1 text-gold-light">
            {CATS.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
          </select>
        </label>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-2 border-t border-gold/10 pt-2">
          <div className="rounded border border-gold/15 p-2">
            <div className="text-[8px] text-marble/50 uppercase tracking-wider flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Top Pick</div>
            <div className="text-[11px] font-mono text-gold-light truncate">{summary.top.ticker}</div>
            <div className="text-[9px] text-marble/60">
              {pct(summary.top.monteCarlo.pGoal)} · {summary.top.ai?.riskLabel ?? summary.top.riskLabel}
            </div>
          </div>
          <div className="rounded border border-gold/15 p-2">
            <div className="text-[8px] text-marble/50 uppercase tracking-wider flex items-center gap-1"><Activity className="w-3 h-3" /> Avg P(Goal)</div>
            <div className="text-[11px] font-mono text-gold-light">{pct(summary.avgP)}</div>
            <div className="text-[9px] text-marble/60">across {rows.length}</div>
          </div>
          <div className="rounded border border-gold/15 p-2">
            <div className="text-[8px] text-marble/50 uppercase tracking-wider flex items-center gap-1"><Shield className="w-3 h-3" /> Tradable</div>
            <div className="text-[11px] font-mono text-emerald-400">{summary.tradable}</div>
            <div className="text-[9px] text-marble/60">≥55% · low/med risk</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="max-h-[460px] overflow-y-auto watchlist-scroll">
        <table className="w-full text-[10px] font-mono">
          <thead className="sticky top-0 bg-navy-dark/95 text-marble/40 text-[8px] uppercase tracking-wider">
            <tr>
              {COLS.map(c => (
                <th key={c.key}
                  title={c.help}
                  className={`py-1 px-1 cursor-help ${c.align === 'left' ? 'text-left' : 'text-right'}`}>
                  <span className="inline-flex items-center gap-0.5">
                    {c.label}
                    <HelpCircle className="w-2.5 h-2.5 opacity-40" />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={14} className="text-center text-marble/40 py-6 text-[10px]">
                {scanning ? 'Building multi-timeframe snapshot…' : 'No candle data ready — try RESCAN.'}
              </td></tr>
            )}
            {rows.map((r, i) => {
              const risk = r.ai?.riskLabel ?? r.riskLabel;
              const score = r.ai?.adjustedScore ?? r.compositeScore;
              const mtfCol = r.mtfAlignment > 0.1 ? 'text-emerald-400' : r.mtfAlignment < -0.1 ? 'text-red-400' : 'text-marble/50';
              const isOpen = expanded === r.ticker;
              // Read the LIVE price on every render tick (1s cadence via setLiveTick)
              // so the Price column reflects the same feed as Showroom / Intelligence.
              const livePrice = finiteNum(resolvePrice(r.ticker), 0) || finiteNum(r.price, 0);
              const v = verdictFor(r, direction);
              const safeScore = finiteNum(score, 0);
              const verdictClasses =
                v.color === 'emerald' ? 'text-emerald-400 border-emerald-400/40 bg-emerald-500/10'
                : v.color === 'gold' ? 'text-gold border-gold/50 bg-gold/10'
                : v.color === 'orange' ? 'text-orange-400 border-orange-400/40 bg-orange-500/10'
                : 'text-red-400 border-red-500/40 bg-red-500/10';
              return (
                <Fragment key={r.ticker}>
                  <tr
                    onClick={() => { onSelectSymbol?.(r.ticker); setExpanded(isOpen ? null : r.ticker); }}
                    className={`border-t border-gold/5 hover:bg-gold/5 cursor-pointer ${r.ai ? 'bg-gold/[0.03]' : ''}`}>
                    <td className="py-1 px-1 text-marble/40">{i + 1}</td>
                    <td className="py-1 px-1">
                      <div className="text-gold-light flex items-center gap-1">
                        {r.ticker}
                        {r.ai && <Sparkles className="w-2.5 h-2.5 text-gold" />}
                      </div>
                      <div className="text-[8px] text-marble/40 truncate max-w-[120px]">{r.label}</div>
                    </td>
                    <td className="py-1 px-1">
                      <div
                        title={v.reasons.join('  ·  ') + `  ·  Conviction ${fixed(v.conviction, 0)}%`}
                        className={`inline-flex items-center gap-1 px-1.5 py-[1px] rounded-full border text-[8px] tracking-widest font-semibold ${verdictClasses}`}
                      >
                        {v.verdict}
                      </div>
                      <div className="text-[7px] font-mono text-marble/40 mt-0.5">
                        conv {fixed(v.conviction, 0)}%
                      </div>
                    </td>
                    <td
                      className="py-1 px-1 text-right text-marble/80 tabular-nums"
                      title={`Live price · resolved from ${r.cat} feed · updates every 1s`}
                    >
                      {priceText(livePrice)}
                    </td>
                    <td className="py-1 px-1 text-right text-marble/70">{pct(r.atrPct, 2)}</td>
                    <td className={`py-1 px-1 text-right ${mtfCol}`}>{fixed(finiteNum(r.mtfAlignment) * 100, 0)}</td>
                    <td className="py-1 px-1 text-right text-marble/60 uppercase text-[8px]">{r.regime}</td>
                    <td className="py-1 px-1 text-right text-marble/60 text-[8px] truncate max-w-[100px]">{r.setup}</td>
                    <td className="py-1 px-1 text-right text-gold-light">{pct(r.monteCarlo.pGoal)}</td>
                    <td className="py-1 px-1 text-right text-emerald-400/80">{fixed(r.ai?.expectedReturnPct ?? r.monteCarlo.eReturnPct)}</td>
                    <td className="py-1 px-1 text-right text-red-400/80">{fixed(r.ai?.maxDrawdownPct ?? r.monteCarlo.eMaxDDPct)}</td>
                    <td className={`py-1 px-1 text-right font-semibold ${riskColor(risk)}`}>{risk}</td>
                    <td className="py-1 px-1 text-right text-gold">{fixed(safeScore, 1)}</td>
                    <td className="py-1 px-1 text-right">
                      {r.ai
                        ? <Info className="w-3 h-3 inline text-gold-light" />
                        : <span className="text-marble/25">—</span>}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-navy/60">
                      <td colSpan={14} className="px-3 py-2">
                        {/* ── Score & Risk breakdown — exact math per symbol ── */}
                        <ScoreBreakdownCard r={r} horizonH={horizonH} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[9px] font-mono">
                          <div>
                            <div className="text-[8px] uppercase tracking-wider text-marble/40 mb-1">MTF Alignment</div>
                            {(['1h','4h','1d'] as const).map(tf => {
                              const s = r.mtf[tf];
                              if (!s) return <div key={tf} className="text-marble/30">{tf}: —</div>;
                              const c = s.bias > 0.1 ? 'text-emerald-400' : s.bias < -0.1 ? 'text-red-400' : 'text-marble/60';
                              return <div key={tf} className={c}>{tf}: {s.direction.toUpperCase()} · ADX {fixed(s.adx, 0)} · bias {fixed(finiteNum(s.bias) * 100, 0)}</div>;
                            })}
                          </div>
                          <div>
                            <div className="text-[8px] uppercase tracking-wider text-marble/40 mb-1">Monte Carlo · {horizonH}h</div>
                            <div>P(goal): <span className="text-gold-light">{pct(r.monteCarlo.pGoal)}</span></div>
                            <div>P10 / P90: <span className="text-marble/70">{fixed(r.monteCarlo.p10ReturnPct)}% / {fixed(r.monteCarlo.p90ReturnPct)}%</span></div>
                            <div>Realized vol: {pct(r.realizedVolPct, 2)}</div>
                            <div>Hist max DD: {pct(r.histMaxDDPct, 2)}</div>
                          </div>
                          <div>
                            {r.ai ? (
                              <>
                                <div className="text-[8px] uppercase tracking-wider text-marble/40 mb-1 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> AI Levels & Rationale
                                </div>
                                <div>Entry / SL / TP: <span className="text-gold-light">{priceText(r.ai.entry)} / {priceText(r.ai.stopLoss)} / {priceText(r.ai.takeProfit)}</span></div>
                                <div className="mt-1 text-marble/80 prose prose-invert prose-xs max-w-none">
                                  <ReactMarkdown>{r.ai.rationale}</ReactMarkdown>
                                </div>
                                <div className="mt-1 text-[7px] text-marble/30">Analytical view — not investment advice.</div>
                              </>
                            ) : (
                              <div className="text-marble/40">Toggle AI mode and click REFINE WITH AI for reasoning + entry/SL/TP.</div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[8px] text-marble/30 flex justify-between">
        <span>Sorted: lowest risk → highest score. Click a row to expand.</span>
        <span>{lastAiAt ? `AI refined ${new Date(lastAiAt).toLocaleTimeString()}` : ''}</span>
      </div>
    </div>
  );
}

export default SymbolRanker;

// ─────────────────────────────────────────────────────────────
// Deterministic score & risk breakdown for a single row.
// Shows the exact multiplicative chain that produced the score
// so the user can audit any ranking. Zero magic.
// ─────────────────────────────────────────────────────────────
function ScoreBreakdownCard({ r, horizonH }: { r: PrecisionRow; horizonH: number }) {
  const b = r.breakdown;
  const parts = [
    { label: '100', value: 100, sub: 'Base' },
    { label: 'P(Goal)', value: b.pGoal, sub: `${b.horizonSteps}h MC`, fmt: (v: number) => pct(v) },
    { label: 'Setup', value: b.setupFactor, sub: `${r.setup}`, fmt: (v: number) => fixed(v) + '×' },
    { label: 'Align', value: b.alignedBonus, sub: `${b.primaryDirection} vs ${b.wantDirection}`, fmt: (v: number) => fixed(v) + '×' },
    { label: 'Trend', value: b.trendBonus, sub: r.regime.toUpperCase(), fmt: (v: number) => fixed(v) + '×' },
    { label: 'TailPen', value: b.tailPenalty, sub: `ATR ${pct(r.atrPct, 2)} · DD ${pct(r.histMaxDDPct, 1)}`, fmt: (v: number) => fixed(v) + '×' },
  ];

  const riskT = b.riskThresholds;
  const rc = b.riskComposite;
  const barPct = Math.min(100, (rc / (riskT.HIGH * 1.4)) * 100);

  return (
    <div className="mb-3 border border-gold/15 rounded-lg bg-navy-dark/70 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Info className="w-3.5 h-3.5 text-gold-light" />
        <span className="font-display text-[10px] tracking-[0.15em] text-gold-light uppercase">
          Score &amp; Risk Breakdown · {r.ticker}
        </span>
        <span className="text-[8px] text-marble/40 font-mono ml-auto">
          {b.formula}
        </span>
      </div>

      {/* Multiplicative score chain */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-1.5 text-[9px] font-mono">
        {parts.map((p, i) => (
          <div key={p.label} className="rounded border border-gold/10 bg-navy/40 px-2 py-1.5 relative">
            <div className="text-[7px] uppercase tracking-wider text-marble/40">{p.label}</div>
            <div className="text-gold-light">{p.fmt ? p.fmt(p.value) : p.value}</div>
            <div className="text-[7px] text-marble/40 truncate">{p.sub}</div>
            {i < parts.length - 1 && (
              <span className="hidden md:inline absolute -right-2 top-1/2 -translate-y-1/2 text-gold/40">×</span>
            )}
          </div>
        ))}
        <div className="rounded border border-gold/40 bg-gold/5 px-2 py-1.5">
          <div className="text-[7px] uppercase tracking-wider text-gold/70">= Score</div>
          <div className="text-gold font-semibold">{fixed(b.compositeScore, 1)}</div>
          <div className="text-[7px] text-marble/40">out of 100</div>
        </div>
      </div>

      {/* Risk classification bar */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-[9px] font-mono">
        <div>
          <div className="text-[7px] uppercase tracking-wider text-marble/40 mb-1">
            Risk composite (ATR + 0.15·MaxDD) = {fixed(rc * 100, 2)}%
          </div>
          <div className="relative h-2 rounded-full bg-navy overflow-hidden border border-gold/10">
            {/* threshold zones */}
            <div className="absolute inset-y-0 left-0 bg-emerald-500/20" style={{ width: `${(riskT.LOW / (riskT.HIGH * 1.4)) * 100}%` }} />
            <div className="absolute inset-y-0 bg-gold/20" style={{ left: `${(riskT.LOW / (riskT.HIGH * 1.4)) * 100}%`, width: `${((riskT.MEDIUM - riskT.LOW) / (riskT.HIGH * 1.4)) * 100}%` }} />
            <div className="absolute inset-y-0 bg-orange-500/20" style={{ left: `${(riskT.MEDIUM / (riskT.HIGH * 1.4)) * 100}%`, width: `${((riskT.HIGH - riskT.MEDIUM) / (riskT.HIGH * 1.4)) * 100}%` }} />
            <div className="absolute inset-y-0 bg-red-500/20" style={{ left: `${(riskT.HIGH / (riskT.HIGH * 1.4)) * 100}%`, right: 0 }} />
            {/* current marker */}
            <div className="absolute top-0 h-full w-0.5 bg-gold" style={{ left: `${barPct}%` }} />
          </div>
          <div className="flex justify-between text-[7px] text-marble/40 mt-0.5">
            <span className="text-emerald-400">LOW ≤{fixed(riskT.LOW * 100, 1)}%</span>
            <span className="text-gold-light">MED ≤{fixed(riskT.MEDIUM * 100, 1)}%</span>
            <span className="text-orange-400">HIGH ≤{fixed(riskT.HIGH * 100, 1)}%</span>
            <span className="text-red-500">EXTREME</span>
          </div>
          <div className="text-[8px] text-marble/60 mt-1">
            Classified as <span className={
              b.riskLabel === 'LOW' ? 'text-emerald-400' :
              b.riskLabel === 'MEDIUM' ? 'text-gold-light' :
              b.riskLabel === 'HIGH' ? 'text-orange-400' : 'text-red-500'
            }>{b.riskLabel}</span>
            {r.ai && r.ai.riskLabel !== b.riskLabel && (
              <span className="text-marble/50"> · AI adjusted → <span className="text-gold">{r.ai.riskLabel}</span></span>
            )}
          </div>
        </div>

        <div>
          <div className="text-[7px] uppercase tracking-wider text-marble/40 mb-1">
            Monte-Carlo engine · {b.horizonSteps}h · 800 paths
          </div>
          <div className="text-marble/70">
            drift/h: <span className="text-gold-light">{fixed(b.driftPerStep * 100, 3)}%</span>
            {' · '}
            σ/h: <span className="text-gold-light">{fixed(b.sigmaPerStep * 100, 3)}%</span>
          </div>
          <div className="text-marble/70">
            E[Ret]: <span className="text-emerald-400">{fixed(r.monteCarlo.eReturnPct)}%</span>
            {' · '}
            E[DD]: <span className="text-red-400">{fixed(r.monteCarlo.eMaxDDPct)}%</span>
          </div>
          <div className="text-marble/70">
            P10 / P90: <span className="text-marble">{fixed(r.monteCarlo.p10ReturnPct)}% / {fixed(r.monteCarlo.p90ReturnPct)}%</span>
          </div>
          <div className="text-[7px] text-marble/40 mt-0.5">
            drift = MTF({fixed(r.mtfAlignment)}) · ATR({pct(r.atrPct, 2)}) · 0.5 &nbsp;·&nbsp; σ = max(RV, ATR·0.7)
          </div>
        </div>
      </div>
      <div className="mt-2 text-[7px] text-marble/30">
        Analytical decision support. Deterministic formulas above; AI may adjust risk by at most one level.
      </div>
    </div>
  );
}