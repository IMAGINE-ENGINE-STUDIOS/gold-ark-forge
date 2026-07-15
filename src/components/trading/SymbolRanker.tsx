import { useEffect, useMemo, useState } from 'react';
import { Target, TrendingUp, Shield, Activity, RefreshCw } from 'lucide-react';
import { buildTechnicalSnapshot } from '@/lib/technicalSignals';
import { ALL_SYMBOLS } from '@/data/tradingSymbols';

type CandleFn = (ticker: string) => { closes: number[]; highs: number[]; lows: number[] } | null;
type PriceFn = (ticker: string) => number;

interface Props {
  getCandleData: CandleFn;
  resolvePrice: PriceFn;
  activeCategory?: string;
  onSelectSymbol?: (ticker: string) => void;
}

interface Row {
  key: string;
  ticker: string;
  label: string;
  cat: string;
  price: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;   // 0..1 technical confidence
  bias: number;         // -1..1
  atrPct: number;       // per-period volatility
  successProb: number;  // 0..1 probability of hitting goal
  score: number;        // composite ranking score
  riskLabel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  regime: 'trend' | 'range' | 'mixed';
}

// Abramowitz & Stegun approximation for standard normal CDF
function normalCdf(x: number): number {
  const b1 = 0.319381530, b2 = -0.356563782, b3 = 1.781477937;
  const b4 = -1.821255978, b5 = 1.330274429, p = 0.2316419;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + p * ax);
  const pdf = Math.exp(-0.5 * ax * ax) / Math.sqrt(2 * Math.PI);
  const cdf = 1 - pdf * (b1 * t + b2 * t ** 2 + b3 * t ** 3 + b4 * t ** 4 + b5 * t ** 5);
  return 0.5 * (1 + sign * (2 * cdf - 1));
}

function riskFromAtr(atrPct: number): Row['riskLabel'] {
  if (atrPct < 0.006) return 'LOW';
  if (atrPct < 0.015) return 'MEDIUM';
  if (atrPct < 0.035) return 'HIGH';
  return 'EXTREME';
}

const CATS = ['all', 'metals', 'crypto', 'forex', 'energy', 'stocks', 'indices'] as const;

