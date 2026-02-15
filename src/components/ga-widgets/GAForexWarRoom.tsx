import { useMemo } from 'react';
import { Globe, TrendingUp, TrendingDown } from 'lucide-react';
import { useForexRates } from '@/hooks/useForexRates';
import LivePulse from './LivePulse';

const MAJOR_PAIRS = [
  { pair: 'EUR/USD', base: 'EUR', quote: 'USD' },
  { pair: 'GBP/USD', base: 'GBP', quote: 'USD' },
  { pair: 'USD/JPY', base: 'USD', quote: 'JPY' },
  { pair: 'USD/CHF', base: 'USD', quote: 'CHF' },
  { pair: 'AUD/USD', base: 'AUD', quote: 'USD' },
  { pair: 'USD/CAD', base: 'USD', quote: 'CAD' },
  { pair: 'EUR/GBP', base: 'EUR', quote: 'GBP' },
  { pair: 'EUR/JPY', base: 'EUR', quote: 'JPY' },
];

const GAForexWarRoom = () => {
  const { data: rates, isLoading } = useForexRates();

  const pairData = useMemo(() => {
    if (!rates) return [];
    return MAJOR_PAIRS.map(p => {
      const baseRates = rates[p.base];
      const rate = baseRates?.rates?.[p.quote] ?? 0;
      // Simulated daily change
      const seed = p.pair.charCodeAt(0) + p.pair.charCodeAt(4);
      const change = Math.sin(Date.now() / 300000 + seed) * 0.4;
      return { ...p, rate, change: Math.round(change * 100) / 100 };
    });
  }, [rates]);

  // Currency strength index
  const strength = useMemo(() => {
    if (!rates) return [];
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD'];
    return currencies.map(c => {
      const baseRates = rates[c];
      if (!baseRates) return { currency: c, score: 0 };
      const vals = Object.values(baseRates.rates).filter(v => v !== 1);
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
      const score = Math.round((avg - 1) * 100) / 10;
      return { currency: c, score };
    }).sort((a, b) => b.score - a.score);
  }, [rates]);

  const maxAbs = Math.max(...strength.map(s => Math.abs(s.score)), 1);

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">FOREX WAR ROOM</h3>
          <LivePulse label="LIVE" />
        </div>

        {isLoading ? (
          <div className="h-48 bg-navy-light/30 rounded animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Major Pairs Grid */}
            <div>
              <div className="text-[8px] font-display tracking-[0.2em] text-marble/30 mb-3">MAJOR & CROSS PAIRS</div>
              <div className="grid grid-cols-2 gap-2">
                {pairData.map(p => (
                  <div key={p.pair} className="bg-navy-light/15 rounded-lg p-3 border border-gold/5 hover:border-gold/20 transition-colors">
                    <div className="text-[9px] font-display tracking-wider text-marble/40">{p.pair}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-mono text-marble">{p.rate.toFixed(p.quote === 'JPY' ? 2 : 4)}</span>
                      <span className={`text-[9px] font-mono flex items-center gap-0.5 ${p.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {p.change >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {p.change >= 0 ? '+' : ''}{p.change.toFixed(2)}%
                      </span>
                    </div>
                    {/* Mini strength bar */}
                    <div className="h-1 bg-navy-dark/50 rounded-full mt-2 overflow-hidden">
                      <div className={`h-full rounded-full ${p.change >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(Math.abs(p.change) * 100, 100)}%`, opacity: 0.6 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Currency Strength */}
            <div>
              <div className="text-[8px] font-display tracking-[0.2em] text-marble/30 mb-3">CURRENCY STRENGTH INDEX</div>
              <div className="bg-navy-light/10 rounded-lg p-4 border border-gold/5">
                <div className="space-y-3">
                  {strength.map((s, i) => (
                    <div key={s.currency} className="flex items-center gap-3">
                      <span className={`text-xs font-display tracking-wider w-8 ${i === 0 ? 'text-gold' : i < 3 ? 'text-marble/70' : 'text-marble/40'}`}>
                        {s.currency}
                      </span>
                      <div className="flex-1 h-4 bg-navy-dark/40 rounded-sm overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[7px] font-mono text-marble/30 z-10">{s.score > 0 ? '+' : ''}{s.score.toFixed(1)}</span>
                        </div>
                        <div
                          className={`h-full rounded-sm ${s.score >= 0 ? 'bg-emerald-500/40' : 'bg-red-500/40'}`}
                          style={{
                            width: `${(Math.abs(s.score) / maxAbs) * 50}%`,
                            marginLeft: s.score >= 0 ? '50%' : `${50 - (Math.abs(s.score) / maxAbs) * 50}%`,
                          }}
                        />
                      </div>
                      <span className={`text-[8px] font-display tracking-wider ${i === 0 ? 'text-emerald-400' : i >= strength.length - 1 ? 'text-red-400' : 'text-marble/30'}`}>
                        {i === 0 ? 'STRONGEST' : i >= strength.length - 1 ? 'WEAKEST' : `#${i + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Indicator */}
              <div className="mt-3 bg-navy-light/10 rounded-lg p-3 border border-gold/5">
                <div className="text-[8px] font-display tracking-[0.2em] text-marble/30 mb-2">ACTIVE SESSIONS</div>
                <div className="flex gap-2">
                  {[
                    { name: 'TOKYO', active: new Date().getUTCHours() >= 0 && new Date().getUTCHours() < 9 },
                    { name: 'LONDON', active: new Date().getUTCHours() >= 7 && new Date().getUTCHours() < 16 },
                    { name: 'NEW YORK', active: new Date().getUTCHours() >= 13 && new Date().getUTCHours() < 22 },
                  ].map(s => (
                    <div key={s.name} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[8px] font-display tracking-wider ${
                      s.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-marble/20 border border-gold/5'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-emerald-500 animate-pulse' : 'bg-marble/10'}`} />
                      {s.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GAForexWarRoom;
