import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Feather, Activity, Radio, ExternalLink, Layers, Store, Brain, Fuel, Gauge, Newspaper, CalendarDays, Flame } from 'lucide-react';
import Header from '@/components/Header';
import { SymbolRanker } from '@/components/trading/SymbolRanker';
import { useLiveMarketData } from '@/hooks/useLiveMarketData';
import { ALL_SYMBOLS, REAL_FEED_SYMBOLS } from '@/data/tradingSymbols';
import GATechnicalGauge from '@/components/ga-widgets/GATechnicalGauge';
import GANewsFeed from '@/components/ga-widgets/GANewsFeed';
import GAMarketPulse from '@/components/ga-widgets/GAMarketPulse';
import GAEconomicCalendar from '@/components/ga-widgets/GAEconomicCalendar';
import GATopMovers from '@/components/ga-widgets/GATopMovers';
import GAVolatilityMatrix from '@/components/ga-widgets/GAVolatilityMatrix';
import GACrossAssetDashboard from '@/components/ga-widgets/GACrossAssetDashboard';

/**
 * EAGLE VIEW · Precision Rank v2
 * ------------------------------------------------------------------
 * Full-page command console for the AI-augmented symbol ranker.
 * Every price shown on this page resolves through the same
 * useLiveMarketData source used by /showroom, /intelligence and
 * /oil-gas widgets, guaranteeing cross-page tick synchronization.
 */
