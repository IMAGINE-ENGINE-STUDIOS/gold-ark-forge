import { useState, useRef, useEffect } from 'react';
import {
  Brain, Play, Square, Trash2, Zap, Clock, TrendingUp, TrendingDown, Shield, Activity,
  AlertTriangle, Target, BarChart3, MessageCircle, Send, DollarSign,
  CheckCircle, XCircle, StopCircle, Trophy, ArrowUpRight, ArrowDownRight, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  chatMessages: GeniusChatMessage[];
  chatLoading: boolean;
  sendChat: (msg: string) => void;
  clearChat: () => void;
  activeGoal: GeniusGoal | null;
  goalPlan: GeniusGoalPlan | null;
  goalAccepted: boolean;
  goalPnl: number;
  goalStartEquity: number;
  submitGoal: (goal: GeniusGoal) => void;
  acceptGoal: () => void;
  cancelGoal: () => void;
  circuitBroken: boolean;
  executeTrade: (trade: { action: string; ticker: string; qty: number }) => void;
  positions: PaperPosition[];
}

const STATUS_COLORS: Record<GeniusStatus, string> = {
  idle: 'text-marble/40', scanning: 'text-blue-400', analyzing: 'text-purple-400',
  executing: 'text-emerald-400', cooldown: 'text-gold', error: 'text-red-400', 'goal-active': 'text-amber-400',
};
const STATUS_LABELS: Record<GeniusStatus, string> = {
  idle: 'IDLE', scanning: 'SCANNING...', analyzing: 'AI ANALYZING...',
  executing: 'EXECUTING...', cooldown: 'COOLDOWN', error: 'ERROR', 'goal-active': 'GOAL ACTIVE',
};

type Tab = 'dashboard' | 'chat' | 'strategy' | 'history';

