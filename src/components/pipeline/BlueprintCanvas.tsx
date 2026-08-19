import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Boxes, Filter, FlaskConical, Code2, TrendingUp, TrendingDown, BellRing, Shield,
  GitBranch, StickyNote, Play, Square, Trash2, Settings2, X, AlertTriangle, CheckCircle2,
  Search, Plus, ArrowDown, Cpu,
} from 'lucide-react';
import SymbolLogo from '@/components/trading/SymbolLogo';
import { ALL_SYMBOLS } from '@/data/tradingSymbols';
import { ASSET_CLASSES, classTint, type ClassId, type ClassifiedAsset } from '@/lib/assetClassifiers';
import { ANALYSIS_PROGRAMS, PROGRAM_BY_ID, defaultParamsFor } from '@/lib/analysisPrograms';
import { ACTION_PRESETS, PRESET_BY_ID, PRESET_GROUPS } from '@/lib/actionPresets';
import type { CustomBlock } from '@/lib/customBlocks';
import {
  runBlueprint, validateBlueprint, type BpKind, type BpLogEntry, type BpNode,
} from '@/lib/blueprintEngine';
import { LivePriceIndicator } from '@/components/trading/LivePriceIndicator';

const STORAGE_KEY = 'ga_blueprint_v2';
const uid = () => `n_${Math.random().toString(36).slice(2, 9)}`;

const KIND_META: Record<BpKind, { label: string; tint: string; Icon: React.ComponentType<{ className?: string }> }> = {
  asset:    { label: 'ASSET',    tint: 'gold',    Icon: Boxes },
  screen:   { label: 'SCREEN',   tint: 'orange',  Icon: Filter },
  analysis: { label: 'ANALYSIS', tint: 'violet',  Icon: FlaskConical },
  code:     { label: 'CODE BOX', tint: 'cyan',    Icon: Code2 },
  branch:   { label: 'BRANCH',   tint: 'indigo',  Icon: GitBranch },
  buy:      { label: 'BUY',      tint: 'emerald', Icon: TrendingUp },
  sell:     { label: 'SELL',     tint: 'rose',    Icon: TrendingDown },
  alert:    { label: 'ALERT',    tint: 'sky',     Icon: BellRing },
  risk:     { label: 'RISK',     tint: 'red',     Icon: Shield },
  note:     { label: 'NOTE',     tint: 'slate',   Icon: StickyNote },
};

const defaultConfig = (kind: BpKind): Record<string, any> => {
  switch (kind) {
    case 'buy':
    case 'sell':   return { amountUsd: 1000 };
    case 'alert':  return { direction: 'above', price: '' };
    case 'risk':   return { maxDrawdownPct: 10, blockOnBreach: true };
    case 'branch': return { expects: 'bullish' };
    case 'note':   return { text: 'Describe this stage of the blueprint…' };
    default:       return {};
  }
};

export interface BlueprintApi {
  addAsset: (t: string, l: string) => void;
  addScreen: (c: ClassId) => void;
  addAnalysis: (programId: string) => void;
  addBlock: (b: CustomBlock) => void;
  addKind: (k: BpKind, config?: Record<string, any>, label?: string) => void;
  updateNode: (index: number, patch: Record<string, any>) => void;
  removeNode: (index: number) => void;
  clear: () => void;
  replaceAll: (nodes: Array<{ kind: BpKind; label?: string; config?: Record<string, any> }>) => void;
  run: () => void;
  stop: () => void;
  select: (index: number | null) => void;
  getState: () => { nodes: BpNode[]; issues: ReturnType<typeof validateBlueprint>; log: BpLogEntry[]; running: boolean };
}

