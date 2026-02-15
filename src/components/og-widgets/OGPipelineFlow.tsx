import WidgetShell from '@/components/ga-widgets/WidgetShell';
import { Network, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';

interface PipelineData {
  name: string;
  capacity: number;
  flow: number;
  utilization: number;
  region: string;
  status: 'operational' | 'maintenance' | 'disrupted';
}

const usePipelineData = () =>
  useQuery({
    queryKey: ['pipeline-flow'],
    queryFn: async (): Promise<PipelineData[]> => [
      { name: 'Keystone XL', capacity: 0.83, flow: 0.59, utilization: 71, region: 'North America', status: 'operational' },
      { name: 'Druzhba', capacity: 1.2, flow: 0.45, utilization: 38, region: 'Europe', status: 'disrupted' },
      { name: 'DAPL', capacity: 0.57, flow: 0.52, utilization: 91, region: 'North America', status: 'operational' },
      { name: 'East-West (Saudi)', capacity: 5.0, flow: 3.8, utilization: 76, region: 'Middle East', status: 'operational' },
      { name: 'BTC Pipeline', capacity: 1.2, flow: 0.95, utilization: 79, region: 'Caspian', status: 'operational' },
      { name: 'ESPO (Russia-China)', capacity: 1.6, flow: 1.5, utilization: 94, region: 'Asia-Pacific', status: 'operational' },
      { name: 'Forties (North Sea)', capacity: 0.45, flow: 0.38, utilization: 84, region: 'Europe', status: 'maintenance' },
      { name: 'Trans-Alaska', capacity: 0.5, flow: 0.48, utilization: 96, region: 'North America', status: 'operational' },
    ],
    refetchInterval: 300000,
  });

const statusColors = {
  operational: 'text-emerald-400 bg-emerald-400/10',
  maintenance: 'text-amber-400 bg-amber-400/10',
  disrupted: 'text-red-400 bg-red-400/10',
};

const OGPipelineFlow = () => {
  const { data: pipelines, isLoading } = usePipelineData();
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'utilization'>('utilization');

  const regions = useMemo(() => {
    const unique = [...new Set((pipelines ?? []).map(p => p.region))];
    return ['all', ...unique];
  }, [pipelines]);

  const filtered = useMemo(() => {
    let list = pipelines ?? [];
    if (regionFilter !== 'all') list = list.filter(p => p.region === regionFilter);
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    return [...list].sort((a, b) => sortBy === 'utilization' ? b.utilization - a.utilization : a.name.localeCompare(b.name));
  }, [pipelines, regionFilter, statusFilter, sortBy]);

  const totalFlow = filtered.reduce((s, p) => s + p.flow, 0);
  const avgUtil = filtered.length ? Math.round(filtered.reduce((s, p) => s + p.utilization, 0) / filtered.length) : 0;

  return (
    <WidgetShell icon={Network} title="GLOBAL PIPELINE FLOW" badge="LIVE" source="IEA / Platts">
      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-navy-light/30 rounded animate-pulse" />)}</div>
      ) : (
        <div className="space-y-4">
          {/* Summary row */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[9px] text-marble/30 font-display tracking-wider">TOTAL FLOW</span>
                <span className="text-sm text-marble font-display ml-2">{totalFlow.toFixed(2)} mbpd</span>
              </div>
              <div>
                <span className="text-[9px] text-marble/30 font-display tracking-wider">AVG UTIL</span>
                <span className={`text-sm font-display ml-2 ${avgUtil > 85 ? 'text-red-400' : avgUtil > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>{avgUtil}%</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-3 h-3 text-marble/25" />
            {/* Region */}
            <div className="flex gap-1">
              {regions.map((r) => (
                <button
                  key={r}
                  onClick={() => setRegionFilter(r)}
                  className={`px-2 py-0.5 text-[9px] font-display tracking-wider rounded transition-all duration-200 ${
                    regionFilter === r ? 'bg-gold/15 text-gold border border-gold/30' : 'text-marble/30 hover:text-marble/50 border border-transparent'
                  }`}
                >
                  {r === 'all' ? 'ALL' : r.toUpperCase()}
                </button>
              ))}
            </div>
            <span className="text-marble/10">|</span>
            {/* Status */}
            {(['all', 'operational', 'maintenance', 'disrupted'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2 py-0.5 text-[9px] font-display tracking-wider rounded transition-all duration-200 ${
                  statusFilter === s ? 'bg-gold/15 text-gold border border-gold/30' : 'text-marble/30 hover:text-marble/50 border border-transparent'
                }`}
              >
                {s.toUpperCase()}
              </button>
            ))}
            <span className="text-marble/10">|</span>
            <button
              onClick={() => setSortBy(sortBy === 'utilization' ? 'name' : 'utilization')}
              className="text-[9px] font-display tracking-wider text-marble/30 hover:text-gold/60 transition-colors"
            >
              SORT: {sortBy.toUpperCase()}
            </button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(43,72%,50%,0.3) transparent' }}>
            {filtered.map((p, i) => (
              <div
                key={p.name}
                className="flex items-center gap-3 p-3 rounded hover:bg-navy-light/20 transition-all duration-300 group"
                style={{ opacity: 1, animation: `fade-in 0.3s ease-out ${i * 50}ms both` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display text-xs text-marble/80 tracking-wider group-hover:text-marble transition-colors">{p.name}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-display tracking-wider transition-all duration-200 ${statusColors[p.status]}`}>
                      {p.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2.5 bg-navy-dark/80 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${p.utilization}%`,
                          backgroundColor: p.utilization > 90 ? 'hsl(0,60%,50%)' : p.utilization > 70 ? 'hsl(43,72%,50%)' : 'hsl(145,60%,45%)',
                          boxShadow: p.utilization > 90 ? '0 0 6px hsla(0,60%,50%,0.4)' : 'none',
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-marble/40 font-mono w-10 text-right">{p.utilization}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-marble font-medium">{p.flow.toFixed(2)}</p>
                  <p className="text-[9px] text-marble/30">/{p.capacity.toFixed(2)} mbpd</p>
                </div>
                <span className="text-[9px] text-marble/25 font-display tracking-wider w-20 text-right hidden sm:block">{p.region}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-marble/30 py-8">No pipelines match filters</p>
            )}
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

export default OGPipelineFlow;
