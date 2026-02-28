import { Bot, Power, Skull, Zap, Activity, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import type { BotConfig, BotDecision, BotStats, StrategyPreset } from '@/hooks/useTradingBot';

interface Props {
  config: BotConfig;
  updateConfig: (patch: Partial<BotConfig>) => void;
  activityLog: BotDecision[];
  stats: BotStats;
  killAll: () => void;
  positionCount: number;
  equity: number;
}

const STRATEGY_LABELS: Record<StrategyPreset, { label: string; desc: string; color: string }> = {
  conservative: { label: 'CONSERVATIVE', desc: 'Strong signals only', color: 'text-blue-400' },
  balanced: { label: 'BALANCED', desc: 'Default thresholds', color: 'text-gold' },
  aggressive: { label: 'AGGRESSIVE', desc: 'Wider entries', color: 'text-red-400' },
  wave_first: { label: 'WAVE-FIRST', desc: '40% forecast weight', color: 'text-purple-400' },
};

export default function BotControlPanel({ config, updateConfig, activityLog, stats, killAll, positionCount, equity }: Props) {
  const isOn = config.enabled;

  return (
    <div className="space-y-3">
      {/* Master Toggle */}
      <div className="flex items-center justify-between bg-navy-light/30 rounded-lg p-3 border border-gold/10">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isOn ? 'bg-emerald-500 animate-pulse' : 'bg-red-500/60'}`} />
          <span className="text-[10px] font-display tracking-[0.15em] text-marble/70">
            {isOn ? 'BOT ACTIVE' : 'BOT OFFLINE'}
          </span>
        </div>
        <Switch checked={isOn} onCheckedChange={(v) => updateConfig({ enabled: v })} />
      </div>

      {/* Strategy Preset */}
      <div>
        <div className="text-[8px] font-display tracking-[0.2em] text-marble/30 mb-1.5">STRATEGY</div>
        <div className="grid grid-cols-2 gap-1">
          {(Object.entries(STRATEGY_LABELS) as [StrategyPreset, typeof STRATEGY_LABELS[StrategyPreset]][]).map(([key, { label, desc, color }]) => (
            <button
              key={key}
              onClick={() => updateConfig({ strategy: key })}
              className={`p-2 rounded text-left border transition-all ${
                config.strategy === key
                  ? 'bg-gold/10 border-gold/30'
                  : 'bg-navy-light/20 border-gold/5 hover:border-gold/15'
              }`}
            >
              <div className={`text-[9px] font-display tracking-wider ${config.strategy === key ? color : 'text-marble/40'}`}>{label}</div>
              <div className="text-[7px] text-marble/20 mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Scan Interval */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[8px] font-display tracking-[0.2em] text-marble/30">SCAN INTERVAL</span>
          <span className="text-[9px] font-mono text-gold/60">{config.scanIntervalSec}s</span>
        </div>
        <Slider
          value={[config.scanIntervalSec]}
          onValueChange={([v]) => updateConfig({ scanIntervalSec: v })}
          min={5} max={60} step={5}
          className="w-full"
        />
      </div>

      {/* Max Positions */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[8px] font-display tracking-[0.2em] text-marble/30">MAX POSITIONS</span>
          <span className="text-[9px] font-mono text-gold/60">{config.maxPositions}</span>
        </div>
        <Slider
          value={[config.maxPositions]}
          onValueChange={([v]) => updateConfig({ maxPositions: v })}
          min={1} max={10} step={1}
          className="w-full"
        />
      </div>

      {/* Risk Per Trade */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[8px] font-display tracking-[0.2em] text-marble/30">RISK / TRADE</span>
          <span className="text-[9px] font-mono text-gold/60">{config.riskPerTradePct}%</span>
        </div>
        <Slider
          value={[config.riskPerTradePct]}
          onValueChange={([v]) => updateConfig({ riskPerTradePct: v })}
          min={1} max={10} step={0.5}
          className="w-full"
        />
      </div>

      {/* Running Stats */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-navy-light/20 rounded p-1.5 text-center border border-gold/5">
          <div className="text-[7px] text-marble/20 font-display tracking-wider">DECISIONS</div>
          <div className="text-[10px] font-mono text-marble/60">{stats.totalDecisions}</div>
        </div>
        <div className="bg-navy-light/20 rounded p-1.5 text-center border border-gold/5">
          <div className="text-[7px] text-marble/20 font-display tracking-wider">EXECUTIONS</div>
          <div className="text-[10px] font-mono text-emerald-400/60">{stats.totalExecutions}</div>
        </div>
        <div className="bg-navy-light/20 rounded p-1.5 text-center border border-gold/5">
          <div className="text-[7px] text-marble/20 font-display tracking-wider">POSITIONS</div>
          <div className="text-[10px] font-mono text-marble/60">{positionCount}</div>
        </div>
      </div>

      {stats.activeSince && (
        <div className="text-[8px] text-marble/20 font-mono text-center flex items-center justify-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          Active since {new Date(stats.activeSince).toLocaleTimeString()}
        </div>
      )}

      {/* Kill Switch */}
      {positionCount > 0 && (
        <Button
          variant="destructive"
          onClick={killAll}
          className="w-full text-[10px] font-display tracking-[0.15em] h-8"
        >
          <Skull className="w-3.5 h-3.5 mr-1" /> KILL ALL — CLOSE {positionCount} POSITIONS
        </Button>
      )}

      {/* Activity Log */}
      <div>
        <div className="text-[8px] font-display tracking-[0.2em] text-marble/30 mb-1.5 flex items-center gap-1">
          <Activity className="w-3 h-3" /> ACTIVITY LOG
        </div>
        <div className="space-y-1 max-h-[200px] overflow-y-auto watchlist-scroll">
          {activityLog.length === 0 && (
            <div className="text-[9px] text-marble/15 text-center py-3 font-display tracking-wider">
              {isOn ? 'Scanning...' : 'Enable bot to start'}
            </div>
          )}
          {activityLog.map(d => (
            <div key={d.id} className="bg-navy-light/15 rounded p-1.5 border border-gold/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {d.action === 'BUY' && <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />}
                  {d.action === 'SELL' && <TrendingDown className="w-2.5 h-2.5 text-red-400" />}
                  {d.action === 'EXIT' && <Zap className="w-2.5 h-2.5 text-amber-400" />}
                  {d.action === 'HOLD' && <Power className="w-2.5 h-2.5 text-marble/20" />}
                  <span className={`text-[9px] font-mono ${
                    d.action === 'BUY' ? 'text-emerald-400' :
                    d.action === 'SELL' ? 'text-red-400' :
                    d.action === 'EXIT' ? 'text-amber-400' :
                    'text-marble/30'
                  }`}>
                    {d.action} {d.symbol}
                  </span>
                </div>
                <span className="text-[7px] font-mono text-marble/15">
                  {new Date(d.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-[7px] text-marble/20 mt-0.5 font-mono">{d.reason}</div>
              {/* Signal breakdown mini-bar */}
              <div className="flex gap-0.5 mt-1">
                <SignalBar label="T" value={d.signal.trend} />
                <SignalBar label="M" value={d.signal.momentum} />
                <SignalBar label="V" value={d.signal.volatility} />
                <SignalBar label="$" value={d.signal.volume} />
                <SignalBar label="W" value={d.signal.wave} />
                <div className="ml-auto text-[7px] font-mono text-marble/30">
                  Σ <span className={d.signal.composite > 0 ? 'text-emerald-400' : d.signal.composite < 0 ? 'text-red-400' : 'text-marble/30'}>
                    {d.signal.composite > 0 ? '+' : ''}{d.signal.composite.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SignalBar({ label, value }: { label: string; value: number }) {
  const w = Math.abs(value) * 100;
  const color = value > 0.3 ? 'bg-emerald-500' : value < -0.3 ? 'bg-red-500' : 'bg-marble/20';
  return (
    <div className="flex items-center gap-0.5" title={`${label}: ${value.toFixed(2)}`}>
      <span className="text-[6px] text-marble/20 w-2">{label}</span>
      <div className="w-8 h-1 bg-navy-dark/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(w, 100)}%`, marginLeft: value < 0 ? `${100 - w}%` : undefined }}
        />
      </div>
    </div>
  );
}
