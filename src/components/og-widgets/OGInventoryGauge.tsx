import { useEIAInventory } from '@/hooks/useOilGasData';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine, Brush } from 'recharts';
import WidgetShell from '@/components/ga-widgets/WidgetShell';
import { Database, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import AnimatedNumber from '@/components/ga-widgets/AnimatedNumber';

const OGInventoryGauge = () => {
  const { data: inventory, isLoading } = useEIAInventory();
  const [range, setRange] = useState<'13w' | '26w' | '52w'>('26w');
  const [expanded, setExpanded] = useState(false);

  const rangeSlice = range === '13w' ? 13 : range === '26w' ? 26 : 52;
  const recent = useMemo(() => (inventory ?? []).slice(-rangeSlice), [inventory, rangeSlice]);
  const latest = recent[recent.length - 1];
  const fiveYearAvg = 440;

  // Calculate stats
  const high = useMemo(() => Math.max(...recent.map(r => r.value)), [recent]);
  const low = useMemo(() => Math.min(...recent.map(r => r.value)), [recent]);
  const avgChange = useMemo(() => {
    const changes = recent.filter(r => r.change !== undefined).map(r => r.change);
    return changes.length ? changes.reduce((s, c) => s + c, 0) / changes.length : 0;
  }, [recent]);

  return (
    <WidgetShell icon={Database} title="EIA CRUDE OIL INVENTORY" source="U.S. EIA" badge="WEEKLY">
      {isLoading ? (
        <div className="h-64 bg-navy-light/30 rounded animate-pulse" />
      ) : (
        <div className="space-y-4">
          {/* Range selector */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {(['13w', '26w', '52w'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 text-[10px] font-display tracking-wider rounded transition-all duration-300 ${
                    range === r ? 'bg-gold/20 text-gold border border-gold/40' : 'text-marble/40 hover:text-marble/70 border border-transparent hover:border-gold/20'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[10px] font-display tracking-wider text-marble/30 hover:text-gold/60 transition-colors"
            >
              {expanded ? 'LESS' : 'MORE'}
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[10px] text-marble/40 font-display tracking-wider">CURRENT</p>
              <p className="font-display text-xl text-marble">
                <AnimatedNumber value={latest?.value ?? 0} decimals={1} />
                <span className="text-xs text-marble/40 ml-1">M bbl</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-marble/40 font-display tracking-wider">WEEKLY Δ</p>
              <p className={`font-display text-xl ${(latest?.change ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(latest?.change ?? 0) > 0 ? '+' : ''}<AnimatedNumber value={latest?.change ?? 0} decimals={1} />
                <span className="text-xs text-marble/40 ml-1">M bbl</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-marble/40 font-display tracking-wider">vs 5YR AVG</p>
              <p className={`font-display text-xl ${(latest?.value ?? 0) > fiveYearAvg ? 'text-emerald-400' : 'text-red-400'}`}>
                {((latest?.value ?? 0) - fiveYearAvg) > 0 ? '+' : ''}<AnimatedNumber value={(latest?.value ?? 0) - fiveYearAvg} decimals={1} />
                <span className="text-xs text-marble/40 ml-1">M</span>
              </p>
            </div>
          </div>

          {/* Extended stats */}
          {expanded && (
            <div className="grid grid-cols-3 gap-4 text-center animate-fade-in">
              <div className="bg-navy-dark/40 rounded p-2">
                <p className="text-[9px] text-marble/30 font-display tracking-wider">RANGE HIGH</p>
                <p className="font-display text-sm text-marble"><AnimatedNumber value={high} decimals={1} /></p>
              </div>
              <div className="bg-navy-dark/40 rounded p-2">
                <p className="text-[9px] text-marble/30 font-display tracking-wider">RANGE LOW</p>
                <p className="font-display text-sm text-marble"><AnimatedNumber value={low} decimals={1} /></p>
              </div>
              <div className="bg-navy-dark/40 rounded p-2">
                <p className="text-[9px] text-marble/30 font-display tracking-wider">AVG Δ/WEEK</p>
                <p className={`font-display text-sm ${avgChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {avgChange > 0 ? '+' : ''}{avgChange.toFixed(1)}
                </p>
              </div>
            </div>
          )}

          <div className={`transition-all duration-500 ${expanded ? 'h-64' : 'h-56'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recent}>
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fill: 'hsl(40,25%,96%,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fill: 'hsl(40,25%,96%,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} width={45} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', borderRadius: 4, fontSize: 11 }}
                  labelFormatter={(l) => `Week of ${l}`}
                  formatter={(v: number) => [`${v.toFixed(1)}M bbl`, 'Inventory']}
                  cursor={{ fill: 'hsla(43,72%,50%,0.05)' }}
                  animationDuration={200}
                />
                <ReferenceLine y={fiveYearAvg} stroke="hsl(43,72%,50%)" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: '5yr avg', fill: 'hsl(43,72%,50%,0.5)', fontSize: 9, position: 'right' }} />
                <Bar dataKey="value" fill="hsl(25,80%,50%)" fillOpacity={0.7} radius={[2, 2, 0, 0]} animationDuration={800} animationBegin={200} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

export default OGInventoryGauge;
