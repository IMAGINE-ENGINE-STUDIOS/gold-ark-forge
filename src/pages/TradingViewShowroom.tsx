import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TradingViewTicker from '@/components/tradingview/TradingViewTicker';
import TradingViewChart from '@/components/tradingview/TradingViewChart';
import SymbolOverview from '@/components/tradingview/SymbolOverview';
import TradingViewMiniChart from '@/components/tradingview/TradingViewMiniChart';
import TradingViewTechnicalAnalysis from '@/components/tradingview/TradingViewTechnicalAnalysis';
import TradingViewHeatmap from '@/components/tradingview/TradingViewHeatmap';
import TradingViewScreener from '@/components/tradingview/TradingViewScreener';
import TradingViewMarketOverview from '@/components/tradingview/TradingViewMarketOverview';
import TradingViewForexCrossRates from '@/components/tradingview/TradingViewForexCrossRates';
import TradingViewForexHeatmap from '@/components/tradingview/TradingViewForexHeatmap';
import TradingViewCryptoMarket from '@/components/tradingview/TradingViewCryptoMarket';
import TradingViewSingleTicker from '@/components/tradingview/TradingViewSingleTicker';
import TradingViewEconomicCalendar from '@/components/tradingview/TradingViewEconomicCalendar';

interface ShowcaseSection {
  id: string;
  title: string;
  description: string;
  category: string;
}

const sections: ShowcaseSection[] = [
  { id: 'ticker-tape', title: 'Ticker Tape', description: 'Scrolling real-time quotes in a classic Wall Street ticker format. Ideal for headers and persistent price bars.', category: 'Tickers' },
  { id: 'single-ticker', title: 'Single Ticker', description: 'Compact single-symbol quote display showing price, change, and percentage. Perfect for inline spotlights.', category: 'Tickers' },
  { id: 'mini-chart', title: 'Mini Chart', description: 'Compact symbol overview with a small chart and key stats. Great for sidebars and card layouts.', category: 'Charts' },
  { id: 'symbol-overview', title: 'Symbol Overview', description: 'Multi-symbol area chart with date range selector. A visual snapshot of multiple assets at a glance.', category: 'Charts' },
  { id: 'advanced-chart', title: 'Advanced Chart', description: 'Full-featured interactive chart with indicators, drawing tools, and timeframes. The flagship TradingView experience.', category: 'Charts' },
  { id: 'technical-analysis', title: 'Technical Analysis', description: 'Oscillators and moving average summary gauge showing buy/sell/neutral signals across timeframes.', category: 'Analysis' },
  { id: 'market-overview', title: 'Market Overview', description: 'Tabbed watchlist with embedded chart. Covers multiple asset classes in one widget.', category: 'Watchlists' },
  { id: 'stock-heatmap', title: 'Stock Heatmap', description: 'Visual heatmap of market sectors by market cap and daily change. Macro view at a glance.', category: 'Heatmaps' },
  { id: 'forex-cross-rates', title: 'Forex Cross Rates', description: 'Currency cross-rate matrix showing relative strength between major forex pairs.', category: 'Heatmaps' },
  { id: 'forex-heatmap', title: 'Forex Heatmap', description: 'Color-coded strength visualization of currency pairs. Identifies strong and weak currencies instantly.', category: 'Heatmaps' },
  { id: 'screener', title: 'Commodity Screener', description: 'Sortable table of commodities with fundamental and technical columns. Filter and rank instruments.', category: 'Screeners' },
  { id: 'crypto-market', title: 'Crypto Market', description: 'Cryptocurrency-specific screener with market cap, volume, and performance metrics.', category: 'Screeners' },
  { id: 'economic-calendar', title: 'Economic Calendar', description: 'Upcoming economic events, reports, and data releases with impact ratings and forecasts.', category: 'Data' },
];

const categories = ['All', 'Tickers', 'Charts', 'Analysis', 'Watchlists', 'Heatmaps', 'Screeners', 'Data'];

const TradingViewShowroom = () => {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All' ? sections : sections.filter(s => s.category === activeCategory);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <TradingViewTicker />

      <main className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent mb-6" />
          <h1 className="font-display text-4xl md:text-5xl text-gold-light mb-4">
            TRADINGVIEW SHOWROOM
          </h1>
          <p className="text-marble/70 max-w-3xl mx-auto">
            A comprehensive showcase of every TradingView widget available for integration. 
            From real-time tickers to interactive heatmaps — explore the full suite of market visualization tools.
          </p>
          <p className="text-marble/40 text-xs mt-3">
            All widgets are visualization-only. Gold Arrow does not execute trades or provide financial advice.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-lg font-display text-xs tracking-wider transition-all ${
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

              {/* Render appropriate widget */}
              {id === 'ticker-tape' && (
                <div className="rounded-lg overflow-hidden border border-gold/20">
                  <TradingViewTicker />
                </div>
              )}

              {id === 'single-ticker' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <TradingViewSingleTicker symbol="OANDA:XAUUSD" />
                  <TradingViewSingleTicker symbol="OANDA:XAGUSD" />
                  <TradingViewSingleTicker symbol="OANDA:XPTUSD" />
                  <TradingViewSingleTicker symbol="BITSTAMP:BTCUSD" />
                </div>
              )}

              {id === 'mini-chart' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <TradingViewMiniChart symbol="OANDA:XAUUSD" height={220} />
                  <TradingViewMiniChart symbol="OANDA:XAGUSD" height={220} />
                  <TradingViewMiniChart symbol="BITSTAMP:BTCUSD" height={220} />
                </div>
              )}

              {id === 'symbol-overview' && <SymbolOverview />}
              {id === 'advanced-chart' && <TradingViewChart symbol="OANDA:XAUUSD" height={550} />}
              {id === 'technical-analysis' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TradingViewTechnicalAnalysis symbol="OANDA:XAUUSD" height={420} />
                  <TradingViewTechnicalAnalysis symbol="BITSTAMP:BTCUSD" height={420} />
                </div>
              )}
              {id === 'market-overview' && <TradingViewMarketOverview height={500} />}
              {id === 'stock-heatmap' && <TradingViewHeatmap height={500} />}
              {id === 'forex-cross-rates' && <TradingViewForexCrossRates height={400} />}
              {id === 'forex-heatmap' && <TradingViewForexHeatmap height={400} />}
              {id === 'screener' && <TradingViewScreener height={500} />}
              {id === 'crypto-market' && <TradingViewCryptoMarket height={500} />}
              {id === 'economic-calendar' && <TradingViewEconomicCalendar height={500} />}
            </section>
          ))}
        </div>

        <p className="text-marble/30 text-xs text-center mt-16 pt-8 border-t border-gold/10">
          All market data provided by TradingView. Gold Arrow affiliate ID: 162505. Visualization only — no trading executed.
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default TradingViewShowroom;
