import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GAMarketSummary from '@/components/ga-widgets/GAMarketSummary';
import GACryptoPriceCards from '@/components/ga-widgets/GACryptoPriceCards';
import GABullionHeatmap from '@/components/ga-widgets/GABullionHeatmap';
import GAMetalProfile from '@/components/ga-widgets/GAMetalProfile';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useWebSocketPrices } from '@/hooks/useWebSocketPrices';
import { useOilGasPrices } from '@/hooks/useOilGasData';
import { useBullionBars } from '@/hooks/useBullionBars';
import { useCertificateReserveTotals } from '@/hooks/useCertificateReserveTotals';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import MarketplaceSpotWidget from '@/components/marketplace/MarketplaceSpotWidget';
import {
  ALL_SYMBOLS,
  CATEGORY_COLORS,
  SYNTHETIC_PRICES,
  WATCHLIST_CATEGORIES,
} from '@/data/tradingSymbols';
import {
  Search, Shield, Activity, Coins, Flame, Gem,
  ArrowUpRight, Sparkles, Landmark, BarChart3, DollarSign,
} from 'lucide-react';

/* ─── Types ─── */
type FeedCategory = 'metals' | 'crypto' | 'energy' | 'stocks' | 'forex' | 'bonds';
type BoardFilter = 'all' | FeedCategory;

interface BoardItem {
  id: string;
  name: string;
  ticker: string;
  category: FeedCategory;
  price: number;
  change: number;
  source: string;
  routeSymbol: string;
  live: boolean;
  isWsLive: boolean;
  accentColor: string;
}

/* ─── Constants ─── */
const CRYPTO_WS_KEYS = [
  'bitcoin', 'ethereum', 'solana', 'xrp', 'bnb', 'cardano', 'avalanche',
  'polkadot', 'chainlink', 'dogecoin', 'polygon', 'litecoin', 'uniswap',
  'near', 'aptos', 'sui', 'arbitrum', 'optimism', 'injective', 'render',
  'filecoin', 'cosmos', 'stellar', 'hedera', 'tron', 'shiba', 'pepe',
] as const;

const CRYPTO_ID_BY_KEY: Record<string, string> = {
  bitcoin: 'bitcoin', ethereum: 'ethereum', solana: 'solana', xrp: 'ripple',
  bnb: 'binancecoin', cardano: 'cardano', avalanche: 'avalanche-2',
  polkadot: 'polkadot', chainlink: 'chainlink', dogecoin: 'dogecoin',
  polygon: 'matic-network', litecoin: 'litecoin', uniswap: 'uniswap',
  near: 'near', aptos: 'aptos', sui: 'sui', arbitrum: 'arbitrum',
  optimism: 'optimism', injective: 'injective-protocol', render: 'render-token',
  filecoin: 'filecoin', cosmos: 'cosmos', stellar: 'stellar',
  hedera: 'hedera-hashgraph', tron: 'tron', shiba: 'shiba-inu', pepe: 'pepe',
};

const ENERGY_TICKER_TO_KEY: Record<string, string> = {
  CL: 'oil', BZ: 'brent', NG: 'natgas', HO: 'heating_oil', RB: 'rbob',
};

const METAL_ROUTE_MAP: Record<string, string> = {
  gold: 'gold', silver: 'silver', platinum: 'platinum',
};

const FILTERS: { key: BoardFilter; label: string; icon: typeof Activity }[] = [
  { key: 'all', label: 'ALL', icon: Activity },
  { key: 'metals', label: 'METALS', icon: Gem },
  { key: 'crypto', label: 'CRYPTO', icon: Coins },
  { key: 'energy', label: 'ENERGY', icon: Flame },
  { key: 'stocks', label: 'EQUITIES', icon: BarChart3 },
  { key: 'forex', label: 'FOREX', icon: DollarSign },
  { key: 'bonds', label: 'BONDS', icon: Landmark },
];

