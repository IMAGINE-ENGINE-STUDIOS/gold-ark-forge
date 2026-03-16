import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GAMultiTicker from '@/components/ga-widgets/GAMultiTicker';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useWebSocketPrices } from '@/hooks/useWebSocketPrices';
import { WATCHLIST_CATEGORIES, ALL_SYMBOLS, SYNTHETIC_PRICES, CATEGORY_COLORS, type WatchlistSymbol } from '@/data/tradingSymbols';
import {
  Gem, Flame, Coins, Zap, Globe, Cpu, Building2, DollarSign, Landmark,
  TrendingUp, TrendingDown, Search, ArrowUpRight, ChevronRight, Shield, Activity,
  BarChart3, Eye, Star,
} from 'lucide-react';

// ─── Category Config ─────────────────────────────────────
interface MarketCat {
  key: string;
  label: string;
  icon: React.ElementType;
  cats: string[];  // maps to tradingSymbols `cat` field
  watchlistLabels?: string[]; // for fine-grained watchlist label matching
}

const CATEGORIES: MarketCat[] = [
  { key: 'all', label: 'ALL ASSETS', icon: BarChart3, cats: [] },
  { key: 'metals', label: 'PRECIOUS METALS', icon: Gem, cats: ['metals'] },
  { key: 'crypto', label: 'CRYPTO', icon: Coins, cats: ['crypto'] },
  { key: 'energy', label: 'ENERGY', icon: Flame, cats: ['energy'] },
  { key: 'equities', label: 'EQUITIES', icon: Globe, cats: ['stocks'] },
  { key: 'forex', label: 'FOREX', icon: DollarSign, cats: ['forex'] },
  { key: 'bonds', label: 'FIXED INCOME', icon: Landmark, cats: ['bonds'] },
];

const CAT_ACCENT: Record<string, string> = {
  metals: 'hsl(43, 72%, 50%)',
  crypto: 'hsl(38, 92%, 50%)',
  energy: 'hsl(25, 95%, 53%)',
  stocks: 'hsl(217, 91%, 60%)',
  forex: 'hsl(170, 70%, 50%)',
  bonds: 'hsl(210, 6%, 67%)',
};

// All crypto keys for WS
const CRYPTO_KEYS = ALL_SYMBOLS.filter(s => s.cat === 'crypto').map(s => s.key);

// ─── Format Helpers ──────────────────────────────────────
const fmtPrice = (p: number) => {
  if (p === 0) return '—';
  if (p >= 1000) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(p);
  if (p < 0.01) return `$${p.toFixed(6)}`;
  return `$${p.toFixed(p < 10 ? 4 : 2)}`;
};

const fmtChange = (c: number) => `${c >= 0 ? '+' : ''}${c.toFixed(2)}%`;

