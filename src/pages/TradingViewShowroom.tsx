import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// GA Proprietary Widgets
import GAMultiTicker from '@/components/ga-widgets/GAMultiTicker';
import GAPriceCards from '@/components/ga-widgets/GAPriceCards';
import GAMiniCharts from '@/components/ga-widgets/GAMiniCharts';
import GAMetalChart from '@/components/ga-widgets/GAMetalChart';
import GATechnicalGauge from '@/components/ga-widgets/GATechnicalGauge';
import GAMarketHeatmap from '@/components/ga-widgets/GAMarketHeatmap';
import GAMetalScreener from '@/components/ga-widgets/GAMetalScreener';
import GAForexMatrix from '@/components/ga-widgets/GAForexMatrix';
import GACryptoMarket from '@/components/ga-widgets/GACryptoMarket';
import GAEconomicCalendar from '@/components/ga-widgets/GAEconomicCalendar';
import GANewsFeed from '@/components/ga-widgets/GANewsFeed';
import GAMarketQuotes from '@/components/ga-widgets/GAMarketQuotes';
import GATopMovers from '@/components/ga-widgets/GATopMovers';
import GAMarketSummary from '@/components/ga-widgets/GAMarketSummary';
import GAGoldRatio from '@/components/ga-widgets/GAGoldRatio';
import GAMetalProfile from '@/components/ga-widgets/GAMetalProfile';

import GAVolatilityMatrix from '@/components/ga-widgets/GAVolatilityMatrix';
import GALiveTicker from '@/components/ga-widgets/GALiveTicker';
import GACryptoPriceCards from '@/components/ga-widgets/GACryptoPriceCards';
import GACryptoHeatmap from '@/components/ga-widgets/GACryptoHeatmap';
import GAForexWarRoom from '@/components/ga-widgets/GAForexWarRoom';
import GACommodityRadar from '@/components/ga-widgets/GACommodityRadar';
import GAMarketPulse from '@/components/ga-widgets/GAMarketPulse';
import GAAssetOverview from '@/components/ga-widgets/GAAssetOverview';
import GAPortfolioAllocator from '@/components/ga-widgets/GAPortfolioAllocator';
import GAYieldMonitor from '@/components/ga-widgets/GAYieldMonitor';
import GABullionHeatmap from '@/components/ga-widgets/GABullionHeatmap';
import GACrossAssetDashboard from '@/components/ga-widgets/GACrossAssetDashboard';
import GADeFiDashboard from '@/components/ga-widgets/GADeFiDashboard';
import GASECFilings from '@/components/ga-widgets/GASECFilings';
import GAWhaleWatch from '@/components/ga-widgets/GAWhaleWatch';

interface ShowcaseSection {
  id: string;
  title: string;
  description: string;
  category: string;
}

const sections: ShowcaseSection[] = [
  { id: 'live-ticker', title: 'Live Ticker Tape', description: 'Scrolling real-time quotes across precious metals and crypto.', category: 'Tickers' },
  { id: 'price-cards', title: 'Price Cards', description: 'Institutional-grade price cards with spot prices, change, and sparklines.', category: 'Tickers' },
  { id: 'crypto-prices', title: 'Crypto Price Cards', description: 'Live cryptocurrency prices with 24h change and market cap.', category: 'Tickers' },
  { id: 'metal-profile', title: 'Metal Profile', description: 'Deep-dive profile for each precious metal with key metrics and analysis.', category: 'Symbol Details' },
  { id: 'gold-ratio', title: 'Gold Ratio', description: 'Gold-to-Silver and Gold-to-Platinum ratios with historical context.', category: 'Symbol Details' },
  { id: 'mini-charts', title: 'Mini Charts', description: 'Compact sparkline charts for quick visual reference across multiple assets.', category: 'Charts' },
  { id: 'advanced-chart', title: 'Advanced Chart', description: 'Full-featured proprietary chart with indicators and drawing tools.', category: 'Charts' },
  { id: 'technical-gauge', title: 'Technical Analysis', description: 'Oscillators and moving average summary gauge with buy/sell signals.', category: 'Analysis' },
  
  { id: 'volatility', title: 'Volatility Matrix', description: 'Cross-asset volatility comparison with historical percentiles.', category: 'Analysis' },
  { id: 'news-feed', title: 'Market News', description: 'Real-time aggregated news from global financial sources.', category: 'News' },
  { id: 'market-quotes', title: 'Market Quotes', description: 'Live quotes across precious metals, crypto, indices, and forex.', category: 'Watchlists' },
  { id: 'top-movers', title: 'Top Movers', description: 'Dynamic list of biggest gainers and losers across all markets.', category: 'Watchlists' },
  { id: 'market-summary', title: 'Market Summary', description: 'Comprehensive global market dashboard with key indices and rates.', category: 'Watchlists' },
  { id: 'asset-overview', title: 'Asset Overview', description: 'Multi-asset snapshot with performance metrics and allocation data.', category: 'Watchlists' },
  { id: 'market-heatmap', title: 'Market Heatmap', description: 'Multi-market treemap visualization across crypto, stocks, forex, and commodities.', category: 'Heatmaps' },
  { id: 'bullion-heatmap', title: 'Bullion Heatmap', description: 'Proprietary heatmap focused on precious metals market activity.', category: 'Heatmaps' },
  { id: 'crypto-heatmap', title: 'Crypto Heatmap', description: 'Cryptocurrency market cap treemap with performance data.', category: 'Heatmaps' },
  { id: 'forex-matrix', title: 'Forex Matrix', description: 'Currency strength matrix with cross-rate comparisons.', category: 'Heatmaps' },
  { id: 'forex-war-room', title: 'Forex War Room', description: 'Professional FX strength index with multi-pair analysis.', category: 'Heatmaps' },
  { id: 'screener', title: 'Metal Screener', description: 'Sortable screener for precious metals with fundamental columns.', category: 'Screeners' },
  { id: 'crypto-market', title: 'Crypto Market', description: 'Full crypto screener with market cap, volume, and performance.', category: 'Screeners' },
  { id: 'commodity-radar', title: 'Commodity Radar', description: 'Performance scanner across all commodity classes.', category: 'Screeners' },
  { id: 'economic-calendar', title: 'Economic Calendar', description: 'Upcoming economic events with impact ratings and forecasts.', category: 'Data' },
  { id: 'market-pulse', title: 'Market Pulse', description: 'Command center consolidating multi-market signals in real time.', category: 'Data' },
  { id: 'cross-asset', title: 'Cross-Asset Dashboard', description: 'Correlation and performance dashboard across all asset classes.', category: 'Data' },
  { id: 'portfolio', title: 'Portfolio Allocator', description: 'Model portfolio allocation tool with risk-return optimization.', category: 'Tools' },
  { id: 'yield-monitor', title: 'Yield Monitor', description: 'Bond yield curves and interest rate tracking across sovereigns.', category: 'Tools' },
  { id: 'defi', title: 'DeFi Dashboard', description: 'Decentralized finance protocol metrics and yield aggregation.', category: 'Tools' },
  { id: 'sec-filings', title: 'SEC Filings', description: 'Latest regulatory filings tracker for publicly traded companies.', category: 'Tools' },
  { id: 'whale-watch', title: 'Whale Watch', description: 'Large transaction monitoring across blockchain networks.', category: 'Tools' },
];

