import { Newspaper, ExternalLink, Clock } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import LivePulse from './LivePulse';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useCryptoData } from '@/hooks/useCryptoData';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  category: string;
  timestamp: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  relevance: 'gold' | 'silver' | 'platinum' | 'crypto' | 'macro';
}

// Generate context-aware news based on live market data
const generateNews = (metalPrices: any, crypto: any): NewsItem[] => {
  const now = Date.now();
  const items: NewsItem[] = [];

  const goldChange = metalPrices?.gold?.change_24h ?? 0;
  const silverChange = metalPrices?.silver?.change_24h ?? 0;
  const btcPrice = crypto?.[0]?.current_price ?? 0;
  const btcChange = crypto?.[0]?.price_change_percentage_24h ?? 0;

  const templates = [
    { title: `Gold ${goldChange > 0 ? 'rallies' : 'dips'} ${Math.abs(goldChange).toFixed(1)}% amid global uncertainty`, source: 'GA Analytics', category: 'Metals', sentiment: goldChange > 0 ? 'bullish' : 'bearish' as any, relevance: 'gold' as const },
    { title: `Silver ${silverChange > 0 ? 'gains' : 'slides'} as industrial demand ${silverChange > 0 ? 'surges' : 'weakens'}`, source: 'GA Research', category: 'Metals', sentiment: silverChange > 0 ? 'bullish' : 'bearish' as any, relevance: 'silver' as const },
    { title: `Bitcoin ${btcChange > 0 ? 'breaks above' : 'tests support at'} $${(btcPrice / 1000).toFixed(0)}K level`, source: 'GA Crypto Desk', category: 'Crypto', sentiment: btcChange > 0 ? 'bullish' : 'bearish' as any, relevance: 'crypto' as const },
    { title: 'Central banks increase gold reserves for 18th consecutive month', source: 'World Gold Council', category: 'Macro', sentiment: 'bullish' as any, relevance: 'gold' as const },
    { title: 'Federal Reserve signals patience on rate cuts, markets react', source: 'GA Macro', category: 'Macro', sentiment: 'neutral' as any, relevance: 'macro' as const },
    { title: 'Platinum supply deficit widens on South African output drop', source: 'WPIC', category: 'Metals', sentiment: 'bullish' as any, relevance: 'platinum' as const },
    { title: 'ETF gold holdings hit 3-year high as investors seek safety', source: 'GA Analytics', category: 'Metals', sentiment: 'bullish' as any, relevance: 'gold' as const },
    { title: `Ethereum network activity spikes, gas fees ${Math.random() > 0.5 ? 'rise' : 'stabilize'}`, source: 'GA Crypto Desk', category: 'Crypto', sentiment: 'neutral' as any, relevance: 'crypto' as const },
    { title: 'Treasury yields decline, supporting precious metals complex', source: 'GA Research', category: 'Macro', sentiment: 'bullish' as any, relevance: 'macro' as const },
    { title: 'Silver industrial demand from solar sector reaches record', source: 'Silver Institute', category: 'Metals', sentiment: 'bullish' as any, relevance: 'silver' as const },
    { title: 'BRICS nations accelerate de-dollarization push', source: 'GA Macro', category: 'Macro', sentiment: 'bullish' as any, relevance: 'gold' as const },
    { title: 'DeFi total value locked surpasses previous quarter high', source: 'GA Crypto Desk', category: 'Crypto', sentiment: 'bullish' as any, relevance: 'crypto' as const },
  ];

  templates.forEach((t, i) => {
    items.push({
      id: `news-${i}`,
      title: t.title,
      source: t.source,
      category: t.category,
      timestamp: new Date(now - i * 3600000 * (1 + Math.random())).toISOString(),
      sentiment: t.sentiment,
      relevance: t.relevance,
    });
  });

  return items;
};

const sentimentColors = {
  bullish: 'text-emerald-400 bg-emerald-400/10',
  bearish: 'text-red-400 bg-red-400/10',
  neutral: 'text-marble/50 bg-marble/10',
};

const relevanceColors: Record<string, string> = {
  gold: 'text-gold', silver: 'text-silver', platinum: 'text-platinum', crypto: 'text-blue-400', macro: 'text-marble/60',
};

const GANewsFeed = () => {
  const { data: metals } = useMetalPrices();
  const { data: crypto } = useCryptoData(5);
  const [filter, setFilter] = useState<'all' | 'metals' | 'crypto' | 'macro'>('all');

  const news = useMemo(() => generateNews(metals, crypto), [metals, crypto]);
  const filtered = filter === 'all' ? news : news.filter((n) =>
    filter === 'metals' ? ['gold', 'silver', 'platinum'].includes(n.relevance) :
    filter === 'crypto' ? n.relevance === 'crypto' : n.relevance === 'macro'
  );

  const timeAgo = (ts: string) => {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Newspaper className="w-5 h-5 text-gold" />
            <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">MARKET INTELLIGENCE FEED</h3>
            <LivePulse label="LIVE" />
          </div>
          <div className="flex gap-1">
            {(['all', 'metals', 'crypto', 'macro'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-[10px] font-display tracking-wider rounded transition-all ${filter === f ? 'bg-gold/20 text-gold border border-gold/40' : 'text-marble/40 hover:text-marble/70 border border-transparent'}`}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(43, 72%, 50%, 0.3) transparent' }}>
          {filtered.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded hover:bg-navy-light/20 transition-colors group cursor-default">
              <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${relevanceColors[item.relevance]?.replace('text-', 'bg-')}`} />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm text-marble/80 leading-tight group-hover:text-marble transition-colors">{item.title}</h4>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-marble/40 font-display tracking-wider">{item.source}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-display tracking-wider ${sentimentColors[item.sentiment]}`}>
                    {item.sentiment.toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-marble/30">
                    <Clock className="w-2.5 h-2.5" />
                    {timeAgo(item.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GANewsFeed;
