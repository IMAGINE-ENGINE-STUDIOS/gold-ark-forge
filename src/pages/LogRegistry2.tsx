import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getForecastLog, type ForecastLogEntry } from '@/lib/forecastLog';
import { RefreshCw, BarChart3, Check, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * LogRegistry2 — Forecast Accuracy Tracker
 * Shows all forecast predictions with green ✓ (correct) or red ✗ (wrong)
 * based on whether the projected direction matched actual price movement.
 *
 * Since we store currentPrice and projectedPrice at forecast time,
 * we compare consecutive entries for the same symbol to evaluate accuracy:
 * - If forecast was bullish (projected > current) and next price > current → ✓
 * - If forecast was bearish (projected < current) and next price < current → ✓
 * - Otherwise → ✗
 * - Latest entry per symbol is "pending" (no outcome yet).
 */

interface ScoredEntry extends ForecastLogEntry {
  outcome: 'correct' | 'wrong' | 'pending';
  actualPrice?: number;
}

const scoreForecasts = (log: ForecastLogEntry[]): ScoredEntry[] => {
  // Group entries by symbol, sorted newest first (log is already newest-first)
  const symbolMap = new Map<string, ForecastLogEntry[]>();
  log.forEach(e => {
    const key = `${e.symbol}:${e.timeframe}`;
    if (!symbolMap.has(key)) symbolMap.set(key, []);
    symbolMap.get(key)!.push(e);
  });

  const scored: ScoredEntry[] = [];

  log.forEach(entry => {
    const key = `${entry.symbol}:${entry.timeframe}`;
    const group = symbolMap.get(key)!;
    const idx = group.indexOf(entry);

    // Latest entry (idx 0) is pending — no next price to compare
    if (idx === 0) {
      scored.push({ ...entry, outcome: 'pending' });
      return;
    }

    // The entry before this one in time (idx-1 is newer) gives us the "actual" price
    const newerEntry = group[idx - 1];
    const actualPrice = newerEntry.currentPrice;
    const wasBullish = entry.projectedPrice > entry.currentPrice;
    const wasBearish = entry.projectedPrice < entry.currentPrice;
    const priceWentUp = actualPrice > entry.currentPrice;
    const priceWentDown = actualPrice < entry.currentPrice;

    let outcome: 'correct' | 'wrong' | 'pending' = 'pending';
    if (wasBullish && priceWentUp) outcome = 'correct';
    else if (wasBearish && priceWentDown) outcome = 'correct';
    else if (!wasBullish && !wasBearish) outcome = actualPrice === entry.currentPrice ? 'correct' : 'wrong';
    else outcome = 'wrong';

    scored.push({ ...entry, outcome, actualPrice });
  });

  return scored;
};

const LogRegistry2 = () => {
  const [log, setLog] = useState<ForecastLogEntry[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => { setLog(getForecastLog()); }, []);
  const refresh = () => setLog(getForecastLog());

  const scored = useMemo(() => scoreForecasts(log), [log]);

  const filtered = filter
    ? scored.filter(e => e.symbol.toLowerCase().includes(filter.toLowerCase()) || e.category.toLowerCase().includes(filter.toLowerCase()))
    : scored;

  const stats = useMemo(() => {
    const evaluated = scored.filter(e => e.outcome !== 'pending');
    const correct = evaluated.filter(e => e.outcome === 'correct').length;
    const total = evaluated.length;
    const pct = total > 0 ? ((correct / total) * 100).toFixed(1) : '—';
    return { correct, wrong: total - correct, total, pct };
  }, [scored]);

  return (
    <div className="min-h-screen bg-navy">
      <Header />

      <div className="container mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="divider-ornate mb-4">
            <span className="font-display text-[10px] tracking-[0.4em] text-gold/60">ACCURACY</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-marble tracking-[0.05em] mb-3">
            FORECAST <span className="text-gradient-gold">ACCURACY LOG</span>
          </h1>
          <p className="text-marble/40 text-sm max-w-lg mx-auto font-body">
            Tracks every wave function prediction against realized price action. Green means the forecast direction was correct; red means it missed.
          </p>
        </div>

        {/* Score Summary */}
        <div className="flex items-center justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-2xl font-mono text-emerald-400 font-bold">{stats.correct}</div>
            <div className="text-[9px] font-display tracking-wider text-marble/30">CORRECT</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-mono text-red-400 font-bold">{stats.wrong}</div>
            <div className="text-[9px] font-display tracking-wider text-marble/30">WRONG</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-mono text-gold font-bold">{stats.pct}%</div>
            <div className="text-[9px] font-display tracking-wider text-marble/30">ACCURACY</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-mono text-marble/50 font-bold">{stats.total}</div>
            <div className="text-[9px] font-display tracking-wider text-marble/30">EVALUATED</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by symbol or category…"
              className="bg-navy-light border border-gold/20 text-marble text-sm rounded px-3 py-1.5 font-mono placeholder:text-marble/20 focus:outline-none focus:border-gold/40 w-64"
            />
            <span className="text-[10px] font-mono text-marble/30">{filtered.length} entries</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/log-registry"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gold/20 text-marble/50 hover:text-gold hover:border-gold/40 transition-all text-[10px] font-display tracking-wider"
            >
              <BarChart3 className="w-3 h-3" /> RAW LOG
            </Link>
            <button onClick={refresh} className="flex items-center gap-1 px-3 py-1.5 rounded border border-gold/20 text-marble/50 hover:text-gold hover:border-gold/40 transition-all text-[10px] font-display tracking-wider">
              <RefreshCw className="w-3 h-3" /> REFRESH
            </button>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <BarChart3 className="w-12 h-12 text-gold/20 mx-auto mb-4" />
            <p className="text-marble/30 font-display text-sm tracking-wider">NO FORECAST ENTRIES YET</p>
            <p className="text-marble/15 text-xs font-mono mt-2">Toggle the WAVE button on the Trading Bridge chart to generate entries</p>
          </div>
        ) : (
          <div className="rounded-lg border border-gold/15 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[50px_1fr_70px_70px_100px_100px_100px_70px] gap-2 px-4 py-2 bg-navy-dark/60 border-b border-gold/10 text-[8px] font-display tracking-[0.15em] text-marble/30">
              <span>RESULT</span>
              <span>SYMBOL</span>
              <span>TF</span>
              <span>DIR</span>
              <span>ENTRY PRICE</span>
              <span>PROJECTED</span>
              <span>ACTUAL</span>
              <span>TIME</span>
            </div>

            {/* Rows */}
            <div className="max-h-[60vh] overflow-y-auto">
              {filtered.map((entry) => (
                <div
                  key={entry.id}
                  className={`grid grid-cols-[50px_1fr_70px_70px_100px_100px_100px_70px] gap-2 px-4 py-2.5 border-b border-gold/5 hover:bg-gold/5 transition-colors items-center ${
                    entry.outcome === 'correct' ? 'border-l-2 border-l-emerald-500/30' :
                    entry.outcome === 'wrong' ? 'border-l-2 border-l-red-500/30' :
                    'border-l-2 border-l-marble/10'
                  }`}
                >
                  {/* Result icon */}
                  <div className="flex items-center justify-center">
                    {entry.outcome === 'correct' && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    )}
                    {entry.outcome === 'wrong' && (
                      <div className="w-6 h-6 rounded-full bg-red-500/15 flex items-center justify-center">
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </div>
                    )}
                    {entry.outcome === 'pending' && (
                      <div className="w-6 h-6 rounded-full bg-marble/5 flex items-center justify-center">
                        <Minus className="w-3.5 h-3.5 text-marble/20" />
                      </div>
                    )}
                  </div>

                  {/* Symbol */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs text-marble truncate">{entry.symbol}</span>
                    <span className="text-[8px] text-marble/20 font-display tracking-wider uppercase">{entry.category}</span>
                  </div>

                  {/* TF */}
                  <span className="text-[10px] font-mono text-gold/60">{entry.timeframe}</span>

                  {/* Direction */}
                  <div className="flex items-center gap-1">
                    {entry.direction === 'bullish' ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    ) : entry.direction === 'bearish' ? (
                      <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <Minus className="w-3.5 h-3.5 text-marble/40" />
                    )}
                    <span className={`text-[9px] font-mono ${
                      entry.direction === 'bullish' ? 'text-emerald-400' : entry.direction === 'bearish' ? 'text-red-400' : 'text-marble/40'
                    }`}>
                      {entry.direction === 'bullish' ? '▲' : entry.direction === 'bearish' ? '▼' : '—'}
                    </span>
                  </div>

                  {/* Entry price */}
                  <span className="text-[10px] font-mono text-marble/60">
                    ${entry.currentPrice < 10 ? entry.currentPrice.toFixed(4) : entry.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>

                  {/* Projected */}
                  <span className={`text-[10px] font-mono ${
                    entry.projectedPrice > entry.currentPrice ? 'text-emerald-400' : entry.projectedPrice < entry.currentPrice ? 'text-red-400' : 'text-marble/40'
                  }`}>
                    ${entry.projectedPrice < 10 ? entry.projectedPrice.toFixed(4) : entry.projectedPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>

                  {/* Actual */}
                  <span className={`text-[10px] font-mono ${
                    entry.outcome === 'pending' ? 'text-marble/20' :
                    entry.outcome === 'correct' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {entry.actualPrice != null
                      ? `$${entry.actualPrice < 10 ? entry.actualPrice.toFixed(4) : entry.actualPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      : '⏳'}
                  </span>

                  {/* Time */}
                  <span className="text-[9px] font-mono text-marble/25">
                    {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 flex items-center justify-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center"><Check className="w-3 h-3 text-emerald-400" /></div>
            <span className="text-[9px] font-mono text-marble/30">Direction matched</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center"><X className="w-3 h-3 text-red-400" /></div>
            <span className="text-[9px] font-mono text-marble/30">Direction missed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-marble/5 flex items-center justify-center"><Minus className="w-3 h-3 text-marble/20" /></div>
            <span className="text-[9px] font-mono text-marble/30">Awaiting outcome</span>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LogRegistry2;
