import type { PipeGraph } from './pipelineGraph';

/* ─────────────────── Run capital ──────────────────────────────────
   One question before a run: how much money is this strategy running
   on? Whatever the operator types IS the budget — $100 means $100.

   applyRunBudget adapts a strategy to that budget without touching
   the saved design: every buy ticket and the per-asset cap scale by
   budget / design-budget (the presets are all designed with tickets
   at a fixed share of their budget, so the strategy keeps its shape
   at any size), tickets never exceed the budget itself, and a floor
   keeps tickets tradeable on small accounts. The engine's own budget
   gate then enforces the number absolutely: it cannot deploy more
   than the run capital, ever.
   ──────────────────────────────────────────────────────────────── */

export interface BudgetPreview {
  designBudget: number;
  budget: number;
  ratio: number;
  lanes: Array<{ lane: string; designTicket: number; ticket: number; maxEntries: number }>;
  perAssetCap: number | null;
  totalCapacity: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const scaleTicket = (designTicket: number, ratio: number, budget: number): number => {
  const floor = budget >= 50 ? 5 : 1;
  const scaled = round2(designTicket * ratio);
  return Math.max(Math.min(scaled, budget), Math.min(floor, budget));
};

export const previewRunBudget = (graph: PipeGraph, budget: number): BudgetPreview => {
  const designBudget = Math.max(1, graph.risk?.maxTotalInvestmentUsd ?? budget);
  const ratio = budget / designBudget;
  const lanes: BudgetPreview['lanes'] = [];
  let totalCapacity = 0;
  for (const lane of graph.lanes ?? []) {
    const buy = (lane.steps ?? []).find((s) => s.kind === 'buy');
    if (!buy) continue;
    const designTicket = Number(buy.config?.amountUsd ?? 0);
    if (!(designTicket > 0)) continue;
    const ticket = scaleTicket(designTicket, ratio, budget);
    const maxEntries = Number(buy.config?.maxEntries ?? 1);
    lanes.push({ lane: lane.name, designTicket, ticket, maxEntries });
    totalCapacity += ticket * maxEntries;
  }
  const designCap = graph.risk?.maxPerAssetUsd;
  const biggestTicket = lanes.reduce((m, l) => Math.max(m, l.ticket), 0);
  const perAssetCap = designCap
    ? Math.min(budget, Math.max(round2(designCap * ratio), biggestTicket))
    : null;
  return { designBudget, budget, ratio, lanes, perAssetCap, totalCapacity };
};

/** Return a run-ready copy of the graph adapted to `budget`. The
    saved graph is never mutated. `adaptive` toggles the engine's
    realtime adaptive governor for this run. */
export const applyRunBudget = (graph: PipeGraph, budget: number, adaptive = true): PipeGraph => {
  const safeBudget = Math.max(1, Math.round(budget * 100) / 100);
  const preview = previewRunBudget(graph, safeBudget);
  const g: PipeGraph = JSON.parse(JSON.stringify(graph));
  g.risk = {
    ...g.risk,
    maxTotalInvestmentUsd: safeBudget,
    ...(preview.perAssetCap !== null ? { maxPerAssetUsd: preview.perAssetCap } : {}),
    adaptive,
  } as PipeGraph['risk'];
  const ticketByLane = new Map(preview.lanes.map((l) => [l.lane, l.ticket]));
  for (const lane of g.lanes ?? []) {
    const ticket = ticketByLane.get(lane.name);
    if (ticket === undefined) continue;
    for (const step of lane.steps ?? []) {
      if (step.kind === 'buy' && Number(step.config?.amountUsd ?? 0) > 0) {
        step.config = { ...step.config, amountUsd: ticket };
      }
    }
  }
  return g;
};

/* ─── The unified run setup ────────────────────────────────────────
   ONE form rules the run: the amount AND the limits. applyRunSetup
   stamps them all onto the run copy — budget adaptation first, then
   the operator's limits (loss limit, duration, check interval, close
   at end) and the full-deployment mandate. The saved design keeps
   its own values; the form wins for the run. */

export interface RunSetup {
  adaptive: boolean;
  fullDeployment: boolean;
  lossPct: number;
  durationMin: number;
  tickSec: number;
  flatten: boolean;
}

export function applyRunSetup(graph: PipeGraph, budget: number, setup: RunSetup): PipeGraph {
  const g = applyRunBudget(graph, budget, setup.adaptive);
  if (setup.lossPct > 0) g.risk.maxDrawdownPct = setup.lossPct;
  g.risk.fullDeployment = setup.fullDeployment === true;
  g.session = {
    ...g.session,
    durationMin: Math.max(0.1, setup.durationMin || g.session?.durationMin || 15),
    tickSec: Math.max(1, setup.tickSec || g.session?.tickSec || 5),
    flattenOnStop: setup.flatten,
  };
  return g;
}

/* The swarm allocation plan, in one line per lane: each lane's share
   of the budget, weighted by what the strategy designed it to work
   (ticket × entry capacity). This is the structure the run follows —
   screens pick the names, the swarm's agents judge them, the referee
   guards the whole book, and the deployment schedule works the full
   amount in. */
export function capitalPlan(graph: PipeGraph, budget: number): Array<{ lane: string; weightPct: number; ticket: number }> {
  const adapted = applyRunBudget(graph, budget);
  const rows = adapted.lanes
    .map((lane) => {
      const buy = lane.steps.find((s) => s.kind === 'buy');
      if (!buy) return null;
      const ticket = Number(buy.config?.amountUsd ?? 0);
      const capacity = Math.max(1, Number(buy.config?.maxEntries ?? 1));
      return { lane: lane.name, weight: ticket * capacity, ticket };
    })
    .filter((r): r is { lane: string; weight: number; ticket: number } => r !== null && r.weight > 0);
  const total = rows.reduce((s, r) => s + r.weight, 0) || 1;
  return rows.map((r) => ({ lane: r.lane, weightPct: Math.round((r.weight / total) * 100), ticket: r.ticket }));
}
