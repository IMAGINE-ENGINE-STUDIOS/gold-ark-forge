import { useState, useRef, useEffect } from 'react';
import {
  Brain, Play, Square, Trash2, Zap, Clock, TrendingUp, TrendingDown, Shield, Activity,
  ChevronDown, AlertTriangle, Target, BarChart3, MessageCircle, Send, DollarSign,
  CheckCircle, XCircle, StopCircle, Trophy, ArrowUpRight, ArrowDownRight, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import type {
  GeniusTimeline, GeniusStatus, GeniusAnalysis, GeniusCycleLog,
  GeniusChatMessage, GeniusGoalPlan, GeniusGoal,
} from '@/hooks/useGeniusTrader';
import type { PaperPosition } from '@/hooks/usePaperTrading';
import LivePulse from '@/components/ga-widgets/LivePulse';
import ReactMarkdown from 'react-markdown';

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
  // Chat
  chatMessages: GeniusChatMessage[];
  chatLoading: boolean;
  sendChat: (msg: string) => void;
  clearChat: () => void;
  // Goal
  activeGoal: GeniusGoal | null;
  goalPlan: GeniusGoalPlan | null;
  goalAccepted: boolean;
  goalPnl: number;
  goalStartEquity: number;
  submitGoal: (goal: GeniusGoal) => void;
  acceptGoal: () => void;
  cancelGoal: () => void;
  circuitBroken: boolean;
  // Trade from chat
  executeTrade: (trade: { action: string; ticker: string; qty: number }) => void;
  // Positions
  positions: PaperPosition[];
}

const STATUS_COLORS: Record<GeniusStatus, string> = {
  idle: 'text-muted-foreground', scanning: 'text-blue-400', analyzing: 'text-purple-400',
  executing: 'text-emerald-400', cooldown: 'text-gold', error: 'text-red-400', 'goal-active': 'text-amber-400',
};
const STATUS_LABELS: Record<GeniusStatus, string> = {
  idle: 'IDLE', scanning: 'SCANNING...', analyzing: 'AI ANALYZING...',
  executing: 'EXECUTING...', cooldown: 'COOLDOWN', error: 'ERROR', 'goal-active': 'GOAL ACTIVE',
};

type Tab = 'dashboard' | 'chat' | 'strategy' | 'history';

