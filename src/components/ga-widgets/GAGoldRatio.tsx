import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PriceFeed {
  metal_type: 'gold' | 'silver' | 'platinum';
  price_usd: number;
  change_24h: number | null;
}

const GAGoldRatio = () => {
  const [prices, setPrices] = useState<Record<string, PriceFeed>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('price_feeds').select('metal_type, price_usd, change_24h');
      if (data) {
        const map: Record<string, PriceFeed> = {};
        data.forEach((r: any) => { map[r.metal_type] = r; });
        setPrices(map);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="rounded-sm border border-gold/20 bg-navy-light/50 p-8 animate-pulse">
        <div className="h-6 w-48 bg-gold/10 rounded mb-4" />
        <div className="h-32 bg-gold/5 rounded" />
      </div>
    );
  }

  const gold = prices.gold?.price_usd ?? 0;
  const silver = prices.silver?.price_usd ?? 0;
  const platinum = prices.platinum?.price_usd ?? 0;

  const gsr = silver > 0 ? (gold / silver) : 0;
  const gpr = platinum > 0 ? (gold / platinum) : 0;
  const spr = platinum > 0 ? (silver / platinum) : 0;

  const ratios = [
    {
      label: 'GOLD / SILVER',
      value: gsr.toFixed(1),
      sub: `${gsr.toFixed(1)} oz silver = 1 oz gold`,
      signal: gsr > 80 ? 'Silver undervalued' : gsr < 60 ? 'Silver overvalued' : 'Neutral',
      signalColor: gsr > 80 ? 'text-green-400' : gsr < 60 ? 'text-red-400' : 'text-gold',
      historic: '~67 (50yr avg)',
    },
    {
      label: 'GOLD / PLATINUM',
      value: gpr.toFixed(2),
      sub: platinum > 0 ? `Gold is ${gpr > 1 ? 'more' : 'less'} expensive than platinum` : '—',
      signal: gpr > 2 ? 'Platinum undervalued' : gpr < 1 ? 'Platinum overvalued' : 'At parity zone',
      signalColor: gpr > 2 ? 'text-green-400' : gpr < 1 ? 'text-red-400' : 'text-gold',
      historic: '~1.0 (historic parity)',
    },
    {
      label: 'SILVER / PLATINUM',
      value: spr.toFixed(4),
      sub: platinum > 0 ? `${(1 / spr).toFixed(0)} oz silver per oz platinum` : '—',
      signal: '—',
      signalColor: 'text-marble/50',
      historic: '—',
    },
  ];

  return (
    <div className="rounded-sm border border-gold/20 bg-navy-light/50 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10 bg-navy-dark/50">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-gold" />
          <span className="font-display text-sm tracking-[0.15em] text-gold-light">METAL RATIOS</span>
          <span className="text-[10px] text-marble/30 font-mono ml-2">proprietary</span>
        </div>
      </div>

      {/* Current prices summary */}
      <div className="grid grid-cols-3 divide-x divide-gold/10 border-b border-gold/10">
        {(['gold', 'silver', 'platinum'] as const).map((m) => {
          const p = prices[m];
          const change = p?.change_24h ?? 0;
          const pos = change >= 0;
          return (
            <div key={m} className="px-4 py-3 text-center">
              <span className="text-[10px] font-display tracking-[0.2em] text-marble/40 uppercase">{m}</span>
              <p className="font-mono text-sm text-marble mt-1">${p?.price_usd?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '—'}</p>
              <div className={`flex items-center justify-center gap-1 text-[10px] font-mono mt-0.5 ${pos ? 'text-green-400' : 'text-red-400'}`}>
                {pos ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {Math.abs(change).toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Ratios */}
      <div className="divide-y divide-gold/5">
        {ratios.map((r) => (
          <div key={r.label} className="px-6 py-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">{r.label}</span>
              <p className="font-display text-2xl text-gold-light mt-1">{r.value}</p>
              <p className="text-[10px] text-marble/30 mt-0.5">{r.sub}</p>
            </div>
            <div className="text-right">
              <p className={`text-xs font-display tracking-wider ${r.signalColor}`}>{r.signal}</p>
              <p className="text-[10px] text-marble/20 mt-1">{r.historic}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GAGoldRatio;