export interface BlueprintCanvasProps {
  classified: ClassifiedAsset[];
  blocks: CustomBlock[];
  getPrice: (t: string) => number;
  getSeries: (t: string) => number[];
  account: { equity: number; totalPnl: number; startingBalance: number };
  submitOrder: BlueprintRunOrder;
  subscribe?: (t: string) => void;
  registerApi?: (api: BlueprintApi) => void;
}
type BlueprintRunOrder = (p: {
  symbol: string; side: 'buy' | 'sell'; qty: number;
  type: 'market' | 'limit' | 'stop'; price: number; limitPrice?: number; botSource?: boolean;
}) => { id: string; price: number; fees: number };

export default function BlueprintCanvas({
  classified, blocks, getPrice, getSeries, account, submitOrder, subscribe, registerApi,
}: BlueprintCanvasProps) {
  const [nodes, setNodes] = useState<BpNode[]>(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); } catch { /* ignore */ }
    return [];
  });
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes)); } catch { /* ignore */ } }, [nodes]);

  const [tab, setTab] = useState<'assets' | 'screens' | 'analysis' | 'actions' | 'blocks'>('assets');
  const [query, setQuery] = useState('');
  const [paletteQuery, setPaletteQuery] = useState('');
  const [presetGroup, setPresetGroup] = useState<'ALL' | (typeof PRESET_GROUPS)[number]>('ALL');
  const [visible, setVisible] = useState(24);
  const [selected, setSelected] = useState<string | null>(null);
  const [log, setLog] = useState<BpLogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const stopRef = useRef(false);
  const dragIdx = useRef<number | null>(null);

  const issues = useMemo(() => validateBlueprint(nodes), [nodes]);
  const errors = issues.filter((i) => i.level === 'error');

  const push = (n: BpNode) => setNodes((prev) => [...prev, n]);
  const addAsset = (ticker: string, label: string) => {
    subscribe?.(ticker);
    push({ id: uid(), kind: 'asset', label, config: { ticker, label } });
  };
  const addScreen = (classId: ClassId) => {
    const def = ASSET_CLASSES.find((c) => c.id === classId);
    push({ id: uid(), kind: 'screen', label: def?.label ?? 'SCREEN', config: { classId, limit: 5, bindTop: true, haltIfEmpty: false } });
  };
  const addAnalysis = (programId: string) => {
    const p = PROGRAM_BY_ID.get(programId);
    push({ id: uid(), kind: 'analysis', label: p?.label ?? 'ANALYSIS', config: { programId, params: defaultParamsFor(programId) } });
  };
  const addBlock = (b: CustomBlock) => push({ id: uid(), kind: 'code', label: b.name, config: { blockId: b.id, params: {}, timeoutMs: 4000 } });
  const addKind = (kind: BpKind, config?: Record<string, any>, label?: string) =>
    push({ id: uid(), kind, label: label ?? KIND_META[kind].label, config: { ...defaultConfig(kind), ...(config ?? {}) } });

  const filteredSymbols = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? ALL_SYMBOLS.filter((s) => s.label.toLowerCase().includes(q) || s.ticker.toLowerCase().includes(q) || s.cat.includes(q)) : ALL_SYMBOLS;
    return base.slice(0, visible);
  }, [query, visible]);

  const pq = paletteQuery.trim().toLowerCase();
  const match = (...fields: string[]) => !pq || fields.some((f) => f.toLowerCase().includes(pq));
  const filteredClasses = useMemo(() => ASSET_CLASSES.filter((c) => match(c.label, c.blurb, c.id)), [pq]);
  const filteredPrograms = useMemo(() => ANALYSIS_PROGRAMS.filter((p) => match(p.label, p.blurb, p.id)), [pq]);
  const filteredPresets = useMemo(
    () => ACTION_PRESETS.filter((a) => (presetGroup === 'ALL' || a.group === presetGroup) && match(a.label, a.blurb, a.id)),
    [pq, presetGroup],
  );

  const addPreset = (id: string) => {
    const p = PRESET_BY_ID.get(id);
    if (p) addKind(p.kind, p.config as Record<string, any>, p.label);
  };

  const paletteSearch = (placeholder: string) => (
    <div className="alien-chip flex items-center gap-1.5 px-2 py-1.5">
      <Search className="h-3 w-3 text-muted-foreground" />
      <input value={paletteQuery} onChange={(e) => setPaletteQuery(e.target.value)} placeholder={placeholder}
        className="w-full bg-transparent font-mono text-[9px] tracking-wider text-foreground outline-none" />
    </div>
  );

  const handleDrop = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    const asset = e.dataTransfer.getData('application/x-ga-asset');
    if (asset) { const { ticker, label } = JSON.parse(asset); addAsset(ticker, label); return; }
    const kind = e.dataTransfer.getData('application/x-ga-kind') as BpKind;
    if (kind) { addKind(kind); return; }
    const preset = e.dataTransfer.getData('application/x-ga-preset');
    if (preset) { addPreset(preset); return; }
    const prog = e.dataTransfer.getData('application/x-ga-program');
    if (prog) { addAnalysis(prog); return; }
    const cls = e.dataTransfer.getData('application/x-ga-class');
    if (cls) { addScreen(cls as ClassId); return; }
    const blk = e.dataTransfer.getData('application/x-ga-block');
    if (blk) { const b = blocks.find((x) => x.id === blk); if (b) addBlock(b); }
    if (typeof index === 'number' && dragIdx.current !== null) reorder(dragIdx.current, index);
  };

  const reorder = (from: number, to: number) => {
    setNodes((prev) => {
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
    dragIdx.current = null;
  };

  const run = async () => {
    if (running) return;
    stopRef.current = false;
    setLog([]); setRunning(true);
    await runBlueprint(nodes, {
      getPrice, getSeries, classified, blocks, account, submitOrder,
      shouldStop: () => stopRef.current,
    }, (e) => setLog((prev) => [...prev, e]));
    setRunning(false);
  };

  const update = (id: string, patch: Record<string, any>) =>
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, config: { ...n.config, ...patch } } : n)));

  const selectedNode = nodes.find((n) => n.id === selected) ?? null;

  useEffect(() => {
    registerApi?.({
      addAsset, addScreen, addAnalysis, addBlock, addKind,
      updateNode: (index, patch) => setNodes((prev) => prev.map((n, i) => (i === index ? { ...n, config: { ...n.config, ...patch } } : n))),
      removeNode: (index) => setNodes((prev) => prev.filter((_, i) => i !== index)),
      clear: () => { setNodes([]); setLog([]); },
      replaceAll: (list) => setNodes(list.map((n) => {
        if (n.config?.ticker) subscribe?.(String(n.config.ticker));
        return {
        id: uid(),
        kind: n.kind,
        label: n.label ?? KIND_META[n.kind]?.label ?? n.kind.toUpperCase(),
        config: { ...defaultConfig(n.kind), ...(n.config ?? {}) },
        };
      })),
      run: () => { void run(); },
      stop: () => { stopRef.current = true; },
      select: (index) => setSelected(index === null ? null : nodes[index]?.id ?? null),
      getState: () => ({ nodes, issues, log, running }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerApi, nodes, issues, log, running, blocks, classified]);

  const PaletteTab = ({ id, label }: { id: typeof tab; label: string }) => (
    <button
      onClick={() => setTab(id)}
      className={`alien-chip px-2 py-1 font-mono text-[8px] tracking-[0.18em] ${tab === id ? 'text-gold-light ring-1 ring-gold/50' : 'text-muted-foreground'}`}
    >{label}</button>
  );

  return (
    <div className="grid gap-3 xl:grid-cols-[280px_minmax(0,1fr)_300px]">
      {/* ─── PALETTE ─── */}
      <aside className="alien-panel alien-scan relative overflow-hidden p-3">
        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <PaletteTab id="assets" label="ASSETS" />
            <PaletteTab id="screens" label="SCREENS" />
            <PaletteTab id="analysis" label="ANALYSIS" />
            <PaletteTab id="actions" label="ACTIONS" />
            <PaletteTab id="blocks" label="MY BOXES" />
          </div>

          {tab === 'assets' && (
            <>
              <div className="alien-chip flex items-center gap-1.5 px-2 py-1.5">
                <Search className="h-3 w-3 text-muted-foreground" />
                <input value={query} onChange={(e) => { setQuery(e.target.value); setVisible(24); }}
                  placeholder="SEARCH 700+ INSTRUMENTS"
                  className="w-full bg-transparent font-mono text-[9px] tracking-wider text-foreground outline-none" />
              </div>
              <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
                {filteredSymbols.map((s) => (
                  <button key={s.key} draggable
                    onDragStart={(e) => e.dataTransfer.setData('application/x-ga-asset', JSON.stringify({ ticker: s.ticker, label: s.label }))}
                    onClick={() => addAsset(s.ticker, s.label)}
                    className="alien-chip flex w-full items-center gap-2 p-1.5 text-left hover:ring-1 hover:ring-gold/40">
                    <SymbolLogo symbolKey={s.key} category={s.cat} ticker={s.ticker} size={18} />
                    <span className="truncate font-mono text-[9px] tracking-wider text-foreground">{s.label}</span>
                    <span className="ml-auto font-mono text-[7px] tracking-[0.16em] text-muted-foreground">{s.cat.toUpperCase()}</span>
                  </button>
                ))}
                {filteredSymbols.length >= visible && (
                  <button onClick={() => setVisible((v) => v + 40)} className="alien-chip w-full py-1 font-mono text-[8px] tracking-[0.2em] text-gold-light">LOAD MORE</button>
                )}
              </div>
            </>
          )}

          {tab === 'screens' && (
            <div className="max-h-[440px] space-y-1 overflow-y-auto pr-1">
              {ASSET_CLASSES.map((c) => (
                <button key={c.id} draggable
                  onDragStart={(e) => e.dataTransfer.setData('application/x-ga-class', c.id)}
                  onClick={() => addScreen(c.id)}
                  className={`flex w-full flex-col rounded-md border px-2 py-1.5 text-left ${classTint(c.tint)} hover:ring-1 hover:ring-gold/40`}>
                  <span className="font-display text-[9px] tracking-[0.2em]">{c.label}</span>
                  <span className="font-mono text-[7px] leading-relaxed tracking-wider opacity-70">{c.blurb}</span>
                </button>
              ))}
            </div>
          )}

          {tab === 'analysis' && (
            <div className="max-h-[440px] space-y-1 overflow-y-auto pr-1">
              {ANALYSIS_PROGRAMS.map((p) => (
                <button key={p.id} draggable
                  onDragStart={(e) => e.dataTransfer.setData('application/x-ga-program', p.id)}
                  onClick={() => addAnalysis(p.id)}
                  className={`flex w-full flex-col rounded-md border px-2 py-1.5 text-left ${classTint(p.tint)} hover:ring-1 hover:ring-gold/40`}>
                  <span className="font-display text-[9px] tracking-[0.2em]">{p.label}</span>
                  <span className="font-mono text-[7px] leading-relaxed tracking-wider opacity-70">{p.blurb}</span>
                </button>
              ))}
            </div>
          )}

          {tab === 'actions' && (
            <div className="grid grid-cols-2 gap-1.5">
              {(['buy', 'sell', 'alert', 'risk', 'branch', 'note'] as BpKind[]).map((k) => {
                const meta = KIND_META[k];
                return (
                  <button key={k} draggable
                    onDragStart={(e) => e.dataTransfer.setData('application/x-ga-kind', k)}
                    onClick={() => addKind(k)}
                    className={`flex items-center gap-1.5 rounded-md border px-2 py-2 ${classTint(meta.tint)} hover:ring-1 hover:ring-gold/40`}>
                    <meta.Icon className="h-3.5 w-3.5" />
                    <span className="font-display text-[9px] tracking-[0.18em]">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'blocks' && (
            <div className="max-h-[440px] space-y-1 overflow-y-auto pr-1">
              {blocks.length === 0 && (
                <p className="font-mono text-[8px] leading-relaxed tracking-wider text-muted-foreground">
                  NO CUSTOM BOXES YET. USE THE CODE STUDIO BELOW — ANY PROGRAM BECOMES A BLUEPRINT BOX.
                </p>
              )}
              {blocks.map((b) => (
                <button key={b.id} draggable
                  onDragStart={(e) => e.dataTransfer.setData('application/x-ga-block', b.id)}
                  onClick={() => addBlock(b)}
                  className="alien-chip flex w-full items-center gap-2 p-1.5 text-left hover:ring-1 hover:ring-gold/40">
                  <Code2 className="h-3 w-3 text-cyan-400" />
                  <span className="truncate font-mono text-[9px] tracking-wider text-foreground">{b.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ─── CANVAS ─── */}
      <section
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e)}
        className="alien-panel alien-scan relative min-h-[520px] overflow-x-hidden p-3"
      >
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Cpu className="h-4 w-4 text-gold-light" />
            <span className="font-display text-[11px] tracking-[0.26em] text-gold-light">BLUEPRINT GRAPH</span>
            <span className="alien-chip px-2 py-1 font-mono text-[8px] tracking-[0.18em] text-muted-foreground">{nodes.length} NODES</span>
            <div className="ml-auto flex items-center gap-1.5">
              <button onClick={run} disabled={running || errors.length > 0}
                title={errors.length > 0 ? errors[0].message : 'Compile and execute every node top-down'}
                className="alien-chip flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] text-emerald-400 disabled:opacity-40">
                <Play className="h-3 w-3" /> {running ? 'RUNNING…' : 'COMPILE & RUN'}
              </button>
              <button onClick={() => { stopRef.current = true; }} disabled={!running}
                className="alien-chip flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] text-rose-400 disabled:opacity-40">
                <Square className="h-3 w-3" /> STOP
              </button>
              <button onClick={() => { setNodes([]); setLog([]); }}
                className="alien-chip flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
                <Trash2 className="h-3 w-3" /> CLEAR
              </button>
            </div>
          </div>

          {issues.length > 0 && (
            <div className="max-h-[140px] space-y-1 overflow-y-auto pr-1">
              {issues.map((i, idx) => (
                <p key={idx} className={`flex items-center gap-1.5 font-mono text-[8px] tracking-wider ${i.level === 'error' ? 'text-rose-400' : 'text-amber-400'}`}>
                  <AlertTriangle className="h-3 w-3" /> STEP {i.step}: {i.message}
                </p>
              ))}
            </div>
          )}
          {nodes.length > 0 && errors.length === 0 && (
            <p className="flex items-center gap-1.5 font-mono text-[8px] tracking-wider text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> BLUEPRINT COMPILES — {nodes.length} NODES WIRED
            </p>
          )}

          {nodes.length === 0 && (
            <div className="flex h-[380px] items-center justify-center rounded-xl border border-dashed border-gold/25">
              <p className="max-w-sm text-center font-mono text-[9px] leading-relaxed tracking-[0.16em] text-muted-foreground">
                DROP ASSETS, CLASS SCREENS, ANALYSIS PROGRAMS OR YOUR OWN CODE BOXES HERE.<br />
                NODES EXECUTE TOP-DOWN, THREADING SYMBOL CONTEXT AND SIGNALS DOWNSTREAM.
              </p>
            </div>
          )}

          <div className="space-y-1">
            {nodes.map((n, i) => {
              const meta = KIND_META[n.kind];
              const isSel = selected === n.id;
              return (
                <div key={n.id}>
                  <div
                    draggable
                    onDragStart={() => { dragIdx.current = i; }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.stopPropagation(); handleDrop(e, i); }}
                    onClick={() => setSelected(isSel ? null : n.id)}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 backdrop-blur-md transition ${classTint(meta.tint)} ${isSel ? 'ring-1 ring-gold/60' : 'hover:ring-1 hover:ring-gold/30'}`}
                  >
                    <span className="font-mono text-[8px] opacity-60">{String(i + 1).padStart(2, '0')}</span>
                    <meta.Icon className="h-4 w-4" />
                    <span className="font-display text-[10px] tracking-[0.18em]">{meta.label}</span>
                    <span className="truncate font-mono text-[9px] tracking-wider opacity-80">{n.label}</span>
                    {n.kind === 'asset' && n.config?.ticker && (
                      <span className="ml-auto"><LivePriceIndicator ticker={n.config.ticker} getPriceByTicker={getPrice} compact /></span>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setSelected(n.id); }} className="ml-auto opacity-70 hover:opacity-100"><Settings2 className="h-3 w-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setNodes((p) => p.filter((x) => x.id !== n.id)); }} className="opacity-70 hover:opacity-100"><X className="h-3 w-3" /></button>
                  </div>
                  {isSel && (
                    <div className="mt-1 rounded-lg border border-gold/20 bg-background/40 p-2 backdrop-blur-md">
                      <NodeConfig node={n} update={(p) => update(n.id, p)} blocks={blocks} />
                    </div>
                  )}
                  {i < nodes.length - 1 && (
                    <div className="flex justify-center py-0.5"><ArrowDown className="h-3 w-3 text-gold/50" /></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── EXECUTION LOG ─── */}
      <aside className="alien-panel alien-scan relative overflow-hidden p-3">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-display text-[10px] tracking-[0.24em] text-gold-light">EXECUTION TRACE</span>
            {running && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />}
          </div>
          <div className="max-h-[520px] space-y-1 overflow-y-auto pr-1">
            {log.length === 0 && (
              <p className="font-mono text-[8px] tracking-wider text-muted-foreground">NO RUN YET — COMPILE THE BLUEPRINT TO SEE LIVE TRACE.</p>
            )}
            {log.map((e, i) => (
              <p key={i} className={`font-mono text-[8px] leading-relaxed tracking-wider ${
                e.status === 'error' ? 'text-rose-400' : e.status === 'ok' ? 'text-emerald-400' : e.status === 'skip' ? 'text-amber-400' : 'text-muted-foreground'
              }`}>
                [{String(e.step).padStart(2, '0')}] {e.message}
              </p>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ── inline node configuration ── */
function NodeConfig({ node, update, blocks }: { node: BpNode; update: (p: Record<string, any>) => void; blocks: CustomBlock[] }) {
  const label = 'font-mono text-[8px] tracking-[0.18em] text-muted-foreground';
  const field = 'alien-chip w-full bg-transparent px-2 py-1 font-mono text-[9px] tracking-wider text-foreground outline-none';

  switch (node.kind) {
    case 'screen': {
      return (
        <div className="grid gap-2 sm:grid-cols-3">
          <div><p className={label}>CLASSIFICATION</p>
            <select className={field} value={node.config.classId} onChange={(e) => update({ classId: e.target.value })}>
              {ASSET_CLASSES.map((c) => <option key={c.id} value={c.id} className="bg-background">{c.label}</option>)}
            </select></div>
          <div><p className={label}>MEMBERS</p>
            <input type="number" min={1} max={25} className={field} value={node.config.limit ?? 5} onChange={(e) => update({ limit: Number(e.target.value) })} /></div>
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-mono text-[8px] tracking-wider text-muted-foreground">
              <input type="checkbox" checked={node.config.bindTop !== false} onChange={(e) => update({ bindTop: e.target.checked })} /> BIND TOP RESULT AS CONTEXT
            </label>
            <label className="flex items-center gap-1.5 font-mono text-[8px] tracking-wider text-muted-foreground">
              <input type="checkbox" checked={!!node.config.haltIfEmpty} onChange={(e) => update({ haltIfEmpty: e.target.checked })} /> HALT IF EMPTY
            </label>
          </div>
        </div>
      );
    }
    case 'analysis': {
      const prog = PROGRAM_BY_ID.get(node.config.programId);
      return (
        <div className="grid gap-2 sm:grid-cols-3">
          <div><p className={label}>PROGRAM</p>
            <select className={field} value={node.config.programId}
              onChange={(e) => update({ programId: e.target.value, params: defaultParamsFor(e.target.value) })}>
              {ANALYSIS_PROGRAMS.map((p) => <option key={p.id} value={p.id} className="bg-background">{p.label}</option>)}
            </select></div>
          {prog?.params.map((p) => (
            <div key={p.key}><p className={label}>{p.label.toUpperCase()}</p>
              <input type="number" min={p.min} max={p.max} step={p.step ?? 1} className={field}
                value={node.config.params?.[p.key] ?? p.default}
                onChange={(e) => update({ params: { ...(node.config.params ?? {}), [p.key]: Number(e.target.value) } })} /></div>
          ))}
          <p className="sm:col-span-3 font-mono text-[8px] leading-relaxed tracking-wider text-muted-foreground">{prog?.blurb}</p>
        </div>
      );
    }
    case 'code': {
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <div><p className={label}>CODE BOX</p>
            <select className={field} value={node.config.blockId} onChange={(e) => update({ blockId: e.target.value })}>
              {blocks.map((b) => <option key={b.id} value={b.id} className="bg-background">{b.name}</option>)}
            </select></div>
          <div><p className={label}>TIMEOUT (MS)</p>
            <input type="number" min={500} max={15000} step={500} className={field}
              value={node.config.timeoutMs ?? 4000} onChange={(e) => update({ timeoutMs: Number(e.target.value) })} /></div>
        </div>
      );
    }
    case 'buy':
    case 'sell':
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <div><p className={label}>NOTIONAL (USD)</p>
            <input type="number" min={1} className={field} value={node.config.amountUsd ?? 1000}
              onChange={(e) => update({ amountUsd: Number(e.target.value) })} /></div>
          <p className="self-end font-mono text-[8px] tracking-wider text-muted-foreground">EXECUTES AT LIVE MARKET AGAINST THE PAPER BOOK.</p>
        </div>
      );
    case 'alert':
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <div><p className={label}>DIRECTION</p>
            <select className={field} value={node.config.direction ?? 'above'} onChange={(e) => update({ direction: e.target.value })}>
              <option value="above" className="bg-background">ABOVE</option>
              <option value="below" className="bg-background">BELOW</option>
            </select></div>
          <div><p className={label}>TRIGGER PRICE</p>
            <input type="number" className={field} value={node.config.price ?? ''} onChange={(e) => update({ price: e.target.value })} /></div>
        </div>
      );
    case 'risk':
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <div><p className={label}>MAX DRAWDOWN %</p>
            <input type="number" min={1} max={90} className={field} value={node.config.maxDrawdownPct ?? 10}
              onChange={(e) => update({ maxDrawdownPct: Number(e.target.value) })} /></div>
          <label className="flex items-end gap-1.5 font-mono text-[8px] tracking-wider text-muted-foreground">
            <input type="checkbox" checked={!!node.config.blockOnBreach} onChange={(e) => update({ blockOnBreach: e.target.checked })} /> HALT FLOW ON BREACH
          </label>
        </div>
      );
    case 'branch':
      return (
        <div><p className={label}>CONTINUE ONLY IF UPSTREAM SIGNAL IS</p>
          <select className={field} value={node.config.expects ?? 'bullish'} onChange={(e) => update({ expects: e.target.value })}>
            {['bullish', 'bearish', 'neutral'].map((v) => <option key={v} value={v} className="bg-background">{v.toUpperCase()}</option>)}
          </select></div>
      );
    case 'note':
      return (
        <textarea className={`${field} min-h-[60px]`} value={node.config.text ?? ''} onChange={(e) => update({ text: e.target.value })} />
      );
    default:
      return <p className="font-mono text-[8px] tracking-wider text-muted-foreground">CONTEXT NODE — SETS THE ACTIVE INSTRUMENT FOR EVERYTHING DOWNSTREAM.</p>;
  }
}

export { KIND_META };