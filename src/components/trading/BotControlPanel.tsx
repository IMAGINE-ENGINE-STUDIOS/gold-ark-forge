import { Bot, Power, Skull, Zap, Activity, TrendingUp, TrendingDown, Clock, Check, X, AlertTriangle, DollarSign, BarChart3, Crosshair, Wallet, Play, Shield, Target } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Switch } from '@/components/ui/switch';
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

const STRATEGY_LABELS: Record<StrategyPreset, { label: string; color: string; icon: string }> = {
  conservative: { label: 'CONSERVATIVE', color: 'text-blue-400', icon: '🛡️' },
  balanced: { label: 'BALANCED', color: 'text-gold', icon: '⚖️' },
  aggressive: { label: 'AGGRESSIVE', color: 'text-red-400', icon: '🔥' },
  wave_first: { label: 'WAVE-FIRST', color: 'text-purple-400', icon: '🌊' },
  micro: { label: 'MICRO', color: 'text-cyan-400', icon: '⚡' },
};

export default function BotControlPanel({ config, updateConfig, activityLog, pendingProposals, stats, killAll, approveProposal, rejectProposal, positionCount, equity, botPositions, resolvePrice, onClosePosition, onNavigate }: Props) {
  const isOn = config.enabled;
  const botPosCount = botPositions.length;

  // Budget usage
  const budgetUsed = botPositions.reduce((s, p) => s + p.currentPrice * p.qty, 0);
  const budgetAvailable = Math.max(0, config.botBudget - budgetUsed);
  const budgetUsedPct = config.botBudget > 0 ? (budgetUsed / config.botBudget) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* ─── START TRADING / Status Header ─── */}
      <div className="bg-navy-light/40 rounded-xl p-4 border border-gold/10">
        {!isOn ? (
          /* Big START TRADING button when bot is off */
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <span className="text-sm font-display tracking-[0.1em] text-marble/40">BOT OFFLINE</span>
            </div>
            <Button
              onClick={() => updateConfig({ enabled: true })}
              className="w-full h-14 text-base font-display tracking-[0.15em] bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Play className="w-5 h-5 mr-2" /> START TRADING
            </Button>
            <div className="text-[10px] text-marble/30 text-center font-mono">
              Paper trading • Budget: ${config.botBudget.toLocaleString()} • {config.strategy.toUpperCase()} strategy
            </div>
          </div>
        ) : (
          /* Active status when bot is on */
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/30" />
                <span className="text-sm font-display tracking-[0.1em] text-emerald-400">BOT ACTIVE</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateConfig({ enabled: false })}
                  className="h-7 text-[10px] font-display tracking-wider border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Power className="w-3 h-3 mr-1" /> STOP
                </Button>
                <Switch checked={isOn} onCheckedChange={(v) => updateConfig({ enabled: v })} />
              </div>
            </div>

            {/* Real-feed notice */}
            <div className="text-[9px] font-mono text-cyan-400/60 bg-cyan-500/5 rounded px-2 py-1 mb-3 border border-cyan-500/10">
              📡 Scanning {stats.tradableSymbols} real-feed symbols (Crypto + Metals + Energy) — No synthetic data
            </div>
          </>
        )}

        {/* Bot P&L Summary — always visible */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-navy-dark/50 rounded-lg p-3 border border-gold/5">
            <div className="text-[10px] text-marble/40 font-display tracking-wider mb-1">BOT P&L</div>
            <div className={`text-lg font-mono font-bold ${stats.botPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.botPnl >= 0 ? '+' : ''}${stats.botPnl.toFixed(2)}
            </div>
          </div>
          <div className="bg-navy-dark/50 rounded-lg p-3 border border-gold/5">
            <div className="text-[10px] text-marble/40 font-display tracking-wider mb-1">REALIZED</div>
            <div className={`text-lg font-mono font-bold ${stats.realizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.realizedPnl >= 0 ? '+' : ''}${stats.realizedPnl.toFixed(2)}
            </div>
          </div>
          <div className="bg-navy-dark/50 rounded-lg p-3 border border-gold/5">
            <div className="text-[10px] text-marble/40 font-display tracking-wider mb-1">TOTAL FEES</div>
            <div className="text-lg font-mono font-bold text-amber-400/80">
              -${stats.totalFees.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-1.5 mt-3">
          <StatBox label="TRADES" value={stats.totalExecutions} />
          <StatBox label="WINS" value={stats.winCount} color="text-emerald-400" />
          <StatBox label="LOSSES" value={stats.lossCount} color="text-red-400" />
          <StatBox label="WIN %" value={stats.winCount + stats.lossCount > 0 ? Math.round((stats.winCount / (stats.winCount + stats.lossCount)) * 100) : 0} suffix="%" />
          <StatBox label="OPEN" value={botPosCount} />
        </div>

        {/* ─── BUDGET LOSS PROTECTION GAUGE ─── */}
        <div className={`mt-3 rounded-lg p-3 border ${stats.budgetHalted ? 'bg-red-500/10 border-red-500/30' : stats.budgetDrawdownPct > 5 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-navy-dark/40 border-gold/5'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Shield className={`w-3.5 h-3.5 ${stats.budgetHalted ? 'text-red-400' : stats.budgetDrawdownPct > 5 ? 'text-amber-400' : 'text-emerald-400/60'}`} />
              <span className="text-[10px] font-display tracking-[0.12em] text-marble/40">
                {stats.budgetHalted ? '🚨 10% LOSS LIMIT REACHED' : 'LOSS PROTECTION (10% MAX)'}
              </span>
            </div>
            <span className={`text-[10px] font-mono ${stats.budgetDrawdownPct > 5 ? 'text-red-400' : 'text-marble/30'}`}>
              -${stats.budgetLossUsed.toFixed(0)} / -${stats.budgetMaxLoss.toFixed(0)}
            </span>
          </div>
          <div className="h-2 bg-navy-dark/60 rounded-full overflow-hidden mb-1">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.budgetDrawdownPct > 8 ? 'bg-red-500 animate-pulse' : stats.budgetDrawdownPct > 5 ? 'bg-amber-500' : 'bg-emerald-500/60'
              }`}
              style={{ width: `${Math.min(stats.budgetDrawdownPct * 10, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[8px] font-mono text-marble/20">
            <span>0%</span>
            <span className="text-amber-400/30">5%</span>
            <span className="text-red-400/40">10% HALT</span>
          </div>
          {stats.budgetHalted && (
            <div className="mt-2 text-[9px] text-red-400/70 font-mono text-center">
              Bot auto-halted. Increase budget or manually restart to resume.
            </div>
          )}
        </div>

        {/* ─── ADVANCED PERFORMANCE METRICS ─── */}
        <div className="grid grid-cols-4 gap-1.5 mt-3">
          <StatBox label="P.FACTOR" value={parseFloat(stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(1))} color={stats.profitFactor >= 1.5 ? 'text-emerald-400' : stats.profitFactor >= 1 ? 'text-gold' : 'text-red-400'} />
          <StatBox label="SHARPE" value={parseFloat(stats.sharpeEstimate.toFixed(2))} color={stats.sharpeEstimate >= 1 ? 'text-emerald-400' : stats.sharpeEstimate >= 0 ? 'text-gold' : 'text-red-400'} />
          <StatBox label="AVG WIN" value={parseFloat(stats.avgWin.toFixed(0))} color="text-emerald-400" prefix="$" />
          <StatBox label="AVG LOSS" value={parseFloat(stats.avgLoss.toFixed(0))} color="text-red-400" prefix="$" />
        </div>

        {/* Streak indicator */}
        {(stats.consecutiveWins > 1 || stats.consecutiveLosses > 1) && (
          <div className={`mt-2 text-center text-[9px] font-mono rounded py-1 ${
            stats.consecutiveWins > 1 ? 'bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/15' : 'bg-red-500/10 text-red-400/70 border border-red-500/15'
          }`}>
            {stats.consecutiveWins > 1
              ? `🔥 ${stats.consecutiveWins} consecutive wins`
              : `⚠️ ${stats.consecutiveLosses} consecutive losses — position sizing reduced`}
          </div>
        )}

        {stats.activeSince && (
          <div className="text-[10px] text-marble/30 font-mono text-center mt-2 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            Active since {new Date(stats.activeSince).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* ─── Investment Budget ─── */}
      <div className="bg-navy-light/40 rounded-xl p-4 border border-gold/10">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-4 h-4 text-gold/60" />
          <span className="text-[10px] font-display tracking-[0.15em] text-marble/40">INVESTMENT BUDGET</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-mono font-bold text-gold">${config.botBudget.toLocaleString()}</span>
          <span className="text-[10px] font-mono text-marble/30">of ${equity.toLocaleString()} equity</span>
        </div>
        <Slider
          value={[config.botBudget]}
          onValueChange={([v]) => updateConfig({ botBudget: v })}
          min={1000} max={100000} step={1000}
          className="w-full mb-3"
        />
        <div className="flex gap-2 mb-3">
          {[5000, 10000, 25000, 50000].map(v => (
            <button
              key={v}
              onClick={() => updateConfig({ botBudget: v })}
              className={`flex-1 text-[9px] font-mono py-1 rounded border transition-all ${
                config.botBudget === v ? 'bg-gold/15 border-gold/30 text-gold' : 'bg-navy-dark/40 border-gold/5 text-marble/30 hover:border-gold/15'
              }`}
            >
              ${(v / 1000).toFixed(0)}K
            </button>
          ))}
        </div>
        {/* Budget usage bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] font-mono">
            <span className="text-marble/30">Used: ${budgetUsed.toFixed(0)}</span>
            <span className="text-emerald-400/60">Available: ${budgetAvailable.toFixed(0)}</span>
          </div>
          <div className="h-1.5 bg-navy-dark/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${budgetUsedPct > 80 ? 'bg-red-500' : budgetUsedPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(budgetUsedPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── Live Bot Positions ─── */}
      {botPositions.length > 0 && (
        <div>
          <div className="text-[10px] font-display tracking-[0.15em] text-marble/40 mb-2 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> BOT POSITIONS ({botPosCount})
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto watchlist-scroll">
            {botPositions.map(pos => (
              <PositionMiniCard
                key={pos.id}
                symbol={pos.symbol}
                side={pos.side}
                qty={pos.qty}
                entryPrice={pos.entryPrice}
                currentPrice={pos.currentPrice}
                pnl={pos.pnl}
                pnlPercent={pos.pnlPercent}
                posId={pos.id}
                resolvedPrice={resolvePrice(pos.symbol)}
                onClose={onClosePosition}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── Mode Selector ─── */}
      <div>
        <div className="text-[10px] font-display tracking-[0.15em] text-marble/40 mb-2">EXECUTION MODE</div>
        <div className="grid grid-cols-2 gap-2">
          <ModeCard mode="auto" currentMode={config.mode} label="AUTO" desc="Bot executes trades automatically without confirmation" icon={<Zap className="w-4 h-4" />} onSelect={() => updateConfig({ mode: 'auto' })} />
          <ModeCard mode="ask" currentMode={config.mode} label="ASK" desc="Bot proposes trades — you approve or reject each one" icon={<AlertTriangle className="w-4 h-4" />} onSelect={() => updateConfig({ mode: 'ask' })} />
        </div>
      </div>

      {/* ─── Pending Proposals (ASK mode) ─── */}
      {pendingProposals.length > 0 && (
        <div>
          <div className="text-[10px] font-display tracking-[0.15em] text-amber-400/70 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            PENDING APPROVALS ({pendingProposals.length})
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto watchlist-scroll">
            {pendingProposals.map(p => (
              <ProposalCard key={p.id} proposal={p} onApprove={approveProposal} onReject={rejectProposal} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Strategy Selector ─── */}
      <div>
        <div className="text-[10px] font-display tracking-[0.15em] text-marble/40 mb-2">STRATEGY</div>
        <div className="space-y-2">
          {(Object.entries(STRATEGY_LABELS) as [StrategyPreset, typeof STRATEGY_LABELS[StrategyPreset]][]).map(([key, { label, color, icon }]) => {
            const cfg = STRATEGY_CONFIGS[key];
            return (
              <button
                key={key}
                onClick={() => updateConfig({ strategy: key })}
                className={`w-full p-3 rounded-lg text-left border transition-all ${
                  config.strategy === key
                    ? 'bg-gold/10 border-gold/30'
                    : 'bg-navy-light/20 border-gold/5 hover:border-gold/15'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{icon}</span>
                  <span className={`text-xs font-display tracking-wider ${config.strategy === key ? color : 'text-marble/40'}`}>{label}</span>
                  {key === 'micro' && <span className="text-[7px] font-mono px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-400/60 border border-cyan-500/15">RECOMMENDED</span>}
                </div>
                <div className="text-[10px] text-marble/30 leading-relaxed">{cfg.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Risk Parameters ─── */}
      <div className="space-y-3">
        <div className="text-[10px] font-display tracking-[0.15em] text-marble/40">RISK PARAMETERS</div>
        <SliderRow label="SCAN INTERVAL" value={config.scanIntervalSec} unit="s" min={5} max={60} step={5} onChange={(v) => updateConfig({ scanIntervalSec: v })} />
        <SliderRow label="MAX POSITIONS" value={config.maxPositions} min={1} max={15} step={1} onChange={(v) => updateConfig({ maxPositions: v })} />
        <SliderRow label="RISK PER TRADE" value={config.riskPerTradePct} unit="%" min={0.5} max={10} step={0.5} onChange={(v) => updateConfig({ riskPerTradePct: v })} />
        <SliderRow label="STOP LOSS (ATR×)" value={config.stopLossAtrMult} unit="×" min={0.5} max={3} step={0.25} onChange={(v) => updateConfig({ stopLossAtrMult: v })} />
        <SliderRow label="TAKE PROFIT (ATR×)" value={config.takeProfitAtrMult} unit="×" min={0.5} max={5} step={0.25} onChange={(v) => updateConfig({ takeProfitAtrMult: v })} />
      </div>

      {/* ─── Signal Gauges ─── */}
      {activityLog.length > 0 && activityLog[0].signal && (
        <div>
          <div className="text-[10px] font-display tracking-[0.15em] text-marble/40 mb-2">LAST SIGNAL BREAKDOWN</div>
          <div className="space-y-2">
            <SignalGauge label="Trend" value={activityLog[0].signal.trend} desc="SMA/EMA cross, Ichimoku, SAR" />
            <SignalGauge label="Momentum" value={activityLog[0].signal.momentum} desc="RSI, MACD, Stoch RSI, CCI" />
            <SignalGauge label="Volatility" value={activityLog[0].signal.volatility} desc="Bollinger, ATR, Keltner" />
            <SignalGauge label="Volume" value={activityLog[0].signal.volume} desc="OBV, MFI, CMF, A/D Line" />
            <SignalGauge label="WAVE" value={activityLog[0].signal.wave} desc="Forecast bias & confidence" />
            <div className="border-t border-gold/10 pt-2">
              <SignalGauge label="COMPOSITE" value={activityLog[0].signal.composite} desc="Weighted aggregate" isComposite />
            </div>
          </div>
        </div>
      )}

      {/* ─── Kill Switch ─── */}
      {botPosCount > 0 && (
        <Button variant="destructive" onClick={killAll} className="w-full text-xs font-display tracking-[0.1em] h-10">
          <Skull className="w-4 h-4 mr-2" /> KILL ALL — CLOSE {botPosCount} BOT POSITIONS
        </Button>
      )}

      {/* ─── Fee Disclosure ─── */}
      <div className="bg-navy-dark/30 rounded-lg p-3 border border-gold/5">
        <div className="text-[9px] font-display tracking-wider text-marble/30 mb-1.5">FEE SIMULATION (per trade)</div>
        <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
          <div className="text-center"><div className="text-marble/20">Spread</div><div className="text-amber-400/60">5 bps</div></div>
          <div className="text-center"><div className="text-marble/20">Slippage</div><div className="text-amber-400/60">2 bps</div></div>
          <div className="text-center"><div className="text-marble/20">Commission</div><div className="text-amber-400/60">$1.50</div></div>
        </div>
      </div>

      {/* ─── Activity Log ─── */}
      <div>
        <div className="text-[10px] font-display tracking-[0.15em] text-marble/40 mb-2 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> ACTIVITY LOG ({activityLog.length})
        </div>
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto watchlist-scroll">
          {activityLog.length === 0 && (
            <div className="text-xs text-marble/20 text-center py-6 font-display tracking-wider">
              {isOn ? 'Scanning real-feed markets...' : 'Enable bot to start scanning'}
            </div>
          )}
          {activityLog.map(d => (
            <ActivityRow key={d.id} decision={d} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────

function StatBox({ label, value, color, suffix, prefix }: { label: string; value: number | string; color?: string; suffix?: string; prefix?: string }) {
  return (
    <div className="bg-navy-dark/40 rounded-lg p-2 text-center border border-gold/5">
      <div className="text-[8px] text-marble/25 font-display tracking-wider">{label}</div>
      <div className={`text-sm font-mono ${color || 'text-marble/70'}`}>{prefix || ''}{value}{suffix || ''}</div>
    </div>
  );
}

function ModeCard({ mode, currentMode, label, desc, icon, onSelect }: {
  mode: BotMode; currentMode: BotMode; label: string; desc: string; icon: React.ReactNode; onSelect: () => void;
}) {
  const active = mode === currentMode;
  return (
    <button
      onClick={onSelect}
      className={`p-3 rounded-lg text-left border transition-all ${
        active ? 'bg-gold/10 border-gold/30' : 'bg-navy-light/20 border-gold/5 hover:border-gold/15'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={active ? 'text-gold' : 'text-marble/30'}>{icon}</span>
        <span className={`text-xs font-display tracking-wider ${active ? 'text-gold' : 'text-marble/40'}`}>{label}</span>
      </div>
      <div className="text-[10px] text-marble/25 leading-relaxed">{desc}</div>
    </button>
  );
}

function ProposalCard({ proposal, onApprove, onReject }: {
  proposal: BotDecision; onApprove: (id: string) => void; onReject: (id: string) => void;
}) {
  const isBuy = proposal.action === 'BUY';
  const isExit = proposal.action === 'EXIT';
  return (
    <div className={`rounded-lg p-3 border ${
      isExit ? 'bg-amber-500/5 border-amber-500/20' :
      isBuy ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isBuy && <TrendingUp className="w-4 h-4 text-emerald-400" />}
          {!isBuy && !isExit && <TrendingDown className="w-4 h-4 text-red-400" />}
          {isExit && <Zap className="w-4 h-4 text-amber-400" />}
          <span className={`text-sm font-mono font-bold ${
            isBuy ? 'text-emerald-400' : isExit ? 'text-amber-400' : 'text-red-400'
          }`}>
            {proposal.action} {proposal.symbol}
          </span>
        </div>
        <span className="text-[10px] font-mono text-marble/30">
          {new Date(proposal.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <div className="text-[11px] text-marble/50 mb-2 leading-relaxed">{proposal.reason}</div>
      <div className="flex items-center gap-2 text-[10px] font-mono text-marble/40 mb-3">
        {proposal.qty && <span>Qty: {proposal.qty}</span>}
        {proposal.price && <span>@ ${proposal.price < 10 ? proposal.price.toFixed(4) : proposal.price.toLocaleString()}</span>}
        {proposal.estimatedFees && <span className="text-amber-400/60">Fees: ~${proposal.estimatedFees.toFixed(2)}</span>}
      </div>
      <div className="grid grid-cols-5 gap-1 mb-3">
        <MiniGauge label="TRD" value={proposal.signal.trend} />
        <MiniGauge label="MOM" value={proposal.signal.momentum} />
        <MiniGauge label="VOL" value={proposal.signal.volatility} />
        <MiniGauge label="VOL$" value={proposal.signal.volume} />
        <MiniGauge label="WAVE" value={proposal.signal.wave} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onApprove(proposal.id)} className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
          <Check className="w-3.5 h-3.5 mr-1" /> APPROVE
        </Button>
        <Button onClick={() => onReject(proposal.id)} variant="outline" className="flex-1 h-8 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10">
          <X className="w-3.5 h-3.5 mr-1" /> REJECT
        </Button>
      </div>
    </div>
  );
}

function MiniGauge({ label, value }: { label: string; value: number }) {
  const pct = Math.abs(value) * 100;
  const color = value > 0.3 ? 'bg-emerald-500' : value < -0.3 ? 'bg-red-500' : 'bg-marble/30';
  return (
    <div className="text-center">
      <div className="text-[8px] text-marble/30 font-mono mb-0.5">{label}</div>
      <div className="h-1.5 bg-navy-dark/60 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <div className={`text-[8px] font-mono mt-0.5 ${value > 0 ? 'text-emerald-400/60' : value < 0 ? 'text-red-400/60' : 'text-marble/20'}`}>
        {value > 0 ? '+' : ''}{value.toFixed(2)}
      </div>
    </div>
  );
}

function SignalGauge({ label, value, desc, isComposite }: { label: string; value: number; desc: string; isComposite?: boolean }) {
  const pctFromCenter = value * 50 + 50;
  const color = value > 0.3 ? 'text-emerald-400' : value < -0.3 ? 'text-red-400' : 'text-marble/50';
  const barColor = value > 0.3 ? 'bg-emerald-500' : value < -0.3 ? 'bg-red-500' : 'bg-marble/30';
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 flex-shrink-0">
        <div className={`text-[11px] font-display tracking-wider ${isComposite ? 'text-gold font-bold' : 'text-marble/50'}`}>{label}</div>
        <div className="text-[9px] text-marble/20">{desc}</div>
      </div>
      <div className="flex-1 relative">
        <div className="h-2 bg-navy-dark/60 rounded-full overflow-hidden">
          <div className="absolute left-1/2 top-0 w-px h-full bg-marble/10 z-10" />
          <div
            className={`absolute top-0 h-full rounded-full ${barColor} transition-all duration-300`}
            style={{
              left: value >= 0 ? '50%' : `${pctFromCenter}%`,
              width: `${Math.abs(value) * 50}%`,
            }}
          />
        </div>
      </div>
      <span className={`text-xs font-mono w-12 text-right ${color}`}>
        {value > 0 ? '+' : ''}{(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function SliderRow({ label, value, unit, min, max, step, onChange }: {
  label: string; value: number; unit?: string; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-[10px] font-display tracking-[0.15em] text-marble/40">{label}</span>
        <span className="text-xs font-mono text-gold/70">{value}{unit || ''}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} className="w-full" />
    </div>
  );
}

function ActivityRow({ decision }: { decision: BotDecision }) {
  const d = decision;
  const actionColor =
    d.action === 'BUY' ? 'text-emerald-400' :
    d.action === 'SELL' ? 'text-red-400' :
    d.action === 'EXIT' ? 'text-amber-400' :
    'text-marble/30';

  const statusBadge = d.status === 'rejected'
    ? <span className="text-[8px] px-1 py-0.5 rounded bg-red-500/10 text-red-400/60 border border-red-500/20">REJECTED</span>
    : d.status === 'approved'
    ? <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400/60 border border-emerald-500/20">APPROVED</span>
    : d.status === 'executed'
    ? <span className="text-[8px] px-1 py-0.5 rounded bg-gold/10 text-gold/60 border border-gold/20">AUTO</span>
    : null;

  return (
    <div className="bg-navy-light/20 rounded-lg p-2.5 border border-gold/5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {d.action === 'BUY' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
          {d.action === 'SELL' && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
          {d.action === 'EXIT' && <Zap className="w-3.5 h-3.5 text-amber-400" />}
          {d.action === 'HOLD' && <Power className="w-3.5 h-3.5 text-marble/20" />}
          <span className={`text-xs font-mono font-bold ${actionColor}`}>
            {d.action} {d.symbol}
          </span>
          {statusBadge}
        </div>
        <span className="text-[9px] font-mono text-marble/20">
          {new Date(d.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <div className="text-[11px] text-marble/40 leading-relaxed">{d.reason}</div>
      {d.price && (
        <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-marble/30">
          <span>@ ${d.price < 10 ? d.price.toFixed(4) : d.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          {d.qty && <span>× {d.qty}</span>}
          {d.estimatedFees && <span className="text-amber-400/40">fees: ${d.estimatedFees.toFixed(2)}</span>}
        </div>
      )}
    </div>
  );
}
