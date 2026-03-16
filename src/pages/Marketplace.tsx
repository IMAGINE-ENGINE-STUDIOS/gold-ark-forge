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
import { ALL_SYMBOLS, CATEGORY_COLORS } from '@/data/tradingSymbols';
import {
  Search, Shield, Activity, Coins, Flame, Gem,
  ArrowUpRight, Sparkles,
} from 'lucide-react';

type FeedCategory = 'crypto' | 'energy' | 'metals';
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

interface ReserveCardData {
  metal: 'gold' | 'silver' | 'platinum';
  vaultOz: number;
  certifiedOz: number;
  barCount: number;
  spotPrice: number | null;
}

const CRYPTO_WS_KEYS = [
  'bitcoin', 'ethereum', 'solana', 'xrp', 'bnb', 'cardano', 'avalanche',
  'polkadot', 'chainlink', 'dogecoin', 'polygon', 'litecoin', 'uniswap',
  'near', 'aptos', 'sui', 'arbitrum', 'optimism', 'injective', 'render',
  'filecoin', 'cosmos', 'stellar', 'hedera', 'tron', 'shiba', 'pepe',
] as const;

const WS_KEY_BY_SYMBOL: Record<string, string> = {
  btc: 'bitcoin', eth: 'ethereum', sol: 'solana', xrp: 'xrp', bnb: 'bnb',
  ada: 'cardano', avax: 'avalanche', dot: 'polkadot', link: 'chainlink',
  doge: 'dogecoin', matic: 'polygon', pol: 'polygon', ltc: 'litecoin',
  uni: 'uniswap', near: 'near', apt: 'aptos', sui: 'sui', arb: 'arbitrum',
  op: 'optimism', inj: 'injective', render: 'render', rndr: 'render',
  fil: 'filecoin', atom: 'cosmos', xlm: 'stellar', hbar: 'hedera',
  trx: 'tron', shib: 'shiba', pepe: 'pepe',
};

const CRYPTO_ID_BY_KEY: Record<string, string> = {
  bitcoin: 'bitcoin',
  ethereum: 'ethereum',
  solana: 'solana',
  xrp: 'ripple',
  bnb: 'binancecoin',
  cardano: 'cardano',
  avalanche: 'avalanche-2',
  polkadot: 'polkadot',
  chainlink: 'chainlink',
  dogecoin: 'dogecoin',
  polygon: 'matic-network',
  litecoin: 'litecoin',
  uniswap: 'uniswap',
  near: 'near',
  aptos: 'aptos',
  sui: 'sui',
  arbitrum: 'arbitrum',
  optimism: 'optimism',
  injective: 'injective-protocol',
  render: 'render-token',
  filecoin: 'filecoin',
  cosmos: 'cosmos',
  stellar: 'stellar',
  hedera: 'hedera-hashgraph',
  tron: 'tron',
  shiba: 'shiba-inu',
  pepe: 'pepe',
};

const SUPPORTED_CRYPTO_SYMBOLS = ALL_SYMBOLS.filter(({ cat }) => cat === 'crypto');

const ENERGY_ROUTE_BY_SYMBOL: Record<string, string> = {
  CL: 'oil', BZ: 'brent', NG: 'natgas', HO: 'heating_oil', RB: 'rbob',
};

const METAL_ROUTE_MAP: Record<string, string> = {
  gold: 'gold', silver: 'silver', platinum: 'platinum',
};

const FILTERS: { key: BoardFilter; label: string; icon: typeof Activity }[] = [
  { key: 'all', label: 'ALL FEEDS', icon: Activity },
  { key: 'metals', label: 'METALS', icon: Gem },
  { key: 'crypto', label: 'CRYPTO', icon: Coins },
  { key: 'energy', label: 'ENERGY', icon: Flame },
];

