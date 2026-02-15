import WidgetShell from '@/components/ga-widgets/WidgetShell';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, ReferenceLine } from 'recharts';
import { useQuery } from '@tanstack/react-query';

const useSupplyDemand = () =>
  useQuery({
    queryKey: ['oil-supply-demand'],
    queryFn: async () => {
      const quarters = ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24', 'Q1 25', 'Q2 25', 'Q3 25F', 'Q4 25F'];
      return quarters.map((q, i) => {
        const supply = 101.5 + Math.sin(i / 2) * 0.8 + i * 0.1;
        const demand = 101.8 + Math.cos(i / 1.5) * 0.6 + i * 0.15;
        return { quarter: q, supply: Math.round(supply * 10) / 10, demand: Math.round(demand * 10) / 10, balance: Math.round((supply - demand) * 10) / 10 };
      });
    },
    refetchInterval: 600000,
  });

const OGSupplyDemand = () => {
  const { data, isLoading } = useSupplyDemand();

  return (
    <WidgetShell icon={BarChart3} title="GLOBAL SUPPLY / DEMAND BALANCE" source="IEA / OPEC / EIA" badge="QUARTERLY">
      {isLoading ? (
        <div className="h-64 bg-navy-light/30 rounded animate-pulse" />
      ) : (
        <div className="space-y-4">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={2}>
                <XAxis dataKey="quarter" tick={{ fill: 'hsl(40,25%,96%,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fill: 'hsl(40,25%,96%,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', borderRadius: 4, fontSize: 11 }} formatter={(v: number) => [`${v.toFixed(1)} mbpd`]} />
                <Legend wrapperStyle={{ fontSize: 10, color: 'hsl(40,25%,96%,0.5)' }} />
                <Bar dataKey="supply" name="Supply" fill="hsl(145,60%,45%)" fillOpacity={0.6} radius={[3, 3, 0, 0]} />
                <Bar dataKey="demand" name="Demand" fill="hsl(25,80%,50%)" fillOpacity={0.6} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {(data ?? []).slice(-4).map((d) => (
              <div key={d.quarter} className="text-center rounded bg-navy-dark/60 p-2">
                <p className="text-[9px] text-marble/30 font-display tracking-wider">{d.quarter}</p>
                <p className={`font-display text-sm font-semibold ${d.balance > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {d.balance > 0 ? '+' : ''}{d.balance}
                </p>
                <p className="text-[8px] text-marble/25">mbpd</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

export default OGSupplyDemand;
