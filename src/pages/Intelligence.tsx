import Header from '@/components/Header';
import Footer from '@/components/Footer';

// TradingView free widgets
import TradingViewTicker from '@/components/tradingview/TradingViewTicker';
import TradingViewChart from '@/components/tradingview/TradingViewChart';
import TradingViewTechnicalAnalysis from '@/components/tradingview/TradingViewTechnicalAnalysis';
import TradingViewTopStories from '@/components/tradingview/TradingViewTopStories';
import TradingViewHeatmap from '@/components/tradingview/TradingViewHeatmap';
import TradingViewCryptoMarket from '@/components/tradingview/TradingViewCryptoMarket';
import TradingViewEconomicCalendar from '@/components/tradingview/TradingViewEconomicCalendar';
import TradingViewSingleTicker from '@/components/tradingview/TradingViewSingleTicker';
// NEW: Missing showroom widgets
import TradingViewTickers from '@/components/tradingview/TradingViewTickers';
import TradingViewSymbolInfo from '@/components/tradingview/TradingViewSymbolInfo';
import TradingViewSnaps from '@/components/tradingview/TradingViewSnaps';
import TradingViewMiniChart from '@/components/tradingview/TradingViewMiniChart';
import SymbolOverview from '@/components/tradingview/SymbolOverview';
import TradingViewFundamentalData from '@/components/tradingview/TradingViewFundamentalData';
import TradingViewCompanyProfile from '@/components/tradingview/TradingViewCompanyProfile';
import TradingViewMarketOverview from '@/components/tradingview/TradingViewMarketOverview';
import TradingViewMarketQuotes from '@/components/tradingview/TradingViewMarketQuotes';
import TradingViewHotlists from '@/components/tradingview/TradingViewHotlists';
import TradingViewStockMarket from '@/components/tradingview/TradingViewStockMarket';
import TradingViewForexCrossRates from '@/components/tradingview/TradingViewForexCrossRates';
import TradingViewForexHeatmap from '@/components/tradingview/TradingViewForexHeatmap';
import TradingViewScreener from '@/components/tradingview/TradingViewScreener';
import WidgetCarousel from '@/components/tradingview/WidgetCarousel';

// Blockchain live widgets (free APIs)
import GABitcoinNetwork from '@/components/ga-widgets/GABitcoinNetwork';
import GAEthereumNetwork from '@/components/ga-widgets/GAEthereumNetwork';
import GAXRPLedger from '@/components/ga-widgets/GAXRPLedger';
import GATronNetwork from '@/components/ga-widgets/GATronNetwork';
import GASECFilings from '@/components/ga-widgets/GASECFilings';

// Proprietary widgets (Lovable Cloud DB)
import GAPriceCards from '@/components/ga-widgets/GAPriceCards';
import GAReserveGauge from '@/components/ga-widgets/GAReserveGauge';
import GAVaultMatrix from '@/components/ga-widgets/GAVaultMatrix';
import GACertificateFlow from '@/components/ga-widgets/GACertificateFlow';
import GAReserveTimeline from '@/components/ga-widgets/GAReserveTimeline';
import GABullionHeatmap from '@/components/ga-widgets/GABullionHeatmap';
import GAPartnerNetwork from '@/components/ga-widgets/GAPartnerNetwork';
import GAActivityFeed from '@/components/ga-widgets/GAActivityFeed';
import GAMetalScreener from '@/components/ga-widgets/GAMetalScreener';
import GAMetalProfile from '@/components/ga-widgets/GAMetalProfile';
import GAAnchorStatus from '@/components/ga-widgets/GAAnchorStatus';
import GACryptoMarket from '@/components/ga-widgets/GACryptoMarket';
import GAFearGreed from '@/components/ga-widgets/GAFearGreed';
import GADeFiDashboard from '@/components/ga-widgets/GADeFiDashboard';
import GAWhaleWatch from '@/components/ga-widgets/GAWhaleWatch';
import GAGoldRatio from '@/components/ga-widgets/GAGoldRatio';
import WidgetShell from '@/components/ga-widgets/WidgetShell';

