import { useState } from 'react';
import { ShieldAlert, Plus, Trash2, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRiskMonitor } from '@/hooks/useRiskMonitor';

interface RiskLimitsProps {
  riskMonitor: ReturnType<typeof useRiskMonitor>;
}

const RiskLimits = ({ riskMonitor }: RiskLimitsProps) => {
  const { config, breachedSymbols, setFloor, removeFloor, updateDrawdownLimit, updateDailyLossLimit, updatePositionSizeLimit, togglePause } = riskMonitor;
  const [newSymbol, setNewSymbol] = useState('');
  const [newFloor, setNewFloor] = useState('');

  const handleAddFloor = () => {
    if (!newSymbol.trim() || !newFloor) return;
    setFloor(newSymbol.trim().toUpperCase(), parseFloat(newFloor));
    setNewSymbol('');
    setNewFloor('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-gold" />
          <span className="font-display text-sm tracking-wider text-gold-light">AUTO-PROTECTION</span>
        </div>
        <button onClick={togglePause} className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-display tracking-wider ${config.paused ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
          {config.paused ? <><Pause className="w-3 h-3" /> PAUSED</> : <><Play className="w-3 h-3" /> ACTIVE</>}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Drawdown limit */}
        <div className="bg-navy-light/30 rounded-lg p-2.5 border border-gold/5">
          <label className="text-[8px] text-marble/30 font-display tracking-wider">MAX DRAWDOWN (%)</label>
          <Input type="number" value={config.drawdownLimit} onChange={(e) => updateDrawdownLimit(parseFloat(e.target.value) || 0)}
            className="bg-navy-light border-gold/15 text-marble font-mono text-xs h-8 mt-1" min="1" max="50" />
          {config.peakValue > 0 && (
            <div className="mt-1.5">
              <div className="w-full h-1.5 bg-navy-dark/50 rounded-full overflow-hidden">
                <div className="h-full bg-gold/50 rounded-full" style={{ width: `${Math.min(config.drawdownLimit, 100)}%` }} />
              </div>
              <div className="text-[7px] text-marble/20 mt-0.5">Peak: ${config.peakValue.toLocaleString()}</div>
            </div>
          )}
        </div>

        {/* Daily loss */}
        <div className="bg-navy-light/30 rounded-lg p-2.5 border border-gold/5">
          <label className="text-[8px] text-marble/30 font-display tracking-wider">DAILY LOSS LIMIT ($)</label>
          <Input type="number" value={config.dailyLossLimit} onChange={(e) => updateDailyLossLimit(parseFloat(e.target.value) || 0)}
            className="bg-navy-light border-gold/15 text-marble font-mono text-xs h-8 mt-1" />
          <div className="mt-1.5">
            <div className="flex justify-between text-[7px]">
              <span className="text-marble/20">Today</span>
              <span className={config.dailyLossToday > config.dailyLossLimit * 0.8 ? 'text-red-400' : 'text-marble/30'}>
                ${config.dailyLossToday.toFixed(0)} / ${config.dailyLossLimit}
              </span>
            </div>
            <div className="w-full h-1.5 bg-navy-dark/50 rounded-full overflow-hidden mt-0.5">
              <div className={`h-full rounded-full ${config.dailyLossToday > config.dailyLossLimit * 0.8 ? 'bg-red-500' : 'bg-emerald-500/60'}`}
                style={{ width: `${Math.min((config.dailyLossToday / config.dailyLossLimit) * 100, 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Position size */}
        <div className="bg-navy-light/30 rounded-lg p-2.5 border border-gold/5">
          <label className="text-[8px] text-marble/30 font-display tracking-wider">MAX POS. SIZE (%)</label>
          <Input type="number" value={config.positionSizeLimit} onChange={(e) => updatePositionSizeLimit(parseFloat(e.target.value) || 0)}
            className="bg-navy-light border-gold/15 text-marble font-mono text-xs h-8 mt-1" min="5" max="100" />
          <div className="text-[7px] text-marble/20 mt-1.5">Max % of portfolio in single asset</div>
        </div>
      </div>

      {/* Floor prices */}
      <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-display tracking-wider text-gold/60">FLOOR PRICES (AUTO-SELL TRIGGERS)</span>
        </div>

        <div className="flex items-center gap-1.5 mb-2">
          <Input value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)}
            className="bg-navy-light border-gold/15 text-marble font-mono text-[10px] h-7 w-20" placeholder="Symbol" />
          <Input type="number" value={newFloor} onChange={(e) => setNewFloor(e.target.value)}
            className="bg-navy-light border-gold/15 text-marble font-mono text-[10px] h-7 w-24" placeholder="Floor $" />
          <Button onClick={handleAddFloor} className="bg-gold/20 text-gold border border-gold/30 h-7 px-2">
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {Object.entries(config.floors).length > 0 ? (
          <div className="space-y-1">
            {Object.entries(config.floors).map(([symbol, floor]) => {
              const breached = breachedSymbols.includes(symbol);
              return (
                <div key={symbol} className={`flex items-center justify-between p-1.5 rounded ${breached ? 'bg-red-500/10 border border-red-500/30' : 'bg-navy-dark/30 border border-gold/5'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-marble/60">{symbol}</span>
                    <span className={`text-[10px] font-mono ${breached ? 'text-red-400' : 'text-gold/50'}`}>Floor: ${floor.toLocaleString()}</span>
                    {breached && <span className="text-[7px] bg-red-500/30 text-red-400 px-1 rounded animate-pulse">BREACHED</span>}
                  </div>
                  <button onClick={() => removeFloor(symbol)} className="p-1 text-marble/25 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-2 text-marble/15 text-[9px]">No floor prices set</div>
        )}
      </div>
    </div>
  );
};

export default RiskLimits;
