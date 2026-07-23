import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Layers, ChevronDown, ChevronUp, Activity, Filter, Shield, ArrowRight, Bell, Workflow, CalendarDays, Play, Pause, X, Zap, GripVertical, Plus, Trash2, Wand2, TrendingUp, TrendingDown, Sparkles, Brain, DollarSign, Search } from 'lucide-react';
import SchedulePanel from '@/components/trading/SchedulePanel';
import PriceAlerts from '@/components/trading/PriceAlerts';
import RuleBuilder from '@/components/trading/RuleBuilder';
import type { usePriceAlerts } from '@/hooks/usePriceAlerts';
import SymbolPicker from '@/components/shared/SymbolPicker';
import { PIPELINE_PRESETS, evaluate, type Pipeline, type NodeKind, type NodeSpec } from '@/lib/pipelines/nodes';
import { toast } from 'sonner';

interface Props {
  alertsHook: ReturnType<typeof usePriceAlerts>;
  resolvePrice: (t: string) => number;
  getCandleHistory: (t: string) => number[] | null;
  equity: number;
  submitOrder: (p: any) => any;
}

// Palette: only kinds registered in NodeRegistry (drag-and-droppable, guaranteed to compile/evaluate).
interface PaletteItem {
  kind: NodeKind;
  label: string;
  desc: string;
  defaults: Record<string, number | string | boolean>;
}
interface PaletteGroup {
  group: string;
  icon: React.ElementType;
  color: string;         // border/text/bg triplet for slot chrome
  chipBg: string;        // solid tint for gallery cards
  items: PaletteItem[];
}
const PALETTE: PaletteGroup[] = [
  {
    group: 'SYMBOLS', icon: Search,
    color: 'text-gold border-gold/40 bg-gold/10',
    chipBg: 'bg-gold/10 hover:bg-gold/20 border-gold/30',
    items: [
      { kind: 'context.symbol', label: 'Symbol', desc: 'Reference asset for downstream steps', defaults: { symbol: 'GLD' } },
    ],
  },
  {
    group: 'SIGNAL', icon: Activity,
    color: 'text-blue-300 border-blue-500/40 bg-blue-500/10',
    chipBg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30',
    items: [
      { kind: 'signal.rsi',       label: 'RSI',       desc: 'Mean-revert oscillator', defaults: { period: 14, oversold: 30, overbought: 70 } },
      { kind: 'signal.bollinger', label: 'Bollinger', desc: 'σ-band reversion',       defaults: { period: 20, k: 2 } },
      { kind: 'signal.donchian',  label: 'Donchian',  desc: 'Breakout channel',       defaults: { period: 20 } },
    ],
  },
  {
    group: 'TRIGGERS', icon: Bell,
    color: 'text-yellow-300 border-yellow-500/40 bg-yellow-500/10',
    chipBg: 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30',
    items: [
      { kind: 'trigger.priceAbove', label: 'Price Above',  desc: 'Fires when symbol rises N% from deploy price', defaults: { offsetPct: 2 } },
      { kind: 'trigger.priceBelow', label: 'Price Below',  desc: 'Fires when symbol drops N% from deploy price', defaults: { offsetPct: -2 } },
      { kind: 'trigger.crossover',  label: 'MA Crossover', desc: 'Fast/slow MA cross',       defaults: { fastPeriod: 9, slowPeriod: 21 } },
      { kind: 'trigger.schedule',   label: 'Schedule',     desc: 'Fires every N ticks (4s)', defaults: { everyTicks: 15, side: 'buy' } },
    ],
  },
  {
    group: 'ANALYSIS', icon: Brain,
    color: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10',
    chipBg: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30',
    items: [
      { kind: 'analysis.trend',    label: 'Analyze Trend',    desc: 'Slope over N bars',       defaults: { period: 30, strongPct: 0.01 } },
      { kind: 'analysis.momentum', label: 'Analyze Momentum', desc: 'Rate-of-change lookback', defaults: { lookback: 10, threshold: 0.005 } },
    ],
  },
  {
    group: 'PREDICT', icon: Sparkles,
    color: 'text-fuchsia-300 border-fuchsia-500/40 bg-fuchsia-500/10',
    chipBg: 'bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border-fuchsia-500/30',
    items: [
      { kind: 'predict.forecast', label: 'Forecast Price', desc: 'Linear-reg N→horizon', defaults: { period: 20, horizon: 5, threshold: 0.003 } },
    ],
  },
  {
    group: 'FILTER', icon: Filter,
    color: 'text-purple-300 border-purple-500/40 bg-purple-500/10',
    chipBg: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30',
    items: [
      { kind: 'filter.regime',     label: 'Regime',     desc: 'Trend-strength gate',     defaults: {} },
      { kind: 'filter.volatility', label: 'Volatility', desc: 'σ ceiling gate',          defaults: { period: 20, maxSigma: 0.05 } },
    ],
  },
  {
    group: 'RISK', icon: Shield,
    color: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
    chipBg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30',
    items: [
      { kind: 'risk.maxPositionPct', label: 'Position %', desc: '% equity sizer',       defaults: { pct: 0.05 } },
      { kind: 'risk.fixedUsd',       label: 'How Much $', desc: 'Fixed USD per trade',  defaults: { sizeUsd: 500 } },
      { kind: 'risk.atrStop',        label: 'ATR Stop',   desc: 'k × ATR trailing stop',defaults: { mult: 1.5 } },
    ],
  },
  {
    group: 'ACTION', icon: ArrowRight,
    color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
    chipBg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30',
    items: [
      { kind: 'action.buy',            label: 'BUY',          desc: 'Force buy this asset',  defaults: {} },
      { kind: 'action.sell',           label: 'SELL',         desc: 'Force sell this asset', defaults: {} },
      { kind: 'execution.orderIntent', label: 'Order Intent', desc: 'Combine → order', defaults: {} },
    ],
  },
  {
    group: 'MONITOR', icon: Bell,
    color: 'text-red-300 border-red-500/40 bg-red-500/10',
    chipBg: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30',
    items: [
      { kind: 'alert.notify', label: 'Alert Toast', desc: 'Ping user when upstream fires', defaults: { message: 'Pipeline event' } },
      { kind: 'monitor.log', label: 'Log', desc: 'Trace last output', defaults: { tag: 'LOG' } },
    ],
  },
];