import {
  Shield, BarChart3, Vault, FileCheck2, History, Grid3X3, TrendingUp,
  Gauge, Building2, Network, SlidersHorizontal, Layers,
  Bitcoin, Newspaper, CalendarDays, LayoutGrid, FileText, Fish,
  DollarSign, LineChart, Info, Eye, Briefcase, Globe, Flame, BarChart, ArrowLeftRight,
} from 'lucide-react';

const sections = [
  // Market Data (free)
  { id: 'prices', label: 'PRICES', icon: TrendingUp },
  { id: 'tickers-strip', label: 'TICKERS', icon: DollarSign },
  { id: 'mini-charts', label: 'MINI', icon: LineChart },
  { id: 'symbol-overview', label: 'OVERVIEW', icon: Eye },
  { id: 'chart', label: 'CHART', icon: BarChart3 },
  { id: 'analysis', label: 'ANALYSIS', icon: Gauge },
  { id: 'fundamentals', label: 'FUNDMNTL', icon: Briefcase },
  { id: 'crypto', label: 'CRYPTO', icon: Layers },
  { id: 'news', label: 'NEWS', icon: Newspaper },
  { id: 'market-overview', label: 'MARKETS', icon: Globe },
  { id: 'hotlists', label: 'HOT', icon: Flame },
  { id: 'forex', label: 'FOREX', icon: ArrowLeftRight },
  { id: 'heatmap-stocks', label: 'STOCKS', icon: LayoutGrid },
  { id: 'screener-commodities', label: 'COMMODS', icon: BarChart },
  { id: 'calendar', label: 'CALENDAR', icon: CalendarDays },
  // Blockchain Live (free)
  { id: 'bitcoin', label: 'BITCOIN', icon: Bitcoin },
  { id: 'ethereum', label: 'ETHEREUM', icon: Network },
  { id: 'xrp', label: 'XRP', icon: Layers },
  { id: 'tron', label: 'TRON', icon: Layers },
  { id: 'whales', label: 'WHALES', icon: Fish },
  { id: 'sec', label: 'SEC', icon: FileText },
  // DeFi & Sentiment (free)
  { id: 'defi', label: 'DeFi TVL', icon: Layers },
  { id: 'sentiment', label: 'SENTIMENT', icon: Gauge },
  { id: 'crypto-market', label: 'COINS', icon: Layers },
  // Proprietary
  { id: 'ratios', label: 'RATIOS', icon: BarChart3 },
  { id: 'reserves', label: 'RESERVES', icon: Shield },
  { id: 'profiles', label: 'PROFILES', icon: Layers },
  { id: 'vault', label: 'VAULT', icon: Vault },
  { id: 'heatmap', label: 'BULLION', icon: Grid3X3 },
  { id: 'screener', label: 'SCREENER', icon: SlidersHorizontal },
  { id: 'certs', label: 'CERTS', icon: FileCheck2 },
  { id: 'anchors', label: 'ANCHORS', icon: Network },
  { id: 'activity', label: 'ACTIVITY', icon: History },
  { id: 'partners', label: 'PARTNERS', icon: Building2 },
  { id: 'timeline', label: 'TIMELINE', icon: History },
];

const SectionDivider = ({ label }: { label: string }) => (
  <div className="divider-ornate mb-8">
    <span className="font-display text-xs tracking-[0.3em] text-gold/50">{label}</span>
  </div>
);

const TierBanner = ({ label, sub }: { label: string; sub: string }) => (
  <div className="relative py-6 mb-8">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent" />
    <div className="relative text-center">
      <h2 className="font-display text-2xl tracking-[0.2em] text-gold-light">{label}</h2>
      <p className="text-[10px] font-display tracking-[0.3em] text-marble/30 mt-1">{sub}</p>
    </div>
  </div>
);

