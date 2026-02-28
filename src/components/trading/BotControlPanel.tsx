import { Bot, Power, Skull, Zap, TrendingUp, TrendingDown, Clock, Check, X, AlertTriangle, DollarSign, Play, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import type { BotConfig, BotDecision, BotStats, StrategyPreset, BotMode } from '@/hooks/useTradingBot';
import { STRATEGY_CONFIGS } from '@/hooks/useTradingBot';
import PositionMiniCard from '@/components/trading/PositionMiniCard';
import type { WatchlistSymbol } from '@/data/tradingSymbols';

interface PaperPosition {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  botSource?: boolean;
}

interface Props {
  config: BotConfig;
  updateConfig: (patch: Partial<BotConfig>) => void;
  activityLog: BotDecision[];
  pendingProposals: BotDecision[];
  stats: BotStats;
  killAll: () => void;
  approveProposal: (id: string) => void;
  rejectProposal: (id: string) => void;
  positionCount: number;
  equity: number;
  botPositions: PaperPosition[];
  resolvePrice: (ticker: string) => number;
  onClosePosition: (posId: string, price: number) => void;
  onNavigate: (sym: WatchlistSymbol) => void;
}

const STRATEGY_LABELS: Record<StrategyPreset, { label: string; emoji: string }> = {
  conservative: { label: 'Safe', emoji: '🛡️' },
  balanced: { label: 'Balanced', emoji: '⚖️' },
  aggressive: { label: 'Aggressive', emoji: '🔥' },
  wave_first: { label: 'WAVE', emoji: '🌊' },
  micro: { label: 'Micro', emoji: '⚡' },
};

export default function BotControlPanel({ config, updateConfig, activityLog, pendingProposals, stats, killAll, approveProposal, rejectProposal, positionCount, equity, botPositions, resolvePrice, onClosePosition, onNavigate }: Props) {
  const isOn = config.enabled;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const budgetUsed = botPositions.reduce((s, p) => s + p.currentPrice * p.qty, 0);
  const budgetAvailable = Math.max(0, config.botBudget - budgetUsed);

  const totalPnl = stats.botPnl;
  const pnlColor = totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="space-y-3">
      {/* ══════ MAIN CARD: Start/Stop + P&L ══════ */}
      <div className="rounded-xl p-4 border border-gold/10 bg-gradient-to-br from-navy-light/60 to-navy-dark/40">
        {!isOn ? (
          <div className="space-y-4">
            {/* Budget quick-select */}
            <div>
              <div className="text-[10px] font-display tracking-[0.15em] text-marble/40 mb-2">INVESTMENT BUDGET</div>
              <div className="text-2xl font-mono font-bold text-gold mb-2">${config.botBudget.toLocaleString()}</div>
              <Slider
                value={[config.botBudget]}
                onValueChange={([v]) => updateConfig({ botBudget: v })}
                min={1000} max={100000} step={1000}
                className="w-full mb-2"
              />
              <div className="flex gap-1.5">
                {[5000, 10000, 25000, 50000].map(v => (
                  <button
                    key={v}
                    onClick={() => updateConfig({ botBudget: v })}
                    className={`flex-1 text-[10px] font-mono py-1.5 rounded transition-all ${
                      config.botBudget === v ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-navy-dark/50 text-marble/30 border border-gold/5 hover:border-gold/15'
                    }`}
                  >
                    ${(v / 1000).toFixed(0)}K
                  </button>
                ))}
              </div>
            </div>

            {/* Strategy pills */}
            <div>
              <div className="text-[10px] font-display tracking-[0.15em] text-marble/40 mb-2">STRATEGY</div>
              <div className="flex gap-1.5 flex-wrap">
                {(Object.entries(STRATEGY_LABELS) as [StrategyPreset, { label: string; emoji: string }][]).map(([key, { label, emoji }]) => (
                  <button
                    key={key}
                    onClick={() => updateConfig({ strategy: key })}
                    className={`text-[10px] font-mono px-3 py-1.5 rounded-full transition-all ${
                      config.strategy === key ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-navy-dark/50 text-marble/30 border border-gold/5 hover:border-gold/15'
                    }`}
                  >
                    {emoji} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* BIG START BUTTON */}
            <Button
              onClick={() => updateConfig({ enabled: true })}
              className="w-full h-14 text-base font-display tracking-[0.2em] bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-5 h-5 mr-2" /> START TRADING
            </Button>
            <div className="text-[9px] text-marble/25 text-center font-mono">
              Auto-trades with ${config.botBudget.toLocaleString()} • {STRATEGY_LABELS[config.strategy].emoji} {STRATEGY_LABELS[config.strategy].label} • 10% loss limit
            </div>
          </div>
        ) : (
          /* ══════ LIVE DASHBOARD ══════ */
          <div className="space-y-3">
            {/* Status + Stop */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/40" />
                <span className="text-xs font-display tracking-[0.12em] text-emerald-400">TRADING</span>
                <span className="text-[9px] font-mono text-marble/25">{STRATEGY_LABELS[config.strategy].emoji} {STRATEGY_LABELS[config.strategy].label}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateConfig({ enabled: false })}
                className="h-7 text-[10px] font-display tracking-wider border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Power className="w-3 h-3 mr-1" /> STOP
              </Button>
            </div>

            {/* P&L + Budget — the only numbers that matter */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-navy-dark/50 rounded-lg p-3 border border-gold/5">
                <div className="text-[9px] text-marble/30 font-display tracking-wider mb-0.5">TOTAL P&L</div>
                <div className={`text-xl font-mono font-bold ${pnlColor}`}>
                  {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                </div>
                <div className="text-[9px] font-mono text-marble/20 mt-0.5">
                  {stats.winCount}W / {stats.lossCount}L
                  {stats.winCount + stats.lossCount > 0 && ` • ${Math.round((stats.winCount / (stats.winCount + stats.lossCount)) * 100)}%`}
                </div>
              </div>
              <div className="bg-navy-dark/50 rounded-lg p-3 border border-gold/5">
                <div className="text-[9px] text-marble/30 font-display tracking-wider mb-0.5">BUDGET</div>
                <div className="text-xl font-mono font-bold text-gold">${config.botBudget.toLocaleString()}</div>
                <div className="text-[9px] font-mono text-marble/20 mt-0.5">
                  ${budgetUsed.toFixed(0)} invested • ${budgetAvailable.toFixed(0)} free
                </div>
              </div>
            </div>

            {/* Loss protection bar — compact */}
            <div className={`rounded-lg px-3 py-2 border ${stats.budgetHalted ? 'bg-red-500/10 border-red-500/30' : 'bg-navy-dark/30 border-gold/5'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-display tracking-wider text-marble/30">
                  <Shield className="w-3 h-3 inline mr-1" />
                  {stats.budgetHalted ? '🚨 10% LIMIT HIT — BOT STOPPED' : 'Loss protection'}
                </span>
                <span className={`text-[9px] font-mono ${stats.budgetDrawdownPct > 5 ? 'text-red-400' : 'text-marble/25'}`}>
                  {stats.budgetDrawdownPct.toFixed(1)}% / 10%
                </span>
              </div>
              <div className="h-1.5 bg-navy-dark/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    stats.budgetDrawdownPct > 8 ? 'bg-red-500 animate-pulse' : stats.budgetDrawdownPct > 5 ? 'bg-amber-500' : 'bg-emerald-500/50'
                  }`}
                  style={{ width: `${Math.min(stats.budgetDrawdownPct * 10, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════ REAL-TIME PROGRESS TRACKER ══════ */}
      <div className="rounded-xl p-3 border border-gold/10 bg-navy-dark/30">
        <div className="text-[10px] font-display tracking-[0.15em] text-marble/40 mb-2">📡 PROGRESS TRACKER</div>
        <div className="grid grid-cols-4 gap-2">
          <MiniStat label="Scanned" value={stats.tradableSymbols} />
          <MiniStat label="Signals" value={stats.totalDecisions} />
          <MiniStat label="Executed" value={stats.totalExecutions} />
          <MiniStat label="Open" value={botPositions.length} />
        </div>
        <div className="mt-2 text-[9px] font-mono text-marble/25">
          {activityLog[0]
            ? `Last: ${activityLog[0].action} ${activityLog[0].symbol} at ${new Date(activityLog[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'No decisions yet — bot will post entries/exits here in realtime.'}
        </div>
      </div>

      {/* ══════ PENDING APPROVALS (ASK mode only) ══════ */}
      {pendingProposals.length > 0 && (
        <div className="rounded-xl p-3 border border-amber-500/20 bg-amber-500/5">
          <div className="text-[10px] font-display tracking-[0.12em] text-amber-400/70 mb-2">
            ⏳ AWAITING APPROVAL ({pendingProposals.length})
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto watchlist-scroll">
            {pendingProposals.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-navy-dark/40 rounded-lg p-2 border border-gold/5">
                <div>
                  <span className={`text-xs font-mono font-bold ${p.action === 'BUY' ? 'text-emerald-400' : p.action === 'EXIT' ? 'text-amber-400' : 'text-red-400'}`}>
                    {p.action} {p.symbol}
                  </span>
                  <span className="text-[9px] text-marble/25 ml-2">{p.qty} @ ${p.price?.toFixed(2)}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => approveProposal(p.id)} className="text-[9px] px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={() => rejectProposal(p.id)} className="text-[9px] px-2 py-1 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════ LIVE POSITIONS ══════ */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-display tracking-[0.15em] text-marble/40">
            📊 LIVE POSITIONS ({botPositions.length})
          </span>
          {botPositions.length > 0 && (
            <button
              onClick={killAll}
              className="text-[9px] font-display tracking-wider text-red-400/60 hover:text-red-400 transition-colors"
            >
              <Skull className="w-3 h-3 inline mr-1" />CLOSE ALL
            </button>
          )}
        </div>

        {botPositions.length === 0 ? (
          <div className="rounded-lg p-3 border border-gold/5 bg-navy-dark/30 text-[10px] text-marble/35 font-mono">
            No bot positions yet. When the bot opens trades, they appear here in realtime with live P&L and close controls.
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto watchlist-scroll">
            {botPositions.map(pos => (
              <PositionMiniCard
                key={pos.id}
                symbol={pos.symbol}
                side={pos.side}
                qty={pos.qty}
                entryPrice={pos.entryPrice}
                currentPrice={pos.currentPrice}
                pnl={pos.pnl ?? 0}
                pnlPercent={pos.pnlPercent ?? 0}
                posId={pos.id}
                resolvedPrice={resolvePrice(pos.symbol)}
                onClose={onClosePosition}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>

      {/* ══════ RECENT TRADES — collapsed by default ══════ */}
      {activityLog.length > 0 && (
        <div>
          <button
            onClick={() => setShowLog(!showLog)}
            className="flex items-center gap-1.5 text-[10px] font-display tracking-[0.15em] text-marble/30 hover:text-marble/50 transition-colors w-full"
          >
            {showLog ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            RECENT TRADES ({activityLog.filter(d => d.executed).length})
          </button>
          {showLog && (
            <div className="space-y-1 mt-2 max-h-[250px] overflow-y-auto watchlist-scroll">
              {activityLog.filter(d => d.executed).slice(0, 20).map(d => (
                <div key={d.id} className="flex items-center justify-between bg-navy-dark/30 rounded px-2.5 py-1.5 border border-gold/5">
                  <div className="flex items-center gap-2">
                    {d.action === 'BUY' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                    {d.action === 'SELL' && <TrendingDown className="w-3 h-3 text-red-400" />}
                    {d.action === 'EXIT' && <Zap className="w-3 h-3 text-amber-400" />}
                    <span className={`text-[10px] font-mono font-bold ${
                      d.action === 'BUY' ? 'text-emerald-400' : d.action === 'EXIT' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {d.action} {d.symbol}
                    </span>
                    {d.qty && d.price && (
                      <span className="text-[9px] text-marble/20 font-mono">
                        {d.qty} @ ${d.price < 10 ? d.price.toFixed(4) : d.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <span className="text-[8px] font-mono text-marble/15">
                    {new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════ ADVANCED SETTINGS — collapsed ══════ */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1.5 text-[10px] font-display tracking-[0.15em] text-marble/25 hover:text-marble/40 transition-colors w-full"
      >
        {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        ADVANCED SETTINGS
      </button>
      {showAdvanced && (
        <div className="space-y-3 bg-navy-dark/30 rounded-xl p-3 border border-gold/5">
          {/* Mode toggle */}
          <div>
            <div className="text-[9px] font-display tracking-wider text-marble/30 mb-1.5">EXECUTION MODE</div>
            <div className="flex gap-2">
              {(['auto', 'ask'] as BotMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => updateConfig({ mode })}
                  className={`flex-1 text-[10px] font-mono py-2 rounded transition-all ${
                    config.mode === mode ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-navy-dark/50 text-marble/25 border border-gold/5'
                  }`}
                >
                  {mode === 'auto' ? '⚡ Auto' : '✋ Manual'}
                </button>
              ))}
            </div>
            <div className="text-[8px] text-marble/20 mt-1">
              {config.mode === 'auto' ? 'Bot trades automatically — no approval needed' : 'Bot proposes trades — you approve each one'}
            </div>
          </div>

          {/* Risk sliders */}
          <SliderRow label="Scan interval" value={config.scanIntervalSec} unit="s" min={5} max={60} step={5} onChange={(v) => updateConfig({ scanIntervalSec: v })} />
          <SliderRow label="Max positions" value={config.maxPositions} min={1} max={15} step={1} onChange={(v) => updateConfig({ maxPositions: v })} />
          <SliderRow label="Risk per trade" value={config.riskPerTradePct} unit="%" min={0.5} max={10} step={0.5} onChange={(v) => updateConfig({ riskPerTradePct: v })} />
          <SliderRow label="Stop loss" value={config.stopLossAtrMult} unit="×ATR" min={0.5} max={3} step={0.25} onChange={(v) => updateConfig({ stopLossAtrMult: v })} />
          <SliderRow label="Take profit" value={config.takeProfitAtrMult} unit="×ATR" min={0.5} max={5} step={0.25} onChange={(v) => updateConfig({ takeProfitAtrMult: v })} />

          {/* Performance stats */}
          <div className="grid grid-cols-4 gap-1 pt-2 border-t border-gold/5">
            <MiniStat label="Trades" value={stats.totalExecutions} />
            <MiniStat label="P.Factor" value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(1)} />
            <MiniStat label="Sharpe" value={stats.sharpeEstimate.toFixed(1)} />
            <MiniStat label="Fees" value={`$${stats.totalFees.toFixed(0)}`} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tiny Sub-Components ─────────────────────────────────

function SliderRow({ label, value, unit, min, max, step, onChange }: {
  label: string; value: number; unit?: string; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[9px] text-marble/30">{label}</span>
        <span className="text-[10px] font-mono text-gold/60">{value}{unit || ''}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} className="w-full" />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-[7px] text-marble/20 font-display tracking-wider">{label}</div>
      <div className="text-[10px] font-mono text-marble/50">{value}</div>
    </div>
  );
}
