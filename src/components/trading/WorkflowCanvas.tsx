import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  TrendingUp, TrendingDown, OctagonX, CalendarClock, BellRing, BellOff,
  Zap, Waves, Brain, Shield, Target, Activity, Repeat, Timer, Trash2, Plus,
  Search, Tag, Settings2, Sparkles, Play, AlertTriangle, CheckCircle2, XCircle, Info,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ALL_SYMBOLS } from '@/data/tradingSymbols';
import {
  runWorkflow, validateWorkflow,
  type EngineLogEntry, type EngineNode, type ValidationIssue,
} from '@/lib/workflowEngine';
import type { usePaperTrading } from '@/hooks/usePaperTrading';

export interface WorkflowCanvasProps {
  paper?: ReturnType<typeof usePaperTrading>;
  getPriceByTicker?: (ticker: string) => number;
}

type NodeKind =
  | 'symbol'
  | 'buy' | 'sell' | 'stop' | 'schedule' | 'alertup' | 'alertdown'
  | 'trail' | 'hedge' | 'dca' | 'grid' | 'scalp' | 'momentum'
  | 'meanrev' | 'genius' | 'wave' | 'risk' | 'timer';

// Kinds that operate on a specific symbol — a SYMBOL node is auto-injected before them.
const SYMBOL_CONSUMERS = new Set<NodeKind>([
  'buy','sell','stop','trail','alertup','alertdown','schedule','dca','grid','scalp','momentum','meanrev','wave','genius',
]);

type GalleryItem = {
  kind: NodeKind;
  label: string;
  group: 'ACTIONS' | 'ALERTS' | 'STRATEGIES';
  Icon: React.ComponentType<{ className?: string }>;
  tint: string; // tailwind color class fragment
};

const GALLERY: GalleryItem[] = [
  { kind: 'buy',       label: 'BUY',        group: 'ACTIONS',    Icon: TrendingUp,    tint: 'emerald' },
  { kind: 'sell',      label: 'SELL',       group: 'ACTIONS',    Icon: TrendingDown,  tint: 'rose' },
  { kind: 'stop',      label: 'STOP',       group: 'ACTIONS',    Icon: OctagonX,      tint: 'red' },
  { kind: 'schedule',  label: 'SCHEDULE',   group: 'ACTIONS',    Icon: CalendarClock, tint: 'sky' },
  { kind: 'trail',     label: 'TRAIL',      group: 'ACTIONS',    Icon: Repeat,        tint: 'amber' },
  { kind: 'hedge',     label: 'HEDGE',      group: 'ACTIONS',    Icon: Shield,        tint: 'indigo' },

  { kind: 'alertup',   label: 'ALERT UP',   group: 'ALERTS',     Icon: BellRing,      tint: 'emerald' },
  { kind: 'alertdown', label: 'ALERT DOWN', group: 'ALERTS',     Icon: BellOff,       tint: 'rose' },
  { kind: 'risk',      label: 'RISK GATE',  group: 'ALERTS',     Icon: Shield,        tint: 'orange' },
  { kind: 'timer',     label: 'TIMER',      group: 'ALERTS',     Icon: Timer,         tint: 'sky' },

  { kind: 'dca',       label: 'DCA',        group: 'STRATEGIES', Icon: Activity,      tint: 'gold' },
  { kind: 'grid',      label: 'GRID',       group: 'STRATEGIES', Icon: Target,        tint: 'gold' },
  { kind: 'scalp',     label: 'SCALP',      group: 'STRATEGIES', Icon: Zap,           tint: 'gold' },
  { kind: 'momentum',  label: 'MOMENTUM',   group: 'STRATEGIES', Icon: TrendingUp,    tint: 'gold' },
  { kind: 'meanrev',   label: 'MEAN REV',   group: 'STRATEGIES', Icon: Repeat,        tint: 'gold' },
  { kind: 'genius',    label: 'GENIUS AI',  group: 'STRATEGIES', Icon: Brain,         tint: 'gold' },
  { kind: 'wave',      label: 'WAVE BOT',   group: 'STRATEGIES', Icon: Waves,         tint: 'gold' },
];

type NodeConfig = Record<string, any>;