const METAL_META = {
  gold: { label: 'Gold', accent: 'text-gold', chip: 'border-gold/25 bg-gold/10 text-gold-light', spotColor: 'hsl(43, 72%, 50%)', marketSymbol: 'XAU/USD' },
  silver: { label: 'Silver', accent: 'text-silver-light', chip: 'border-silver/25 bg-silver/10 text-silver-light', spotColor: 'hsl(210, 6%, 67%)', marketSymbol: 'XAG/USD' },
  platinum: { label: 'Platinum', accent: 'text-platinum-light', chip: 'border-platinum/25 bg-platinum/10 text-platinum-light', spotColor: 'hsl(210, 4%, 76%)', marketSymbol: 'XPT/USD' },
} as const;

/* ─── Helpers ─── */
const formatPrice = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  if (value < 0.01) return `$${value.toFixed(6)}`;
  if (value < 1) return `$${value.toFixed(4)}`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: value >= 1000 ? 2 : value < 10 ? 4 : 2,
    maximumFractionDigits: value >= 1000 ? 2 : value < 10 ? 4 : 2,
  }).format(value);
};

const formatCompact = (value: number) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: value >= 1000 ? 1 : 0 }).format(value);

const fallbackCryptoName = (label: string) => label.replace('/USD', '').replace('/', ' ');

const catToFeedCategory = (cat: string): FeedCategory => {
  if (cat === 'metals') return 'metals';
  if (cat === 'crypto') return 'crypto';
  if (cat === 'energy') return 'energy';
  if (cat === 'forex') return 'forex';
  if (cat === 'bonds') return 'bonds';
  return 'stocks';
};

/* ─── LiveDot ─── */
const LiveDot = () => (
  <span className="relative flex h-2 w-2">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
  </span>
);

/* ─── StatCard ─── */
const StatCard = ({ icon: Icon, label, value, detail }: { icon: typeof Activity; label: string; value: string; detail: string }) => (
  <div className="rounded-sm border border-gold/15 bg-secondary/40 p-5 shadow-card">
    <div className="mb-4 flex items-center gap-3 text-gold-light">
      <div className="rounded-sm border border-gold/20 bg-gold/10 p-2.5"><Icon className="h-5 w-5" /></div>
      <span className="font-display text-sm tracking-[0.18em] text-marble/80">{label}</span>
    </div>
    <div className="font-display text-3xl tracking-[0.04em] text-marble md:text-4xl">{value}</div>
    <p className="mt-2 text-sm text-marble/60">{detail}</p>
  </div>
);

