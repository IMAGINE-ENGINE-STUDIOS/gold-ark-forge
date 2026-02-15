import { Newspaper, Clock, Bookmark, ExternalLink } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import LivePulse from '@/components/ga-widgets/LivePulse';
import { useOilGasPrices } from '@/hooks/useOilGasData';

interface OGNewsItem {
  id: string;
  title: string;
  source: string;
  category: string;
  timestamp: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  impact: 'high' | 'medium' | 'low';
}

const generateOGNews = (prices: any): OGNewsItem[] => {
  const now = Date.now();
  const wtiChange = prices?.[0]?.change ?? 0;
  const ngChange = prices?.[2]?.change ?? 0;

  const templates: Omit<OGNewsItem, 'id' | 'timestamp'>[] = [
    { title: `WTI crude ${wtiChange > 0 ? 'climbs' : 'falls'} ${Math.abs(wtiChange).toFixed(1)}% on ${wtiChange > 0 ? 'supply concerns' : 'demand weakness'}`, source: 'GA Energy Desk', category: 'Crude', sentiment: wtiChange > 0 ? 'bullish' : 'bearish', impact: 'high' },
    { title: 'EIA reports larger-than-expected crude drawdown of 3.2M barrels', source: 'U.S. EIA', category: 'Supply', sentiment: 'bullish', impact: 'high' },
    { title: `Natural gas ${ngChange > 0 ? 'surges' : 'retreats'} as weather forecasts shift`, source: 'GA Energy Desk', category: 'NatGas', sentiment: ngChange > 0 ? 'bullish' : 'bearish', impact: 'medium' },
    { title: 'OPEC+ signals production cut extension through Q2', source: 'OPEC Secretariat', category: 'OPEC', sentiment: 'bullish', impact: 'high' },
    { title: 'Baker Hughes: U.S. oil rig count falls by 5 to 479', source: 'Baker Hughes', category: 'Rigs', sentiment: 'bullish', impact: 'medium' },
    { title: 'Permian Basin output reaches record 6.2 million bpd', source: 'GA Research', category: 'Production', sentiment: 'bearish', impact: 'high' },
    { title: 'Geopolitical tensions in Strait of Hormuz lift risk premium', source: 'GA Macro', category: 'Geopolitical', sentiment: 'bullish', impact: 'high' },
    { title: 'Refinery utilization rises to 93.4% ahead of driving season', source: 'U.S. EIA', category: 'Refining', sentiment: 'neutral', impact: 'low' },
    { title: 'China crude imports rise 5% YoY in latest customs data', source: 'GA Asia Desk', category: 'Demand', sentiment: 'bullish', impact: 'medium' },
    { title: 'Strategic Petroleum Reserve at lowest level since 1983', source: 'DOE', category: 'Supply', sentiment: 'bullish', impact: 'medium' },
    { title: 'European gas storage draws accelerate amid cold snap', source: 'GIE/AGSI', category: 'NatGas', sentiment: 'bullish', impact: 'medium' },
    { title: 'IEA cuts global oil demand growth forecast for 2026', source: 'IEA', category: 'Demand', sentiment: 'bearish', impact: 'high' },
  ];

  return templates.map((t, i) => ({
    ...t,
    id: `og-news-${i}`,
    timestamp: new Date(now - i * 3600000 * (1 + Math.random())).toISOString(),
  }));
};

const sentimentColors = {
  bullish: 'text-emerald-400 bg-emerald-400/10',
  bearish: 'text-red-400 bg-red-400/10',
  neutral: 'text-marble/50 bg-marble/10',
};

const impactDots = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-marble/30',
};