const defaultConfigFor = (kind: NodeKind, label?: string): NodeConfig => {
  switch (kind) {
    case 'symbol':    return { symbol: label ?? 'XAU/USD', ticker: 'GLD' };
    case 'buy':
    case 'sell':      return { size: 1, orderType: 'market', limitPrice: '' };
    case 'stop':      return { stopPrice: '', trigger: 'last' };
    case 'trail':     return { trailPct: 1.0 };
    case 'hedge':     return { ratio: 0.5, instrument: 'inverse' };
    case 'schedule':  return { when: 'daily', time: '09:30' };
    case 'timer':     return { seconds: 60 };
    case 'alertup':   return { price: '', channel: 'app' };
    case 'alertdown': return { price: '', channel: 'app' };
    case 'risk':      return { maxDrawdownPct: 10, blockOnBreach: true };
    case 'dca':       return { intervalMin: 60, amount: 100 };
    case 'grid':      return { levels: 10, spacingPct: 0.5 };
    case 'scalp':     return { targetBps: 8, stopBps: 6 };
    case 'momentum':  return { lookback: 20, threshold: 1.5 };
    case 'meanrev':   return { zscore: 2, window: 50 };
    case 'wave':      return { periodSec: 80, amplitudePct: 0.4 };
    case 'genius':    return {
      prompt: 'Manage a defensive gold-tilted portfolio. Prefer mean-reversion entries during Asia session; avoid trading 5 min around US CPI. Cap per-trade risk at 0.5% of equity.',
      model: 'google/gemini-2.5-flash',
      temperature: 0.4,
      maxDrawdownPct: 20,
      autoExecute: false,
    };
    default: return {};
  }
};

type WorkflowNode = {
  id: string;
  kind: NodeKind;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  tint: string;
  config: NodeConfig;
};

