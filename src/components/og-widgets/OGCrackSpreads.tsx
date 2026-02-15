import { useSpreads } from '@/hooks/useOilGasData';
import WidgetShell from '@/components/ga-widgets/WidgetShell';
import { ArrowLeftRight } from 'lucide-react';

const SpreadCard = ({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) => (
  <div className="rounded-sm bg-navy-dark/60 border border-gold/15 p-4 hover:border-gold/30 transition-all">
    <p className="text-[10px] text-marble/40 font-display tracking-wider mb-1">{label}</p>
    <p className="font-display text-2xl font-semibold" style={{ color }}>
      {value > 0 ? '+' : ''}{value.toFixed(2)}
      <span className="text-xs text-marble/30 ml-1">$/bbl</span>
    </p>
    <p className="text-[10px] text-marble/25 mt-1">{sub}</p>
  </div>
);

const OGCrackSpreads = () => {
  const { data: spreads, isLoading } = useSpreads();

  return (
    <WidgetShell icon={ArrowLeftRight} title="SPREADS & MARGINS" badge="LIVE">
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-navy-light/30 rounded animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SpreadCard label="WTI–BRENT SPREAD" value={spreads?.wtiBrent ?? 0} sub="Front-month differential" color="hsl(210,60%,55%)" />
          <SpreadCard label="3-2-1 CRACK SPREAD" value={spreads?.crack321 ?? 0} sub="Refinery gross margin" color="hsl(43,72%,55%)" />
          <SpreadCard label="HEATING OIL CRACK" value={spreads?.heatCrack ?? 0} sub="Distillate margin" color="hsl(0,60%,55%)" />
          <SpreadCard label="SPARK SPREAD" value={spreads?.sparkSpread ?? 0} sub="Gas-to-power margin" color="hsl(145,60%,45%)" />
        </div>
      )}
    </WidgetShell>
  );
};

export default OGCrackSpreads;
