import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import WidgetShell from './WidgetShell';
import AnimatedNumber from './AnimatedNumber';

interface PriceFeed {
  metal_type: 'gold' | 'silver' | 'platinum';
  price_usd: number;
  change_24h: number | null;
}

const GAGoldRatio = () => {
  const [prices, setPrices] = useState<Record<string, PriceFeed>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      const { data } = await supabase.from('price_feeds').select('metal_type, price_usd, change_24h');
      if (data) {
        const map: Record<string, PriceFeed> = {};
        data.forEach((r: any) => { map[r.metal_type] = r; });
        setPrices(map);
      }
      setLoading(false);
    };
    fetchPrices();
  }, []);

  const gold = prices.gold?.price_usd ?? 0;
  const silver = prices.silver?.price_usd ?? 0;
  const platinum = prices.platinum?.price_usd ?? 0;

  const gsr = silver > 0 ? (gold / silver) : 0;
  const gpr = platinum > 0 ? (gold / platinum) : 0;
  const spr = platinum > 0 ? (silver / platinum) : 0;

  const ratios = [
    {
      label: 'GOLD / SILVER',
      value: gsr,
      decimals: 1,
      sub: `${gsr.toFixed(1)} oz silver = 1 oz gold`,
      signal: gsr > 80 ? 'Silver undervalued' : gsr < 60 ? 'Silver overvalued' : 'Neutral',
      signalColor: gsr > 80 ? 'text-emerald-400' : gsr < 60 ? 'text-red-400' : 'text-gold',
      historic: '~67 (50yr avg)',
      gaugePercent: Math.min(100, (gsr / 100) * 100),
    },
    {
      label: 'GOLD / PLATINUM',
      value: gpr,
      decimals: 2,
      sub: platinum > 0 ? `Gold is ${gpr > 1 ? 'more' : 'less'} expensive than platinum` : '—',
      signal: gpr > 2 ? 'Platinum undervalued' : gpr < 1 ? 'Platinum overvalued' : 'At parity zone',
      signalColor: gpr > 2 ? 'text-emerald-400' : gpr < 1 ? 'text-red-400' : 'text-gold',
      historic: '~1.0 (historic parity)',
      gaugePercent: Math.min(100, (gpr / 3) * 100),
    },
    {
      label: 'SILVER / PLATINUM',
      value: spr,
      decimals: 4,
      sub: platinum > 0 ? `${(1 / spr).toFixed(0)} oz silver per oz platinum` : '—',
      signal: '—',
      signalColor: 'text-marble/50',
      historic: '—',
      gaugePercent: Math.min(100, spr * 5000),
    },
  ];

  return (
    <WidgetShell icon={BarChart3} title="METAL RATIOS" source="proprietary">
      {loading ? (
        <div className="space-y-4">
          <div className="h-16 bg-navy-light/30 rounded skeleton-shimmer" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-navy-light/20 rounded skeleton-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current prices summary */}
          <div className="grid grid-cols-3 gap-3">
            {(['gold', 'silver', 'platinum'] as const).map((m) => {
              const p = prices[m];
              const change = p?.change_24h ?? 0;
              const pos = change >= 0;
              return (
                <div key={m} className="text-center p-3 rounded bg-navy-dark/40 border border-gold/10 hover:border-gold/25 transition-all duration-300">
                  <span className="text-[10px] font-display tracking-[0.2em] text-marble/35 uppercase">{m}</span>
                  <p className="font-mono text-sm text-marble mt-1">${p?.price_usd?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '—'}</p>
                  <div className={`flex items-center justify-center gap-1 text-[10px] font-mono mt-0.5 ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pos ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {Math.abs(change).toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ratios with visual gauges */}
          <div className="space-y-4">
            {ratios.map((r) => (
              <div key={r.label} className="p-4 rounded bg-navy-dark/20 border border-gold/5 hover:border-gold/15 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">{r.label}</span>
                  <span className={`text-xs font-display tracking-wider ${r.signalColor}`}>{r.signal}</span>
                </div>
                <div className="flex items-center gap-4">
                  <AnimatedNumber value={r.value} decimals={r.decimals} className="font-display text-2xl text-gold-light" />
                  <div className="flex-1">
                    <div className="h-2 bg-navy-light/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold transition-all duration-1000 ease-out"
                        style={{ width: `${r.gaugePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-marble/25">{r.sub}</p>
                  <p className="text-[10px] text-marble/20">{r.historic}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

export default GAGoldRatio;
