// TetrisConsole — the Pipeline V5 console.
//
// The strategy is rendered as a Tetris well: every LANE is a column, every STEP
// is a block that FALLS from the top of the column and locks onto the stack.
// The stack grows upward, so the block sitting at the bottom is the first thing
// the engine runs and the block on top is the last.
//
//   ┌── Lane A ──┐ ┌── Lane B ──┐
//   │            │ │            │
//   │   ▓ sell   │ │            │   ← last to run (top of the stack)
//   │   ▓ buy    │ │  ▓ alert   │
//   │   ▓ gold   │ │  ▓ gold    │   ← first to run (bottom of the well)
//   └────────────┘ └────────────┘
//
// While a session runs, the step currently executing lights up and the row
// flashes like a cleared Tetris line. Errors lock in red.
//
// Purely presentational: it never mutates the graph, it only calls back.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Users } from 'lucide-react';
import { KIND_COLOR, describeStep } from '@/lib/pipelineBlocks';
import type { PipeLane, PipeStep } from '@/lib/pipelineGraph';

const KEYFRAMES = `
@keyframes ga5-drop {
  0%   { transform: translateY(-260px) rotate(-6deg); opacity: 0; }
  70%  { transform: translateY(6px) rotate(0deg); opacity: 1; }
  85%  { transform: translateY(-3px); }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes ga5-clear {
  0%   { filter: brightness(1); transform: scaleX(1); }
  40%  { filter: brightness(2.1); transform: scaleX(1.03); }
  100% { filter: brightness(1); transform: scaleX(1); }
}
@keyframes ga5-scan {
  0%   { transform: translateY(0); opacity: 0.35; }
  100% { transform: translateY(28px); opacity: 0.35; }
}
`;

export interface TetrisConsoleProps {
  lanes: PipeLane[];
  selectedLaneId: string | null;
  selectedStepId: string | null;
  activeStepIds: string[];
  errorStepIds: string[];
  running: boolean;
  onSelectLane: (laneId: string) => void;
  onSelectStep: (stepId: string) => void;
  onAddLane: () => void;
  onRemoveLane: (laneId: string) => void;
  onMoveStep: (stepId: string, dir: -1 | 1) => void;
  onDeleteStep: (stepId: string) => void;
}

/** Blocks that have already landed — anything new animates its fall once. */
function useLandedTracker(lanes: PipeLane[]) {
  const landed = useRef<Set<string>>(new Set());
  const [, force] = useState(0);
  const ids = useMemo(() => lanes.flatMap((l) => l.steps.map((s) => s.id)), [lanes]);

  useEffect(() => {
    const fresh = ids.filter((id) => !landed.current.has(id));
    if (!fresh.length) return;
    const t = setTimeout(() => {
      fresh.forEach((id) => landed.current.add(id));
      force((n) => n + 1);
    }, 520);
    return () => clearTimeout(t);
  }, [ids]);

  return (id: string) => !landed.current.has(id);
}

