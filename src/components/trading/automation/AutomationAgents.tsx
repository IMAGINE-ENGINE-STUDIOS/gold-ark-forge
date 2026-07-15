import { useState } from 'react';
import { Brain, Search, Shield, Scale, CheckCircle2, Clock, Send, Loader2, Check, X } from 'lucide-react';
import GeniusPanel from '@/components/trading/GeniusPanel';
import type { useGeniusTrader } from '@/hooks/useGeniusTrader';
import { useAgentApprovals } from '@/hooks/useAgentApprovals';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  genius: ReturnType<typeof useGeniusTrader>;
  equity?: number;
  positions?: Array<{ symbol: string; side: string; qty: number; entry: number }>;
  prices?: Record<string, number>;
  onApprovedTrade?: (proposal: { symbol: string; side: 'buy' | 'sell'; sizeUsd: number; reason: string }) => void;
}

const ROSTER = [
  {
    key: 'genius',
    name: 'GENIUS STRATEGIST',
    role: 'Cycle-based trade generator',
    icon: Brain,
    status: 'LIVE',
    detail: 'Manual-first mode with 20% equity circuit breaker + consecutive-loss breaker. Runs on gemini-2.5-flash today; will migrate to gemini-3.5-flash in Phase 2.',
  },
  {
    key: 'research',
    name: 'RESEARCH AGENT',
    role: 'News + on-chain thesis drafter',
    icon: Search,
    status: 'PHASE 2',
    detail: 'Read-only tool set (getQuote, getNews, getIndicators). Untrusted content wrapped in <untrusted_content>. Never registered with write tools.',
  },
  {
    key: 'risk',
    name: 'RISK SENTINEL',
    role: 'Drawdown + exposure monitor',
    icon: Shield,
    status: 'PHASE 2',
    detail: 'Watches equity curve, correlation, and per-strategy DD. Can request a kill-switch — approval required.',
  },
  {
    key: 'rebalancer',
    name: 'REBALANCER',
    role: 'Target-weight enforcer',
    icon: Scale,
    status: 'PHASE 2',
    detail: 'Deterministic drift check; proposes orders through the approval queue when weights breach bands.',
  },
] as const;

const STATUS_STYLE: Record<string, string> = {
  LIVE: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  'PHASE 2': 'text-amber-400 border-amber-500/30 bg-amber-500/10',
};

type AgentKey = 'research' | 'risk' | 'rebalancer';

const AGENT_PROMPTS: Record<AgentKey, string> = {
  research: 'Draft a thesis for the strongest current opportunity in metals or crypto. If confident, propose one trade.',
  risk: 'Review my current positions for concentration or drawdown risk. Recommend a defensive rebalance if needed.',
  rebalancer: 'Suggest orders to move toward a balanced 60% metals / 30% crypto / 10% cash portfolio.',
};

