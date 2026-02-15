import { useOPECData } from '@/hooks/useOilGasData';
import WidgetShell from '@/components/ga-widgets/WidgetShell';
import { Globe, SortAsc, SortDesc } from 'lucide-react';
import { useState, useMemo } from 'react';
import AnimatedNumber from '@/components/ga-widgets/AnimatedNumber';

type SortKey = 'country' | 'production' | 'compliance';

const OGOPECTracker = () => {
  const { data: members, isLoading } = useOPECData();
  const [sortBy, setSortBy] = useState<SortKey>('production');
  const [sortAsc, setSortAsc] = useState(false);
  const [highlightOvercut, setHighlightOvercut] = useState(false);

  const totalQuota = members?.reduce((s, m) => s + m.quota, 0) ?? 0;
  const totalProd = members?.reduce((s, m) => s + m.production, 0) ?? 0;
  const avgCompliance = totalQuota > 0 ? Math.round((1 - totalProd / totalQuota) * 100 + 100) : 0;

  const sorted = useMemo(() => {
    if (!members) return [];
    const sorted = [...members].sort((a, b) => {
      const va = sortBy === 'country' ? a.country : sortBy === 'production' ? a.production : a.compliance;
      const vb = sortBy === 'country' ? b.country : sortBy === 'production' ? b.production : b.compliance;
      if (typeof va === 'string' && typeof vb === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return sorted;
  }, [members, sortBy, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  };

  const SortIcon = sortAsc ? SortAsc : SortDesc;

  return (
    <WidgetShell icon={Globe} title="OPEC+ COMPLIANCE TRACKER" source="OPEC Secretariat" badge="MONTHLY">
      {isLoading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-8 bg-navy-light/30 rounded animate-pulse" />)}</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center mb-2">
            <div>
              <p className="text-[10px] text-marble/40 font-display tracking-wider">TOTAL QUOTA</p>
              <p className="font-display text-lg text-marble"><AnimatedNumber value={totalQuota} decimals={1} /><span className="text-[10px] text-marble/30 ml-1">mbpd</span></p>
            </div>
            <div>
              <p className="text-[10px] text-marble/40 font-display tracking-wider">PRODUCTION</p>
              <p className="font-display text-lg text-marble"><AnimatedNumber value={totalProd} decimals={1} /><span className="text-[10px] text-marble/30 ml-1">mbpd</span></p>
            </div>
            <div>
              <p className="text-[10px] text-marble/40 font-display tracking-wider">AVG COMPLIANCE</p>
              <p className={`font-display text-lg ${avgCompliance >= 100 ? 'text-emerald-400' : 'text-red-400'}`}><AnimatedNumber value={avgCompliance} decimals={0} />%</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {(['country', 'production', 'compliance'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => toggleSort(k)}
                  className={`flex items-center gap-1 px-2 py-1 text-[9px] font-display tracking-wider rounded transition-all duration-200 ${
                    sortBy === k ? 'bg-gold/15 text-gold border border-gold/30' : 'text-marble/30 hover:text-marble/50 border border-transparent'
                  }`}
                >
                  {k.toUpperCase()}
                  {sortBy === k && <SortIcon className="w-2.5 h-2.5" />}
                </button>
              ))}
            </div>
            <button
              onClick={() => setHighlightOvercut(!highlightOvercut)}
              className={`text-[9px] font-display tracking-wider px-2 py-1 rounded transition-all duration-200 ${
                highlightOvercut ? 'bg-red-400/15 text-red-400 border border-red-400/30' : 'text-marble/30 hover:text-marble/50 border border-transparent'
              }`}
            >
              OVERCUTTERS
            </button>
          </div>

          <div className="space-y-1.5 max-h-[380px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(43,72%,50%,0.3) transparent' }}>
            {sorted.map((m, i) => {
              const overcut = m.production > m.quota;
              const barWidth = Math.min((m.production / m.quota) * 100, 130);
              const dimmed = highlightOvercut && !overcut;
              return (
                <div
                  key={m.country}
                  className={`flex items-center gap-3 p-2 rounded hover:bg-navy-light/20 transition-all duration-300 ${dimmed ? 'opacity-30' : ''}`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="text-xs text-marble/60 font-display tracking-wider w-28 truncate">{m.country}</span>
                  <div className="flex-1 relative h-5">
                    <div className="absolute inset-0 bg-navy-dark/60 rounded" />
                    <div
                      className="absolute left-0 top-0 bottom-0 rounded transition-all duration-700"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: overcut ? 'hsl(0,60%,50%)' : 'hsl(145,60%,45%)',
                        opacity: 0.6,
                      }}
                    />
                    <div className="absolute left-0 top-0 bottom-0 flex items-center pl-2">
                      <span className="text-[9px] text-marble/70 font-mono">{m.production.toFixed(2)}/{m.quota.toFixed(2)}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium w-12 text-right transition-colors duration-300 ${m.compliance >= 100 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {m.compliance}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

export default OGOPECTracker;