const OGNewsFeed = () => {
  const { data: prices } = useOilGasPrices();
  const [filter, setFilter] = useState<'all' | 'crude' | 'natgas' | 'supply'>('all');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all');
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const news = useMemo(() => generateOGNews(prices), [prices]);

  const filtered = useMemo(() => {
    let items = filter === 'all' ? news : news.filter((n) =>
      filter === 'crude' ? ['Crude', 'OPEC', 'Geopolitical'].includes(n.category) :
      filter === 'natgas' ? n.category === 'NatGas' :
      ['Supply', 'Rigs', 'Production', 'Refining', 'Demand'].includes(n.category)
    );
    if (sentimentFilter !== 'all') items = items.filter(n => n.sentiment === sentimentFilter);
    return items;
  }, [news, filter, sentimentFilter]);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Newspaper className="w-5 h-5 text-gold" />
            <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">ENERGY INTELLIGENCE FEED</h3>
            <LivePulse label="LIVE" />
          </div>
          <span className="text-[10px] text-marble/25 font-display">{filtered.length} ITEMS</span>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-1 mb-3">
          {(['all', 'crude', 'natgas', 'supply'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-[10px] font-display tracking-wider rounded transition-all duration-300 ${filter === f ? 'bg-gold/20 text-gold border border-gold/40' : 'text-marble/40 hover:text-marble/70 border border-transparent hover:border-gold/20'}`}>
              {f === 'natgas' ? 'GAS' : f.toUpperCase()}
            </button>
          ))}
          <span className="text-marble/10 mx-1">|</span>
          {/* Sentiment filters */}
          {(['all', 'bullish', 'bearish', 'neutral'] as const).map((s) => (
            <button key={s} onClick={() => setSentimentFilter(s)} className={`px-2 py-1 text-[9px] font-display tracking-wider rounded transition-all duration-200 ${sentimentFilter === s ? 'bg-gold/15 text-gold border border-gold/30' : 'text-marble/25 hover:text-marble/50 border border-transparent'}`}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(43,72%,50%,0.3) transparent' }}>
          {filtered.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded transition-all duration-300 group cursor-pointer ${
                expandedItem === item.id ? 'bg-navy-light/30 border border-gold/15' : 'hover:bg-navy-light/20 border border-transparent'
              }`}
              onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
              style={{ animation: `fade-in 0.3s ease-out ${i * 30}ms both` }}
            >
              {/* Impact dot */}
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${impactDots[item.impact]} transition-transform duration-200 group-hover:scale-125`} />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm text-marble/80 leading-tight group-hover:text-marble transition-colors duration-200">{item.title}</h4>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-marble/40 font-display tracking-wider">{item.source}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-display tracking-wider transition-all duration-200 ${sentimentColors[item.sentiment]}`}>
                    {item.sentiment.toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-marble/30">
                    <Clock className="w-2.5 h-2.5" />
                    {timeAgo(item.timestamp)}
                  </span>
                  <span className="text-[9px] text-marble/20 font-display tracking-wider">{item.category}</span>
                </div>

                {/* Expanded detail */}
                {expandedItem === item.id && (
                  <div className="mt-3 pt-2 border-t border-gold/10 animate-fade-in flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(item.id); }}
                      className={`flex items-center gap-1 text-[9px] font-display tracking-wider px-2 py-1 rounded transition-all ${
                        bookmarked.has(item.id) ? 'bg-gold/20 text-gold' : 'text-marble/30 hover:text-gold/60'
                      }`}
                    >
                      <Bookmark className="w-3 h-3" fill={bookmarked.has(item.id) ? 'currentColor' : 'none'} />
                      {bookmarked.has(item.id) ? 'SAVED' : 'SAVE'}
                    </button>
                    <span className="text-[9px] text-marble/20">Impact: <span className={`${item.impact === 'high' ? 'text-red-400' : item.impact === 'medium' ? 'text-amber-400' : 'text-marble/40'}`}>{item.impact.toUpperCase()}</span></span>
                  </div>
                )}
              </div>

              {/* Bookmark indicator */}
              {bookmarked.has(item.id) && (
                <Bookmark className="w-3 h-3 text-gold/50 flex-shrink-0 mt-1" fill="currentColor" />
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-marble/30 py-8">No items match filters</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OGNewsFeed;
