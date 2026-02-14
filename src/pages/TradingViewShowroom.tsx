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
import TradingViewTopStories from '@/components/tradingview/TradingViewTopStories';
import TradingViewCompanyProfile from '@/components/tradingview/TradingViewCompanyProfile';
import TradingViewSymbolInfo from '@/components/tradingview/TradingViewSymbolInfo';
import TradingViewFundamentalData from '@/components/tradingview/TradingViewFundamentalData';
import TradingViewHotlists from '@/components/tradingview/TradingViewHotlists';
import TradingViewMarketQuotes from '@/components/tradingview/TradingViewMarketQuotes';
import TradingViewStockMarket from '@/components/tradingview/TradingViewStockMarket';
import TradingViewTickers from '@/components/tradingview/TradingViewTickers';
import TradingViewSnaps from '@/components/tradingview/TradingViewSnaps';
import WidgetCarousel from '@/components/tradingview/WidgetCarousel';

interface ShowcaseSection {
  id: string;
  title: string;
  description: string;
  category: string;
}

const sections: ShowcaseSection[] = [
  { id: 'ticker-tape', title: 'Live Ticker Tape', description: 'Scrolling real-time quotes in a classic Wall Street ticker format. Ideal for headers and persistent price bars.', category: 'Tickers' },
  { id: 'tickers-strip', title: 'Tickers Strip', description: 'Horizontal strip showing key stats for multiple symbols at a glance. Compact and information-dense.', category: 'Tickers' },
  { id: 'single-ticker', title: 'Single Quote', description: 'Compact single-symbol quote display showing price, change, and percentage. Perfect for inline spotlights.', category: 'Tickers' },
  { id: 'symbol-info', title: 'Symbol Info', description: 'Key symbol data in an easy-to-read format — financials, quotes, and company details at a glance.', category: 'Symbol Details' },
  { id: 'symbol-profile', title: 'Symbol Profile', description: 'Compact symbol profile card with key information and description.', category: 'Symbol Details' },
  { id: 'mini-chart', title: 'Mini Chart', description: 'Compact symbol overview with a small chart and key stats. Great for sidebars and card layouts.', category: 'Charts' },
  { id: 'symbol-overview', title: 'Multi-Asset Overview', description: 'Multi-symbol area chart with date range selector. A visual snapshot of multiple assets at a glance.', category: 'Charts' },
  { id: 'advanced-chart', title: 'Advanced Chart', description: 'Full-featured interactive chart with indicators, drawing tools, and timeframes. The flagship charting experience.', category: 'Charts' },
  { id: 'technical-analysis', title: 'Technical Analysis', description: 'Oscillators and moving average summary gauge showing buy/sell/neutral signals across timeframes.', category: 'Analysis' },
  { id: 'fundamental-data', title: 'Fundamental Data', description: 'Deep dive into a company\'s financials beyond stock price — revenue, earnings, margins, and more.', category: 'Analysis' },
  { id: 'company-profile', title: 'Company Profile', description: 'Detailed company information including description, sector, industry, and key financial data.', category: 'Analysis' },
  { id: 'top-stories', title: 'Market News', description: 'Latest news headlines and stories related to specific symbols. Stay informed with real-time market coverage.', category: 'News' },
  { id: 'market-overview', title: 'Market Overview', description: 'Tabbed watchlist with embedded chart. Covers multiple asset classes in one widget.', category: 'Watchlists' },
  { id: 'market-quotes', title: 'Market Data', description: 'Overview of global markets with Open, High, Low, Close values for selected instruments.', category: 'Watchlists' },
  { id: 'hotlists', title: 'Hotlists', description: 'Trending and top-performing instruments by volume, gainers, and losers. Dynamic market movers.', category: 'Watchlists' },
  { id: 'stock-market', title: 'Stock Market', description: 'Exchange-level stock overview with performance charts and key metrics.', category: 'Watchlists' },
  { id: 'stock-heatmap', title: 'Stock Heatmap', description: 'Visual heatmap of market sectors by market cap and daily change. Macro view at a glance.', category: 'Heatmaps' },
  { id: 'forex-cross-rates', title: 'Forex Cross Rates', description: 'Currency cross-rate matrix showing relative strength between major forex pairs.', category: 'Heatmaps' },
  { id: 'forex-heatmap', title: 'Forex Heatmap', description: 'Color-coded strength visualization of currency pairs. Identifies strong and weak currencies instantly.', category: 'Heatmaps' },
  { id: 'screener', title: 'Commodity Screener', description: 'Sortable table of commodities with fundamental and technical columns. Filter and rank instruments.', category: 'Screeners' },
  { id: 'crypto-market', title: 'Crypto Market', description: 'Cryptocurrency-specific screener with market cap, volume, and performance metrics.', category: 'Screeners' },
  { id: 'economic-calendar', title: 'Economic Calendar', description: 'Upcoming economic events, reports, and data releases with impact ratings and forecasts.', category: 'Data' },
];

