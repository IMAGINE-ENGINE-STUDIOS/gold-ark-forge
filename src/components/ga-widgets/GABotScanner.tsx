import { useState, useMemo, useCallback } from 'react';
import { Radar, TrendingUp, TrendingDown, Zap, Shield, Target, Activity, ArrowUpRight, ArrowDownRight, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { REAL_FEED_SYMBOLS, WatchlistSymbol } from '@/data/tradingSymbols';
import { computeCompositeSignal, type SignalBreakdown } from '@/hooks/useTradingBot';
import LivePulse from './LivePulse';

interface Props {
  resolvePrice: (ticker: string) => number;
  getCandleData: (ticker: string) => { closes: number[]; highs: number[]; lows: number[] } | null;
  getWaveBias: (ticker: string) => number;
  onNavigate?: (sym: WatchlistSymbol) => void;
  botBudget?: number;
}

interface ScanResult {
  sym: WatchlistSymbol;
  price: number;
  signal: SignalBreakdown;
  waveBias: number;
  waveDirection: 'bullish' | 'bearish' | 'neutral';
  riskScore: number; // 0-100, higher = riskier
  opportunityScore: number; // 0-100, higher = better
  recommendation: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL' | 'NO DATA';
  atr: number;
  rsi: number;
  regime: 'TRENDING' | 'RANGING';
  riskReward: number;
}

const TABS = ['ALL', 'CRYPTO', 'METALS', 'ENERGY'] as const;
const SORT_OPTIONS = ['OPPORTUNITY', 'RISK', 'WAVE', 'COMPOSITE'] as const;

// Indicator weight config matching the bot's balanced strategy
const WEIGHTS = { trend: 0.25, momentum: 0.30, volatility: 0.15, volume: 0.15, wave: 0.15 };

export default function GABotScanner({ resolvePrice, getCandleData, getWaveBias, onNavigate, botBudget = 25000 }: Props) {
  const [tab, setTab] = useState<typeof TABS[number]>('ALL');
  const [sortBy, setSortBy] = useState<typeof SORT_OPTIONS[number]>('OPPORTUNITY');
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

  const results = useMemo<ScanResult[]>(() => {
    const out: ScanResult[] = [];

    for (const sym of REAL_FEED_SYMBOLS) {
      const price = resolvePrice(sym.ticker);
      if (price <= 0) continue;

      const candle = getCandleData(sym.ticker);
      if (!candle || candle.closes.length < 30) continue;

      const waveBias = getWaveBias(sym.ticker);
      const signal = computeCompositeSignal(candle.closes, candle.highs, candle.lows, waveBias, WEIGHTS);

      // RSI from closes
      const rsiPeriod = 14;
      let rsi = 50;
      if (candle.closes.length >= rsiPeriod + 1) {
        let gains = 0, losses = 0;
        for (let i = candle.closes.length - rsiPeriod; i < candle.closes.length; i++) {
          const diff = candle.closes[i] - candle.closes[i - 1];
          if (diff > 0) gains += diff; else losses -= diff;
        }
        const avgGain = gains / rsiPeriod;
        const avgLoss = losses / rsiPeriod;
        const rs = avgLoss > 0 ? avgGain / avgLoss : 100;
        rsi = 100 - (100 / (1 + rs));
      }

      // ATR
      let atr = price * 0.01;
      if (candle.highs.length >= 14) {
        let atrSum = 0;
        for (let i = candle.highs.length - 14; i < candle.highs.length; i++) {
          const tr = Math.max(
            candle.highs[i] - candle.lows[i],
            Math.abs(candle.highs[i] - (candle.closes[i - 1] || candle.closes[i])),
            Math.abs(candle.lows[i] - (candle.closes[i - 1] || candle.closes[i]))
          );
          atrSum += tr;
        }
        atr = atrSum / 14;
      }

      // Regime detection
      const recent = candle.closes.slice(-20);
      const priceRange = recent.length > 0 ? Math.max(...recent) - Math.min(...recent) : 0;
      const regime: 'TRENDING' | 'RANGING' = priceRange > atr * 3 ? 'TRENDING' : 'RANGING';

      // Risk-reward estimate
      const stopDist = atr * 1.0;
      const targetDist = atr * 1.5;
      const riskReward = stopDist > 0 ? targetDist / stopDist : 0;

      // Wave direction
      const waveDirection: 'bullish' | 'bearish' | 'neutral' =
        waveBias > 0.15 ? 'bullish' : waveBias < -0.15 ? 'bearish' : 'neutral';

      // Risk score (0-100): higher vol, extreme RSI, ranging = riskier
      const atrNorm = (atr / price) * 100;
      const rsiExtreme = Math.abs(rsi - 50) > 20 ? (Math.abs(rsi - 50) - 20) / 30 : 0;
      const riskScore = Math.min(100, Math.round(
        atrNorm * 15 + rsiExtreme * 30 + (regime === 'RANGING' ? 20 : 0) + (Math.abs(signal.composite) < 0.2 ? 15 : 0)
      ));

      // Opportunity score (0-100): signal strength, wave confluence, trending, good R:R
      const signalStrength = Math.abs(signal.composite) * 40;
      const waveConfluence = Math.sign(signal.composite) === Math.sign(waveBias) && Math.abs(waveBias) > 0.1 ? 20 : 0;
      const trendBonus = regime === 'TRENDING' ? 15 : 0;
      const rrBonus = riskReward >= 1.5 ? 15 : riskReward >= 1.0 ? 8 : 0;
      const momentumConfirm = Math.sign(signal.momentum) === Math.sign(signal.composite) ? 10 : 0;
      const opportunityScore = Math.min(100, Math.round(signalStrength + waveConfluence + trendBonus + rrBonus + momentumConfirm));

      // Recommendation
      let recommendation: ScanResult['recommendation'] = 'HOLD';
      if (opportunityScore >= 70 && signal.composite > 0.3) recommendation = 'STRONG BUY';
      else if (opportunityScore >= 50 && signal.composite > 0.15) recommendation = 'BUY';
      else if (opportunityScore >= 70 && signal.composite < -0.3) recommendation = 'STRONG SELL';
      else if (opportunityScore >= 50 && signal.composite < -0.15) recommendation = 'SELL';

      out.push({ sym, price, signal, waveBias, waveDirection, riskScore, opportunityScore, recommendation, atr, rsi, regime, riskReward });
    }

    return out;
  }, [resolvePrice, getCandleData, getWaveBias]);

  const filtered = useMemo(() => {
    let list = tab === 'ALL' ? results : results.filter(r => r.sym.cat === tab.toLowerCase());
    list = [...list].sort((a, b) => {
      if (sortBy === 'OPPORTUNITY') return b.opportunityScore - a.opportunityScore;
      if (sortBy === 'RISK') return a.riskScore - b.riskScore;
      if (sortBy === 'WAVE') return Math.abs(b.waveBias) - Math.abs(a.waveBias);
      return Math.abs(b.signal.composite) - Math.abs(a.signal.composite);
    });
    return list;
  }, [results, tab, sortBy]);

  const topOpportunities = filtered.filter(r => r.recommendation.includes('BUY') || r.recommendation.includes('SELL')).slice(0, 3);
  const avgOpportunity = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.opportunityScore, 0) / results.length) : 0;
  const avgRisk = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.riskScore, 0) / results.length) : 0;

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="px-6 py-4 border-b border-gold/10 bg-navy-dark/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radar className="w-5 h-5 text-gold" />
            <span className="font-display text-sm tracking-[0.15em] text-gold-light">BOT MARKET SCANNER</span>
            <LivePulse label="LIVE" />
          </div>
          <div className="flex items-center gap-2 text-[9px] font-mono text-marble/30">
            <span>{results.length} assets</span>
            <span>•</span>
            <span>Budget ${botBudget.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        {/* Market Overview */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-navy-dark/50 rounded-lg p-3 border border-gold/5 text-center">
            <div className="text-[8px] font-display tracking-wider text-marble/30">MARKET SENTIMENT</div>
            <div className={`text-lg font-mono font-bold ${avgOpportunity >= 50 ? 'text-emerald-400' : avgOpportunity >= 30 ? 'text-gold' : 'text-red-400'}`}>
              {avgOpportunity >= 60 ? 'BULLISH' : avgOpportunity >= 40 ? 'MIXED' : 'CAUTIOUS'}
            </div>
          </div>
          <div className="bg-navy-dark/50 rounded-lg p-3 border border-gold/5 text-center">
            <div className="text-[8px] font-display tracking-wider text-marble/30">AVG OPPORTUNITY</div>
            <div className="text-lg font-mono font-bold text-gold">{avgOpportunity}%</div>
          </div>
          <div className="bg-navy-dark/50 rounded-lg p-3 border border-gold/5 text-center">
            <div className="text-[8px] font-display tracking-wider text-marble/30">AVG RISK</div>
            <div className={`text-lg font-mono font-bold ${avgRisk <= 30 ? 'text-emerald-400' : avgRisk <= 60 ? 'text-amber-400' : 'text-red-400'}`}>{avgRisk}%</div>
          </div>
        </div>

        {/* Top Signals */}
        {topOpportunities.length > 0 && (
          <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/15">
            <div className="text-[9px] font-display tracking-[0.12em] text-emerald-400/70 mb-2 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> TOP SIGNALS
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {topOpportunities.map(r => (
                <button
                  key={r.sym.ticker}
                  onClick={() => onNavigate?.(r.sym)}
                  className="flex-shrink-0 bg-navy-dark/60 rounded px-3 py-2 border border-gold/10 hover:border-gold/30 transition-all text-left"
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[8px] font-mono px-1 py-0.5 rounded ${
                      r.recommendation.includes('BUY') ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                    }`}>{r.recommendation}</span>
                    <span className="text-[10px] font-display tracking-wider text-marble/60">{r.sym.ticker}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-mono text-marble/30">
                    <span>Score: {r.opportunityScore}</span>
                    <span className={r.waveDirection === 'bullish' ? 'text-emerald-400/60' : r.waveDirection === 'bearish' ? 'text-red-400/60' : 'text-marble/30'}>
                      WAVE: {r.waveDirection === 'bullish' ? '↑' : r.waveDirection === 'bearish' ? '↓' : '→'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs + Sort */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 rounded text-[9px] font-display tracking-[0.1em] transition-all ${
                  tab === t ? 'bg-gold/15 text-gold border border-gold/30' : 'text-marble/30 border border-gold/5 hover:text-marble/50'
                }`}>{t}</button>
            ))}
          </div>
          <div className="flex gap-1">
            {SORT_OPTIONS.map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`px-2 py-1 rounded text-[8px] font-mono transition-all ${
                  sortBy === s ? 'bg-gold/10 text-gold/70 border border-gold/20' : 'text-marble/20 border border-transparent hover:text-marble/40'
                }`}>{s}</button>
            ))}
          </div>
        </div>

        {/* Asset List */}
        <div className="space-y-1 max-h-[500px] overflow-y-auto watchlist-scroll">
          {filtered.length === 0 && (
            <div className="text-center text-xs text-marble/20 py-8 font-display">
              No assets with sufficient data. Start the bot to accumulate candle history.
            </div>
          )}
          {filtered.map(r => {
            const isExpanded = expandedTicker === r.sym.ticker;
            return (
              <div key={r.sym.ticker} className="bg-navy-light/20 rounded-lg border border-gold/5 hover:border-gold/15 transition-all">
                {/* Main Row */}
                <button
                  onClick={() => setExpandedTicker(isExpanded ? null : r.sym.ticker)}
                  className="w-full flex items-center justify-between p-3 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Recommendation badge */}
                    <div className={`w-16 flex-shrink-0 text-center text-[7px] font-mono px-1 py-0.5 rounded ${
                      r.recommendation === 'STRONG BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                      r.recommendation === 'BUY' ? 'bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/10' :
                      r.recommendation === 'STRONG SELL' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                      r.recommendation === 'SELL' ? 'bg-red-500/10 text-red-400/70 border border-red-500/10' :
                      'bg-navy-dark/40 text-marble/30 border border-gold/5'
                    }`}>
                      {r.recommendation}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-display tracking-wider text-marble/60">{r.sym.ticker}</span>
                        <span className={`text-[7px] font-mono px-1 rounded ${
                          r.sym.cat === 'crypto' ? 'bg-purple-500/10 text-purple-400/50' :
                          r.sym.cat === 'metals' ? 'bg-gold/10 text-gold/50' :
                          'bg-cyan-500/10 text-cyan-400/50'
                        }`}>{r.sym.cat.toUpperCase()}</span>
                      </div>
                      <div className="text-[9px] font-mono text-marble/25">
                        ${r.price < 1 ? r.price.toFixed(4) : r.price < 100 ? r.price.toFixed(2) : r.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Mini signal gauges */}
                    <div className="hidden sm:flex gap-1">
                      <MiniBar label="T" value={r.signal.trend} />
                      <MiniBar label="M" value={r.signal.momentum} />
                      <MiniBar label="V" value={r.signal.volatility} />
                      <MiniBar label="W" value={r.signal.wave} />
                    </div>

                    {/* Composite */}
                    <div className={`text-xs font-mono font-bold w-12 text-right ${
                      r.signal.composite > 0.3 ? 'text-emerald-400' : r.signal.composite < -0.3 ? 'text-red-400' : 'text-marble/40'
                    }`}>
                      {r.signal.composite > 0 ? '+' : ''}{(r.signal.composite * 100).toFixed(0)}%
                    </div>

                    {/* Wave direction */}
                    <div className={`w-5 h-5 flex items-center justify-center ${
                      r.waveDirection === 'bullish' ? 'text-emerald-400' : r.waveDirection === 'bearish' ? 'text-red-400' : 'text-marble/20'
                    }`}>
                      {r.waveDirection === 'bullish' ? <ArrowUpRight className="w-4 h-4" /> :
                       r.waveDirection === 'bearish' ? <ArrowDownRight className="w-4 h-4" /> :
                       <Minus className="w-4 h-4" />}
                    </div>

                    {/* Opportunity score */}
                    <div className="w-8 text-right">
                      <div className={`text-[10px] font-mono font-bold ${
                        r.opportunityScore >= 60 ? 'text-emerald-400' : r.opportunityScore >= 40 ? 'text-gold' : 'text-marble/30'
                      }`}>{r.opportunityScore}</div>
                    </div>

                    {isExpanded ? <ChevronUp className="w-3 h-3 text-marble/20" /> : <ChevronDown className="w-3 h-3 text-marble/20" />}
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t border-gold/5 pt-3">
                    {/* Signal breakdown */}
                    <div className="grid grid-cols-5 gap-2">
                      <SignalCell label="TREND" value={r.signal.trend} desc="SMA/EMA/Ichimoku/SAR" />
                      <SignalCell label="MOMENTUM" value={r.signal.momentum} desc="RSI/MACD/Stoch/CCI" />
                      <SignalCell label="VOLATILITY" value={r.signal.volatility} desc="Bollinger/ATR/Keltner" />
                      <SignalCell label="VOLUME" value={r.signal.volume} desc="OBV/MFI/CMF/A-D" />
                      <SignalCell label="WAVE" value={r.signal.wave} desc="Forecast bias" />
                    </div>

                    {/* Risk & Opportunity gauges */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[8px] font-mono mb-1">
                          <span className="text-marble/30">OPPORTUNITY</span>
                          <span className={r.opportunityScore >= 60 ? 'text-emerald-400' : 'text-marble/40'}>{r.opportunityScore}/100</span>
                        </div>
                        <div className="h-2 bg-navy-dark/60 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${
                            r.opportunityScore >= 60 ? 'bg-emerald-500' : r.opportunityScore >= 40 ? 'bg-gold' : 'bg-marble/30'
                          }`} style={{ width: `${r.opportunityScore}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[8px] font-mono mb-1">
                          <span className="text-marble/30">RISK</span>
                          <span className={r.riskScore <= 30 ? 'text-emerald-400/60' : r.riskScore <= 60 ? 'text-amber-400' : 'text-red-400'}>{r.riskScore}/100</span>
                        </div>
                        <div className="h-2 bg-navy-dark/60 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${
                            r.riskScore <= 30 ? 'bg-emerald-500/60' : r.riskScore <= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`} style={{ width: `${r.riskScore}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Key metrics */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-navy-dark/40 rounded p-2 border border-gold/5">
                        <div className="text-[7px] text-marble/25 font-display tracking-wider">RSI</div>
                        <div className={`text-xs font-mono ${r.rsi > 70 ? 'text-red-400' : r.rsi < 30 ? 'text-emerald-400' : 'text-marble/50'}`}>
                          {r.rsi.toFixed(0)}
                        </div>
                      </div>
                      <div className="bg-navy-dark/40 rounded p-2 border border-gold/5">
                        <div className="text-[7px] text-marble/25 font-display tracking-wider">ATR</div>
                        <div className="text-xs font-mono text-marble/50">${r.atr < 1 ? r.atr.toFixed(4) : r.atr.toFixed(2)}</div>
                      </div>
                      <div className="bg-navy-dark/40 rounded p-2 border border-gold/5">
                        <div className="text-[7px] text-marble/25 font-display tracking-wider">R:R</div>
                        <div className={`text-xs font-mono ${r.riskReward >= 1.5 ? 'text-emerald-400' : 'text-marble/40'}`}>{r.riskReward.toFixed(1)}</div>
                      </div>
                      <div className="bg-navy-dark/40 rounded p-2 border border-gold/5">
                        <div className="text-[7px] text-marble/25 font-display tracking-wider">REGIME</div>
                        <div className={`text-xs font-mono ${r.regime === 'TRENDING' ? 'text-cyan-400' : 'text-marble/40'}`}>{r.regime}</div>
                      </div>
                    </div>

                    {/* WAVE forecast detail */}
                    <div className={`rounded-lg p-2.5 border ${
                      r.waveDirection === 'bullish' ? 'bg-emerald-500/5 border-emerald-500/15' :
                      r.waveDirection === 'bearish' ? 'bg-red-500/5 border-red-500/15' :
                      'bg-navy-dark/30 border-gold/5'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className={`w-3.5 h-3.5 ${
                            r.waveDirection === 'bullish' ? 'text-emerald-400' : r.waveDirection === 'bearish' ? 'text-red-400' : 'text-marble/30'
                          }`} />
                          <span className="text-[9px] font-display tracking-[0.1em] text-marble/40">WAVE FORECAST</span>
                        </div>
                        <span className={`text-xs font-mono font-bold ${
                          r.waveDirection === 'bullish' ? 'text-emerald-400' : r.waveDirection === 'bearish' ? 'text-red-400' : 'text-marble/30'
                        }`}>
                          {r.waveBias > 0 ? '+' : ''}{(r.waveBias * 100).toFixed(0)}% {r.waveDirection.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 bg-navy-dark/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            r.waveDirection === 'bullish' ? 'bg-emerald-500' : r.waveDirection === 'bearish' ? 'bg-red-500' : 'bg-marble/30'
                          }`}
                          style={{
                            width: `${Math.abs(r.waveBias) * 100}%`,
                            marginLeft: r.waveBias < 0 ? `${50 + r.waveBias * 50}%` : '50%',
                          }}
                        />
                      </div>
                    </div>

                    {/* Navigate button */}
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate(r.sym)}
                        className="w-full text-[9px] font-display tracking-wider text-gold/60 hover:text-gold transition-colors py-1.5 rounded border border-gold/10 hover:border-gold/25 bg-gold/5"
                      >
                        VIEW ON CHART →
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

function MiniBar({ label, value }: { label: string; value: number }) {
  const pct = Math.abs(value) * 100;
  const color = value > 0.3 ? 'bg-emerald-500' : value < -0.3 ? 'bg-red-500' : 'bg-marble/30';
  return (
    <div className="w-6 text-center" title={`${label}: ${(value * 100).toFixed(0)}%`}>
      <div className="text-[6px] text-marble/20 font-mono">{label}</div>
      <div className="h-1 bg-navy-dark/60 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

function SignalCell({ label, value, desc }: { label: string; value: number; desc: string }) {
  const color = value > 0.3 ? 'text-emerald-400' : value < -0.3 ? 'text-red-400' : 'text-marble/40';
  const barColor = value > 0.3 ? 'bg-emerald-500' : value < -0.3 ? 'bg-red-500' : 'bg-marble/30';
  return (
    <div className="text-center">
      <div className="text-[7px] font-display tracking-wider text-marble/25 mb-1">{label}</div>
      <div className={`text-sm font-mono font-bold ${color}`}>
        {value > 0 ? '+' : ''}{(value * 100).toFixed(0)}%
      </div>
      <div className="h-1.5 bg-navy-dark/60 rounded-full overflow-hidden mt-1 mx-1">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(Math.abs(value) * 100, 100)}%` }} />
      </div>
      <div className="text-[6px] text-marble/15 mt-0.5">{desc}</div>
    </div>
  );
}
