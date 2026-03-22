import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// GA Custom Widgets
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
import GABitcoinNetwork from '@/components/ga-widgets/GABitcoinNetwork';
import GAEthereumNetwork from '@/components/ga-widgets/GAEthereumNetwork';
import GAXRPLedger from '@/components/ga-widgets/GAXRPLedger';
import GATronNetwork from '@/components/ga-widgets/GATronNetwork';
import GASECFilings from '@/components/ga-widgets/GASECFilings';
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
import GAAllAssetPriceCards from '@/components/ga-widgets/GAAllAssetPriceCards';
import GADeFiDashboard from '@/components/ga-widgets/GADeFiDashboard';
import GAWhaleWatch from '@/components/ga-widgets/GAWhaleWatch';
import GAGoldRatio from '@/components/ga-widgets/GAGoldRatio';
import GATimeSales from '@/components/ga-widgets/GATimeSales';
import GATradeJournal from '@/components/ga-widgets/GATradeJournal';
import GALiveTicker from '@/components/ga-widgets/GALiveTicker';
import GACryptoHeatmap from '@/components/ga-widgets/GACryptoHeatmap';
import GAMarginCalc from '@/components/ga-widgets/GAMarginCalc';
import GAPipCalculator from '@/components/ga-widgets/GAPipCalculator';
import GAPerformanceDashboard from '@/components/ga-widgets/GAPerformanceDashboard';
import GATradingSessions from '@/components/ga-widgets/GATradingSessions';

import OGMultiTicker from '@/components/og-widgets/OGMultiTicker';
import OGPriceCards from '@/components/og-widgets/OGPriceCards';
import OGNewsFeed from '@/components/og-widgets/OGNewsFeed';
import OGEnergyDashboard from '@/components/og-widgets/OGEnergyDashboard';
import OGFuturesCurve from '@/components/og-widgets/OGFuturesCurve';
import OGInventoryGauge from '@/components/og-widgets/OGInventoryGauge';
import OGOPECTracker from '@/components/og-widgets/OGOPECTracker';
import OGProductionMap from '@/components/og-widgets/OGProductionMap';
import OGSupplyDemand from '@/components/og-widgets/OGSupplyDemand';
import OGRigCount from '@/components/og-widgets/OGRigCount';
import OGWtiBrentSpread from '@/components/og-widgets/OGWtiBrentSpread';
import OGCrackSpreads from '@/components/og-widgets/OGCrackSpreads';
import OGChokepoints from '@/components/og-widgets/OGChokepoints';
import OGPipelineFlow from '@/components/og-widgets/OGPipelineFlow';
import OGRiskAnalyzer from '@/components/og-widgets/OGRiskAnalyzer';

import WidgetDocWrapper from '@/components/ga-widgets/WidgetDocWrapper';

import {
  TrendingUp, LineChart, Eye, BarChart3, Gauge, Globe, BarChart, Flame,
  Newspaper, ArrowLeftRight, LayoutGrid, CalendarDays, Bitcoin, Network,
  Layers, Fish, FileText, Zap, Crosshair, Activity, PieChart as PieChartIcon,
  Landmark, SlidersHorizontal, DollarSign, Building2, Fuel,
  Shield, Database,
} from 'lucide-react';

type CategoryKey = 'market' | 'blockchain' | 'defi' | 'composite' | 'proprietary' | 'trading' | 'oilgas';

