import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square, Plus, Layers, Bot, SlidersHorizontal, ScrollText, Trash2, Users, Boxes, Wallet, Receipt, CandlestickChart, LayoutGrid, Library } from 'lucide-react';
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
import RunReport from '@/components/pipeline4/RunReport';
import { useLiveSeries } from '@/hooks/useLiveSeries';
import { useMarketHistory } from '@/hooks/useMarketHistory';
import { supabase } from '@/integrations/supabase/client';
import { ASSET_CLASSES, classifyAssets } from '@/lib/assetClassifiers';
import { ANALYSIS_PROGRAMS, PROGRAM_BY_ID } from '@/lib/analysisPrograms';
import { buildMarketIntelligence } from '@/lib/objectiveEngine';
import { loadBlocks, saveBlocks, normalizeBlockCode, type CustomBlock } from '@/lib/customBlocks';
import { ALL_SYMBOLS, REAL_FEED_SYMBOLS } from '@/data/tradingSymbols';
import GALiveChart from '@/components/trading/GALiveChart';
import { loadRunMemory, recordRun, clearRunMemory, memoryTotals, type RunMemoryEntry } from '@/lib/pipelineMemory';
import { useBrokerConnections, brokerCall } from '@/hooks/useBrokerTrading';
import { BUILT_IN_STRATEGIES, listSavedStrategies, saveStrategy, deleteSavedStrategy, performanceByStrategy, type LibraryEntry } from '@/lib/strategyLibrary';
import { BLOCK_BY_ID, describeStep, type BlockDef } from '@/lib/pipelineBlocks';
import {
  convertStep, emptyGraph, loadGraph, makeLane, makeStep, saveGraph, stepPath, totalSteps, uid,
  validateGraph, type PipeGraph, type PipeStep,
} from '@/lib/pipelineGraph';
import { runGraph, type AgentReply, type RunEvent, type RunResult } from '@/lib/parallelEngine';

const SEED = REAL_FEED_SYMBOLS.slice(0, 40).map((s) => s.ticker);
const blockUid = () => `blk_${Math.random().toString(36).slice(2, 9)}`;

