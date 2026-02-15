import Header from '@/components/Header';
import Footer from '@/components/Footer';

// GA Custom Widgets — NO TradingView
import GAMultiTicker from '@/components/ga-widgets/GAMultiTicker';
import GAPriceCards from '@/components/ga-widgets/GAPriceCards';
import GACryptoPriceCards from '@/components/ga-widgets/GACryptoPriceCards';
import GAMiniCharts from '@/components/ga-widgets/GAMiniCharts';
import GAAssetOverview from '@/components/ga-widgets/GAAssetOverview';
import GAMetalChart from '@/components/ga-widgets/GAMetalChart';
import GATechnicalGauge from '@/components/ga-widgets/GATechnicalGauge';
import GAMetalProfile from '@/components/ga-widgets/GAMetalProfile';
import GAMarketSummary from '@/components/ga-widgets/GAMarketSummary';
import GAMarketQuotes from '@/components/ga-widgets/GAMarketQuotes';
import GATopMovers from '@/components/ga-widgets/GATopMovers';
import GANewsFeed from '@/components/ga-widgets/GANewsFeed';
import GAForexMatrix from '@/components/ga-widgets/GAForexMatrix';
import GACryptoHeatmap from '@/components/ga-widgets/GACryptoHeatmap';
import GAEconomicCalendar from '@/components/ga-widgets/GAEconomicCalendar';

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

import {
  Shield, BarChart3, Vault, FileCheck2, History, Grid3X3, TrendingUp,
  Gauge, Building2, Network, SlidersHorizontal, Layers,
  Bitcoin, Newspaper, CalendarDays, LayoutGrid, FileText, Fish,
  DollarSign, LineChart, Eye, Globe, Flame, BarChart, ArrowLeftRight,
} from 'lucide-react';

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
  // Proprietary
  { id: 'ratios', label: 'RATIOS', icon: BarChart3 },
  { id: 'reserves', label: 'RESERVES', icon: Shield },
  { id: 'profiles', label: 'PROFILES', icon: Layers },
  { id: 'vault', label: 'VAULT', icon: Vault },
  { id: 'bullion-heatmap', label: 'BULLION', icon: Grid3X3 },
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

      {/* ═══════════════ TIER 1: MARKET DATA ═══════════════ */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        <TierBanner label="MARKET DATA" sub="LIVE AUTO-REFRESH · FREE PUBLIC APIs · ZERO INTERMEDIARIES" />

        {/* Spot Prices */}
        <section id="prices">
          <SectionDivider label="SPOT PRICES" />
          <GAPriceCards />
          <div className="mt-6">
            <GACryptoPriceCards />
          </div>
        </section>

        {/* Mini Charts */}
        <section id="mini-charts">
          <SectionDivider label="COMPACT CHARTS" />
          <GAMiniCharts />
        </section>

        {/* Multi-Asset Overview */}
        <section id="overview">
          <SectionDivider label="MULTI-ASSET OVERVIEW" />
          <GAAssetOverview />
        </section>

        {/* Advanced Chart */}
        <section id="chart">
          <SectionDivider label="ADVANCED CHART" />
          <GAMetalChart />
        </section>

        {/* Technical Analysis */}
        <section id="analysis">
          <SectionDivider label="TECHNICAL ANALYSIS" />
          <GATechnicalGauge />
        </section>

        {/* Global Market Summary */}
        <section id="market-summary">
          <SectionDivider label="GLOBAL MARKET OVERVIEW" />
          <GAMarketSummary />
        </section>

        {/* Market Quotes */}
        <section id="quotes">
          <SectionDivider label="MARKET QUOTES" />
          <GAMarketQuotes />
        </section>

        {/* Top Movers */}
        <section id="movers">
          <SectionDivider label="TOP MOVERS" />
          <GATopMovers />
        </section>

        {/* News Feed */}
        <section id="news">
          <SectionDivider label="MARKET INTELLIGENCE FEED" />
          <GANewsFeed />
        </section>

        {/* Forex */}
        <section id="forex">
          <SectionDivider label="FOREX INTELLIGENCE" />
          <GAForexMatrix />
        </section>

        {/* Crypto Sector Heatmap */}
        <section id="heatmap">
          <SectionDivider label="CRYPTO SECTOR HEATMAP" />
          <GACryptoHeatmap />
        </section>

        {/* Economic Calendar */}
        <section id="calendar">
          <SectionDivider label="ECONOMIC CALENDAR" />
          <GAEconomicCalendar />
        </section>
      </div>

      <div className="greek-key-border-rich h-2" />

      {/* ═══════════════ TIER 2: BLOCKCHAIN LIVE ═══════════════ */}
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

      {/* ═══════════════ TIER 2.5: DeFi & SENTIMENT ═══════════════ */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        <TierBanner label="DeFi & SENTIMENT" sub="FREE PUBLIC APIs · AUTO-REFRESH" />

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

      {/* ═══════════════ TIER 3: PROPRIETARY ═══════════════ */}
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
          <section id="bullion-heatmap">
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
