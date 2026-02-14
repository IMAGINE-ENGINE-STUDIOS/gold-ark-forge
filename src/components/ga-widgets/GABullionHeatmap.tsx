import { useBullionBars } from '@/hooks/useBullionBars';
import { Grid3X3 } from 'lucide-react';
import { useMemo } from 'react';

const metalColors: Record<string, { base: string; hover: string }> = {
  gold: { base: 'hsla(43, 72%, 50%,', hover: 'border-gold/60' },
  silver: { base: 'hsla(210, 6%, 67%,', hover: 'border-silver/60' },
  platinum: { base: 'hsla(210, 4%, 76%,', hover: 'border-platinum/60' },
};

const GABullionHeatmap = () => {
  const { data: bars, isLoading } = useBullionBars({ limit: 50 });

  const grouped = useMemo(() => {
    if (!bars) return { gold: [], silver: [], platinum: [] };
    const g: Record<string, typeof bars> = { gold: [], silver: [], platinum: [] };
    bars.forEach((b) => {
      if (g[b.metal_type]) g[b.metal_type].push(b);
    });
    return g;
  }, [bars]);

  const maxWeight = useMemo(() => {
    if (!bars?.length) return 1;
    return Math.max(...bars.map((b) => Number(b.weight_oz)));
  }, [bars]);

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Grid3X3 className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">BULLION HEATMAP</h3>
        </div>

        {isLoading ? (
          <div className="h-40 bg-navy-light/30 rounded animate-pulse" />
        ) : (
          <div className="space-y-6">
            {(['gold', 'silver', 'platinum'] as const).map((metal) => {
              const metalBars = grouped[metal];
              if (!metalBars.length) return null;
              const totalOz = metalBars.reduce((s, b) => s + Number(b.weight_oz), 0);
              const colorBase = metalColors[metal].base;

              return (
                <div key={metal}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-xs tracking-[0.2em] text-marble/60">{metal.toUpperCase()}</span>
                    <span className="text-xs text-marble/40">{totalOz.toLocaleString()} oz total</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {metalBars.map((bar) => {
                      const weight = Number(bar.weight_oz);
                      const opacity = 0.2 + (weight / maxWeight) * 0.8;
                      const size = Math.max(20, Math.min(48, 16 + (weight / maxWeight) * 32));
                      return (
                        <div
                          key={bar.id}
                          title={`${bar.serial_number} — ${weight} oz (${bar.custody_status})`}
                          className="rounded-sm cursor-default transition-all hover:scale-110 border border-transparent hover:border-gold/30"
                          style={{
                            width: size,
                            height: size,
                            backgroundColor: `${colorBase}${opacity})`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {!bars?.length && (
              <div className="text-center py-8 text-marble/30 text-sm font-display tracking-widest">
                NO BULLION DATA
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gold/10 flex items-center gap-6 text-[10px] text-marble/30">
          <span>Size = weight · Opacity = relative size</span>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsla(43, 72%, 50%, 0.4)' }} />
            <span>Light</span>
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsla(43, 72%, 50%, 1)' }} />
            <span>Heavy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GABullionHeatmap;