const tintClasses = (tint: string) => {
  switch (tint) {
    case 'emerald': return { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', text: 'text-emerald-400' };
    case 'rose':    return { border: 'border-rose-500/40',    bg: 'bg-rose-500/10',    text: 'text-rose-400' };
    case 'red':     return { border: 'border-red-500/40',     bg: 'bg-red-500/10',     text: 'text-red-400' };
    case 'sky':     return { border: 'border-sky-500/40',     bg: 'bg-sky-500/10',     text: 'text-sky-400' };
    case 'amber':   return { border: 'border-amber-500/40',   bg: 'bg-amber-500/10',   text: 'text-amber-400' };
    case 'indigo':  return { border: 'border-indigo-500/40',  bg: 'bg-indigo-500/10',  text: 'text-indigo-400' };
    case 'orange':  return { border: 'border-orange-500/40',  bg: 'bg-orange-500/10',  text: 'text-orange-400' };
    default:        return { border: 'border-gold/40',        bg: 'bg-gold/10',        text: 'text-gold-light' };
  }
};

const STORAGE_KEY = 'ga_workflow_v1';

type PersistedNode = { id: string; kind: NodeKind; label: string; tint: string; config: NodeConfig };
const serialize = (nodes: WorkflowNode[]): PersistedNode[] =>
  nodes.map(({ id, kind, label, tint, config }) => ({ id, kind, label, tint, config }));
const hydrate = (arr: PersistedNode[]): WorkflowNode[] =>
  arr.map(p => {
    const gi = GALLERY.find(g => g.kind === p.kind);
    return { ...p, Icon: gi?.Icon ?? Tag };
  });

export default function WorkflowCanvas({ paper, getPriceByTicker }: WorkflowCanvasProps = {}) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return hydrate(JSON.parse(raw));
    } catch { /* ignore */ }
    return [];
  });
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(nodes))); } catch { /* ignore */ }
  }, [nodes]);

  const [running, setRunning] = useState(false);
  const [execLog, setExecLog] = useState<EngineLogEntry[]>([]);
  const issues: ValidationIssue[] = useMemo(() => validateWorkflow(nodes as unknown as EngineNode[]), [nodes]);
  const errorCount = issues.filter(i => i.level === 'error').length;

  const handleRun = async () => {
    if (running) return;
    setExecLog([]);
    if (!paper || !getPriceByTicker) {
      setExecLog([{ ts: Date.now(), step: 0, kind: 'symbol', status: 'error', message: 'Runtime not wired — open PIPELINE tab from Trading Bridge.' }]);
      return;
    }
    if (errorCount > 0) {
      setExecLog(issues.filter(i => i.level === 'error').map(i => ({
        ts: Date.now(), step: i.step, kind: 'symbol' as const, status: 'error' as const, message: i.message,
      })));
      return;
    }
    setRunning(true);
    try {
      await runWorkflow(
        nodes as unknown as EngineNode[],
        {
          submitOrder: (p) => {
            const o = paper.submitOrder(p);
            return { id: o.id, price: o.price, fees: o.fees };
          },
          getPriceByTicker,
          account: paper.account,
        },
        (entry) => setExecLog(prev => [...prev, entry]),
      );
    } catch (err: any) {
      setExecLog(prev => [...prev, { ts: Date.now(), step: 0, kind: 'symbol', status: 'error', message: err?.message ?? String(err) }]);
    } finally {
      setRunning(false);
    }
  };
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [symbolQuery, setSymbolQuery] = useState('');
  const [configNodeId, setConfigNodeId] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const symbolResults = useMemo(() => {
    const q = symbolQuery.trim().toLowerCase();
    const base = q
      ? ALL_SYMBOLS.filter(s =>
          s.label.toLowerCase().includes(q) ||
          s.ticker.toLowerCase().includes(q) ||
          s.key.toLowerCase().includes(q))
      : ALL_SYMBOLS.slice(0, 60);
    return base.slice(0, 60);
  }, [symbolQuery]);

  const makeNode = (kind: NodeKind, overrides?: Partial<WorkflowNode>): WorkflowNode => {
    const gi = GALLERY.find(g => g.kind === kind);
    const label = overrides?.label ?? gi?.label ?? kind.toUpperCase();
    return {
      id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind,
      label,
      Icon: overrides?.Icon ?? gi?.Icon ?? Tag,
      tint: overrides?.tint ?? gi?.tint ?? 'gold',
      config: overrides?.config ?? defaultConfigFor(kind, label),
    };
  };

  const onGalleryDragStart = (
    e: React.DragEvent,
    kind: NodeKind,
    symbolPayload?: { label: string; ticker: string },
  ) => {
    e.dataTransfer.setData('application/x-workflow-kind', kind);
    if (symbolPayload) {
      e.dataTransfer.setData('application/x-workflow-symbol', JSON.stringify(symbolPayload));
    }
    e.dataTransfer.effectAllowed = 'copy';
  };

  const onCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const kind = e.dataTransfer.getData('application/x-workflow-kind') as NodeKind;
    if (!kind) return;

    if (kind === 'symbol') {
      const raw = e.dataTransfer.getData('application/x-workflow-symbol');
      let sym = { label: 'XAU/USD', ticker: 'GLD' };
      try { if (raw) sym = JSON.parse(raw); } catch {}
      const node = makeNode('symbol', {
        label: sym.label,
        config: { symbol: sym.label, ticker: sym.ticker },
      });
      setNodes(prev => [...prev, node]);
      return;
    }

    const item = GALLERY.find(g => g.kind === kind);
    if (!item) return;
    const newNode = makeNode(kind);

    setNodes(prev => {
      // Auto-inject a SYMBOL node before a symbol-consuming action when the
      // previous step isn't already a symbol.
      const prevNode = prev[prev.length - 1];
      if (SYMBOL_CONSUMERS.has(kind) && (!prevNode || prevNode.kind !== 'symbol')) {
        const injected = makeNode('symbol', {
          label: 'XAU/USD',
          config: { symbol: 'XAU/USD', ticker: 'GLD', autoInjected: true },
        });
        return [...prev, injected, newNode];
      }
      return [...prev, newNode];
    });
  };

  const removeNode = (id: string) => setNodes(prev => prev.filter(n => n.id !== id));
  const clearAll = () => setNodes([]);

  const onNodeDragStart = (idx: number) => setDragIndex(idx);
  const onNodeDragOver = (e: React.DragEvent, idx: number) => {
    if (dragIndex === null) return;
    e.preventDefault();
    if (idx === dragIndex) return;
    setNodes(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIndex(idx);
  };

  const groups: Array<GalleryItem['group']> = ['ACTIONS', 'ALERTS', 'STRATEGIES'];
  const configNode = nodes.find(n => n.id === configNodeId) ?? null;
  const updateNodeConfig = (id: string, patch: NodeConfig) =>
    setNodes(prev => prev.map(n => n.id === id ? { ...n, config: { ...n.config, ...patch }, label: patch.symbol ?? n.label } : n));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-3">
      {/* Gallery */}
      <div className="border border-gold/20 rounded-md bg-black/40 p-2 space-y-3 max-h-[560px] overflow-y-auto">
        <div className="flex items-center justify-between px-1">
          <span className="font-display text-[10px] tracking-[0.2em] text-gold-light">GALLERY</span>
          <span className="text-[8px] font-mono text-gold/50">DRAG →</span>
        </div>

        {/* Symbols group with search */}
        <div>
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-[9px] font-mono tracking-widest text-gold/60">SYMBOLS</span>
            <span className="text-[8px] font-mono text-gold/40">{ALL_SYMBOLS.length}</span>
          </div>
          <div className="relative mb-1.5">
            <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gold/50" />
            <input
              value={symbolQuery}
              onChange={(e) => setSymbolQuery(e.target.value)}
              placeholder="Search XAU, BTC, AAPL…"
              className="w-full pl-6 pr-2 py-1 text-[9px] font-mono bg-black/60 border border-gold/20 rounded focus:border-gold/60 outline-none text-gold-light placeholder:text-gold/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-1 max-h-[160px] overflow-y-auto pr-0.5">
            {symbolResults.map(s => (
              <div
                key={s.key}
                draggable
                onDragStart={(e) => onGalleryDragStart(e, 'symbol', { label: s.label, ticker: s.ticker })}
                className="cursor-grab active:cursor-grabbing select-none flex items-center gap-1 px-1.5 py-1 rounded border border-gold/30 bg-gold/5 hover:bg-gold/15 transition"
                title={`Drag ${s.label} (${s.ticker})`}
              >
                <Tag className="w-2.5 h-2.5 text-gold" />
                <span className="text-[8px] font-mono tracking-wider text-gold-light truncate">{s.label}</span>
              </div>
            ))}
            {symbolResults.length === 0 && (
              <div className="col-span-2 text-[9px] font-mono text-gold/40 text-center py-2">No matches</div>
            )}
          </div>
        </div>

        {groups.map(group => (
          <div key={group}>
            <div className="text-[9px] font-mono tracking-widest text-gold/60 mb-1 px-1">{group}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {GALLERY.filter(g => g.group === group).map(item => {
                const t = tintClasses(item.tint);
                const Icon = item.Icon;
                return (
                  <div
                    key={item.kind + item.label}
                    draggable
                    onDragStart={(e) => onGalleryDragStart(e, item.kind)}
                    className={`cursor-grab active:cursor-grabbing select-none flex items-center gap-1.5 px-1.5 py-1.5 rounded border ${t.border} ${t.bg} hover:brightness-125 transition`}
                    title={`Drag ${item.label} into the workflow`}
                  >
                    <Icon className={`w-3 h-3 ${t.text}`} />
                    <span className={`text-[9px] font-mono tracking-wider ${t.text}`}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div className="border border-gold/20 rounded-md bg-[radial-gradient(circle,rgba(212,175,55,0.08)_1px,transparent_1px)] [background-size:14px_14px] bg-black/60 min-h-[420px] p-3 relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-display text-[10px] tracking-[0.2em] text-gold-light">WORKFLOW CHART</span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-gold/10 text-gold/70 border border-gold/20">
              {nodes.length} STEP{nodes.length === 1 ? '' : 'S'}
            </span>
          </div>
          {nodes.length > 0 && (
            <button
              onClick={clearAll}
              className="text-[9px] font-mono tracking-wider text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/60 px-2 py-0.5 rounded"
            >
              CLEAR ALL
            </button>
          )}
        </div>

        <div
          ref={dropRef}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onCanvasDrop}
          className={`rounded-md min-h-[360px] p-3 transition ${
            dragOver ? 'border-2 border-dashed border-gold/60 bg-gold/5' : 'border border-dashed border-gold/20'
          }`}
        >
          {nodes.length === 0 ? (
            <div className="h-[340px] flex flex-col items-center justify-center gap-2 text-center">
              <Plus className="w-6 h-6 text-gold/40" />
              <div className="text-[11px] font-mono tracking-wider text-gold/60">
                DRAG ITEMS FROM THE GALLERY TO BUILD YOUR WORKFLOW
              </div>
              <div className="text-[9px] font-mono text-gold/40">
                Chain actions, alerts and strategies into an automated pipeline
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-stretch gap-0">
              {nodes.map((n, idx) => {
                const t = tintClasses(n.tint);
                const Icon = n.Icon;
                return (
                  <React.Fragment key={n.id}>
                    <div
                      draggable
                      onDragStart={() => onNodeDragStart(idx)}
                      onDragOver={(e) => onNodeDragOver(e, idx)}
                      onDragEnd={() => setDragIndex(null)}
                      onClick={() => setConfigNodeId(n.id)}
                      className={`group relative cursor-pointer flex flex-col items-center justify-center w-[110px] h-[78px] rounded-md border ${t.border} ${t.bg} shadow-[0_0_12px_rgba(212,175,55,0.08)] animate-scale-in hover:brightness-125`}
                      title="Click to configure · drag to reorder"
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); removeNode(n.id); }}
                        className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition bg-black border border-rose-500/60 rounded-full p-0.5"
                        title="Remove"
                      >
                        <Trash2 className="w-2.5 h-2.5 text-rose-400" />
                      </button>
                      <Settings2 className="absolute top-1 left-1 w-2.5 h-2.5 text-gold/30 group-hover:text-gold/70 transition" />
                      <Icon className={`w-5 h-5 ${t.text} mb-1`} />
                      <span className={`text-[9px] font-mono tracking-wider ${t.text}`}>{n.label}</span>
                      <span className="text-[7px] font-mono text-gold/40 mt-0.5">
                        STEP {idx + 1}{n.config?.autoInjected ? ' · AUTO' : ''}
                      </span>
                    </div>
                    {idx < nodes.length - 1 && (
                      <div className="flex items-center justify-center w-6 h-[78px]">
                        <svg width="24" height="12" viewBox="0 0 24 12" className="text-gold/50">
                          <line x1="0" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
                          <polygon points="18,2 24,6 18,10" fill="currentColor" />
                        </svg>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {nodes.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleRun}
                disabled={running || errorCount > 0}
                className="flex items-center gap-1 text-[9px] font-mono tracking-widest text-gold-light border border-gold/40 bg-gold/10 hover:bg-gold/20 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1 rounded"
              >
                <Play className="w-3 h-3" /> {running ? 'RUNNING…' : 'RUN WORKFLOW'}
              </button>
              <button
                onClick={() => setExecLog([])}
                className="text-[9px] font-mono tracking-widest text-gold/70 border border-gold/20 hover:border-gold/40 px-3 py-1 rounded"
              >
                CLEAR LOG
              </button>
              <span className="text-[8px] font-mono text-gold/50 ml-auto flex items-center gap-2">
                {errorCount > 0 ? (
                  <span className="flex items-center gap-1 text-rose-400">
                    <AlertTriangle className="w-3 h-3" /> {errorCount} ISSUE{errorCount === 1 ? '' : 'S'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> VALID
                  </span>
                )}
                <span className="text-gold/40">·</span>
                <span>{paper ? `PAPER $${paper.account.equity.toFixed(0)}` : 'RUNTIME OFF'}</span>
              </span>
            </div>

            {issues.length > 0 && (
              <div className="border border-rose-500/20 bg-rose-500/5 rounded p-2 space-y-0.5 max-h-24 overflow-y-auto">
                {issues.map((i, idx) => (
                  <div key={idx} className={`text-[9px] font-mono flex items-start gap-1 ${i.level === 'error' ? 'text-rose-300' : 'text-amber-300'}`}>
                    {i.level === 'error' ? <XCircle className="w-2.5 h-2.5 mt-0.5" /> : <AlertTriangle className="w-2.5 h-2.5 mt-0.5" />}
                    <span>STEP {i.step}: {i.message}</span>
                  </div>
                ))}
              </div>
            )}

            {execLog.length > 0 && (
              <div className="border border-gold/20 bg-black/60 rounded p-2 max-h-40 overflow-y-auto space-y-0.5">
                <div className="text-[9px] font-mono tracking-widest text-gold/60 mb-1">EXECUTION LOG</div>
                {execLog.map((e, idx) => {
                  const color =
                    e.status === 'ok' ? 'text-emerald-300' :
                    e.status === 'error' ? 'text-rose-300' :
                    e.status === 'skip' ? 'text-amber-300' :
                    'text-gold/70';
                  const IconEl =
                    e.status === 'ok' ? CheckCircle2 :
                    e.status === 'error' ? XCircle :
                    e.status === 'skip' ? AlertTriangle :
                    Info;
                  return (
                    <div key={idx} className={`text-[9px] font-mono flex items-start gap-1 ${color}`}>
                      <IconEl className="w-2.5 h-2.5 mt-0.5" />
                      <span className="text-gold/40 w-12 shrink-0">STEP {e.step}</span>
                      <span className="uppercase w-16 shrink-0 text-gold/50">{e.kind}</span>
                      <span className="flex-1">{e.message}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Config dialog */}
      <Dialog open={!!configNode} onOpenChange={(o) => { if (!o) setConfigNodeId(null); }}>
        <DialogContent className="max-w-md bg-black border-gold/40">
          <DialogHeader>
            <DialogTitle className="font-display tracking-[0.15em] text-gold-light flex items-center gap-2">
              {configNode && <configNode.Icon className="w-4 h-4 text-gold" />}
              CONFIGURE · {configNode?.label}
            </DialogTitle>
          </DialogHeader>
          {configNode && (
            <NodeConfigForm
              node={configNode}
              onChange={(patch) => updateNodeConfig(configNode.id, patch)}
              contextTicker={(() => {
                if (!configNode) return null;
                if (configNode.kind === 'symbol') return configNode.config?.ticker ?? null;
                const idx = nodes.findIndex(n => n.id === configNode.id);
                for (let i = idx - 1; i >= 0; i--) {
                  if (nodes[i].kind === 'symbol') return nodes[i].config?.ticker ?? null;
                }
                return null;
              })()}
              getPriceByTicker={getPriceByTicker}
            />
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { if (configNode) removeNode(configNode.id); setConfigNodeId(null); }}
              className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
            >
              <Trash2 className="w-3 h-3 mr-1" /> Delete
            </Button>
            <Button onClick={() => setConfigNodeId(null)} className="bg-gold/20 text-gold-light border border-gold/40 hover:bg-gold/30">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Per-kind configuration form ─────────────────────────
// LivePriceReadout was extracted into the reusable <LivePriceIndicator />
// module at src/components/trading/LivePriceIndicator.tsx so it can be
// dropped into any widget across the app.

function NodeConfigForm({
  node,
  onChange,
  contextTicker,
  getPriceByTicker,
}: {
  node: WorkflowNode;
  onChange: (patch: NodeConfig) => void;
  contextTicker?: string | null;
  getPriceByTicker?: (t: string) => number;
}) {
  const c = node.config ?? {};
  const num = (v: any) => (v === '' || v == null ? '' : Number(v));
  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1">
      <Label className="text-[10px] font-mono tracking-wider text-gold/70">{label}</Label>
      {children}
    </div>
  );
  const tickerForLive = node.kind === 'symbol' ? (c.ticker ?? null) : (contextTicker ?? null);
  const showLive = ['symbol','buy','sell','stop','trail','alertup','alertdown'].includes(node.kind);
  const livePrice = tickerForLive && getPriceByTicker ? getPriceByTicker(tickerForLive) : 0;
  const fillFromLive = (field: string) => {
    if (livePrice > 0) onChange({ [field]: Number(livePrice.toFixed(livePrice < 10 ? 4 : 2)) });
  };
  const LiveBlock = showLive ? (
    <LivePriceIndicator ticker={tickerForLive} getPriceByTicker={getPriceByTicker} />
  ) : null;
  const UseLiveBtn = ({ field }: { field: string }) => (
    <button
      type="button"
      disabled={!(livePrice > 0)}
      onClick={() => fillFromLive(field)}
      className="text-[8px] font-mono tracking-wider text-gold-light border border-gold/40 hover:bg-gold/10 disabled:opacity-30 px-1.5 py-0.5 rounded"
    >
      USE LIVE
    </button>
  );

  if (node.kind === 'symbol') {
    return (
      <div className="space-y-3">
        {LiveBlock}
        <F label="SYMBOL">
          <Input value={c.symbol ?? ''} onChange={(e) => onChange({ symbol: e.target.value })} />
        </F>
        <F label="TICKER">
          <Input value={c.ticker ?? ''} onChange={(e) => onChange({ ticker: e.target.value })} />
        </F>
        <p className="text-[9px] font-mono text-gold/50">
          This symbol becomes the context for the next action in the chain.
        </p>
      </div>
    );
  }

  if (node.kind === 'buy' || node.kind === 'sell') {
    return (
      <div className="space-y-3">
        {LiveBlock}
        <F label="SIZE (units)"><Input type="number" value={c.size ?? ''} onChange={(e) => onChange({ size: num(e.target.value) })} /></F>
        <F label="ORDER TYPE">
          <select value={c.orderType} onChange={(e) => onChange({ orderType: e.target.value })}
            className="w-full bg-black border border-gold/30 rounded px-2 py-1 text-xs text-gold-light">
            <option value="market">Market</option>
            <option value="limit">Limit</option>
            <option value="stop">Stop</option>
          </select>
        </F>
        {c.orderType !== 'market' && (
          <F label="LIMIT / STOP PRICE">
            <div className="flex gap-1">
              <Input type="number" value={c.limitPrice ?? ''} onChange={(e) => onChange({ limitPrice: num(e.target.value) })} />
              <UseLiveBtn field="limitPrice" />
            </div>
          </F>
        )}
        {c.orderType === 'market' && livePrice > 0 && (
          <p className="text-[9px] font-mono text-gold/50">
            Est. fill ≈ ${livePrice.toLocaleString('en-US', { maximumFractionDigits: livePrice < 10 ? 4 : 2 })}
            {' · '}notional ≈ ${(livePrice * Number(c.size || 0)).toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
        )}
      </div>
    );
  }

  if (node.kind === 'stop') {
    return (
      <div className="space-y-3">
        {LiveBlock}
        <F label="STOP PRICE">
          <div className="flex gap-1">
            <Input type="number" value={c.stopPrice ?? ''} onChange={(e) => onChange({ stopPrice: num(e.target.value) })} />
            <UseLiveBtn field="stopPrice" />
          </div>
        </F>
        <F label="TRIGGER">
          <select value={c.trigger} onChange={(e) => onChange({ trigger: e.target.value })}
            className="w-full bg-black border border-gold/30 rounded px-2 py-1 text-xs text-gold-light">
            <option value="last">Last price</option>
            <option value="bid">Bid</option>
            <option value="ask">Ask</option>
          </select>
        </F>
      </div>
    );
  }

  if (node.kind === 'trail') {
    return (
      <div className="space-y-3">
        {LiveBlock}
        <F label={`TRAIL DISTANCE — ${c.trailPct}%`}>
          <Slider value={[c.trailPct ?? 1]} min={0.1} max={10} step={0.1}
            onValueChange={(v) => onChange({ trailPct: v[0] })} />
        </F>
        {livePrice > 0 && (
          <p className="text-[9px] font-mono text-gold/50">
            Trail trigger ≈ ${(livePrice * (1 - (c.trailPct ?? 1) / 100)).toLocaleString('en-US', { maximumFractionDigits: livePrice < 10 ? 4 : 2 })}
          </p>
        )}
      </div>
    );
  }

  if (node.kind === 'alertup' || node.kind === 'alertdown') {
    return (
      <div className="space-y-3">
        {LiveBlock}
        <F label={node.kind === 'alertup' ? 'ALERT ABOVE' : 'ALERT BELOW'}>
          <div className="flex gap-1">
            <Input type="number" value={c.price ?? ''} onChange={(e) => onChange({ price: num(e.target.value) })} />
            <UseLiveBtn field="price" />
          </div>
        </F>
        <F label="CHANNEL">
          <select value={c.channel} onChange={(e) => onChange({ channel: e.target.value })}
            className="w-full bg-black border border-gold/30 rounded px-2 py-1 text-xs text-gold-light">
            <option value="app">In-app</option>
            <option value="email">Email</option>
            <option value="push">Push</option>
          </select>
        </F>
      </div>
    );
  }

  if (node.kind === 'schedule') {
    return (
      <div className="space-y-3">
        <F label="FREQUENCY">
          <select value={c.when} onChange={(e) => onChange({ when: e.target.value })}
            className="w-full bg-black border border-gold/30 rounded px-2 py-1 text-xs text-gold-light">
            <option value="once">Once</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="market-open">Market open</option>
            <option value="market-close">Market close</option>
          </select>
        </F>
        <F label="TIME"><Input type="time" value={c.time ?? ''} onChange={(e) => onChange({ time: e.target.value })} /></F>
      </div>
    );
  }

  if (node.kind === 'timer') {
    return (
      <div className="space-y-3">
        <F label={`WAIT — ${c.seconds}s`}>
          <Slider value={[c.seconds ?? 60]} min={1} max={3600} step={1}
            onValueChange={(v) => onChange({ seconds: v[0] })} />
        </F>
      </div>
    );
  }

  if (node.kind === 'risk') {
    return (
      <div className="space-y-3">
        <F label={`MAX DRAWDOWN — ${c.maxDrawdownPct}%`}>
          <Slider value={[c.maxDrawdownPct ?? 10]} min={1} max={50} step={0.5}
            onValueChange={(v) => onChange({ maxDrawdownPct: v[0] })} />
        </F>
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-mono tracking-wider text-gold/70">HARD-STOP ON BREACH</Label>
          <Switch checked={!!c.blockOnBreach} onCheckedChange={(v) => onChange({ blockOnBreach: v })} />
        </div>
      </div>
    );
  }

  if (node.kind === 'dca') {
    return (
      <div className="space-y-3">
        <F label="INTERVAL (min)"><Input type="number" value={c.intervalMin ?? ''} onChange={(e) => onChange({ intervalMin: num(e.target.value) })} /></F>
        <F label="AMOUNT ($)"><Input type="number" value={c.amount ?? ''} onChange={(e) => onChange({ amount: num(e.target.value) })} /></F>
      </div>
    );
  }

  if (node.kind === 'grid') {
    return (
      <div className="space-y-3">
        <F label="LEVELS"><Input type="number" value={c.levels ?? ''} onChange={(e) => onChange({ levels: num(e.target.value) })} /></F>
        <F label={`SPACING — ${c.spacingPct}%`}>
          <Slider value={[c.spacingPct ?? 0.5]} min={0.05} max={5} step={0.05}
            onValueChange={(v) => onChange({ spacingPct: v[0] })} />
        </F>
      </div>
    );
  }

  if (node.kind === 'scalp') {
    return (
      <div className="space-y-3">
        <F label={`TARGET — ${c.targetBps} bps`}>
          <Slider value={[c.targetBps ?? 8]} min={1} max={100} step={1}
            onValueChange={(v) => onChange({ targetBps: v[0] })} />
        </F>
        <F label={`STOP — ${c.stopBps} bps`}>
          <Slider value={[c.stopBps ?? 6]} min={1} max={100} step={1}
            onValueChange={(v) => onChange({ stopBps: v[0] })} />
        </F>
      </div>
    );
  }

  if (node.kind === 'momentum') {
    return (
      <div className="space-y-3">
        <F label="LOOKBACK BARS"><Input type="number" value={c.lookback ?? ''} onChange={(e) => onChange({ lookback: num(e.target.value) })} /></F>
        <F label={`THRESHOLD — ${c.threshold}σ`}>
          <Slider value={[c.threshold ?? 1.5]} min={0.5} max={5} step={0.1}
            onValueChange={(v) => onChange({ threshold: v[0] })} />
        </F>
      </div>
    );
  }

  if (node.kind === 'meanrev') {
    return (
      <div className="space-y-3">
        <F label={`Z-SCORE — ${c.zscore}`}>
          <Slider value={[c.zscore ?? 2]} min={0.5} max={5} step={0.1}
            onValueChange={(v) => onChange({ zscore: v[0] })} />
        </F>
        <F label="WINDOW"><Input type="number" value={c.window ?? ''} onChange={(e) => onChange({ window: num(e.target.value) })} /></F>
      </div>
    );
  }

  if (node.kind === 'wave') {
    return (
      <div className="space-y-3">
        <F label={`PERIOD — ${c.periodSec}s`}>
          <Slider value={[c.periodSec ?? 80]} min={10} max={600} step={5}
            onValueChange={(v) => onChange({ periodSec: v[0] })} />
        </F>
        <F label={`AMPLITUDE — ${c.amplitudePct}%`}>
          <Slider value={[c.amplitudePct ?? 0.4]} min={0.05} max={5} step={0.05}
            onValueChange={(v) => onChange({ amplitudePct: v[0] })} />
        </F>
      </div>
    );
  }

  if (node.kind === 'hedge') {
    return (
      <div className="space-y-3">
        <F label={`HEDGE RATIO — ${c.ratio}`}>
          <Slider value={[c.ratio ?? 0.5]} min={0} max={2} step={0.05}
            onValueChange={(v) => onChange({ ratio: v[0] })} />
        </F>
        <F label="INSTRUMENT">
          <select value={c.instrument} onChange={(e) => onChange({ instrument: e.target.value })}
            className="w-full bg-black border border-gold/30 rounded px-2 py-1 text-xs text-gold-light">
            <option value="inverse">Inverse ETF</option>
            <option value="option">Options</option>
            <option value="future">Futures</option>
          </select>
        </F>
      </div>
    );
  }

  if (node.kind === 'genius') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-mono text-gold/70 border border-gold/20 rounded bg-gold/5 px-2 py-1">
          <Sparkles className="w-3 h-3 text-gold" />
          AI STRATEGIST — configure how Genius reasons about this workflow.
        </div>
        <F label="PROMPT">
          <Textarea
            value={c.prompt ?? ''}
            onChange={(e) => onChange({ prompt: e.target.value })}
            rows={5}
            placeholder="Describe strategy, risk appetite, market context, constraints…"
          />
        </F>
        <F label="MODEL">
          <select value={c.model} onChange={(e) => onChange({ model: e.target.value })}
            className="w-full bg-black border border-gold/30 rounded px-2 py-1 text-xs text-gold-light">
            <option value="google/gemini-2.5-flash">Gemini 2.5 Flash (fast)</option>
            <option value="google/gemini-2.5-pro">Gemini 2.5 Pro (deep)</option>
            <option value="openai/gpt-5">GPT-5 (reasoning)</option>
            <option value="openai/gpt-5-mini">GPT-5 Mini</option>
          </select>
        </F>
        <F label={`TEMPERATURE — ${c.temperature}`}>
          <Slider value={[c.temperature ?? 0.4]} min={0} max={1} step={0.05}
            onValueChange={(v) => onChange({ temperature: v[0] })} />
        </F>
        <F label={`MAX DRAWDOWN — ${c.maxDrawdownPct}%`}>
          <Slider value={[c.maxDrawdownPct ?? 20]} min={1} max={50} step={0.5}
            onValueChange={(v) => onChange({ maxDrawdownPct: v[0] })} />
        </F>
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-mono tracking-wider text-gold/70">AUTO-EXECUTE DECISIONS</Label>
          <Switch checked={!!c.autoExecute} onCheckedChange={(v) => onChange({ autoExecute: v })} />
        </div>
      </div>
    );
  }

  return <p className="text-[10px] font-mono text-gold/50">No configuration available.</p>;
}