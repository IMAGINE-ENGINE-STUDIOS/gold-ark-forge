import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ExternalLink, Brain, Gauge, Newspaper, CalendarDays, Flame, ArrowUpRight, ShieldCheck } from 'lucide-react';
import Header from '@/components/Header';
import { SymbolRanker } from '@/components/trading/SymbolRanker';
import { useLiveMarketData } from '@/hooks/useLiveMarketData';
import { ALL_SYMBOLS, REAL_FEED_SYMBOLS } from '@/data/tradingSymbols';
import { verdictFor, type PrecisionRow, type Direction } from '@/lib/precision';
import GATechnicalGauge from '@/components/ga-widgets/GATechnicalGauge';
import GANewsFeed from '@/components/ga-widgets/GANewsFeed';
import GAMarketPulse from '@/components/ga-widgets/GAMarketPulse';
import GAEconomicCalendar from '@/components/ga-widgets/GAEconomicCalendar';
import GATopMovers from '@/components/ga-widgets/GATopMovers';
import GAVolatilityMatrix from '@/components/ga-widgets/GAVolatilityMatrix';
import GACrossAssetDashboard from '@/components/ga-widgets/GACrossAssetDashboard';

const safeNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const safeFixed = (value: unknown, digits = 2, fallback = '—') => {
  const n = safeNumber(value, NaN);
  return Number.isFinite(n) ? n.toFixed(digits) : fallback;
};