const METAL_META = {
  gold: {
    label: 'Gold Reserve',
    accent: 'text-gold',
    chip: 'border-gold/25 bg-gold/10 text-gold-light',
    spotColor: 'hsl(43, 72%, 50%)',
    marketSymbol: 'XAU/USD',
  },
  silver: {
    label: 'Silver Reserve',
    accent: 'text-silver-light',
    chip: 'border-silver/25 bg-silver/10 text-silver-light',
    spotColor: 'hsl(210, 6%, 67%)',
    marketSymbol: 'XAG/USD',
  },
  platinum: {
    label: 'Platinum Reserve',
    accent: 'text-platinum-light',
    chip: 'border-platinum/25 bg-platinum/10 text-platinum-light',
    spotColor: 'hsl(210, 4%, 76%)',
    marketSymbol: 'XPT/USD',
  },
} as const;

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

/* ─── LiveDot: pulsing dot for live feeds ─── */
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
            <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-display tracking-[0.18em] text-primary">VERIFIED</span>
            {item.live && <LiveDot />}
            <span className="text-xs font-mono text-marble/45">{item.source}</span>
          </div>
          <h2 className="font-display text-2xl tracking-[0.06em] text-marble">{item.name}</h2>
          <p className="mt-1 text-sm text-marble/55">{item.ticker}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <ArrowUpRight className="h-5 w-5 text-gold/60 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          <span className="text-[9px] font-display tracking-[0.2em] text-gold/50">SWAP</span>
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
  const categoryClass = item.category === 'crypto'
    ? 'border-gold/20 bg-gold/10 text-gold-light'
    : item.category === 'metals'
      ? 'border-gold/25 bg-gold/15 text-gold'
      : 'border-primary/20 bg-primary/10 text-primary';

  return (
    <button
      type="button"
      onClick={() => navigate(`/trading-bridge?symbol=${item.routeSymbol}`)}
      className="grid w-full grid-cols-[52px_minmax(0,1.2fr)_minmax(0,1fr)] items-center gap-4 border-b border-gold/10 px-4 py-4 text-left transition-colors hover:bg-secondary/35 md:px-6 group cursor-pointer"
    >
      <div className="text-right font-mono text-sm text-marble/40">{rank}</div>
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-display tracking-[0.18em] ${categoryClass}`}>
            {item.category}
          </span>
          {item.live && <LiveDot />}
          <span className="text-[10px] font-display tracking-[0.16em] text-gold/40 opacity-0 transition-opacity group-hover:opacity-100">
            OPEN IN SWAP →
          </span>
        </div>
        <div className="font-display text-lg tracking-[0.04em] text-marble md:text-xl">{item.name}</div>
        <div className="text-sm text-marble/50">{item.ticker} · {item.source}</div>
      </div>

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
    </button>
  );
};

const ReserveCard = ({ card, onClick }: { card: ReserveCardData; onClick: () => void }) => {
  const meta = METAL_META[card.metal];
  const reserveValue = card.spotPrice ? card.certifiedOz * card.spotPrice : 0;

  return (
    <button type="button" onClick={onClick} className="rounded-sm border border-gold/15 bg-secondary/40 p-6 shadow-card text-left transition-all hover:border-gold/30 hover:shadow-gold group w-full">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-display tracking-[0.18em] ${meta.chip}`}>VERIFIED REGISTRY</div>
          <h3 className={`mt-3 font-display text-2xl tracking-[0.06em] ${meta.accent}`}>{meta.label}</h3>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Gem className={`h-5 w-5 ${meta.accent}`} />
          <span className="text-[9px] font-display tracking-[0.16em] text-gold/40 opacity-0 transition-opacity group-hover:opacity-100">SWAP →</span>
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
        <div className="rounded-sm border border-gold/10 bg-background/5 p-4">
          <div className="text-marble/45">Vault ounces</div>
          <div className="mt-1 font-mono text-2xl text-marble">{formatCompact(card.vaultOz)} oz</div>
        </div>
        <div className="rounded-sm border border-gold/10 bg-background/5 p-4">
          <div className="text-marble/45">Bars in custody</div>
          <div className="mt-1 font-mono text-2xl text-marble">{card.barCount}</div>
        </div>
        <div className="rounded-sm border border-gold/10 bg-background/5 p-4">
          <div className="text-marble/45">Reserve value</div>
          <div className="mt-1 font-mono text-2xl text-marble">{reserveValue > 0 ? formatPrice(reserveValue) : '—'}</div>
        </div>
      </div>
    </button>
  );
};

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

  const cryptoLookup = useMemo(() => {
    const byKey: Record<string, NonNullable<typeof crypto>[number]> = {};

    (crypto ?? []).forEach(coin => {
      const supportedKey = Object.entries(CRYPTO_ID_BY_KEY).find(([, id]) => id === coin.id)?.[0]
        ?? WS_KEY_BY_SYMBOL[coin.symbol]
        ?? coin.id;
      byKey[supportedKey] = coin;
    });

    return byKey;
  }, [crypto]);

  /* ─── Metals board items ─── */
  const metalsBoard = useMemo<BoardItem[]>(() => {
    if (!metalPrices) return [];

    return (['gold', 'silver', 'platinum'] as const)
      .filter(m => metalPrices[m]?.price_usd > 0)
      .map(m => ({
        id: `metal-${m}`,
        name: m === 'gold' ? 'Gold (XAU)' : m === 'silver' ? 'Silver (XAG)' : 'Platinum (XPT)',
        ticker: m === 'gold' ? 'XAU/USD' : m === 'silver' ? 'XAG/USD' : 'XPT/USD',
        category: 'metals' as const,
        price: metalPrices[m].price_usd,
        change: metalPrices[m].change_24h ?? 0,
        source: 'Vault registry',
        routeSymbol: METAL_ROUTE_MAP[m],
        live: true,
        isWsLive: false,
        accentColor: METAL_META[m].spotColor,
      }));
  }, [metalPrices]);

  /* ─── Crypto board items (SWAP-supported only) ─── */
  const cryptoBoard = useMemo<BoardItem[]>(() => {
    return SUPPORTED_CRYPTO_SYMBOLS
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
          source: ws ? 'Binance stream' : coin ? 'CoinGecko' : 'Market feed',
          routeSymbol: symbol.key,
          live: price > 0,
          isWsLive: Boolean(ws?.price),
          accentColor: CATEGORY_COLORS.crypto,
        };
      })
      .filter(item => item.price > 0);
  }, [cryptoLookup, wsPrices]);

  /* ─── Energy board items ─── */
  const energyBoard = useMemo<BoardItem[]>(() => {
    return (energy ?? [])
      .filter(item => ENERGY_ROUTE_BY_SYMBOL[item.symbol])
      .map(item => ({
        id: item.symbol,
        name: item.name,
        ticker: `${item.symbol}/USD`,
        category: 'energy' as const,
        price: item.price,
        change: item.change,
        source: 'EIA feed',
        routeSymbol: ENERGY_ROUTE_BY_SYMBOL[item.symbol],
        live: true,
        isWsLive: false,
        accentColor: CATEGORY_COLORS.energy,
      }))
      .filter(item => item.price > 0);
  }, [energy]);

  const boardItems = useMemo(() => {
    return [...metalsBoard, ...cryptoBoard, ...energyBoard].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [metalsBoard, cryptoBoard, energyBoard]);

  const filteredBoard = useMemo(() => {
    const query = search.trim().toLowerCase();
    return boardItems.filter(item => {
      const matchesFilter = filter === 'all' ? true : item.category === filter;
      const matchesQuery = query ? item.name.toLowerCase().includes(query) || item.ticker.toLowerCase().includes(query) : true;
      return matchesFilter && matchesQuery;
    });
  }, [boardItems, filter, search]);

  const topMovers = useMemo(() => boardItems.slice(0, 4), [boardItems]);

  const reserveCards = useMemo<ReserveCardData[]>(() => {
    const grouped = { gold: [] as any[], silver: [] as any[], platinum: [] as any[] };
    (bars ?? []).forEach(bar => { grouped[bar.metal_type].push(bar); });
    return (['gold', 'silver', 'platinum'] as const).map(metal => ({
      metal,
      vaultOz: grouped[metal].reduce((sum: number, bar: any) => sum + Number(bar.weight_oz), 0),
      certifiedOz: Number(reserveTotals?.[`${metal}_oz` as keyof typeof reserveTotals] ?? 0),
      barCount: grouped[metal].length,
      spotPrice: metalPrices?.[metal]?.price_usd ?? null,
    }));
  }, [bars, reserveTotals, metalPrices]);

  const totalBars = bars?.length ?? 0;
  const totalCertifiedOz = reserveCards.reduce((sum, card) => sum + card.certifiedOz, 0);
  const liveFeedCount = boardItems.length;

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
              VERIFIED REAL-TIME MARKET FEEDS
            </div>

            <h1 className="font-display text-5xl tracking-[0.08em] text-marble md:text-7xl lg:text-8xl">
              PAX ROMANA
              <span className="mt-2 block gold-shimmer">MARKETPLACE</span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-marble/72 md:text-xl">
              Every price streams in real-time. Click any asset to open it directly in the SWAP trading terminal.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Activity} label="Live feeds" value={String(liveFeedCount)} detail="Real-time streaming prices." />
            <StatCard icon={Gem} label="Precious metals" value={String(metalsBoard.length)} detail="Spot prices from vault registry." />
            <StatCard icon={Coins} label="Crypto board" value={String(cryptoBoard.length)} detail="WebSocket-backed majors & alts." />
            <StatCard icon={Flame} label="Energy board" value={String(energyBoard.length)} detail="Live petroleum & gas benchmarks." />
          </div>

          <div className="mt-12">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-display text-sm tracking-[0.22em] text-gold-light">MARKET LEADERS</p>
                <p className="mt-1 text-sm text-marble/55">Click any asset to open in SWAP terminal.</p>
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
                <p className="font-display text-sm tracking-[0.22em] text-gold-light">VERIFIED LIVE BOARD</p>
                <h2 className="mt-2 font-display text-3xl tracking-[0.05em] text-marble md:text-4xl">
                  Real-time feeds
                </h2>
                <p className="mt-2 max-w-2xl text-base text-marble/60">
                  All prices stream live. Click any row to open the asset in the SWAP trading chart.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 lg:max-w-2xl lg:flex-row lg:items-center lg:justify-end">
                <label className="relative block w-full lg:max-w-sm">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-marble/35" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search assets..."
                    className="w-full rounded-sm border border-gold/15 bg-background/5 py-3 pl-11 pr-4 text-base text-marble placeholder:text-marble/35 focus:border-gold/35 focus:outline-none"
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  {FILTERS.map(({ key, label, icon: Icon }) => {
                    const active = filter === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFilter(key)}
                        className={`inline-flex items-center gap-2 rounded-sm border px-4 py-3 text-sm font-display tracking-[0.16em] transition-all ${
                          active
                            ? 'border-gold/40 bg-gold/15 text-gold-light'
                            : 'border-gold/10 bg-secondary/30 text-marble/70 hover:border-gold/25 hover:text-marble'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[52px_minmax(0,1.2fr)_minmax(0,1fr)] gap-4 px-4 py-3 text-xs font-display tracking-[0.22em] text-marble/45 md:px-6">
            <div className="text-right">#</div>
            <div>INSTRUMENT</div>
            <div>LIVE SPOT</div>
          </div>

          <div>
            {filteredBoard.length > 0 ? (
              filteredBoard.map((item, index) => <FeedRow key={item.id} item={item} rank={index + 1} />)
            ) : (
              <div className="px-6 py-14 text-center">
                <h3 className="font-display text-2xl tracking-[0.08em] text-marble">No verified matches</h3>
                <p className="mt-2 text-base text-marble/55">Try another search or switch back to all feeds.</p>
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
            <p className="font-display text-sm tracking-[0.22em] text-gold-light">BULLION RESERVE REGISTRY</p>
            <h2 className="mt-2 font-display text-3xl tracking-[0.05em] text-marble md:text-4xl">
              Verified custody — click to trade
            </h2>
            <p className="mt-2 text-base text-marble/60">
              Each metal card links directly to its SWAP chart. Prices update in real-time from vault registry feeds.
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
