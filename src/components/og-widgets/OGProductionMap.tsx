import WidgetShell from '@/components/ga-widgets/WidgetShell';
import { MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const useProductionData = () =>
  useQuery({
    queryKey: ['global-production'],
    queryFn: async () => [
      { country: 'United States', production: 13.3, change: 0.4 },
      { country: 'Saudi Arabia', production: 9.0, change: -0.2 },
      { country: 'Russia', production: 9.2, change: -0.5 },
      { country: 'Canada', production: 5.8, change: 0.3 },
      { country: 'Iraq', production: 4.3, change: 0.1 },
      { country: 'China', production: 4.2, change: 0.0 },
      { country: 'UAE', production: 2.95, change: -0.1 },
      { country: 'Brazil', production: 3.7, change: 0.5 },
      { country: 'Kuwait', production: 2.55, change: -0.1 },
      { country: 'Norway', production: 1.8, change: 0.0 },
    ],
    refetchInterval: 600000,
  });

const OGProductionMap = () => {
  const { data: production, isLoading } = useProductionData();
  const totalProd = production?.reduce((s, p) => s + p.production, 0) ?? 0;

  return (
    <WidgetShell icon={MapPin} title="TOP PRODUCERS" source="EIA / IEA" badge="mbpd">
      {isLoading ? (
        <div className="h-64 bg-navy-light/30 rounded animate-pulse" />
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-[10px] text-marble/40 font-display tracking-wider">TOTAL TOP-10 OUTPUT</p>
            <p className="font-display text-2xl text-marble">{totalProd.toFixed(1)}<span className="text-xs text-marble/30 ml-1">mbpd</span></p>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={production} layout="vertical">
                <XAxis type="number" tick={{ fill: 'hsl(40,25%,96%,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="country" tick={{ fill: 'hsl(40,25%,96%,0.5)', fontSize: 9 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', borderRadius: 4, fontSize: 11 }} formatter={(v: number) => [`${v.toFixed(1)} mbpd`]} />
                <Bar dataKey="production" fill="hsl(25,80%,50%)" fillOpacity={0.6} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

export default OGProductionMap;