function Piece({
  step, order, tint, falling, active, errored, selected, onSelect, onUp, onDown, onDelete,
}: {
  step: PipeStep;
  order: number;
  tint: string;
  falling: boolean;
  active: boolean;
  errored: boolean;
  selected: boolean;
  onSelect: () => void;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
}) {
  const muted = step.enabled === false;
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(); }}
      className={`group relative cursor-pointer rounded-md border px-2 py-1.5 transition ${
        errored ? 'border-destructive/70' : selected ? 'border-primary/80' : 'border-white/10'
      } ${muted ? 'opacity-45' : ''}`}
      style={{
        background: `linear-gradient(160deg, ${tint}2e, ${tint}0d)`,
        boxShadow: active
          ? `0 0 0 1px ${tint}, 0 0 26px ${tint}80`
          : selected
            ? `0 0 0 1px ${tint}aa, inset 0 1px 0 ${tint}33`
            : `inset 0 1px 0 ${tint}22`,
        animation: falling
          ? 'ga5-drop 500ms cubic-bezier(0.34, 1.4, 0.64, 1) both'
          : active
            ? 'ga5-clear 900ms ease-in-out infinite'
            : undefined,
      }}
    >
      <div className="flex items-center gap-1.5">
        <span className="grid h-4 w-4 shrink-0 place-items-center rounded-[3px] text-[9px] font-bold text-background" style={{ background: tint }}>
          {order}
        </span>
        <span className="truncate text-[12px] font-medium text-foreground">{step.label}</span>
      </div>
      <div className="mt-0.5 truncate text-[10px] text-muted-foreground">{describeStep(step as any)}</div>

      <div className="absolute right-1 top-1 hidden gap-0.5 group-hover:flex">
        <button onClick={(e) => { e.stopPropagation(); onUp(); }} className="rounded bg-background/70 p-0.5 text-muted-foreground hover:text-foreground" title="Move up the stack">
          <ChevronUp className="h-3 w-3" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDown(); }} className="rounded bg-background/70 p-0.5 text-muted-foreground hover:text-foreground" title="Move down the stack">
          <ChevronDown className="h-3 w-3" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded bg-background/70 p-0.5 text-destructive hover:bg-destructive/15" title="Clear this block">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default function TetrisConsole({
  lanes, selectedLaneId, selectedStepId, activeStepIds, errorStepIds, running,
  onSelectLane, onSelectStep, onAddLane, onRemoveLane, onMoveStep, onDeleteStep,
}: TetrisConsoleProps) {
  const isFalling = useLandedTracker(lanes);
  const active = new Set(activeStepIds);
  const errored = new Set(errorStepIds);

  return (
    <div className="relative h-full overflow-hidden rounded-xl border border-border/60 bg-[hsl(var(--background))]/70">
      <style>{KEYFRAMES}</style>

      {/* well grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {running && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary"
          style={{ animation: 'ga5-scan 1.4s linear infinite' }}
        />
      )}

      <div className="relative flex h-full gap-3 overflow-x-auto p-3">
        {lanes.map((lane, li) => {
          const tint = lane.consensus ? '#f0abfc' : KIND_COLOR[lane.steps[0]?.kind ?? 'asset'] ?? '#d4af37';
          const isSel = lane.id === selectedLaneId;
          return (
            <div
              key={lane.id}
              onClick={() => onSelectLane(lane.id)}
              className={`flex h-full w-[230px] shrink-0 flex-col rounded-lg border transition ${
                isSel ? 'border-primary/60 bg-primary/[0.04]' : 'border-border/50 bg-card/30'
              }`}
            >
              {/* lane head */}
              <div className="flex items-center gap-1.5 border-b border-border/50 px-2 py-1.5">
                <span className="h-2 w-2 rounded-[2px]" style={{ background: tint }} />
                <span className="truncate text-[12px] font-semibold text-foreground">{lane.name}</span>
                {lane.consensus && <Users className="h-3 w-3 text-fuchsia-400" aria-label="Consensus lane" />}
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">{lane.steps.length}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveLane(lane.id); }}
                  className="text-muted-foreground hover:text-destructive"
                  title="Remove this column"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              {/* the well: blocks stack from the bottom up */}
              <div className="flex min-h-0 flex-1 flex-col-reverse gap-1.5 overflow-y-auto p-2">
                {lane.steps.length === 0 && (
                  <div className="grid flex-1 place-items-center rounded border border-dashed border-border/50 text-center text-[11px] text-muted-foreground">
                    Empty well — drop a block from the palette
                  </div>
                )}
                {lane.steps.map((s, i) => (
                  <Piece
                    key={s.id}
                    step={s}
                    order={i + 1}
                    tint={KIND_COLOR[s.kind] ?? '#d4af37'}
                    falling={isFalling(s.id)}
                    active={active.has(s.id)}
                    errored={errored.has(s.id)}
                    selected={s.id === selectedStepId}
                    onSelect={() => onSelectStep(s.id)}
                    onUp={() => onMoveStep(s.id, 1)}
                    onDown={() => onMoveStep(s.id, -1)}
                    onDelete={() => onDeleteStep(s.id)}
                  />
                ))}
              </div>

              <div className="border-t border-border/50 px-2 py-1 text-[10px] text-muted-foreground">
                Column {li + 1} · runs bottom → top
              </div>
            </div>
          );
        })}

        <button
          onClick={onAddLane}
          className="flex h-full w-[130px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border/60 text-muted-foreground transition hover:border-primary/60 hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          <span className="text-[12px]">New column</span>
        </button>
      </div>
    </div>
  );
}