const categories = ['All', 'Tickers', 'Symbol Details', 'Charts', 'Analysis', 'News', 'Watchlists', 'Heatmaps', 'Screeners', 'Data'];

const TradingViewShowroom = () => {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All' ? sections : sections.filter(s => s.category === activeCategory);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderWidget = (id: string) => {
    switch (id) {
      case 'ticker-tape':
        return (
          <div className="rounded-lg overflow-hidden border border-gold/20">
            <TradingViewTicker />
          </div>
        );

      case 'tickers-strip':
        return (
          <WidgetCarousel
            variants={[
              {
                label: 'Metals & Crypto',
                description: 'Precious metals and cryptocurrency tickers',
                render: () => <TradingViewTickers />,
              },
              {
                label: 'Indices',
                description: 'Major stock indices',
                render: () => (
                  <TradingViewTickers
                    symbols={[
                      { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
                      { proName: 'FOREXCOM:DJI', title: 'Dow Jones' },
                      { proName: 'FOREXCOM:NSXUSD', title: 'Nasdaq' },
                      { proName: 'TVC:UKX', title: 'FTSE 100' },
                    ]}
                  />
                ),
              },
              {
                label: 'Forex',
                description: 'Major currency pairs',
                render: () => (
                  <TradingViewTickers
                    symbols={[
                      { proName: 'FX:EURUSD', title: 'EUR/USD' },
                      { proName: 'FX:GBPUSD', title: 'GBP/USD' },
                      { proName: 'FX:USDJPY', title: 'USD/JPY' },
                      { proName: 'FX:AUDUSD', title: 'AUD/USD' },
                    ]}
                  />
                ),
              },
            ]}
          />
        );

      case 'single-ticker':
        return (
          <WidgetCarousel
            variants={[
              {
                label: 'Precious Metals',
                render: () => (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <TradingViewSingleTicker symbol="OANDA:XAUUSD" />
                    <TradingViewSingleTicker symbol="OANDA:XAGUSD" />
                    <TradingViewSingleTicker symbol="OANDA:XPTUSD" />
                    <TradingViewSingleTicker symbol="TVC:PALLADIUM" />
                  </div>
                ),
              },
              {
                label: 'Crypto',
                render: () => (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <TradingViewSingleTicker symbol="BITSTAMP:BTCUSD" />
                    <TradingViewSingleTicker symbol="BITSTAMP:ETHUSD" />
                    <TradingViewSingleTicker symbol="BINANCE:SOLUSD" />
                    <TradingViewSingleTicker symbol="BINANCE:ADAUSD" />
                  </div>
                ),
              },
              {
                label: 'Indices',
                render: () => (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <TradingViewSingleTicker symbol="FOREXCOM:SPXUSD" />
                    <TradingViewSingleTicker symbol="FOREXCOM:DJI" />
                    <TradingViewSingleTicker symbol="FOREXCOM:NSXUSD" />
                    <TradingViewSingleTicker symbol="TVC:UKX" />
                  </div>
                ),
              },
            ]}
          />
        );

      case 'symbol-info':
        return (
          <WidgetCarousel
            variants={[
              { label: 'Gold', render: () => <TradingViewSymbolInfo symbol="OANDA:XAUUSD" /> },
              { label: 'Silver', render: () => <TradingViewSymbolInfo symbol="OANDA:XAGUSD" /> },
              { label: 'Bitcoin', render: () => <TradingViewSymbolInfo symbol="BITSTAMP:BTCUSD" /> },
              { label: 'Apple', render: () => <TradingViewSymbolInfo symbol="NASDAQ:AAPL" /> },
            ]}
          />
        );

      case 'symbol-profile':
        return (
          <WidgetCarousel
            variants={[
              { label: 'Gold', render: () => <TradingViewSnaps symbol="OANDA:XAUUSD" height={300} /> },
              { label: 'Apple', render: () => <TradingViewSnaps symbol="NASDAQ:AAPL" height={300} /> },
              { label: 'Bitcoin', render: () => <TradingViewSnaps symbol="BITSTAMP:BTCUSD" height={300} /> },
            ]}
          />
        );

      case 'mini-chart':
        return (
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
        );

      case 'symbol-overview':
        return <SymbolOverview />;

      case 'advanced-chart':
        return (
          <WidgetCarousel
            variants={[
              { label: 'Gold', render: () => <TradingViewChart symbol="OANDA:XAUUSD" height={550} /> },
              { label: 'Silver', render: () => <TradingViewChart symbol="OANDA:XAGUSD" height={550} /> },
              { label: 'Bitcoin', render: () => <TradingViewChart symbol="BITSTAMP:BTCUSD" height={550} /> },
              { label: 'S&P 500', render: () => <TradingViewChart symbol="FOREXCOM:SPXUSD" height={550} /> },
            ]}
          />
        );

      case 'technical-analysis':
        return (
          <WidgetCarousel
            variants={[
              {
                label: 'Metals',
                render: () => (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TradingViewTechnicalAnalysis symbol="OANDA:XAUUSD" height={420} />
                    <TradingViewTechnicalAnalysis symbol="OANDA:XAGUSD" height={420} />
                  </div>
                ),
              },
              {
                label: 'Crypto',
                render: () => (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TradingViewTechnicalAnalysis symbol="BITSTAMP:BTCUSD" height={420} />
                    <TradingViewTechnicalAnalysis symbol="BITSTAMP:ETHUSD" height={420} />
                  </div>
                ),
              },
            ]}
          />
        );

      case 'fundamental-data':
        return (
          <WidgetCarousel
            variants={[
              { label: 'Apple', render: () => <TradingViewFundamentalData symbol="NASDAQ:AAPL" height={490} /> },
              { label: 'Google', render: () => <TradingViewFundamentalData symbol="NASDAQ:GOOGL" height={490} /> },
              { label: 'Tesla', render: () => <TradingViewFundamentalData symbol="NASDAQ:TSLA" height={490} /> },
            ]}
          />
        );

      case 'company-profile':
        return (
          <WidgetCarousel
            variants={[
              { label: 'Apple', render: () => <TradingViewCompanyProfile symbol="NASDAQ:AAPL" height={480} /> },
              { label: 'Google', render: () => <TradingViewCompanyProfile symbol="NASDAQ:GOOGL" height={480} /> },
              { label: 'Microsoft', render: () => <TradingViewCompanyProfile symbol="NASDAQ:MSFT" height={480} /> },
            ]}
          />
        );

      case 'top-stories':
        return (
          <WidgetCarousel
            variants={[
              {
                label: 'Metals & Crypto',
                render: () => (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TradingViewTopStories symbol="OANDA:XAUUSD" height={500} />
                    <TradingViewTopStories symbol="BITSTAMP:BTCUSD" height={500} />
                  </div>
                ),
              },
              {
                label: 'Tech Stocks',
                render: () => (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TradingViewTopStories symbol="NASDAQ:AAPL" height={500} />
                    <TradingViewTopStories symbol="NASDAQ:TSLA" height={500} />
                  </div>
                ),
              },
            ]}
          />
        );

      case 'market-overview':
        return <TradingViewMarketOverview height={500} />;

      case 'market-quotes':
        return <TradingViewMarketQuotes height={500} />;

      case 'hotlists':
        return (
          <WidgetCarousel
            variants={[
              { label: 'US Market', render: () => <TradingViewHotlists exchange="US" height={500} /> },
              { label: 'Europe', render: () => <TradingViewHotlists exchange="europe" height={500} /> },
              { label: 'Asia', render: () => <TradingViewHotlists exchange="asia" height={500} /> },
            ]}
          />
        );

      case 'stock-market':
        return (
          <WidgetCarousel
            variants={[
              { label: 'US', render: () => <TradingViewStockMarket exchange="US" height={500} /> },
              { label: 'Germany', render: () => <TradingViewStockMarket exchange="germany" height={500} /> },
              { label: 'UK', render: () => <TradingViewStockMarket exchange="UK" height={500} /> },
            ]}
          />
        );

      case 'stock-heatmap':
        return <TradingViewHeatmap height={500} />;

      case 'forex-cross-rates':
        return <TradingViewForexCrossRates height={400} />;

      case 'forex-heatmap':
        return <TradingViewForexHeatmap height={400} />;

      case 'screener':
        return (
          <WidgetCarousel
            variants={[
              { label: 'Most Capitalized', render: () => <TradingViewScreener height={500} defaultScreen="most_capitalized" /> },
              { label: 'Top Gainers', render: () => <TradingViewScreener height={500} defaultScreen="top_gainers" /> },
              { label: 'Top Losers', render: () => <TradingViewScreener height={500} defaultScreen="top_losers" /> },
            ]}
          />
        );

      case 'crypto-market':
        return <TradingViewCryptoMarket height={500} />;

      case 'economic-calendar':
        return <TradingViewEconomicCalendar height={500} />;

      default:
        return null;
    }
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
            MARKET INTELLIGENCE
          </h1>
          <p className="text-marble/70 max-w-3xl mx-auto">
            Gold Arrow's comprehensive suite of market visualization and analysis tools.
            From real-time tickers to interactive heatmaps — every tool you need to monitor global markets.
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
          Market data powered by industry-standard feeds. Visualization only — no trading executed.
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default TradingViewShowroom;
