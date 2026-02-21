import { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';
import WidgetShell from './WidgetShell';

const LEVERAGE_PRESETS = [1, 5, 10, 25, 50, 100];

const GAMarginCalc = () => {
  const [accountSize, setAccountSize] = useState(10000);
  const [leverage, setLeverage] = useState(10);
  const [positionSize, setPositionSize] = useState(1);
  const [entryPrice, setEntryPrice] = useState(2650);

  const calc = useMemo(() => {
    const notional = positionSize * entryPrice;
    const requiredMargin = notional / leverage;
    const maintenanceMargin = requiredMargin * 0.5;
    const liquidationDistance = (accountSize - requiredMargin) / positionSize;
    const liquidationPrice = Math.max(0, entryPrice - liquidationDistance);
    const maxPosition = (accountSize * leverage) / entryPrice;
    const marginUsage = accountSize > 0 ? (requiredMargin / accountSize) * 100 : 0;
    return { notional, requiredMargin, maintenanceMargin, liquidationPrice, maxPosition, marginUsage };
  }, [accountSize, leverage, positionSize, entryPrice]);

  const usageColor = calc.marginUsage < 50 ? 'bg-emerald-500' : calc.marginUsage < 80 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <WidgetShell icon={Calculator} title="MARGIN CALCULATOR" badge="RISK">
      <div className="space-y-4">
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'ACCOUNT SIZE', value: accountSize, set: setAccountSize, prefix: '$' },
            { label: 'ENTRY PRICE', value: entryPrice, set: setEntryPrice, prefix: '$' },
            { label: 'POSITION SIZE', value: positionSize, set: setPositionSize, prefix: '' },
            { label: 'LEVERAGE', value: leverage, set: setLeverage, prefix: '', suffix: 'x' },
          ].map(f => (
            <div key={f.label}>
              <div className="text-[7px] text-marble/30 font-display tracking-wider mb-1">{f.label}</div>
              <div className="relative">
                {f.prefix && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-marble/30">{f.prefix}</span>}
                <input
                  type="number"
                  value={f.value}
                  onChange={e => f.set(parseFloat(e.target.value) || 0)}
                  className={`w-full bg-navy-light border border-gold/15 rounded px-2 py-1.5 text-xs font-mono text-marble focus:outline-none focus:border-gold/40 ${f.prefix ? 'pl-5' : ''}`}
                />
                {f.suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-marble/30">{f.suffix}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Leverage Presets */}
        <div className="flex gap-1">
          {LEVERAGE_PRESETS.map(l => (
            <button key={l} onClick={() => setLeverage(l)}
              className={`flex-1 py-1 rounded text-[8px] font-mono transition-all ${
                leverage === l ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-navy-light/30 text-marble/30 border border-gold/5 hover:text-marble/50'
              }`}>
              {l}x
            </button>
          ))}
        </div>

        {/* Margin Usage Bar */}
        <div>
          <div className="flex justify-between text-[8px] font-mono mb-1">
            <span className="text-marble/40">MARGIN USAGE</span>
            <span className={calc.marginUsage > 80 ? 'text-red-400' : 'text-marble/60'}>{calc.marginUsage.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 bg-navy-light/50 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 flex">
              <div className="w-1/2 bg-emerald-500/10" /><div className="w-[30%] bg-amber-500/10" /><div className="w-[20%] bg-red-500/10" />
            </div>
            <div className={`h-full ${usageColor} rounded-full transition-all duration-300 relative z-10`} style={{ width: `${Math.min(calc.marginUsage, 100)}%` }} />
          </div>
        </div>

        {/* Outputs */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'REQUIRED MARGIN', value: `$${calc.requiredMargin.toLocaleString('en-US', { maximumFractionDigits: 2 })}` },
            { label: 'MAINTENANCE', value: `$${calc.maintenanceMargin.toLocaleString('en-US', { maximumFractionDigits: 2 })}` },
            { label: 'LIQUIDATION', value: `$${calc.liquidationPrice.toFixed(2)}`, color: 'text-red-400' },
            { label: 'MAX POSITION', value: calc.maxPosition.toFixed(4) },
          ].map(o => (
            <div key={o.label} className="bg-navy-light/30 rounded p-2 border border-gold/5">
              <div className="text-[7px] text-marble/30 font-display tracking-wider">{o.label}</div>
              <div className={`text-xs font-mono ${o.color || 'text-marble/70'}`}>{o.value}</div>
            </div>
          ))}
        </div>
      </div>
    </WidgetShell>
  );
};

export default GAMarginCalc;