const categories: { key: CategoryKey; label: string; icon: any; sub: string }[] = [
  { key: 'market', label: 'Market Data', icon: TrendingUp, sub: 'LIVE AUTO-REFRESH · FREE PUBLIC APIs · ZERO INTERMEDIARIES' },
  { key: 'blockchain', label: 'Blockchain', icon: Bitcoin, sub: 'DIRECT FROM NETWORKS · ZERO INTERMEDIARIES' },
  { key: 'defi', label: 'DeFi & Sentiment', icon: Layers, sub: 'FREE PUBLIC APIs · AUTO-REFRESH' },
  { key: 'composite', label: 'Composite Tools', icon: Zap, sub: 'MULTI-SOURCE · CROSS-ASSET ANALYSIS' },
  { key: 'proprietary', label: 'Proprietary', icon: Shield, sub: 'GOLD ARROW INTERNAL · LOVABLE CLOUD' },
  { key: 'trading', label: 'Trading Tools', icon: Activity, sub: 'ORDER FLOW · JOURNALING · PROFESSIONAL ANALYTICS' },
  { key: 'oilgas', label: 'Oil & Gas', icon: Fuel, sub: 'ENERGY SECTOR · INSTITUTIONAL ANALYTICS' },
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

const MarketDataContent = () => (
  <div className="space-y-12">
    <TierBanner label="MARKET DATA" sub="LIVE AUTO-REFRESH · FREE PUBLIC APIs · ZERO INTERMEDIARIES" />
    <section>
      <SectionDivider label="LIVE TICKER TAPE" />
      <GALiveTicker />
    </section>
    <section>
      <SectionDivider label="SPOT PRICES" />
      <WidgetDocWrapper widgetId="prices">
        <GAPriceCards />
        <div className="mt-6"><GACryptoPriceCards /></div>
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gold rounded-full" />
            <span className="font-display text-sm tracking-[0.15em] text-gold-light">ALL SWAP ASSETS — REAL-TIME</span>
            <span className="text-[10px] text-marble/25 font-mono">200+ instruments</span>
          </div>
          <GAAllAssetPriceCards />
        </div>
      </WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="COMPACT CHARTS" />
      <WidgetDocWrapper widgetId="mini-charts"><GAMiniCharts /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="MULTI-ASSET OVERVIEW" />
      <WidgetDocWrapper widgetId="overview"><GAAssetOverview /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="GOLD ARROW LIVE" />
      <WidgetDocWrapper widgetId="chart"><GALiveStandalone /></WidgetDocWrapper>
      <div className="mt-8">
        <SectionDivider label="METALS CHART" />
        <WidgetDocWrapper widgetId="chart"><GAMetalChart /></WidgetDocWrapper>
      </div>
    </section>
    <section>
      <SectionDivider label="TECHNICAL ANALYSIS" />
      <WidgetDocWrapper widgetId="analysis"><GATechnicalGauge /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="GLOBAL MARKET OVERVIEW" />
      <WidgetDocWrapper widgetId="market-summary"><GAMarketSummary /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="MARKET QUOTES" />
      <WidgetDocWrapper widgetId="quotes"><GAMarketQuotes /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="TOP MOVERS" />
      <WidgetDocWrapper widgetId="movers"><GATopMovers /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="MARKET INTELLIGENCE FEED" />
      <WidgetDocWrapper widgetId="news"><GANewsFeed /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="FOREX INTELLIGENCE" />
      <WidgetDocWrapper widgetId="forex"><GAForexMatrix /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="MULTI-MARKET HEATMAP" />
      <WidgetDocWrapper widgetId="heatmap"><GAMarketHeatmap /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="ECONOMIC CALENDAR" />
      <WidgetDocWrapper widgetId="calendar"><GAEconomicCalendar /></WidgetDocWrapper>
    </section>
  </div>
);

const BlockchainContent = () => (
  <div className="space-y-12">
    <TierBanner label="BLOCKCHAIN LIVE" sub="DIRECT FROM NETWORKS · ZERO INTERMEDIARIES" />
    <section>
      <SectionDivider label="BITCOIN NETWORK" />
      <WidgetDocWrapper widgetId="bitcoin"><GABitcoinNetwork /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="ETHEREUM NETWORK" />
      <WidgetDocWrapper widgetId="ethereum"><GAEthereumNetwork /></WidgetDocWrapper>
    </section>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <section>
        <SectionDivider label="XRP LEDGER" />
        <WidgetDocWrapper widgetId="xrp"><GAXRPLedger /></WidgetDocWrapper>
      </section>
      <section>
        <SectionDivider label="TRON NETWORK" />
        <WidgetDocWrapper widgetId="tron"><GATronNetwork /></WidgetDocWrapper>
      </section>
    </div>
    <section>
      <SectionDivider label="SEC EDGAR FILINGS" />
      <WidgetDocWrapper widgetId="sec"><GASECFilings /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="WHALE WATCH" />
      <WidgetDocWrapper widgetId="whales"><GAWhaleWatch /></WidgetDocWrapper>
    </section>
  </div>
);

const DeFiContent = () => (
  <div className="space-y-12">
    <TierBanner label="DeFi & SENTIMENT" sub="FREE PUBLIC APIs · AUTO-REFRESH" />
    <section>
      <SectionDivider label="CRYPTO MARKET OVERVIEW" />
      <WidgetDocWrapper widgetId="crypto-market"><GACryptoMarket /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="CRYPTO HEATMAP" />
      <WidgetDocWrapper widgetId="crypto-heatmap"><GACryptoHeatmap /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="DeFi TOTAL VALUE LOCKED" />
      <WidgetDocWrapper widgetId="defi"><GADeFiDashboard /></WidgetDocWrapper>
    </section>
  </div>
);

const CompositeContent = () => (
  <div className="space-y-12">
    <TierBanner label="COMPOSITE TOOLS" sub="MULTI-SOURCE · CROSS-ASSET ANALYSIS" />
    <section>
      <SectionDivider label="MARKET PULSE COMMAND CENTER" />
      <WidgetDocWrapper widgetId="pulse"><GAMarketPulse /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="CROSS-ASSET CORRELATION" />
      <WidgetDocWrapper widgetId="correlation"><GACrossAssetDashboard /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="BLOCKCHAIN ANALYTICS HUB" />
      <WidgetDocWrapper widgetId="chain-hub"><GABlockchainHub /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="COMMODITY RADAR" />
      <WidgetDocWrapper widgetId="commodity-radar"><GACommodityRadar /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="FOREX WAR ROOM" />
      <WidgetDocWrapper widgetId="forex-room"><GAForexWarRoom /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="VOLATILITY MATRIX" />
      <WidgetDocWrapper widgetId="volatility"><GAVolatilityMatrix /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="PORTFOLIO ALLOCATOR" />
      <WidgetDocWrapper widgetId="portfolios"><GAPortfolioAllocator /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="DeFi YIELD MONITOR" />
      <WidgetDocWrapper widgetId="yields"><GAYieldMonitor /></WidgetDocWrapper>
    </section>
  </div>
);

const ProprietaryContent = () => (
  <div className="space-y-12">
    <TierBanner label="PROPRIETARY DATA" sub="GOLD ARROW INTERNAL · LOVABLE CLOUD" />
    <section>
      <SectionDivider label="METAL RATIOS" />
      <WidgetDocWrapper widgetId="ratios"><GAGoldRatio /></WidgetDocWrapper>
    </section>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <section>
        <SectionDivider label="RESERVE BACKING" />
        <WidgetDocWrapper widgetId="reserves"><GAReserveGauge /></WidgetDocWrapper>
      </section>
      <section>
        <SectionDivider label="RESERVE HISTORY" />
        <WidgetDocWrapper widgetId="timeline"><GAReserveTimeline /></WidgetDocWrapper>
      </section>
    </div>
    <section>
      <SectionDivider label="METAL PROFILES" />
      <WidgetDocWrapper widgetId="profiles"><GAMetalProfile /></WidgetDocWrapper>
    </section>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <section>
        <SectionDivider label="VAULT INVENTORY" />
        <WidgetDocWrapper widgetId="vault"><GAVaultMatrix /></WidgetDocWrapper>
      </section>
      <section>
        <SectionDivider label="BULLION HEATMAP" />
        <WidgetDocWrapper widgetId="bullion-heatmap"><GABullionHeatmap /></WidgetDocWrapper>
      </section>
    </div>
    <section>
      <SectionDivider label="BULLION SCREENER" />
      <WidgetDocWrapper widgetId="screener"><GAMetalScreener /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="CERTIFICATE REGISTRY" />
      <WidgetDocWrapper widgetId="certs"><GACertificateFlow /></WidgetDocWrapper>
    </section>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <section>
        <SectionDivider label="BITCOIN ANCHORS" />
        <WidgetDocWrapper widgetId="anchors"><GAAnchorStatus /></WidgetDocWrapper>
      </section>
      <section>
        <SectionDivider label="ANCHORED ACTIVITY" />
        <WidgetDocWrapper widgetId="activity"><GAActivityFeed /></WidgetDocWrapper>
      </section>
    </div>
    <section>
      <SectionDivider label="PARTNER NETWORK" />
      <WidgetDocWrapper widgetId="partners"><GAPartnerNetwork /></WidgetDocWrapper>
    </section>
  </div>
);

const TradingContent = () => (
  <div className="space-y-12">
    <TierBanner label="TRADING TOOLS" sub="ORDER FLOW · JOURNALING · PROFESSIONAL ANALYTICS" />
    <section>
      <SectionDivider label="TIME & SALES (TAPE READER)" />
      <WidgetDocWrapper widgetId="tape"><GATimeSales /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="TRADE JOURNAL" />
      <WidgetDocWrapper widgetId="journal"><GATradeJournal /></WidgetDocWrapper>
    </section>
    <section>
      <SectionDivider label="TRADING SESSIONS" />
      <WidgetDocWrapper widgetId="sessions"><GATradingSessions /></WidgetDocWrapper>
    </section>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <section>
        <SectionDivider label="MARGIN CALCULATOR" />
        <WidgetDocWrapper widgetId="margin-calc"><GAMarginCalc /></WidgetDocWrapper>
      </section>
      <section>
        <SectionDivider label="PIP CALCULATOR" />
        <WidgetDocWrapper widgetId="pip-calc"><GAPipCalculator /></WidgetDocWrapper>
      </section>
    </div>
    <section>
      <SectionDivider label="PERFORMANCE DASHBOARD" />
      <WidgetDocWrapper widgetId="performance"><GAPerformanceDashboard /></WidgetDocWrapper>
    </section>
  </div>
);

const OilGasContent = () => (
  <div className="space-y-12">
    <TierBanner label="OIL & GAS INTELLIGENCE" sub="ENERGY SECTOR · INSTITUTIONAL ANALYTICS" />
    <OGMultiTicker />
    <section>
      <SectionDivider label="ENERGY DASHBOARD" />
      <OGPriceCards />
      <div className="mt-6"><OGEnergyDashboard /></div>
    </section>
    <section>
      <SectionDivider label="FUTURES CURVE" />
      <OGFuturesCurve />
    </section>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <section>
        <SectionDivider label="INVENTORY GAUGE" />
        <OGInventoryGauge />
      </section>
      <section>
        <SectionDivider label="WTI-BRENT SPREAD" />
        <OGWtiBrentSpread />
      </section>
    </div>
    <section>
      <SectionDivider label="OPEC TRACKER" />
      <OGOPECTracker />
    </section>
    <section>
      <SectionDivider label="SUPPLY & DEMAND" />
      <OGSupplyDemand />
    </section>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <section>
        <SectionDivider label="RIG COUNT" />
        <OGRigCount />
      </section>
      <section>
        <SectionDivider label="CRACK SPREADS" />
        <OGCrackSpreads />
      </section>
    </div>
    <section>
      <SectionDivider label="PRODUCTION MAP" />
      <OGProductionMap />
    </section>
    <section>
      <SectionDivider label="PIPELINE FLOW" />
      <OGPipelineFlow />
    </section>
    <section>
      <SectionDivider label="CHOKEPOINTS" />
      <OGChokepoints />
    </section>
    <section>
      <SectionDivider label="RISK ANALYZER" />
      <OGRiskAnalyzer />
    </section>
    <section>
      <SectionDivider label="ENERGY NEWS" />
      <OGNewsFeed />
    </section>
  </div>
);

const categoryContent: Record<CategoryKey, React.FC> = {
  market: MarketDataContent,
  blockchain: BlockchainContent,
  defi: DeFiContent,
  composite: CompositeContent,
  proprietary: ProprietaryContent,
  trading: TradingContent,
  oilgas: OilGasContent,
};

const Intelligence = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('market');
  const ActiveContent = categoryContent[activeCategory];

  return (
    <div className="min-h-screen bg-navy">
      <Header />
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

          {/* Category Tabs */}
          <div className="mt-10 -mx-6 px-6 overflow-x-auto scrollbar-thin">
            <div className="flex flex-nowrap md:flex-wrap md:justify-center gap-2 min-w-max md:min-w-0">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded border transition-all text-[10px] font-display tracking-[0.2em] whitespace-nowrap shrink-0 md:shrink ${
                      isActive
                        ? 'border-gold bg-gold/10 text-gold shadow-[0_0_12px_hsla(43,72%,50%,0.15)]'
                        : 'border-gold/20 text-marble/50 hover:text-gold hover:border-gold/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="greek-key-border-rich h-2" />

      {/* Active Category Content */}
      <div className="container mx-auto px-6 py-12">
        <ActiveContent />
      </div>

      <div className="greek-key-border-rich h-2" />
      <Footer />
    </div>
  );
};

export default Intelligence;
