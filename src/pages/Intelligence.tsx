import Header from '@/components/Header';
import Footer from '@/components/Footer';

// GA Custom Widgets — NO TradingView
import GAMultiTicker from '@/components/ga-widgets/GAMultiTicker';
import GAPriceCards from '@/components/ga-widgets/GAPriceCards';
import GACryptoPriceCards from '@/components/ga-widgets/GACryptoPriceCards';
import GAMiniCharts from '@/components/ga-widgets/GAMiniCharts';
import GAAssetOverview from '@/components/ga-widgets/GAAssetOverview';
import GAMetalChart from '@/components/ga-widgets/GAMetalChart';
import GALiveStandalone from '@/components/ga-widgets/GALiveStandalone';
import GATechnicalGauge from '@/components/ga-widgets/GATechnicalGauge';
import GAMetalProfile from '@/components/ga-widgets/GAMetalProfile';
import GAMarketSummary from '@/components/ga-widgets/GAMarketSummary';
import GAMarketQuotes from '@/components/ga-widgets/GAMarketQuotes';
import GATopMovers from '@/components/ga-widgets/GATopMovers';
import GANewsFeed from '@/components/ga-widgets/GANewsFeed';
import GAForexMatrix from '@/components/ga-widgets/GAForexMatrix';
import GAMarketHeatmap from '@/components/ga-widgets/GAMarketHeatmap';
import GACrossAssetDashboard from '@/components/ga-widgets/GACrossAssetDashboard';
import GAMarketPulse from '@/components/ga-widgets/GAMarketPulse';
import GABlockchainHub from '@/components/ga-widgets/GABlockchainHub';
import GAEconomicCalendar from '@/components/ga-widgets/GAEconomicCalendar';
import GACommodityRadar from '@/components/ga-widgets/GACommodityRadar';
import GAForexWarRoom from '@/components/ga-widgets/GAForexWarRoom';
import GAVolatilityMatrix from '@/components/ga-widgets/GAVolatilityMatrix';
import GAPortfolioAllocator from '@/components/ga-widgets/GAPortfolioAllocator';
import GAYieldMonitor from '@/components/ga-widgets/GAYieldMonitor';

// Blockchain live widgets (free APIs)
import GABitcoinNetwork from '@/components/ga-widgets/GABitcoinNetwork';
import GAEthereumNetwork from '@/components/ga-widgets/GAEthereumNetwork';
import GAXRPLedger from '@/components/ga-widgets/GAXRPLedger';
import GATronNetwork from '@/components/ga-widgets/GATronNetwork';
import GASECFilings from '@/components/ga-widgets/GASECFilings';

// Proprietary widgets (Lovable Cloud DB)
import GAReserveGauge from '@/components/ga-widgets/GAReserveGauge';
import GAVaultMatrix from '@/components/ga-widgets/GAVaultMatrix';
import GACertificateFlow from '@/components/ga-widgets/GACertificateFlow';
import GAReserveTimeline from '@/components/ga-widgets/GAReserveTimeline';
import GABullionHeatmap from '@/components/ga-widgets/GABullionHeatmap';
import GAPartnerNetwork from '@/components/ga-widgets/GAPartnerNetwork';
import GAActivityFeed from '@/components/ga-widgets/GAActivityFeed';
import GAMetalScreener from '@/components/ga-widgets/GAMetalScreener';
import GAAnchorStatus from '@/components/ga-widgets/GAAnchorStatus';
import GACryptoMarket from '@/components/ga-widgets/GACryptoMarket';
import GAFearGreed from '@/components/ga-widgets/GAFearGreed';
import GADeFiDashboard from '@/components/ga-widgets/GADeFiDashboard';
import GAWhaleWatch from '@/components/ga-widgets/GAWhaleWatch';
import GAGoldRatio from '@/components/ga-widgets/GAGoldRatio';
import GATimeSales from '@/components/ga-widgets/GATimeSales';
import GATradeJournal from '@/components/ga-widgets/GATradeJournal';
import WidgetDocWrapper from '@/components/ga-widgets/WidgetDocWrapper';

import {
  Shield, BarChart3, Vault, FileCheck2, History, Grid3X3, TrendingUp,
  Gauge, Building2, Network, SlidersHorizontal, Layers,
  Bitcoin, Newspaper, CalendarDays, LayoutGrid, FileText, Fish,
  DollarSign, LineChart, Eye, Globe, Flame, BarChart, ArrowLeftRight,
  Zap, Crosshair, Activity, PieChart as PieChartIcon, Landmark,
} from 'lucide-react';
import { useRef } from 'react';

