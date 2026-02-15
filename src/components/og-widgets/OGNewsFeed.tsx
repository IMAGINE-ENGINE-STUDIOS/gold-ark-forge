import { Newspaper, Clock } from 'lucide-react';
import { useState, useMemo } from 'react';
import LivePulse from '@/components/ga-widgets/LivePulse';
import { useOilGasPrices } from '@/hooks/useOilGasData';

interface OGNewsItem {
  id: string;
  title: string;
  source: string;
  category: string;
  timestamp: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

const generateOGNews = (prices: any): OGNewsItem[] => {
  const now = Date.now();
  const wtiChange = prices?.[0]?.change ?? 0;
  const ngChange = prices?.[2]?.change ?? 0;

  const templates: Omit<OGNewsItem, 'id' | 'timestamp'>[] = [
    { title: `WTI crude ${wtiChange > 0 ? 'climbs' : 'falls'} ${Math.abs(wtiChange).toFixed(1)}% on ${wtiChange > 0 ? 'supply concerns' : 'demand weakness'}`, source: 'GA Energy Desk', category: 'Crude', sentiment: wtiChange > 0 ? 'bullish' : 'bearish' },
    { title: 'EIA reports larger-than-expected crude drawdown of 3.2M barrels', source: 'U.S. EIA', category: 'Supply', sentiment: 'bullish' },
    { title: `Natural gas ${ngChange > 0 ? 'surges' : 'retreats'} as weather forecasts shift`, source: 'GA Energy Desk', category: 'NatGas', sentiment: ngChange > 0 ? 'bullish' : 'bearish' },
    { title: 'OPEC+ signals production cut extension through Q2', source: 'OPEC Secretariat', category: 'OPEC', sentiment: 'bullish' },
    { title: 'Baker Hughes: U.S. oil rig count falls by 5 to 479', source: 'Baker Hughes', category: 'Rigs', sentiment: 'bullish' },
    { title: 'Permian Basin output reaches record 6.2 million bpd', source: 'GA Research', category: 'Production', sentiment: 'bearish' },
    { title: 'Geopolitical tensions in Strait of Hormuz lift risk premium', source: 'GA Macro', category: 'Geopolitical', sentiment: 'bullish' },
    { title: 'Refinery utilization rises to 93.4% ahead of driving season', source: 'U.S. EIA', category: 'Refining', sentiment: 'neutral' },
    { title: 'China crude imports rise 5% YoY in latest customs data', source: 'GA Asia Desk', category: 'Demand', sentiment: 'bullish' },
    { title: 'Strategic Petroleum Reserve at lowest level since 1983', source: 'DOE', category: 'Supply', sentiment: 'bullish' },
    { title: 'European gas storage draws accelerate amid cold snap', source: 'GIE/AGSI', category: 'NatGas', sentiment: 'bullish' },
    { title: 'IEA cuts global oil demand growth forecast for 2026', source: 'IEA', category: 'Demand', sentiment: 'bearish' },
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

const OGNewsFeed = () => {
  const { data: prices } = useOilGasPrices();
  const [filter, setFilter] = useState<'all' | 'crude' | 'natgas' | 'supply'>('all');

  const news = useMemo(() => generateOGNews(prices), [prices]);
  const filtered = filter === 'all' ? news : news.filter((n) =>
    filter === 'crude' ? ['Crude', 'OPEC', 'Geopolitical'].includes(n.category) :
    filter === 'natgas' ? n.category === 'NatGas' :
    ['Supply', 'Rigs', 'Production', 'Refining', 'Demand'].includes(n.category)
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
            <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">ENERGY INTELLIGENCE FEED</h3>
            <LivePulse label="LIVE" />
          </div>
          <div className="flex gap-1">
            {(['all', 'crude', 'natgas', 'supply'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-[10px] font-display tracking-wider rounded transition-all ${filter === f ? 'bg-gold/20 text-gold border border-gold/40' : 'text-marble/40 hover:text-marble/70 border border-transparent'}`}>
                {f === 'natgas' ? 'GAS' : f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(43,72%,50%,0.3) transparent' }}>
          {filtered.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded hover:bg-navy-light/20 transition-colors group">
              <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-gold/40" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm text-marble/80 leading-tight group-hover:text-marble transition-colors">{item.title}</h4>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
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

export default OGNewsFeed;
