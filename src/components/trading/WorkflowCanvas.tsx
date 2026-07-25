import React, { useRef, useState } from 'react';
import {
  TrendingUp, TrendingDown, OctagonX, CalendarClock, BellRing, BellOff,
  Zap, Waves, Brain, Shield, Target, Activity, Repeat, Timer, Trash2, Plus,
} from 'lucide-react';

type NodeKind =
  | 'buy' | 'sell' | 'stop' | 'schedule' | 'alertup' | 'alertdown'
  | 'trail' | 'hedge' | 'dca' | 'grid' | 'scalp' | 'momentum'
  | 'meanrev' | 'genius' | 'wave' | 'risk' | 'timer';

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

type WorkflowNode = {
  id: string;
  kind: NodeKind;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  tint: string;
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

export default function WorkflowCanvas() {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const onGalleryDragStart = (e: React.DragEvent, kind: NodeKind) => {
    e.dataTransfer.setData('application/x-workflow-kind', kind);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const onCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const kind = e.dataTransfer.getData('application/x-workflow-kind') as NodeKind;
    if (!kind) return;
    const item = GALLERY.find(g => g.kind === kind);
    if (!item) return;
    setNodes(prev => [...prev, {
      id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind: item.kind,
      label: item.label,
      Icon: item.Icon,
      tint: item.tint,
    }]);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-3">
      {/* Gallery */}
      <div className="border border-gold/20 rounded-md bg-black/40 p-2 space-y-3 max-h-[520px] overflow-y-auto">
        <div className="flex items-center justify-between px-1">
          <span className="font-display text-[10px] tracking-[0.2em] text-gold-light">GALLERY</span>
          <span className="text-[8px] font-mono text-gold/50">DRAG →</span>
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
                      className={`group relative cursor-grab active:cursor-grabbing flex flex-col items-center justify-center w-[110px] h-[78px] rounded-md border ${t.border} ${t.bg} shadow-[0_0_12px_rgba(212,175,55,0.08)] animate-scale-in`}
                    >
                      <button
                        onClick={() => removeNode(n.id)}
                        className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition bg-black border border-rose-500/60 rounded-full p-0.5"
                        title="Remove"
                      >
                        <Trash2 className="w-2.5 h-2.5 text-rose-400" />
                      </button>
                      <Icon className={`w-5 h-5 ${t.text} mb-1`} />
                      <span className={`text-[9px] font-mono tracking-wider ${t.text}`}>{n.label}</span>
                      <span className="text-[7px] font-mono text-gold/40 mt-0.5">STEP {idx + 1}</span>
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
          <div className="mt-3 flex items-center gap-2">
            <button className="text-[9px] font-mono tracking-widest text-gold-light border border-gold/40 bg-gold/10 hover:bg-gold/20 px-3 py-1 rounded">
              ▶ RUN WORKFLOW
            </button>
            <button className="text-[9px] font-mono tracking-widest text-gold/70 border border-gold/20 hover:border-gold/40 px-3 py-1 rounded">
              SAVE AS TEMPLATE
            </button>
            <span className="text-[8px] font-mono text-gold/40 ml-auto">
              Drag nodes to reorder · Hover to remove
            </span>
          </div>
        )}
      </div>
    </div>
  );
}