import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GAMultiTicker from '@/components/ga-widgets/GAMultiTicker';

import MarketDataContent from '@/components/intelligence/MarketDataContent';
import BlockchainContent from '@/components/intelligence/BlockchainContent';
import DeFiContent from '@/components/intelligence/DeFiContent';
import CompositeContent from '@/components/intelligence/CompositeContent';
import ProprietaryContent from '@/components/intelligence/ProprietaryContent';
import TradingContent from '@/components/intelligence/TradingContent';
import OilGasContent from '@/components/intelligence/OilGasContent';

import {
  TrendingUp, Bitcoin, Layers, Zap, Shield, Activity, Fuel,
} from 'lucide-react';

type CategoryKey = 'market' | 'blockchain' | 'defi' | 'composite' | 'proprietary' | 'trading' | 'oilgas';

const categories: { key: CategoryKey; label: string; icon: any }[] = [
  { key: 'market', label: 'Market Data', icon: TrendingUp },
  { key: 'blockchain', label: 'Blockchain', icon: Bitcoin },
  { key: 'defi', label: 'DeFi & Sentiment', icon: Layers },
  { key: 'composite', label: 'Composite Tools', icon: Zap },
  { key: 'proprietary', label: 'Proprietary', icon: Shield },
  { key: 'trading', label: 'Trading Tools', icon: Activity },
  { key: 'oilgas', label: 'Oil & Gas', icon: Fuel },
];

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