/* ─── MoverCard ─── */
const MoverCard = ({ item }: { item: BoardItem }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/trading-bridge?symbol=${item.routeSymbol}`)}
      className="group rounded-sm border border-gold/15 bg-secondary/35 p-5 text-left transition-all duration-300 hover:border-gold/35 hover:bg-secondary/55 hover:shadow-gold"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            {item.live && <LiveDot />}
            <span className="text-xs font-mono text-marble/45">{item.source}</span>
          </div>
          <h2 className="font-display text-2xl tracking-[0.06em] text-marble">{item.name}</h2>
          <p className="mt-1 text-sm text-marble/55">{item.ticker}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <ArrowUpRight className="h-5 w-5 text-gold/60 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          <span className="text-[9px] font-display tracking-[0.2em] text-gold/50">TRADE</span>
        </div>
      </div>

      <MarketplaceSpotWidget
        symbolKey={item.routeSymbol}
        label={item.ticker}
        basePrice={item.price}
        baseChange={item.change}
        accentColor={item.accentColor}
        wsPrice={item.isWsLive ? item.price : undefined}
        wsChange={item.isWsLive ? item.change : undefined}
        isWsLive={item.isWsLive}
      />
    </button>
  );
};

/* ─── FeedRow ─── */
const FeedRow = ({ item, rank }: { item: BoardItem; rank: number }) => {
  const navigate = useNavigate();

  const categoryColors: Record<FeedCategory, string> = {
    crypto: 'border-gold/20 bg-gold/10 text-gold-light',
    metals: 'border-gold/25 bg-gold/15 text-gold',
    energy: 'border-primary/20 bg-primary/10 text-primary',
    stocks: 'border-accent/20 bg-accent/10 text-accent',
    forex: 'border-primary/20 bg-primary/10 text-primary',
    bonds: 'border-muted/30 bg-muted/10 text-muted-foreground',
  };

  return (
    <button
      type="button"
      onClick={() => navigate(`/trading-bridge?symbol=${item.routeSymbol}`)}
      className="flex flex-col gap-3 w-full border-b border-gold/10 px-4 py-4 text-left transition-colors hover:bg-secondary/35 md:px-6 group cursor-pointer md:grid md:grid-cols-[52px_minmax(0,1.2fr)_minmax(0,1fr)] md:items-center md:gap-4"
    >
      {/* Rank + instrument info row */}
      <div className="flex items-start gap-3 md:contents">
        <div className="text-right font-mono text-sm text-marble/40 pt-1 md:pt-0 w-8 flex-shrink-0 md:w-auto">{rank}</div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-display tracking-[0.14em] ${categoryColors[item.category]}`}>
              {item.category}
            </span>
            {item.live && <LiveDot />}
            <span className="text-[10px] font-display tracking-[0.16em] text-gold/40 opacity-0 transition-opacity group-hover:opacity-100 hidden sm:inline">
              OPEN CHART →
            </span>
          </div>
          <div className="font-display text-base tracking-[0.04em] text-marble md:text-xl">{item.name}</div>
          <div className="text-xs text-marble/50 md:text-sm">{item.ticker} · {item.source}</div>
        </div>
      </div>

      {/* Spot widget — full width on mobile, inline on desktop */}
      <div className="w-full md:w-auto">
        <MarketplaceSpotWidget
          symbolKey={item.routeSymbol}
          label={item.ticker}
          basePrice={item.price}
          baseChange={item.change}
          accentColor={item.accentColor}
          compact
          wsPrice={item.isWsLive ? item.price : undefined}
          wsChange={item.isWsLive ? item.change : undefined}
          isWsLive={item.isWsLive}
        />
      </div>
    </button>
  );
};

/* ─── ReserveCard ─── */
const ReserveCard = ({ card, onClick }: { card: { metal: 'gold' | 'silver' | 'platinum'; vaultOz: number; barCount: number; spotPrice: number | null } & Record<string, any>; onClick: () => void }) => {
  const meta = METAL_META[card.metal];

  return (
    <button type="button" onClick={onClick} className="rounded-sm border border-gold/15 bg-secondary/40 p-6 shadow-card text-left transition-all hover:border-gold/30 hover:shadow-gold group w-full">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className={`font-display text-2xl tracking-[0.06em] ${meta.accent}`}>{meta.label}</h3>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Gem className={`h-5 w-5 ${meta.accent}`} />
          <span className="text-[9px] font-display tracking-[0.16em] text-gold/40 opacity-0 transition-opacity group-hover:opacity-100">TRADE →</span>
        </div>
      </div>

      <div className="grid gap-3 text-sm md:grid-cols-2">
        <MarketplaceSpotWidget
          symbolKey={card.metal}
          label={meta.marketSymbol}
          basePrice={card.spotPrice ?? 0}
          baseChange={0}
          accentColor={meta.spotColor}
        />
        {card.vaultOz > 0 && (
          <div className="rounded-sm border border-gold/10 bg-background/5 p-4">
            <div className="text-marble/45">Vault ounces</div>
            <div className="mt-1 font-mono text-2xl text-marble">{formatCompact(card.vaultOz)} oz</div>
          </div>
        )}
        {card.barCount > 0 && (
          <div className="rounded-sm border border-gold/10 bg-background/5 p-4">
            <div className="text-marble/45">Bars in custody</div>
            <div className="mt-1 font-mono text-2xl text-marble">{card.barCount}</div>
          </div>
        )}
      </div>
    </button>
  );
};

/* ═══════════════════════════════════════════ */
/*              MARKETPLACE PAGE               */
/* ═══════════════════════════════════════════ */