export function SymbolRanker({ getCandleData, resolvePrice, activeCategory, onSelectSymbol }: Props) {
  const [goalPct, setGoalPct] = useState<number>(2);
  const [horizonH, setHorizonH] = useState<number>(24);
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [category, setCategory] = useState<string>(activeCategory && CATS.includes(activeCategory as never) ? activeCategory : 'all');
  const [rows, setRows] = useState<Row[]>([]);
  const [scanning, setScanning] = useState(false);
  const [lastScanAt, setLastScanAt] = useState<number>(0);

  const scope = useMemo(() => {
    const list = category === 'all' ? ALL_SYMBOLS : ALL_SYMBOLS.filter(s => s.cat === category);
    return list.slice(0, 80); // safety cap
  }, [category]);

  const scan = useMemo(() => async () => {
    setScanning(true);
    const out: Row[] = [];
    for (const s of scope) {
      const candles = getCandleData(s.ticker);
      if (!candles || candles.closes.length < 30) continue;
      const snap = buildTechnicalSnapshot(candles);
      if (!snap) continue;

      // Per-period ATR% from last ~14 closes
      const closes = candles.closes;
      const n = Math.min(14, closes.length - 1);
      let trSum = 0;
      for (let i = closes.length - n; i < closes.length; i++) {
        trSum += Math.abs(closes[i] - closes[i - 1]) / Math.max(closes[i - 1], 1e-9);
      }
      const atrPct = trSum / n;

      // Expected drift proxy (per period) from overall bias × ATR%
      const drift = snap.overallBias * atrPct * 0.6;
      const stdev = atrPct * Math.sqrt(Math.max(1, horizonH));
      const mean = drift * Math.max(1, horizonH);
      const goal = (direction === 'long' ? goalPct : -goalPct) / 100;

      // Prob of terminal return >= goal (long) or <= goal (short)
      const z = stdev > 0 ? (goal - mean) / stdev : 0;
      let prob = direction === 'long' ? 1 - normalCdf(z) : normalCdf(z);

      // Direction alignment penalty when technicals disagree
      const wants = direction === 'long' ? 'bullish' : 'bearish';
      const aligned = snap.decision.direction === wants;
      const misaligned = (direction === 'long' && snap.decision.direction === 'bearish') ||
                          (direction === 'short' && snap.decision.direction === 'bullish');
      if (misaligned) prob *= 0.55;
      else if (aligned) prob = Math.min(0.98, prob * 1.08);

      const riskLabel = riskFromAtr(atrPct);
      // Composite: reward probability, penalize risk
      const riskFactor = 1 / (1 + atrPct * 30);
      const score = prob * (0.55 + 0.45 * snap.decision.confidence) * riskFactor;

      out.push({
        key: s.key,
        ticker: s.ticker,
        label: s.label,
        cat: s.cat,
        price: resolvePrice(s.ticker),
        direction: snap.decision.direction,
        confidence: snap.decision.confidence,
        bias: snap.overallBias,
        atrPct,
        successProb: Math.max(0, Math.min(1, prob)),
        score,
        riskLabel,
        regime: snap.decision.regime,
      });
      // Yield to UI between symbols
      if (out.length % 6 === 0) await new Promise(r => setTimeout(r, 0));
    }

    // Sort: lowest risk first, then highest success prob
    const riskOrder: Record<Row['riskLabel'], number> = { LOW: 0, MEDIUM: 1, HIGH: 2, EXTREME: 3 };
    out.sort((a, b) => {
      const r = riskOrder[a.riskLabel] - riskOrder[b.riskLabel];
      if (r !== 0) return r;
      return b.successProb - a.successProb;
    });
    setRows(out);
    setLastScanAt(Date.now());
    setScanning(false);
  }, [scope, getCandleData, resolvePrice, goalPct, horizonH, direction]);

  useEffect(() => {
    scan();
    const id = window.setInterval(scan, 20000);
    return () => window.clearInterval(id);
  }, [scan]);

  const summary = useMemo(() => {
    if (!rows.length) return null;
    const top = rows[0];
    const avgProb = rows.reduce((a, r) => a + r.successProb, 0) / rows.length;
    const tradable = rows.filter(r => r.successProb >= 0.55 && (r.riskLabel === 'LOW' || r.riskLabel === 'MEDIUM')).length;
    return { top, avgProb, tradable };
  }, [rows]);

  return (
    <div className="border border-gold/20 rounded-lg bg-navy-dark/60 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-gold-light" />
          <span className="font-display text-sm tracking-wider text-gold-light">INDICATOR RANK · GOAL SEEKER</span>
        </div>
        <button
          onClick={() => scan()}
          disabled={scanning}
          className="flex items-center gap-1 text-[9px] font-mono px-2 py-1 border border-gold/30 hover:border-gold/60 text-gold/80 rounded disabled:opacity-40"
        >
          <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'SCANNING' : 'RESCAN'}
        </button>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono">
        <label className="flex flex-col gap-1">
          <span className="text-marble/50 text-[8px] uppercase tracking-wider">Goal %</span>
          <input
            type="number" step="0.1" value={goalPct}
            onChange={e => setGoalPct(Math.max(0.1, parseFloat(e.target.value) || 0))}
            className="bg-navy border border-gold/20 rounded px-2 py-1 text-gold-light"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-marble/50 text-[8px] uppercase tracking-wider">Horizon (h)</span>
          <input
            type="number" step="1" min={1} value={horizonH}
            onChange={e => setHorizonH(Math.max(1, parseFloat(e.target.value) || 1))}
            className="bg-navy border border-gold/20 rounded px-2 py-1 text-gold-light"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-marble/50 text-[8px] uppercase tracking-wider">Direction</span>
          <select value={direction} onChange={e => setDirection(e.target.value as 'long' | 'short')}
            className="bg-navy border border-gold/20 rounded px-2 py-1 text-gold-light">
            <option value="long">LONG</option>
            <option value="short">SHORT</option>
          </select>
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
            <div className="text-[9px] text-marble/60">{(summary.top.successProb * 100).toFixed(1)}% · {summary.top.riskLabel}</div>
          </div>
          <div className="rounded border border-gold/15 p-2">
            <div className="text-[8px] text-marble/50 uppercase tracking-wider flex items-center gap-1"><Activity className="w-3 h-3" /> Avg Prob</div>
            <div className="text-[11px] font-mono text-gold-light">{(summary.avgProb * 100).toFixed(1)}%</div>
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
      <div className="max-h-[380px] overflow-y-auto watchlist-scroll">
        <table className="w-full text-[10px] font-mono">
          <thead className="sticky top-0 bg-navy-dark/95 text-marble/40 text-[8px] uppercase tracking-wider">
            <tr>
              <th className="text-left py-1 px-1">#</th>
              <th className="text-left py-1 px-1">Symbol</th>
              <th className="text-right py-1 px-1">Price</th>
              <th className="text-right py-1 px-1">ATR%</th>
              <th className="text-right py-1 px-1">Bias</th>
              <th className="text-right py-1 px-1">Conf</th>
              <th className="text-right py-1 px-1">P(Goal)</th>
              <th className="text-right py-1 px-1">Risk</th>
              <th className="text-right py-1 px-1">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={9} className="text-center text-marble/40 py-6 text-[10px]">
                {scanning ? 'Analyzing candles across the market…' : 'No candle data ready — try RESCAN in a few seconds.'}
              </td></tr>
            )}
            {rows.map((r, i) => {
              const riskColor = r.riskLabel === 'LOW' ? 'text-emerald-400'
                : r.riskLabel === 'MEDIUM' ? 'text-gold-light'
                : r.riskLabel === 'HIGH' ? 'text-orange-400' : 'text-red-500';
              const biasColor = r.bias > 0.05 ? 'text-emerald-400' : r.bias < -0.05 ? 'text-red-400' : 'text-marble/50';
              return (
                <tr
                  key={r.ticker}
                  onClick={() => onSelectSymbol?.(r.ticker)}
                  className="border-t border-gold/5 hover:bg-gold/5 cursor-pointer"
                >
                  <td className="py-1 px-1 text-marble/40">{i + 1}</td>
                  <td className="py-1 px-1">
                    <div className="text-gold-light">{r.ticker}</div>
                    <div className="text-[8px] text-marble/40 truncate max-w-[120px]">{r.label}</div>
                  </td>
                  <td className="py-1 px-1 text-right text-marble/80">{r.price > 0 ? r.price.toFixed(r.price < 10 ? 4 : 2) : '—'}</td>
                  <td className="py-1 px-1 text-right text-marble/70">{(r.atrPct * 100).toFixed(2)}%</td>
                  <td className={`py-1 px-1 text-right ${biasColor}`}>{(r.bias * 100).toFixed(0)}</td>
                  <td className="py-1 px-1 text-right text-marble/70">{(r.confidence * 100).toFixed(0)}%</td>
                  <td className="py-1 px-1 text-right text-gold-light">{(r.successProb * 100).toFixed(1)}%</td>
                  <td className={`py-1 px-1 text-right font-semibold ${riskColor}`}>{r.riskLabel}</td>
                  <td className="py-1 px-1 text-right text-gold">{(r.score * 100).toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[8px] text-marble/30 flex justify-between">
        <span>Sorted: lowest risk → highest goal probability</span>
        <span>{lastScanAt ? `Updated ${new Date(lastScanAt).toLocaleTimeString()}` : ''}</span>
      </div>
    </div>
  );
}

export default SymbolRanker;