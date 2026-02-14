import { useBullionBars, BullionBar } from '@/hooks/useBullionBars';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useState, useMemo } from 'react';
import { SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortKey = 'metal_type' | 'weight_oz' | 'purity' | 'value' | 'custody_status';
type SortDir = 'asc' | 'desc';
type MetalFilter = 'all' | 'gold' | 'silver' | 'platinum';
type StatusFilter = 'all' | 'free' | 'pledged' | 'redeemed';

const metalDot: Record<string, string> = { gold: 'bg-gold', silver: 'bg-silver', platinum: 'bg-platinum' };

const GAMetalScreener = () => {
  const { data: bars, isLoading } = useBullionBars({ limit: 100 });
  const { data: prices } = useMetalPrices();

  const [metalFilter, setMetalFilter] = useState<MetalFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('value');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 text-marble/20" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-gold" /> : <ArrowDown className="w-3 h-3 text-gold" />;
  };

  const processed = useMemo(() => {
    if (!bars) return [];
    let list = bars.map((b) => ({
      ...b,
      value: Number(b.weight_oz) * (prices?.[b.metal_type]?.price_usd ?? 0),
    }));

    if (metalFilter !== 'all') list = list.filter((b) => b.metal_type === metalFilter);
    if (statusFilter !== 'all') list = list.filter((b) => b.custody_status === statusFilter);

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'metal_type': cmp = a.metal_type.localeCompare(b.metal_type); break;
        case 'weight_oz': cmp = Number(a.weight_oz) - Number(b.weight_oz); break;
        case 'purity': cmp = Number(a.purity) - Number(b.purity); break;
        case 'value': cmp = a.value - b.value; break;
        case 'custody_status': cmp = a.custody_status.localeCompare(b.custody_status); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [bars, prices, metalFilter, statusFilter, sortKey, sortDir]);

  const totalValue = processed.reduce((s, b) => s + b.value, 0);
  const totalOz = processed.reduce((s, b) => s + Number(b.weight_oz), 0);

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <SlidersHorizontal className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">BULLION SCREENER</h3>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-marble/40 tracking-widest font-display">METAL</span>
            <div className="flex gap-1">
              {(['all', 'gold', 'silver', 'platinum'] as MetalFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setMetalFilter(f)}
                  className={`px-2.5 py-1 text-[10px] font-display tracking-wider rounded transition-all ${
                    metalFilter === f
                      ? 'bg-gold/20 text-gold border border-gold/40'
                      : 'text-marble/30 hover:text-marble/60 border border-transparent'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-marble/40 tracking-widest font-display">STATUS</span>
            <div className="flex gap-1">
              {(['all', 'free', 'pledged', 'redeemed'] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-2.5 py-1 text-[10px] font-display tracking-wider rounded transition-all ${
                    statusFilter === f
                      ? 'bg-gold/20 text-gold border border-gold/40'
                      : 'text-marble/30 hover:text-marble/60 border border-transparent'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs text-marble/40">
            <span>{processed.length} bars</span>
            <span>{totalOz.toLocaleString()} oz</span>
            <span className="text-gold-light font-medium">${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-navy-light/50 rounded animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold/20">
                  {([
                    ['metal_type', 'METAL', 'text-left'],
                    ['weight_oz', 'WEIGHT', 'text-right'],
                    ['purity', 'PURITY', 'text-right'],
                    ['value', 'VALUE', 'text-right'],
                    ['custody_status', 'STATUS', 'text-center'],
                  ] as [SortKey, string, string][]).map(([key, label, align]) => (
                    <th
                      key={key}
                      className={`py-2 px-3 font-display text-[10px] tracking-[0.2em] text-marble/50 cursor-pointer hover:text-gold transition-colors ${align}`}
                      onClick={() => toggleSort(key)}
                    >
                      <div className={`flex items-center gap-1 ${align === 'text-right' ? 'justify-end' : align === 'text-center' ? 'justify-center' : ''}`}>
                        {label}
                        <SortIcon col={key} />
                      </div>
                    </th>
                  ))}
                  <th className="py-2 px-3 font-display text-[10px] tracking-[0.2em] text-marble/50 text-left">SERIAL</th>
                  <th className="py-2 px-3 font-display text-[10px] tracking-[0.2em] text-marble/50 text-left">JURISDICTION</th>
                </tr>
              </thead>
              <tbody>
                {processed.map((bar) => (
                  <tr key={bar.id} className="border-b border-navy-light/50 hover:bg-navy-light/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${metalDot[bar.metal_type]}`} />
                        <span className="font-display text-xs tracking-[0.15em] text-marble/70">{bar.metal_type.toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-sm text-marble font-medium">{Number(bar.weight_oz).toLocaleString()} oz</td>
                    <td className="py-2.5 px-3 text-right text-xs text-marble/60">{(Number(bar.purity) * 100).toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-right text-sm text-gold-light font-medium">${bar.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        bar.custody_status === 'free' ? 'text-emerald-400 bg-emerald-400/10' :
                        bar.custody_status === 'pledged' ? 'text-gold bg-gold/10' : 'text-marble/40 bg-marble/10'
                      }`}>
                        {bar.custody_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-marble/40">{bar.serial_number}</td>
                    <td className="py-2.5 px-3 text-xs text-marble/40">{bar.jurisdiction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {processed.length === 0 && (
              <div className="text-center py-8 text-marble/30 text-sm font-display tracking-widest">NO MATCHING BARS</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GAMetalScreener;
