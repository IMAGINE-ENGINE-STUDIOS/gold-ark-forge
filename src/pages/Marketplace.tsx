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
  TOTAL_INSTRUMENT_COUNT,
} from '@/data/tradingSymbols';
import {
  Search, Shield, Activity, Coins, Flame, Gem,
  ArrowUpRight, Sparkles, Landmark, BarChart3, DollarSign,
  Wheat, Mountain, Building2, TrendingUp,
} from 'lucide-react';
import goldArrowLogo from '@/assets/gold-arrow-logo.png';

/* ─── Types ─── */
type FeedCategory = 'metals' | 'crypto' | 'energy' | 'stocks' | 'forex' | 'bonds' | 'agriculture' | 'minerals' | 'reits' | 'etfs';

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
  subCategory?: string;
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

const METAL_META = {
  gold: { label: 'Gold', accent: 'text-gold', spotColor: 'hsl(43, 72%, 50%)', marketSymbol: 'XAU/USD' },
  silver: { label: 'Silver', accent: 'text-silver-light', spotColor: 'hsl(210, 6%, 67%)', marketSymbol: 'XAG/USD' },
  platinum: { label: 'Platinum', accent: 'text-platinum-light', spotColor: 'hsl(210, 4%, 76%)', marketSymbol: 'XPT/USD' },
} as const;

/* ─── Category definitions ─── */
type MarketCategoryKey = 'overview' | 'metals' | 'crypto' | 'energy' | 'stocks' | 'forex' | 'bonds' | 'agriculture' | 'minerals' | 'reits' | 'etfs';

const MARKET_CATEGORIES: { key: MarketCategoryKey; label: string; icon: typeof Activity }[] = [
  { key: 'metals', label: 'Precious Metals', icon: Gem },
  { key: 'crypto', label: 'Crypto', icon: Coins },
  { key: 'energy', label: 'Energy', icon: Flame },
  { key: 'stocks', label: 'Equities', icon: BarChart3 },
  { key: 'forex', label: 'Forex', icon: DollarSign },
  { key: 'bonds', label: 'Bonds', icon: Landmark },
  { key: 'agriculture', label: 'Agriculture', icon: Wheat },
  { key: 'minerals', label: 'Rare Earth', icon: Mountain },
  { key: 'reits', label: 'REITs', icon: Building2 },
  { key: 'etfs', label: 'ETFs', icon: TrendingUp },
];

