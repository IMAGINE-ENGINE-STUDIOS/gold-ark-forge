import { useEffect, useState, useRef } from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import WidgetShell from './WidgetShell';
import AnimatedNumber from './AnimatedNumber';

interface PriceFeed {
  metal_type: 'gold' | 'silver' | 'platinum';
  price_usd: number;
  change_24h: number | null;
}

// Live-streaming price display for a single metal
const LiveMetalPrice = ({ metal, basePrices }: { metal: 'gold' | 'silver' | 'platinum'; basePrices: Record<string, PriceFeed> }) => {
  const p = basePrices[metal];
  const price = p?.price_usd ?? 0;
  const change = p?.change_24h ?? 0;
  const pos = change >= 0;

  return (
    <div className="text-center p-3 rounded bg-navy-dark/40 border border-gold/10 hover:border-gold/25 transition-all duration-300">
      <span className="text-[10px] font-display tracking-[0.2em] text-marble/35 uppercase">{metal}</span>
      <p className="font-mono text-sm text-marble mt-1">${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
      <div className={`flex items-center justify-center gap-1 text-[10px] font-mono mt-0.5 ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
        {pos ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
        {Math.abs(change).toFixed(2)}%
      </div>
    </div>
  );
};

// Live ratio component
const LiveRatio = ({ basePrices }: { basePrices: Record<string, PriceFeed> }) => {
  const goldLive = basePrices.gold?.price_usd ?? 0;
  const silverLive = basePrices.silver?.price_usd ?? 0;
  const platLive = basePrices.platinum?.price_usd ?? 0;

  const gsr = silverLive > 0 ? (goldLive / silverLive) : 0;
  const gpr = platLive > 0 ? (goldLive / platLive) : 0;
  const spr = platLive > 0 ? (silverLive / platLive) : 0;

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
      sub: platLive > 0 ? `Gold is ${gpr > 1 ? 'more' : 'less'} expensive than platinum` : '—',
      signal: gpr > 2 ? 'Platinum undervalued' : gpr < 1 ? 'Platinum overvalued' : 'At parity zone',
      signalColor: gpr > 2 ? 'text-emerald-400' : gpr < 1 ? 'text-red-400' : 'text-gold',
      historic: '~1.0 (historic parity)',
      gaugePercent: Math.min(100, (gpr / 3) * 100),
    },
    {
      label: 'SILVER / PLATINUM',
      value: spr,
      decimals: 4,
      sub: platLive > 0 ? `${(1 / spr).toFixed(0)} oz silver per oz platinum` : '—',
      signal: '—',
      signalColor: 'text-marble/50',
      historic: '—',
      gaugePercent: Math.min(100, spr * 5000),
    },
  ];

  return (
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
  );
};

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
    // Auto-refresh every 60s
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

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
          {/* Live prices */}
          <div className="grid grid-cols-3 gap-3">
            {(['gold', 'silver', 'platinum'] as const).map((m) => (
              <LiveMetalPrice key={m} metal={m} basePrices={prices} />
            ))}
          </div>

          {/* Live ratios */}
          <LiveRatio basePrices={prices} />

          <div className="text-center">
            <span className="text-[9px] text-emerald-400/50 font-mono flex items-center justify-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ratios updating in real-time
            </span>
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

export default GAGoldRatio;