export default function EagleView() {
  const live = useLiveMarketData();
  const [tick, setTick] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [intelTab, setIntelTab] = useState<'gauge' | 'context' | 'macro' | 'cross'>('gauge');

  // Force re-render every second so the live rail reflects new ticks
  useEffect(() => {
    const id = window.setInterval(() => setTick(t => (t + 1) % 1_000_000), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Live pulse — a rolling summary of the same feeds
  const pulse = useMemo(() => {
    const feed = REAL_FEED_SYMBOLS.map(s => ({
      s,
      p: live.resolvePrice(s),
      ch: live.resolveChange(s),
    })).filter(x => x.p > 0);
    const winners = feed.filter(x => x.ch > 0).length;
    const losers = feed.filter(x => x.ch < 0).length;
    const strongest = [...feed].sort((a, b) => b.ch - a.ch)[0];
    const weakest = [...feed].sort((a, b) => a.ch - b.ch)[0];
    return { count: feed.length, winners, losers, strongest, weakest, feed };
  }, [live, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.title = 'Eagle View · Precision Rank v2 — Gold Arrow';
    const meta = document.querySelector('meta[name="description"]');
    const desc = 'Eagle View — AI-augmented multi-timeframe symbol ranking, Monte-Carlo goal probability and live cross-market pricing synced with Gold Arrow intelligence surfaces.';
    if (meta) meta.setAttribute('content', desc);
  }, []);

  // Candle data for the selected symbol drives the drill-down widgets.
  const selectedSym = useMemo(
    () => (selected ? ALL_SYMBOLS.find(s => s.ticker === selected) : undefined),
    [selected],
  );
  const selectedCandles = useMemo(
    () => (selected ? live.getCandleData(selected) : null),
    [selected, live, tick], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="min-h-screen bg-navy-dark text-marble">
      <Header />

      {/* ─── Command band ─────────────────────────────────────────── */}
      <div className="border-b border-gold/20 bg-gradient-to-r from-navy-dark via-navy to-navy-dark">
        <div className="container mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full" />
              <Feather className="relative w-8 h-8 text-gold" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl tracking-[0.18em] text-gold">
                EAGLE&nbsp;VIEW
              </h1>
              <div className="text-[10px] tracking-[0.25em] text-gold/60 uppercase font-mono">
                Precision Rank v2 · MTF · Monte-Carlo · AI-Augmented
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider">
            <span className={`flex items-center gap-1.5 ${live.feedsReady ? 'text-emerald-400' : 'text-marble/40'}`}>
              <Radio className={`w-3 h-3 ${live.feedsReady ? 'animate-pulse' : ''}`} />
              {live.feedsReady ? 'Live feeds online' : 'Awaiting feeds'}
            </span>
            <span className="text-marble/40">·</span>
            <span className="text-marble/60">Symbols: {ALL_SYMBOLS.length}</span>
            <span className="text-marble/40">·</span>
            <span className="text-gold-light">Tick #{tick.toString().padStart(5, '0')}</span>
          </div>
        </div>

        {/* Cross-page sync bar */}
        <div className="border-t border-gold/10 bg-navy-dark/60">
          <div className="container mx-auto px-4 py-2 flex flex-wrap items-center gap-3 text-[10px] font-mono">
            <span className="text-marble/40 uppercase tracking-wider">Synced with</span>
            <Link to="/showroom" className="flex items-center gap-1 text-gold/70 hover:text-gold transition-colors">
              <Store className="w-3 h-3" /> Showroom <ExternalLink className="w-2.5 h-2.5 opacity-50" />
            </Link>
            <span className="text-gold/20">|</span>
            <Link to="/intelligence" className="flex items-center gap-1 text-gold/70 hover:text-gold transition-colors">
              <Brain className="w-3 h-3" /> Intelligence <ExternalLink className="w-2.5 h-2.5 opacity-50" />
            </Link>
            <span className="text-gold/20">|</span>
            <Link to="/oil-gas" className="flex items-center gap-1 text-gold/70 hover:text-gold transition-colors">
              <Fuel className="w-3 h-3" /> Oil &amp; Gas <ExternalLink className="w-2.5 h-2.5 opacity-50" />
            </Link>
            <span className="text-gold/20">|</span>
            <Link to="/trading-bridge" className="flex items-center gap-1 text-gold/70 hover:text-gold transition-colors">
              <Layers className="w-3 h-3" /> Swap Terminal <ExternalLink className="w-2.5 h-2.5 opacity-50" />
            </Link>
            <span className="ml-auto text-marble/40 uppercase tracking-wider">
              Same tick, one truth
            </span>
          </div>
        </div>
      </div>

      {/* ─── Pulse strip ─────────────────────────────────────────── */}
      <div className="border-b border-gold/10 bg-navy/40">
        <div className="container mx-auto px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <PulseCard label="Universe" value={String(pulse.count)} sub="live-priced symbols" />
          <PulseCard label="Advancers" value={String(pulse.winners)} sub={`${pulse.losers} decliners`} tone="up" />
          <PulseCard
            label="Strongest 24h"
            value={pulse.strongest ? `${pulse.strongest.s.ticker} +${pulse.strongest.ch.toFixed(2)}%` : '—'}
            sub={pulse.strongest ? fmtPrice(pulse.strongest.p) : ''}
            tone="up"
          />
          <PulseCard
            label="Weakest 24h"
            value={pulse.weakest ? `${pulse.weakest.s.ticker} ${pulse.weakest.ch.toFixed(2)}%` : '—'}
            sub={pulse.weakest ? fmtPrice(pulse.weakest.p) : ''}
            tone="down"
          />
        </div>
      </div>

      {/* ─── Main grid ───────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* LEFT — Ranker */}
        <section>
          <SymbolRanker
            getCandleData={live.getCandleData}
            resolvePrice={live.resolvePriceByTicker}
            onSelectSymbol={setSelected}
          />

          {/* ── Decision Intelligence — GA widget deck for the selected symbol ── */}
          <div className="mt-4 border border-gold/20 rounded-lg bg-navy-dark/70 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gold/10 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5 text-gold-light" />
                <span className="font-display text-[11px] tracking-[0.15em] text-gold-light uppercase">
                  Decision Intelligence
                </span>
                {selected ? (
                  <span className="text-[9px] text-marble/50 font-mono">
                    · {selected} <span className="text-marble/30">({selectedSym?.label})</span>
                  </span>
                ) : (
                  <span className="text-[9px] text-marble/40 font-mono">· pick a symbol above</span>
                )}
              </div>
              <div className="flex border border-gold/20 rounded overflow-hidden text-[9px] font-mono">
                {([
                  { k: 'gauge',   label: 'GAUGE',   icon: Gauge },
                  { k: 'context', label: 'CONTEXT', icon: Newspaper },
                  { k: 'macro',   label: 'MACRO',   icon: CalendarDays },
                  { k: 'cross',   label: 'CROSS',   icon: Flame },
                ] as const).map(t => {
                  const Icon = t.icon;
                  const active = intelTab === t.k;
                  return (
                    <button key={t.k} onClick={() => setIntelTab(t.k)}
                      className={`flex items-center gap-1 px-2 py-1 ${active ? 'bg-gold/20 text-gold-light' : 'text-marble/50 hover:text-marble/80'}`}>
                      <Icon className="w-2.5 h-2.5" /> {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3">
              {intelTab === 'gauge' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  <GATechnicalGauge
                    assetLabel={selected ?? undefined}
                    candles={selectedCandles ?? undefined}
                  />
                  <GAVolatilityMatrix />
                </div>
              )}
              {intelTab === 'context' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  <GANewsFeed />
                  <GATopMovers />
                </div>
              )}
              {intelTab === 'macro' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  <GAEconomicCalendar />
                  <GAMarketPulse />
                </div>
              )}
              {intelTab === 'cross' && (
                <div className="grid grid-cols-1 gap-3">
                  <GACrossAssetDashboard />
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 border border-gold/15 rounded-lg p-3 bg-navy-dark/60">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-3.5 h-3.5 text-gold-light" />
              <span className="font-display text-xs tracking-wider text-gold-light">
                METHOD · WHY EAGLE VIEW SEES FURTHER
              </span>
            </div>
            <ul className="text-[10px] font-mono text-marble/70 space-y-1 leading-relaxed">
              <li>• Multi-timeframe alignment across 1h · 4h · 1d with ADX-weighted bias.</li>
              <li>• 800-path Monte-Carlo goal probability with expected return &amp; tail drawdown.</li>
              <li>• Regime detection (trend · squeeze · range) with setup-aware scoring.</li>
              <li>• Optional Gemini-3.5 refinement layer for entry / SL / TP and risk override.</li>
              <li>• Every column has a hover tooltip; expand any row for the full deterministic breakdown.</li>
              <li>• Zero synthetic prices — feeds identical to Showroom · Intelligence · Oil &amp; Gas.</li>
            </ul>
          </div>
        </section>

        {/* RIGHT — Live rail */}
        <aside className="space-y-4">
          <div className="border border-gold/15 rounded-lg bg-navy-dark/70 overflow-hidden">
            <div className="px-3 py-2 border-b border-gold/10 flex items-center justify-between">
              <span className="font-display text-[11px] tracking-wider text-gold-light">
                LIVE PRICE RAIL
              </span>
              <span className="text-[8px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 1s
              </span>
            </div>
            <div className="max-h-[520px] overflow-y-auto watchlist-scroll divide-y divide-gold/5">
              {pulse.feed.map(({ s, p, ch }) => {
                const active = selected === s.ticker;
                return (
                  <button
                    key={s.ticker}
                    onClick={() => setSelected(s.ticker)}
                    className={`w-full grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-1.5 text-[10px] font-mono hover:bg-gold/5 transition-colors text-left ${active ? 'bg-gold/10' : ''}`}
                  >
                    <div>
                      <div className="text-gold-light">{s.ticker}</div>
                      <div className="text-[8px] text-marble/40 truncate max-w-[130px]">{s.label}</div>
                    </div>
                    <div className="text-marble/80">{fmtPrice(p)}</div>
                    <div className={`w-14 text-right ${ch > 0 ? 'text-emerald-400' : ch < 0 ? 'text-red-400' : 'text-marble/40'}`}>
                      {ch > 0 ? '+' : ''}{ch.toFixed(2)}%
                    </div>
                  </button>
                );
              })}
              {pulse.feed.length === 0 && (
                <div className="text-[10px] text-marble/40 text-center py-6 font-mono">
                  Warming up live feeds…
                </div>
              )}
            </div>
          </div>

          <div className="border border-gold/15 rounded-lg bg-navy-dark/70 p-3 text-[10px] font-mono text-marble/70 leading-relaxed">
            <div className="text-gold-light text-[11px] tracking-wider font-display mb-1">SELECTED</div>
            {selected ? (
              <>
                <div className="text-gold text-sm">{selected}</div>
                <div>Price: <span className="text-marble">{fmtPrice(live.resolvePriceByTicker(selected))}</span></div>
                <div>24h: <span className={live.resolveChangeByTicker(selected) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {live.resolveChangeByTicker(selected).toFixed(2)}%
                </span></div>
                <Link
                  to={`/trading-bridge?symbol=${encodeURIComponent(selected)}`}
                  className="mt-2 inline-flex items-center gap-1 text-[10px] text-gold hover:text-gold-light"
                >
                  Open in Swap Terminal <ExternalLink className="w-3 h-3" />
                </Link>
              </>
            ) : (
              <div className="text-marble/40">Click any row in the ranker or price rail.</div>
            )}
          </div>

          <div className="text-[8px] font-mono text-marble/30 leading-relaxed border-t border-gold/10 pt-3">
            Analytical decision support. Not investment advice. All ranks derived from live public feeds; AI refinement is advisory-only and never overrides risk by more than one level.
          </div>
        </aside>
      </div>
    </div>
  );
}

function PulseCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'up' | 'down' }) {
  const toneCol = tone === 'up' ? 'text-emerald-400' : tone === 'down' ? 'text-red-400' : 'text-gold-light';
  return (
    <div className="border border-gold/15 rounded p-2.5 bg-navy-dark/60">
      <div className="text-[8px] uppercase tracking-[0.2em] text-marble/40 font-mono">{label}</div>
      <div className={`text-sm font-mono ${toneCol} mt-0.5 truncate`}>{value}</div>
      {sub && <div className="text-[9px] font-mono text-marble/50 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

function fmtPrice(p: number) {
  if (p <= 0) return '—';
  if (p < 1) return p.toFixed(4);
  if (p < 100) return p.toFixed(3);
  return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
}