/* Sub-categories per main category */
const SUB_CATEGORIES: Record<MarketCategoryKey, { key: string; label: string }[]> = {
  overview: [],
  metals: [
    { key: 'all', label: 'ALL METALS' },
    { key: 'spot', label: 'SPOT PRICES' },
    { key: 'industrial', label: 'INDUSTRIAL' },
    { key: 'vault', label: 'VAULT & RESERVES' },
  ],
  crypto: [
    { key: 'all', label: 'ALL CRYPTO' },
    { key: 'major', label: 'MAJOR' },
    { key: 'alt', label: 'ALTCOINS' },
    { key: 'stable', label: 'STABLECOINS' },
  ],
  energy: [
    { key: 'all', label: 'ALL ENERGY' },
    { key: 'commodities', label: 'COMMODITIES' },
    { key: 'companies', label: 'O&G COMPANIES' },
  ],
  stocks: [
    { key: 'all', label: 'ALL EQUITIES' },
    { key: 'indices', label: 'US INDICES' },
    { key: 'mega', label: 'MEGA CAP' },
    { key: 'tech', label: 'TECH & GROWTH' },
    { key: 'financial', label: 'FINANCIALS' },
    { key: 'mining', label: 'MINING' },
    { key: 'healthcare', label: 'HEALTHCARE' },
    { key: 'consumer', label: 'CONSUMER' },
    { key: 'industrial', label: 'INDUSTRIALS' },
    { key: 'global_idx', label: 'GLOBAL INDICES' },
    { key: 'semis', label: 'SEMICONDUCTORS' },
    { key: 'oil_gas', label: 'OIL & GAS' },
  ],
  forex: [
    { key: 'all', label: 'ALL FOREX' },
    { key: 'major', label: 'MAJOR' },
    { key: 'cross', label: 'CROSS' },
    { key: 'em', label: 'EMERGING' },
  ],
  bonds: [
    { key: 'all', label: 'ALL BONDS' },
    { key: 'us_treasury', label: 'US TREASURY' },
    { key: 'corporate', label: 'CORPORATE' },
    { key: 'aggregate', label: 'AGGREGATE' },
    { key: 'intl', label: 'INTERNATIONAL' },
  ],
  agriculture: [
    { key: 'all', label: 'ALL AGRICULTURE' },
    { key: 'grains', label: 'GRAINS' },
    { key: 'softs', label: 'SOFTS' },
    { key: 'livestock', label: 'LIVESTOCK' },
  ],
  minerals: [
    { key: 'all', label: 'ALL MINERALS' },
    { key: 'battery', label: 'BATTERY' },
    { key: 'rare_earth', label: 'RARE EARTH' },
    { key: 'semiconductor', label: 'SEMICONDUCTOR' },
    { key: 'industrial_min', label: 'INDUSTRIAL' },
  ],
  reits: [
    { key: 'all', label: 'ALL REITS' },
    { key: 'tower', label: 'TOWER' },
    { key: 'data_center', label: 'DATA CENTER' },
    { key: 'residential', label: 'RESIDENTIAL' },
    { key: 'retail', label: 'RETAIL' },
    { key: 'office', label: 'OFFICE' },
  ],
  etfs: [
    { key: 'all', label: 'ALL ETFS' },
    { key: 'equity_etf', label: 'EQUITY' },
    { key: 'commodity_etf', label: 'COMMODITY' },
    { key: 'thematic', label: 'THEMATIC' },
  ],
};

/* ─── Crypto sub-cat assignment ─── */
const CRYPTO_MAJOR_KEYS = new Set(['bitcoin', 'ethereum', 'solana', 'xrp', 'bnb', 'cardano', 'avalanche', 'polkadot', 'chainlink', 'dogecoin']);
const OG_COMPANY_KEYS = new Set(['xom', 'cvx', 'cop', 'eog', 'slb', 'hal', 'bp', 'shel', 'tte', 'oxy', 'psx', 'mpc', 'vlo', 'dvn', 'fang']);
const INDICES_MEGA_KEYS = new Set(['sp500', 'nasdaq', 'dow', 'russell', 'aapl', 'msft', 'nvda', 'googl', 'amzn', 'meta', 'tsla', 'brk', 'jpm', 'v', 'unh']);
const TECH_KEYS = new Set(['crm', 'adbe', 'nflx', 'amd', 'intc', 'avgo', 'csco', 'orcl', 'snow', 'pltr', 'coin', 'sq', 'shop', 'uber', 'abnb']);
const FINANCIAL_KEYS = new Set(['gs', 'ms', 'bac', 'c', 'wfc', 'nem', 'gold_stock', 'fmg', 'rio', 'bhp', 'vale']);

/* ─── Helpers ─── */
const catToFeedCategory = (cat: string): FeedCategory => {
  if (cat === 'metals') return 'metals';
  if (cat === 'crypto') return 'crypto';
  if (cat === 'energy') return 'energy';
  if (cat === 'forex') return 'forex';
  if (cat === 'bonds') return 'bonds';
  return 'stocks';
};

const fallbackCryptoName = (label: string) => label.replace('/USD', '').replace('/', ' ');

const formatCompact = (value: number) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: value >= 1000 ? 1 : 0 }).format(value);

/* ─── UI Components ─── */
const LiveDot = () => (
  <span className="relative flex h-2 w-2">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
  </span>
);

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

