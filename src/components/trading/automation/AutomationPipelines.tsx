import { useEffect, useMemo, useRef, useState } from 'react';
import { Layers, ChevronDown, ChevronUp, Activity, Filter, Shield, ArrowRight, Bell, Workflow, CalendarDays, Play, Pause, X, Zap } from 'lucide-react';
import SchedulePanel from '@/components/trading/SchedulePanel';
import PriceAlerts from '@/components/trading/PriceAlerts';
import RuleBuilder from '@/components/trading/RuleBuilder';
import type { usePriceAlerts } from '@/hooks/usePriceAlerts';
import SymbolPicker from '@/components/shared/SymbolPicker';
import { PIPELINE_PRESETS, evaluate, type Pipeline } from '@/lib/pipelines/nodes';

interface Props {
  alertsHook: ReturnType<typeof usePriceAlerts>;
  resolvePrice: (t: string) => number;
  getCandleHistory: (t: string) => number[] | null;
  equity: number;
  submitOrder: (p: any) => any;
}

const NODE_KINDS: Array<{ group: string; icon: React.ElementType; color: string; nodes: string[] }> = [
  { group: 'SIGNAL',    icon: Activity, color: 'text-blue-400 border-blue-500/30 bg-blue-500/5', nodes: ['signal.rsi', 'signal.macd', 'signal.bollinger', 'signal.wave', 'signal.apex'] },
  { group: 'FILTER',    icon: Filter,   color: 'text-purple-400 border-purple-500/30 bg-purple-500/5', nodes: ['filter.regime', 'filter.session', 'filter.volatility'] },
  { group: 'RISK',      icon: Shield,   color: 'text-amber-400 border-amber-500/30 bg-amber-500/5', nodes: ['risk.atrStop', 'risk.halfKelly', 'risk.maxPositionPct', 'risk.maxDD'] },
  { group: 'EXECUTION', icon: ArrowRight, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5', nodes: ['execution.orderIntent'] },
  { group: 'MONITOR',   icon: Bell,     color: 'text-red-400 border-red-500/30 bg-red-500/5', nodes: ['monitor.drawdownAlert', 'monitor.log'] },
];

type LegacyKey = 'schedule' | 'alerts' | 'rules';

interface RunningPipe {
  id: string;
  pipeline: Pipeline;
  symbol: string;
  status: 'running' | 'paused' | 'killed';
  intents: number;
  lastLog: string;
  bootPrice: number;
  realized: number;
}

export default function AutomationPipelines({ alertsHook, resolvePrice, getCandleHistory, equity, submitOrder }: Props) {
  const [openLegacy, setOpenLegacy] = useState<Set<LegacyKey>>(new Set());
  const [selectedId, setSelectedId] = useState<string>(PIPELINE_PRESETS[0].id);
  const [symbol, setSymbol] = useState<string>('GLD');
  const [pipes, setPipes] = useState<RunningPipe[]>([]);
  const pipesRef = useRef<RunningPipe[]>([]);
  useEffect(() => { pipesRef.current = pipes; }, [pipes]);

  const selected = useMemo(() => PIPELINE_PRESETS.find(p => p.id === selectedId)!, [selectedId]);

  // ── LIVE RUNNER — 4s tick ─────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      const list = pipesRef.current;
      if (!list.some(p => p.status === 'running')) return;
      const updated = list.map(p => {
        if (p.status !== 'running') return p;
        const price = resolvePrice(p.symbol);
        const candles = getCandleHistory(p.symbol) ?? [];
        if (!price || candles.length < 20) return { ...p, lastLog: 'waiting for data…' };
        const res = evaluate(p.pipeline, { symbol: p.symbol, price, candles, equity });
        if ('error' in res) return { ...p, lastLog: `error: ${res.error}` };
        let newIntents = p.intents;
        let realized = p.realized;
        let lastLog = res.logs[res.logs.length - 1] ?? 'idle';
        for (const intent of res.intents) {
          newIntents += 1;
          const qty = Math.max(0, intent.sizeUsd / price);
          if (qty > 0) {
            try {
              submitOrder({ symbol: p.symbol, side: intent.side, type: 'market', qty, source: 'pipeline' });
              realized += 0; // realized tracked by paper engine
              lastLog = `${intent.side.toUpperCase()} ${qty.toFixed(4)} @ ${price.toFixed(2)} — ${intent.reason.slice(0,60)}`;
            } catch (e) {
              lastLog = `order failed: ${(e as Error).message}`;
            }
          }
        }
        return { ...p, intents: newIntents, realized, lastLog };
      });
      setPipes(updated);
    }, 4000);
    return () => clearInterval(iv);
  }, [resolvePrice, getCandleHistory, equity, submitOrder]);

  const deploy = () => {
    const id = `pipe-${Date.now().toString(36)}`;
    const px = resolvePrice(symbol);
    setPipes(list => [
      ...list,
      { id, pipeline: selected, symbol, status: 'running', intents: 0, lastLog: 'starting…', bootPrice: px, realized: 0 },
    ]);
  };

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
          <span className="text-[9px] font-mono text-marble/25">· typed DAG · no eval · live</span>
        </div>
        <div className="text-[9px] font-mono text-marble/40">
          <span className="text-emerald-400">{pipes.filter(p => p.status === 'running').length}</span>/{pipes.length} running
        </div>
      </div>

      {/* RUNNING PIPELINES */}
      {pipes.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1.5">
          <div className="text-[9px] font-display tracking-[0.15em] text-emerald-400">■ RUNNING PIPELINES</div>
          {pipes.map(p => (
            <div key={p.id} className="rounded-lg border border-gold/10 bg-navy-dark/40 px-2.5 py-2 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-gold/60 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-display tracking-wider text-gold-light">{p.pipeline.name}</span>
                  <span className="text-[9px] font-mono text-marble/60">{p.symbol}</span>
                  <span className={`text-[8px] font-display tracking-wider px-1 py-0.5 rounded border ${
                    p.status === 'running' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                    : p.status === 'paused' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                    : 'text-red-400 border-red-500/30 bg-red-500/10'
                  }`}>{p.status.toUpperCase()}</span>
                </div>
                <div className="text-[8px] font-mono text-marble/40 truncate">
                  intents {p.intents} · {p.lastLog}
                </div>
              </div>
              {p.status === 'running' && (
                <button onClick={() => setPipes(list => list.map(x => x.id === p.id ? { ...x, status: 'paused' } : x))}
                  className="text-marble/50 hover:text-amber-400 p-1" title="pause">
                  <Pause className="w-3 h-3" />
                </button>
              )}
              {p.status === 'paused' && (
                <button onClick={() => setPipes(list => list.map(x => x.id === p.id ? { ...x, status: 'running' } : x))}
                  className="text-marble/50 hover:text-emerald-400 p-1" title="resume">
                  <Play className="w-3 h-3" />
                </button>
              )}
              <button onClick={() => setPipes(list => list.filter(x => x.id !== p.id))}
                className="text-marble/50 hover:text-red-400 p-1" title="remove">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

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

      {/* Preset pipelines + deploy */}
      <div>
        <div className="text-[9px] font-display tracking-[0.15em] text-marble/40 mb-2">STARTER PIPELINES</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          {PIPELINE_PRESETS.map(p => {
            const isActive = p.id === selectedId;
            return (
              <button key={p.id} onClick={() => setSelectedId(p.id)}
                className={`text-left rounded-lg p-3 border transition-all ${
                  isActive
                    ? 'border-gold/40 bg-gradient-to-br from-gold/10 to-gold/5 shadow-lg shadow-gold/10'
                    : 'border-gold/10 bg-navy-dark/40 hover:border-gold/25'
                }`}>
                <div className="text-[10px] font-display tracking-wider text-gold-light mb-1">{p.name}</div>
                <div className="text-[9px] font-mono text-marble/40 leading-relaxed">
                  {p.nodes.map(n => n.kind.split('.')[1] ?? n.kind).join(' → ')}
                </div>
              </button>
            );
          })}
        </div>
        <div className="rounded-lg bg-navy-dark/60 border border-gold/10 p-3 space-y-2">
          <div className="text-[8px] font-display tracking-wider text-marble/40">DEPLOY {selected.name.toUpperCase()}</div>
          <SymbolPicker label="SYMBOL" value={symbol} onChange={setSymbol} />
          <button onClick={deploy}
            className="w-full text-[10px] font-display tracking-[0.15em] py-2 rounded border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center gap-2">
            <Play className="w-3 h-3" /> DEPLOY PIPELINE · PAPER
          </button>
          <div className="text-[8px] font-mono text-marble/30 leading-relaxed">
            Ticks every 4s. Nodes evaluated in topo order via fixed registry. Intents submit market orders through paper engine.
          </div>
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