const Marketplace = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<BoardFilter>('all');
  const [search, setSearch] = useState('');

  const { data: crypto } = useCryptoData(50);
  const wsPrices = useWebSocketPrices([...CRYPTO_WS_KEYS]);
  const { data: energy } = useOilGasPrices();
  const { data: bars } = useBullionBars({ limit: 200 });
  const { data: reserveTotals } = useCertificateReserveTotals();
  const { data: metalPrices } = useMetalPrices();

  /* ─── Crypto lookup ─── */
  const cryptoLookup = useMemo(() => {
    const byKey: Record<string, NonNullable<typeof crypto>[number]> = {};
    (crypto ?? []).forEach(coin => {
      const supportedKey = Object.entries(CRYPTO_ID_BY_KEY).find(([, id]) => id === coin.id)?.[0] ?? coin.id;
      byKey[supportedKey] = coin;
    });
    return byKey;
  }, [crypto]);

  /* ─── Metals board ─── */
  const metalsBoard = useMemo<BoardItem[]>(() => {
    if (!metalPrices) return [];
    return (['gold', 'silver', 'platinum'] as const)
      .filter(m => metalPrices[m]?.price_usd > 0)
      .map(m => ({
        id: `metal-${m}`,
        name: m === 'gold' ? 'Gold' : m === 'silver' ? 'Silver' : 'Platinum',
        ticker: m === 'gold' ? 'XAU/USD' : m === 'silver' ? 'XAG/USD' : 'XPT/USD',
        category: 'metals' as const,
        price: metalPrices[m].price_usd,
        change: metalPrices[m].change_24h ?? 0,
        source: 'Live spot',
        routeSymbol: METAL_ROUTE_MAP[m],
        live: true,
        isWsLive: false,
        accentColor: METAL_META[m].spotColor,
      }));
  }, [metalPrices]);

  /* ─── Crypto board (auto from ALL_SYMBOLS crypto) ─── */
  const cryptoBoard = useMemo<BoardItem[]>(() => {
    return ALL_SYMBOLS.filter(s => s.cat === 'crypto')
      .map(symbol => {
        const coin = cryptoLookup[symbol.key];
        const ws = wsPrices[symbol.key];
        const price = ws?.price ?? coin?.current_price ?? 0;
        const change = ws?.change24h ?? coin?.price_change_percentage_24h ?? 0;
        return {
          id: symbol.key,
          name: coin?.name ?? fallbackCryptoName(symbol.label),
          ticker: symbol.label,
          category: 'crypto' as const,
          price,
          change,
          source: ws ? 'Binance WS' : coin ? 'CoinGecko' : 'Market',
          routeSymbol: symbol.key,
          live: price > 0,
          isWsLive: Boolean(ws?.price),
          accentColor: CATEGORY_COLORS.crypto,
        };
      })
      .filter(item => item.price > 0);
  }, [cryptoLookup, wsPrices]);

  /* ─── Energy board ─── */
  const energyBoard = useMemo<BoardItem[]>(() => {
    const liveEnergy = (energy ?? [])
      .filter(item => ENERGY_TICKER_TO_KEY[item.symbol])
      .map(item => ({
        id: item.symbol,
        name: item.name,
        ticker: `${item.symbol}/USD`,
        category: 'energy' as const,
        price: item.price,
        change: item.change,
        source: 'EIA',
        routeSymbol: ENERGY_TICKER_TO_KEY[item.symbol],
        live: true,
        isWsLive: false,
        accentColor: CATEGORY_COLORS.energy,
      }))
      .filter(item => item.price > 0);

    // Add remaining energy symbols from ALL_SYMBOLS not covered by live feeds
    const liveKeys = new Set(liveEnergy.map(e => e.routeSymbol));
    const syntheticEnergy = ALL_SYMBOLS
      .filter(s => s.cat === 'energy' && !liveKeys.has(s.key) && SYNTHETIC_PRICES[s.key])
      .map(s => ({
        id: s.key,
        name: s.label,
        ticker: `${s.ticker}/USD`,
        category: 'energy' as const,
        price: SYNTHETIC_PRICES[s.key].p,
        change: SYNTHETIC_PRICES[s.key].c,
        source: 'Market',
        routeSymbol: s.key,
        live: false,
        isWsLive: false,
        accentColor: CATEGORY_COLORS.energy,
      }));

    return [...liveEnergy, ...syntheticEnergy];
  }, [energy]);

  /* ─── Stocks / Forex / Bonds — auto-populated from ALL_SYMBOLS ─── */
  const additionalBoards = useMemo<BoardItem[]>(() => {
    return ALL_SYMBOLS
      .filter(s => ['stocks', 'forex', 'bonds'].includes(s.cat) && SYNTHETIC_PRICES[s.key])
      .map(s => ({
        id: s.key,
        name: s.label,
        ticker: s.ticker,
        category: catToFeedCategory(s.cat),
        price: SYNTHETIC_PRICES[s.key].p,
        change: SYNTHETIC_PRICES[s.key].c,
        source: 'Market',
        routeSymbol: s.key,
        live: false,
        isWsLive: false,
        accentColor: CATEGORY_COLORS[s.cat] ?? CATEGORY_COLORS.stocks,
      }));
  }, []);

  /* ─── Combined board ─── */
  const boardItems = useMemo(() => {
    return [...metalsBoard, ...cryptoBoard, ...energyBoard, ...additionalBoards]
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [metalsBoard, cryptoBoard, energyBoard, additionalBoards]);

  const filteredBoard = useMemo(() => {
    const query = search.trim().toLowerCase();
    return boardItems.filter(item => {
      const matchesFilter = filter === 'all' ? true : item.category === filter;
      const matchesQuery = query ? item.name.toLowerCase().includes(query) || item.ticker.toLowerCase().includes(query) : true;
      return matchesFilter && matchesQuery;
    });
  }, [boardItems, filter, search]);

  const topMovers = useMemo(() => boardItems.filter(i => i.price > 0).slice(0, 4), [boardItems]);

  /* ─── Reserve cards (only show metals with actual vault data) ─── */
  const reserveCards = useMemo(() => {
    const grouped = { gold: [] as any[], silver: [] as any[], platinum: [] as any[] };
    (bars ?? []).forEach(bar => { grouped[bar.metal_type].push(bar); });
    return (['gold', 'silver', 'platinum'] as const).map(metal => ({
      metal,
      vaultOz: grouped[metal].reduce((sum: number, bar: any) => sum + Number(bar.weight_oz), 0),
      barCount: grouped[metal].length,
      spotPrice: metalPrices?.[metal]?.price_usd ?? null,
    }));
  }, [bars, metalPrices]);

  const totalAssets = boardItems.length;
  const categoryCount = new Set(boardItems.map(i => i.category)).size;

  return (
    <div className="min-h-screen bg-navy text-marble">
      <Header />

      <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-navy">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--gold)/0.14),transparent_42%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

        <div className="container relative z-10 px-4 py-16 md:py-20">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-xs font-display tracking-[0.24em] text-gold-light">
              <Shield className="h-4 w-4" />
              LIVE MARKET DATA
            </div>

            <h1 className="font-display text-5xl tracking-[0.08em] text-marble md:text-7xl lg:text-8xl">
              PAX ROMANA
              <span className="mt-2 block gold-shimmer">MARKETPLACE</span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-marble/72 md:text-xl">
              Browse {totalAssets}+ instruments across {categoryCount} asset classes. Tap any asset to open its live chart and trade instantly.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Activity} label="Instruments" value={String(totalAssets)} detail="Available to trade now" />
            <StatCard icon={Coins} label="Cryptocurrencies" value={String(cryptoBoard.length)} detail="Live WebSocket prices" />
            <StatCard icon={Gem} label="Precious metals" value={String(metalsBoard.length)} detail="Spot prices updated live" />
            <StatCard icon={BarChart3} label="Asset classes" value={String(categoryCount)} detail="Metals · Crypto · Energy · Equities · Forex · Bonds" />
          </div>

          <div className="mt-12">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-display text-sm tracking-[0.22em] text-gold-light">TOP MOVERS</p>
                <p className="mt-1 text-sm text-marble/55">Biggest 24h moves — tap to trade</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/intelligence')}
                className="inline-flex items-center gap-2 rounded-sm border border-gold/20 bg-secondary/35 px-4 py-2 text-sm font-display tracking-[0.16em] text-marble transition-colors hover:border-gold/35 hover:text-gold-light"
              >
                <Sparkles className="h-4 w-4" />
                Intelligence
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {topMovers.map(item => <MoverCard key={item.id} item={item} />)}
            </div>
          </div>
        </div>
      </section>

      <main className="container px-4 py-10 md:py-14">
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <GAMarketSummary />
          <GACryptoPriceCards />
        </section>

        <section className="mt-10 rounded-sm border border-gold/15 bg-secondary/25 shadow-card">
          <div className="border-b border-gold/10 px-5 py-5 md:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-display text-sm tracking-[0.22em] text-gold-light">ALL INSTRUMENTS</p>
                <h2 className="mt-2 font-display text-3xl tracking-[0.05em] text-marble md:text-4xl">
                  Explore & Trade
                </h2>
                <p className="mt-2 max-w-2xl text-base text-marble/60">
                  {totalAssets} instruments across metals, crypto, energy, equities, forex and bonds. Click any row to open the chart.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 lg:max-w-2xl lg:flex-row lg:items-center lg:justify-end">
                <label className="relative block w-full lg:max-w-sm">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-marble/35" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search instruments..."
                    className="w-full rounded-sm border border-gold/15 bg-background/5 py-3 pl-11 pr-4 text-base text-marble placeholder:text-marble/35 focus:border-gold/35 focus:outline-none"
                  />
                </label>

                <div className="flex overflow-x-auto scrollbar-hide gap-1.5 sm:gap-2 sm:flex-wrap">
                  {FILTERS.map(({ key, label, icon: Icon }) => {
                    const active = filter === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFilter(key)}
                        className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm font-display tracking-[0.12em] sm:tracking-[0.16em] transition-all flex-shrink-0 ${
                          active
                            ? 'border-gold/40 bg-gold/15 text-gold-light'
                            : 'border-gold/10 bg-secondary/30 text-marble/70 hover:border-gold/25 hover:text-marble'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:grid grid-cols-[52px_minmax(0,1.2fr)_minmax(0,1fr)] gap-4 px-4 py-3 text-xs font-display tracking-[0.22em] text-marble/45 md:px-6">
            <div className="text-right">#</div>
            <div>INSTRUMENT</div>
            <div>LIVE SPOT</div>
          </div>

          <div>
            {filteredBoard.length > 0 ? (
              filteredBoard.map((item, index) => <FeedRow key={item.id} item={item} rank={index + 1} />)
            ) : (
              <div className="px-6 py-14 text-center">
                <h3 className="font-display text-2xl tracking-[0.08em] text-marble">No results</h3>
                <p className="mt-2 text-base text-marble/55">Try a different search or filter.</p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <GAMetalProfile />
          <GABullionHeatmap />
        </section>

        <section className="mt-10 rounded-sm border border-gold/15 bg-secondary/25 p-6 shadow-card md:p-8">
          <div className="mb-6 max-w-3xl">
            <p className="font-display text-sm tracking-[0.22em] text-gold-light">PRECIOUS METALS</p>
            <h2 className="mt-2 font-display text-3xl tracking-[0.05em] text-marble md:text-4xl">
              Gold · Silver · Platinum
            </h2>
            <p className="mt-2 text-base text-marble/60">
              Live spot prices. Tap any metal to open its chart.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {reserveCards.map(card => (
              <ReserveCard
                key={card.metal}
                card={card}
                onClick={() => navigate(`/trading-bridge?symbol=${METAL_ROUTE_MAP[card.metal]}`)}
              />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Marketplace;
