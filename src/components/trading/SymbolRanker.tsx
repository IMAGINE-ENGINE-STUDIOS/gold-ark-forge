import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Target, TrendingUp, Shield, Activity, RefreshCw, Sparkles, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ALL_SYMBOLS } from '@/data/tradingSymbols';
import { buildPrecisionRow, rankRows, toAICandidate, type Direction, type PrecisionRow, type RiskLabel } from '@/lib/precision';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type CandleFn = (ticker: string) => { closes: number[]; highs: number[]; lows: number[] } | null;
type PriceFn = (ticker: string) => number;

interface Props {
  getCandleData: CandleFn;
  resolvePrice: PriceFn;
  activeCategory?: string;
  onSelectSymbol?: (ticker: string) => void;
}

const CATS = ['all', 'metals', 'crypto', 'forex', 'energy', 'stocks', 'indices'] as const;

const riskColor = (r: RiskLabel) =>
  r === 'LOW' ? 'text-emerald-400'
  : r === 'MEDIUM' ? 'text-gold-light'
  : r === 'HIGH' ? 'text-orange-400' : 'text-red-500';

export function SymbolRanker({ getCandleData, resolvePrice, activeCategory, onSelectSymbol }: Props) {
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

  return (
    <div className="border border-gold/20 rounded-lg bg-navy-dark/60 p-3 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-gold-light" />
          <span className="font-display text-sm tracking-wider text-gold-light">
            PRECISION RANK · GOAL SEEKER
          </span>
          <span className="text-[8px] text-marble/40 font-mono">v2 · MTF + Monte-Carlo + AI</span>
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
              {(summary.top.monteCarlo.pGoal * 100).toFixed(1)}% · {summary.top.ai?.riskLabel ?? summary.top.riskLabel}
            </div>
          </div>
          <div className="rounded border border-gold/15 p-2">
            <div className="text-[8px] text-marble/50 uppercase tracking-wider flex items-center gap-1"><Activity className="w-3 h-3" /> Avg P(Goal)</div>
            <div className="text-[11px] font-mono text-gold-light">{(summary.avgP * 100).toFixed(1)}%</div>
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
              <th className="text-left py-1 px-1">#</th>
              <th className="text-left py-1 px-1">Symbol</th>
              <th className="text-right py-1 px-1">Price</th>
              <th className="text-right py-1 px-1">ATR%</th>
              <th className="text-right py-1 px-1">MTF</th>
              <th className="text-right py-1 px-1">Regime</th>
              <th className="text-right py-1 px-1">Setup</th>
              <th className="text-right py-1 px-1">P(Goal)</th>
              <th className="text-right py-1 px-1">E[Ret%]</th>
              <th className="text-right py-1 px-1">E[DD%]</th>
              <th className="text-right py-1 px-1">Risk</th>
              <th className="text-right py-1 px-1">Score</th>
              <th className="text-right py-1 px-1">AI</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={13} className="text-center text-marble/40 py-6 text-[10px]">
                {scanning ? 'Building multi-timeframe snapshot…' : 'No candle data ready — try RESCAN.'}
              </td></tr>
            )}
            {rows.map((r, i) => {
              const risk = r.ai?.riskLabel ?? r.riskLabel;
              const score = r.ai?.adjustedScore ?? r.compositeScore;
              const mtfCol = r.mtfAlignment > 0.1 ? 'text-emerald-400' : r.mtfAlignment < -0.1 ? 'text-red-400' : 'text-marble/50';
              const isOpen = expanded === r.ticker;
              return (
                <>
                  <tr key={r.ticker}
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
                    <td className="py-1 px-1 text-right text-marble/80">{r.price > 0 ? r.price.toFixed(r.price < 10 ? 4 : 2) : '—'}</td>
                    <td className="py-1 px-1 text-right text-marble/70">{(r.atrPct * 100).toFixed(2)}%</td>
                    <td className={`py-1 px-1 text-right ${mtfCol}`}>{(r.mtfAlignment * 100).toFixed(0)}</td>
                    <td className="py-1 px-1 text-right text-marble/60 uppercase text-[8px]">{r.regime}</td>
                    <td className="py-1 px-1 text-right text-marble/60 text-[8px] truncate max-w-[100px]">{r.setup}</td>
                    <td className="py-1 px-1 text-right text-gold-light">{(r.monteCarlo.pGoal * 100).toFixed(1)}%</td>
                    <td className="py-1 px-1 text-right text-emerald-400/80">{(r.ai?.expectedReturnPct ?? r.monteCarlo.eReturnPct).toFixed(2)}</td>
                    <td className="py-1 px-1 text-right text-red-400/80">{(r.ai?.maxDrawdownPct ?? r.monteCarlo.eMaxDDPct).toFixed(2)}</td>
                    <td className={`py-1 px-1 text-right font-semibold ${riskColor(risk)}`}>{risk}</td>
                    <td className="py-1 px-1 text-right text-gold">{score.toFixed(1)}</td>
                    <td className="py-1 px-1 text-right">
                      {r.ai
                        ? <Info className="w-3 h-3 inline text-gold-light" />
                        : <span className="text-marble/25">—</span>}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-navy/60">
                      <td colSpan={13} className="px-3 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[9px] font-mono">
                          <div>
                            <div className="text-[8px] uppercase tracking-wider text-marble/40 mb-1">MTF Alignment</div>
                            {(['1h','4h','1d'] as const).map(tf => {
                              const s = r.mtf[tf];
                              if (!s) return <div key={tf} className="text-marble/30">{tf}: —</div>;
                              const c = s.bias > 0.1 ? 'text-emerald-400' : s.bias < -0.1 ? 'text-red-400' : 'text-marble/60';
                              return <div key={tf} className={c}>{tf}: {s.direction.toUpperCase()} · ADX {s.adx.toFixed(0)} · bias {(s.bias * 100).toFixed(0)}</div>;
                            })}
                          </div>
                          <div>
                            <div className="text-[8px] uppercase tracking-wider text-marble/40 mb-1">Monte Carlo · {horizonH}h</div>
                            <div>P(goal): <span className="text-gold-light">{(r.monteCarlo.pGoal * 100).toFixed(1)}%</span></div>
                            <div>P10 / P90: <span className="text-marble/70">{r.monteCarlo.p10ReturnPct.toFixed(2)}% / {r.monteCarlo.p90ReturnPct.toFixed(2)}%</span></div>
                            <div>Realized vol: {(r.realizedVolPct * 100).toFixed(2)}%</div>
                            <div>Hist max DD: {(r.histMaxDDPct * 100).toFixed(2)}%</div>
                          </div>
                          <div>
                            {r.ai ? (
                              <>
                                <div className="text-[8px] uppercase tracking-wider text-marble/40 mb-1 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> AI Levels & Rationale
                                </div>
                                <div>Entry / SL / TP: <span className="text-gold-light">{r.ai.entry.toFixed(2)} / {r.ai.stopLoss.toFixed(2)} / {r.ai.takeProfit.toFixed(2)}</span></div>
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
                </>
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