const Workspace = () => {
  const { paper, resolvePriceForTicker, changeForTicker, symbols } = usePipeline();
  const [graph, setGraph] = useState<PipeGraph>(() => loadGraph());
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [interruptedRun, setInterruptedRun] = useState<{ name: string; at: number } | null>(() => {
    try {
      const raw = localStorage.getItem('ga_pipeline_v4_active_run');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  // A run stops ONLY when its program ends, its risk rules stop it, or the
  // user stops it — so warn before the page itself is closed mid-run.
  useEffect(() => {
    if (!running) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [running]);
  // Execution mode: 'paper' = the internal paper account (default, guest OK);
  // 'broker' = the same strategy signals ALSO route real orders through the
  // connected broker (Trading Bridge connection, sign-in required).
  const [execMode, setExecMode] = useState<'paper' | 'broker'>(() =>
    (typeof localStorage !== 'undefined' && localStorage.getItem('ga_pipeline_v4_exec') === 'broker') ? 'broker' : 'paper');
  const { data: brokerConns } = useBrokerConnections();
  const activeConn = brokerConns?.[0];
  const execRef = useRef<{ mode: 'paper' | 'broker'; conn?: { id: string; broker: string; environment: string; label: string | null } }>({ mode: 'paper' });
  execRef.current = { mode: execMode, conn: activeConn ? { id: activeConn.id, broker: activeConn.broker, environment: activeConn.environment, label: activeConn.label } : undefined };
  useEffect(() => { try { localStorage.setItem('ga_pipeline_v4_exec', execMode); } catch { /* ignore */ } }, [execMode]);
  const [panel, setPanel] = useState<'genius' | 'step' | 'report' | 'charts'>('genius');
  const [runMemory, setRunMemory] = useState<RunMemoryEntry[]>(() => loadRunMemory());
  const [chartKey, setChartKey] = useState<string>('gold');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [savedStrategies, setSavedStrategies] = useState<LibraryEntry[]>(() => listSavedStrategies());
  const [saveName, setSaveName] = useState('');
  const [rail, setRail] = useState<'blocks' | 'positions' | 'orders' | 'trade' | 'screens'>('blocks');
  const [equityCurve, setEquityCurve] = useState<number[]>([]);
  const [runStartEquity, setRunStartEquity] = useState<number | null>(null);
  const [runSummary, setRunSummary] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
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

  /** The session runs for minutes, so every backend call reads the freshest paper state. */
  const paperRef = useRef(paper);
  paperRef.current = paper;

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

  /* ── step-level controllers ──
     These are the primitives the inspector, Genius and keyboard shortcuts all
     share, so every path mutates the graph the same way. */

  /** Swap the action a step performs while keeping its slot in the lane. */
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

  /** Patch non-config fields (name, note, enabled, error policy). */
  const patchStep = useCallback((stepId: string, patch: Partial<PipeStep>) => {
    mutate((g) => ({
      ...g,
      lanes: g.lanes.map((l) => ({
        ...l,
        steps: l.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
      })),
    }));
  }, [mutate]);

  /** Copy a step directly after itself. */
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

  /** Move a step into another lane, appended at the end. */
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
      return {
        ...g,
        lanes: stripped.map((l) => (l.id === laneId ? { ...l, steps: [...l.steps, moved as PipeStep] } : l)),
      };
    });
    setSelectedLaneId(laneId);
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
      const inp: any = (e as any).detail?.inputs;
      if (!inp) return sum;
      if (typeof inp.amountUsd === 'number') return sum + inp.amountUsd;
      if (typeof inp.entry === 'number' && typeof inp.qty === 'number' && e.message.startsWith('Closed')) return sum - inp.entry * inp.qty;
      if (typeof inp.qtyClosed === 'number' && typeof inp.entry === 'number') return sum - inp.entry * inp.qtyClosed;
      return sum;
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

  /** Ask the backend agent runtime for a verdict on one agent step. */
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

  const run = useCallback(async (reportToGenius = false) => {
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

    // Seed every lane with REAL historical closes so indicators are meaningful
    // from the first tick instead of waiting for live prints to accumulate.
    // Screen steps bind their asset DURING the run, so prime the whole
    // tracked screen universe too — otherwise screen lanes sit in
    // "insufficient samples" for minutes and the run looks dead.
    const tickers = Array.from(new Set([
      ...graphRef.current.lanes.flatMap((l) => l.steps.map((st) => st.config?.ticker).filter(Boolean) as string[]),
      ...tracked,
      // Screen steps can bind ANY asset in the classified universe mid-run —
      // prime those too, so a newly bound asset starts with real history
      // instead of zero samples.
      ...classified.map((c) => c.ticker).filter(Boolean),
    ]));
    if (tickers.length) await primeHistory(tickers, { interval: '1m', points: 300 });

    const collected: RunEvent[] = [];
    const emitRunEvent = (e: RunEvent) => {
      collected.push(e);
      setEvents((prev) => [...prev, e]);
      if (e.stepId) setSelectedStepId(e.stepId); // camera follows the step being executed
    };
    const sessionEvent = (status: RunEvent['status'], message: string) =>
      emitRunEvent({ ts: Date.now(), tick: 0, laneId: 'session', laneName: 'Session', stepId: null, stepLabel: '', status, message });

    // ── Broker execution (founder directive): in broker mode the run's book
    // stays the strategy ledger (paper account), and every fill ALSO routes a
    // real market order through broker-proxy to the connected broker. Symbols
    // a broker cannot list (metals spot, funds) stay paper-only, said out loud.
    const exec = execRef.current;
    const brokerMode = exec.mode === 'broker' && !!exec.conn;
    const brokerTradable = (sym: string) => /^[A-Z]{1,5}$/.test(sym) || /^[A-Z]{2,10}\/USD$/.test(sym);
    const routeToBroker = (side: 'buy' | 'sell', symbol: string, qty: number) => {
      if (!brokerMode || !exec.conn) return;
      if (!brokerTradable(symbol)) {
        sessionEvent('info', `Broker: ${symbol} is not listed on ${exec.conn.broker} — this position is tracked on paper only.`);
        return;
      }
      brokerCall('order', { connectionId: exec.conn.id, symbol, qty, side, orderType: 'market', timeInForce: 'day' })
        .then((r: any) => sessionEvent('info', `Broker order sent: ${side.toUpperCase()} ${qty} ${symbol} on ${exec.conn!.broker} (${exec.conn!.environment}) — status ${r?.order?.status ?? 'accepted'}.`))
        .catch((err: any) => sessionEvent('error', `Broker order FAILED for ${symbol}: ${err?.message ?? 'unknown error'} — the position continues on paper only.`));
    };
    if (exec.mode === 'broker' && !exec.conn) {
      sessionEvent('info', 'Execution is set to Broker but no broker is connected — this run executes on paper only. Connect a broker in Trading Bridge (sign-in required) to route real orders.');
    } else if (brokerMode && exec.conn) {
      sessionEvent('info', `Broker execution ON: fills will also be sent as real market orders to ${exec.conn.broker} (${exec.conn.environment}). Run stats track the strategy ledger.`);
    }

    let result: RunResult | null = null;
    let registryId: string | null = null;
    try {
      // Checkpoint (a closed page is detectable on return) + a server-side
      // registry row in her Supabase: the foundation the always-on worker
      // will tick from, so runs can outlive the browser entirely.
      try { localStorage.setItem('ga_pipeline_v4_active_run', JSON.stringify({ name: graphRef.current.name, at: Date.now() })); } catch { /* private mode */ }
      try {
        const { data: u } = await supabase.auth.getUser();
        const { data } = await (supabase as any)
          .from('pipeline_runs')
          .insert({ user_id: u?.user?.id ?? null, graph_name: graphRef.current.name, graph: graphRef.current, status: 'running' })
          .select('id')
          .single();
        registryId = (data as any)?.id ?? null;
      } catch { /* the registry mirrors runs; it never blocks one */ }
      result = await runGraph(
        graphRef.current,
        {
          getPrice: resolvePriceForTicker,
          getSeries,
          getHistory,
          classified,
          blocks: blocksRef.current,
          getAccount: () => paperRef.current.account,
          submitOrder: (o) => {
            const filled = paperRef.current.submitOrder(o) as any;
            routeToBroker(o.side, o.symbol, o.qty);
            return filled;
          },
          closePosition: ({ ticker, qty, price }) => {
            paperRef.current.submitOrder({ symbol: ticker, side: 'sell', qty, type: 'market', price, botSource: true });
            routeToBroker('sell', ticker, qty);
          },
          runAgent,
          shouldStop: () => stopRef.current,
        },
        emitRunEvent,
      );
      setRunResult(result);
    } finally {
      try { localStorage.removeItem('ga_pipeline_v4_active_run'); } catch { /* ignore */ }
      if (registryId) {
        const closedTrades = (result?.trades ?? []).filter((t) => !t.open).length;
        (supabase as any)
          .from('pipeline_runs')
          .update({
            status: result?.stoppedByRisk ? 'stopped_by_risk' : 'finished',
            stopped_at: new Date().toISOString(),
            summary: result ? `${result.ticks} ticks · ${closedTrades} closed trades · $${result.realised.toFixed(2)} realised` : 'run ended',
          })
          .eq('id', registryId)
          .then(() => undefined, () => undefined);
      }
      setRunning(false);
      const errors = collected.filter((e) => e.status === 'error').length;
      const delta = equityRef.current - startEquity;
      const trades = result?.trades ?? [];
      const closed = trades.filter((t) => !t.open);
      setRunSummary(
        !collected.length
          ? 'The session finished without executing a single step — add blocks to a lane first.'
          : `Session finished · ${result?.ticks ?? 0} ticks over ${Math.round(((result?.finishedAt ?? 0) - (result?.startedAt ?? 0)) / 1000)}s` +
            ` · ${trades.length} position${trades.length === 1 ? '' : 's'} opened, ${closed.length} closed` +
            ` · ${closed.reduce((s2, t) => s2 + t.pnl, 0) >= 0 ? '+' : ''}$${closed.reduce((s2, t) => s2 + t.pnl, 0).toFixed(2)} realised` +
            ` · ${errors} error${errors === 1 ? '' : 's'} · paper equity ${delta >= 0 ? '+' : ''}$${delta.toFixed(2)}.` +
            ' The Report panel explains every decision in plain English.',
      );
      // Memory: every finished run joins the permanent track record.
      if (result) {
        recordRun(result, graphRef.current.name, null);
        setRunMemory(loadRunMemory());
      }
      if (reportToGenius && reporterRef.current) {
        const trace = collected.length
          ? collected.slice(-50).map((e) => `[${e.status}] t${e.tick} ${e.laneName} \u203a ${e.stepLabel}: ${e.message ?? ''}`).join('\n')
          : 'The session produced no steps at all.';
        reporterRef.current(trace);
      }
    }
  }, [running, resolvePriceForTicker, getSeries, getHistory, primeHistory, classified, runAgent]);

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
        case 'set_session':
          if (a.session) {
            setGraph((g) => ({ ...g, session: { ...g.session, ...a.session }, updatedAt: Date.now() }));
            notes.push('adjusted how long the session runs');
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

  /** Asset the selected step operates on — walk back through its lane. */
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

          {/* live session settings — a run is a timed session, not an instant pass */}
          <label className="text-[12px] text-muted-foreground" title="How long the strategy stays live, holding positions on real prices.">
            Run for (min)
            <input
              type="number" min={1} max={480}
              value={graph.session?.durationMin ?? 15}
              onChange={(e) => setGraph((g) => ({ ...g, session: { ...g.session, durationMin: Number(e.target.value) } }))}
              className="ml-2 w-16 rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[13px] text-foreground outline-none"
            />
          </label>
          <label className="text-[12px] text-muted-foreground" title="How often every lane re-reads live prices and re-decides.">
            Check every (s)
            <input
              type="number" min={2} max={600}
              value={graph.session?.tickSec ?? 10}
              onChange={(e) => setGraph((g) => ({ ...g, session: { ...g.session, tickSec: Number(e.target.value) } }))}
              className="ml-2 w-16 rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[13px] text-foreground outline-none"
            />
          </label>
          <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground" title="Close every position the session opened when it ends.">
            <input
              type="checkbox"
              checked={graph.session?.flattenOnStop !== false}
              onChange={(e) => setGraph((g) => ({ ...g, session: { ...g.session, flattenOnStop: e.target.checked } }))}
            />
            Close all at end
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
            onClick={() => setLibraryOpen((v) => !v)}
            disabled={running}
            className="flex items-center gap-1.5 rounded-md border border-primary/60 bg-primary/10 px-2.5 py-1.5 text-[13px] font-semibold text-primary hover:bg-primary/20 disabled:opacity-40"
            title="Open the strategy library — one click loads a strategy. Your current pipeline is kept as a recoverable backup."
          >
            <Library className="h-3.5 w-3.5" /> Strategy library
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

        {interruptedRun && !running && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
            <p className="text-[13px] text-foreground">
              A run of <strong>{interruptedRun.name}</strong> was interrupted when this page closed ({new Date(interruptedRun.at).toLocaleTimeString()}).
              Runs now survive navigation inside the app; closing the page still stops them until the always-on server runner is live.
              Any open paper positions remain in the paper account (Trading Bridge → BOOK) to review or close.
            </p>
            <button type="button" className="rounded-md border border-border px-3 py-1.5 text-[12px] font-medium hover:bg-muted" onClick={() => setInterruptedRun(null)}>Dismiss</button>
          </div>
        )}

        {libraryOpen && (
          <section className="mb-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold tracking-wide text-primary">STRATEGY LIBRARY — one click loads</h3>
              <button onClick={() => setLibraryOpen(false)} className="text-[12px] text-muted-foreground hover:text-foreground">Close</button>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {[...BUILT_IN_STRATEGIES, ...savedStrategies].map((entry) => (
                <div key={entry.id} className="flex items-start justify-between gap-2 rounded-md border border-border/60 bg-background/60 p-2.5">
                  <div>
                    <p className="text-[13px] font-semibold">{entry.name}</p>
                    <p className="text-[12px] text-muted-foreground">{entry.blurb}</p>
                    {(() => {
                      const perf = performanceByStrategy(loadRunMemory()).get(entry.name);
                      return perf && perf.runs > 0 ? (
                        <p className="mt-1 text-[12px] font-medium text-foreground/80">
                          Live record: {perf.runs} run{perf.runs === 1 ? '' : 's'} · {perf.trades} closed trades · {perf.winRate.toFixed(0)}% wins · {perf.realised >= 0 ? '+' : ''}${perf.realised.toFixed(2)} realised
                        </p>
                      ) : null;
                    })()}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      disabled={running}
                      onClick={() => {
                        const preset = entry.build();
                        setGraph(preset);
                        setSelectedLaneId(preset.lanes[0]?.id ?? null);
                        setSelectedStepId(null);
                        setEvents([]);
                        setRunResult(null);
                        setRunSummary(`${entry.name} loaded from the library — ${preset.lanes.length} lanes · ${preset.lanes.reduce((n, l) => n + l.steps.length, 0)} steps. Press Play strategy to run it. Your previous pipeline is kept in the automatic backup.`);
                        setPanel('report');
                        setLibraryOpen(false);
                      }}
                      className="rounded-md border border-primary/60 bg-primary/10 px-2 py-1 text-[12px] font-semibold text-primary hover:bg-primary/20 disabled:opacity-40"
                    >
                      Load
                    </button>
                    {!entry.builtIn && (
                      <button
                        onClick={() => { deleteSavedStrategy(entry.id); setSavedStrategies(listSavedStrategies()); }}
                        className="rounded-md border border-destructive/40 px-2 py-1 text-[12px] text-destructive hover:bg-destructive/10"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Name your current strategy…"
                className="min-w-[220px] flex-1 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[13px]"
              />
              <button
                onClick={() => { saveStrategy(saveName || graph.name, graph); setSavedStrategies(listSavedStrategies()); setSaveName(''); }}
                className="rounded-md border border-border/60 px-2.5 py-1.5 text-[13px] hover:border-primary/60"
              >
                Save current strategy to the library
              </button>
            </div>
          </section>
        )}

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
          <section className="order-1 relative h-[420px] overflow-hidden rounded-xl border border-border/60 bg-[#05070d] lg:order-2 lg:h-[640px]">
            <PipelineScene3D
              graph={graph}
              selectedStepId={selectedStepId}
              selectedLaneId={selectedLane?.id ?? null}
              activeStepIds={activeStepIds}
              errorStepIds={errorStepIds}
              onSelectStep={(laneId, stepId) => { setSelectedLaneId(laneId); setSelectedStepId(stepId); setPanel('step'); }}
              onSelectLane={(laneId) => { setSelectedLaneId(laneId); setSelectedStepId(null); }}
            />

            {/* live run banner */}
            {running && (
              <div className="pointer-events-none absolute left-1/2 top-3 w-[min(92%,560px)] -translate-x-1/2 rounded-lg border border-primary/50 bg-background/85 px-3 py-2 text-center backdrop-blur">
                <p className="text-[13px] font-medium text-primary">
                  Running all {graph.lanes.length} lanes at once on the paper account
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {events.length} step{events.length === 1 ? '' : 's'} executed so far · the camera follows the step being run · live trace in Report
                </p>
              </div>
            )}

            {/* what just happened */}
            {!running && runSummary && (
              <div className="absolute left-1/2 top-3 w-[min(92%,620px)] -translate-x-1/2 rounded-lg border border-primary/40 bg-background/90 px-3 py-2 backdrop-blur">
                <div className="flex items-start gap-2">
                  <p className="text-[13px] leading-snug text-foreground">{runSummary}</p>
                  <button
                    onClick={() => setRunSummary(null)}
                    className="ml-auto shrink-0 rounded border border-border/60 px-1.5 text-[12px] text-muted-foreground hover:text-foreground"
                  >
                    Close
                  </button>
                </div>
                <button
                  onClick={() => setPanel('report')}
                  className="mt-1 text-[12px] text-primary underline underline-offset-2"
                >
                  Open the full report
                </button>
              </div>
            )}

            {/* primary control, right where the strategy is */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
              {!running && (
                <div className="mb-2 flex items-center justify-center gap-1 text-[12px]">
                  <span className="mr-1 text-muted-foreground">Execution:</span>
                  <button
                    onClick={() => setExecMode('paper')}
                    className={`rounded-full border px-3 py-1 font-medium backdrop-blur ${execMode === 'paper' ? 'border-primary/70 bg-primary/25 text-primary' : 'border-border/60 bg-card/50 text-muted-foreground hover:text-foreground'}`}
                  >
                    Paper account
                  </button>
                  <button
                    onClick={() => setExecMode('broker')}
                    className={`rounded-full border px-3 py-1 font-medium backdrop-blur ${execMode === 'broker' ? 'border-primary/70 bg-primary/25 text-primary' : 'border-border/60 bg-card/50 text-muted-foreground hover:text-foreground'}`}
                    title={activeConn ? `Route fills to ${activeConn.broker} (${activeConn.environment})` : 'No broker connected — connect one in Trading Bridge (sign-in required)'}
                  >
                    Broker{activeConn ? `: ${activeConn.broker} ${activeConn.environment}` : ' (not connected)'}
                  </button>
                </div>
              )}
              {running ? (
                <button
                  onClick={() => { stopRef.current = true; }}
                  className="flex items-center gap-2 rounded-full border border-destructive/60 bg-destructive/20 px-6 py-3 text-[15px] font-semibold text-destructive shadow-lg backdrop-blur"
                >
                  <Square className="h-4 w-4" /> Stop the run
                </button>
              ) : (
                <button
                  onClick={() => void run()}
                  disabled={!!blockingIssues.length || !totalSteps(graph)}
                  className="flex items-center gap-2 rounded-full border border-primary/70 bg-primary/25 px-7 py-3 text-[15px] font-semibold text-primary shadow-[0_0_28px_hsl(var(--primary)/0.35)] backdrop-blur transition hover:bg-primary/35 disabled:opacity-40"
                  title={blockingIssues.length ? blockingIssues[0].message : 'Run every lane at once on the paper account'}
                >
                  <Play className="h-4 w-4" /> Play strategy
                </button>
              )}
              <p className="mt-1.5 text-[12px] text-muted-foreground">
                {blockingIssues.length
                  ? blockingIssues[0].message
                  : !totalSteps(graph)
                    ? 'Add a block to a lane first'
                    : running
                      ? 'Steps light up as they execute'
                      : execMode === 'broker' && activeConn
                        ? `Plays all ${graph.lanes.length} lanes at once — fills also route to your ${activeConn.broker} (${activeConn.environment}) account; results and a step-by-step trace appear in Report`
                        : execMode === 'broker'
                          ? 'Broker mode needs a connected broker (Trading Bridge, sign-in required) — without one this run executes on paper only'
                          : `Plays all ${graph.lanes.length} lanes at once on paper money — orders, results and a step-by-step trace appear in Report`}
              </p>
            </div>
          </section>


          {/* right rail */}
          <aside className="order-3 flex h-[540px] flex-col rounded-xl border border-border/60 bg-card/40 p-3 backdrop-blur lg:h-[640px]">
            <div className="mb-2 flex gap-1">
              {([
                { id: 'genius', label: 'Genius', icon: Bot },
                { id: 'step', label: 'Step', icon: SlidersHorizontal },
                { id: 'report', label: 'Report', icon: ScrollText },
                { id: 'charts', label: 'Charts', icon: CandlestickChart },
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
                    ticker={selectedTicker}
                    getPrice={resolvePriceForTicker}
                    blocks={blocks}
                    onChange={(config, label) => updateStep(selectedStep.id, config, label)}
                    onDelete={() => removeStep(selectedStep.id)}
                    onMove={(dir) => moveStep(selectedStep.id, dir)}
                    lanes={graph.lanes}
                    currentLaneId={stepPath(graph, selectedStep.id)?.lane.id ?? null}
                    onChangeKind={(blockId) => changeStepKind(selectedStep.id, blockId)}
                    onPatch={(patch) => patchStep(selectedStep.id, patch)}
                    onDuplicate={() => duplicateStep(selectedStep.id)}
                    onMoveToLane={(laneId) => moveStepToLane(selectedStep.id, laneId)}
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
                    {selectedLane.consensus && (() => {
                      const setAgree = (patch: Record<string, any>) => mutate((g) => ({
                        ...g,
                        lanes: g.lanes.map((l) => (l.id === selectedLane.id
                          ? { ...l, agree: { mode: 'majority' as const, expects: 'bullish', ...(l.agree ?? {}), ...patch } }
                          : l)),
                      }));
                      const agree = selectedLane.agree ?? { mode: 'majority' as const };
                      return (
                        <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-2">
                          <p className="text-[12px] text-muted-foreground">
                            This lane rules over the others: on every tick it reads their signals and decides whether
                            the strategy may open new positions.
                          </p>
                          <label className="block space-y-1">
                            <span className="block text-[13px] font-medium text-foreground">Allow trading when</span>
                            <select
                              value={agree.mode ?? 'majority'}
                              onChange={(e) => setAgree({ mode: e.target.value })}
                              className="w-full rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[13px] text-foreground outline-none"
                            >
                              <option value="all">Every lane agrees</option>
                              <option value="majority">Most lanes agree</option>
                              <option value="any">Any lane agrees</option>
                              <option value="count">A set number of lanes agree</option>
                            </select>
                          </label>
                          {agree.mode === 'count' && (
                            <label className="block space-y-1">
                              <span className="block text-[13px] font-medium text-foreground">How many lanes</span>
                              <input
                                type="number" min={1} max={12} value={agree.count ?? 2}
                                onChange={(e) => setAgree({ count: Number(e.target.value) })}
                                className="w-full rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[13px] text-foreground outline-none"
                              />
                            </label>
                          )}
                          <label className="block space-y-1">
                            <span className="block text-[13px] font-medium text-foreground">The signal they must show</span>
                            <select
                              value={agree.expects ?? 'bullish'}
                              onChange={(e) => setAgree({ expects: e.target.value })}
                              className="w-full rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[13px] text-foreground outline-none"
                            >
                              <option value="bullish">Buy signal</option>
                              <option value="bearish">Sell signal</option>
                              <option value="neutral">Neutral</option>
                            </select>
                          </label>
                          <label className="block space-y-1">
                            <span className="block text-[13px] font-medium text-foreground">Ignore lanes below this confidence (%)</span>
                            <input
                              type="number" min={0} max={100} step={5}
                              value={Math.round(Number(agree.minConfidence ?? 0) * 100)}
                              onChange={(e) => setAgree({ minConfidence: Number(e.target.value) / 100 })}
                              className="w-full rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[13px] text-foreground outline-none"
                            />
                          </label>
                          <label className="flex items-center gap-2 text-[13px] text-foreground">
                            <input
                              type="checkbox"
                              checked={agree.veto !== false}
                              onChange={(e) => setAgree({ veto: e.target.checked })}
                            />
                            Close positions from lanes that disagree
                          </label>
                        </div>
                      );
                    })()}

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
                <div className="space-y-3">
                  <RunPerformance
                    events={events}
                    lanes={laneStats}
                    equityCurve={equityCurve}
                    running={running}
                    startEquity={runStartEquity}
                    equity={paper.account.equity}
                  />
                  <div className="rounded-lg border border-white/10 bg-black/30">
                    <RunReport
                      events={events}
                      result={runResult}
                      running={running}
                      equityCurve={equityCurve}
                      startEquity={runStartEquity}
                    />
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-foreground">Memory — every run, kept</p>
                      {!!runMemory.length && (
                        <button
                          onClick={() => { clearRunMemory(); setRunMemory([]); }}
                          className="text-[12px] text-muted-foreground hover:text-destructive"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {!runMemory.length && (
                      <p className="text-[12px] text-muted-foreground">No runs remembered yet. Finish a run and it will be recorded here permanently — across refreshes and sessions.</p>
                    )}
                    {!!runMemory.length && (() => {
                      const t = memoryTotals(runMemory);
                      return (
                        <p className="mb-2 text-[12px] text-muted-foreground">
                          Lifetime: {t.runs} runs · {t.trades} closed trades · {t.wins}W / {t.losses}L · realised {t.realised >= 0 ? '+' : ''}${t.realised.toFixed(2)} · fees ${t.fees.toFixed(2)}
                        </p>
                      );
                    })()}
                    <div className="max-h-56 space-y-1.5 overflow-y-auto">
                      {runMemory.map((e) => (
                        <div key={e.id} className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-1.5 text-[12px]">
                          <span className="text-foreground">{new Date(e.at).toLocaleString()}</span>
                          <span className="text-muted-foreground"> · {e.graphName} · {e.trades} trades · {e.wins}W/{e.losses}L · </span>
                          <span className={e.realised >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {e.realised >= 0 ? '+' : ''}${e.realised.toFixed(2)}
                          </span>
                          {e.stoppedByRisk && <span className="text-amber-300"> · stopped by risk</span>}
                          {!!e.errors && <span className="text-rose-300"> · {e.errors} errors</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {panel === 'charts' && (() => {
                const sym = ALL_SYMBOLS.find((s) => s.key === chartKey) ?? ALL_SYMBOLS[0];
                const chartSymbols = ALL_SYMBOLS.filter((s) => ['metals', 'crypto', 'energy'].includes(s.cat)).slice(0, 60);
                return (
                  <div className="flex h-full flex-col gap-2">
                    <select
                      value={chartKey}
                      onChange={(e) => setChartKey(e.target.value)}
                      className="w-full rounded-md border border-border/60 bg-background px-2 py-1.5 text-[13px] text-foreground"
                    >
                      {chartSymbols.map((s) => (
                        <option key={s.key} value={s.key}>{s.label} · {s.ticker}</option>
                      ))}
                    </select>
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      Live chart from the Trading Bridge. Price level = live market-quotes feed (verified against external spot sources). Candle history is illustrative; the live price is real.
                    </p>
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <GALiveChart symbolKey={sym.key} category={sym.cat} label={sym.label} />
                    </div>
                  </div>
                );
              })()}

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