const fmtPrice = (p: number) =>
  p >= 1000 ? `$${p.toLocaleString('en-US', { minimumFractionDigits: 2 })}` :
  p < 0.01 ? `$${p.toFixed(6)}` : `$${p.toFixed(2)}`;

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

  const sortedPositions = [...positions].sort((a, b) => b.pnl - a.pnl);
  const winners = sortedPositions.filter(p => p.pnl >= 0);
  const losers = sortedPositions.filter(p => p.pnl < 0);

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard', label: 'DASHBOARD', icon: BarChart3 },
    { key: 'chat', label: 'CHAT', icon: MessageCircle },
    { key: 'strategy', label: 'STRATEGY', icon: Target },
    { key: 'history', label: 'HISTORY', icon: Activity },
  ];

  return (
    <div className="space-y-4">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-gold" />
          <span className="font-display text-base tracking-[0.2em] text-gold">GENIUS</span>
          <span className="text-[10px] font-display tracking-[0.15em] px-2 py-1 rounded bg-gold/10 text-gold/80 border border-gold/20">AI STRATEGIST</span>
          {enabled && <LivePulse label="LIVE" />}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={clearLogs} className="p-1.5 text-marble/30 hover:text-red-400 transition-colors" title="Clear">
            <Trash2 className="w-4 h-4" />
          </button>
          <Button size="sm" onClick={() => setEnabled(!enabled)}
            className={`font-display text-xs tracking-[0.15em] h-9 px-4 ${
              enabled
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                : 'bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25'
            }`}>
            {enabled ? <><Square className="w-3.5 h-3.5 mr-1.5" /> STOP</> : <><Play className="w-3.5 h-3.5 mr-1.5" /> START</>}
          </Button>
        </div>
      </div>

      {/* ═══ STATUS BAR ═══ */}
      <div className="flex items-center justify-between bg-navy-light/40 rounded px-4 py-3 border border-gold/10">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${status === 'idle' ? 'bg-marble/20' : status === 'error' ? 'bg-red-500' : 'bg-gold animate-pulse'}`} />
          <span className={`text-sm font-display tracking-[0.15em] ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
        </div>
        <span className="text-xs font-mono text-marble/30">CYCLE #{cycleCount}</span>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-3 rounded bg-red-500/10 border border-red-500/30">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-sm font-mono text-red-400">{error}</span>
        </div>
      )}

      {circuitBroken && (
        <div className="flex items-center gap-3 p-4 rounded bg-red-500/15 border border-red-500/40 animate-pulse">
          <StopCircle className="w-5 h-5 text-red-400" />
          <span className="text-sm font-display tracking-[0.15em] text-red-400">CIRCUIT BREAKER TRIGGERED — TRADING HALTED</span>
        </div>
      )}

      {/* ═══ TAB NAVIGATION ═══ */}
      <div className="flex border-b border-gold/15">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-display tracking-[0.15em] transition-all border-b-2 ${
              tab === t.key
                ? 'text-gold border-gold bg-gold/5'
                : 'text-marble/30 border-transparent hover:text-marble/60 hover:bg-navy-light/20'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ═══ DASHBOARD TAB ═══ */}
      {tab === 'dashboard' && (
        <div className="space-y-4">
          {/* P&L Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className={`rounded p-4 text-center border ${totalPnl >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <div className="text-xs font-display tracking-[0.15em] text-marble/40 mb-1">TOTAL P&L</div>
              <div className={`text-xl font-mono font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalPnl >= 0 ? '+' : ''}{fmtPrice(totalPnl)}
              </div>
            </div>
            <div className="bg-navy-light/30 rounded p-4 text-center border border-gold/10">
              <div className="text-xs font-display tracking-[0.15em] text-marble/40 mb-1">WIN RATE</div>
              <div className={`text-xl font-mono font-bold ${winRate >= 60 ? 'text-emerald-400' : winRate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                {winRate.toFixed(0)}%
              </div>
            </div>
            <div className="bg-navy-light/30 rounded p-4 text-center border border-gold/10">
              <div className="text-xs font-display tracking-[0.15em] text-marble/40 mb-1">TRADES</div>
              <div className="text-xl font-mono text-marble font-bold">{winCount + lossCount}</div>
              <div className="text-xs font-mono text-marble/30">{winCount}W / {lossCount}L</div>
            </div>
            <div className="bg-navy-light/30 rounded p-4 text-center border border-gold/10">
              <div className="text-xs font-display tracking-[0.15em] text-marble/40 mb-1">REGIME</div>
              <div className="text-base font-mono text-gold">{lastAnalysis?.marketRegime?.toUpperCase() || '—'}</div>
            </div>
          </div>

          {/* Active Goal Progress */}
          {activeGoal && goalAccepted && (
            <div className="rounded p-4 border border-amber-500/25 bg-amber-500/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-display tracking-[0.15em] text-amber-400">ACTIVE GOAL</span>
                </div>
                <button onClick={cancelGoal} className="text-xs text-red-400/60 hover:text-red-400 font-display tracking-wider">Cancel</button>
              </div>
              <p className="text-sm text-marble/60 mb-3">{activeGoal.description}</p>
              <div className="h-3 bg-navy-dark/40 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full transition-all duration-500 ${goalPnl >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, Math.max(0, (goalPnl / activeGoal.amount) * 100))}%` }} />
              </div>
              <div className="flex justify-between text-sm font-mono">
                <span className={goalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>{goalPnl >= 0 ? '+' : ''}{fmtPrice(goalPnl)}</span>
                <span className="text-marble/30">Target: {fmtPrice(activeGoal.amount)}</span>
              </div>
            </div>
          )}

          {/* Positions */}
          {sortedPositions.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-display tracking-[0.2em] text-marble/30 px-1">POSITIONS BY P&L</div>
              {winners.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs text-emerald-400/60 font-display tracking-[0.15em] px-1">WINNERS ({winners.length})</div>
                  {winners.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded bg-emerald-500/5 border border-emerald-500/15">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-marble font-mono">{p.symbol}</span>
                        <span className="text-xs text-marble/30 font-mono">{p.qty}×</span>
                      </div>
                      <span className="text-sm text-emerald-400 font-mono font-bold">+{fmtPrice(p.pnl)} ({p.pnlPercent.toFixed(1)}%)</span>
                    </div>
                  ))}
                </div>
              )}
              {losers.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs text-red-400/60 font-display tracking-[0.15em] px-1">LOSERS ({losers.length})</div>
                  {losers.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded bg-red-500/5 border border-red-500/15">
                      <div className="flex items-center gap-2">
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-marble font-mono">{p.symbol}</span>
                        <span className="text-xs text-marble/30 font-mono">{p.qty}×</span>
                      </div>
                      <span className="text-sm text-red-400 font-mono font-bold">{fmtPrice(p.pnl)} ({p.pnlPercent.toFixed(1)}%)</span>
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
        <div className="space-y-3">
          {/* Goal Input */}
          <div className="bg-navy-light/30 rounded p-4 border border-gold/15">
            <div className="text-xs font-display tracking-[0.2em] text-gold/60 mb-2">SET A GOAL</div>
            <div className="flex gap-2">
              <input value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGoalSubmit()}
                placeholder='e.g. "Make me $100/hr" or "$1000 in 4 hours"'
                className="flex-1 px-4 py-3 rounded bg-navy-dark/50 border border-gold/15 text-marble text-sm font-mono placeholder:text-marble/25 focus:outline-none focus:border-gold/40 transition-colors" />
              <Button size="sm" onClick={handleGoalSubmit} disabled={chatLoading || !goalInput.trim()}
                className="h-auto px-4 bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25">
                <Target className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Goal Plan Review */}
          {goalPlan && !goalAccepted && (
            <div className="bg-navy-light/30 rounded p-4 border border-gold/20 space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-gold" />
                <span className="text-sm font-display tracking-[0.15em] text-gold">PROPOSED PLAN</span>
                {!goalPlan.feasible && <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-display">RISKY</span>}
              </div>
              <p className="text-sm font-mono text-marble/60 leading-relaxed">{goalPlan.plan.summary}</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Time', value: `${goalPlan.plan.estimatedTimeHours}h`, color: 'text-marble' },
                  { label: 'Risk', value: goalPlan.plan.riskLevel.toUpperCase(), color: goalPlan.plan.riskLevel === 'low' ? 'text-emerald-400' : goalPlan.plan.riskLevel === 'moderate' ? 'text-amber-400' : 'text-red-400' },
                  { label: 'Phases', value: `${goalPlan.plan.phases.length}`, color: 'text-marble' },
                ].map(item => (
                  <div key={item.label} className="bg-navy-dark/40 rounded p-2 text-center">
                    <div className="text-[10px] font-display tracking-[0.15em] text-marble/30">{item.label}</div>
                    <div className={`text-sm font-mono font-bold ${item.color}`}>{item.value}</div>
                  </div>
                ))}
              </div>
              {goalPlan.plan.phases.map((phase, i) => (
                <div key={i} className="text-sm font-mono text-marble/40 pl-3 border-l-2 border-gold/20 leading-relaxed">
                  <span className="text-gold/70 font-semibold">{phase.name}</span>: {phase.approach} — target +{fmtPrice(phase.targetPnl)} ({phase.durationMinutes}min)
                </div>
              ))}
              {goalPlan.warning && (
                <div className="flex items-center gap-2 p-3 rounded bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-sm text-amber-400">{goalPlan.warning}</span>
                </div>
              )}
              <div className="flex gap-3">
                <Button size="sm" onClick={acceptGoal} className="flex-1 h-10 text-sm font-display tracking-[0.15em] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25">
                  <CheckCircle className="w-4 h-4 mr-2" /> ACCEPT & START
                </Button>
                <Button size="sm" onClick={cancelGoal} className="h-10 px-4 text-sm font-display bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25">
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="max-h-[400px] overflow-y-auto space-y-3 px-1">
            {chatMessages.length === 0 && (
              <div className="text-center py-12 text-marble/25 text-sm font-display tracking-wider">
                Ask Genius anything — market data, strategies, or set goals
              </div>
            )}
            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded p-4 ${msg.role === 'user'
                  ? 'bg-gold/10 text-marble border border-gold/20'
                  : 'bg-navy-light/40 text-marble border border-gold/10'}`}>
                  <div className="prose prose-sm prose-invert max-w-none [&_p]:m-0 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-marble [&_code]:text-xs [&_code]:text-gold [&_li]:text-sm [&_li]:text-marble [&_h1]:text-gold [&_h2]:text-gold [&_h3]:text-gold [&_strong]:text-marble">
                    <ReactMarkdown>{msg.content.replace(/```trade[\s\S]*?```/g, '')}</ReactMarkdown>
                  </div>
                  {msg.suggestedTrade && (
                    <div className="mt-3 p-3 rounded bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono text-emerald-400">
                          {msg.suggestedTrade.action} {msg.suggestedTrade.ticker} ×{msg.suggestedTrade.qty}
                        </span>
                        <Button size="sm" onClick={() => executeTrade(msg.suggestedTrade!)}
                          className="h-8 px-3 text-xs font-display tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/40">
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
                <div className="rounded p-4 bg-navy-light/40 border border-gold/10">
                  <Loader2 className="w-5 h-5 text-gold animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="flex gap-2">
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Genius anything..."
              className="flex-1 px-4 py-3 rounded bg-navy-dark/50 border border-gold/15 text-marble text-sm font-mono placeholder:text-marble/25 focus:outline-none focus:border-gold/40 transition-colors" />
            <Button size="sm" onClick={handleSend} disabled={chatLoading || !chatInput.trim()}
              className="h-auto px-4 bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ═══ STRATEGY TAB ═══ */}
      {tab === 'strategy' && (
        <div className="space-y-4">
          {/* Timeline */}
          <div>
            <div className="text-xs font-display tracking-[0.2em] text-marble/40 mb-3 px-1">TIMELINE</div>
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: 'short' as GeniusTimeline, label: 'SHORT', desc: '1-15 min', icon: Zap, color: 'text-amber-400' },
                { key: 'mid' as GeniusTimeline, label: 'MID', desc: '1-6 hours', icon: Clock, color: 'text-blue-400' },
                { key: 'long' as GeniusTimeline, label: 'LONG', desc: '1-7 days', icon: Target, color: 'text-emerald-400' },
              ]).map(cfg => (
                <button key={cfg.key} onClick={() => setTimeline(cfg.key)}
                  className={`p-4 rounded border text-center transition-all ${
                    timeline === cfg.key
                      ? 'bg-gold/10 border-gold/30 text-gold'
                      : 'bg-navy-light/20 border-gold/8 text-marble/40 hover:text-marble/70 hover:border-gold/20'
                  }`}>
                  <cfg.icon className={`w-5 h-5 mx-auto mb-2 ${timeline === cfg.key ? cfg.color : 'text-marble/25'}`} />
                  <div className="text-sm font-display tracking-[0.15em]">{cfg.label}</div>
                  <div className="text-xs font-mono text-marble/25 mt-1">{cfg.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Risk + Auto-Execute */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-navy-light/20 rounded p-4 border border-gold/10">
              <div className="text-xs font-display tracking-[0.15em] text-marble/30 mb-3">RISK TOLERANCE</div>
              <input type="range" min={1} max={10} value={riskTolerance} onChange={(e) => setRiskTolerance(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-gold" />
              <div className="flex justify-between text-xs font-mono text-marble/30 mt-2">
                <span>SAFE</span>
                <span className={`font-bold text-sm ${riskTolerance <= 3 ? 'text-emerald-400' : riskTolerance <= 6 ? 'text-gold' : 'text-red-400'}`}>{riskTolerance}/10</span>
                <span>BOLD</span>
              </div>
            </div>
            <div className="bg-navy-light/20 rounded p-4 border border-gold/10 flex flex-col justify-between">
              <div className="text-xs font-display tracking-[0.15em] text-marble/30 mb-2">AUTO-EXECUTE</div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={autoExecute} onChange={(e) => setAutoExecute(e.target.checked)} className="sr-only" />
                  <div className={`w-10 h-5 rounded-full transition-colors ${autoExecute ? 'bg-gold/60' : 'bg-marble/15'}`} />
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-marble transition-transform ${autoExecute ? 'translate-x-5' : ''}`} />
                </div>
                <span className={`text-sm font-display tracking-[0.15em] ${autoExecute ? 'text-gold' : 'text-marble/30'}`}>{autoExecute ? 'ON' : 'OFF'}</span>
              </label>
              {!autoExecute && (
                <Button size="sm" onClick={runManual} disabled={status === 'analyzing' || status === 'executing' || status === 'scanning'}
                  className="w-full h-9 text-xs font-display tracking-[0.15em] bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25 mt-3">
                  <Brain className="w-4 h-4 mr-2" /> ANALYZE NOW
                </Button>
              )}
            </div>
          </div>

          {/* Latest Analysis */}
          {lastAnalysis && (
            <div className="bg-navy-light/20 rounded p-4 border border-gold/15 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-display tracking-[0.15em] text-gold">LATEST STRATEGY</span>
                <span className={`text-sm font-mono font-bold ${lastAnalysis.confidence >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{lastAnalysis.confidence}%</span>
              </div>
              <p className="text-sm font-mono text-marble/50 leading-relaxed">{lastAnalysis.strategy}</p>
              {lastAnalysis.trades?.map((trade, i) => (
                <div key={i} className={`rounded p-3 border ${trade.action === 'BUY' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {trade.action === 'BUY' ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                      <span className={`text-sm font-mono font-bold ${trade.action === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{trade.action} {trade.ticker}</span>
                    </div>
                    <span className="text-xs font-mono text-marble/30">{trade.confidence}%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs font-mono text-marble/30">
                    <div>QTY: <span className="text-marble/60">{trade.qty}</span></div>
                    <div>ENTRY: <span className="text-marble/60">{fmtPrice(trade.entryPrice)}</span></div>
                    <div>TP: <span className="text-emerald-400/70">{fmtPrice(trade.targetPrice)}</span></div>
                    <div>SL: <span className="text-red-400/70">{fmtPrice(trade.stopLoss)}</span></div>
                  </div>
                  <p className="text-xs text-marble/35 mt-2 leading-relaxed">{trade.reason}</p>
                </div>
              ))}
              <div className="flex items-start gap-2 p-3 rounded bg-amber-500/5 border border-amber-500/15">
                <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-mono text-amber-400/70 leading-relaxed">{lastAnalysis.riskAssessment}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ HISTORY TAB ═══ */}
      {tab === 'history' && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {logs.length === 0 && <div className="p-12 text-center text-marble/20 text-sm font-display tracking-wider">No cycles recorded yet</div>}
          {logs.map(log => (
            <div key={log.id} className="flex items-center justify-between p-3 bg-navy-light/20 rounded border border-gold/8 text-sm font-mono">
              <span className="text-marble/40">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className="text-gold/60">{log.timeline.toUpperCase()}</span>
              <span className="text-marble/40">{log.analysis.trades?.length || 0} trades</span>
              <span className={log.executedTrades.filter(t => t.success).length > 0 ? 'text-emerald-400' : 'text-marble/20'}>
                {log.executedTrades.filter(t => t.success).length}/{log.executedTrades.length} exec
              </span>
              <span className="text-marble/30">{log.analysis.confidence}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
