// Pipeline V4 graph model — lanes that execute in parallel.
//
// A graph is a set of LANES. Every lane owns an ordered list of STEPS that run
// left → right. Lanes themselves run at the same time. An optional CONSENSUS
// lane runs after the parallel lanes and can act on their combined signals.
//
// Legacy Pipeline V2/V3 blueprints (a single ordered node list) migrate into a
// one-lane graph, so nothing an operator already built is lost.

import type { BpKind, BpNode } from './blueprintEngine';

export type StepKind = BpKind;

export interface PipeStep {
  id: string;
  kind: StepKind;
  label: string;
  config: Record<string, any>;
  /** Operators can mute a step without deleting it. Defaults to enabled. */
  enabled?: boolean;
  /** Free-text operator note shown in the inspector and the run report. */
  note?: string;
  /** When true a failure in this step does not halt the lane. */
  continueOnError?: boolean;
}

/** Config keys that survive when an operator swaps one action for another. */
const PORTABLE_KEYS = ['ticker', 'label', 'amountUsd', 'price', 'programId', 'classId', 'limit'];

/**
 * Swap a step's action in place, keeping its identity (id, note, enabled) and
 * any config values that still make sense for the new action.
 */
export const convertStep = (
  step: PipeStep,
  next: { kind: StepKind; label: string; config?: Record<string, any> },
): PipeStep => {
  const carried: Record<string, any> = {};
  const template = next.config ?? {};
  PORTABLE_KEYS.forEach((k) => {
    if (k in template && step.config?.[k] !== undefined && step.config[k] !== '') carried[k] = step.config[k];
  });
  return { ...step, kind: next.kind, label: next.label, config: { ...template, ...carried } };
};


export interface PipeLane {
  id: string;
  name: string;
  /** Tailwind colour fragment used by both the 3D scene and the flat view. */
  tint: string;
  steps: PipeStep[];
  /** Consensus lane: runs after every parallel lane has finished. */
  consensus?: boolean;
  /** Consensus rule — how many lanes must agree before the lane continues. */
  agree?: { mode: 'all' | 'any' | 'majority' | 'count'; count?: number; expects?: string };
}

export interface PipeGraph {
  id: string;
  name: string;
  /** Applies across every lane at once. */
  risk: { maxDrawdownPct: number; maxTotalInvestmentUsd: number };
  lanes: PipeLane[];
  updatedAt: number;
}

export const LANE_TINTS = ['gold', 'emerald', 'sky', 'violet', 'amber', 'rose', 'cyan', 'indigo'] as const;

export const uid = (p = 's') => `${p}_${Math.random().toString(36).slice(2, 9)}`;

export const emptyGraph = (): PipeGraph => ({
  id: uid('g'),
  name: 'Untitled strategy',
  risk: { maxDrawdownPct: 10, maxTotalInvestmentUsd: 25000 },
  lanes: [],
  updatedAt: Date.now(),
});

export const makeLane = (name: string, index = 0): PipeLane => ({
  id: uid('lane'),
  name,
  tint: LANE_TINTS[index % LANE_TINTS.length],
  steps: [],
});

export const makeStep = (kind: StepKind, label: string, config: Record<string, any> = {}): PipeStep => ({
  id: uid('step'),
  kind,
  label,
  config,
});

/* ─────────────────────────── helpers ─────────────────────────── */

export const laneById = (g: PipeGraph, id: string) => g.lanes.find((l) => l.id === id) ?? null;

export const stepPath = (g: PipeGraph, stepId: string): { lane: PipeLane; index: number } | null => {
  for (const lane of g.lanes) {
    const index = lane.steps.findIndex((s) => s.id === stepId);
    if (index >= 0) return { lane, index };
  }
  return null;
};

export const totalSteps = (g: PipeGraph) => g.lanes.reduce((n, l) => n + l.steps.length, 0);

export const parallelLanes = (g: PipeGraph) => g.lanes.filter((l) => !l.consensus);
export const consensusLanes = (g: PipeGraph) => g.lanes.filter((l) => l.consensus);

/** Total money the graph can commit in one run. */
export const plannedInvestment = (g: PipeGraph) =>
  g.lanes.reduce(
    (sum, lane) =>
      sum +
      lane.steps.reduce(
        (s, step) => (step.kind === 'buy' ? s + (Number(step.config?.amountUsd) || 0) : s),
        0,
      ),
    0,
  );

