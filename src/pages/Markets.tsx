import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TradingViewChart from '@/components/tradingview/TradingViewChart';
import TradingViewTicker from '@/components/tradingview/TradingViewTicker';
import TradingPanel from '@/components/trading/TradingPanel';

const symbols = [
  { key: 'gold', label: 'Gold', symbol: 'OANDA:XAUUSD' },
  { key: 'silver', label: 'Silver', symbol: 'OANDA:XAGUSD' },
  { key: 'platinum', label: 'Platinum', symbol: 'OANDA:XPTUSD' },
  { key: 'bitcoin', label: 'Bitcoin', symbol: 'BITSTAMP:BTCUSD' },
];

const Markets = () => {
  const [activeTab, setActiveTab] = useState('gold');
  const activeSymbol = symbols.find((s) => s.key === activeTab)!;

  // Derive a simple ticker from the active chart symbol for the order form
  const tradingSymbol = activeTab === 'bitcoin' ? 'BTC/USD' : activeTab === 'gold' ? 'GLD' : activeTab === 'silver' ? 'SLV' : 'PPLT';

  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <TradingViewTicker />
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent mb-6" />
          <h1 className="font-display text-4xl md:text-5xl text-gold-light mb-4">
            MARKET OVERVIEW
          </h1>
          <p className="text-marble/70 max-w-2xl mx-auto">
            Real-time precious metals and Bitcoin market visualization with integrated trading via Alpaca. Gold Arrow does not custody funds.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {symbols.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-6 py-2.5 rounded-lg font-display text-sm tracking-wider transition-all ${
                activeTab === key
                  ? 'bg-gold text-navy'
                  : 'bg-navy-light/50 text-marble hover:bg-navy-light border border-gold/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Chart + Trading Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TradingViewChart symbol={activeSymbol.symbol} height={600} />
          </div>
          <div>
            <TradingPanel activeSymbol={tradingSymbol} />
          </div>
        </div>

        <p className="text-marble/40 text-xs text-center mt-4">
          Charts are visualization-only and provided by TradingView. Trading is executed by Alpaca — Gold Arrow does not execute trades, custody funds, or provide financial advice.
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default Markets;