const FeedRow = ({ item, rank }: { item: BoardItem; rank: number }) => {
  const navigate = useNavigate();
  const categoryColors: Record<FeedCategory, string> = {
    crypto: 'border-gold/20 bg-gold/10 text-gold-light',
    metals: 'border-gold/25 bg-gold/15 text-gold',
    energy: 'border-primary/20 bg-primary/10 text-primary',
    stocks: 'border-accent/20 bg-accent/10 text-accent',
    forex: 'border-primary/20 bg-primary/10 text-primary',
    bonds: 'border-muted/30 bg-muted/10 text-muted-foreground',
    agriculture: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    minerals: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
    reits: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
    etfs: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
  };

  return (
    <button
      type="button"
      onClick={() => navigate(`/trading-bridge?symbol=${item.routeSymbol}`)}
      className="flex flex-col gap-3 w-full border-b border-gold/10 px-4 py-4 text-left transition-colors hover:bg-secondary/35 md:px-6 group cursor-pointer md:grid md:grid-cols-[52px_minmax(0,1.2fr)_minmax(0,1fr)] md:items-center md:gap-4"
    >
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

const ReserveCard = ({ card, onClick }: { card: { metal: 'gold' | 'silver' | 'platinum'; vaultOz: number; barCount: number; spotPrice: number | null }; onClick: () => void }) => {
  const meta = METAL_META[card.metal];
  return (
    <button type="button" onClick={onClick} className="rounded-sm border border-gold/15 bg-secondary/40 p-6 shadow-card text-left transition-all hover:border-gold/30 hover:shadow-gold group w-full">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className={`font-display text-2xl tracking-[0.06em] ${meta.accent}`}>{meta.label}</h3>
        <Gem className={`h-5 w-5 ${meta.accent}`} />
      </div>
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <MarketplaceSpotWidget symbolKey={card.metal} label={meta.marketSymbol} basePrice={card.spotPrice ?? 0} baseChange={0} accentColor={meta.spotColor} />
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

/* ─── Instrument List (shared per category) ─── */
const InstrumentList = ({ items, search, setSearch }: { items: BoardItem[]; search: string; setSearch: (s: string) => void }) => {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => i.name.toLowerCase().includes(q) || i.ticker.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="rounded-sm border border-gold/15 bg-secondary/25 shadow-card">
      <div className="border-b border-gold/10 px-5 py-4 md:px-6">
        <label className="relative block w-full max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-marble/35" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search instruments..."
            className="w-full rounded-sm border border-gold/15 bg-background/5 py-2.5 pl-11 pr-4 text-sm text-marble placeholder:text-marble/35 focus:border-gold/35 focus:outline-none"
          />
        </label>
      </div>
      <div className="hidden md:grid grid-cols-[52px_minmax(0,1.2fr)_minmax(0,1fr)] gap-4 px-4 py-3 text-xs font-display tracking-[0.22em] text-marble/45 md:px-6">
        <div className="text-right">#</div>
        <div>INSTRUMENT</div>
        <div>LIVE SPOT</div>
      </div>
      <div>
        {filtered.length > 0 ? (
          filtered.map((item, i) => <FeedRow key={item.id} item={item} rank={i + 1} />)
        ) : (
          <div className="px-6 py-14 text-center">
            <h3 className="font-display text-2xl tracking-[0.08em] text-marble">No results</h3>
            <p className="mt-2 text-base text-marble/55">Try a different search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════ */
/*              MARKETPLACE PAGE               */
/* ═══════════════════════════════════════════ */

const Marketplace = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<MarketCategoryKey>('overview');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: crypto } = useCryptoData(50);
  const wsPrices = useWebSocketPrices([...CRYPTO_WS_KEYS]);
  const { data: energy } = useOilGasPrices();
  const { data: bars } = useBullionBars({ limit: 200 });
  const { data: metalPrices } = useMetalPrices();

  /* Reset sub-category when main category changes */
  const handleCategoryChange = (key: MarketCategoryKey) => {
    setActiveCategory(key);
    setActiveSubCategory('all');
    setSearch('');
  };

  /* ─── Crypto lookup ─── */
  const cryptoLookup = useMemo(() => {
    const byKey: Record<string, NonNullable<typeof crypto>[number]> = {};
    (crypto ?? []).forEach(coin => {
      const supportedKey = Object.entries(CRYPTO_ID_BY_KEY).find(([, id]) => id === coin.id)?.[0] ?? coin.id;
      byKey[supportedKey] = coin;
    });
    return byKey;
  }, [crypto]);

  /* ─── Build all board items ─── */
  const metalsBoard = useMemo<BoardItem[]>(() => {
    if (!metalPrices) return [];
    return (['gold', 'silver', 'platinum'] as const)
      .filter(m => metalPrices[m]?.price_usd > 0)
      .map(m => ({
        id: `metal-${m}`, name: m === 'gold' ? 'Gold' : m === 'silver' ? 'Silver' : 'Platinum',
        ticker: m === 'gold' ? 'XAU/USD' : m === 'silver' ? 'XAG/USD' : 'XPT/USD',
        category: 'metals' as const, price: metalPrices[m].price_usd, change: metalPrices[m].change_24h ?? 0,
        source: 'Live spot', routeSymbol: METAL_ROUTE_MAP[m], live: true, isWsLive: false,
        accentColor: METAL_META[m].spotColor, subCategory: 'spot',
      }));
  }, [metalPrices]);

  const cryptoBoard = useMemo<BoardItem[]>(() => {
    return ALL_SYMBOLS.filter(s => s.cat === 'crypto').map(symbol => {
      const coin = cryptoLookup[symbol.key];
      const ws = wsPrices[symbol.key];
      const price = ws?.price ?? coin?.current_price ?? 0;
      const change = ws?.change24h ?? coin?.price_change_percentage_24h ?? 0;
      return {
        id: symbol.key, name: coin?.name ?? fallbackCryptoName(symbol.label), ticker: symbol.label,
        category: 'crypto' as const, price, change,
        source: ws ? 'Binance WS' : coin ? 'CoinGecko' : 'Market',
        routeSymbol: symbol.key, live: price > 0, isWsLive: Boolean(ws?.price),
        accentColor: CATEGORY_COLORS.crypto,
        subCategory: CRYPTO_MAJOR_KEYS.has(symbol.key) ? 'major' : 'alt',
      };
    }).filter(i => i.price > 0);
  }, [cryptoLookup, wsPrices]);

  const energyBoard = useMemo<BoardItem[]>(() => {
    const liveEnergy = (energy ?? [])
      .filter(item => ENERGY_TICKER_TO_KEY[item.symbol])
      .map(item => ({
        id: item.symbol, name: item.name, ticker: `${item.symbol}/USD`,
        category: 'energy' as const, price: item.price, change: item.change,
        source: 'EIA', routeSymbol: ENERGY_TICKER_TO_KEY[item.symbol],
        live: true, isWsLive: false, accentColor: CATEGORY_COLORS.energy, subCategory: 'commodities',
      })).filter(i => i.price > 0);

    const liveKeys = new Set(liveEnergy.map(e => e.routeSymbol));
    const syntheticEnergy = ALL_SYMBOLS
      .filter(s => s.cat === 'energy' && !liveKeys.has(s.key) && SYNTHETIC_PRICES[s.key])
      .map(s => ({
        id: s.key, name: s.label, ticker: `${s.ticker}/USD`,
        category: 'energy' as const, price: SYNTHETIC_PRICES[s.key].p, change: SYNTHETIC_PRICES[s.key].c,
        source: 'Market', routeSymbol: s.key, live: false, isWsLive: false,
        accentColor: CATEGORY_COLORS.energy, subCategory: 'commodities',
      }));

    // O&G company stocks that belong under energy
    const ogCompanies = ALL_SYMBOLS
      .filter(s => s.cat === 'stocks' && OG_COMPANY_KEYS.has(s.key) && SYNTHETIC_PRICES[s.key])
      .map(s => ({
        id: s.key, name: s.label, ticker: s.ticker,
        category: 'energy' as const, price: SYNTHETIC_PRICES[s.key].p, change: SYNTHETIC_PRICES[s.key].c,
        source: 'Market', routeSymbol: s.key, live: false, isWsLive: false,
        accentColor: CATEGORY_COLORS.energy, subCategory: 'companies',
      }));

    return [...liveEnergy, ...syntheticEnergy, ...ogCompanies];
  }, [energy]);

  const stocksBoard = useMemo<BoardItem[]>(() => {
    return ALL_SYMBOLS
      .filter(s => s.cat === 'stocks' && !OG_COMPANY_KEYS.has(s.key) && SYNTHETIC_PRICES[s.key])
      .map(s => ({
        id: s.key, name: s.label, ticker: s.ticker,
        category: 'stocks' as const, price: SYNTHETIC_PRICES[s.key].p, change: SYNTHETIC_PRICES[s.key].c,
        source: 'Market', routeSymbol: s.key, live: false, isWsLive: false,
        accentColor: CATEGORY_COLORS.stocks,
        subCategory: INDICES_MEGA_KEYS.has(s.key) ? 'indices' : TECH_KEYS.has(s.key) ? 'tech' : FINANCIAL_KEYS.has(s.key) ? 'financial' : 'indices',
      }));
  }, []);

  const forexBoard = useMemo<BoardItem[]>(() => {
    return ALL_SYMBOLS
      .filter(s => s.cat === 'forex' && SYNTHETIC_PRICES[s.key])
      .map(s => ({
        id: s.key, name: s.label, ticker: s.ticker,
        category: 'forex' as const, price: SYNTHETIC_PRICES[s.key].p, change: SYNTHETIC_PRICES[s.key].c,
        source: 'Market', routeSymbol: s.key, live: false, isWsLive: false,
        accentColor: CATEGORY_COLORS.forex, subCategory: 'all',
      }));
  }, []);

  const bondsBoard = useMemo<BoardItem[]>(() => {
    return ALL_SYMBOLS
      .filter(s => s.cat === 'bonds' && SYNTHETIC_PRICES[s.key])
      .map(s => ({
        id: s.key, name: s.label, ticker: s.ticker,
        category: 'bonds' as const, price: SYNTHETIC_PRICES[s.key].p, change: SYNTHETIC_PRICES[s.key].c,
        source: 'Market', routeSymbol: s.key, live: false, isWsLive: false,
        accentColor: CATEGORY_COLORS.bonds, subCategory: s.sub ?? 'all',
      }));
  }, []);

  const buildSyntheticBoard = (catKey: FeedCategory): BoardItem[] => {
    return ALL_SYMBOLS
      .filter(s => s.cat === catKey && SYNTHETIC_PRICES[s.key])
      .map(s => ({
        id: s.key, name: s.label, ticker: s.ticker,
        category: catKey, price: SYNTHETIC_PRICES[s.key].p, change: SYNTHETIC_PRICES[s.key].c,
        source: 'Market', routeSymbol: s.key, live: false, isWsLive: false,
        accentColor: CATEGORY_COLORS[catKey] ?? CATEGORY_COLORS.stocks, subCategory: s.sub ?? 'all',
      }));
  };

  const agricultureBoard = useMemo<BoardItem[]>(() => buildSyntheticBoard('agriculture'), []);
  const mineralsBoard = useMemo<BoardItem[]>(() => buildSyntheticBoard('minerals'), []);
  const reitsBoard = useMemo<BoardItem[]>(() => buildSyntheticBoard('reits'), []);
  const etfsBoard = useMemo<BoardItem[]>(() => buildSyntheticBoard('etfs'), []);

  /* ─── Combined + filtered by active category ─── */
  const allBoards: Record<MarketCategoryKey, BoardItem[]> = useMemo(() => ({
    overview: [],
    metals: metalsBoard,
    crypto: cryptoBoard,
    energy: energyBoard,
    stocks: stocksBoard,
    forex: forexBoard,
    bonds: bondsBoard,
    agriculture: agricultureBoard,
    minerals: mineralsBoard,
    reits: reitsBoard,
    etfs: etfsBoard,
  }), [metalsBoard, cryptoBoard, energyBoard, stocksBoard, forexBoard, bondsBoard, agricultureBoard, mineralsBoard, reitsBoard, etfsBoard]);

  const allItems = useMemo(() => [
    ...metalsBoard, ...cryptoBoard, ...energyBoard, ...stocksBoard,
    ...forexBoard, ...bondsBoard, ...agricultureBoard, ...mineralsBoard,
    ...reitsBoard, ...etfsBoard,
  ], [metalsBoard, cryptoBoard, energyBoard, stocksBoard, forexBoard, bondsBoard, agricultureBoard, mineralsBoard, reitsBoard, etfsBoard]);
  const topMovers = useMemo(() => allItems.filter(i => i.price > 0).sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 4), [allItems]);

  const activeCategoryItems = useMemo(() => {
    const items = allBoards[activeCategory] ?? [];
    if (activeSubCategory === 'all') return items.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    return items.filter(i => i.subCategory === activeSubCategory).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [allBoards, activeCategory, activeSubCategory]);

  /* Reserve cards for metals vault sub-tab */
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

  const totalAssets = allItems.length;
  const subCats = SUB_CATEGORIES[activeCategory];

  /* ─── Render extra widgets for certain sub-categories ─── */
  const renderExtraWidgets = () => {
    if (activeCategory === 'metals' && activeSubCategory === 'vault') {
      return (
        <div className="space-y-8 mt-8">
          <div className="grid gap-4 xl:grid-cols-3">
            {reserveCards.map(card => (
              <ReserveCard key={card.metal} card={card} onClick={() => navigate(`/trading-bridge?symbol=${METAL_ROUTE_MAP[card.metal]}`)} />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <GAMetalProfile />
            <GABullionHeatmap />
          </div>
        </div>
      );
    }
    if (activeCategory === 'metals' && activeSubCategory === 'all') {
      return (
        <div className="mt-8 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <GAMetalProfile />
          <GABullionHeatmap />
        </div>
      );
    }
    if (activeCategory === 'crypto' && (activeSubCategory === 'all' || activeSubCategory === 'major')) {
      return (
        <div className="mt-8">
          <GACryptoPriceCards />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-navy text-marble">
      <Header />

      {/* Compact Hero */}
      <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-navy">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--gold)/0.14),transparent_42%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

        <div className="container relative z-10 px-4 py-10 md:py-14">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5 text-xs font-display tracking-[0.24em] text-gold-light">
              <Shield className="h-3.5 w-3.5" />
              LIVE MARKET DATA
            </div>

            <h1 className="font-display text-4xl tracking-[0.08em] text-marble md:text-5xl lg:text-6xl flex items-center justify-center gap-4">
              <img src={goldArrowLogo} alt="Gold Arrow" className="w-10 h-10 md:w-14 md:h-14 object-contain" />
              GOLD ARROW <span className="gold-shimmer">MARKETPLACE</span>
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-marble/60">
              {totalAssets}+ instruments across 6 asset classes. Tap any asset to trade instantly.
            </p>
          </div>

          {/* Category Tabs — immediately visible */}
          <div className="mt-8 -mx-4 px-4 overflow-x-auto scrollbar-thin">
            <div className="flex flex-nowrap md:flex-wrap md:justify-center gap-2 min-w-max md:min-w-0">
              {/* Overview tab */}
              <button
                onClick={() => handleCategoryChange('overview' as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded border transition-all text-[10px] font-display tracking-[0.2em] whitespace-nowrap shrink-0 md:shrink ${
                  activeCategory === ('overview' as any)
                    ? 'border-gold bg-gold/10 text-gold shadow-[0_0_12px_hsla(43,72%,50%,0.15)]'
                    : 'border-gold/20 text-marble/50 hover:text-gold hover:border-gold/50'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                OVERVIEW
              </button>
              {MARKET_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.key;
                const count = allBoards[cat.key]?.length ?? 0;
                return (
                  <button
                    key={cat.key}
                    onClick={() => handleCategoryChange(cat.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded border transition-all text-[10px] font-display tracking-[0.2em] whitespace-nowrap shrink-0 md:shrink ${
                      isActive
                        ? 'border-gold bg-gold/10 text-gold shadow-[0_0_12px_hsla(43,72%,50%,0.15)]'
                        : 'border-gold/20 text-marble/50 hover:text-gold hover:border-gold/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label.toUpperCase()}
                    <span className="text-[8px] text-marble/30">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="greek-key-border-rich h-2" />

      {/* Active Category Content */}
      <main className="container px-4 py-10 md:py-14">
        {activeCategory === ('overview' as any) ? (
          /* ─── Overview tab: stats + movers + market summary ─── */
          <div className="space-y-10">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Activity} label="Instruments" value={String(totalAssets)} detail="Available to trade now" />
              <StatCard icon={Coins} label="Cryptocurrencies" value={String(cryptoBoard.length)} detail="Live WebSocket prices" />
              <StatCard icon={Gem} label="Precious metals" value={String(metalsBoard.length)} detail="Spot prices updated live" />
              <StatCard icon={BarChart3} label="Asset classes" value="6" detail="Metals · Crypto · Energy · Equities · Forex · Bonds" />
            </div>

            <div>
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-display text-sm tracking-[0.22em] text-gold-light">TOP MOVERS</p>
                  <p className="mt-1 text-sm text-marble/55">Biggest 24h moves — tap to trade</p>
                </div>
                <button type="button" onClick={() => navigate('/intelligence')}
                  className="inline-flex items-center gap-2 rounded-sm border border-gold/20 bg-secondary/35 px-4 py-2 text-sm font-display tracking-[0.16em] text-marble transition-colors hover:border-gold/35 hover:text-gold-light">
                  <Sparkles className="h-4 w-4" /> Intelligence
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {topMovers.map(item => <MoverCard key={item.id} item={item} />)}
              </div>
            </div>

            <GAMarketSummary />
            <GACryptoPriceCards />
          </div>
        ) : (
          /* ─── Category content with sub-tabs ─── */
          <>
            {/* Sub-category pills */}
            {subCats.length > 1 && (
              <div className="overflow-x-auto scrollbar-thin mb-8 -mx-4 px-4">
                <div className="flex flex-nowrap md:flex-wrap md:justify-center gap-1.5 min-w-max md:min-w-0">
                  {subCats.map((sub) => {
                    const isActive = activeSubCategory === sub.key;
                    return (
                      <button
                        key={sub.key}
                        onClick={() => setActiveSubCategory(sub.key)}
                        className={`px-3 py-1.5 rounded text-[9px] font-display tracking-[0.15em] whitespace-nowrap transition-all border ${
                          isActive
                            ? 'border-gold/60 bg-gold/10 text-gold'
                            : 'border-gold/15 text-marble/40 hover:text-gold/70 hover:border-gold/30'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Instrument list */}
            <InstrumentList items={activeCategoryItems} search={search} setSearch={setSearch} />

            {/* Extra widgets per sub-category */}
            {renderExtraWidgets()}
          </>
        )}
      </main>

      <div className="greek-key-border-rich h-2" />
      <Footer />
    </div>
  );
};

export default Marketplace;