const Intelligence = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-navy">
      <Header />

      {/* Live Ticker - TradingView free widget */}
      <TradingViewTicker />

      {/* Hero Banner */}
      <div className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-dark via-navy to-navy-light opacity-80" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at 30% 50%, hsla(43, 72%, 50%, 0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, hsla(210, 6%, 67%, 0.04) 0%, transparent 50%)'
        }} />

        <div className="relative container mx-auto px-6 text-center">
          <div className="divider-ornate mb-6">
            <span className="font-display text-[10px] tracking-[0.4em] text-gold/60">PROPRIETARY ANALYTICS</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-marble tracking-[0.05em] mb-4">
            MARKET <span className="text-gradient-gold">INTELLIGENCE</span>
          </h1>
          <p className="text-marble/50 text-lg max-w-2xl mx-auto font-body leading-relaxed">
            Real-time institutional analytics powered by free public APIs, blockchain networks,
            and Gold Arrow's internal data streams — all in one view, zero intermediaries.
          </p>

          {/* Section Nav */}
          <div className="flex flex-wrap justify-center gap-2 mt-10">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded border border-gold/20 text-marble/50 hover:text-gold hover:border-gold/50 transition-all text-[10px] font-display tracking-[0.2em]"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="greek-key-border-rich h-2" />

      {/* ═══════════════════ TIER 1: MARKET DATA (FREE) ═══════════════════ */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        <TierBanner label="MARKET DATA" sub="POWERED BY TRADINGVIEW · FREE · NO API KEYS" />

        {/* [1] Spot Prices */}
        <section id="prices">
          <SectionDivider label="SPOT PRICES" />
          <GAPriceCards />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <TradingViewSingleTicker symbol="BITSTAMP:BTCUSD" />
            <TradingViewSingleTicker symbol="BITSTAMP:ETHUSD" />
            <TradingViewSingleTicker symbol="BITSTAMP:XRPUSD" />
            <TradingViewSingleTicker symbol="BINANCE:TRXUSDT" />
          </div>
        </section>

        {/* [NEW] Tickers Strip */}
        <section id="tickers-strip">
          <SectionDivider label="TICKERS STRIP" />
          <WidgetShell icon={DollarSign} title="LIVE TICKERS" badge="MULTI-ASSET" source="TradingView">
            <WidgetCarousel
              variants={[
                {
                  label: 'Metals & Crypto',
                  render: () => <TradingViewTickers />,
                },
                {
                  label: 'Indices',
                  render: () => (
                    <TradingViewTickers symbols={[
                      { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
                      { proName: 'FOREXCOM:DJI', title: 'Dow Jones' },
                      { proName: 'FOREXCOM:NSXUSD', title: 'Nasdaq' },
                      { proName: 'TVC:UKX', title: 'FTSE 100' },
                    ]} />
                  ),
                },
                {
                  label: 'Forex',
                  render: () => (
                    <TradingViewTickers symbols={[
                      { proName: 'FX:EURUSD', title: 'EUR/USD' },
                      { proName: 'FX:GBPUSD', title: 'GBP/USD' },
                      { proName: 'FX:USDJPY', title: 'USD/JPY' },
                      { proName: 'FX:AUDUSD', title: 'AUD/USD' },
                    ]} />
                  ),
                },
              ]}
            />
          </WidgetShell>
        </section>

        {/* [NEW] Mini Charts */}
        <section id="mini-charts">
          <SectionDivider label="MINI CHARTS" />
          <WidgetShell icon={LineChart} title="COMPACT CHARTS" badge="QUICK VIEW" source="TradingView">
            <WidgetCarousel
              variants={[
                {
                  label: 'Metals',
                  render: () => (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <TradingViewMiniChart symbol="OANDA:XAUUSD" height={220} />
                      <TradingViewMiniChart symbol="OANDA:XAGUSD" height={220} />
                      <TradingViewMiniChart symbol="OANDA:XPTUSD" height={220} />
                    </div>
                  ),
                },
                {
                  label: 'Crypto',
                  render: () => (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <TradingViewMiniChart symbol="BITSTAMP:BTCUSD" height={220} />
                      <TradingViewMiniChart symbol="BITSTAMP:ETHUSD" height={220} />
                      <TradingViewMiniChart symbol="BINANCE:SOLUSD" height={220} />
                    </div>
                  ),
                },
                {
                  label: 'Stocks',
                  render: () => (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <TradingViewMiniChart symbol="NASDAQ:AAPL" height={220} />
                      <TradingViewMiniChart symbol="NASDAQ:GOOGL" height={220} />
                      <TradingViewMiniChart symbol="NASDAQ:TSLA" height={220} />
                    </div>
                  ),
                },
              ]}
            />
          </WidgetShell>
        </section>

        {/* [NEW] Multi-Asset Symbol Overview */}
        <section id="symbol-overview">
          <SectionDivider label="MULTI-ASSET OVERVIEW" />
          <WidgetShell icon={Eye} title="ASSET OVERVIEW" badge="MULTI-SYMBOL" source="TradingView">
            <SymbolOverview />
          </WidgetShell>
        </section>

        {/* [2] Advanced Chart */}
        <section id="chart">
          <SectionDivider label="ADVANCED CHART" />
          <WidgetShell icon={BarChart3} title="INTERACTIVE CHART" badge="FULL-FEATURED" source="TradingView">
            <WidgetCarousel
              variants={[
                { label: 'Gold', render: () => <TradingViewChart symbol="OANDA:XAUUSD" height={500} /> },
                { label: 'Silver', render: () => <TradingViewChart symbol="OANDA:XAGUSD" height={500} /> },
                { label: 'Bitcoin', render: () => <TradingViewChart symbol="BITSTAMP:BTCUSD" height={500} /> },
                { label: 'S&P 500', render: () => <TradingViewChart symbol="FOREXCOM:SPXUSD" height={500} /> },
              ]}
            />
          </WidgetShell>
        </section>

        {/* [3] Technical Analysis */}
        <section id="analysis">
          <SectionDivider label="TECHNICAL ANALYSIS" />
          <WidgetShell icon={Gauge} title="TECHNICAL SIGNALS" badge="BUY · SELL · NEUTRAL" source="TradingView">
            <WidgetCarousel
              variants={[
                {
                  label: 'Metals',
                  render: () => (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <TradingViewTechnicalAnalysis symbol="OANDA:XAUUSD" height={400} />
                      <TradingViewTechnicalAnalysis symbol="OANDA:XAGUSD" height={400} />
                    </div>
                  ),
                },
                {
                  label: 'Crypto',
                  render: () => (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <TradingViewTechnicalAnalysis symbol="BITSTAMP:BTCUSD" height={400} />
                      <TradingViewTechnicalAnalysis symbol="BITSTAMP:ETHUSD" height={400} />
                    </div>
                  ),
                },
              ]}
            />
          </WidgetShell>
        </section>

        {/* [NEW] Fundamental Data + Company Profile */}
        <section id="fundamentals">
          <SectionDivider label="FUNDAMENTALS & PROFILES" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <WidgetShell icon={Briefcase} title="FUNDAMENTAL DATA" badge="FINANCIALS" source="TradingView">
              <WidgetCarousel
                variants={[
                  { label: 'Apple', render: () => <TradingViewFundamentalData symbol="NASDAQ:AAPL" height={460} /> },
                  { label: 'Google', render: () => <TradingViewFundamentalData symbol="NASDAQ:GOOGL" height={460} /> },
                  { label: 'Tesla', render: () => <TradingViewFundamentalData symbol="NASDAQ:TSLA" height={460} /> },
                ]}
              />
            </WidgetShell>
            <WidgetShell icon={Info} title="COMPANY PROFILE" badge="OVERVIEW" source="TradingView">
              <WidgetCarousel
                variants={[
                  { label: 'Apple', render: () => <TradingViewCompanyProfile symbol="NASDAQ:AAPL" height={460} /> },
                  { label: 'Google', render: () => <TradingViewCompanyProfile symbol="NASDAQ:GOOGL" height={460} /> },
                  { label: 'Microsoft', render: () => <TradingViewCompanyProfile symbol="NASDAQ:MSFT" height={460} /> },
                ]}
              />
            </WidgetShell>
          </div>
        </section>

        {/* [4] Crypto Market */}
        <section id="crypto">
          <SectionDivider label="CRYPTO MARKET" />
          <WidgetShell icon={Layers} title="CRYPTOCURRENCY SCREENER" badge="LIVE" source="TradingView">
            <TradingViewCryptoMarket height={500} />
          </WidgetShell>
        </section>

        {/* [5] Market News */}
        <section id="news">
          <SectionDivider label="MARKET NEWS" />
          <WidgetShell icon={Newspaper} title="TOP STORIES" badge="REAL-TIME" source="TradingView">
            <WidgetCarousel
              variants={[
                {
                  label: 'Metals & Crypto',
                  render: () => (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <TradingViewTopStories symbol="OANDA:XAUUSD" height={450} />
                      <TradingViewTopStories symbol="BITSTAMP:BTCUSD" height={450} />
                    </div>
                  ),
                },
                {
                  label: 'Tech Stocks',
                  render: () => (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <TradingViewTopStories symbol="NASDAQ:AAPL" height={450} />
                      <TradingViewTopStories symbol="NASDAQ:TSLA" height={450} />
                    </div>
                  ),
                },
              ]}
            />
          </WidgetShell>
        </section>

        {/* [NEW] Market Overview + Market Quotes */}
        <section id="market-overview">
          <SectionDivider label="MARKET OVERVIEW" />
          <div className="space-y-8">
            <WidgetShell icon={Globe} title="GLOBAL MARKETS" badge="WATCHLIST" source="TradingView">
              <TradingViewMarketOverview height={500} />
            </WidgetShell>
            <WidgetShell icon={BarChart} title="MARKET QUOTES" badge="OHLC DATA" source="TradingView">
              <TradingViewMarketQuotes height={500} />
            </WidgetShell>
          </div>
        </section>

        {/* [NEW] Hotlists + Stock Market */}
        <section id="hotlists">
          <SectionDivider label="MARKET MOVERS" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <WidgetShell icon={Flame} title="HOTLISTS" badge="TOP MOVERS" source="TradingView">
              <WidgetCarousel
                variants={[
                  { label: 'US', render: () => <TradingViewHotlists exchange="US" height={460} /> },
                  { label: 'Europe', render: () => <TradingViewHotlists exchange="europe" height={460} /> },
                  { label: 'Asia', render: () => <TradingViewHotlists exchange="asia" height={460} /> },
                ]}
              />
            </WidgetShell>
            <WidgetShell icon={LayoutGrid} title="STOCK MARKET" badge="BY EXCHANGE" source="TradingView">
              <WidgetCarousel
                variants={[
                  { label: 'US', render: () => <TradingViewStockMarket exchange="US" height={460} /> },
                  { label: 'Germany', render: () => <TradingViewStockMarket exchange="germany" height={460} /> },
                  { label: 'UK', render: () => <TradingViewStockMarket exchange="UK" height={460} /> },
                ]}
              />
            </WidgetShell>
          </div>
        </section>

        {/* [NEW] Forex */}
        <section id="forex">
          <SectionDivider label="FOREX INTELLIGENCE" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <WidgetShell icon={ArrowLeftRight} title="CROSS RATES" badge="MATRIX" source="TradingView">
              <TradingViewForexCrossRates height={400} />
            </WidgetShell>
            <WidgetShell icon={Globe} title="FOREX HEATMAP" badge="STRENGTH" source="TradingView">
              <TradingViewForexHeatmap height={400} />
            </WidgetShell>
          </div>
        </section>

        {/* [7] Stock Heatmap */}
        <section id="heatmap-stocks">
          <SectionDivider label="STOCK HEATMAP" />
          <WidgetShell icon={LayoutGrid} title="SECTOR HEATMAP" badge="MARKET CAP" source="TradingView">
            <TradingViewHeatmap height={500} />
          </WidgetShell>
        </section>

        {/* [NEW] Commodity Screener */}
        <section id="screener-commodities">
          <SectionDivider label="COMMODITY SCREENER" />
          <WidgetShell icon={BarChart} title="COMMODITIES" badge="SCREENER" source="TradingView">
            <WidgetCarousel
              variants={[
                { label: 'Most Capitalized', render: () => <TradingViewScreener height={500} defaultScreen="most_capitalized" /> },
                { label: 'Top Gainers', render: () => <TradingViewScreener height={500} defaultScreen="top_gainers" /> },
                { label: 'Top Losers', render: () => <TradingViewScreener height={500} defaultScreen="top_losers" /> },
              ]}
            />
          </WidgetShell>
        </section>

        {/* [6] Economic Calendar */}
        <section id="calendar">
          <SectionDivider label="ECONOMIC CALENDAR" />
          <WidgetShell icon={CalendarDays} title="ECONOMIC EVENTS" badge="UPCOMING" source="TradingView">
            <TradingViewEconomicCalendar height={500} />
          </WidgetShell>
        </section>
      </div>

      <div className="greek-key-border-rich h-2" />

      {/* ═══════════════ TIER 2: BLOCKCHAIN LIVE (FREE) ═══════════════ */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        <TierBanner label="BLOCKCHAIN LIVE" sub="DIRECT FROM NETWORKS · ZERO INTERMEDIARIES" />

        <section id="bitcoin">
          <SectionDivider label="BITCOIN NETWORK" />
          <GABitcoinNetwork />
        </section>

        <section id="ethereum">
          <SectionDivider label="ETHEREUM NETWORK" />
          <GAEthereumNetwork />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section id="xrp">
            <SectionDivider label="XRP LEDGER" />
            <GAXRPLedger />
          </section>
          <section id="tron">
            <SectionDivider label="TRON NETWORK" />
            <GATronNetwork />
          </section>
        </div>

        <section id="sec">
          <SectionDivider label="SEC EDGAR FILINGS" />
          <GASECFilings />
        </section>

        <section id="whales">
          <SectionDivider label="WHALE WATCH" />
          <GAWhaleWatch />
        </section>
      </div>

      <div className="greek-key-border-rich h-2" />

      {/* ═══════════════ TIER 2.5: DeFi & SENTIMENT (FREE) ═══════════════ */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        <TierBanner label="DeFi & SENTIMENT" sub="FREE PUBLIC APIs · ZERO COST" />

        <section id="crypto-market">
          <SectionDivider label="CRYPTO MARKET OVERVIEW" />
          <GACryptoMarket />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section id="sentiment">
            <SectionDivider label="MARKET SENTIMENT" />
            <GAFearGreed />
          </section>
          <section id="defi">
            <SectionDivider label="DeFi TOTAL VALUE LOCKED" />
            <GADeFiDashboard />
          </section>
        </div>
      </div>

      {/* ═══════════════ TIER 3: PROPRIETARY (CLOUD DB) ═══════════════ */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        <TierBanner label="PROPRIETARY DATA" sub="GOLD ARROW INTERNAL · LOVABLE CLOUD" />

        <section id="ratios">
          <SectionDivider label="METAL RATIOS" />
          <GAGoldRatio />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section id="reserves">
            <SectionDivider label="RESERVE BACKING" />
            <GAReserveGauge />
          </section>
          <section id="timeline">
            <SectionDivider label="RESERVE HISTORY" />
            <GAReserveTimeline />
          </section>
        </div>

        <section id="profiles">
          <SectionDivider label="METAL PROFILES" />
          <GAMetalProfile />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section id="vault">
            <SectionDivider label="VAULT INVENTORY" />
            <GAVaultMatrix />
          </section>
          <section id="heatmap">
            <SectionDivider label="BULLION HEATMAP" />
            <GABullionHeatmap />
          </section>
        </div>

        <section id="screener">
          <SectionDivider label="BULLION SCREENER" />
          <GAMetalScreener />
        </section>

        <section id="certs">
          <SectionDivider label="CERTIFICATE REGISTRY" />
          <GACertificateFlow />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section id="anchors">
            <SectionDivider label="BITCOIN ANCHORS" />
            <GAAnchorStatus />
          </section>
          <section id="activity">
            <SectionDivider label="ANCHORED ACTIVITY" />
            <GAActivityFeed />
          </section>
        </div>

        <section id="partners">
          <SectionDivider label="PARTNER NETWORK" />
          <GAPartnerNetwork />
        </section>
      </div>

      <div className="greek-key-border-rich h-2" />
      <Footer />
    </div>
  );
};

export default Intelligence;
