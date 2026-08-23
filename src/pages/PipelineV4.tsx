import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square, Plus, Layers, Bot, SlidersHorizontal, ScrollText, Trash2, Users, Boxes, Wallet, Receipt, CandlestickChart, LayoutGrid } from 'lucide-react';
import Header from '@/components/Header';
import { PipelineProvider, usePipeline } from '@/components/pipeline/PipelineProvider';
import PipelineScene3D from '@/components/pipeline4/PipelineScene3D';
import BlockPalette from '@/components/pipeline4/BlockPalette';
import StepInspector from '@/components/pipeline4/StepInspector';
import GeniusPanel, { type GeniusAction, type GeniusMemory } from '@/components/pipeline4/GeniusPanel';
import AccountHud from '@/components/pipeline4/AccountHud';
import PositionsPanel from '@/components/pipeline4/PositionsPanel';
import OrdersPanel from '@/components/pipeline4/OrdersPanel';
import TradeDesk from '@/components/pipeline4/TradeDesk';
import ScreensPanel from '@/components/pipeline4/ScreensPanel';
import RunPerformance, { type LaneStat } from '@/components/pipeline4/RunPerformance';
import { useLiveSeries } from '@/hooks/useLiveSeries';
import { ASSET_CLASSES, classifyAssets } from '@/lib/assetClassifiers';
import { ANALYSIS_PROGRAMS, PROGRAM_BY_ID } from '@/lib/analysisPrograms';
import { buildMarketIntelligence } from '@/lib/objectiveEngine';
import { loadBlocks, saveBlocks, normalizeBlockCode, type CustomBlock } from '@/lib/customBlocks';
import { REAL_FEED_SYMBOLS } from '@/data/tradingSymbols';
import { BLOCK_BY_ID, describeStep, type BlockDef } from '@/lib/pipelineBlocks';
import {
  emptyGraph, loadGraph, makeLane, makeStep, saveGraph, stepPath, totalSteps,
  validateGraph, type PipeGraph, type PipeStep,
} from '@/lib/pipelineGraph';
import { runGraph, type RunEvent } from '@/lib/parallelEngine';

const SEED = REAL_FEED_SYMBOLS.slice(0, 40).map((s) => s.ticker);
const blockUid = () => `blk_${Math.random().toString(36).slice(2, 9)}`;