const safePct = (value: unknown, digits = 1, fallback = '—') => {
  const n = safeNumber(value, NaN);
  return Number.isFinite(n) ? `${(n * 100).toFixed(digits)}%` : fallback;
};

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
  const [rankedRows, setRankedRows] = useState<PrecisionRow[]>([]);
  const [rankDirection, setRankDirection] = useState<Direction>('long');

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

  // Top directive derived from the ranker — one clear action call.
  const directive = useMemo(() => {
    if (!rankedRows.length) return null;
    const scored = rankedRows.map(r => ({ r, v: verdictFor(r, rankDirection) }));
    // Prefer highest conviction; tie-break by score.
    scored.sort((a, b) => b.v.conviction - a.v.conviction ||
      (b.r.ai?.adjustedScore ?? b.r.compositeScore) - (a.r.ai?.adjustedScore ?? a.r.compositeScore));
    return scored[0];
  }, [rankedRows, rankDirection]);

  const topFive = useMemo(() => {
    return rankedRows
      .map(r => ({ r, v: verdictFor(r, rankDirection) }))
      .sort((a, b) => b.v.conviction - a.v.conviction)
      .slice(0, 5);
  }, [rankedRows, rankDirection]);

  return (
    <div className="min-h-screen bg-navy-dark text-marble">
      <Header />

      {/* ─── Directive Hero — Apple-clean, Gold Arrow palette ──── */}
      <DirectiveHero directive={directive} live={live} tick={tick} />

      {/* ─── Pulse strip ─────────────────────────────────────────── */}
      <div className="border-b border-gold/10 bg-navy/40">
        <div className="container mx-auto px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <PulseCard label="Universe" value={String(pulse.count)} sub="live-priced symbols" />
          <PulseCard label="Advancers" value={String(pulse.winners)} sub={`${pulse.losers} decliners`} tone="up" />
          <PulseCard
            label="Strongest 24h"
            value={pulse.strongest ? `${pulse.strongest.s.ticker} +${safeFixed(pulse.strongest.ch)}%` : '—'}
            sub={pulse.strongest ? fmtPrice(pulse.strongest.p) : ''}
            tone="up"
          />
          <PulseCard
            label="Weakest 24h"
            value={pulse.weakest ? `${pulse.weakest.s.ticker} ${safeFixed(pulse.weakest.ch)}%` : '—'}
            sub={pulse.weakest ? fmtPrice(pulse.weakest.p) : ''}
            tone="down"
          />
        </div>
      </div>

      {/* ─── Top-5 Conviction Board — clear next-action per asset ── */}
      {topFive.length > 0 && (
        <div className="border-b border-gold/10 bg-navy-dark/70">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-gold-light" />
                <span className="font-display text-[11px] tracking-[0.2em] text-gold-light uppercase">
                  Conviction Board · Top 5
                </span>
                <span className="text-[9px] font-mono text-marble/40">
                  fused P(Goal) · Score · Risk · MTF align · {rankDirection.toUpperCase()}
                </span>
              </div>
              <span className="text-[9px] font-mono text-marble/40">click any card to drill</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {topFive.map(({ r, v }) => (
                <ConvictionCard
                  key={r.ticker}
                  row={r}
                  verdict={v}
                  live={live.resolvePriceByTicker(r.ticker) || r.price}
                  change={live.resolveChangeByTicker(r.ticker)}
                  active={selected === r.ticker}
                  onClick={() => setSelected(r.ticker)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Main grid ───────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* LEFT — Ranker */}
        <section>
          <SymbolRanker
            getCandleData={live.getCandleData}
            resolvePrice={live.resolvePriceByTicker}
            onSelectSymbol={setSelected}
            onRowsChange={(rows, dir) => { setRankedRows(rows); setRankDirection(dir); }}
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
                      {ch > 0 ? '+' : ''}{safeFixed(ch)}%
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
                  {safeFixed(live.resolveChangeByTicker(selected))}%
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

// ─────────────────────────────────────────────────────────────
// Directive Hero — the single most important read on the page.
// Big verdict, giant conviction ring, orbital decision metrics.
// ─────────────────────────────────────────────────────────────
function DirectiveHero({
  directive,
  live,
  tick,
}: {
  directive: { r: PrecisionRow; v: ReturnType<typeof verdictFor> } | null;
  live: ReturnType<typeof useLiveMarketData>;
  tick: number;
}) {
  if (!directive) {
    return (
      <div className="border-b border-gold/10 bg-gradient-to-b from-navy-dark to-navy/60">
        <div className="container mx-auto px-4 py-10 text-center">
          <div className="text-[10px] tracking-[0.3em] font-mono text-gold-light uppercase">Building Directive</div>
          <div className="text-marble/40 text-xs mt-2">Warming up multi-timeframe scan & Monte-Carlo…</div>
        </div>
      </div>
    );
  }
  const { r, v } = directive;
  const livePrice = safeNumber(live.resolvePriceByTicker(r.ticker), 0) || safeNumber(r.price, 0);
  const change = safeNumber(live.resolveChangeByTicker(r.ticker), 0);
  void tick; // livePrice/change recomputed via parent tick prop

  const verdictWord =
    v.color === 'emerald' ? { headline: v.verdict, sub: 'Enter with confidence · low friction path' }
    : v.color === 'gold' ? { headline: v.verdict, sub: 'Actionable long — position within risk limits' }
    : v.color === 'sky' ? { headline: 'WATCH', sub: 'Setup building — wait for one more confirmation' }
    : v.color === 'orange' ? { headline: 'HOLD', sub: 'Wait for stronger alignment before acting' }
    : { headline: 'STAND ASIDE', sub: 'Risk too high — protect capital, do not open' };

  const verdictColor =
    v.color === 'emerald' ? 'text-emerald-400'
    : v.color === 'gold' ? 'text-gold'
    : v.color === 'sky' ? 'text-sky-300'
    : v.color === 'orange' ? 'text-orange-400'
    : 'text-red-400';

  const ringColor =
    v.color === 'emerald' ? '#34d399'
    : v.color === 'gold' ? '#d4af37'
    : v.color === 'sky' ? '#38bdf8'
    : v.color === 'orange' ? '#fb923c'
    : '#f87171';

  const R = 74;
  const C = 2 * Math.PI * R;
  const dash = C * (v.conviction / 100);

  const pGoal = r.monteCarlo.pGoal;
  const eRet = r.ai?.expectedReturnPct ?? r.monteCarlo.eReturnPct;
  const eDD = r.ai?.maxDrawdownPct ?? r.monteCarlo.eMaxDDPct;
  const risk = r.ai?.riskLabel ?? r.riskLabel;
  const score = r.ai?.adjustedScore ?? r.compositeScore;

  return (
    <div className="border-b border-gold/10 bg-gradient-to-b from-navy-dark via-navy/40 to-navy-dark relative overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gold/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gold/[0.04] blur-3xl" />

      <div className="container mx-auto px-4 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-6 items-stretch relative">
        {/* LEFT — headline */}
        <div className="flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              <span className="text-[9px] font-display tracking-[0.35em] text-gold uppercase">
                Eagle View Directive · Live
              </span>
            </div>
            <div className="flex items-end gap-3 flex-wrap">
              <h2 className="font-display text-4xl md:text-5xl tracking-tight text-marble">
                {r.ticker}
                <span className="text-marble/30 font-light"> · </span>
                <span className="text-marble/60 text-2xl md:text-3xl">{r.label}</span>
              </h2>
            </div>
            <div className="flex items-baseline gap-4 font-mono">
              <span className="text-2xl md:text-3xl text-marble tabular-nums">${fmtPrice(livePrice)}</span>
              <span className={change >= 0 ? 'text-emerald-400 text-sm' : 'text-red-400 text-sm'}>
                {change >= 0 ? '+' : ''}{safeFixed(change)}%
              </span>
              <span className="text-[10px] text-marble/40 uppercase tracking-widest">24h · live tick</span>
            </div>
            <p className={`text-lg md:text-xl leading-snug font-display tracking-tight ${verdictColor}`}>
              {verdictWord.headline}
              <span className="block text-marble/50 text-xs md:text-sm font-sans font-normal mt-1">
                {verdictWord.sub}
              </span>
            </p>
          </div>

          {/* Actionable rail */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to={`/trading-bridge?symbol=${encodeURIComponent(r.ticker)}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gold text-navy-dark text-[10px] font-display tracking-[0.2em] uppercase hover:bg-gold-light transition-colors"
            >
              Execute in Swap Terminal <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to={`/intelligence?symbol=${encodeURIComponent(r.ticker)}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gold/30 text-gold/90 text-[10px] font-display tracking-[0.2em] uppercase hover:border-gold/60"
            >
              Full Intelligence <Brain className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Reason chips — expose EVERY data point that produced the verdict */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px] font-mono">
            <MiniStat label="P(Goal)" value={safePct(pGoal)} tone="gold" />
            <MiniStat label="Score" value={`${safeFixed(score, 1)}/100`} tone="gold" />
            <MiniStat label="Risk" value={risk} tone={risk === 'LOW' ? 'up' : risk === 'EXTREME' ? 'down' : 'gold'} />
            <MiniStat label="MTF Align" value={`${safeFixed(safeNumber(r.mtfAlignment) * 100, 0)}`} tone={safeNumber(r.mtfAlignment) >= 0 ? 'up' : 'down'} />
            <MiniStat label="E[Ret %]" value={safeFixed(eRet)} tone="up" />
            <MiniStat label="E[DD %]" value={safeFixed(eDD)} tone="down" />
            <MiniStat label="Regime" value={r.regime.toUpperCase()} tone="gold" />
            <MiniStat label="Setup" value={r.setup} tone="gold" />
          </div>
        </div>

        {/* RIGHT — conviction ring */}
        <div className="flex items-center justify-center">
          <div className="relative w-[240px] h-[240px] md:w-[280px] md:h-[280px]">
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
              <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="8" />
              <circle
                cx="100" cy="100" r={R} fill="none"
                stroke={ringColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${dash} ${C}`}
                style={{ filter: `drop-shadow(0 0 8px ${ringColor}66)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[9px] font-display tracking-[0.35em] text-gold-light uppercase">Conviction</span>
              <span className="text-5xl md:text-6xl font-mono text-marble tabular-nums leading-none mt-1">
                {safeFixed(v.conviction, 0)}
                <span className="text-marble/40 text-2xl">%</span>
              </span>
              <span className={`mt-2 px-3 py-1 rounded-full border text-[10px] font-display tracking-[0.25em] uppercase
                ${v.color === 'emerald' ? 'border-emerald-400/50 text-emerald-400 bg-emerald-500/10'
                 : v.color === 'gold' ? 'border-gold/60 text-gold bg-gold/10'
                 : v.color === 'sky' ? 'border-sky-400/50 text-sky-300 bg-sky-500/10'
                 : v.color === 'orange' ? 'border-orange-400/50 text-orange-400 bg-orange-500/10'
                 : 'border-red-500/50 text-red-400 bg-red-500/10'}`}>
                {v.verdict}
              </span>
              <div className="mt-2 text-[8px] font-mono text-marble/40 text-center max-w-[180px] leading-relaxed">
                {v.reasons.join(' · ')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: 'up' | 'down' | 'gold' }) {
  const col = tone === 'up' ? 'text-emerald-400' : tone === 'down' ? 'text-red-400' : 'text-gold-light';
  return (
    <div className="rounded-md border border-gold/15 bg-navy-dark/70 px-2.5 py-1.5">
      <div className="text-[7px] uppercase tracking-[0.2em] text-marble/40">{label}</div>
      <div className={`${col} text-xs mt-0.5 truncate`}>{value}</div>
    </div>
  );
}

function ConvictionCard({
  row, verdict, live, change, active, onClick,
}: {
  row: PrecisionRow;
  verdict: ReturnType<typeof verdictFor>;
  live: number;
  change: number;
  active: boolean;
  onClick: () => void;
}) {
  const safeLive = safeNumber(live, 0);
  const safeChange = safeNumber(change, 0);
  const pillCls =
    verdict.color === 'emerald' ? 'text-emerald-400 border-emerald-400/40 bg-emerald-500/10'
    : verdict.color === 'gold' ? 'text-gold border-gold/50 bg-gold/10'
    : verdict.color === 'sky' ? 'text-sky-300 border-sky-400/40 bg-sky-500/10'
    : verdict.color === 'orange' ? 'text-orange-400 border-orange-400/40 bg-orange-500/10'
    : 'text-red-400 border-red-500/40 bg-red-500/10';
  const bar =
    verdict.color === 'emerald' ? 'bg-emerald-400'
    : verdict.color === 'gold' ? 'bg-gold'
    : verdict.color === 'sky' ? 'bg-sky-400'
    : verdict.color === 'orange' ? 'bg-orange-400'
    : 'bg-red-500';
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-lg border p-3 bg-navy-dark/70 transition-colors ${active ? 'border-gold/60 bg-gold/[0.06]' : 'border-gold/15 hover:border-gold/40'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-gold-light font-mono text-[11px]">{row.ticker}</div>
          <div className="text-[8px] font-mono text-marble/40 truncate max-w-[110px]">{row.label}</div>
        </div>
        <span className={`px-1.5 py-[1px] rounded-full border text-[8px] tracking-widest font-semibold ${pillCls}`}>
          {verdict.verdict}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2 font-mono">
        <span className="text-sm text-marble tabular-nums">${fmtPrice(safeLive)}</span>
        <span className={`text-[9px] ${safeChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {safeChange >= 0 ? '+' : ''}{safeFixed(safeChange)}%
        </span>
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between text-[8px] font-mono text-marble/50 mb-0.5">
          <span>CONVICTION</span><span>{safeFixed(verdict.conviction, 0)}%</span>
        </div>
        <div className="h-1 w-full bg-navy rounded-full overflow-hidden">
          <div className={`h-full ${bar}`} style={{ width: `${Math.max(3, verdict.conviction)}%` }} />
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-[8px] font-mono text-marble/60">
        <div><span className="text-marble/35">P</span> {safePct(row.monteCarlo.pGoal, 0)}</div>
        <div><span className="text-marble/35">R</span> {(row.ai?.riskLabel ?? row.riskLabel).slice(0,3)}</div>
        <div><span className="text-marble/35">S</span> {safeFixed(row.ai?.adjustedScore ?? row.compositeScore, 0)}</div>
      </div>
    </button>
  );
}
function fmtPrice(p: number) {
  if (!Number.isFinite(p) || p <= 0) return '—';
  if (p < 1) return p.toFixed(4);
  if (p < 100) return p.toFixed(3);
  return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
}