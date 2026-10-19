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
