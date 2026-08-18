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
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ALL_SYMBOLS } from '@/data/tradingSymbols';
import SymbolLogo from '@/components/trading/SymbolLogo';
import GeniusAssistant, { type GeniusAction } from '@/components/pipeline/GeniusAssistant';
import {
  runWorkflow, validateWorkflow,
  type EngineLogEntry, type EngineNode, type ValidationIssue,
} from '@/lib/workflowEngine';
import type { usePaperTrading } from '@/hooks/usePaperTrading';
import { CurrencyAmountField } from '@/components/trading/CurrencyAmountField';
import { LivePriceIndicator } from './LivePriceIndicator';

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
    case 'sell':      return { amount: 1000, currency: 'USD', amountUsd: 1000, orderType: 'market', limitPrice: '' };
    case 'stop':      return { stopPrice: '', trigger: 'last' };
    case 'trail':     return { trailPct: 1.0 };
    case 'hedge':     return { ratio: 0.5, instrument: 'inverse' };
    case 'schedule':  return { when: 'daily', time: '09:30', date: '', endDate: '' };
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
  const stopRef = useRef(false);
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
    stopRef.current = false;
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
          shouldStop: () => stopRef.current,
        },
        (entry) => setExecLog(prev => [...prev, entry]),
      );
    } catch (err: any) {
      setExecLog(prev => [...prev, { ts: Date.now(), step: 0, kind: 'symbol', status: 'error', message: err?.message ?? String(err) }]);
    } finally {
      setRunning(false);
      stopRef.current = false;
    }
  };

  const handleStop = () => {
    if (!running) return;
    stopRef.current = true;
    setExecLog(prev => [...prev, { ts: Date.now(), step: 0, kind: 'symbol', status: 'skip', message: 'STOP requested — halting after current step.' }]);
  };
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [symbolQuery, setSymbolQuery] = useState('');
  const [symbolCat, setSymbolCat] = useState<string>('all');
  const [symbolLimit, setSymbolLimit] = useState(40);
  const [configNodeId, setConfigNodeId] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const symbolCats = useMemo(
    () => ['all', ...Array.from(new Set(ALL_SYMBOLS.map(s => s.cat))).sort()],
    [],
  );

  const symbolMatches = useMemo(() => {
    const q = symbolQuery.trim().toLowerCase();
    return ALL_SYMBOLS.filter(s =>
      (symbolCat === 'all' || s.cat === symbolCat) &&
      (!q ||
        s.label.toLowerCase().includes(q) ||
        s.ticker.toLowerCase().includes(q) ||
        s.key.toLowerCase().includes(q)));
  }, [symbolQuery, symbolCat]);

  const symbolResults = symbolMatches.slice(0, symbolLimit);

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

  /** Click-to-add: same semantics as dropping the item on the canvas. */
  const addSymbolNode = (sym: { label: string; ticker: string }) => {
    setNodes(prev => [
      ...prev,
      makeNode('symbol', { label: sym.label, config: { symbol: sym.label, ticker: sym.ticker } }),
    ]);
  };

  const addKindNode = (kind: NodeKind) => {
    const newNode = makeNode(kind);
    setNodes(prev => {
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

  /** Apply structured actions returned by the Genius copilot. */
  const applyGeniusActions = (actions: GeniusAction[]) => {
    let shouldRun = false;
    for (const a of actions) {
      switch (a.op) {
        case 'clear':
          setNodes([]);
          break;
        case 'replace_all':
          setNodes((a.nodes ?? []).map(n =>
            makeNode(n.kind as NodeKind, {
              label: n.label,
              config: { ...defaultConfigFor(n.kind as NodeKind, n.label), ...(n.config ?? {}) },
            })));
          break;
        case 'add_node': {
          if (!a.kind) break;
          const node = makeNode(a.kind as NodeKind, {
            label: a.label,
            config: { ...defaultConfigFor(a.kind as NodeKind, a.label), ...(a.config ?? {}) },
          });
          setNodes(prev => {
            const next = [...prev];
            const at = typeof a.index === 'number' ? Math.max(0, Math.min(a.index, next.length)) : next.length;
            next.splice(at, 0, node);
            return next;
          });
          break;
        }
        case 'update_node':
          setNodes(prev => prev.map((n, i) =>
            i === a.index ? { ...n, label: (a.config?.symbol as string) ?? a.label ?? n.label, config: { ...n.config, ...(a.config ?? {}) } } : n));
          break;
        case 'remove_node':
          setNodes(prev => prev.filter((_, i) => i !== a.index));
          break;
        case 'run':
          shouldRun = true;
          break;
        case 'stop':
          handleStop();
          break;
      }
    }
    if (shouldRun) setTimeout(() => { void handleRun(); }, 60);
  };

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_330px]">
      {/* Gallery */}
      <div className="alien-panel alien-scan relative max-h-[620px] space-y-3 overflow-y-auto p-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="font-display text-[10px] tracking-[0.2em] text-gold-light">GALLERY</span>
          <span className="alien-chip px-2 py-0.5 font-mono text-[7px] tracking-widest text-muted-foreground">DRAG OR CLICK</span>
        </div>

        {/* Symbols group with search */}
        <div className="relative z-10">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="font-display text-[9px] tracking-[0.2em] text-gold-light">ASSET UNIVERSE</span>
            <span className="alien-chip px-1.5 py-0.5 font-mono text-[7px] tracking-widest text-muted-foreground">{symbolMatches.length} / {ALL_SYMBOLS.length}</span>
          </div>
          <div className="relative mb-1.5">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <input
              value={symbolQuery}
              onChange={(e) => { setSymbolQuery(e.target.value); setSymbolLimit(40); }}
              placeholder="SEARCH ANY ASSET…"
              className="w-full rounded-full border border-gold/25 bg-background/70 py-1.5 pl-7 pr-3 font-mono text-[9px] tracking-widest text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-gold/60"
            />
          </div>
          <div className="mb-1.5 flex flex-wrap gap-1">
            {symbolCats.map(c => (
              <button
                key={c}
                onClick={() => { setSymbolCat(c); setSymbolLimit(40); }}
                className={`alien-chip px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.18em] transition-colors ${
                  symbolCat === c ? 'text-gold-light' : 'text-muted-foreground hover:text-gold-light'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid max-h-[220px] grid-cols-2 gap-1.5 overflow-y-auto pr-0.5">
            {symbolResults.map(s => (
              <button
                key={`${s.cat}-${s.key}-${s.ticker}`}
                draggable
                onDragStart={(e) => onGalleryDragStart(e, 'symbol', { label: s.label, ticker: s.ticker })}
                onClick={() => addSymbolNode({ label: s.label, ticker: s.ticker })}
                className="group relative overflow-hidden cursor-grab active:cursor-grabbing select-none rounded border border-gold/25 bg-gold/5 px-1.5 py-1 text-left transition hover:bg-gold/15"
                title={`Drag or click ${s.label} (${s.ticker})`}
              >
                <span className="flex min-w-0 items-center gap-1">
                  <SymbolLogo symbolKey={s.key} category={s.cat} ticker={s.ticker} size={12} className="shrink-0" />
                  <span className="truncate font-display text-[8px] tracking-[0.1em] text-gold-light">{s.label}</span>
                </span>
                <span className="mt-0.5 block font-mono text-[6px] uppercase tracking-widest text-muted-foreground">{s.cat}</span>
              </button>
            ))}
            {symbolResults.length === 0 && (
              <div className="col-span-2 text-[9px] font-mono text-gold/40 text-center py-2">No matches</div>
            )}
          </div>
          {symbolLimit < symbolMatches.length && (
            <button
              onClick={() => setSymbolLimit(l => l + 40)}
              className="mt-1.5 w-full rounded-full border border-gold/25 bg-gold/5 py-1 font-mono text-[8px] tracking-[0.2em] text-gold-light hover:text-gold"
            >
              LOAD {Math.min(40, symbolMatches.length - symbolLimit)} MORE
            </button>
          )}
        </div>

        {groups.map(group => (
          <div key={group}>
            <div className="text-[9px] font-mono tracking-widest text-gold/60 mb-1 px-1">{group}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {GALLERY.filter(g => g.group === group).map(item => {
                const t = tintClasses(item.tint);
                const Icon = item.Icon;
                return (
                  <button
                    key={item.kind + item.label}
                    draggable
                    onDragStart={(e) => onGalleryDragStart(e, item.kind)}
                    onClick={() => addKindNode(item.kind)}
                    className={`cursor-grab active:cursor-grabbing select-none flex w-full items-center gap-1.5 px-1.5 py-1.5 rounded border ${t.border} ${t.bg} hover:brightness-125 transition`}
                    title={`Drag or click ${item.label} to add it to the workflow`}
                  >
                    <Icon className={`w-3 h-3 ${t.text}`} />
                    <span className={`text-[9px] font-mono tracking-wider ${t.text}`}>{item.label}</span>
                  </button>
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

const FREQUENCIES = [
  { v: 'once', l: 'Once' },
  { v: 'daily', l: 'Daily' },
  { v: 'weekly', l: 'Weekly' },
  { v: 'biweekly', l: 'Bi-weekly' },
  { v: 'monthly', l: 'Monthly' },
  { v: 'market-open', l: 'Market open' },
  { v: 'market-close', l: 'Market close' },
];

const TIME_SLOTS = [
  '00:00','04:00','08:00','09:30','10:00','12:00','14:00','16:00','18:00','20:00','22:00','23:30',
];

// Airbnb-style booking flow: pick a start date on the calendar, then a time,
// then a cadence and optional end date.
function ScheduleConfig({ c, onChange }: { c: NodeConfig; onChange: (patch: NodeConfig) => void }) {
  const [stage, setStage] = React.useState<'start' | 'end'>('start');
  const start = c.date ? new Date(c.date) : undefined;
  const end = c.endDate ? new Date(c.endDate) : undefined;
  const recurring = c.when && c.when !== 'once';
  const selected = stage === 'start' ? start : end;

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setStage('start')}
          className={`flex-1 rounded border px-2 py-1.5 text-left ${stage === 'start' ? 'border-gold/60 bg-gold/10' : 'border-gold/20 bg-black/40'}`}
        >
          <div className="text-[8px] font-mono tracking-widest text-gold/50">START</div>
          <div className="text-[10px] font-mono text-gold-light">{start ? format(start, 'EEE, MMM d yyyy') : 'Add date'}</div>
        </button>
        <button
          type="button"
          disabled={!recurring}
          onClick={() => setStage('end')}
          className={`flex-1 rounded border px-2 py-1.5 text-left disabled:opacity-40 ${stage === 'end' ? 'border-gold/60 bg-gold/10' : 'border-gold/20 bg-black/40'}`}
        >
          <div className="text-[8px] font-mono tracking-widest text-gold/50">UNTIL</div>
          <div className="text-[10px] font-mono text-gold-light">{end ? format(end, 'EEE, MMM d yyyy') : recurring ? 'No end date' : '—'}</div>
        </button>
      </div>

      <div className="rounded border border-gold/20 bg-black/40 flex justify-center">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          disabled={stage === 'end' && start ? { before: start } : undefined}
          onSelect={(d) => {
            if (!d) return;
            if (stage === 'start') {
              onChange({ date: d.toISOString() });
              if (recurring) setStage('end');
            } else {
              onChange({ endDate: d.toISOString() });
            }
          }}
          className="p-2 pointer-events-auto"
        />
      </div>

      {stage === 'end' && end && (
        <button type="button" onClick={() => onChange({ endDate: '' })}
          className="text-[9px] font-mono text-rose-400/80 hover:text-rose-300">Clear end date</button>
      )}

      <F label="TIME">
        <div className="space-y-1.5">
          <div className="grid grid-cols-4 gap-1">
            {TIME_SLOTS.map(t => (
              <button key={t} type="button" onClick={() => onChange({ time: t })}
                className={`text-[9px] font-mono py-1 rounded border ${c.time === t ? 'border-gold/60 bg-gold/15 text-gold-light' : 'border-gold/20 text-gold/60 hover:bg-gold/10'}`}>
                {t}
              </button>
            ))}
          </div>
          <Input type="time" value={c.time ?? ''} onChange={(e) => onChange({ time: e.target.value })} />
        </div>
      </F>

      <F label="REPEATS">
        <div className="flex flex-wrap gap-1">
          {FREQUENCIES.map(f => (
            <button key={f.v} type="button"
              onClick={() => { onChange({ when: f.v, ...(f.v === 'once' ? { endDate: '' } : {}) }); if (f.v === 'once') setStage('start'); }}
              className={`text-[9px] font-mono px-2 py-1 rounded-full border ${c.when === f.v ? 'border-gold/60 bg-gold/15 text-gold-light' : 'border-gold/20 text-gold/60 hover:bg-gold/10'}`}>
              {f.l}
            </button>
          ))}
        </div>
      </F>

      <p className="text-[9px] font-mono text-gold/50">
        {start
          ? `Runs ${c.when === 'once' ? 'once on' : `${c.when} from`} ${format(start, 'MMM d, yyyy')} at ${c.time || '—'}${end ? ` until ${format(end, 'MMM d, yyyy')}` : ''}.`
          : 'Pick a start date to activate this step.'}
      </p>
    </div>
  );
}

// Hoisted so React keeps the same component identity between renders —
// defining these inside NodeConfigForm remounted every input on each
// keystroke, which stole focus and made fields feel "uneditable".
const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-[10px] font-mono tracking-wider text-gold/70">{label}</Label>
    {children}
  </div>
);

const UseLiveBtn = ({ livePrice, onFill }: { livePrice: number; onFill: () => void }) => (
  <button
    type="button"
    disabled={!(livePrice > 0)}
    onClick={onFill}
    className="text-[8px] font-mono tracking-wider text-gold-light border border-gold/40 hover:bg-gold/10 disabled:opacity-30 px-1.5 py-0.5 rounded shrink-0"
  >
    USE LIVE
  </button>
);

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
  const tickerForLive = node.kind === 'symbol' ? (c.ticker ?? null) : (contextTicker ?? null);
  const showLive = ['symbol','buy','sell','stop','trail','alertup','alertdown'].includes(node.kind);
  const livePrice = tickerForLive && getPriceByTicker ? getPriceByTicker(tickerForLive) : 0;
  const fillFromLive = (field: string) => {
    if (livePrice > 0) onChange({ [field]: Number(livePrice.toFixed(livePrice < 10 ? 4 : 2)) });
  };
  const LiveBlock = showLive ? (
    <LivePriceIndicator ticker={tickerForLive} getPriceByTicker={getPriceByTicker} />
  ) : null;

  if (node.kind === 'symbol') {
    const query = String(c.symbol ?? c.ticker ?? '').toLowerCase();
    const matches = query
      ? ALL_SYMBOLS.filter(s =>
          s.label.toLowerCase().includes(query) ||
          s.ticker.toLowerCase().includes(query) ||
          s.key.toLowerCase().includes(query)
        ).slice(0, 8)
      : [];
    const exact = ALL_SYMBOLS.find(s => s.ticker === c.ticker);
    return (
      <div className="space-y-3">
        {LiveBlock}
        <F label="SEARCH SYMBOL">
          <div className="relative">
            <Input
              value={c.symbol ?? ''}
              placeholder="Type to search 700+ symbols…"
              onChange={(e) => onChange({ symbol: e.target.value })}
            />
            {matches.length > 0 && (!exact || exact.label !== c.symbol) && (
              <div className="absolute z-50 mt-1 left-0 right-0 max-h-48 overflow-y-auto rounded border border-gold/30 bg-black/95 shadow-lg">
                {matches.map(s => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => onChange({ symbol: s.label, ticker: s.ticker, key: s.key, cat: s.cat })}
                    className="w-full flex items-center justify-between gap-2 px-2 py-1 text-left hover:bg-gold/10"
                  >
                    <span className="text-[10px] font-mono text-gold-light">{s.label}</span>
                    <span className="text-[9px] font-mono text-gold/50">{s.ticker} · {s.cat}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </F>
        <F label="TICKER">
          <Input value={c.ticker ?? ''} onChange={(e) => onChange({ ticker: e.target.value })} />
        </F>
        <p className="text-[9px] font-mono text-gold/50">
          Selecting a symbol drives the LIVE indicator above and becomes the context for the next action in the chain.
        </p>
      </div>
    );
  }

  if (node.kind === 'buy' || node.kind === 'sell') {
    return (
      <div className="space-y-3">
        {LiveBlock}
        <F label="AMOUNT">
          <CurrencyAmountField
            amount={c.amount ?? ''}
            currency={c.currency ?? 'USD'}
            livePrice={livePrice}
            onAmountChange={(v) => onChange({ amount: v })}
            onCurrencyChange={(code) => onChange({ currency: code })}
            onUsdChange={(usd) => { if (usd !== c.amountUsd) onChange({ amountUsd: usd }); }}
          />
        </F>
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
              <UseLiveBtn livePrice={livePrice} onFill={() => fillFromLive('limitPrice')} />
            </div>
          </F>
        )}
        {c.orderType === 'market' && livePrice > 0 && (
          <p className="text-[9px] font-mono text-gold/50">
            Est. fill ≈ ${livePrice.toLocaleString('en-US', { maximumFractionDigits: livePrice < 10 ? 4 : 2 })}
            {' · '}notional ≈ ${Number(c.amountUsd || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
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
            <UseLiveBtn livePrice={livePrice} onFill={() => fillFromLive('stopPrice')} />
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
            <UseLiveBtn livePrice={livePrice} onFill={() => fillFromLive('price')} />
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
      <ScheduleConfig c={c} onChange={onChange} />
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