const categories = ['All', 'Tickers', 'Symbol Details', 'Charts', 'Analysis', 'News', 'Watchlists', 'Heatmaps', 'Screeners', 'Data', 'Tools'];

const TradingViewShowroom = () => {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All' ? sections : sections.filter(s => s.category === activeCategory);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderWidget = (id: string) => {
    switch (id) {
      case 'live-ticker': return <GALiveTicker />;
      case 'price-cards': return <GAPriceCards />;
      case 'crypto-prices': return <GACryptoPriceCards />;
      case 'metal-profile': return <GAMetalProfile />;
      case 'gold-ratio': return <GAGoldRatio />;
      case 'mini-charts': return <GAMiniCharts />;
      case 'advanced-chart': return <GAMetalChart />;
      case 'technical-gauge': return <GATechnicalGauge />;
      
      case 'volatility': return <GAVolatilityMatrix />;
      case 'news-feed': return <GANewsFeed />;
      case 'market-quotes': return <GAMarketQuotes />;
      case 'top-movers': return <GATopMovers />;
      case 'market-summary': return <GAMarketSummary />;
      case 'asset-overview': return <GAAssetOverview />;
      case 'market-heatmap': return <GAMarketHeatmap />;
      case 'bullion-heatmap': return <GABullionHeatmap />;
      case 'crypto-heatmap': return <GACryptoHeatmap />;
      case 'forex-matrix': return <GAForexMatrix />;
      case 'forex-war-room': return <GAForexWarRoom />;
      case 'screener': return <GAMetalScreener />;
      case 'crypto-market': return <GACryptoMarket />;
      case 'commodity-radar': return <GACommodityRadar />;
      case 'economic-calendar': return <GAEconomicCalendar />;
      case 'market-pulse': return <GAMarketPulse />;
      case 'cross-asset': return <GACrossAssetDashboard />;
      case 'portfolio': return <GAPortfolioAllocator />;
      case 'yield-monitor': return <GAYieldMonitor />;
      case 'defi': return <GADeFiDashboard />;
      case 'sec-filings': return <GASECFilings />;
      case 'whale-watch': return <GAWhaleWatch />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <GAMultiTicker />

      <main className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent mb-6" />
          <h1 className="font-display text-4xl md:text-5xl text-gold-light mb-4">
            GA WIDGET SHOWROOM
          </h1>
          <p className="text-marble/70 max-w-3xl mx-auto">
            Gold Arrow's comprehensive suite of proprietary market visualization and analysis tools.
            From real-time tickers to interactive heatmaps — every tool built in-house for institutional-grade analytics.
          </p>
          <p className="text-marble/40 text-xs mt-3">
            Visualization only — Gold Arrow does not execute trades or provide financial advice.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 md:gap-3 mb-8 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 md:px-5 py-1.5 md:py-2 rounded-lg font-display text-[10px] md:text-xs tracking-wider transition-all ${
                activeCategory === cat
                  ? 'bg-gold text-navy'
                  : 'bg-navy-light/50 text-marble hover:bg-navy-light border border-gold/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quick Nav */}
        <div className="flex flex-wrap gap-2 justify-center mb-12 pb-8 border-b border-gold/10">
          {filtered.map(({ id, title }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="text-xs text-gold/60 hover:text-gold transition-colors underline underline-offset-2"
            >
              {title}
            </button>
          ))}
        </div>

        {/* Widget Sections */}
        <div className="space-y-20">
          {filtered.map(({ id, title, description, category }) => (
            <section key={id} id={id} className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-display tracking-widest text-gold/50 bg-gold/10 px-3 py-1 rounded-full uppercase">
                  {category}
                </span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl text-gold-light mb-2">{title}</h2>
              <p className="text-marble/60 text-sm mb-6 max-w-2xl">{description}</p>
              {renderWidget(id)}
            </section>
          ))}
        </div>

        <p className="text-marble/30 text-xs text-center mt-16 pt-8 border-t border-gold/10">
          All market data powered by Gold Arrow proprietary analytics. Visualization only — no trading executed.
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default TradingViewShowroom;
