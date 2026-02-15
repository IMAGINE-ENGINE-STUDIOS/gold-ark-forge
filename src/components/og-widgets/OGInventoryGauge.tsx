import { useEIAInventory } from '@/hooks/useOilGasData';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import WidgetShell from '@/components/ga-widgets/WidgetShell';
import { Database } from 'lucide-react';

const OGInventoryGauge = () => {
  const { data: inventory, isLoading } = useEIAInventory();
  const recent = (inventory ?? []).slice(-26);
  const latest = recent[recent.length - 1];
  const fiveYearAvg = 440; // EIA 5-year avg baseline

  return (
    <WidgetShell icon={Database} title="EIA CRUDE OIL INVENTORY" source="U.S. EIA" badge="WEEKLY">
      {isLoading ? (
        <div className="h-64 bg-navy-light/30 rounded animate-pulse" />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[10px] text-marble/40 font-display tracking-wider">CURRENT</p>
              <p className="font-display text-xl text-marble">{latest?.value.toFixed(1)}<span className="text-xs text-marble/40 ml-1">M bbl</span></p>
            </div>
            <div>
              <p className="text-[10px] text-marble/40 font-display tracking-wider">WEEKLY Δ</p>
              <p className={`font-display text-xl ${(latest?.change ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(latest?.change ?? 0) > 0 ? '+' : ''}{latest?.change.toFixed(1)}<span className="text-xs text-marble/40 ml-1">M bbl</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-marble/40 font-display tracking-wider">vs 5YR AVG</p>
              <p className={`font-display text-xl ${(latest?.value ?? 0) > fiveYearAvg ? 'text-emerald-400' : 'text-red-400'}`}>
                {((latest?.value ?? 0) - fiveYearAvg) > 0 ? '+' : ''}{((latest?.value ?? 0) - fiveYearAvg).toFixed(1)}<span className="text-xs text-marble/40 ml-1">M</span>
              </p>
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recent}>
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fill: 'hsl(40,25%,96%,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fill: 'hsl(40,25%,96%,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} width={45} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', borderRadius: 4, fontSize: 11 }}
                  labelFormatter={(l) => `Week of ${l}`}
                  formatter={(v: number) => [`${v.toFixed(1)}M bbl`, 'Inventory']}
                />
                <ReferenceLine y={fiveYearAvg} stroke="hsl(43,72%,50%)" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: '5yr avg', fill: 'hsl(43,72%,50%,0.5)', fontSize: 9, position: 'right' }} />
                <Bar dataKey="value" fill="hsl(25,80%,50%)" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

export default OGInventoryGauge;