const paletteByKind = new Map<NodeKind, { item: PaletteItem; group: PaletteGroup }>();
PALETTE.forEach(g => g.items.forEach(it => paletteByKind.set(it.kind, { item: it, group: g })));

// Node kinds that operate on a reference symbol — inserting one auto-prepends
// a context.symbol node if the workflow doesn't already carry one.
const REQUIRES_SYMBOL = new Set<NodeKind>([
  'signal.rsi',
  'signal.bollinger',
  'signal.donchian',
  'trigger.priceAbove',
  'trigger.priceBelow',
  'trigger.crossover',
  'filter.regime',
  'filter.volatility',
  'risk.atrStop',
  'analysis.trend',
  'analysis.momentum',
  'predict.forecast',
  'action.buy',
  'action.sell',
  'execution.orderIntent',
]);

// Workflow node = palette item + generated id + editable params.
interface WorkflowStep {
  id: string;
  kind: NodeKind;
  params: Record<string, number | string | boolean>;
}

// Compile linear workflow → Pipeline for the engine:
// - each non-execution node has no inputs (pure signal/filter/risk)
// - execution.orderIntent receives every prior node's id as inputs
// - monitor.log receives the immediately preceding node's id
function buildPipeline(steps: WorkflowStep[], name = 'Custom Workflow'): Pipeline {
  const nodes: NodeSpec[] = steps.map((s, idx) => {
    let inputs: string[] | undefined;
    if (s.kind === 'execution.orderIntent' || s.kind === 'alert.notify') {
      inputs = steps.slice(0, idx).map(x => x.id);
    } else if (s.kind === 'action.buy' || s.kind === 'action.sell') {
      inputs = steps.slice(0, idx).map(x => x.id);
    } else if (s.kind === 'monitor.log' && idx > 0) {
      inputs = [steps[idx - 1].id];
    }
    return { id: s.id, kind: s.kind, params: s.params, inputs };
  });
  return { id: `wf-${Date.now().toString(36)}`, name, nodes };
}

