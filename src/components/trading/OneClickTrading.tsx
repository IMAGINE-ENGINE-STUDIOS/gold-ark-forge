import { useState } from 'react';
import { Zap, X } from 'lucide-react';
import { usePaperTrading } from '@/hooks/usePaperTrading';
import { useToast } from '@/hooks/use-toast';

interface Props {
  symbol: string;
  price: number;
  spread?: number;
  paper: ReturnType<typeof usePaperTrading>;
  onClose: () => void;
}

const OneClickTrading = ({ symbol, price, spread: spreadProp, paper, onClose }: Props) => {
  const [qty, setQty] = useState('1');
  const { toast } = useToast();
  const spread = spreadProp ?? price * 0.0002;
  const bid = price - spread / 2;
  const ask = price + spread / 2;
  const decimals = price < 10 ? 4 : 2;

  const execute = (side: 'buy' | 'sell') => {
    const q = parseFloat(qty);
    if (!q || q <= 0) return;
    try {
      paper.submitOrder({ symbol, side, qty: q, type: 'market', price });
      toast({
        title: `⚡ ${side.toUpperCase()} FILLED`,
        description: `${q} ${symbol} @ $${price.toFixed(decimals)}`,
      });
    } catch (err) {
      toast({ title: 'Failed', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' });
    }
  };

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-navy-dark/95 border border-gold/30 rounded-lg shadow-2xl backdrop-blur-md px-1 py-1 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
      {/* SELL */}
      <button
        onClick={() => execute('sell')}
        className="flex flex-col items-center px-4 py-2 rounded-l-md bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 transition-all group min-w-[80px]"
      >
        <span className="text-[7px] font-display tracking-[0.2em] text-red-400/60 group-hover:text-red-300">SELL</span>
        <span className="text-sm font-mono text-red-300 font-semibold">{bid.toFixed(decimals)}</span>
      </button>

      {/* QTY */}
      <div className="flex flex-col items-center px-2">
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-16 text-center bg-navy-light/50 border border-gold/20 rounded text-xs font-mono text-marble py-1 focus:outline-none focus:border-gold/50"
          min="0.001"
          step="any"
        />
        <div className="flex gap-1 mt-0.5">
          {[1, 5, 10, 100].map(q => (
            <button
              key={q}
              onClick={() => setQty(String(q))}
              className={`text-[6px] font-mono px-1 py-0.5 rounded transition-colors ${
                qty === String(q) ? 'text-gold bg-gold/15' : 'text-marble/25 hover:text-marble/50'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* BUY */}
      <button
        onClick={() => execute('buy')}
        className="flex flex-col items-center px-4 py-2 rounded-r-md bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 transition-all group min-w-[80px]"
      >
        <span className="text-[7px] font-display tracking-[0.2em] text-emerald-400/60 group-hover:text-emerald-300">BUY</span>
        <span className="text-sm font-mono text-emerald-300 font-semibold">{ask.toFixed(decimals)}</span>
      </button>

      {/* Close */}
      <button onClick={onClose} className="ml-1 p-1 text-marble/25 hover:text-marble/60 transition-colors">
        <X className="w-3 h-3" />
      </button>

      {/* Zap indicator */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-navy-dark border border-gold/20 rounded-full px-2 py-0.5">
        <Zap className="w-2.5 h-2.5 text-gold" />
        <span className="text-[6px] font-display tracking-[0.15em] text-gold/60">ONE-CLICK</span>
      </div>
    </div>
  );
};

export default OneClickTrading;
