import { useSpreads } from '@/hooks/useOilGasData';
import WidgetShell from '@/components/ga-widgets/WidgetShell';
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const SpreadCard = ({ label, value, sub, color, prevValue, delay }: { label: string; value: number; sub: string; color: string; prevValue: number; delay: number }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlash(value > prevRef.current ? 'up' : 'down');
      // Animate number
      const start = prevRef.current;
      const diff = value - start;
      const duration = 600;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setDisplayValue(start + diff * eased);
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
      prevRef.current = value;
      setTimeout(() => setFlash(null), 1200);
    }
  }, [value]);

  const trend = value - prevValue;

  return (
    <div
      className={`rounded-sm bg-navy-dark/60 border p-4 transition-all duration-500 hover:border-gold/40 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_-8px_hsla(43,72%,50%,0.15)] ${
        flash === 'up' ? 'border-emerald-400/40' : flash === 'down' ? 'border-red-400/40' : 'border-gold/15'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] text-marble/40 font-display tracking-wider">{label}</p>
        <div className="flex items-center gap-1">
          {trend > 0.05 ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : trend < -0.05 ? <TrendingDown className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3 text-marble/30" />}
        </div>
      </div>
      <p className="font-display text-2xl font-semibold" style={{ color }}>
        {displayValue > 0 ? '+' : ''}{displayValue.toFixed(2)}
        <span className="text-xs text-marble/30 ml-1">$/bbl</span>
      </p>
      <p className="text-[10px] text-marble/25 mt-1">{sub}</p>

      {/* Mini bar indicator */}
      <div className="mt-2 h-1 bg-navy/60 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(Math.abs(value) / 40 * 100, 100)}%`,
            backgroundColor: color,
            opacity: 0.6,
          }}
        />
      </div>
    </div>
  );
};

const OGCrackSpreads = () => {
  const { data: spreads, isLoading } = useSpreads();
  const [showInfo, setShowInfo] = useState(false);

  const prevSpreads = useRef(spreads);
  useEffect(() => {
    if (spreads) prevSpreads.current = spreads;
  }, [spreads]);

  return (
    <WidgetShell icon={ArrowLeftRight} title="SPREADS & MARGINS" badge="LIVE">
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-navy-light/30 rounded animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Info toggle */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center gap-1.5 text-[10px] font-display tracking-wider text-marble/30 hover:text-gold/70 transition-colors"
            >
              <Info className="w-3 h-3" />
              {showInfo ? 'HIDE' : 'WHAT ARE SPREADS?'}
            </button>
          </div>

          {showInfo && (
            <div className="text-xs text-marble/40 bg-navy-dark/60 border border-gold/10 rounded p-3 space-y-1 animate-fade-in">
              <p><strong className="text-marble/60">WTI–Brent:</strong> The price differential between US and international crude benchmarks.</p>
              <p><strong className="text-marble/60">3-2-1 Crack:</strong> Refinery gross margin — 3 barrels crude refined into 2 barrels gasoline + 1 barrel distillate.</p>
              <p><strong className="text-marble/60">Heat Crack:</strong> Margin from refining crude into heating oil/diesel.</p>
              <p><strong className="text-marble/60">Spark Spread:</strong> Profitability of generating electricity from natural gas.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SpreadCard label="WTI–BRENT SPREAD" value={spreads?.wtiBrent ?? 0} prevValue={prevSpreads.current?.wtiBrent ?? 0} sub="Front-month differential" color="hsl(210,60%,55%)" delay={0} />
            <SpreadCard label="3-2-1 CRACK SPREAD" value={spreads?.crack321 ?? 0} prevValue={prevSpreads.current?.crack321 ?? 0} sub="Refinery gross margin" color="hsl(43,72%,55%)" delay={100} />
            <SpreadCard label="HEATING OIL CRACK" value={spreads?.heatCrack ?? 0} prevValue={prevSpreads.current?.heatCrack ?? 0} sub="Distillate margin" color="hsl(0,60%,55%)" delay={200} />
            <SpreadCard label="SPARK SPREAD" value={spreads?.sparkSpread ?? 0} prevValue={prevSpreads.current?.sparkSpread ?? 0} sub="Gas-to-power margin" color="hsl(145,60%,45%)" delay={300} />
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

export default OGCrackSpreads;
