import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Layers } from 'lucide-react';
import LivePulse from '@/components/ga-widgets/LivePulse';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  price: number;
  symbolLabel: string;
}

const DepthOfMarket = ({ price, symbolLabel }: Props) => {
  const isMobile = useIsMobile();

  const { bids, asks, depthData, spread, spreadPct } = useMemo(() => {
    if (!price || price === 0) return { bids: [], asks: [], depthData: [], spread: 0, spreadPct: 0 };

    const levels = 12;
    const tickSize = price < 10 ? 0.01 : price < 100 ? 0.05 : price < 1000 ? 0.5 : price < 10000 ? 5 : 50;
    const spreadVal = tickSize * 2;

    const bidLevels = [];
    const askLevels = [];

    for (let i = 0; i < levels; i++) {
      const bidPrice = price - spreadVal / 2 - i * tickSize;
      const askPrice = price + spreadVal / 2 + i * tickSize;
      const bidVol = Math.round(50 + Math.random() * 200 + (levels - i) * 30);
      const askVol = Math.round(50 + Math.random() * 200 + (levels - i) * 25);
      bidLevels.push({ price: parseFloat(bidPrice.toFixed(2)), volume: bidVol, side: 'bid' as const });
      askLevels.push({ price: parseFloat(askPrice.toFixed(2)), volume: askVol, side: 'ask' as const });
    }

    // Cumulative depth chart data
    let cumBid = 0;
    let cumAsk = 0;
    const depth = [
      ...bidLevels.reverse().map(b => { cumBid += b.volume; return { price: b.price, bidVol: cumBid, askVol: 0 }; }),
      ...askLevels.map(a => { cumAsk += a.volume; return { price: a.price, bidVol: 0, askVol: cumAsk }; }),
    ];
    bidLevels.reverse();

    return {
      bids: bidLevels,
      asks: askLevels,
      depthData: depth,
      spread: spreadVal,
      spreadPct: (spreadVal / price) * 100,
    };
  }, [price]);

  if (!price) return null;

  const maxVol = Math.max(...bids.map(b => b.volume), ...asks.map(a => a.volume));

  return (
    <div className="bg-navy-light/30 rounded-lg border border-gold/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gold/10">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-gold" />
          <span className="text-[10px] font-display tracking-wider text-gold-light">DEPTH OF MARKET</span>
          <LivePulse label="SIM" />
        </div>
        <span className="text-[8px] font-mono text-marble/30">{symbolLabel}</span>
      </div>

      {/* Spread */}
      <div className="flex items-center justify-center gap-3 py-1.5 bg-navy-dark/30 border-b border-gold/5">
        <span className="text-[8px] font-mono text-marble/30">SPREAD</span>
        <span className="text-[10px] font-mono text-gold">${spread.toFixed(2)}</span>
        <span className="text-[8px] font-mono text-marble/20">({spreadPct.toFixed(3)}%)</span>
      </div>

      {/* Ladder */}
      <div className="grid grid-cols-3 text-[7px] font-mono text-marble/25 px-2 py-1 border-b border-gold/5">
        <span>BID VOL</span>
        <span className="text-center">PRICE</span>
        <span className="text-right">ASK VOL</span>
      </div>

      <div className="max-h-[240px] overflow-y-auto">
        {/* Asks (reversed so highest at top) */}
        {[...asks].reverse().map((level, i) => (
          <div key={`a-${i}`} className="grid grid-cols-3 px-2 py-0.5 text-[9px] font-mono relative">
            <div className="absolute right-0 top-0 bottom-0 bg-red-500/8" style={{ width: `${(level.volume / maxVol) * 50}%` }} />
            <span />
            <span className="text-center text-red-400/70">{level.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="text-right text-red-400/50 relative z-10">{level.volume}</span>
          </div>
        ))}

        {/* Current price */}
        <div className="grid grid-cols-3 px-2 py-1 bg-gold/10 border-y border-gold/20">
          <span />
          <span className="text-center text-gold font-mono text-[10px] font-semibold">
            {price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span />
        </div>

        {/* Bids */}
        {bids.map((level, i) => (
          <div key={`b-${i}`} className="grid grid-cols-3 px-2 py-0.5 text-[9px] font-mono relative">
            <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/8" style={{ width: `${(level.volume / maxVol) * 50}%` }} />
            <span className="text-emerald-400/50 relative z-10">{level.volume}</span>
            <span className="text-center text-emerald-400/70">{level.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span />
          </div>
        ))}
      </div>

      {/* Depth Chart (hidden on mobile) */}
      {!isMobile && (
        <div className="px-2 py-2 border-t border-gold/5">
          <div className="text-[7px] font-display tracking-wider text-marble/20 mb-1">CUMULATIVE DEPTH</div>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={depthData}>
              <XAxis dataKey="price" tick={{ fontSize: 7, fill: 'hsl(40,25%,96%,0.15)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Area type="stepAfter" dataKey="bidVol" stroke="hsl(145,60%,45%)" fill="hsl(145,60%,45%)" fillOpacity={0.15} strokeWidth={1} />
              <Area type="stepAfter" dataKey="askVol" stroke="hsl(0,70%,50%)" fill="hsl(0,70%,50%)" fillOpacity={0.15} strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default DepthOfMarket;
