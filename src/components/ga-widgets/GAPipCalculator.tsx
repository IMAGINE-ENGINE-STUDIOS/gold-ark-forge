import { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';
import WidgetShell from './WidgetShell';

interface PairDef {
  label: string;
  pipSize: number;
  pipLabel: string;
}

const PAIRS: PairDef[] = [
  { label: 'EUR/USD', pipSize: 0.0001, pipLabel: '0.0001' },
  { label: 'GBP/USD', pipSize: 0.0001, pipLabel: '0.0001' },
  { label: 'USD/JPY', pipSize: 0.01, pipLabel: '0.01' },
  { label: 'AUD/USD', pipSize: 0.0001, pipLabel: '0.0001' },
  { label: 'USD/CHF', pipSize: 0.0001, pipLabel: '0.0001' },
  { label: 'XAU/USD', pipSize: 0.01, pipLabel: '0.01' },
  { label: 'XAG/USD', pipSize: 0.001, pipLabel: '0.001' },
  { label: 'BTC/USD', pipSize: 1, pipLabel: '1.00' },
  { label: 'ETH/USD', pipSize: 0.01, pipLabel: '0.01' },
];

const LOT_PRESETS = [0.01, 0.1, 1.0, 10.0];

const GAPipCalculator = () => {
  const [pairIdx, setPairIdx] = useState(0);
  const [lotSize, setLotSize] = useState(1.0);
  const [entryPrice, setEntryPrice] = useState('1.0850');
  const [exitPrice, setExitPrice] = useState('1.0900');

  const pair = PAIRS[pairIdx];

  const result = useMemo(() => {
    const entry = parseFloat(entryPrice) || 0;
    const exit = parseFloat(exitPrice) || 0;
    const contractSize = pair.label.startsWith('XAU') ? 100 : pair.label.startsWith('XAG') ? 5000 : pair.label.startsWith('BTC') ? 1 : pair.label.startsWith('ETH') ? 1 : 100000;
    const pipValue = (pair.pipSize / (entry || 1)) * contractSize * lotSize;
    const totalPips = entry > 0 ? (exit - entry) / pair.pipSize : 0;
    const pnl = totalPips * (pipValue > 0 ? pipValue : 0) * pair.pipSize;
    const pnlSimple = (exit - entry) * contractSize * lotSize;
    return { pipValue: pipValue * pair.pipSize, totalPips, pnl: pnlSimple };
  }, [pairIdx, lotSize, entryPrice, exitPrice, pair]);

  return (
    <WidgetShell icon={Calculator} title="PIP CALCULATOR" badge="FOREX">
      <div className="space-y-4">
        {/* Pair selector */}
        <div>
          <div className="text-[7px] text-marble/30 font-display tracking-wider mb-1">CURRENCY PAIR</div>
          <div className="flex flex-wrap gap-1">
            {PAIRS.map((p, i) => (
              <button key={p.label} onClick={() => setPairIdx(i)}
                className={`px-2 py-1 rounded text-[8px] font-mono transition-all ${
                  pairIdx === i ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-navy-light/30 text-marble/30 border border-gold/5 hover:text-marble/50'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lot presets + input */}
        <div>
          <div className="text-[7px] text-marble/30 font-display tracking-wider mb-1">LOT SIZE</div>
          <div className="flex gap-1 mb-1">
            {LOT_PRESETS.map(l => (
              <button key={l} onClick={() => setLotSize(l)}
                className={`flex-1 py-1 rounded text-[8px] font-mono transition-all ${
                  lotSize === l ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-navy-light/30 text-marble/30 border border-gold/5 hover:text-marble/50'
                }`}>
                {l}
              </button>
            ))}
          </div>
          <input type="number" value={lotSize} onChange={e => setLotSize(parseFloat(e.target.value) || 0)} step="0.01" min="0.01"
            className="w-full bg-navy-light border border-gold/15 rounded px-2 py-1.5 text-xs font-mono text-marble focus:outline-none focus:border-gold/40" />
        </div>

        {/* Entry/Exit */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[7px] text-marble/30 font-display tracking-wider mb-1">ENTRY PRICE</div>
            <input type="text" value={entryPrice} onChange={e => setEntryPrice(e.target.value)}
              className="w-full bg-navy-light border border-gold/15 rounded px-2 py-1.5 text-xs font-mono text-marble focus:outline-none focus:border-gold/40" />
          </div>
          <div>
            <div className="text-[7px] text-marble/30 font-display tracking-wider mb-1">EXIT PRICE</div>
            <input type="text" value={exitPrice} onChange={e => setExitPrice(e.target.value)}
              className="w-full bg-navy-light border border-gold/15 rounded px-2 py-1.5 text-xs font-mono text-marble focus:outline-none focus:border-gold/40" />
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-navy-light/30 rounded p-2 text-center border border-gold/5">
            <div className="text-[7px] text-marble/30 font-display tracking-wider">PIP VALUE</div>
            <div className="text-xs font-mono text-marble/70">${result.pipValue.toFixed(4)}</div>
          </div>
          <div className="bg-navy-light/30 rounded p-2 text-center border border-gold/5">
            <div className="text-[7px] text-marble/30 font-display tracking-wider">TOTAL PIPS</div>
            <div className={`text-xs font-mono ${result.totalPips >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.totalPips >= 0 ? '+' : ''}{result.totalPips.toFixed(1)}
            </div>
          </div>
          <div className="bg-navy-light/30 rounded p-2 text-center border border-gold/5">
            <div className="text-[7px] text-marble/30 font-display tracking-wider">P&L</div>
            <div className={`text-xs font-mono ${result.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.pnl >= 0 ? '+' : ''}${result.pnl.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="text-[8px] font-mono text-marble/20 text-center">
          Pip size: {pair.pipLabel} · Contract: {pair.label.startsWith('XAU') ? '100 oz' : pair.label.startsWith('XAG') ? '5,000 oz' : pair.label.startsWith('BTC') || pair.label.startsWith('ETH') ? '1 unit' : '100K units'}
        </div>
      </div>
    </WidgetShell>
  );
};

export default GAPipCalculator;