const genStepId = () => `n${Math.random().toString(36).slice(2, 8)}`;

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
  tickCount: number;
}

export default function AutomationPipelines({ alertsHook, resolvePrice, getCandleHistory, equity, submitOrder }: Props) {
  const [openLegacy, setOpenLegacy] = useState<Set<LegacyKey>>(new Set());
  const [workflowName, setWorkflowName] = useState<string>('Custom Workflow');
  const [symbol, setSymbol] = useState<string>('GLD');
  const [pipes, setPipes] = useState<RunningPipe[]>([]);
  const pipesRef = useRef<RunningPipe[]>([]);
  useEffect(() => { pipesRef.current = pipes; }, [pipes]);

  // 1s live-price tick so the settings panel reflects the current reference-symbol price.
  const [, setLiveTick] = useState(0);
  useEffect(() => { const iv = setInterval(() => setLiveTick(t => t + 1), 1000); return () => clearInterval(iv); }, []);

  // ── DRAG-AND-DROP WORKFLOW STATE ─────────────────────────────
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [dragKind, setDragKind] = useState<NodeKind | null>(null);       // dragging FROM palette
  const [dragIdx,  setDragIdx]  = useState<number | null>(null);          // dragging existing step
  const [dropIdx,  setDropIdx]  = useState<number | null>(null);          // insertion index preview
  const [editingId, setEditingId] = useState<string | null>(null);        // selected step → settings panel

  const insertStep = (kind: NodeKind, at: number) => {
    const meta = paletteByKind.get(kind);
    if (!meta) return null;
    const step: WorkflowStep = { id: genStepId(), kind, params: { ...meta.item.defaults } };
    setSteps(prev => {
      const next = [...prev];
      let target = Math.max(0, Math.min(at, next.length));
      // If this kind needs a symbol and none exists, inject one directly BEFORE the new step.
      const needsSymbol = REQUIRES_SYMBOL.has(kind) && kind !== 'context.symbol'
        && !next.some(s => s.kind === 'context.symbol');
      if (needsSymbol) {
        const symMeta = paletteByKind.get('context.symbol');
        if (symMeta) {
          next.splice(target, 0, { id: genStepId(), kind: 'context.symbol', params: { ...symMeta.item.defaults, symbol } });
          target += 1;
        }
      }
      next.splice(target, 0, step);
      return next;
    });
    setEditingId(step.id);
    return step.id;
  };
  const moveStep = (from: number, to: number) => {
    setSteps(prev => {
      const next = [...prev];
      const [it] = next.splice(from, 1);
      const clamped = Math.max(0, Math.min(to > from ? to - 1 : to, next.length));
      next.splice(clamped, 0, it);
      return next;
    });
  };
  const removeStep = (idx: number) =>
    setSteps(prev => {
      const dead = prev[idx];
      if (dead && dead.id === editingId) setEditingId(null);
      return prev.filter((_, i) => i !== idx);
    });
  const clearWorkflow = () => { setSteps([]); setEditingId(null); };
  const updateParam = (id: string, key: string, value: number | string | boolean) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, params: { ...s.params, [key]: value } } : s));
  };
  const loadPreset = (presetId: string) => {
    const p = PIPELINE_PRESETS.find(x => x.id === presetId);
    if (!p) return;
    setSteps(p.nodes
      .filter(n => paletteByKind.has(n.kind))
      .map(n => ({ id: genStepId(), kind: n.kind, params: { ...n.params } })));
    setWorkflowName(p.name);
  };

  // Deploy symbol is derived from the first context.symbol node in the workflow
  // (fallback to the local SymbolPicker below the lane).
  const workflowSymbol = useMemo(() => {
    const s = steps.find(x => x.kind === 'context.symbol');
    const t = s ? String(s.params.symbol ?? '') : '';
    return t || symbol;
  }, [steps, symbol]);

  const currentPipeline = useMemo(
    () => steps.length ? buildPipeline(steps, workflowName) : null,
    [steps, workflowName]
  );
  const hasExec = steps.some(s => s.kind === 'execution.orderIntent' || s.kind === 'action.buy' || s.kind === 'action.sell');

  // ── LIVE RUNNER — 4s tick ─────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      const list = pipesRef.current;
      if (!list.some(p => p.status === 'running')) return;
      const updated = list.map(p => {
        if (p.status !== 'running') return p;
        const price = resolvePrice(p.symbol);
        const candles = getCandleHistory(p.symbol) ?? [];
        const nextTick = p.tickCount + 1;
        if (!price || candles.length < 20) return { ...p, tickCount: nextTick, lastLog: 'waiting for data…' };
        const res = evaluate(p.pipeline, {
          symbol: p.symbol, price, candles, equity,
          now: Date.now(), tickCount: nextTick,
          basePrice: p.bootPrice || price,
        });
        if ('error' in res) return { ...p, lastLog: `error: ${res.error}` };
        let newIntents = p.intents;
        let realized = p.realized;
        let lastLog = res.logs[res.logs.length - 1] ?? 'idle';
        for (const out of Object.values(res.outputs)) {
          if ((out as any).type === 'alert') {
            const msg = (out as any).message as string;
            toast.warning(`🔔 ${p.pipeline.name} · ${p.symbol}`, { description: msg });
            lastLog = `alert: ${msg}`;
          }
        }
        for (const intent of res.intents) {
          newIntents += 1;
          const qty = Math.max(0, intent.sizeUsd / price);
          if (qty > 0) {
            try {
              const order = submitOrder({ symbol: p.symbol, side: intent.side, type: 'market', qty, price, botSource: true });
              if (order?.closedPnl !== undefined) realized += order.closedPnl;
              lastLog = `${intent.side.toUpperCase()} ${qty.toFixed(4)} @ ${price.toFixed(2)} — ${intent.reason.slice(0,60)}`;
            } catch (e) {
              lastLog = `order failed: ${(e as Error).message}`;
            }
          }
        }
        return { ...p, tickCount: nextTick, intents: newIntents, realized, lastLog };
      });
      setPipes(updated);
    }, 4000);
    return () => clearInterval(iv);
  }, [resolvePrice, getCandleHistory, equity, submitOrder]);

  const deploy = () => {
    if (!currentPipeline) return;
    const id = `pipe-${Date.now().toString(36)}`;
    const sym = workflowSymbol;
    const px = resolvePrice(sym);
    setPipes(list => [
      ...list,
      { id, pipeline: currentPipeline, symbol: sym, status: 'running', intents: 0, lastLog: 'starting…', bootPrice: px, realized: 0, tickCount: 0 },
    ]);
    toast.success(`Pipeline deployed · ${sym} · ${currentPipeline.nodes.length} nodes`);
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
          <span className="text-[9px] font-mono text-marble/25">· drag → drop → deploy · live</span>
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

      {/* ── VISUAL WORKFLOW BUILDER ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-3">
        {/* GALLERY */}
        <aside className="rounded-xl border border-gold/15 bg-gradient-to-br from-navy-light/40 to-navy-dark/60 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[9px] font-display tracking-[0.15em] text-gold/60">■ GALLERY</div>
            <div className="text-[8px] font-mono text-marble/30">drag →</div>
          </div>
          {PALETTE.map(g => {
            const Icon = g.icon;
            return (
              <div key={g.group} className="space-y-1.5">
                <div className={`flex items-center gap-1 text-[8px] font-display tracking-wider px-1.5 py-0.5 rounded border ${g.color}`}>
                  <Icon className="w-3 h-3" /> {g.group}
                </div>
                <div className="space-y-1">
                  {g.items.map(it => (
                    <div
                      key={it.kind}
                      draggable
                      onDragStart={e => { setDragKind(it.kind); setDragIdx(null); e.dataTransfer.effectAllowed = 'copy'; }}
                      onDragEnd={() => { setDragKind(null); setDropIdx(null); }}
                      onDoubleClick={() => insertStep(it.kind, steps.length)}
                      title="drag into workflow (or double-click to append)"
                      className={`group cursor-grab active:cursor-grabbing rounded border px-2 py-1.5 flex items-center gap-1.5 transition-colors ${g.chipBg}`}
                    >
                      <GripVertical className="w-3 h-3 text-marble/40 group-hover:text-marble/70" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-display tracking-wide text-marble/85 truncate">{it.label}</div>
                        <div className="text-[8px] font-mono text-marble/40 truncate">{it.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </aside>

        {/* WORKFLOW LANE */}
        <div className="rounded-xl border border-gold/15 bg-gradient-to-br from-navy-light/30 to-navy-dark/60 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="text-[9px] font-display tracking-[0.15em] text-gold/60">■ WORKFLOW</div>
            <input
              value={workflowName}
              onChange={e => setWorkflowName(e.target.value)}
              className="flex-1 bg-navy-dark/60 border border-gold/15 rounded px-2 py-1 text-[10px] font-display tracking-wider text-gold-light outline-none focus:border-gold/40 min-w-0"
              placeholder="workflow name"
            />
            <span className="text-[8px] font-mono text-marble/40 whitespace-nowrap">{steps.length} step{steps.length === 1 ? '' : 's'}</span>
            {steps.length > 0 && (
              <button onClick={clearWorkflow} title="clear workflow"
                className="text-marble/40 hover:text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
            )}
          </div>

          {/* horizontal lane — grows infinitely, scrolls when overflow */}
          <div
            className="relative overflow-x-auto pb-2"
            onDragOver={e => { if (dragKind || dragIdx != null) { e.preventDefault(); } }}
          >
            <div className="relative min-h-[110px] flex items-center gap-0" style={{ minWidth: 'max-content' }}>
              {/* baseline rail */}
              <div className="absolute left-4 right-4 top-1/2 h-[2px] bg-gradient-to-r from-gold/10 via-gold/40 to-gold/10 pointer-events-none" />

              {/* leading drop-slot */}
              <DropSlot
                active={dropIdx === 0}
                onDragOver={e => { if (dragKind || dragIdx != null) { e.preventDefault(); setDropIdx(0); } }}
                onDrop={e => {
                  e.preventDefault();
                  if (dragKind) insertStep(dragKind, 0);
                  else if (dragIdx != null) moveStep(dragIdx, 0);
                  setDragKind(null); setDragIdx(null); setDropIdx(null);
                }}
              />

              {steps.map((s, idx) => {
                const meta = paletteByKind.get(s.kind);
                if (!meta) return null;
                const Icon = meta.group.icon;
                return (
                  <Fragment key={s.id}>
                    <div
                      draggable
                      onDragStart={e => { setDragIdx(idx); setDragKind(null); e.dataTransfer.effectAllowed = 'move'; }}
                      onDragEnd={() => { setDragIdx(null); setDropIdx(null); }}
                      onClick={() => setEditingId(s.id)}
                      className={`relative z-10 shrink-0 w-40 rounded-lg border-2 px-2.5 py-2 shadow-lg backdrop-blur cursor-grab active:cursor-grabbing transition-all ${meta.group.color} ${editingId === s.id ? 'ring-2 ring-gold ring-offset-1 ring-offset-navy-dark scale-[1.03]' : 'hover:brightness-110'}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3 opacity-80" />
                        <span className="text-[10px] font-display tracking-wider truncate flex-1">{meta.item.label}</span>
                        <button onClick={(e) => { e.stopPropagation(); removeStep(idx); }} title="remove"
                          className="text-marble/40 hover:text-red-400"><X className="w-3 h-3" /></button>
                      </div>
                      <div className="text-[8px] font-mono text-marble/50 mt-0.5 truncate">{s.kind}</div>
                      <div className="text-[8px] font-mono text-marble/40 mt-1 truncate">
                        {Object.entries(s.params).slice(0, 3).map(([k, v]) => `${k}=${v}`).join(' ') || '—'}
                      </div>
                    </div>
                    <DropSlot
                      active={dropIdx === idx + 1}
                      onDragOver={e => { if (dragKind || dragIdx != null) { e.preventDefault(); setDropIdx(idx + 1); } }}
                      onDrop={e => {
                        e.preventDefault();
                        if (dragKind) insertStep(dragKind, idx + 1);
                        else if (dragIdx != null) moveStep(dragIdx, idx + 1);
                        setDragKind(null); setDragIdx(null); setDropIdx(null);
                      }}
                    />
                  </Fragment>
                );
              })}

              {/* end cap — always-visible drop hint */}
              <div className="relative z-10 shrink-0 flex items-center">
                <div
                  onDragOver={e => { if (dragKind || dragIdx != null) { e.preventDefault(); setDropIdx(steps.length); } }}
                  onDrop={e => {
                    e.preventDefault();
                    if (dragKind) insertStep(dragKind, steps.length);
                    else if (dragIdx != null) moveStep(dragIdx, steps.length);
                    setDragKind(null); setDragIdx(null); setDropIdx(null);
                  }}
                  className={`w-32 h-16 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
                    dropIdx === steps.length
                      ? 'border-gold/60 bg-gold/10 text-gold'
                      : 'border-gold/20 bg-navy-dark/40 text-marble/40 hover:border-gold/40'
                  }`}
                >
                  <Plus className="w-4 h-4 mb-0.5" />
                  <span className="text-[8px] font-display tracking-wider">DROP HERE</span>
                </div>
              </div>
            </div>
          </div>

          {steps.length === 0 && (
            <div className="text-[9px] font-mono text-marble/40 text-center py-2">
              Drag any card from the gallery onto the lane — or pick a starter below.
            </div>
          )}

          {/* SETTINGS PANEL — opens when a step is dropped or clicked */}
          {editingId && (() => {
            const step = steps.find(s => s.id === editingId);
            if (!step) return null;
            const meta = paletteByKind.get(step.kind);
            if (!meta) return null;
            const Icon = meta.group.icon;
            const keys = Object.keys(meta.item.defaults);
            return (
              <div className={`rounded-lg border-2 p-3 space-y-2 ${meta.group.color}`}>
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-display tracking-[0.15em]">{meta.item.label} · SETTINGS</span>
                  <span className="text-[8px] font-mono text-marble/50 truncate flex-1">{step.kind}</span>
                  <button onClick={() => setEditingId(null)} className="text-marble/50 hover:text-marble p-1" title="close">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-[9px] font-mono text-marble/50">{meta.item.desc}</div>
                {step.kind === 'context.symbol' ? (
                  <SymbolPicker
                    label="REFERENCE SYMBOL"
                    value={String(step.params.symbol ?? 'GLD')}
                    onChange={(t) => updateParam(step.id, 'symbol', t)}
                  />
                ) : (step.kind === 'trigger.priceAbove' || step.kind === 'trigger.priceBelow') ? (
                  <PriceTriggerSettings
                    step={step}
                    symbol={workflowSymbol}
                    livePrice={resolvePrice(workflowSymbol)}
                    onChange={(k, v) => updateParam(step.id, k, v)}
                    direction={step.kind === 'trigger.priceAbove' ? 'above' : 'below'}
                  />
                ) : keys.length === 0 ? (
                  <div className="text-[9px] font-mono text-marble/40 italic">No parameters — this block runs as-is.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {keys.map(k => {
                      const def = meta.item.defaults[k];
                      const cur = step.params[k];
                      const type = typeof def;
                      return (
                        <label key={k} className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-display tracking-wider text-marble/50 uppercase">{k}</span>
                          {type === 'boolean' ? (
                            <select
                              value={String(cur)}
                              onChange={e => updateParam(step.id, k, e.target.value === 'true')}
                              className="bg-navy-dark/70 border border-gold/20 rounded px-2 py-1 text-[10px] font-mono text-marble outline-none focus:border-gold/50"
                            >
                              <option value="true">true</option>
                              <option value="false">false</option>
                            </select>
                          ) : type === 'number' ? (
                            <input
                              type="number"
                              value={typeof cur === 'number' && Number.isFinite(cur) ? cur : ''}
                              step={String(def).includes('.') || Math.abs(Number(def)) < 1 ? 0.001 : 1}
                              onChange={e => {
                                const v = e.target.value;
                                updateParam(step.id, k, v === '' ? 0 : Number(v));
                              }}
                              className="bg-navy-dark/70 border border-gold/20 rounded px-2 py-1 text-[10px] font-mono text-marble outline-none focus:border-gold/50"
                            />
                          ) : (
                            <input
                              type="text"
                              value={String(cur ?? '')}
                              onChange={e => updateParam(step.id, k, e.target.value)}
                              className="bg-navy-dark/70 border border-gold/20 rounded px-2 py-1 text-[10px] font-mono text-marble outline-none focus:border-gold/50"
                            />
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
                <div className="text-[8px] font-mono text-marble/30 pt-1 border-t border-white/5">
                  Changes apply live — new pipeline deployments use the current values.
                </div>
              </div>
            );
          })()}

          {/* Presets */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <Wand2 className="w-3 h-3 text-gold/50" />
            <span className="text-[8px] font-display tracking-wider text-marble/40">STARTERS:</span>
            {PIPELINE_PRESETS.map(p => (
              <button key={p.id} onClick={() => loadPreset(p.id)}
                className="text-[9px] font-mono px-2 py-0.5 rounded border border-gold/15 text-marble/60 hover:border-gold/40 hover:text-gold-light">
                {p.name}
              </button>
            ))}
          </div>

          {/* Deploy row */}
          <div className="rounded-lg bg-navy-dark/60 border border-gold/10 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[8px] font-display tracking-wider text-marble/40">DEPLOY THIS WORKFLOW</div>
              {steps.length > 0 && !hasExec && (
                <span className="text-[8px] font-mono text-amber-400">add BUY, SELL, or Order Intent to fire trades</span>
              )}
            </div>
            <button
              onClick={deploy}
              disabled={!currentPipeline}
              className="w-full text-[10px] font-display tracking-[0.15em] py-2 rounded border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed text-emerald-400 flex items-center justify-center gap-2"
            >
              <Play className="w-3 h-3" /> DEPLOY PIPELINE · PAPER
            </button>
            <div className="text-[8px] font-mono text-marble/30 leading-relaxed">
              Ticks every 4s. Steps evaluated left→right via fixed registry. Execution nodes emit paper orders.
            </div>
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
                  {k === 'alerts'   && <PriceAlerts alertsHook={alertsHook} resolvePrice={resolvePrice} defaultSymbol={symbol} />}
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

function DropSlot({
  active, onDragOver, onDrop,
}: {
  active: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`relative z-10 shrink-0 flex items-center justify-center transition-all ${
        active ? 'w-16' : 'w-6'
      }`}
    >
      <div className={`transition-all rounded ${
        active
          ? 'w-full h-16 border-2 border-dashed border-gold/60 bg-gold/10'
          : 'w-4 h-[2px] bg-transparent'
      }`}>
        {active && (
          <div className="w-full h-full flex items-center justify-center text-gold/70">
            <ArrowRight className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  );
}

// Live-price aware settings for price triggers.
// User picks a mode: PERCENT (from current live price) or ABSOLUTE (specific price).
// The engine reads `offsetPct` first; when 0 it falls back to `threshold`.
function PriceTriggerSettings({
  step, symbol, livePrice, onChange, direction,
}: {
  step: WorkflowStep;
  symbol: string;
  livePrice: number;
  onChange: (key: string, value: number | string | boolean) => void;
  direction: 'above' | 'below';
}) {
  const mode = String(step.params.mode ?? (Number(step.params.threshold ?? 0) > 0 ? 'absolute' : 'percent'));
  const offsetPct = Number(step.params.offsetPct ?? (direction === 'below' ? -2 : 2));
  const threshold = Number(step.params.threshold ?? 0);
  const px = Number.isFinite(livePrice) && livePrice > 0 ? livePrice : 0;
  const derivedFromPct = px > 0 ? px * (1 + offsetPct / 100) : 0;
  const effective = mode === 'absolute' && threshold > 0 ? threshold : derivedFromPct;
  const setMode = (m: 'percent' | 'absolute') => {
    onChange('mode', m);
    if (m === 'percent') { onChange('threshold', 0); }
    else { onChange('offsetPct', 0); if (px > 0 && !threshold) onChange('threshold', Number(px.toFixed(2))); }
  };
  const quickChips = direction === 'above' ? [0.5, 1, 2, 5, 10] : [-0.5, -1, -2, -5, -10];
  return (
    <div className="space-y-2">
      {/* Live reference price */}
      <div className="flex items-center justify-between rounded border border-gold/20 bg-navy-dark/70 px-2.5 py-1.5">
        <span className="text-[8px] font-display tracking-[0.15em] text-marble/40">LIVE · {symbol || '—'}</span>
        <span className="text-[11px] font-mono tracking-wider text-gold-light">
          {px > 0 ? `$${px.toFixed(px < 10 ? 4 : 2)}` : '—'}
        </span>
      </div>
      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-1">
        <button onClick={() => setMode('percent')}
          className={`text-[9px] font-display tracking-wider py-1 rounded border ${mode === 'percent' ? 'border-gold/60 bg-gold/15 text-gold-light' : 'border-gold/15 text-marble/50 hover:border-gold/30'}`}>
          % {direction === 'above' ? 'GROWTH' : 'LOSS'}
        </button>
        <button onClick={() => setMode('absolute')}
          className={`text-[9px] font-display tracking-wider py-1 rounded border ${mode === 'absolute' ? 'border-gold/60 bg-gold/15 text-gold-light' : 'border-gold/15 text-marble/50 hover:border-gold/30'}`}>
          SPECIFIC $
        </button>
      </div>
      {mode === 'percent' ? (
        <div className="space-y-1.5">
          <label className="flex flex-col gap-0.5">
            <span className="text-[8px] font-display tracking-wider text-marble/50 uppercase">Offset %</span>
            <input
              type="number" step={0.1}
              value={Number.isFinite(offsetPct) ? offsetPct : ''}
              onChange={e => onChange('offsetPct', e.target.value === '' ? 0 : Number(e.target.value))}
              className="bg-navy-dark/70 border border-gold/20 rounded px-2 py-1 text-[10px] font-mono text-marble outline-none focus:border-gold/50"
            />
          </label>
          <div className="flex flex-wrap gap-1">
            {quickChips.map(v => (
              <button key={v} onClick={() => onChange('offsetPct', v)}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${offsetPct === v ? 'border-gold/60 text-gold-light bg-gold/10' : 'border-gold/15 text-marble/50 hover:border-gold/40'}`}>
                {v > 0 ? `+${v}%` : `${v}%`}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label className="flex flex-col gap-0.5">
            <span className="text-[8px] font-display tracking-wider text-marble/50 uppercase">Target Price ($)</span>
            <input
              type="number" step={0.01}
              value={Number.isFinite(threshold) && threshold > 0 ? threshold : ''}
              onChange={e => onChange('threshold', e.target.value === '' ? 0 : Number(e.target.value))}
              className="bg-navy-dark/70 border border-gold/20 rounded px-2 py-1 text-[10px] font-mono text-marble outline-none focus:border-gold/50"
            />
          </label>
          {px > 0 && (
            <button onClick={() => onChange('threshold', Number(px.toFixed(2)))}
              className="text-[9px] font-mono px-2 py-0.5 rounded border border-gold/20 text-marble/60 hover:border-gold/50 hover:text-gold-light">
              use live · ${px.toFixed(2)}
            </button>
          )}
        </div>
      )}
      {/* Effective threshold + delta */}
      <div className="rounded border border-white/5 bg-navy-dark/40 px-2 py-1 text-[9px] font-mono text-marble/60 flex items-center justify-between">
        <span>fires when price {direction === 'above' ? '>' : '<'} </span>
        <span className="text-gold-light">
          {effective > 0 ? `$${effective.toFixed(effective < 10 ? 4 : 2)}` : '—'}
          {px > 0 && effective > 0 && (
            <span className={`ml-1.5 ${((effective - px) / px) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ({((effective - px) / px * 100).toFixed(2)}%)
            </span>
          )}
        </span>
      </div>
    </div>
  );
}