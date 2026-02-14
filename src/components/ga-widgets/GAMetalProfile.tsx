import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useCertificateReserveTotals } from '@/hooks/useCertificateReserveTotals';
import { useBullionBars } from '@/hooks/useBullionBars';
import { Layers } from 'lucide-react';
import { useMemo } from 'react';

type MetalKey = 'gold' | 'silver' | 'platinum';

const metalConfig: Record<MetalKey, { label: string; symbol: string; color: string; unit: string }> = {
  gold: { label: 'GOLD', symbol: 'XAU', color: 'hsl(43, 72%, 50%)', unit: 'troy oz' },
  silver: { label: 'SILVER', symbol: 'XAG', color: 'hsl(210, 6%, 67%)', unit: 'troy oz' },
  platinum: { label: 'PLATINUM', symbol: 'XPT', color: 'hsl(210, 4%, 76%)', unit: 'troy oz' },
};

const GAMetalProfile = () => {
  const { data: prices, isLoading: loadingPrices } = useMetalPrices();
  const { data: totals, isLoading: loadingTotals } = useCertificateReserveTotals();
  const { data: bars, isLoading: loadingBars } = useBullionBars({ limit: 200 });

  const isLoading = loadingPrices || loadingTotals || loadingBars;

  const metalStats = useMemo(() => {
    if (!bars) return {};
    const stats: Record<string, { barCount: number; totalOz: number; avgPurity: number; jurisdictions: Set<string> }> = {};
    for (const bar of bars) {
      if (!stats[bar.metal_type]) stats[bar.metal_type] = { barCount: 0, totalOz: 0, avgPurity: 0, jurisdictions: new Set() };
      const s = stats[bar.metal_type];
      s.barCount++;
      s.totalOz += Number(bar.weight_oz);
      s.avgPurity += Number(bar.purity);
      s.jurisdictions.add(bar.jurisdiction);
    }
    for (const key of Object.keys(stats)) {
      stats[key].avgPurity = stats[key].avgPurity / stats[key].barCount;
    }
    return stats;
  }, [bars]);

  const metals: MetalKey[] = ['gold', 'silver', 'platinum'];

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Layers className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">METAL PROFILES</h3>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-navy-light/50 rounded animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metals.map((m) => {
              const cfg = metalConfig[m];
              const feed = prices?.[m];
              const stats = metalStats[m];
              const reserveOzKey = `${m}_oz` as keyof typeof totals;
              const reserveOz = totals?.[reserveOzKey] ?? 0;
              const value = (feed?.price_usd ?? 0) * (stats?.totalOz ?? 0);

              return (
                <div key={m} className="rounded bg-navy-dark/50 border border-gold/10 p-5 hover:border-gold/30 transition-all">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="font-display text-sm tracking-[0.2em] text-marble/80">{cfg.label}</span>
                    <span className="ml-auto text-[10px] text-marble/30 font-mono">{cfg.symbol}/USD</span>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="font-display text-2xl text-marble font-semibold">
                      ${(feed?.price_usd ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs font-medium mt-0.5 ${
                      (feed?.change_24h ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {(feed?.change_24h ?? 0) > 0 ? '+' : ''}{(feed?.change_24h ?? 0).toFixed(2)}% (24h)
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-marble/40">Bars in Vault</span>
                      <span className="text-marble/70 font-medium">{stats?.barCount ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-marble/40">Total Weight</span>
                      <span className="text-marble/70 font-medium">{(stats?.totalOz ?? 0).toLocaleString()} oz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-marble/40">Avg Purity</span>
                      <span className="text-marble/70 font-medium">{((stats?.avgPurity ?? 0) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-marble/40">Certified Reserve</span>
                      <span className="text-marble/70 font-medium">{Number(reserveOz).toLocaleString()} oz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-marble/40">Total Value</span>
                      <span className="text-gold-light font-medium">${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-marble/40">Jurisdictions</span>
                      <span className="text-marble/70 font-medium">{stats?.jurisdictions.size ?? 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GAMetalProfile;
