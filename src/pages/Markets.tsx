import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GAMultiTicker from '@/components/ga-widgets/GAMultiTicker';
import GAMetalChart from '@/components/ga-widgets/GAMetalChart';
import TradingPanel from '@/components/trading/TradingPanel';
import PortfolioSummary from '@/components/trading/PortfolioSummary';

const symbols = [
  { key: 'gold', label: 'Gold', symbol: 'OANDA:XAUUSD', ticker: 'GLD', broker: 'alpaca' },
  { key: 'silver', label: 'Silver', symbol: 'OANDA:XAGUSD', ticker: 'SLV', broker: 'alpaca' },
  { key: 'platinum', label: 'Platinum', symbol: 'OANDA:XPTUSD', ticker: 'PPLT', broker: 'alpaca' },
  { key: 'bitcoin', label: 'Bitcoin', symbol: 'BITSTAMP:BTCUSD', ticker: 'BTC-USD', broker: 'coinbase' },
  { key: 'ethereum', label: 'Ethereum', symbol: 'BITSTAMP:ETHUSD', ticker: 'ETH-USD', broker: 'coinbase' },
  { key: 'oil', label: 'Oil (WTI)', symbol: 'NYMEX:CL1!', ticker: 'CL', broker: 'ibkr' },
  { key: 'sp500', label: 'S&P 500', symbol: 'FOREXCOM:SPXUSD', ticker: 'SPY', broker: 'alpaca' },
];

const Markets = () => {
  const [activeTab, setActiveTab] = useState('gold');
  const activeSymbol = symbols.find((s) => s.key === activeTab)!;

  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <GAMultiTicker />
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent mb-6" />
          <h1 className="font-display text-4xl md:text-5xl text-gold-light mb-4">
            MARKET OVERVIEW
          </h1>
          <p className="text-marble/70 max-w-2xl mx-auto">
            Real-time multi-asset market visualization with integrated trading via Alpaca, Coinbase, and Interactive Brokers. Gold Arrow does not custody funds.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {symbols.map(({ key, label, broker }) => (
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
              <span className="text-[8px] ml-1.5 opacity-60">{broker === 'coinbase' ? 'CB' : broker === 'ibkr' ? 'IBKR' : 'ALP'}</span>
            </button>
          ))}
        </div>

        {/* Chart + Trading Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GAMetalChart />
          </div>
          <div className="space-y-6">
            <TradingPanel activeSymbol={activeSymbol.ticker} />
            <PortfolioSummary />
          </div>
        </div>

        <p className="text-marble/40 text-xs text-center mt-4">
          Charts powered by Gold Arrow proprietary analytics. Trading executed by your connected broker — Gold Arrow does not execute trades, custody funds, or provide financial advice.
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default Markets;
