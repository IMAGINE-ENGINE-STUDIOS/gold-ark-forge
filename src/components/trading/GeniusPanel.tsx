import { useState } from 'react';
import { Brain, Play, Square, Trash2, Zap, Clock, TrendingUp, TrendingDown, Shield, Activity, ChevronDown, AlertTriangle, Target, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import type { GeniusTimeline, GeniusStatus, GeniusAnalysis, GeniusCycleLog } from '@/hooks/useGeniusTrader';
import LivePulse from '@/components/ga-widgets/LivePulse';

interface GeniusPanelProps {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  timeline: GeniusTimeline;
  setTimeline: (v: GeniusTimeline) => void;
  riskTolerance: number;
  setRiskTolerance: (v: number) => void;
  autoExecute: boolean;
  setAutoExecute: (v: boolean) => void;
  status: GeniusStatus;
  lastAnalysis: GeniusAnalysis | null;
  logs: GeniusCycleLog[];
  error: string | null;
  cycleCount: number;
  winCount: number;
  lossCount: number;
  totalPnl: number;
  runManual: () => void;
  clearLogs: () => void;
}

const STATUS_COLORS: Record<GeniusStatus, string> = {
  idle: 'text-marble/30',
  scanning: 'text-blue-400',
  analyzing: 'text-purple-400',
  executing: 'text-emerald-400',
  cooldown: 'text-gold',
  error: 'text-red-400',
};

const STATUS_LABELS: Record<GeniusStatus, string> = {
  idle: 'IDLE',
  scanning: 'SCANNING MARKETS...',
  analyzing: 'AI ANALYZING...',
  executing: 'EXECUTING TRADES...',
  cooldown: 'COOLDOWN',
  error: 'ERROR',
};

const TIMELINE_CONFIG = {
  short: { label: 'SHORT', desc: '1-15 min scalps', icon: Zap, color: 'text-amber-400' },
  mid: { label: 'MID', desc: '1-6 hour swings', icon: Clock, color: 'text-blue-400' },
  long: { label: 'LONG', desc: '1-7 day positions', icon: Target, color: 'text-emerald-400' },
} as const;

export default function GeniusPanel(props: GeniusPanelProps) {
  const {
    enabled, setEnabled, timeline, setTimeline, riskTolerance, setRiskTolerance,
    autoExecute, setAutoExecute, status, lastAnalysis, logs, error,
    cycleCount, winCount, lossCount, runManual, clearLogs,
  } = props;

  const [logsOpen, setLogsOpen] = useState(false);
  const winRate = winCount + lossCount > 0 ? ((winCount / (winCount + lossCount)) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <span className="font-display text-sm tracking-wider text-purple-300">GENIUS</span>
          <span className="text-[7px] font-display tracking-[0.2em] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400/80 border border-purple-500/20">AI STRATEGIST</span>
          {enabled && <LivePulse label="LIVE" />}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearLogs}
            className="p-1 text-marble/20 hover:text-red-400 transition-colors"
            title="Clear history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <Button
            size="sm"
            onClick={() => setEnabled(!enabled)}
            className={`font-display text-[9px] tracking-wider h-7 px-3 ${
              enabled
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30'
            }`}
          >
            {enabled ? <><Square className="w-3 h-3 mr-1" /> STOP</> : <><Play className="w-3 h-3 mr-1" /> START</>}
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between bg-navy-light/30 rounded-lg p-2 border border-purple-500/10">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === 'idle' ? 'bg-marble/20' : status === 'error' ? 'bg-red-500' : 'bg-purple-500 animate-pulse'}`} />
          <span className={`text-[9px] font-display tracking-wider ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
        </div>
        <span className="text-[8px] font-mono text-marble/20">CYCLE #{cycleCount}</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span className="text-[9px] font-mono text-red-400">{error}</span>
        </div>
      )}

      {/* Timeline Selector */}
      <div>
        <div className="text-[8px] font-display tracking-wider text-marble/30 mb-1.5">INVESTMENT TIMELINE</div>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.entries(TIMELINE_CONFIG) as [GeniusTimeline, typeof TIMELINE_CONFIG.short][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setTimeline(key)}
              className={`p-2 rounded-lg border text-center transition-all ${
                timeline === key
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                  : 'bg-navy-light/20 border-gold/5 text-marble/30 hover:text-marble/60'
              }`}
            >
              <cfg.icon className={`w-4 h-4 mx-auto mb-1 ${timeline === key ? cfg.color : 'text-marble/20'}`} />
              <div className="text-[9px] font-display tracking-wider">{cfg.label}</div>
              <div className="text-[7px] font-mono text-marble/20 mt-0.5">{cfg.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Risk & Auto-Execute */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-navy-light/20 rounded-lg p-2 border border-gold/5">
          <div className="text-[7px] font-display tracking-wider text-marble/25 mb-1">RISK TOLERANCE</div>
          <input
            type="range"
            min={1}
            max={10}
            value={riskTolerance}
            onChange={(e) => setRiskTolerance(parseInt(e.target.value))}
            className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div className="flex justify-between text-[7px] font-mono text-marble/20 mt-0.5">
            <span>SAFE</span>
            <span className={`font-bold ${riskTolerance <= 3 ? 'text-emerald-400' : riskTolerance <= 6 ? 'text-gold' : 'text-red-400'}`}>{riskTolerance}/10</span>
            <span>BOLD</span>
          </div>
        </div>
        <div className="bg-navy-light/20 rounded-lg p-2 border border-gold/5 flex flex-col justify-between">
          <div className="text-[7px] font-display tracking-wider text-marble/25">AUTO-EXECUTE</div>
          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <div className="relative">
              <input type="checkbox" checked={autoExecute} onChange={(e) => setAutoExecute(e.target.checked)} className="sr-only" />
              <div className={`w-8 h-4 rounded-full transition-colors ${autoExecute ? 'bg-purple-500' : 'bg-navy-light'}`} />
              <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoExecute ? 'translate-x-4' : ''}`} />
            </div>
            <span className={`text-[8px] font-display tracking-wider ${autoExecute ? 'text-purple-400' : 'text-marble/30'}`}>
              {autoExecute ? 'ON' : 'OFF'}
            </span>
          </label>
          {!autoExecute && (
            <Button
              size="sm"
              onClick={runManual}
              disabled={status === 'analyzing' || status === 'executing' || status === 'scanning'}
              className="w-full h-6 text-[8px] font-display tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 mt-1"
            >
              <Brain className="w-3 h-3 mr-1" /> ANALYZE NOW
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: 'CYCLES', value: cycleCount.toString(), color: 'text-marble/50' },
          { label: 'EXECUTED', value: (winCount + lossCount).toString(), color: 'text-marble/50' },
          { label: 'SUCCESS', value: `${winRate.toFixed(0)}%`, color: winRate >= 60 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'REGIME', value: lastAnalysis?.marketRegime?.toUpperCase() || '—', color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-navy-light/20 rounded-lg p-1.5 text-center border border-gold/5">
            <div className="text-[6px] font-display tracking-wider text-marble/20">{s.label}</div>
            <div className={`text-[10px] font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Latest Analysis */}
      {lastAnalysis && (
        <div className="bg-navy-light/30 rounded-lg p-3 border border-purple-500/15 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[9px] font-display tracking-wider text-purple-300">LATEST STRATEGY</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-[8px] font-mono ${lastAnalysis.confidence >= 70 ? 'text-emerald-400' : lastAnalysis.confidence >= 50 ? 'text-gold' : 'text-red-400'}`}>
                {lastAnalysis.confidence}% CONF.
              </span>
            </div>
          </div>
          <p className="text-[9px] font-mono text-marble/50 leading-relaxed">{lastAnalysis.strategy}</p>

          {/* Trade Recommendations */}
          {lastAnalysis.trades?.map((trade, i) => (
            <div key={i} className={`rounded-lg p-2 border ${trade.action === 'BUY' ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {trade.action === 'BUY'
                    ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                    : <TrendingDown className="w-3 h-3 text-red-400" />}
                  <span className={`text-[10px] font-mono font-bold ${trade.action === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trade.action} {trade.ticker}
                  </span>
                </div>
                <span className="text-[8px] font-mono text-marble/30">{trade.confidence}% conf.</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[7px] font-mono text-marble/30">
                <div>QTY: <span className="text-marble/50">{trade.qty}</span></div>
                <div>ENTRY: <span className="text-marble/50">${trade.entryPrice < 10 ? trade.entryPrice.toFixed(4) : trade.entryPrice.toFixed(2)}</span></div>
                <div>TP: <span className="text-emerald-400/60">${trade.targetPrice < 10 ? trade.targetPrice.toFixed(4) : trade.targetPrice.toFixed(2)}</span></div>
                <div>SL: <span className="text-red-400/60">${trade.stopLoss < 10 ? trade.stopLoss.toFixed(4) : trade.stopLoss.toFixed(2)}</span></div>
              </div>
              <p className="text-[8px] text-marble/25 mt-1">{trade.reason}</p>
              <div className="text-[7px] text-marble/15 mt-0.5">Hold: {trade.holdMinutes}min</div>
            </div>
          ))}

          {/* Risk Assessment */}
          <div className="flex items-start gap-1.5 p-2 rounded bg-amber-500/5 border border-amber-500/10">
            <Shield className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="text-[8px] font-mono text-amber-400/70">{lastAnalysis.riskAssessment}</span>
          </div>
        </div>
      )}

      {/* Cycle Logs */}
      <Collapsible open={logsOpen} onOpenChange={setLogsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 bg-navy-light/20 rounded border border-gold/5 hover:bg-navy-light/30 transition-colors">
            <BarChart3 className="w-3 h-3 text-marble/25" />
            <span className="text-[8px] font-display tracking-wider text-marble/30 flex-1 text-left">CYCLE HISTORY ({logs.length})</span>
            <ChevronDown className={`w-3 h-3 text-marble/20 transition-transform ${logsOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-1 space-y-1 max-h-48 overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className="flex items-center justify-between p-1.5 bg-navy-dark/30 rounded border border-gold/5 text-[8px] font-mono">
                <span className="text-marble/25">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className="text-purple-400/60">{log.timeline.toUpperCase()}</span>
                <span className="text-marble/30">{log.analysis.trades?.length || 0} trades</span>
                <span className={`${log.executedTrades.filter(t => t.success).length > 0 ? 'text-emerald-400' : 'text-marble/20'}`}>
                  {log.executedTrades.filter(t => t.success).length}/{log.executedTrades.length} exec
                </span>
                <span className="text-marble/15">{log.analysis.confidence}%</span>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="p-4 text-center text-marble/15 text-[9px] font-display">No cycles recorded yet</div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
