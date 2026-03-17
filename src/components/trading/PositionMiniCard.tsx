import { useState, useEffect, useRef, useMemo } from 'react';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useWebSocketPrices } from '@/hooks/useWebSocketPrices';
import GALivePriceNotice from '@/components/ga-widgets/GALivePriceNotice';
import LivePulse from '@/components/ga-widgets/LivePulse';
import { ALL_SYMBOLS, WatchlistSymbol } from '@/data/tradingSymbols';

const MAX_SPARK = 30;

const CRYPTO_WS_MAP: Record<string, string> = {
  'BTC-USD': 'bitcoin', 'ETH-USD': 'ethereum', 'SOL-USD': 'solana',
  'XRP-USD': 'xrp', 'ADA-USD': 'cardano', 'DOGE-USD': 'dogecoin',
  'DOT-USD': 'polkadot', 'LINK-USD': 'chainlink', 'AVAX-USD': 'avalanche',
  'LTC-USD': 'litecoin', 'UNI-USD': 'uniswap', 'MATIC-USD': 'polygon',
  'BNB-USD': 'bnb', 'TRX-USD': 'tron', 'XLM-USD': 'stellar',
};

interface PositionMiniCardProps {
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  posId: string;
  resolvedPrice: number;
  onClose: (id: string, price: number) => void;
  onNavigate: (sym: WatchlistSymbol) => void;
  onSetAskPrice?: (id: string, askPrice: number) => void;
}

/** Miniaturized Intelligence-grade position card with live sparkline + GALivePriceNotice */
const PositionMiniCard = ({
  symbol, side, qty, entryPrice, currentPrice, pnl, pnlPercent,
  posId, resolvedPrice, onClose, onNavigate,
}: PositionMiniCardProps) => {
  const sym = useMemo(() => ALL_SYMBOLS.find(s => s.ticker === symbol), [symbol]);
  const isCrypto = sym?.cat === 'crypto';
  const wsKey = CRYPTO_WS_MAP[symbol] ?? sym?.key ?? '';
  
  // For crypto: use real WebSocket prices
  const wsPrices = useWebSocketPrices(isCrypto && wsKey ? [wsKey] : []);
  const wsData = isCrypto ? wsPrices[wsKey] : undefined;

  // Determine live price: crypto from WS, everything else from resolvedPrice prop
  const livePrice = isCrypto ? (wsData?.price ?? (resolvedPrice || currentPrice)) : (resolvedPrice > 0 ? resolvedPrice : currentPrice);
  const prevPriceRef = useRef(livePrice);
  
  const isProfit = livePrice >= entryPrice;
  const livePnl = (livePrice - entryPrice) * qty * (side === 'buy' ? 1 : -1);
  const livePnlPct = entryPrice > 0 ? ((livePrice - entryPrice) / entryPrice) * 100 * (side === 'buy' ? 1 : -1) : 0;

  // Compute change % for GALivePriceNotice
  const changePercent = entryPrice > 0 ? ((livePrice - entryPrice) / entryPrice) * 100 : 0;

  // Sparkline data
  const [sparkData, setSparkData] = useState<{ v: number }[]>([]);
  const seeded = useRef(false);

  useEffect(() => {
    if (entryPrice > 0 && !seeded.current) {
      const seed = Array.from({ length: 20 }, (_, i) => {
        const progress = i / 19;
        const noise = (Math.sin(i * 1.8) * 0.002 + Math.cos(i * 0.7) * 0.0015) * entryPrice;
        return { v: entryPrice + (livePrice - entryPrice) * progress + noise };
      });
      setSparkData(seed);
      seeded.current = true;
    }
  }, [entryPrice, livePrice]);

  // Append live ticks from real price
  useEffect(() => {
    if (livePrice > 0 && seeded.current && livePrice !== prevPriceRef.current) {
      setSparkData(prev => [...prev.slice(-MAX_SPARK + 1), { v: livePrice }]);
      prevPriceRef.current = livePrice;
    }
  }, [livePrice]);

  const chartColor = isProfit ? 'hsl(145, 70%, 45%)' : 'hsl(0, 70%, 55%)';
  const gradientId = `pos-spark-${posId}`;

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/10 hover:border-gold/30 transition-all overflow-hidden group">
      <button
        onClick={() => sym && onNavigate(sym)}
        className="absolute inset-0 z-0 cursor-pointer"
        title={`View ${symbol} on chart`}
      />

      <div className="relative z-10 p-3 pointer-events-none">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className={`text-[8px] font-mono px-1 py-0.5 rounded ${
              side === 'buy' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
            }`}>{side.toUpperCase()}</span>
            <span className="font-display text-[10px] tracking-[0.15em] text-marble/60">{symbol}</span>
            <span className="text-[8px] text-marble/25 font-mono">{qty} @ ${entryPrice.toFixed(2)}</span>
          </div>
          <ExternalLink className="w-3 h-3 text-marble/15 group-hover:text-gold/50 transition-colors pointer-events-auto cursor-pointer" 
            onClick={(e) => { e.stopPropagation(); sym && onNavigate(sym); }} />
        </div>

        {/* GALivePriceNotice — real-time Intelligence-grade price indicator */}
        <div className="pointer-events-auto mb-1">
          <GALivePriceNotice
            price={livePrice}
            prevPrice={prevPriceRef.current}
            symbol={symbol}
            label={sym?.label ?? symbol}
            change={changePercent}
            category={sym?.cat}
            size="sm"
          />
        </div>

        {/* P&L Row */}
        <div className="flex items-end justify-between mb-1">
          <div className={`flex items-center gap-1 text-xs font-mono font-medium ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
            {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {livePnl >= 0 ? '+' : ''}${livePnl.toFixed(2)}
          </div>
          <div className={`text-[10px] font-mono ${isProfit ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
            {livePnlPct >= 0 ? '+' : ''}{livePnlPct.toFixed(2)}%
          </div>
        </div>

        {/* Live Sparkline */}
        {sparkData.length > 2 && (
          <div className="h-10 -mx-1 mb-1.5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={chartColor} strokeWidth={1.5} fill={`url(#${gradientId})`} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* P&L Explainer */}
        <div className="text-[7px] font-mono text-marble/25 mb-1">
          {side === 'buy' ? 'Price' : 'Price'} {livePrice >= entryPrice ? 'rose' : 'fell'} from ${entryPrice.toFixed(2)} to ${livePrice < 10 ? livePrice.toFixed(4) : livePrice.toFixed(2)} × {qty} = {livePnl >= 0 ? '+' : ''}${livePnl.toFixed(2)}
        </div>

        {/* SELL button */}
        <div className="flex items-center justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); onClose(posId, livePrice); }}
            className="pointer-events-auto text-[8px] font-display tracking-wider text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded border border-red-500/30 bg-red-500/10 hover:bg-red-500/20"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default PositionMiniCard;
