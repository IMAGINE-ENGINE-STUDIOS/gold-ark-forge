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

import {
  Shield, BarChart3, Vault, FileCheck2, History, Grid3X3, TrendingUp,
  Gauge, Building2, Network, SlidersHorizontal, Layers,
  Bitcoin, Newspaper, CalendarDays, LayoutGrid, FileText,
} from 'lucide-react';

const sections = [
  // Market Data (free)
  { id: 'prices', label: 'PRICES', icon: TrendingUp },
  { id: 'chart', label: 'CHART', icon: BarChart3 },
  { id: 'analysis', label: 'ANALYSIS', icon: Gauge },
  { id: 'crypto', label: 'CRYPTO', icon: Layers },
  { id: 'news', label: 'NEWS', icon: Newspaper },
  { id: 'calendar', label: 'CALENDAR', icon: CalendarDays },
  { id: 'heatmap-stocks', label: 'STOCKS', icon: LayoutGrid },
  // Blockchain Live (free)
  { id: 'bitcoin', label: 'BITCOIN', icon: Bitcoin },
  { id: 'ethereum', label: 'ETHEREUM', icon: Network },
  { id: 'xrp', label: 'XRP', icon: Layers },
  { id: 'tron', label: 'TRON', icon: Layers },
  { id: 'sec', label: 'SEC', icon: FileText },
  // Proprietary
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
          {/* Crypto tickers row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <TradingViewSingleTicker symbol="BITSTAMP:BTCUSD" />
            <TradingViewSingleTicker symbol="BITSTAMP:ETHUSD" />
            <TradingViewSingleTicker symbol="BITSTAMP:XRPUSD" />
            <TradingViewSingleTicker symbol="BINANCE:TRXUSDT" />
          </div>
        </section>

        {/* [2] Advanced Chart */}
        <section id="chart">
          <SectionDivider label="ADVANCED CHART" />
          <TradingViewChart symbol="OANDA:XAUUSD" height={500} />
        </section>

        {/* [3] Technical Analysis */}
        <section id="analysis">
          <SectionDivider label="TECHNICAL ANALYSIS" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TradingViewTechnicalAnalysis symbol="OANDA:XAUUSD" height={400} />
            <TradingViewTechnicalAnalysis symbol="BITSTAMP:BTCUSD" height={400} />
          </div>
        </section>

        {/* [4] Crypto Market */}
        <section id="crypto">
          <SectionDivider label="CRYPTO MARKET" />
          <TradingViewCryptoMarket height={500} />
        </section>

        {/* [5] Market News */}
        <section id="news">
          <SectionDivider label="MARKET NEWS" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TradingViewTopStories symbol="OANDA:XAUUSD" height={450} />
            <TradingViewTopStories symbol="BITSTAMP:BTCUSD" height={450} />
          </div>
        </section>

        {/* [6] Economic Calendar */}
        <section id="calendar">
          <SectionDivider label="ECONOMIC CALENDAR" />
          <TradingViewEconomicCalendar height={500} />
        </section>

        {/* [7] Stock Heatmap */}
        <section id="heatmap-stocks">
          <SectionDivider label="STOCK HEATMAP" />
          <TradingViewHeatmap height={500} />
        </section>
      </div>

      <div className="greek-key-border-rich h-2" />

      {/* ═══════════════ TIER 2: BLOCKCHAIN LIVE (FREE) ═══════════════ */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        <TierBanner label="BLOCKCHAIN LIVE" sub="DIRECT FROM NETWORKS · ZERO INTERMEDIARIES" />

        {/* [8] Bitcoin */}
        <section id="bitcoin">
          <SectionDivider label="BITCOIN NETWORK" />
          <GABitcoinNetwork />
        </section>

        {/* [9] Ethereum */}
        <section id="ethereum">
          <SectionDivider label="ETHEREUM NETWORK" />
          <GAEthereumNetwork />
        </section>

        {/* [10] XRP + [11] TRON side by side */}
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

        {/* [12] SEC EDGAR */}
        <section id="sec">
          <SectionDivider label="SEC EDGAR FILINGS" />
          <GASECFilings />
        </section>
      </div>

      <div className="greek-key-border-rich h-2" />

      {/* ═══════════════ TIER 3: PROPRIETARY (CLOUD DB) ═══════════════ */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        <TierBanner label="PROPRIETARY DATA" sub="GOLD ARROW INTERNAL · LOVABLE CLOUD" />

        {/* Reserve Gauge + Timeline */}
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

        {/* Metal Profiles */}
        <section id="profiles">
          <SectionDivider label="METAL PROFILES" />
          <GAMetalProfile />
        </section>

        {/* Vault + Heatmap */}
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

        {/* Screener */}
        <section id="screener">
          <SectionDivider label="BULLION SCREENER" />
          <GAMetalScreener />
        </section>

        {/* Certificates */}
        <section id="certs">
          <SectionDivider label="CERTIFICATE REGISTRY" />
          <GACertificateFlow />
        </section>

        {/* Anchors + Activity */}
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

        {/* Partners */}
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
