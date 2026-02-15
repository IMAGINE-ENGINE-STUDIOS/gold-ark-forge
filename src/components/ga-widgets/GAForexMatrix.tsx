import { useForexRates } from '@/hooks/useForexRates';
import { ArrowLeftRight } from 'lucide-react';
import { useState } from 'react';
import LivePulse from './LivePulse';

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD'];

const GAForexMatrix = () => {
  const { data: rates, isLoading } = useForexRates();
  const [view, setView] = useState<'matrix' | 'heatmap'>('matrix');

  const getRate = (from: string, to: string): number => {
    if (from === to) return 1;
    return rates?.[from]?.rates[to] ?? 0;
  };

  // Calculate "strength" as avg performance vs other currencies
  const getStrength = (currency: string) => {
    if (!rates) return 0;
    const others = currencies.filter((c) => c !== currency);
    const rates_from = others.map((c) => getRate(currency, c));
    // Normalize: higher = stronger
    return rates_from.reduce((s, r) => s + r, 0) / others.length;
  };

  const strengths = currencies.map((c) => ({ currency: c, strength: getStrength(c) }));
  const maxStrength = Math.max(...strengths.map((s) => s.strength));
  const minStrength = Math.min(...strengths.map((s) => s.strength));

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="w-5 h-5 text-gold" />
            <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">FOREX INTELLIGENCE</h3>
            <LivePulse label="LIVE" />
          </div>
          <div className="flex gap-1">
            {(['matrix', 'heatmap'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1 text-[10px] font-display tracking-wider rounded transition-all ${view === v ? 'bg-gold/20 text-gold border border-gold/40' : 'text-marble/40 hover:text-marble/70 border border-transparent'}`}>
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 bg-navy-light/30 rounded animate-pulse" />
        ) : view === 'matrix' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-[10px] text-marble/40 font-display tracking-widest" />
                  {currencies.map((c) => (
                    <th key={c} className="p-2 text-[10px] text-marble/50 font-display tracking-widest text-center">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currencies.map((from) => (
                  <tr key={from} className="border-t border-navy-light/30">
                    <td className="p-2 text-[10px] text-marble/50 font-display tracking-widest">{from}</td>
                    {currencies.map((to) => {
                      const rate = getRate(from, to);
                      const isSelf = from === to;
                      return (
                        <td key={to} className={`p-2 text-center text-xs font-mono ${isSelf ? 'text-marble/20 bg-navy-dark/30' : 'text-marble/70'}`}>
                          {isSelf ? '—' : rate < 2 ? rate.toFixed(4) : rate.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] text-marble/30 tracking-widest font-display">RELATIVE CURRENCY STRENGTH</p>
            {strengths.sort((a, b) => b.strength - a.strength).map((s) => {
              const normalized = maxStrength === minStrength ? 0.5 : (s.strength - minStrength) / (maxStrength - minStrength);
              const color = normalized > 0.6 ? 'bg-emerald-400' : normalized < 0.4 ? 'bg-red-400' : 'bg-gold';
              return (
                <div key={s.currency} className="flex items-center gap-3">
                  <span className="font-display text-xs tracking-widest text-marble/60 w-10">{s.currency}</span>
                  <div className="flex-1 h-6 bg-navy-dark/50 rounded-sm overflow-hidden relative">
                    <div
                      className={`h-full ${color} rounded-sm transition-all duration-700`}
                      style={{ width: `${normalized * 100}%`, opacity: 0.6 }}
                    />
                    <span className="absolute inset-y-0 right-2 flex items-center text-[10px] text-marble/40 font-mono">
                      {(normalized * 100).toFixed(0)}
                    </span>
                  </div>
                </div>
              );
            })}
            <p className="text-[10px] text-marble/20 mt-2 text-center font-display tracking-widest">
              UPDATED: {rates?.[currencies[0]]?.date ?? '—'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GAForexMatrix;