const sections = [
  // Market Data
  { id: 'prices', label: 'PRICES', icon: TrendingUp },
  { id: 'mini-charts', label: 'CHARTS', icon: LineChart },
  { id: 'overview', label: 'OVERVIEW', icon: Eye },
  { id: 'chart', label: 'ADV CHART', icon: BarChart3 },
  { id: 'analysis', label: 'ANALYSIS', icon: Gauge },
  { id: 'market-summary', label: 'MARKETS', icon: Globe },
  { id: 'quotes', label: 'QUOTES', icon: BarChart },
  { id: 'movers', label: 'MOVERS', icon: Flame },
  { id: 'news', label: 'NEWS', icon: Newspaper },
  { id: 'forex', label: 'FOREX', icon: ArrowLeftRight },
  { id: 'heatmap', label: 'HEATMAP', icon: LayoutGrid },
  { id: 'calendar', label: 'CALENDAR', icon: CalendarDays },
  // Blockchain Live
  { id: 'bitcoin', label: 'BITCOIN', icon: Bitcoin },
  { id: 'ethereum', label: 'ETHEREUM', icon: Network },
  { id: 'xrp', label: 'XRP', icon: Layers },
  { id: 'tron', label: 'TRON', icon: Layers },
  { id: 'whales', label: 'WHALES', icon: Fish },
  { id: 'sec', label: 'SEC', icon: FileText },
  // DeFi & Sentiment
  { id: 'crypto-market', label: 'COINS', icon: Layers },
  { id: 'sentiment', label: 'SENTIMENT', icon: Gauge },
  { id: 'defi', label: 'DeFi TVL', icon: Layers },
  // Composite Tools
  { id: 'pulse', label: 'PULSE', icon: Zap },
  { id: 'correlation', label: 'CORR', icon: ArrowLeftRight },
  { id: 'chain-hub', label: 'CHAINS', icon: Network },
  { id: 'commodity-radar', label: 'RADAR', icon: Crosshair },
  { id: 'forex-room', label: 'FX ROOM', icon: Globe },
  { id: 'volatility', label: 'VOL', icon: Activity },
  { id: 'portfolios', label: 'ALLOC', icon: PieChartIcon },
  { id: 'yields', label: 'YIELDS', icon: Landmark },
  // Proprietary
  { id: 'ratios', label: 'RATIOS', icon: BarChart3 },
  // Trading Tools
  { id: 'tape', label: 'TAPE', icon: Activity },
  { id: 'journal', label: 'JOURNAL', icon: BarChart3 },
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

      {/* Live Ticker — GA Custom */}
      <GAMultiTicker />

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

          {/* Section Nav — horizontal scroll on mobile */}
          <div className="mt-10 -mx-6 px-6 overflow-x-auto scrollbar-thin">
            <div className="flex flex-nowrap md:flex-wrap md:justify-center gap-2 min-w-max md:min-w-0">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded border border-gold/20 text-marble/50 hover:text-gold hover:border-gold/50 transition-all text-[10px] font-display tracking-[0.2em] whitespace-nowrap shrink-0 md:shrink"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="greek-key-border-rich h-2" />

      {/* ═══════════════ TIER 1: MARKET DATA ═══════════════ */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        <TierBanner label="MARKET DATA" sub="LIVE AUTO-REFRESH · FREE PUBLIC APIs · ZERO INTERMEDIARIES" />

        <section id="prices">
          <SectionDivider label="SPOT PRICES" />
          <WidgetDocWrapper widgetId="prices">
            <GAPriceCards />
            <div className="mt-6">
              <GACryptoPriceCards />
            </div>
          </WidgetDocWrapper>
        </section>

        <section id="mini-charts">
          <SectionDivider label="COMPACT CHARTS" />
          <WidgetDocWrapper widgetId="mini-charts">
            <GAMiniCharts />
          </WidgetDocWrapper>
        </section>

        <section id="overview">
          <SectionDivider label="MULTI-ASSET OVERVIEW" />
          <WidgetDocWrapper widgetId="overview">
            <GAAssetOverview />
          </WidgetDocWrapper>
        </section>

        <section id="chart">
          <SectionDivider label="GOLD ARROW LIVE" />
          <WidgetDocWrapper widgetId="chart">
            <GALiveStandalone />
          </WidgetDocWrapper>
          <div className="mt-8">
            <SectionDivider label="METALS CHART" />
            <WidgetDocWrapper widgetId="chart">
              <GAMetalChart />
            </WidgetDocWrapper>
          </div>
        </section>

        <section id="analysis">
          <SectionDivider label="TECHNICAL ANALYSIS" />
          <WidgetDocWrapper widgetId="analysis">
            <GATechnicalGauge />
          </WidgetDocWrapper>
        </section>

        <section id="market-summary">
          <SectionDivider label="GLOBAL MARKET OVERVIEW" />
          <WidgetDocWrapper widgetId="market-summary">
            <GAMarketSummary />
          </WidgetDocWrapper>
        </section>

        <section id="quotes">
          <SectionDivider label="MARKET QUOTES" />
          <WidgetDocWrapper widgetId="quotes">
            <GAMarketQuotes />
          </WidgetDocWrapper>
        </section>

        <section id="movers">
          <SectionDivider label="TOP MOVERS" />
          <WidgetDocWrapper widgetId="movers">
            <GATopMovers />
          </WidgetDocWrapper>
        </section>

        <section id="news">
          <SectionDivider label="MARKET INTELLIGENCE FEED" />
          <WidgetDocWrapper widgetId="news">
            <GANewsFeed />
          </WidgetDocWrapper>
        </section>

        <section id="forex">
          <SectionDivider label="FOREX INTELLIGENCE" />
          <WidgetDocWrapper widgetId="forex">
            <GAForexMatrix />
          </WidgetDocWrapper>
        </section>

        <section id="heatmap">
          <SectionDivider label="MULTI-MARKET HEATMAP" />
          <WidgetDocWrapper widgetId="heatmap">
            <GAMarketHeatmap />
          </WidgetDocWrapper>
        </section>

        <section id="calendar">
          <SectionDivider label="ECONOMIC CALENDAR" />
          <WidgetDocWrapper widgetId="calendar">
            <GAEconomicCalendar />
          </WidgetDocWrapper>
        </section>
      </div>

      <div className="greek-key-border-rich h-2" />

      {/* ═══════════════ TIER 2: BLOCKCHAIN LIVE ═══════════════ */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        <TierBanner label="BLOCKCHAIN LIVE" sub="DIRECT FROM NETWORKS · ZERO INTERMEDIARIES" />

        <section id="bitcoin">
          <SectionDivider label="BITCOIN NETWORK" />
          <WidgetDocWrapper widgetId="bitcoin">
            <GABitcoinNetwork />
          </WidgetDocWrapper>
        </section>

        <section id="ethereum">
          <SectionDivider label="ETHEREUM NETWORK" />
          <WidgetDocWrapper widgetId="ethereum">
            <GAEthereumNetwork />
          </WidgetDocWrapper>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section id="xrp">
            <SectionDivider label="XRP LEDGER" />
            <WidgetDocWrapper widgetId="xrp">
              <GAXRPLedger />
            </WidgetDocWrapper>
          </section>
          <section id="tron">
            <SectionDivider label="TRON NETWORK" />
            <WidgetDocWrapper widgetId="tron">
              <GATronNetwork />
            </WidgetDocWrapper>
          </section>
        </div>

        <section id="sec">
          <SectionDivider label="SEC EDGAR FILINGS" />
          <WidgetDocWrapper widgetId="sec">
            <GASECFilings />
          </WidgetDocWrapper>
        </section>

        <section id="whales">
          <SectionDivider label="WHALE WATCH" />
          <WidgetDocWrapper widgetId="whales">
            <GAWhaleWatch />
          </WidgetDocWrapper>
        </section>
      </div>

      <div className="greek-key-border-rich h-2" />

      {/* ═══════════════ TIER 2.5: DeFi & SENTIMENT ═══════════════ */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        <TierBanner label="DeFi & SENTIMENT" sub="FREE PUBLIC APIs · AUTO-REFRESH" />

        <section id="crypto-market">
          <SectionDivider label="CRYPTO MARKET OVERVIEW" />
          <WidgetDocWrapper widgetId="crypto-market">
            <GACryptoMarket />
          </WidgetDocWrapper>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section id="sentiment">
            <SectionDivider label="MARKET SENTIMENT" />
            <WidgetDocWrapper widgetId="sentiment">
              <GAFearGreed />
            </WidgetDocWrapper>
          </section>
          <section id="defi">
            <SectionDivider label="DeFi TOTAL VALUE LOCKED" />
            <WidgetDocWrapper widgetId="defi">
              <GADeFiDashboard />
            </WidgetDocWrapper>
          </section>
        </div>
      </div>

      {/* ═══════════════ TIER 2.75: COMPOSITE TOOLS ═══════════════ */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        <TierBanner label="COMPOSITE TOOLS" sub="MULTI-SOURCE · CROSS-ASSET ANALYSIS" />

        <section id="pulse">
          <SectionDivider label="MARKET PULSE COMMAND CENTER" />
          <WidgetDocWrapper widgetId="pulse">
            <GAMarketPulse />
          </WidgetDocWrapper>
        </section>

        <section id="correlation">
          <SectionDivider label="CROSS-ASSET CORRELATION" />
          <WidgetDocWrapper widgetId="correlation">
            <GACrossAssetDashboard />
          </WidgetDocWrapper>
        </section>

        <section id="chain-hub">
          <SectionDivider label="BLOCKCHAIN ANALYTICS HUB" />
          <WidgetDocWrapper widgetId="chain-hub">
            <GABlockchainHub />
          </WidgetDocWrapper>
        </section>

        <section id="commodity-radar">
          <SectionDivider label="COMMODITY RADAR" />
          <WidgetDocWrapper widgetId="commodity-radar">
            <GACommodityRadar />
          </WidgetDocWrapper>
        </section>

        <section id="forex-room">
          <SectionDivider label="FOREX WAR ROOM" />
          <WidgetDocWrapper widgetId="forex-room">
            <GAForexWarRoom />
          </WidgetDocWrapper>
        </section>

        <section id="volatility">
          <SectionDivider label="VOLATILITY MATRIX" />
          <WidgetDocWrapper widgetId="volatility">
            <GAVolatilityMatrix />
          </WidgetDocWrapper>
        </section>

        <section id="portfolios">
          <SectionDivider label="PORTFOLIO ALLOCATOR" />
          <WidgetDocWrapper widgetId="portfolios">
            <GAPortfolioAllocator />
          </WidgetDocWrapper>
        </section>

        <section id="yields">
          <SectionDivider label="DeFi YIELD MONITOR" />
          <WidgetDocWrapper widgetId="yields">
            <GAYieldMonitor />
          </WidgetDocWrapper>
        </section>
      </div>

      <div className="greek-key-border-rich h-2" />

      {/* ═══════════════ TIER 3: PROPRIETARY ═══════════════ */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        <TierBanner label="PROPRIETARY DATA" sub="GOLD ARROW INTERNAL · LOVABLE CLOUD" />

        <section id="ratios">
          <SectionDivider label="METAL RATIOS" />
          <WidgetDocWrapper widgetId="ratios">
            <GAGoldRatio />
          </WidgetDocWrapper>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section id="reserves">
            <SectionDivider label="RESERVE BACKING" />
            <WidgetDocWrapper widgetId="reserves">
              <GAReserveGauge />
            </WidgetDocWrapper>
          </section>
          <section id="timeline">
            <SectionDivider label="RESERVE HISTORY" />
            <WidgetDocWrapper widgetId="timeline">
              <GAReserveTimeline />
            </WidgetDocWrapper>
          </section>
        </div>

        <section id="profiles">
          <SectionDivider label="METAL PROFILES" />
          <WidgetDocWrapper widgetId="profiles">
            <GAMetalProfile />
          </WidgetDocWrapper>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section id="vault">
            <SectionDivider label="VAULT INVENTORY" />
            <WidgetDocWrapper widgetId="vault">
              <GAVaultMatrix />
            </WidgetDocWrapper>
          </section>
          <section id="bullion-heatmap">
            <SectionDivider label="BULLION HEATMAP" />
            <WidgetDocWrapper widgetId="bullion-heatmap">
              <GABullionHeatmap />
            </WidgetDocWrapper>
          </section>
        </div>

        <section id="screener">
          <SectionDivider label="BULLION SCREENER" />
          <WidgetDocWrapper widgetId="screener">
            <GAMetalScreener />
          </WidgetDocWrapper>
        </section>

        <section id="certs">
          <SectionDivider label="CERTIFICATE REGISTRY" />
          <WidgetDocWrapper widgetId="certs">
            <GACertificateFlow />
          </WidgetDocWrapper>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section id="anchors">
            <SectionDivider label="BITCOIN ANCHORS" />
            <WidgetDocWrapper widgetId="anchors">
              <GAAnchorStatus />
            </WidgetDocWrapper>
          </section>
          <section id="activity">
            <SectionDivider label="ANCHORED ACTIVITY" />
            <WidgetDocWrapper widgetId="activity">
              <GAActivityFeed />
            </WidgetDocWrapper>
          </section>
        </div>

        <section id="partners">
          <SectionDivider label="PARTNER NETWORK" />
          <WidgetDocWrapper widgetId="partners">
            <GAPartnerNetwork />
          </WidgetDocWrapper>
        </section>
      </div>

      <div className="greek-key-border-rich h-2" />

      {/* ═══════════════ TRADING TOOLS ═══════════════ */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        <TierBanner label="TRADING TOOLS" sub="ORDER FLOW · JOURNALING · PROFESSIONAL ANALYTICS" />

        <section id="tape">
          <SectionDivider label="TIME & SALES (TAPE READER)" />
          <WidgetDocWrapper widgetId="tape">
            <GATimeSales />
          </WidgetDocWrapper>
        </section>

        <section id="journal">
          <SectionDivider label="TRADE JOURNAL" />
          <WidgetDocWrapper widgetId="journal">
            <GATradeJournal />
          </WidgetDocWrapper>
        </section>
      </div>

      <div className="greek-key-border-rich h-2" />
      <Footer />
    </div>
  );
};

export default Intelligence;