export default function GeniusPanel(props: GeniusPanelProps) {
  const {
    enabled, setEnabled, timeline, setTimeline, riskTolerance, setRiskTolerance,
    autoExecute, setAutoExecute, status, lastAnalysis, logs, error,
    cycleCount, winCount, lossCount, totalPnl, runManual, clearLogs,
    chatMessages, chatLoading, sendChat, clearChat,
    activeGoal, goalPlan, goalAccepted, goalPnl, goalStartEquity,
    submitGoal, acceptGoal, cancelGoal, circuitBroken,
    executeTrade, positions,
  } = props;

  const [tab, setTab] = useState<Tab>('dashboard');
  const [chatInput, setChatInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const winRate = winCount + lossCount > 0 ? (winCount / (winCount + lossCount)) * 100 : 0;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const handleSend = () => { if (chatInput.trim()) { sendChat(chatInput); setChatInput(''); } };
  const handleGoalSubmit = () => {
    if (!goalInput.trim()) return;
    const input = goalInput.toLowerCase();
    let goal: GeniusGoal;
    const amountMatch = input.match(/\$?([\d,.]+)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : 100;
    if (input.includes('hr') || input.includes('hour')) {
      goal = { type: 'hourly_target', amount, timeframeHours: 1, description: goalInput };
    } else if (input.includes('day') || input.includes('daily')) {
      goal = { type: 'daily_target', amount, timeframeHours: 24, description: goalInput };
    } else if (input.includes('%')) {
      goal = { type: 'percentage', amount, timeframeHours: 24, description: goalInput };
    } else {
      const hoursMatch = input.match(/(\d+)\s*h/);
      goal = { type: 'total_target', amount, timeframeHours: hoursMatch ? parseInt(hoursMatch[1]) : 4, description: goalInput };
    }
    submitGoal(goal);
    setGoalInput('');
  };

  // Sort positions: winners first, then losers
  const sortedPositions = [...positions].sort((a, b) => b.pnl - a.pnl);
  const winners = sortedPositions.filter(p => p.pnl >= 0);
  const losers = sortedPositions.filter(p => p.pnl < 0);

  const fmtPrice = (p: number) => p >= 1000 ? `$${p.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : p < 0.01 ? `$${p.toFixed(6)}` : `$${p.toFixed(2)}`;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <span className="font-display text-sm tracking-wider text-purple-300">GENIUS</span>
          <span className="text-[7px] font-display tracking-[0.2em] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400/80 border border-purple-500/20">AI STRATEGIST</span>
          {enabled && <LivePulse label="LIVE" />}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearLogs} className="p-1 text-muted-foreground/40 hover:text-red-400 transition-colors" title="Clear"><Trash2 className="w-3.5 h-3.5" /></button>
          <Button size="sm" onClick={() => setEnabled(!enabled)}
            className={`font-display text-[9px] tracking-wider h-7 px-3 ${enabled ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30'}`}>
            {enabled ? <><Square className="w-3 h-3 mr-1" /> STOP</> : <><Play className="w-3 h-3 mr-1" /> START</>}
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between bg-card/30 rounded-lg p-2 border border-purple-500/10">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === 'idle' ? 'bg-muted-foreground/20' : status === 'error' ? 'bg-red-500' : 'bg-purple-500 animate-pulse'}`} />
          <span className={`text-[9px] font-display tracking-wider ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
        </div>
        <span className="text-[8px] font-mono text-muted-foreground/40">CYCLE #{cycleCount}</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span className="text-[9px] font-mono text-red-400">{error}</span>
        </div>
      )}

      {circuitBroken && (
        <div className="flex items-center gap-2 p-2 rounded bg-red-500/15 border border-red-500/30 animate-pulse">
          <StopCircle className="w-4 h-4 text-red-400" />
          <span className="text-[10px] font-display tracking-wider text-red-400">CIRCUIT BREAKER TRIGGERED — TRADING HALTED</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-border/30">
        {([
          { key: 'dashboard' as Tab, label: 'DASHBOARD', icon: BarChart3 },
          { key: 'chat' as Tab, label: 'CHAT', icon: MessageCircle },
          { key: 'strategy' as Tab, label: 'STRATEGY', icon: Target },
          { key: 'history' as Tab, label: 'HISTORY', icon: Activity },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[8px] font-display tracking-[0.15em] rounded-t transition-colors ${tab === t.key ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 border-b-0' : 'text-muted-foreground/40 hover:text-muted-foreground/70'}`}>
            <t.icon className="w-3 h-3" /> {t.label}
          </button>
        ))}
      </div>

      {/* ═══ DASHBOARD TAB ═══ */}
      {tab === 'dashboard' && (
        <div className="space-y-3">
          {/* P&L Stats */}
          <div className="grid grid-cols-4 gap-1.5">
            <div className={`rounded-lg p-2 text-center border ${totalPnl >= 0 ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
              <div className="text-[6px] font-display tracking-wider text-muted-foreground/40">TOTAL P&L</div>
              <div className={`text-[12px] font-mono font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{totalPnl >= 0 ? '+' : ''}{fmtPrice(totalPnl)}</div>
            </div>
            <div className="bg-card/20 rounded-lg p-2 text-center border border-border/20">
              <div className="text-[6px] font-display tracking-wider text-muted-foreground/40">WIN RATE</div>
              <div className={`text-[12px] font-mono font-bold ${winRate >= 60 ? 'text-emerald-400' : winRate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{winRate.toFixed(0)}%</div>
            </div>
            <div className="bg-card/20 rounded-lg p-2 text-center border border-border/20">
              <div className="text-[6px] font-display tracking-wider text-muted-foreground/40">TRADES</div>
              <div className="text-[12px] font-mono text-foreground/70">{winCount + lossCount}</div>
              <div className="text-[7px] font-mono text-muted-foreground/30">{winCount}W / {lossCount}L</div>
            </div>
            <div className="bg-card/20 rounded-lg p-2 text-center border border-border/20">
              <div className="text-[6px] font-display tracking-wider text-muted-foreground/40">REGIME</div>
              <div className="text-[10px] font-mono text-purple-400">{lastAnalysis?.marketRegime?.toUpperCase() || '—'}</div>
            </div>
          </div>

          {/* Goal Progress */}
          {activeGoal && goalAccepted && (
            <div className="rounded-lg p-3 border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[9px] font-display tracking-wider text-amber-400">ACTIVE GOAL</span>
                </div>
                <button onClick={cancelGoal} className="text-[8px] text-red-400/60 hover:text-red-400">Cancel</button>
              </div>
              <p className="text-[9px] text-muted-foreground/60 mb-2">{activeGoal.description}</p>
              <div className="h-2 bg-background/30 rounded-full overflow-hidden mb-1">
                <div className={`h-full rounded-full transition-all ${goalPnl >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, Math.max(0, (goalPnl / activeGoal.amount) * 100))}%` }} />
              </div>
              <div className="flex justify-between text-[8px] font-mono">
                <span className={goalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>{goalPnl >= 0 ? '+' : ''}{fmtPrice(goalPnl)}</span>
                <span className="text-muted-foreground/30">Target: {fmtPrice(activeGoal.amount)}</span>
              </div>
            </div>
          )}

          {/* Positions — Winners then Losers */}
          {sortedPositions.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[8px] font-display tracking-wider text-muted-foreground/30">POSITIONS BY P&L</div>
              {winners.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[7px] text-emerald-400/50 font-display tracking-wider">WINNERS ({winners.length})</div>
                  {winners.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-1.5 rounded bg-emerald-500/5 border border-emerald-500/10 text-[8px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                        <span className="text-foreground/70">{p.symbol}</span>
                        <span className="text-muted-foreground/30">{p.qty}×</span>
                      </div>
                      <span className="text-emerald-400 font-bold">+{fmtPrice(p.pnl)} ({p.pnlPercent.toFixed(1)}%)</span>
                    </div>
                  ))}
                </div>
              )}
              {losers.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[7px] text-red-400/50 font-display tracking-wider">LOSERS ({losers.length})</div>
                  {losers.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-1.5 rounded bg-red-500/5 border border-red-500/10 text-[8px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <ArrowDownRight className="w-3 h-3 text-red-400" />
                        <span className="text-foreground/70">{p.symbol}</span>
                        <span className="text-muted-foreground/30">{p.qty}×</span>
                      </div>
                      <span className="text-red-400 font-bold">{fmtPrice(p.pnl)} ({p.pnlPercent.toFixed(1)}%)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ CHAT TAB ═══ */}
      {tab === 'chat' && (
        <div className="space-y-2">
          {/* Goal Input */}
          <div className="bg-card/20 rounded-lg p-2 border border-amber-500/15">
            <div className="text-[7px] font-display tracking-wider text-amber-400/60 mb-1">SET A GOAL</div>
            <div className="flex gap-1.5">
              <input value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGoalSubmit()}
                placeholder='e.g. "Make me $100/hr" or "$1000 in 4 hours"'
                className="flex-1 px-2 py-1.5 rounded bg-background/30 border border-border/20 text-foreground text-[9px] font-mono placeholder:text-muted-foreground/20 focus:outline-none focus:border-amber-500/40" />
              <Button size="sm" onClick={handleGoalSubmit} disabled={chatLoading || !goalInput.trim()}
                className="h-7 px-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 text-[8px]">
                <Target className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Goal Plan Review */}
          {goalPlan && !goalAccepted && (
            <div className="bg-card/20 rounded-lg p-3 border border-purple-500/20 space-y-2">
              <div className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[9px] font-display tracking-wider text-purple-300">PROPOSED PLAN</span>
                {!goalPlan.feasible && <span className="text-[7px] px-1 py-0.5 rounded bg-red-500/20 text-red-400">RISKY</span>}
              </div>
              <p className="text-[9px] font-mono text-muted-foreground/60">{goalPlan.plan.summary}</p>
              <div className="grid grid-cols-3 gap-1 text-[7px] font-mono">
                <div className="bg-background/20 rounded p-1 text-center">
                  <div className="text-muted-foreground/30">Time</div>
                  <div className="text-foreground/60">{goalPlan.plan.estimatedTimeHours}h</div>
                </div>
                <div className="bg-background/20 rounded p-1 text-center">
                  <div className="text-muted-foreground/30">Risk</div>
                  <div className={`${goalPlan.plan.riskLevel === 'low' ? 'text-emerald-400' : goalPlan.plan.riskLevel === 'moderate' ? 'text-amber-400' : 'text-red-400'}`}>{goalPlan.plan.riskLevel.toUpperCase()}</div>
                </div>
                <div className="bg-background/20 rounded p-1 text-center">
                  <div className="text-muted-foreground/30">Phases</div>
                  <div className="text-foreground/60">{goalPlan.plan.phases.length}</div>
                </div>
              </div>
              {goalPlan.plan.phases.map((phase, i) => (
                <div key={i} className="text-[8px] font-mono text-muted-foreground/40 pl-2 border-l border-purple-500/20">
                  <span className="text-purple-400/60">{phase.name}</span>: {phase.approach} — target +{fmtPrice(phase.targetPnl)} ({phase.durationMinutes}min)
                </div>
              ))}
              {goalPlan.warning && (
                <div className="flex items-center gap-1.5 p-1.5 rounded bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="text-[8px] text-amber-400/80">{goalPlan.warning}</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={acceptGoal} className="flex-1 h-7 text-[9px] font-display bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" /> ACCEPT & START
                </Button>
                <Button size="sm" onClick={cancelGoal} className="h-7 text-[9px] font-display bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30">
                  <XCircle className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="max-h-[300px] overflow-y-auto space-y-1.5 px-0.5">
            {chatMessages.length === 0 && (
              <div className="text-center py-6 text-muted-foreground/20 text-[9px] font-display">
                Ask Genius anything — market data, trade suggestions, or set goals
              </div>
            )}
            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-2 text-[9px] ${msg.role === 'user'
                  ? 'bg-purple-500/15 text-purple-200 border border-purple-500/20'
                  : 'bg-card/30 text-foreground/70 border border-border/20'}`}>
                  <div className="prose prose-xs prose-invert max-w-none [&_p]:m-0 [&_p]:text-[9px] [&_code]:text-[8px] [&_li]:text-[9px]">
                    <ReactMarkdown>{msg.content.replace(/```trade[\s\S]*?```/g, '')}</ReactMarkdown>
                  </div>
                  {msg.suggestedTrade && (
                    <div className="mt-1.5 p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono text-emerald-400">
                          {msg.suggestedTrade.action} {msg.suggestedTrade.ticker} ×{msg.suggestedTrade.qty}
                        </span>
                        <Button size="sm" onClick={() => executeTrade(msg.suggestedTrade!)}
                          className="h-5 px-2 text-[7px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/40">
                          EXECUTE
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg p-2 bg-card/30 border border-border/20">
                  <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="flex gap-1.5">
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Genius anything..."
              className="flex-1 px-3 py-2 rounded-lg bg-background/30 border border-border/20 text-foreground text-[10px] font-mono placeholder:text-muted-foreground/20 focus:outline-none focus:border-purple-500/40" />
            <Button size="sm" onClick={handleSend} disabled={chatLoading || !chatInput.trim()}
              className="h-8 px-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ═══ STRATEGY TAB ═══ */}
      {tab === 'strategy' && (
        <div className="space-y-3">
          {/* Timeline */}
          <div>
            <div className="text-[8px] font-display tracking-wider text-muted-foreground/40 mb-1.5">TIMELINE</div>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { key: 'short' as GeniusTimeline, label: 'SHORT', desc: '1-15m', icon: Zap, color: 'text-amber-400' },
                { key: 'mid' as GeniusTimeline, label: 'MID', desc: '1-6h', icon: Clock, color: 'text-blue-400' },
                { key: 'long' as GeniusTimeline, label: 'LONG', desc: '1-7d', icon: Target, color: 'text-emerald-400' },
              ]).map(cfg => (
                <button key={cfg.key} onClick={() => setTimeline(cfg.key)}
                  className={`p-2 rounded-lg border text-center transition-all ${timeline === cfg.key ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' : 'bg-card/10 border-border/10 text-muted-foreground/40 hover:text-muted-foreground/70'}`}>
                  <cfg.icon className={`w-3.5 h-3.5 mx-auto mb-0.5 ${timeline === cfg.key ? cfg.color : 'text-muted-foreground/30'}`} />
                  <div className="text-[8px] font-display tracking-wider">{cfg.label}</div>
                  <div className="text-[6px] font-mono text-muted-foreground/20">{cfg.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Risk + Auto-Execute */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-card/10 rounded-lg p-2 border border-border/10">
              <div className="text-[7px] font-display tracking-wider text-muted-foreground/30 mb-1">RISK TOLERANCE</div>
              <input type="range" min={1} max={10} value={riskTolerance} onChange={(e) => setRiskTolerance(parseInt(e.target.value))}
                className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-purple-500" />
              <div className="flex justify-between text-[7px] font-mono text-muted-foreground/30 mt-0.5">
                <span>SAFE</span>
                <span className={`font-bold ${riskTolerance <= 3 ? 'text-emerald-400' : riskTolerance <= 6 ? 'text-gold' : 'text-red-400'}`}>{riskTolerance}/10</span>
                <span>BOLD</span>
              </div>
            </div>
            <div className="bg-card/10 rounded-lg p-2 border border-border/10 flex flex-col justify-between">
              <div className="text-[7px] font-display tracking-wider text-muted-foreground/30">AUTO-EXECUTE</div>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <div className="relative">
                  <input type="checkbox" checked={autoExecute} onChange={(e) => setAutoExecute(e.target.checked)} className="sr-only" />
                  <div className={`w-8 h-4 rounded-full transition-colors ${autoExecute ? 'bg-purple-500' : 'bg-muted/30'}`} />
                  <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoExecute ? 'translate-x-4' : ''}`} />
                </div>
                <span className={`text-[8px] font-display tracking-wider ${autoExecute ? 'text-purple-400' : 'text-muted-foreground/30'}`}>{autoExecute ? 'ON' : 'OFF'}</span>
              </label>
              {!autoExecute && (
                <Button size="sm" onClick={runManual} disabled={status === 'analyzing' || status === 'executing' || status === 'scanning'}
                  className="w-full h-6 text-[8px] font-display tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 mt-1">
                  <Brain className="w-3 h-3 mr-1" /> ANALYZE NOW
                </Button>
              )}
            </div>
          </div>

          {/* Latest Analysis */}
          {lastAnalysis && (
            <div className="bg-card/20 rounded-lg p-3 border border-purple-500/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-display tracking-wider text-purple-300">LATEST STRATEGY</span>
                <span className={`text-[8px] font-mono ${lastAnalysis.confidence >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{lastAnalysis.confidence}%</span>
              </div>
              <p className="text-[9px] font-mono text-muted-foreground/50">{lastAnalysis.strategy}</p>
              {lastAnalysis.trades?.map((trade, i) => (
                <div key={i} className={`rounded-lg p-2 border ${trade.action === 'BUY' ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      {trade.action === 'BUY' ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
                      <span className={`text-[10px] font-mono font-bold ${trade.action === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{trade.action} {trade.ticker}</span>
                    </div>
                    <span className="text-[8px] font-mono text-muted-foreground/30">{trade.confidence}%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[7px] font-mono text-muted-foreground/30">
                    <div>QTY: <span className="text-foreground/50">{trade.qty}</span></div>
                    <div>ENTRY: <span className="text-foreground/50">{fmtPrice(trade.entryPrice)}</span></div>
                    <div>TP: <span className="text-emerald-400/60">{fmtPrice(trade.targetPrice)}</span></div>
                    <div>SL: <span className="text-red-400/60">{fmtPrice(trade.stopLoss)}</span></div>
                  </div>
                  <p className="text-[8px] text-muted-foreground/30 mt-1">{trade.reason}</p>
                </div>
              ))}
              <div className="flex items-start gap-1.5 p-2 rounded bg-amber-500/5 border border-amber-500/10">
                <Shield className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-[8px] font-mono text-amber-400/70">{lastAnalysis.riskAssessment}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ HISTORY TAB ═══ */}
      {tab === 'history' && (
        <div className="space-y-1 max-h-[350px] overflow-y-auto">
          {logs.length === 0 && <div className="p-6 text-center text-muted-foreground/20 text-[9px] font-display">No cycles recorded yet</div>}
          {logs.map(log => (
            <div key={log.id} className="flex items-center justify-between p-1.5 bg-card/20 rounded border border-border/10 text-[8px] font-mono">
              <span className="text-muted-foreground/30">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className="text-purple-400/60">{log.timeline.toUpperCase()}</span>
              <span className="text-muted-foreground/40">{log.analysis.trades?.length || 0} trades</span>
              <span className={log.executedTrades.filter(t => t.success).length > 0 ? 'text-emerald-400' : 'text-muted-foreground/20'}>
                {log.executedTrades.filter(t => t.success).length}/{log.executedTrades.length} exec
              </span>
              <span className="text-muted-foreground/20">{log.analysis.confidence}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