// ─── Animated Price Flash ────────────────────────────────
const PriceFlash = ({ price, change, isLive }: { price: number; change: number; isLive: boolean }) => {
  const prevPrice = useRef(price);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (price !== prevPrice.current) {
      setFlash(price > prevPrice.current ? 'up' : 'down');
      prevPrice.current = price;
      const t = setTimeout(() => setFlash(null), 600);
      return () => clearTimeout(t);
    }
  }, [price]);

  return (
    <div className="text-right">
      <div className={`font-mono text-xl md:text-2xl font-bold tracking-tight transition-colors duration-300 ${
        flash === 'up' ? 'text-emerald-400' : flash === 'down' ? 'text-red-400' : 'text-marble'
      }`}>
        {fmtPrice(price)}
      </div>
      <div className={`text-sm font-mono flex items-center justify-end gap-1 mt-0.5 ${
        change >= 0 ? 'text-emerald-400' : 'text-red-400'
      }`}>
        {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {fmtChange(change)}
        {isLive && (
          <span className="ml-1.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400/80 font-display tracking-widest">LIVE</span>
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Sparkline Mini Bar ──────────────────────────────────
const SparkBar = ({ change, accent }: { change: number; accent: string }) => {
  const width = Math.min(100, Math.max(8, 50 + Math.abs(change) * 8));
  return (
    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'hsla(213,32%,16%,0.6)' }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${width}%`,
          background: change >= 0
            ? 'linear-gradient(90deg, hsla(160,84%,39%,0.4), hsla(160,84%,39%,0.8))'
            : 'linear-gradient(90deg, hsla(0,84%,60%,0.4), hsla(0,84%,60%,0.8))',
        }}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// ASSET ROW — the primary display unit
// ═══════════════════════════════════════════════════════════
const AssetRow = ({ symbol, price, change, isLive, rank }: {
  symbol: WatchlistSymbol;
  price: number;
  change: number;
  isLive: boolean;
  rank: number;
}) => {
  const navigate = useNavigate();
  const accent = CAT_ACCENT[symbol.cat] || 'hsl(43,72%,50%)';

  return (
    <button
      onClick={() => navigate(`/trading-bridge?symbol=${symbol.key}`)}
      className="w-full group"
    >
      <div className="flex items-center gap-3 md:gap-5 px-4 md:px-6 py-4 md:py-5 rounded-sm border border-transparent hover:border-gold/25 bg-transparent hover:bg-navy-light/30 transition-all duration-300 relative">
        {/* Rank */}
        <span className="text-marble/20 font-mono text-xs w-6 text-right flex-shrink-0">{rank}</span>

        {/* Category dot */}
        <div className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-1 ring-offset-navy" style={{ background: accent, boxShadow: `0 0 12px ${accent}40` }} />

        {/* Symbol Info */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="font-display text-base md:text-lg text-marble tracking-wide group-hover:text-gold transition-colors">
              {symbol.label}
            </span>
            <span className="text-[10px] md:text-xs font-mono text-marble/30 tracking-widest">{symbol.ticker}</span>
          </div>
          <div className="mt-1.5 max-w-[200px]">
            <SparkBar change={change} accent={accent} />
          </div>
        </div>

        {/* Price + Change */}
        <PriceFlash price={price} change={change} isLive={isLive} />

        {/* Arrow */}
        <ArrowUpRight size={18} className="text-marble/15 group-hover:text-gold/70 transition-colors flex-shrink-0 ml-2" />
      </div>
    </button>
  );
};

// ═══════════════════════════════════════════════════════════
// FEATURED HERO CARDS (top 6 movers)
// ═══════════════════════════════════════════════════════════
const HeroCard = ({ symbol, price, change, isLive }: {
  symbol: WatchlistSymbol;
  price: number;
  change: number;
  isLive: boolean;
}) => {
  const navigate = useNavigate();
  const accent = CAT_ACCENT[symbol.cat] || 'hsl(43,72%,50%)';

  return (
    <button
      onClick={() => navigate(`/trading-bridge?symbol=${symbol.key}`)}
      className="group relative overflow-hidden rounded-sm border border-gold/15 hover:border-gold/40 transition-all duration-500 bg-navy-light/20 hover:bg-navy-light/40 p-5 md:p-6 text-left"
    >
      {/* Glow accent */}
      <div className="absolute top-0 left-0 w-full h-1 opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      {/* Ornate corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold/30 rounded-tl-sm" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold/30 rounded-br-sm" />

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
            <span className="text-xs font-mono text-marble/40 tracking-widest">{symbol.ticker}</span>
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          </div>
          <h3 className="font-display text-xl md:text-2xl text-marble group-hover:text-gold transition-colors tracking-wide">
            {symbol.label}
          </h3>
        </div>
        <ArrowUpRight size={20} className="text-marble/15 group-hover:text-gold/60 transition-colors mt-1" />
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-2xl md:text-3xl font-bold text-marble tracking-tight">
            {fmtPrice(price)}
          </div>
          <div className={`text-sm font-mono mt-1 flex items-center gap-1.5 ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {fmtChange(change)}
          </div>
        </div>
        <SparkBar change={change} accent={accent} />
      </div>
    </button>
  );
};

// ═══════════════════════════════════════════════════════════
// MARKETPLACE
// ═══════════════════════════════════════════════════════════
const Marketplace = () => {
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');

  const { data: metalPrices } = useMetalPrices();
  const wsPrices = useWebSocketPrices(CRYPTO_KEYS);

  // Resolve price for any symbol
  const resolvePrice = (sym: WatchlistSymbol) => {
    if (wsPrices[sym.key]) {
      return { price: wsPrices[sym.key].price, change: wsPrices[sym.key].change24h, isLive: true };
    }
    if (sym.cat === 'metals' && metalPrices) {
      const mp = metalPrices[sym.key as keyof typeof metalPrices];
      if (mp) return { price: Number(mp.price_usd), change: Number(mp.change_24h || 0), isLive: true };
    }
    const synth = SYNTHETIC_PRICES[sym.key];
    if (synth) return { price: synth.p, change: synth.c, isLive: false };
    return { price: 0, change: 0, isLive: false };
  };

  // Filter
  const cat = CATEGORIES.find(c => c.key === activeCat) || CATEGORIES[0];
  const filtered = useMemo(() => {
    let syms = ALL_SYMBOLS;
    if (activeCat !== 'all') {
      syms = syms.filter(s => cat.cats.includes(s.cat));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      syms = syms.filter(s =>
        s.label.toLowerCase().includes(q) ||
        s.ticker.toLowerCase().includes(q) ||
        s.key.toLowerCase().includes(q)
      );
    }
    return syms;
  }, [activeCat, search, cat]);

  // Top movers: sort by absolute change, take top 6
  const topMovers = useMemo(() => {
    const withPrices = ALL_SYMBOLS.map(s => ({ sym: s, ...resolvePrice(s) })).filter(x => x.price > 0);
    return withPrices.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsPrices, metalPrices]);

  // Stats
  const liveCount = ALL_SYMBOLS.filter(s => {
    if (wsPrices[s.key]) return true;
    if (s.cat === 'metals' && metalPrices?.[s.key as keyof typeof metalPrices]) return true;
    return false;
  }).length;

  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <GAMultiTicker />

      {/* ═══════════════════════════════════════════════════ */}
      {/* HERO SECTION                                       */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-gold/8 via-gold/2 to-transparent" />
        </div>

        <div className="container mx-auto px-4 pt-16 pb-10 relative z-10">
          {/* Ornate top line */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-gold/50" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold/60" />
              <span className="font-display text-[11px] tracking-[0.3em] text-gold/50">GOLD ARROW EXCHANGE</span>
              <Shield className="w-4 h-4 text-gold/60" />
            </div>
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-gold/50" />
          </div>

          {/* Title */}
          <h1 className="text-center font-display text-5xl md:text-7xl lg:text-8xl tracking-[0.08em] mb-4"
            style={{
              background: 'linear-gradient(180deg, hsl(43,76%,62%) 0%, hsl(43,72%,50%) 40%, hsl(40,68%,38%) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            ASSET MARKETPLACE
          </h1>

          {/* Subtitle */}
          <p className="text-center text-marble/50 text-base md:text-lg font-light max-w-xl mx-auto mb-3 leading-relaxed">
            Institutional-grade access to {ALL_SYMBOLS.length}+ instruments across global markets
          </p>

          {/* Live stats strip */}
          <div className="flex items-center justify-center gap-6 md:gap-10 text-marble/40 text-xs font-mono mb-10">
            <span className="flex items-center gap-1.5">
              <Activity size={12} className="text-emerald-400" />
              <span className="text-emerald-400 font-semibold">{liveCount}</span> live feeds
            </span>
            <span className="flex items-center gap-1.5">
              <Eye size={12} />
              {ALL_SYMBOLS.length} instruments
            </span>
            <span className="flex items-center gap-1.5">
              <Star size={12} />
              {CATEGORIES.length - 1} asset classes
            </span>
          </div>

          {/* TOP MOVERS */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-gold/15" />
              <span className="font-display text-sm tracking-[0.25em] text-gold/70">TOP MOVERS</span>
              <div className="h-px flex-1 bg-gold/15" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topMovers.map(({ sym, price, change, isLive }) => (
                <HeroCard key={sym.key} symbol={sym} price={price} change={change} isLive={isLive} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* MAIN CONTENT                                       */}
      {/* ═══════════════════════════════════════════════════ */}
      <main className="container mx-auto px-4 pb-20">
        {/* Greek border line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent mb-10" />

        {/* Search + Category Bar */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-10">
          {/* Search */}
          <div className="relative flex-shrink-0 w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marble/30" />
            <input
              type="text"
              placeholder="Search asset, ticker, symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-5 py-3.5 rounded-sm bg-navy-light/40 border border-gold/15 text-marble text-sm font-mono placeholder:text-marble/25 focus:outline-none focus:border-gold/40 focus:bg-navy-light/60 transition-all"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 items-center">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const isActive = activeCat === c.key;
              const count = c.key === 'all' ? ALL_SYMBOLS.length : ALL_SYMBOLS.filter(s => c.cats.includes(s.cat)).length;
              return (
                <button
                  key={c.key}
                  onClick={() => { setActiveCat(c.key); setSearch(''); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-sm font-display text-xs tracking-[0.15em] transition-all duration-300 border ${
                    isActive
                      ? 'bg-gold/90 text-navy border-gold shadow-[0_0_20px_-5px_hsla(43,72%,50%,0.4)]'
                      : 'bg-transparent text-marble/60 border-gold/10 hover:border-gold/25 hover:text-marble/90'
                  }`}
                >
                  <Icon size={14} />
                  {c.label}
                  <span className={`text-[9px] font-mono ${isActive ? 'text-navy/60' : 'text-marble/25'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Asset Table ─── */}
        {filtered.length > 0 ? (
          <div>
            {/* Table header */}
            <div className="flex items-center gap-3 md:gap-5 px-4 md:px-6 py-3 mb-2 text-[10px] md:text-xs font-display tracking-[0.2em] text-marble/25 border-b border-gold/10">
              <span className="w-6 text-right">#</span>
              <span className="w-3" />
              <span className="flex-1">INSTRUMENT</span>
              <span className="text-right w-48">PRICE / CHANGE</span>
              <span className="w-[18px]" />
              <span className="w-2" />
            </div>

            {/* Group by watchlist category */}
            {activeCat === 'all' ? (
              WATCHLIST_CATEGORIES.map(wc => {
                const catSyms = filtered.filter(s => {
                  // Find this symbol's watchlist category
                  return wc.items.some(item => item.key === s.key);
                });
                if (catSyms.length === 0) return null;
                const catColor = CATEGORY_COLORS[catSyms[0]?.cat] || 'hsl(43,72%,50%)';

                return (
                  <div key={wc.label} className="mb-8">
                    {/* Category header */}
                    <div className="flex items-center gap-3 mb-3 px-4 md:px-6">
                      <div className="w-3 h-3 rounded-full" style={{ background: catColor, boxShadow: `0 0 10px ${catColor}30` }} />
                      <span className="font-display text-xs tracking-[0.25em] text-marble/40">{wc.label}</span>
                      <div className="h-px flex-1 bg-gold/8" />
                      <span className="text-[10px] font-mono text-marble/20">{catSyms.length}</span>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-gold/5">
                      {catSyms.map((sym, i) => {
                        const { price, change, isLive } = resolvePrice(sym);
                        if (price === 0) return null;
                        return <AssetRow key={sym.key} symbol={sym} price={price} change={change} isLive={isLive} rank={i + 1} />;
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="divide-y divide-gold/5">
                {filtered.map((sym, i) => {
                  const { price, change, isLive } = resolvePrice(sym);
                  if (price === 0) return null;
                  return <AssetRow key={sym.key} symbol={sym} price={price} change={change} isLive={isLive} rank={i + 1} />;
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border border-gold/15 mb-6">
              <Search size={28} className="text-marble/20" />
            </div>
            <h3 className="font-display text-2xl text-marble/50 mb-2 tracking-wider">NO ASSETS FOUND</h3>
            <p className="text-marble/30 text-sm">Try a different search term or select another category.</p>
          </div>
        )}

        {/* Bottom ornament */}
        <div className="flex items-center justify-center gap-4 mt-16">
          <div className="h-px w-20 bg-gradient-to-r from-transparent to-gold/30" />
          <Gem size={14} className="text-gold/30" />
          <div className="h-px w-20 bg-gradient-to-l from-transparent to-gold/30" />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Marketplace;
