import { Brain, Search, Shield, Scale, CheckCircle2, Clock } from 'lucide-react';
import GeniusPanel from '@/components/trading/GeniusPanel';
import type { useGeniusTrader } from '@/hooks/useGeniusTrader';

interface Props {
  genius: ReturnType<typeof useGeniusTrader>;
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

export default function AutomationAgents({ genius }: Props) {
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
          return (
            <div key={agent.key} className="rounded-lg p-3 border border-gold/10 bg-navy-dark/40">
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-gold/60" />
                  <span className="text-[10px] font-display tracking-wider text-gold-light">{agent.name}</span>
                </div>
                <span className={`text-[7px] font-display tracking-wider px-1 py-0.5 rounded border ${style}`}>
                  {agent.status}
                </span>
              </div>
              <div className="text-[9px] font-mono text-marble/50 mb-1">{agent.role}</div>
              <div className="text-[8px] font-mono text-marble/30 leading-relaxed">{agent.detail}</div>
            </div>
          );
        })}
      </div>

      {/* Approvals preview (Phase 2 placeholder) */}
      <div className="rounded-lg border border-gold/10 bg-navy-dark/30 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-display tracking-[0.15em] text-marble/40">PENDING APPROVALS</span>
          <Clock className="w-3 h-3 text-marble/30" />
        </div>
        <div className="text-[9px] font-mono text-marble/30 py-4 text-center">
          No pending trade proposals · agent approval queue ships in Phase 2
        </div>
      </div>

      {/* LIVE: Genius Strategist */}
      <div className="rounded-xl border border-gold/15 bg-gradient-to-br from-navy-light/40 to-navy-dark/40 p-3">
        <div className="text-[9px] font-display tracking-[0.2em] text-gold/60 mb-2">■ LIVE AGENT · GENIUS STRATEGIST</div>
        <GeniusPanel {...genius} />
      </div>
    </div>
  );
}