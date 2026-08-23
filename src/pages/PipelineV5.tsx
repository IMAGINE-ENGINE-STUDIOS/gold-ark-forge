// Pipeline V5 — the Tetris console.
//
// Same engine, graph model and blocks as V4 (see docs/pipeline-v4/ARCHITECTURE.md);
// what changes is the console metaphor: lanes are Tetris columns and steps are
// blocks that fall in and lock onto a stack that runs bottom → top.
//
//   palette (left)  ·  Tetris well (centre)  ·  inspector + report (right)
//
// The graph is shared with V4 through the same localStorage store, so a strategy
// built in either version opens in the other.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square, Trash2, Layers, SlidersHorizontal, ScrollText, Code2 } from 'lucide-react';
import Header from '@/components/Header';
import { PipelineProvider, usePipeline } from '@/components/pipeline/PipelineProvider';
import TetrisConsole from '@/components/pipeline5/TetrisConsole';
import BlockPalette from '@/components/pipeline4/BlockPalette';
import CodeStudio from '@/components/pipeline/CodeStudio';
import StepInspector from '@/components/pipeline4/StepInspector';
import AccountHud from '@/components/pipeline4/AccountHud';
import RunReport from '@/components/pipeline4/RunReport';
import { useLiveSeries } from '@/hooks/useLiveSeries';
import { useMarketHistory } from '@/hooks/useMarketHistory';
import { supabase } from '@/integrations/supabase/client';
import { classifyAssets } from '@/lib/assetClassifiers';
import { PROGRAM_BY_ID } from '@/lib/analysisPrograms';
import { loadBlocks, saveBlocks, type CustomBlock } from '@/lib/customBlocks';
import { REAL_FEED_SYMBOLS } from '@/data/tradingSymbols';
import { BLOCK_BY_ID, type BlockDef } from '@/lib/pipelineBlocks';
import {
  convertStep, emptyGraph, loadGraph, makeLane, makeStep, saveGraph, stepPath, totalSteps, uid,
  validateGraph, type PipeGraph, type PipeStep,
} from '@/lib/pipelineGraph';
import { runGraph, type AgentReply, type RunEvent, type RunResult } from '@/lib/parallelEngine';

const SEED = REAL_FEED_SYMBOLS.slice(0, 40).map((s) => s.ticker);