const Workspace = () => {
  const { paper, resolvePriceForTicker, changeForTicker, symbols } = usePipeline();
  const [graph, setGraph] = useState<PipeGraph>(() => loadGraph());
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [panel, setPanel] = useState<'genius' | 'step' | 'report'>('genius');
  const [rail, setRail] = useState<'blocks' | 'positions' | 'orders' | 'trade' | 'screens'>('blocks');
  const [equityCurve, setEquityCurve] = useState<number[]>([]);
  const [runStartEquity, setRunStartEquity] = useState<number | null>(null);
  const [runSummary, setRunSummary] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<CustomBlock[]>(() => loadBlocks());

  const stopRef = useRef(false);
  const graphRef = useRef(graph);
  graphRef.current = graph;
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  useEffect(() => { saveGraph(graph); }, [graph]);
  useEffect(() => {
    if (!graph.lanes.length) {
      setGraph((g) => ({ ...g, lanes: [makeLane('Lane 1', 0)] }));
    } else if (!selectedLaneId) {
      setSelectedLaneId(graph.lanes[0].id);
    }
  }, [graph.lanes, selectedLaneId]);

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

  /* ── live P&L: repaint open positions from the feed every second ── */
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

  /* ── equity curve sampling while a run is live ── */
  const equityRef = useRef(paper.account.equity);
  equityRef.current = paper.account.equity;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setEquityCurve((c) => [...c.slice(-179), equityRef.current]);
    }, 1000);
    return () => clearInterval(t);
  }, [running]);
  const blockingIssues = issues.filter((i) => i.level === 'error');

  const selectedLane = graph.lanes.find((l) => l.id === selectedLaneId) ?? graph.lanes[0] ?? null;
  const selected = selectedStepId ? stepPath(graph, selectedStepId) : null;
  const selectedStep = selected ? selected.lane.steps[selected.index] : null;

  /* ─────────────── graph mutations ─────────────── */

  const mutate = useCallback((fn: (g: PipeGraph) => PipeGraph) => {
    setGraph((g) => ({ ...fn({ ...g, lanes: g.lanes.map((l) => ({ ...l, steps: [...l.steps] })) }), updatedAt: Date.now() }));
  }, []);

  const addLane = useCallback((name?: string, consensus = false) => {
    const lane = makeLane(name ?? `Lane ${graphRef.current.lanes.length + 1}`, graphRef.current.lanes.length);
    lane.consensus = consensus;
    if (consensus) lane.agree = { mode: 'majority', expects: 'bullish' };
    mutate((g) => ({ ...g, lanes: [...g.lanes, lane] }));
    setSelectedLaneId(lane.id);
    return lane.id;
  }, [mutate]);

  const addStep = useCallback((laneId: string, kind: PipeStep['kind'], label: string, config: Record<string, any>) => {
    const step = makeStep(kind, label, config);
    mutate((g) => ({
      ...g,
      lanes: g.lanes.map((l) => (l.id === laneId ? { ...l, steps: [...l.steps, step] } : l)),
    }));
    return step.id;
  }, [mutate]);

  const addBlock = useCallback((b: BlockDef) => {
    const laneId = selectedLane?.id ?? addLane();
    const id = addStep(laneId, b.kind, b.name, { ...(b.config ?? {}) });
    setSelectedStepId(id);
    setPanel('step');
  }, [selectedLane, addLane, addStep]);

  const updateStep = useCallback((stepId: string, config: Record<string, any>, label?: string) => {
    mutate((g) => ({
      ...g,
      lanes: g.lanes.map((l) => ({
        ...l,
        steps: l.steps.map((s) => (s.id === stepId ? { ...s, config, label: label ?? s.label } : s)),
      })),
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

  const removeLane = useCallback((laneId: string) => {
    mutate((g) => ({ ...g, lanes: g.lanes.filter((l) => l.id !== laneId) }));
    setSelectedLaneId(null);
  }, [mutate]);

  /* ─────────────── execution ─────────────── */

  const activeStepIds = useMemo(
    () => (running ? events.slice(-graph.lanes.length * 2).map((e) => e.stepId).filter(Boolean) as string[] : []),
    [events, running, graph.lanes.length],
  );
  const errorStepIds = useMemo(
    () => events.filter((e) => e.status === 'error').map((e) => e.stepId).filter(Boolean) as string[],
    [events],
  );

  /* per-lane live performance derived from the run trace */
  const laneStats = useMemo<LaneStat[]>(() => graph.lanes.map((lane) => {
    const evs = events.filter((e) => e.laneId === lane.id);
    const done = new Set(evs.map((e) => e.stepId).filter(Boolean)).size;
    const trades = evs.filter((e) => e.status === 'ok' && /^(Bought|Sold) \$/.test(e.message)).length;
    const invested = evs.reduce((sum, e) => {
      const m = e.message.match(/^Bought \$([\d,]+)/);
      return m ? sum + Number(m[1].replace(/,/g, '')) : sum;
    }, 0);
    const errors = evs.filter((e) => e.status === 'error').length;
    const status: LaneStat['status'] =
      errors ? 'error'
      : running && evs.length ? 'running'
      : evs.length ? 'done'
      : 'idle';
    return {
      laneId: lane.id, laneName: lane.name, steps: lane.steps.length,
      done, trades, invested, errors, status,
      last: evs.length ? evs[evs.length - 1].message : '',
    };
  }), [graph.lanes, events, running]);

  const reporterRef = useRef<((trace: string) => void) | null>(null);
  const registerReporter = useCallback((fn: (trace: string) => void) => { reporterRef.current = fn; }, []);

  const run = useCallback(async (reportToGenius = false) => {
    if (running) return;
    stopRef.current = false;
    setEvents([]);
    setRunning(true);
    setPanel('report');
    setRunSummary(null);
    const startEquity = paper.account.equity;
    setRunStartEquity(startEquity);
    setEquityCurve([startEquity]);
    const collected: any[] = [];
    try {
      await runGraph(
        graphRef.current,
        {
          getPrice: resolvePriceForTicker,
          getSeries,
          classified,
          blocks: blocksRef.current,
          account: paper.account,
          submitOrder: paper.submitOrder as any,
          shouldStop: () => stopRef.current,
        },
        (e) => {
          collected.push(e);
          setEvents((prev) => [...prev, e]);
          if (e.stepId) setSelectedStepId(e.stepId); // camera follows the step being executed
        },
      );
    } finally {
      setRunning(false);
      const trades = collected.filter((e) => e.status === 'ok' && /^(Bought|Sold) \$/.test(e.message ?? '')).length;
      const errors = collected.filter((e) => e.status === 'error').length;
      const skips = collected.filter((e) => e.status === 'skip').length;
      const delta = equityRef.current - startEquity;
      setRunSummary(
        !collected.length
          ? 'The run finished without executing a single step — add blocks to a lane first.'
          : `Run finished · ${collected.length} steps across ${graphRef.current.lanes.length} lanes · ${trades} paper trade${trades === 1 ? '' : 's'}` +
            ` · ${skips} step${skips === 1 ? '' : 's'} skipped by a condition · ${errors} error${errors === 1 ? '' : 's'}` +
            ` · paper equity ${delta >= 0 ? '+' : ''}$${delta.toFixed(2)}. Full step-by-step trace is in the Report panel on the right.`,
      );
      if (reportToGenius && reporterRef.current) {
        const trace = collected.length
          ? collected.slice(-40).map((e) => `[${e.status}] ${e.laneName} › ${e.stepLabel}: ${e.message ?? ''}`).join('\n')
          : 'The run produced no steps at all.';
        reporterRef.current(trace);
      }
    }
  }, [running, resolvePriceForTicker, getSeries, classified, paper]);

  const erasePipeline = useCallback(() => {
    if (!window.confirm('Erase the whole pipeline? Every lane and step is deleted. This cannot be undone.')) return;
    const fresh = { ...emptyGraph(), lanes: [makeLane('Lane 1', 0)] };
    setGraph(fresh);
    setSelectedLaneId(fresh.lanes[0].id);
    setSelectedStepId(null);
    setEvents([]);
    setRunSummary(null);
  }, []);


  /* ─────────────── Genius bridge ─────────────── */

  const buildContext = useCallback((memory: GeniusMemory) => {
    const intel = buildMarketIntelligence({ classified, getSeries, objectiveText: memory.objective, sampleSeconds: 5, limit: 12 });
    const g = graphRef.current;
    return {
      route: '/pipeline-v4',
      memory,
      account: paper.account,
      risk: g.risk,
      strategy: g.lanes.map((l, li) => ({
        laneIndex: li, name: l.name, consensus: !!l.consensus, agree: l.agree,
        steps: l.steps.map((s, si) => ({ stepIndex: si, kind: s.kind, label: s.label, config: s.config })),
      })),
      validationIssues: issues,
      lastRun: events.slice(-40).map((e) => ({ lane: e.laneName, step: e.stepLabel, status: e.status, message: e.message })),
      running,
      marketIntelligence: intel,
      screens: ASSET_CLASSES.map((c) => ({
        id: c.id, label: c.label, blurb: c.blurb,
        top: [...classified].sort((a, b) => (b.scores[c.id] ?? 0) - (a.scores[c.id] ?? 0)).slice(0, 4)
          .map((a) => ({ ticker: a.ticker, label: a.label, price: a.last, change: a.derived.change })),
      })),
      analysisPrograms: ANALYSIS_PROGRAMS.map((p) => ({ id: p.id, label: p.label, blurb: p.blurb })),
      codeBoxes: blocksRef.current.map((b) => ({ id: b.id, name: b.name, description: b.description })),
    };
  }, [classified, getSeries, paper.account, issues, events, running]);

  const applyActions = useCallback((actions: GeniusAction[]) => {
    const notes: string[] = [];
    let created = [...blocksRef.current];
    let blocksChanged = false;

    for (const a of actions) {
      switch (a.op) {
        case 'clear':
          setGraph({ ...emptyGraph(), lanes: [makeLane('Lane 1', 0)] });
          notes.push('cleared the strategy');
          break;
        case 'replace_all': {
          const lanes = (a.lanes ?? []).map((l, i) => {
            const lane = makeLane(l.name || `Lane ${i + 1}`, i);
            lane.consensus = !!l.consensus;
            if (l.agree) lane.agree = l.agree;
            lane.steps = (l.steps ?? []).map((s) => {
              const def = BLOCK_BY_ID.get(s.kind);
              return makeStep(s.kind as any, s.label || def?.name || s.kind, { ...(def?.config ?? {}), ...(s.config ?? {}) });
            });
            return lane;
          });
          if (lanes.length) {
            setGraph((g) => ({ ...g, lanes, updatedAt: Date.now() }));
            setSelectedLaneId(lanes[0].id);
            notes.push(`built ${lanes.length} parallel lane${lanes.length === 1 ? '' : 's'}`);
          }
          break;
        }
        case 'add_lanes': {
          // append new lanes WITHOUT touching anything already on the canvas
          const lanes = (a.lanes ?? []).map((l, i) => {
            const lane = makeLane(l.name || `Lane ${graphRef.current.lanes.length + i + 1}`, graphRef.current.lanes.length + i);
            lane.consensus = !!l.consensus;
            if (l.agree) lane.agree = l.agree;
            lane.steps = (l.steps ?? []).map((s) => {
              const def = BLOCK_BY_ID.get(s.kind);
              return makeStep(s.kind as any, s.label || def?.name || s.kind, { ...(def?.config ?? {}), ...(s.config ?? {}) });
            });
            return lane;
          });
          if (lanes.length) {
            mutate((g) => ({ ...g, lanes: [...g.lanes, ...lanes] }));
            setSelectedLaneId(lanes[0].id);
            notes.push(`added ${lanes.length} new lane${lanes.length === 1 ? '' : 's'} alongside the existing ones`);
          }
          break;
        }
        case 'replace_lane': {
          // rewrite one lane only, leaving every other lane untouched
          const target = graphRef.current.lanes[a.laneIndex ?? -1];
          const spec = a.lanes?.[0];
          if (target && spec) {
            const steps = (spec.steps ?? []).map((s) => {
              const def = BLOCK_BY_ID.get(s.kind);
              return makeStep(s.kind as any, s.label || def?.name || s.kind, { ...(def?.config ?? {}), ...(s.config ?? {}) });
            });
            mutate((g) => ({
              ...g,
              lanes: g.lanes.map((l) => (l.id === target.id
                ? { ...l, name: spec.name || l.name, consensus: spec.consensus ?? l.consensus, agree: spec.agree ?? l.agree, steps }
                : l)),
            }));
            notes.push(`rebuilt ${spec.name || target.name}`);
          }
          break;
        }
        case 'rename_lane': {
          const target = graphRef.current.lanes[a.laneIndex ?? -1];
          if (target && a.laneName) {
            mutate((g) => ({ ...g, lanes: g.lanes.map((l) => (l.id === target.id ? { ...l, name: a.laneName! } : l)) }));
            notes.push(`renamed ${target.name} to ${a.laneName}`);
          }
          break;
        }
        case 'add_lane': {
          addLane(a.laneName, !!a.consensus);
          notes.push(`added lane ${a.laneName ?? ''}`.trim());
          break;
        }

        case 'add_step': {
          const lanes = graphRef.current.lanes;
          const lane = lanes[a.laneIndex ?? 0] ?? lanes[0];
          if (lane && a.kind) {
            const def = BLOCK_BY_ID.get(a.kind);
            addStep(lane.id, a.kind as any, a.label || def?.name || a.kind, { ...(def?.config ?? {}), ...(a.config ?? {}) });
            notes.push(`added ${a.label || a.kind} to ${lane.name}`);
          }
          break;
        }
        case 'update_step': {
          const lane = graphRef.current.lanes[a.laneIndex ?? 0];
          const step = lane?.steps[a.stepIndex ?? -1];
          if (step) { updateStep(step.id, { ...step.config, ...(a.config ?? {}) }, a.label); notes.push(`updated ${step.label}`); }
          break;
        }
        case 'remove_step': {
          const lane = graphRef.current.lanes[a.laneIndex ?? 0];
          const step = lane?.steps[a.stepIndex ?? -1];
          if (step) { removeStep(step.id); notes.push(`removed ${step.label}`); }
          break;
        }
        case 'remove_lane': {
          const lane = graphRef.current.lanes[a.laneIndex ?? -1];
          if (lane) { removeLane(lane.id); notes.push(`removed ${lane.name}`); }
          break;
        }
        case 'set_risk':
          if (a.risk) {
            setGraph((g) => ({ ...g, risk: { ...g.risk, ...a.risk }, updatedAt: Date.now() }));
            notes.push('updated the risk limits');
          }
          break;
        case 'create_code_block': {
          if (a.code && a.blockName) {
            const block: CustomBlock = {
              id: blockUid(), name: a.blockName, description: a.description ?? 'Written by Genius',
              code: normalizeBlockCode(a.code), updatedAt: Date.now(),
            } as CustomBlock;
            created = [...created.filter((b) => b.name !== block.name), block];
            blocksChanged = true;
            notes.push(`wrote custom code "${block.name}"`);
          }
          break;
        }
        case 'run':
          notes.push('running the strategy');
          setTimeout(() => { void run(true); }, 60);
          break;
        case 'stop':
          stopRef.current = true;
          notes.push('stopping the run');
          break;
        default:
          break;
      }
    }

    if (blocksChanged) { setBlocks(created); saveBlocks(created); }
    return notes;
  }, [addLane, addStep, updateStep, removeStep, removeLane, run]);

  /* ─────────────── render ─────────────── */

  const selectedPrice = useMemo(() => {
    if (!selected) return 0;
    const upto = selected.lane.steps.slice(0, selected.index + 1);
    for (let i = upto.length - 1; i >= 0; i--) {
      const t = upto[i].config?.ticker;
      if (t) return resolvePriceForTicker(t);
    }
    return 0;
  }, [selected, resolvePriceForTicker]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1800px] px-3 pb-8 pt-20">
        {/* command bar */}
        <section className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/40 p-3 backdrop-blur">
          <div className="mr-auto">
            <input
              value={graph.name}
              onChange={(e) => setGraph((g) => ({ ...g, name: e.target.value }))}
              className="w-56 bg-transparent text-[18px] font-semibold tracking-tight text-foreground outline-none"
            />
            <p className="text-[12px] text-muted-foreground">
              {graph.lanes.length} lanes running side by side · {totalSteps(graph)} steps · paper equity $
              {Math.round(paper.account.equity).toLocaleString()}
            </p>
          </div>

          <label className="text-[12px] text-muted-foreground">
            Strategy budget
            <input
              type="number"
              value={graph.risk.maxTotalInvestmentUsd}
              onChange={(e) => setGraph((g) => ({ ...g, risk: { ...g.risk, maxTotalInvestmentUsd: Number(e.target.value) } }))}
              className="ml-2 w-28 rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[13px] text-foreground outline-none"
            />
          </label>
          <label className="text-[12px] text-muted-foreground">
            Loss limit %
            <input
              type="number"
              value={graph.risk.maxDrawdownPct}
              onChange={(e) => setGraph((g) => ({ ...g, risk: { ...g.risk, maxDrawdownPct: Number(e.target.value) } }))}
              className="ml-2 w-20 rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[13px] text-foreground outline-none"
            />
          </label>

          <button
            onClick={() => addLane()}
            className="flex items-center gap-1.5 rounded-md border border-border/60 px-2.5 py-1.5 text-[13px] text-foreground hover:border-primary/60"
          >
            <Plus className="h-3.5 w-3.5" /> Lane
          </button>
          <button
            onClick={() => addLane('Confirmation', true)}
            className="flex items-center gap-1.5 rounded-md border border-border/60 px-2.5 py-1.5 text-[13px] text-foreground hover:border-primary/60"
          >
            <Users className="h-3.5 w-3.5" /> Consensus lane
          </button>

          <button
            onClick={erasePipeline}
            disabled={running}
            className="flex items-center gap-1.5 rounded-md border border-destructive/50 px-2.5 py-1.5 text-[13px] text-destructive hover:bg-destructive/10 disabled:opacity-40"
            title="Delete every lane and step and start from a blank pipeline"
          >
            <Trash2 className="h-3.5 w-3.5" /> Erase pipeline
          </button>

        </section>

        {!!issues.length && (
          <div className="mb-3 space-y-1 rounded-lg border border-amber-500/40 bg-amber-500/5 p-2">
            {issues.slice(0, 4).map((i, idx) => (
              <p key={idx} className={`text-[13px] ${i.level === 'error' ? 'text-rose-300' : 'text-amber-300'}`}>
                {i.laneName ? `${i.laneName}: ` : ''}{i.message}
              </p>
            ))}
          </div>
        )}

        <AccountHud
          account={paper.account}
          positions={paper.positions}
          budget={graph.risk.maxTotalInvestmentUsd}
          lossLimitPct={graph.risk.maxDrawdownPct}
          runStartEquity={runStartEquity}
        />

        <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
          {/* left rail */}
          <aside className="order-2 flex h-[460px] flex-col rounded-xl border border-border/60 bg-card/40 p-2 backdrop-blur lg:order-1 lg:h-[640px]">
            <div className="mb-2 grid grid-cols-5 gap-1">
              {([
                { id: 'blocks', label: 'Blocks', icon: Boxes },
                { id: 'positions', label: 'Book', icon: Wallet },
                { id: 'orders', label: 'Fills', icon: Receipt },
                { id: 'trade', label: 'Trade', icon: CandlestickChart },
                { id: 'screens', label: 'Screens', icon: LayoutGrid },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setRail(t.id)}
                  title={t.label}
                  className={`flex flex-col items-center gap-0.5 rounded-md border px-1 py-1 text-[11px] transition ${
                    rail === t.id ? 'border-primary/60 bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1">
              {rail === 'blocks' && <BlockPalette onAdd={addBlock} laneName={selectedLane?.name ?? 'Lane 1'} />}
              {rail === 'positions' && (
                <PositionsPanel
                  positions={paper.positions}
                  getPrice={resolvePriceForTicker}
                  onClose={(id, px) => paper.closePosition(id, px)}
                  onCloseAll={() => paper.positions.forEach((p) => {
                    const px = resolvePriceForTicker(p.symbol) || p.currentPrice;
                    if (px > 0) paper.closePosition(p.id, px);
                  })}
                />
              )}
              {rail === 'orders' && <OrdersPanel orders={paper.orders} />}
              {rail === 'trade' && (
                <TradeDesk
                  getPrice={resolvePriceForTicker}
                  cash={paper.account.cash}
                  onSubmit={(p) => paper.submitOrder(p as any)}
                  defaultTicker={selectedStep?.config?.ticker ?? null}
                />
              )}
              {rail === 'screens' && (
                <ScreensPanel
                  assets={classified}
                  onAddScreen={(classId, label) => {
                    const laneId = selectedLane?.id ?? addLane();
                    const id = addStep(laneId, 'screen', label, { classId, limit: 5, bindTop: true });
                    setSelectedStepId(id); setPanel('step');
                  }}
                  onAddAsset={(ticker, label) => {
                    const laneId = selectedLane?.id ?? addLane();
                    const id = addStep(laneId, 'asset', label, { ticker, label });
                    setSelectedStepId(id); setPanel('step');
                  }}
                />
              )}
            </div>
          </aside>

          {/* 3D stage */}
          <section className="order-1 h-[420px] overflow-hidden rounded-xl border border-border/60 bg-[#05070d] lg:order-2 lg:h-[640px]">
            <PipelineScene3D
              graph={graph}
              selectedStepId={selectedStepId}
              selectedLaneId={selectedLane?.id ?? null}
              activeStepIds={activeStepIds}
              errorStepIds={errorStepIds}
              onSelectStep={(laneId, stepId) => { setSelectedLaneId(laneId); setSelectedStepId(stepId); setPanel('step'); }}
              onSelectLane={(laneId) => { setSelectedLaneId(laneId); setSelectedStepId(null); }}
            />
          </section>

          {/* right rail */}
          <aside className="order-3 flex h-[540px] flex-col rounded-xl border border-border/60 bg-card/40 p-3 backdrop-blur lg:h-[640px]">
            <div className="mb-2 flex gap-1">
              {([
                { id: 'genius', label: 'Genius', icon: Bot },
                { id: 'step', label: 'Step', icon: SlidersHorizontal },
                { id: 'report', label: 'Report', icon: ScrollText },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPanel(t.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[13px] transition ${
                    panel === t.id ? 'border-primary/60 bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1">
              {panel === 'genius' && (
                <GeniusPanel
                  buildContext={buildContext}
                  onActions={applyActions}
                  registerReporter={registerReporter}
                  running={running}
                  laneCount={graph.lanes.length}
                  issueCount={blockingIssues.length}
                />
              )}

              {panel === 'step' && (
                selectedStep ? (
                  <StepInspector
                    step={selectedStep}
                    price={selectedPrice}
                    blocks={blocks}
                    onChange={(config, label) => updateStep(selectedStep.id, config, label)}
                    onDelete={() => removeStep(selectedStep.id)}
                    onMove={(dir) => moveStep(selectedStep.id, dir)}
                  />
                ) : selectedLane ? (
                  <div className="space-y-3">
                    <div>
                      <div className="text-[13px] font-semibold text-foreground">{selectedLane.name}</div>
                      <p className="text-[12px] text-muted-foreground">
                        {selectedLane.consensus
                          ? 'This lane waits for the other lanes and only continues when enough of them agree.'
                          : 'This lane runs at the same time as every other lane.'}
                      </p>
                    </div>
                    <label className="block space-y-1">
                      <span className="block text-[13px] font-medium text-foreground">Lane name</span>
                      <input
                        value={selectedLane.name}
                        onChange={(e) => mutate((g) => ({ ...g, lanes: g.lanes.map((l) => (l.id === selectedLane.id ? { ...l, name: e.target.value } : l)) }))}
                        className="w-full rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[13px] text-foreground outline-none focus:border-primary/60"
                      />
                    </label>
                    {selectedLane.consensus && (
                      <label className="block space-y-1">
                        <span className="block text-[13px] font-medium text-foreground">Continue when</span>
                        <select
                          value={selectedLane.agree?.mode ?? 'majority'}
                          onChange={(e) => mutate((g) => ({
                            ...g,
                            lanes: g.lanes.map((l) => (l.id === selectedLane.id ? { ...l, agree: { ...(l.agree ?? {}), mode: e.target.value as any, expects: l.agree?.expects ?? 'bullish' } } : l)),
                          }))}
                          className="w-full rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[13px] text-foreground outline-none"
                        >
                          <option value="all">Every lane agrees</option>
                          <option value="majority">Most lanes agree</option>
                          <option value="any">Any lane agrees</option>
                        </select>
                      </label>
                    )}
                    <ul className="space-y-1">
                      {selectedLane.steps.map((s) => (
                        <li key={s.id}>
                          <button
                            onClick={() => setSelectedStepId(s.id)}
                            className="flex w-full items-center justify-between rounded border border-border/50 px-2 py-1 text-left text-[13px] text-foreground hover:border-primary/50"
                          >
                            <span className="truncate">{s.label}</span>
                            <span className="ml-2 shrink-0 text-[12px] text-muted-foreground">{describeStep(s.kind, s.config)}</span>
                          </button>
                        </li>
                      ))}
                      {!selectedLane.steps.length && <li className="text-[12px] text-muted-foreground">No steps yet — add one from the left.</li>}
                    </ul>
                    <button
                      onClick={() => removeLane(selectedLane.id)}
                      className="flex items-center gap-1.5 rounded-md border border-destructive/50 px-2 py-1 text-[13px] text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete lane
                    </button>
                  </div>
                ) : (
                  <p className="text-[13px] text-muted-foreground">Select a lane or a step in the 3D view.</p>
                )
              )}

              {panel === 'report' && (
                <RunPerformance
                  events={events}
                  lanes={laneStats}
                  equityCurve={equityCurve}
                  running={running}
                  startEquity={runStartEquity}
                  equity={paper.account.equity}
                />
              )}
            </div>
          </aside>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Layers className="h-3.5 w-3.5" /> Every lane executes simultaneously against live prices on the paper account. Nothing here trades real money.
        </p>
      </main>
    </div>
  );
};

export default function PipelineV4() {
  return (
    <PipelineProvider seedTickers={SEED} intervalMs={8000}>
      <Workspace />
    </PipelineProvider>
  );
}