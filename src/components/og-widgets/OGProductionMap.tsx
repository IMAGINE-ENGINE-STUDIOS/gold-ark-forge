import WidgetShell from '@/components/ga-widgets/WidgetShell';
import { MapPin, SortAsc, SortDesc, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { useState, useMemo } from 'react';
import AnimatedNumber from '@/components/ga-widgets/AnimatedNumber';

const useProductionData = () =>
  useQuery({
    queryKey: ['global-production'],
    queryFn: async () => [
      { country: 'United States', production: 13.3, change: 0.4, flag: '🇺🇸' },
      { country: 'Saudi Arabia', production: 9.0, change: -0.2, flag: '🇸🇦' },
      { country: 'Russia', production: 9.2, change: -0.5, flag: '🇷🇺' },
      { country: 'Canada', production: 5.8, change: 0.3, flag: '🇨🇦' },
      { country: 'Iraq', production: 4.3, change: 0.1, flag: '🇮🇶' },
      { country: 'China', production: 4.2, change: 0.0, flag: '🇨🇳' },
      { country: 'UAE', production: 2.95, change: -0.1, flag: '🇦🇪' },
      { country: 'Brazil', production: 3.7, change: 0.5, flag: '🇧🇷' },
      { country: 'Kuwait', production: 2.55, change: -0.1, flag: '🇰🇼' },
      { country: 'Norway', production: 1.8, change: 0.0, flag: '🇳🇴' },
    ],
    refetchInterval: 600000,
  });

const OGProductionMap = () => {
  const { data: production, isLoading } = useProductionData();
  const [sortBy, setSortBy] = useState<'production' | 'change'>('production');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const totalProd = production?.reduce((s, p) => s + p.production, 0) ?? 0;

  const sorted = useMemo(() => {
    if (!production) return [];
    return [...production].sort((a, b) => {
      const va = sortBy === 'production' ? a.production : a.change;
      const vb = sortBy === 'production' ? b.production : b.change;
      return sortAsc ? va - vb : vb - va;
    });
  }, [production, sortBy, sortAsc]);

  const toggleSort = (key: 'production' | 'change') => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  };

  const SortIcon = sortAsc ? SortAsc : SortDesc;

  return (
    <WidgetShell icon={MapPin} title="TOP PRODUCERS" source="EIA / IEA" badge="mbpd">
      {isLoading ? (
        <div className="h-64 bg-navy-light/30 rounded animate-pulse" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-[10px] text-marble/40 font-display tracking-wider">TOTAL TOP-10 OUTPUT</p>
              <p className="font-display text-2xl text-marble"><AnimatedNumber value={totalProd} decimals={1} /><span className="text-xs text-marble/30 ml-1">mbpd</span></p>
            </div>
            <div className="flex gap-1">
              {(['production', 'change'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => toggleSort(k)}
                  className={`flex items-center gap-1 px-2 py-1 text-[9px] font-display tracking-wider rounded transition-all duration-200 ${
                    sortBy === k ? 'bg-gold/15 text-gold border border-gold/30' : 'text-marble/30 hover:text-marble/50 border border-transparent'
                  }`}
                >
                  {k === 'production' ? 'OUTPUT' : 'YoY Δ'}
                  {sortBy === k && <SortIcon className="w-2.5 h-2.5" />}
                </button>
              ))}
            </div>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sorted} layout="vertical">
                <XAxis type="number" tick={{ fill: 'hsl(40,25%,96%,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="country" tick={{ fill: 'hsl(40,25%,96%,0.5)', fontSize: 9 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', borderRadius: 4, fontSize: 11 }}
                  formatter={(v: number) => [`${v.toFixed(1)} mbpd`]}
                  cursor={{ fill: 'hsla(43,72%,50%,0.05)' }}
                  animationDuration={200}
                />
                <Bar dataKey="production" radius={[0, 4, 4, 0]} animationDuration={1000} onClick={(d: any) => setSelectedCountry(d.country)}>
                  {sorted.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.change > 0 ? 'hsl(25,80%,50%)' : entry.change < 0 ? 'hsl(210,60%,50%)' : 'hsl(43,72%,50%)'}
                      fillOpacity={selectedCountry === entry.country ? 0.9 : 0.6}
                      stroke={selectedCountry === entry.country ? 'hsl(43,72%,50%)' : 'none'}
                      strokeWidth={selectedCountry === entry.country ? 1 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Country detail footer */}
          {selectedCountry && (
            <div className="flex items-center justify-between bg-navy-dark/50 rounded p-3 animate-fade-in border border-gold/10">
              {(() => {
                const c = sorted.find(s => s.country === selectedCountry);
                if (!c) return null;
                return (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.flag}</span>
                      <span className="font-display text-sm text-marble tracking-wider">{c.country}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-marble font-display">{c.production.toFixed(1)} mbpd</span>
                      <span className={`flex items-center gap-1 text-xs font-display ${c.change > 0 ? 'text-emerald-400' : c.change < 0 ? 'text-red-400' : 'text-marble/40'}`}>
                        {c.change > 0 ? <TrendingUp className="w-3 h-3" /> : c.change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {c.change > 0 ? '+' : ''}{c.change.toFixed(1)} YoY
                      </span>
                      <span className="text-[10px] text-marble/30">{((c.production / totalProd) * 100).toFixed(1)}% of top-10</span>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </WidgetShell>
  );
};

export default OGProductionMap;
