import { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import LivePulse from '@/components/ga-widgets/LivePulse';

interface Props {
  price: number;
  prevPrice?: number;
  symbol: string;
  label: string;
  change?: number;
  category?: string;
  size?: 'sm' | 'md' | 'lg';
  showChange?: boolean;
  className?: string;
}

/**
 * GALivePriceNotice — Real-time price display widget
 * Powered entirely by GA infrastructure live price feeds.
 * Flashes green/red on tick changes with smooth transitions.
 */
const GALivePriceNotice = ({
  price,
  prevPrice,
  symbol,
  label,
  change = 0,
  category = '',
  size = 'md',
  showChange = true,
  className = '',
}: Props) => {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevRef = useRef(price);
  const flashTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (price === 0) return;
    const prev = prevPrice ?? prevRef.current;
    if (prev > 0 && price !== prev) {
      setFlash(price > prev ? 'up' : 'down');
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlash(null), 600);
    }
    prevRef.current = price;
    return () => { if (flashTimer.current) clearTimeout(flashTimer.current); };
  }, [price, prevPrice]);

  const formatPrice = (p: number) => {
    if (p === 0) return '—';
    if (p < 0.01) return p.toFixed(8);
    if (p < 1) return p.toFixed(6);
    if (p < 10) return p.toFixed(4);
    if (p < 1000) return p.toFixed(2);
    return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const isPositive = change > 0;
  const isNegative = change < 0;
  const changeColor = isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-marble/40';

  const sizeClasses = {
    sm: { price: 'text-sm', label: 'text-[8px]', change: 'text-[8px]', icon: 'w-2.5 h-2.5', container: 'px-2 py-1' },
    md: { price: 'text-base', label: 'text-[9px]', change: 'text-[9px]', icon: 'w-3 h-3', container: 'px-3 py-1.5' },
    lg: { price: 'text-xl', label: 'text-[10px]', change: 'text-[10px]', icon: 'w-3.5 h-3.5', container: 'px-4 py-2' },
  }[size];

  const flashBg = flash === 'up'
    ? 'bg-emerald-500/10 border-emerald-500/30'
    : flash === 'down'
    ? 'bg-red-500/10 border-red-500/30'
    : 'bg-navy-light/30 border-gold/10';

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border transition-all duration-300 ${flashBg} ${sizeClasses.container} ${className}`}>
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className={`${sizeClasses.label} font-display tracking-[0.15em] text-marble/40`}>{label}</span>
          <span className={`${sizeClasses.label} text-marble/20 font-mono`}>{symbol}</span>
          {price > 0 && <LivePulse />}
        </div>
        <div className="flex items-center gap-2">
          <span className={`${sizeClasses.price} font-mono font-bold text-marble tabular-nums`}>
            ${formatPrice(price)}
          </span>
          {showChange && (
            <span className={`flex items-center gap-0.5 ${changeColor} ${sizeClasses.change} font-mono`}>
              {isPositive ? <TrendingUp className={sizeClasses.icon} /> : isNegative ? <TrendingDown className={sizeClasses.icon} /> : <Minus className={sizeClasses.icon} />}
              {isPositive ? '+' : ''}{change.toFixed(2)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GALivePriceNotice;