/* ─────────────────────────── validation ─────────────────────────── */

export interface GraphIssue {
  laneId: string;
  laneName: string;
  stepId: string | null;
  level: 'error' | 'warn';
  message: string;
}

const NEEDS_ASSET: ReadonlySet<StepKind> = new Set(['analysis', 'buy', 'sell', 'alert']);

export function validateGraph(
  g: PipeGraph,
  ctx: { hasProgram: (id: string) => boolean; hasBlock: (id: string) => boolean },
): GraphIssue[] {
  const out: GraphIssue[] = [];
  if (!g.lanes.length) {
    out.push({ laneId: '', laneName: '', stepId: null, level: 'error', message: 'No lanes yet — add a lane and drop an asset into it.' });
    return out;
  }

  g.lanes.forEach((lane) => {
    const add = (level: GraphIssue['level'], message: string, stepId: string | null = null) =>
      out.push({ laneId: lane.id, laneName: lane.name, stepId, level, message });

    if (!lane.steps.length) {
      add('warn', `Lane "${lane.name}" is empty and will be skipped.`);
      return;
    }

    let hasContext = false;
    lane.steps.forEach((s) => {
      if (s.enabled === false) return; // muted steps are not validated
      switch (s.kind) {
        case 'asset':
          hasContext = !!s.config?.ticker;
          if (!hasContext) add('error', 'This asset step has no instrument selected.', s.id);
          return;
        case 'screen':
          hasContext = true;
          if (!s.config?.classId) add('error', 'This market-condition step has no condition selected.', s.id);
          return;
        case 'analysis':
          if (!ctx.hasProgram(s.config?.programId)) add('error', 'This analysis step points at an unknown program.', s.id);
          break;
        case 'code':
          if (!s.config?.blockId || !ctx.hasBlock(s.config.blockId)) add('error', 'This custom-logic step has no saved code attached.', s.id);
          break;
        case 'buy':
        case 'sell':
          if (!(Number(s.config?.amountUsd) > 0)) add('error', 'Set an investment amount greater than zero.', s.id);
          break;
        case 'alert':
          if (!(Number(s.config?.price) > 0)) add('warn', 'This alert has no price level yet.', s.id);
          break;
        case 'branch':
          if (!s.config?.expects) add('warn', 'This condition step has no expected signal, so it always passes.', s.id);
          break;
        default:
          break;
      }
      if (NEEDS_ASSET.has(s.kind) && !hasContext && !lane.consensus) {
        add('error', `"${s.label}" needs an asset or market condition earlier in the lane.`, s.id);
      }
    });
  });

  const planned = plannedInvestment(g);
  if (planned > g.risk.maxTotalInvestmentUsd) {
    out.push({
      laneId: '', laneName: '', stepId: null, level: 'warn',
      message: `Planned investment $${planned.toLocaleString()} exceeds the strategy cap of $${g.risk.maxTotalInvestmentUsd.toLocaleString()} — later orders will be trimmed.`,
    });
  }
  return out;
}

/* ─────────────────────────── persistence ─────────────────────────── */

const STORAGE_KEY = 'ga_pipeline_v4_graph';
const LEGACY_KEY = 'ga_blueprint_v2';

export const migrateLegacy = (nodes: BpNode[]): PipeGraph => {
  const g = emptyGraph();
  g.name = 'Imported strategy';
  const lane = makeLane('Lane 1', 0);
  lane.steps = nodes.map((n) => makeStep(n.kind, n.label, { ...(n.config ?? {}) }));
  g.lanes = [lane];
  return g;
};

export const loadGraph = (): PipeGraph => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PipeGraph;
      if (parsed && Array.isArray(parsed.lanes)) {
        return { ...emptyGraph(), ...parsed, risk: { ...emptyGraph().risk, ...(parsed.risk ?? {}) } };
      }
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const nodes = JSON.parse(legacy) as BpNode[];
      if (Array.isArray(nodes) && nodes.length) return migrateLegacy(nodes);
    }
  } catch { /* ignore */ }
  return emptyGraph();
};

export const saveGraph = (g: PipeGraph) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(g)); } catch { /* ignore */ }
};