export default function AutomationAgents({ genius, equity = 100_000, positions = [], prices = {}, onApprovedTrade }: Props) {
  const approvals = useAgentApprovals();
  const [active, setActive] = useState<AgentKey>('research');
  const [prompt, setPrompt] = useState<string>(AGENT_PROMPTS.research);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<string>('');

  const runAgent = async () => {
    setBusy(true);
    setReply('');
    try {
      const { data, error } = await supabase.functions.invoke('automation-agent', {
        body: { agent: active, prompt, context: { equity, positions, prices } },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setReply((data as any)?.reply ?? '(no reply)');
      const n = (data as any)?.proposalIds?.length ?? 0;
      toast.success(n ? `${n} trade proposal(s) queued for approval` : 'Agent finished · no proposals');
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setReply(`error: ${msg}`);
      toast.error(`Agent failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async (a: typeof approvals.pending[number]) => {
    await approvals.decide(a.id, 'approved');
    onApprovedTrade?.(a.proposal);
    toast.success(`Approved · ${a.proposal.side.toUpperCase()} ${a.proposal.symbol} $${a.proposal.sizeUsd}`);
  };

  const handleReject = async (a: typeof approvals.pending[number]) => {
    await approvals.decide(a.id, 'rejected');
    toast.message('Rejected');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-gold" />
          <span className="text-[11px] font-display tracking-[0.2em] text-gold-light">AI AGENTS</span>
          <span className="text-[9px] font-mono text-marble/25">· proposal-only · human approval required</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400/70">
          <CheckCircle2 className="w-3 h-3" /> approval-gated
        </div>
      </div>

      {/* Roster */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ROSTER.map(agent => {
          const Icon = agent.icon;
          const style = STATUS_STYLE[agent.status] ?? 'text-marble/40 border-gold/15 bg-navy-dark/40';
          const isSelectable = agent.key === 'research' || agent.key === 'risk' || agent.key === 'rebalancer';
          const isActive = isSelectable && agent.key === active;
          return (
            <button
              key={agent.key}
              onClick={() => { if (isSelectable) { setActive(agent.key as AgentKey); setPrompt(AGENT_PROMPTS[agent.key as AgentKey]); } }}
              disabled={!isSelectable}
              className={`text-left rounded-lg p-3 border transition-all ${
                isActive
                  ? 'border-gold/40 bg-gradient-to-br from-gold/10 to-gold/5'
                  : 'border-gold/10 bg-navy-dark/40 hover:border-gold/25'
              } ${!isSelectable ? 'cursor-default' : ''}`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-gold/60" />
                  <span className="text-[10px] font-display tracking-wider text-gold-light">{agent.name}</span>
                </div>
                <span className={`text-[7px] font-display tracking-wider px-1 py-0.5 rounded border ${style}`}>
                  {isSelectable ? 'READY' : agent.status}
                </span>
              </div>
              <div className="text-[9px] font-mono text-marble/50 mb-1">{agent.role}</div>
              <div className="text-[8px] font-mono text-marble/30 leading-relaxed">{agent.detail}</div>
            </button>
          );
        })}
      </div>

      {/* AGENT CONSOLE */}
      <div className="rounded-xl border border-gold/15 bg-gradient-to-br from-navy-light/40 to-navy-dark/40 p-3 space-y-2">
        <div className="text-[9px] font-display tracking-[0.15em] text-gold/60">■ AGENT CONSOLE · {active.toUpperCase()}</div>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={2}
          className="w-full bg-navy-dark/60 border border-gold/15 rounded px-2 py-1.5 text-[10px] font-mono text-marble/80 outline-none focus:border-gold/40"
          placeholder="ask the agent…"
        />
        <button
          onClick={runAgent}
          disabled={busy || !prompt.trim()}
          className="w-full text-[10px] font-display tracking-[0.15em] py-2 rounded border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 text-emerald-400 transition-colors flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          {busy ? 'THINKING…' : 'RUN AGENT'}
        </button>
        {reply && (
          <div className="rounded bg-navy-dark/70 border border-gold/10 p-2 text-[10px] font-mono text-marble/70 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {reply}
          </div>
        )}
      </div>

      {/* PENDING APPROVALS */}
      <div className="rounded-lg border border-gold/15 bg-navy-dark/30 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-display tracking-[0.15em] text-marble/40">PENDING APPROVALS</span>
          <div className="flex items-center gap-1 text-[9px] font-mono text-marble/40">
            <Clock className="w-3 h-3" /> {approvals.pending.length} · 5m TTL
          </div>
        </div>
        {approvals.pending.length === 0 ? (
          <div className="text-[9px] font-mono text-marble/30 py-3 text-center">No pending proposals</div>
        ) : (
          <div className="space-y-1.5">
            {approvals.pending.map(a => {
              const secLeft = Math.max(0, Math.round((new Date(a.expires_at).getTime() - Date.now()) / 1000));
              return (
                <div key={a.id} className="rounded border border-gold/15 bg-navy-dark/50 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[8px] font-display tracking-wider px-1.5 py-0.5 rounded border ${
                        a.proposal.side === 'buy'
                          ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                          : 'text-red-400 border-red-500/30 bg-red-500/10'
                      }`}>{a.proposal.side.toUpperCase()}</span>
                      <span className="text-[10px] font-display tracking-wider text-gold-light">{a.proposal.symbol}</span>
                      <span className="text-[9px] font-mono text-marble/60">${a.proposal.sizeUsd.toLocaleString()}</span>
                    </div>
                    <span className="text-[8px] font-mono text-marble/40">{secLeft}s · {a.agent}</span>
                  </div>
                  <div className="text-[9px] font-mono text-marble/50 leading-relaxed mb-2">{a.proposal.reason}</div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleApprove(a)} className="flex-1 text-[9px] font-display tracking-wider py-1 rounded border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center gap-1">
                      <Check className="w-3 h-3" /> APPROVE
                    </button>
                    <button onClick={() => handleReject(a)} className="flex-1 text-[9px] font-display tracking-wider py-1 rounded border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center gap-1">
                      <X className="w-3 h-3" /> REJECT
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LIVE: Genius Strategist */}
      <div className="rounded-xl border border-gold/15 bg-gradient-to-br from-navy-light/40 to-navy-dark/40 p-3">
        <div className="text-[9px] font-display tracking-[0.2em] text-gold/60 mb-2">■ LIVE AGENT · GENIUS STRATEGIST</div>
        <GeniusPanel {...genius} />
      </div>
    </div>
  );
}