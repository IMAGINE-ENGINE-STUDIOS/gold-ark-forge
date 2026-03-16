import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GAMultiTicker from '@/components/ga-widgets/GAMultiTicker';
import { useCertificates, MetalType, CertificateWithPartner } from '@/hooks/useCertificates';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useWebSocketPrices } from '@/hooks/useWebSocketPrices';
import { WATCHLIST_CATEGORIES, ALL_SYMBOLS, SYNTHETIC_PRICES, REAL_FEED_SYMBOLS, CATEGORY_COLORS, type WatchlistSymbol } from '@/data/tradingSymbols';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield, ArrowUpRight, Filter, Gem, Flame, Wheat, Landmark, Beef, Building2,
  PaintbrushVertical, Warehouse, TrendingUp, TrendingDown, BarChart3, Cpu, Globe,
  DollarSign, Coins, Zap, Search,
} from 'lucide-react';

// ─── Marketplace Category Mapping ────────────────────────
interface MarketCategory {
  key: string;
  label: string;
  icon: React.ElementType;
  swapCategories: string[];  // maps to tradingSymbols cat values
  description: string;
}

const MARKET_CATEGORIES: MarketCategory[] = [
  { key: 'all', label: 'All Assets', icon: BarChart3, swapCategories: [], description: '' },
  { key: 'precious-metals', label: 'Precious Metals', icon: Gem, swapCategories: ['metals'], description: 'Gold, Silver, Platinum & Palladium — live spot prices' },
  { key: 'crypto-major', label: 'Crypto Major', icon: Coins, swapCategories: ['crypto-major'], description: 'Bitcoin, Ethereum & top-cap digital assets — live WebSocket feeds' },
  { key: 'crypto-alt', label: 'Crypto Alt', icon: Zap, swapCategories: ['crypto-alt'], description: 'High-growth altcoins & DeFi tokens — live Binance streams' },
  { key: 'energy', label: 'Energy', icon: Flame, swapCategories: ['energy'], description: 'Crude oil, natural gas, uranium & power commodities' },
  { key: 'oil-gas', label: 'Oil & Gas', icon: Flame, swapCategories: ['stocks-og'], description: 'Major energy producers & service companies' },
  { key: 'indices', label: 'Indices & Mega', icon: Globe, swapCategories: ['stocks-idx'], description: 'S&P 500, Nasdaq, Dow & mega-cap equities' },
  { key: 'tech', label: 'Tech & Growth', icon: Cpu, swapCategories: ['stocks-tech'], description: 'FAANG, semiconductors & high-growth tech' },
  { key: 'financials', label: 'Financials', icon: Building2, swapCategories: ['stocks-fin'], description: 'Banks, asset managers & mining companies' },
  { key: 'forex', label: 'Forex', icon: DollarSign, swapCategories: ['forex'], description: 'Major & emerging market currency pairs' },
  { key: 'bonds', label: 'Bonds', icon: Landmark, swapCategories: ['bonds'], description: 'Treasury, corporate & municipal fixed-income ETFs' },
];

// Map WATCHLIST_CATEGORIES labels to our marketplace subcategory
function getMarketSubCat(watchlistLabel: string): string {
  const map: Record<string, string> = {
    'PRECIOUS METALS': 'metals',
    'CRYPTO — MAJOR': 'crypto-major',
    'CRYPTO — ALT': 'crypto-alt',
    'ENERGY COMMODITIES': 'energy',
    'OIL & GAS COMPANIES': 'stocks-og',
    'US INDICES & MEGA CAP': 'stocks-idx',
    'TECH & GROWTH': 'stocks-tech',
    'FINANCIALS & MINING': 'stocks-fin',
    'FOREX — MAJOR': 'forex',
    'BONDS & FIXED INCOME': 'bonds',
  };
  return map[watchlistLabel] || 'other';
}

// Build enriched symbol list with subcategory
interface EnrichedSymbol extends WatchlistSymbol {
  subCat: string;
  watchlistLabel: string;
}

const ENRICHED_SYMBOLS: EnrichedSymbol[] = WATCHLIST_CATEGORIES.flatMap(wc =>
  wc.items.map(item => ({
    ...item,
    subCat: getMarketSubCat(wc.label),
    watchlistLabel: wc.label,
  }))
);

// Crypto keys for WebSocket
const CRYPTO_KEYS = ALL_SYMBOLS.filter(s => s.cat === 'crypto').map(s => s.key);

