import { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, Activity, Filter, Shield, ArrowRight, Bell, Workflow, CalendarDays } from 'lucide-react';
import SchedulePanel from '@/components/trading/SchedulePanel';
import PriceAlerts from '@/components/trading/PriceAlerts';
import RuleBuilder from '@/components/trading/RuleBuilder';
import type { usePriceAlerts } from '@/hooks/usePriceAlerts';

interface Props {
  alertsHook: ReturnType<typeof usePriceAlerts>;
}

const NODE_KINDS: Array<{ group: string; icon: React.ElementType; color: string; nodes: string[] }> = [
  { group: 'SIGNAL',    icon: Activity, color: 'text-blue-400 border-blue-500/30 bg-blue-500/5', nodes: ['signal.rsi', 'signal.macd', 'signal.bollinger', 'signal.wave', 'signal.apex'] },
  { group: 'FILTER',    icon: Filter,   color: 'text-purple-400 border-purple-500/30 bg-purple-500/5', nodes: ['filter.regime', 'filter.session', 'filter.volatility'] },
  { group: 'RISK',      icon: Shield,   color: 'text-amber-400 border-amber-500/30 bg-amber-500/5', nodes: ['risk.atrStop', 'risk.halfKelly', 'risk.maxPositionPct', 'risk.maxDD'] },
  { group: 'EXECUTION', icon: ArrowRight, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5', nodes: ['execution.orderIntent'] },
  { group: 'MONITOR',   icon: Bell,     color: 'text-red-400 border-red-500/30 bg-red-500/5', nodes: ['monitor.drawdownAlert', 'monitor.log'] },
];

const PRESETS = [
  { name: 'Half-Kelly Trend',           description: 'Donchian breakout → regime filter → half-Kelly sizer → order intent' },
  { name: 'Bollinger Reversion',        description: 'z-score entry → ADX regime gate → ATR stop → order intent' },
  { name: 'News-Aware Momentum',        description: 'Momentum rank → news-sentiment filter → position cap → order intent' },
];

type LegacyKey = 'schedule' | 'alerts' | 'rules';

export default function AutomationPipelines({ alertsHook }: Props) {
  const [openLegacy, setOpenLegacy] = useState<Set<LegacyKey>>(new Set());
  const toggle = (k: LegacyKey) => setOpenLegacy(prev => {
    const next = new Set(prev);
    if (next.has(k)) next.delete(k); else next.add(k);
    return next;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-gold" />
          <span className="text-[11px] font-display tracking-[0.2em] text-gold-light">PIPELINE BUILDER</span>
          <span className="text-[9px] font-mono text-marble/25">· typed DAG · no eval</span>
        </div>
        <span className="text-[8px] font-display tracking-wider text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-1 rounded">
          PHASE 3
        </span>
      </div>

      {/* Node palette preview */}
      <div className="rounded-xl border border-gold/15 bg-gradient-to-br from-navy-light/40 to-navy-dark/40 p-4">
        <div className="text-[9px] font-display tracking-[0.15em] text-marble/40 mb-3">NODE PALETTE</div>
        <div className="space-y-2">
          {NODE_KINDS.map(g => {
            const Icon = g.icon;
            return (
              <div key={g.group} className="flex items-center gap-2">
                <div className={`flex items-center gap-1 text-[8px] font-display tracking-wider px-2 py-1 rounded border w-24 ${g.color}`}>
                  <Icon className="w-3 h-3" /> {g.group}
                </div>
                <div className="flex flex-wrap gap-1">
                  {g.nodes.map(n => (
                    <code key={n} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-navy-dark/60 border border-gold/10 text-marble/50">
                      {n}
                    </code>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-gold/10 text-[9px] font-mono text-marble/40 leading-relaxed">
          <span className="text-gold/70">Guarantees:</span> compile via Kahn topo-sort (rejects cycles), evaluate via fixed <code className="text-gold">NodeRegistry&lt;NodeKind,PureFn&gt;</code> — never <code className="text-red-400">eval</code> or <code className="text-red-400">new Function</code>. Params are primitives validated by per-kind Zod schema. Max 50 nodes, depth ≤ 12. Execution nodes emit <code className="text-emerald-400">OrderIntent</code> objects; broker calls are gated by the server-side approval queue.
        </div>
      </div>

      {/* Preset pipelines */}
      <div>
        <div className="text-[9px] font-display tracking-[0.15em] text-marble/40 mb-2">STARTER PIPELINES</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESETS.map(p => (
            <div key={p.name} className="rounded-lg p-3 border border-gold/10 bg-navy-dark/40">
              <div className="text-[10px] font-display tracking-wider text-gold-light mb-1">{p.name}</div>
              <div className="text-[9px] font-mono text-marble/40 leading-relaxed">{p.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Legacy automations preserved from the original AUTOMATE tab */}
      <div className="pt-2 border-t border-gold/10 space-y-2">
        <div className="text-[9px] font-display tracking-[0.15em] text-marble/30">LEGACY AUTOMATIONS · PRESERVED</div>

        {(['schedule', 'alerts', 'rules'] as LegacyKey[]).map(k => {
          const meta = k === 'schedule' ? { label: 'SCHEDULED ORDERS', icon: CalendarDays }
                    : k === 'alerts'   ? { label: 'PRICE ALERTS',      icon: Bell }
                    :                    { label: 'RULE BUILDER',      icon: Layers };
          const Icon = meta.icon;
          const isOpen = openLegacy.has(k);
          return (
            <div key={k} className="rounded-lg border border-gold/10 bg-navy-dark/30 overflow-hidden">
              <button onClick={() => toggle(k)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-gold/5">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-gold/60" />
                  <span className="text-[10px] font-display tracking-wider text-marble/60">{meta.label}</span>
                </div>
                {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-marble/40" /> : <ChevronDown className="w-3.5 h-3.5 text-marble/40" />}
              </button>
              {isOpen && (
                <div className="px-3 pb-3 pt-1 border-t border-gold/10">
                  {k === 'schedule' && <SchedulePanel />}
                  {k === 'alerts'   && <PriceAlerts alertsHook={alertsHook} />}
                  {k === 'rules'    && <RuleBuilder />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}