const Console = () => {
  const { paper, resolvePriceForTicker, changeForTicker, symbols } = usePipeline();

  const [graph, setGraph] = useState<PipeGraph>(() => loadGraph());
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [panel, setPanel] = useState<'step' | 'report' | 'dev'>('step');
  const [equityCurve, setEquityCurve] = useState<number[]>([]);
  const [runStartEquity, setRunStartEquity] = useState<number | null>(null);
  const [runSummary, setRunSummary] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [blocks, setBlocks] = useState<CustomBlock[]>(() => loadBlocks());

  const stopRef = useRef(false);
  const graphRef = useRef(graph);
  graphRef.current = graph;
  const paperRef = useRef(paper);
  paperRef.current = paper;

  useEffect(() => { saveGraph(graph); }, [graph]);
  useEffect(() => {
    if (!graph.lanes.length) setGraph((g) => ({ ...g, lanes: [makeLane('Lane 1', 0)] }));
    else if (!selectedLaneId) setSelectedLaneId(graph.lanes[0].id);
  }, [graph.lanes, selectedLaneId]);

  /* ── live market context ── */
  const { prime: primeHistory, getHistory } = useMarketHistory();
  const tracked = useMemo(() => Array.from(new Set(SEED)), []);
  const { getSeries, version } = useLiveSeries(tracked, resolvePriceForTicker, { intervalMs: 5000 });

  const classified = useMemo(() => {
    const seeded = new Set(tracked);
    return classifyAssets(
      symbols.filter((s) => seeded.has(s.ticker)).map((s) => ({
        ticker: s.ticker, label: s.label, cat: s.cat, symbolKey: s.key,
        last: resolvePriceForTicker(s.ticker), change24h: changeForTicker(s.ticker),
        samples: getSeries(s.ticker),
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols, tracked, version, resolvePriceForTicker, changeForTicker]);

  const issues = useMemo(
    () => validateGraph(graph, {
      hasProgram: (id) => PROGRAM_BY_ID.has(id),
      hasBlock: (id) => blocks.some((b) => b.id === id),
    }),
    [graph, blocks],
  );
  const blockingIssues = issues.filter((i) => i.level === 'error');

  /* ── mark open positions to the live feed every second ── */
  const positionsRef = useRef(paper.positions);
  positionsRef.current = paper.positions;
  const updatePricesRef = useRef(paper.updatePrices);
  updatePricesRef.current = paper.updatePrices;
  const priceRef = useRef(resolvePriceForTicker);
  priceRef.current = resolvePriceForTicker;

  useEffect(() => {
    const t = setInterval(() => {
      const map: Record<string, number> = {};
      for (const p of positionsRef.current) {
        const px = priceRef.current(p.symbol);
        if (px > 0) map[p.symbol] = px;
      }
      if (Object.keys(map).length) updatePricesRef.current(map);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const equityRef = useRef(paper.account.equity);
  equityRef.current = paper.account.equity;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setEquityCurve((c) => [...c.slice(-179), equityRef.current]), 1000);
    return () => clearInterval(t);
  }, [running]);

  /* ── selection ── */
  const selectedLane = graph.lanes.find((l) => l.id === selectedLaneId) ?? graph.lanes[0] ?? null;
  const selected = selectedStepId ? stepPath(graph, selectedStepId) : null;
  const selectedStep = selected ? selected.lane.steps[selected.index] : null;

  const selectedTicker = useMemo(() => {
    if (!selected) return null;
    const upto = selected.lane.steps.slice(0, selected.index + 1);
    for (let i = upto.length - 1; i >= 0; i--) {
      const t = upto[i].config?.ticker;
      if (t) return t as string;
    }
    return null;
  }, [selected]);
  const selectedPrice = useMemo(
    () => (selectedTicker ? resolvePriceForTicker(selectedTicker) : 0),
    [selectedTicker, resolvePriceForTicker],
  );

  /* ── graph mutations (identical semantics to V4) ── */
  const mutate = useCallback((fn: (g: PipeGraph) => PipeGraph) => {
    setGraph((g) => ({ ...fn({ ...g, lanes: g.lanes.map((l) => ({ ...l, steps: [...l.steps] })) }), updatedAt: Date.now() }));
  }, []);

  const addLane = useCallback((name?: string) => {
    const lane = makeLane(name ?? `Lane ${graphRef.current.lanes.length + 1}`, graphRef.current.lanes.length);
    mutate((g) => ({ ...g, lanes: [...g.lanes, lane] }));
    setSelectedLaneId(lane.id);
    return lane.id;
  }, [mutate]);

  const addStep = useCallback((laneId: string, kind: PipeStep['kind'], label: string, config: Record<string, any>) => {
    const step = makeStep(kind, label, config);
    mutate((g) => ({ ...g, lanes: g.lanes.map((l) => (l.id === laneId ? { ...l, steps: [...l.steps, step] } : l)) }));
    return step.id;
  }, [mutate]);

  /** A palette click drops a new piece into the selected column. */
  const dropBlock = useCallback((b: BlockDef) => {
    const laneId = selectedLane?.id ?? addLane();
    const id = addStep(laneId, b.kind, b.name, { ...(b.config ?? {}) });
    setSelectedStepId(id);
    setPanel('step');
  }, [selectedLane, addLane, addStep]);

  const updateStep = useCallback((stepId: string, config: Record<string, any>, label?: string) => {
    mutate((g) => ({
      ...g,
      lanes: g.lanes.map((l) => ({ ...l, steps: l.steps.map((s) => (s.id === stepId ? { ...s, config, label: label ?? s.label } : s)) })),
    }));
  }, [mutate]);

  const removeStep = useCallback((stepId: string) => {
    mutate((g) => ({ ...g, lanes: g.lanes.map((l) => ({ ...l, steps: l.steps.filter((s) => s.id !== stepId) })) }));
    setSelectedStepId(null);
  }, [mutate]);

  const moveStep = useCallback((stepId: string, dir: -1 | 1) => {
    mutate((g) => ({
      ...g,
      lanes: g.lanes.map((l) => {
        const i = l.steps.findIndex((s) => s.id === stepId);
        if (i < 0) return l;
        const j = i + dir;
        if (j < 0 || j >= l.steps.length) return l;
        const steps = [...l.steps];
        [steps[i], steps[j]] = [steps[j], steps[i]];
        return { ...l, steps };
      }),
    }));
  }, [mutate]);

  const changeStepKind = useCallback((stepId: string, blockId: string) => {
    const block = BLOCK_BY_ID.get(blockId);
    if (!block) return;
    mutate((g) => ({
      ...g,
      lanes: g.lanes.map((l) => ({
        ...l,
        steps: l.steps.map((s) => (s.id === stepId ? convertStep(s, { kind: block.kind, label: block.name, config: block.config }) : s)),
      })),
    }));
  }, [mutate]);

  const patchStep = useCallback((stepId: string, patch: Partial<PipeStep>) => {
    mutate((g) => ({ ...g, lanes: g.lanes.map((l) => ({ ...l, steps: l.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) })) }));
  }, [mutate]);

  const duplicateStep = useCallback((stepId: string) => {
    let newId: string | null = null;
    mutate((g) => ({
      ...g,
      lanes: g.lanes.map((l) => {
        const i = l.steps.findIndex((s) => s.id === stepId);
        if (i < 0) return l;
        const copy = { ...l.steps[i], id: uid('step'), config: { ...l.steps[i].config } };
        newId = copy.id;
        const steps = [...l.steps];
        steps.splice(i + 1, 0, copy);
        return { ...l, steps };
      }),
    }));
    if (newId) setSelectedStepId(newId);
  }, [mutate]);

  const moveStepToLane = useCallback((stepId: string, laneId: string) => {
    mutate((g) => {
      let moved: PipeStep | null = null;
      const stripped = g.lanes.map((l) => {
        const found = l.steps.find((s) => s.id === stepId);
        if (!found) return l;
        moved = found;
        return { ...l, steps: l.steps.filter((s) => s.id !== stepId) };
      });
      if (!moved) return g;
      return { ...g, lanes: stripped.map((l) => (l.id === laneId ? { ...l, steps: [...l.steps, moved as PipeStep] } : l)) };
    });
    setSelectedLaneId(laneId);
  }, [mutate]);

  const removeLane = useCallback((laneId: string) => {
    mutate((g) => ({ ...g, lanes: g.lanes.filter((l) => l.id !== laneId) }));
    setSelectedLaneId(null);
  }, [mutate]);

  const eraseAll = useCallback(() => {
    if (!window.confirm('Clear the whole well? Every column and block is deleted.')) return;
    const fresh = { ...emptyGraph(), lanes: [makeLane('Lane 1', 0)] };
    setGraph(fresh);
    setSelectedLaneId(fresh.lanes[0].id);
    setSelectedStepId(null);
    setEvents([]);
    setRunSummary(null);
  }, []);

  /* ── execution ── */
  const activeStepIds = useMemo(
    () => (running ? (events.slice(-Math.max(2, graph.lanes.length * 2)).map((e) => e.stepId).filter(Boolean) as string[]) : []),
    [events, running, graph.lanes.length],
  );
  const errorStepIds = useMemo(
    () => events.filter((e) => e.status === 'error').map((e) => e.stepId).filter(Boolean) as string[],
    [events],
  );

  const runAgent = useCallback(async (req: {
    systemPrompt: string; taskPrompt: string; model: string; temperature: number; context: Record<string, any>;
  }): Promise<AgentReply> => {
    const { data, error } = await supabase.functions.invoke('pipeline-agent', { body: req });
    if (error) throw new Error(error.message ?? 'agent call failed');
    return {
      verdict: (data?.verdict ?? 'hold') as AgentReply['verdict'],
      confidence: Number(data?.confidence ?? 0),
      reason: String(data?.reason ?? 'no reason given'),
    };
  }, []);

  const run = useCallback(async () => {
    if (running) return;
    stopRef.current = false;
    setEvents([]);
    setRunning(true);
    setPanel('report');
    setRunSummary(null);
    setRunResult(null);
    const startEquity = paperRef.current.account.equity;
    setRunStartEquity(startEquity);
    setEquityCurve([startEquity]);

    const tickers = Array.from(new Set(
      graphRef.current.lanes.flatMap((l) => l.steps.map((s) => s.config?.ticker).filter(Boolean) as string[]),
    ));
    if (tickers.length) await primeHistory(tickers, { interval: '1m', points: 300 });

    const collected: RunEvent[] = [];
    let result: RunResult | null = null;
    try {
      result = await runGraph(
        graphRef.current,
        {
          getPrice: resolvePriceForTicker,
          getSeries,
          getHistory,
          classified,
          blocks,
          getAccount: () => paperRef.current.account,
          submitOrder: (o) => paperRef.current.submitOrder(o) as any,
          closePosition: ({ ticker, qty, price }) =>
            paperRef.current.submitOrder({ symbol: ticker, side: 'sell', qty, type: 'market', price, botSource: true }),
          runAgent,
          shouldStop: () => stopRef.current,
        },
        (e) => {
          collected.push(e);
          setEvents((prev) => [...prev, e]);
          if (e.stepId) setSelectedStepId(e.stepId);
        },
      );
      setRunResult(result);
    } finally {
      setRunning(false);
      const errors = collected.filter((e) => e.status === 'error').length;
      const delta = equityRef.current - startEquity;
      const trades = result?.trades ?? [];
      const closed = trades.filter((t) => !t.open);
      setRunSummary(
        !collected.length
          ? 'The session finished without executing a single block — drop some pieces into a column first.'
          : `Session finished · ${result?.ticks ?? 0} ticks · ${trades.length} position${trades.length === 1 ? '' : 's'} opened,` +
            ` ${closed.length} closed · ${closed.reduce((s, t) => s + t.pnl, 0) >= 0 ? '+' : ''}$${closed.reduce((s, t) => s + t.pnl, 0).toFixed(2)} realised` +
            ` · ${errors} error${errors === 1 ? '' : 's'} · paper equity ${delta >= 0 ? '+' : ''}$${delta.toFixed(2)}.`,
      );
    }
  }, [running, resolvePriceForTicker, getSeries, getHistory, primeHistory, classified, blocks, runAgent]);

  /* ── session settings ── */
  const session = graph.session ?? { durationMin: 15, tickSec: 10, flattenOnStop: true };
  const setSession = (patch: Partial<typeof session>) =>
    setGraph((g) => ({ ...g, session: { ...session, ...patch }, updatedAt: Date.now() }));

  const numCls = 'w-16 rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[12px] text-foreground outline-none focus:border-primary/60';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1800px] px-3 pb-8 pt-20">
        {/* command bar */}
        <section className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/40 p-3 backdrop-blur">
          <div className="mr-auto">
            <h1 className="text-[15px] font-semibold text-foreground">Pipeline V5 · Tetris console</h1>
            <p className="text-[12px] text-muted-foreground">
              Every column is a lane. Blocks fall in and stack — the well runs bottom to top, all columns at once.
            </p>
          </div>

          <label className="flex items-center gap-1 text-[12px] text-muted-foreground">
            Minutes
            <input type="number" min={1} value={session.durationMin} onChange={(e) => setSession({ durationMin: Number(e.target.value) })} className={numCls} />
          </label>
          <label className="flex items-center gap-1 text-[12px] text-muted-foreground">
            Tick (s)
            <input type="number" min={2} value={session.tickSec} onChange={(e) => setSession({ tickSec: Number(e.target.value) })} className={numCls} />
          </label>

          <button onClick={eraseAll} className="flex items-center gap-1 rounded-md border border-destructive/50 px-2 py-1.5 text-[12px] text-destructive hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" /> Clear well
          </button>

          {running ? (
            <button onClick={() => { stopRef.current = true; }} className="flex items-center gap-1 rounded-md bg-destructive px-3 py-1.5 text-[13px] font-semibold text-destructive-foreground">
              <Square className="h-3.5 w-3.5" /> Stop session
            </button>
          ) : (
            <button
              onClick={() => run()}
              disabled={!!blockingIssues.length || !totalSteps(graph)}
              className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground disabled:opacity-40"
            >
              <Play className="h-3.5 w-3.5" /> Drop & run
            </button>
          )}
        </section>

        <AccountHud
          account={paper.account}
          positions={paper.positions}
          budget={graph.risk?.maxTotalInvestmentUsd ?? 0}
          lossLimitPct={graph.risk?.maxDrawdownPct ?? 10}
          runStartEquity={runStartEquity}
        />

        {runSummary && (
          <div className="mt-3 rounded-lg border border-primary/40 bg-primary/5 p-2 text-[12px] text-foreground">{runSummary}</div>
        )}
        {!!blockingIssues.length && (
          <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-2 text-[12px] text-destructive">
            {blockingIssues.map((i) => i.message).join(' · ')}
          </div>
        )}

        {/* workspace */}
        <div className="mt-3 grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)_380px]">
          <aside className="h-[640px] rounded-xl border border-border/60 bg-card/40 p-3 backdrop-blur">
            <BlockPalette onAdd={dropBlock} laneName={selectedLane?.name ?? 'Lane 1'} />
          </aside>

          <section className="h-[640px]">
            <TetrisConsole
              lanes={graph.lanes}
              selectedLaneId={selectedLane?.id ?? null}
              selectedStepId={selectedStepId}
              activeStepIds={activeStepIds}
              errorStepIds={errorStepIds}
              running={running}
              onSelectLane={setSelectedLaneId}
              onSelectStep={(id) => { setSelectedStepId(id); setPanel('step'); }}
              onAddLane={() => addLane()}
              onRemoveLane={removeLane}
              onMoveStep={moveStep}
              onDeleteStep={removeStep}
            />
          </section>

          <aside className="flex h-[640px] flex-col rounded-xl border border-border/60 bg-card/40 p-3 backdrop-blur">
            <div className="mb-2 flex gap-1">
              {([['step', 'Block', SlidersHorizontal], ['report', 'Report', ScrollText], ['dev', 'Dev', Code2]] as const).map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setPanel(id)}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-[12px] transition ${
                    panel === id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              {panel === 'step' ? (
                selectedStep ? (
                  <StepInspector
                    step={selectedStep}
                    price={selectedPrice}
                    ticker={selectedTicker}
                    getPrice={resolvePriceForTicker}
                    blocks={blocks}
                    lanes={graph.lanes}
                    currentLaneId={selected?.lane.id ?? null}
                    onChange={(config, label) => updateStep(selectedStep.id, config, label)}
                    onDelete={() => removeStep(selectedStep.id)}
                    onMove={(dir) => moveStep(selectedStep.id, dir)}
                    onChangeKind={(blockId) => changeStepKind(selectedStep.id, blockId)}
                    onPatch={(patch) => patchStep(selectedStep.id, patch)}
                    onDuplicate={() => duplicateStep(selectedStep.id)}
                    onMoveToLane={(laneId) => moveStepToLane(selectedStep.id, laneId)}
                  />
                ) : (
                  <div className="grid h-full place-items-center text-center text-[12px] text-muted-foreground">
                    <div>
                      <Layers className="mx-auto mb-2 h-5 w-5" />
                      Pick a block in the well to configure it.
                    </div>
                  </div>
                )
              ) : panel === 'report' ? (
                <RunReport events={events} result={runResult} running={running} equityCurve={equityCurve} startEquity={runStartEquity} />
              ) : (
                /* Dev environment: write, test and ship custom code blocks straight
                   into the well without leaving the console. */
                <CodeStudio
                  blocks={blocks}
                  onBlocksChange={setBlocks}
                  onAddToBlueprint={(b) => {
                    const laneId = selectedLane?.id ?? addLane();
                    const id = addStep(laneId, 'code', b.name, { blockId: b.id });
                    setSelectedStepId(id);
                    setPanel('step');
                  }}
                  sampleInput={() => ({
                    ticker: selectedTicker ?? 'XAUUSD',
                    price: selectedPrice,
                    series: [],
                    account: { equity: paper?.account?.equity ?? 0 },
                  })}
                />
              )}
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
};

export default function PipelineV5() {
  return (
    <PipelineProvider>
      <Console />
    </PipelineProvider>
  );
}