// Category styling
const CAT_STYLES: Record<string, { gradient: string; tag: string; text: string }> = {
  metals:       { gradient: 'from-gold/20 to-gold/5 border-gold/30', tag: 'bg-gold/20 text-gold', text: 'text-gold' },
  'crypto-major': { gradient: 'from-amber-500/20 to-amber-500/5 border-amber-500/30', tag: 'bg-amber-500/20 text-amber-400', text: 'text-amber-400' },
  'crypto-alt': { gradient: 'from-orange-500/20 to-orange-500/5 border-orange-500/30', tag: 'bg-orange-500/20 text-orange-300', text: 'text-orange-300' },
  energy:       { gradient: 'from-amber-600/20 to-amber-600/5 border-amber-600/30', tag: 'bg-amber-600/20 text-amber-400', text: 'text-amber-400' },
  'stocks-og':  { gradient: 'from-sky-500/20 to-sky-500/5 border-sky-500/30', tag: 'bg-sky-500/20 text-sky-300', text: 'text-sky-300' },
  'stocks-idx': { gradient: 'from-blue-500/20 to-blue-500/5 border-blue-500/30', tag: 'bg-blue-500/20 text-blue-300', text: 'text-blue-300' },
  'stocks-tech': { gradient: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/30', tag: 'bg-indigo-500/20 text-indigo-300', text: 'text-indigo-300' },
  'stocks-fin': { gradient: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30', tag: 'bg-emerald-500/20 text-emerald-300', text: 'text-emerald-300' },
  forex:        { gradient: 'from-teal-500/20 to-teal-500/5 border-teal-500/30', tag: 'bg-teal-500/20 text-teal-300', text: 'text-teal-300' },
  bonds:        { gradient: 'from-slate-400/20 to-slate-400/5 border-slate-400/30', tag: 'bg-slate-400/20 text-slate-300', text: 'text-slate-300' },
};

const getStyle = (subCat: string) => CAT_STYLES[subCat] || CAT_STYLES.metals;

// ─── Metal Certificate Card ─────────────────────────────
const metalColors: Record<string, string> = {
  gold: 'from-gold/20 to-gold/5 border-gold/30',
  silver: 'from-silver/20 to-silver/5 border-silver/30',
  platinum: 'from-platinum/20 to-platinum/5 border-platinum/30',
};
const metalTextColors: Record<string, string> = {
  gold: 'text-gold', silver: 'text-silver', platinum: 'text-platinum',
};
const statusColors: Record<string, string> = {
  active: 'text-emerald-400 border-emerald-400/50',
  frozen: 'text-sky-400 border-sky-400/50',
  revoked: 'text-red-400 border-red-400/50',
  redeemed: 'text-muted-foreground border-muted',
};

const CertificateCard = ({ cert, prices }: { cert: CertificateWithPartner; prices: any }) => {
  const metal = (cert.metadata_json as any)?.metal_type || 'gold';
  const weight = Number((cert.metadata_json as any)?.weight_oz) || 0;
  const serial = (cert.metadata_json as any)?.serial_number || '—';
  const fineness = Number((cert.metadata_json as any)?.fineness) || 0;
  const spotPrice = prices?.[metal]?.price_usd ? Number(prices[metal].price_usd) : null;
  const fmtPrice = (p: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(p);

  return (
    <Card className={`bg-gradient-to-br ${metalColors[metal] || metalColors.gold} border hover:border-gold/50 transition-all group relative overflow-hidden`}>
      {/* Ornate corner accents */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-gold/40 rounded-tl" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-gold/40 rounded-tr" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-gold/40 rounded-bl" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-gold/40 rounded-br" />
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <Badge variant="outline" className={`${metalTextColors[metal] || 'text-gold'} border-current mb-1.5 text-[10px]`}>
              {metal.toUpperCase()} · CERTIFICATE
            </Badge>
            <h3 className="font-display text-lg text-marble">{weight} oz Bar</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={`text-[10px] ${statusColors[cert.status] || ''}`}>{cert.status}</Badge>
            <Shield className="text-emerald-400" size={14} />
          </div>
        </div>
        <div className="space-y-1.5 text-xs text-marble/50 mb-3">
          <div className="flex justify-between"><span>Partner:</span><span className="text-marble/80 font-medium">{cert.partners.legal_name}</span></div>
          <div className="flex justify-between"><span>Serial:</span><span className="font-mono text-marble/70">{serial}</span></div>
          <div className="flex justify-between"><span>Fineness:</span><span className="text-marble/70">{(fineness * 100).toFixed(2)}%</span></div>
        </div>
        {spotPrice && weight > 0 && (
          <div className="border-t border-gold/20 pt-3 mb-3">
            <div className="flex justify-between items-end">
              <span className="text-marble/40 text-xs">Est. Value:</span>
              <span className="text-gold font-display text-lg">{fmtPrice(weight * spotPrice)}</span>
            </div>
          </div>
        )}
        <Link to={`/marketplace/certificate/${cert.cert_id}`}
          className="block text-center bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold py-2.5 text-xs font-display tracking-wider rounded transition-all group-hover:border-gold/50">
          View Certificate <ArrowUpRight size={12} className="inline ml-1" />
        </Link>
      </CardContent>
    </Card>
  );
};

// ─── Live Asset Card ─────────────────────────────────────
const AssetCard = ({ symbol, livePrice, liveChange, isLive }: {
  symbol: EnrichedSymbol;
  livePrice: number;
  liveChange: number;
  isLive: boolean;
}) => {
  const navigate = useNavigate();
  const style = getStyle(symbol.subCat);

  const fmtPrice = (p: number) => {
    if (p >= 1000) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(p);
    if (p < 0.01) return `$${p.toFixed(6)}`;
    return `$${p.toFixed(p < 10 ? 4 : 2)}`;
  };

  return (
    <Card
      className={`bg-gradient-to-br ${style.gradient} border hover:border-opacity-70 transition-all group cursor-pointer relative overflow-hidden`}
      onClick={() => navigate(`/trading-bridge?symbol=${symbol.key}`)}
    >
      {/* Ornate corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/20" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/20" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold/20" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/20" />
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Badge variant="outline" className={`${style.tag} border-current text-[9px] font-mono`}>
                {symbol.ticker}
              </Badge>
              {isLive && (
                <span className="flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[7px] text-emerald-400/70 font-mono">LIVE</span>
                </span>
              )}
              {!isLive && (
                <span className="text-[7px] text-marble/30 font-mono">DELAYED</span>
              )}
            </div>
            <h3 className="font-display text-sm text-marble truncate">{symbol.label}</h3>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-marble font-mono text-sm font-semibold">{fmtPrice(livePrice)}</div>
            <div className={`text-[11px] font-mono flex items-center justify-end gap-0.5 ${liveChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {liveChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {liveChange >= 0 ? '+' : ''}{liveChange.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Mini sparkline bar representing change direction */}
        <div className="h-1 rounded-full bg-navy-dark/60 overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${liveChange >= 0 ? 'bg-emerald-400/60' : 'bg-red-400/60'}`}
            style={{ width: `${Math.min(100, Math.max(10, 50 + liveChange * 10))}%` }}
          />
        </div>

        <button className={`w-full text-center border py-2 text-[10px] font-display tracking-[0.15em] rounded transition-all ${style.tag} border-current/30 hover:opacity-80 group-hover:border-current/60`}>
          TRADE ON SWAP <ArrowUpRight size={10} className="inline ml-1" />
        </button>
      </CardContent>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
const Marketplace = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedMetal, setSelectedMetal] = useState<MetalType | undefined>(undefined);
  const [search, setSearch] = useState('');
  const { data: certs, isLoading } = useCertificates({ metalType: selectedMetal });
  const { data: metalPrices } = useMetalPrices();

  // Live crypto prices via WebSocket
  const wsPrices = useWebSocketPrices(CRYPTO_KEYS);

  // Resolve live price for any symbol
  const resolvePrice = (sym: EnrichedSymbol): { price: number; change: number; isLive: boolean } => {
    // WebSocket live crypto
    if (wsPrices[sym.key]) {
      return { price: wsPrices[sym.key].price, change: wsPrices[sym.key].change24h, isLive: true };
    }
    // Metal prices from API
    if (sym.cat === 'metals' && metalPrices) {
      const mp = metalPrices[sym.key as keyof typeof metalPrices];
      if (mp) return { price: Number(mp.price_usd), change: Number(mp.change_24h || 0), isLive: true };
    }
    // Synthetic fallback
    const synth = SYNTHETIC_PRICES[sym.key];
    if (synth) return { price: synth.p, change: synth.c, isLive: false };
    return { price: 0, change: 0, isLive: false };
  };

  // Filter symbols by active category
  const activeCat = MARKET_CATEGORIES.find(c => c.key === activeCategory) || MARKET_CATEGORIES[0];
  const showCertificates = activeCategory === 'all' || activeCategory === 'precious-metals';

  const filteredSymbols = useMemo(() => {
    let syms = ENRICHED_SYMBOLS;
    if (activeCategory !== 'all') {
      const cats = activeCat.swapCategories;
      syms = syms.filter(s => cats.includes(s.subCat));
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
  }, [activeCategory, search, activeCat]);

  // Category counts
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const mc of MARKET_CATEGORIES) {
      if (mc.key === 'all') {
        counts[mc.key] = ENRICHED_SYMBOLS.length + (certs?.length || 0);
      } else if (mc.key === 'precious-metals') {
        const metalSyms = ENRICHED_SYMBOLS.filter(s => mc.swapCategories.includes(s.subCat));
        counts[mc.key] = metalSyms.length + (certs?.length || 0);
      } else {
        counts[mc.key] = ENRICHED_SYMBOLS.filter(s => mc.swapCategories.includes(s.subCat)).length;
      }
    }
    return counts;
  }, [certs]);

  const metals: { type: MetalType; label: string }[] = [
    { type: 'gold', label: 'Gold' },
    { type: 'silver', label: 'Silver' },
    { type: 'platinum', label: 'Platinum' },
  ];
  const fmtSpot = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);

  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <GAMultiTicker />
      <main className="container mx-auto px-4 py-12">
        {/* ─── Roman PAX Header ─── */}
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 bg-gradient-radial from-gold/5 to-transparent pointer-events-none" />
          <div className="h-px w-40 mx-auto bg-gradient-to-r from-transparent via-gold/60 to-transparent mb-4" />
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-16 bg-gold/30" />
            <Gem className="text-gold w-5 h-5" />
            <div className="h-px w-16 bg-gold/30" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold mb-4 tracking-wide">
            ASSET MARKETPLACE
          </h1>
          <p className="text-marble/50 max-w-2xl mx-auto text-sm md:text-base font-light">
            {ENRICHED_SYMBOLS.length}+ instruments across {MARKET_CATEGORIES.length - 1} asset classes.
            Live data from WebSocket feeds, institutional APIs & proprietary analytics.
          </p>
          <div className="h-px w-40 mx-auto bg-gradient-to-r from-transparent via-gold/60 to-transparent mt-4" />
        </div>

        {/* ─── Search Bar ─── */}
        <div className="max-w-md mx-auto mb-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-marble/30" />
          <input
            type="text"
            placeholder="Search assets, tickers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-navy-light/60 border border-gold/15 text-marble text-sm font-mono placeholder:text-marble/25 focus:outline-none focus:border-gold/40 transition-colors"
          />
        </div>

        {/* ─── Category Tabs ─── */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {MARKET_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => { setActiveCategory(cat.key); setSelectedMetal(undefined); setSearch(''); }}
                className={`px-3 md:px-4 py-2 rounded font-display text-[10px] md:text-xs tracking-wider transition-all flex items-center gap-1.5 border ${
                  activeCategory === cat.key
                    ? 'bg-gold/90 text-navy border-gold'
                    : 'bg-navy-light/30 text-marble/70 hover:bg-navy-light/60 border-gold/15 hover:border-gold/30'
                }`}
              >
                <Icon size={12} />
                {cat.label}
                <span className="text-[8px] opacity-60">({catCounts[cat.key] || 0})</span>
              </button>
            );
          })}
        </div>

        {/* ─── Active Category Description ─── */}
        {activeCat.description && (
          <div className="text-center mb-8 py-3 px-6 rounded border border-gold/15 bg-navy-light/20">
            <p className="text-sm text-gold/80">{activeCat.description}</p>
          </div>
        )}

        {/* ─── Precious Metals Certificates Section ─── */}
        {showCertificates && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {metals.map(({ type, label }) => (
                <div key={type} className={`p-4 rounded-lg bg-gradient-to-br ${metalColors[type]} border relative overflow-hidden`}>
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-gold/30" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-gold/30" />
                  <div className="flex justify-between items-center">
                    <span className={`font-display text-lg ${metalTextColors[type]}`}>{label}</span>
                    <div className="text-right">
                      <div className="text-marble font-semibold">
                        {metalPrices?.[type as keyof typeof metalPrices]?.price_usd ? fmtSpot(Number(metalPrices[type as keyof typeof metalPrices].price_usd)) : '—'}
                      </div>
                      {metalPrices?.[type as keyof typeof metalPrices]?.change_24h && (
                        <div className={`text-xs font-mono ${Number(metalPrices[type as keyof typeof metalPrices].change_24h) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {Number(metalPrices[type as keyof typeof metalPrices].change_24h) >= 0 ? '+' : ''}
                          {Number(metalPrices[type as keyof typeof metalPrices].change_24h).toFixed(2)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {activeCategory === 'precious-metals' && (
              <div className="flex flex-wrap gap-3 mb-6">
                <button onClick={() => setSelectedMetal(undefined)}
                  className={`px-4 py-2 rounded font-display text-sm transition-all border ${!selectedMetal ? 'bg-gold text-navy border-gold' : 'bg-navy-light/30 text-marble border-gold/15 hover:bg-navy-light/50'}`}>
                  <Filter size={14} className="inline mr-2" />All Metals
                </button>
                {metals.map(({ type, label }) => (
                  <button key={type} onClick={() => setSelectedMetal(type)}
                    className={`px-4 py-2 rounded font-display text-sm transition-all border ${selectedMetal === type ? 'bg-gold text-navy border-gold' : 'bg-navy-light/30 text-marble border-gold/15 hover:bg-navy-light/50'}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="mb-10">
              <h3 className="font-display text-lg text-gold mb-4 tracking-wider flex items-center gap-2">
                <div className="h-px flex-1 bg-gold/15" />
                <Gem size={16} /> BULLION CERTIFICATES
                <div className="h-px flex-1 bg-gold/15" />
              </h3>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="bg-navy-light/30 border-gold/10">
                      <CardContent className="p-5"><Skeleton className="h-6 w-3/4 mb-4" /><Skeleton className="h-4 w-1/2 mb-2" /><Skeleton className="h-10 w-full" /></CardContent>
                    </Card>
                  ))}
                </div>
              ) : certs && certs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {certs.map((cert) => <CertificateCard key={cert.cert_id} cert={cert} prices={metalPrices} />)}
                </div>
              ) : (
                <div className="text-center py-10 border border-gold/10 rounded bg-navy-light/20">
                  <div className="text-marble/50 text-sm mb-2 font-display">No certificates available</div>
                  <p className="text-marble/30 text-xs">Check back soon for new bullion listings.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── Live Asset Grid ─── */}
        {filteredSymbols.length > 0 && (
          <div>
            <h3 className="font-display text-lg text-gold mb-4 tracking-wider flex items-center gap-2">
              <div className="h-px flex-1 bg-gold/15" />
              <BarChart3 size={16} /> {activeCategory === 'all' ? 'ALL INSTRUMENTS' : activeCat.label.toUpperCase()}
              <span className="text-[10px] text-marble/30 font-mono ml-2">{filteredSymbols.length}</span>
              <div className="h-px flex-1 bg-gold/15" />
            </h3>

            {/* Group by watchlist category when showing all */}
            {activeCategory === 'all' ? (
              WATCHLIST_CATEGORIES.map(wc => {
                const catSyms = filteredSymbols.filter(s => s.watchlistLabel === wc.label);
                if (catSyms.length === 0) return null;
                return (
                  <div key={wc.label} className="mb-8">
                    <h4 className="font-display text-xs tracking-[0.2em] text-marble/40 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[catSyms[0]?.cat] || 'hsl(43,72%,50%)' }} />
                      {wc.label}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {catSyms.map(sym => {
                        const { price, change, isLive } = resolvePrice(sym);
                        if (price === 0) return null;
                        return <AssetCard key={sym.key} symbol={sym} livePrice={price} liveChange={change} isLive={isLive} />;
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSymbols.map(sym => {
                  const { price, change, isLive } = resolvePrice(sym);
                  if (price === 0) return null;
                  return <AssetCard key={sym.key} symbol={sym} livePrice={price} liveChange={change} isLive={isLive} />;
                })}
              </div>
            )}
          </div>
        )}

        {filteredSymbols.length === 0 && !showCertificates && (
          <div className="text-center py-16">
            <div className="text-marble/50 text-lg mb-4 font-display">No assets found.</div>
            <p className="text-marble/30 text-sm">Try a different search or category.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Marketplace;
