import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

interface RiskThermometerProps {
  positions: Array<{ currentPrice: number; qty: number; symbol: string }>;
  equity: number;
}

export default function RiskThermometer({ positions, equity }: RiskThermometerProps) {
  const { level, score, label, color, bgColor, borderColor, concentration } = useMemo(() => {
    if (positions.length === 0 || equity <= 0) {
      return { level: 'none', score: 0, label: 'NO RISK', color: 'text-marble/30', bgColor: 'bg-navy-light/30', borderColor: 'border-gold/5', concentration: 0 };
    }

    const posValues = positions.map(p => p.currentPrice * p.qty);
    const totalExposure = posValues.reduce((s, v) => s + v, 0);
    const maxPosition = Math.max(...posValues);
    const concentration = totalExposure > 0 ? (maxPosition / totalExposure) * 100 : 0;
    const exposureRatio = (totalExposure / equity) * 100;

    // Score 0-100 based on concentration + exposure
    const score = Math.min(100, (concentration * 0.5) + (exposureRatio * 0.3) + (positions.length > 5 ? 10 : 0));

    if (score < 30) return { level: 'low', score, label: 'LOW RISK', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', concentration };
    if (score < 60) return { level: 'medium', score, label: 'MODERATE', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', concentration };
    return { level: 'high', score, label: 'HIGH RISK', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', concentration };
  }, [positions, equity]);

  const barWidth = Math.max(5, Math.min(100, score));

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`rounded-lg p-2.5 border ${borderColor} ${bgColor} cursor-help`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className={`w-3 h-3 ${color}`} />
                <span className="text-[8px] font-display tracking-wider text-marble/40">PORTFOLIO RISK</span>
              </div>
              <span className={`text-[9px] font-mono font-bold ${color}`}>{label}</span>
            </div>
            <div className="w-full h-2 bg-navy-dark/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  level === 'low' ? 'bg-emerald-500' : level === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            {concentration > 50 && (
              <div className="text-[7px] text-amber-400/60 mt-1 font-mono">⚠ {concentration.toFixed(0)}% concentrated in one position</div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <p className="text-xs">Your portfolio risk level based on position concentration and total exposure relative to equity. Diversify to lower risk.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
