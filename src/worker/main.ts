/* ───────────────── Gold Arrow server worker (Phase 0) ─────────────
   The always-on half of the desk. Pipeline V4 can queue a run to the
   server (pipeline_runs: mode='server', status='queued'); this worker
   claims it and executes the session HERE — with the very same engine
   the browser runs — so the strategy keeps trading when the tab, the
   browser, or the laptop is closed.

   Execution is the worker's own paper ledger (pipeline_run_trades),
   with live prices from the app's own market-quotes / market-history
   services and REAL specialist verdicts from pipeline-agent. State is
   heartbeated into pipeline_runs.summary every few seconds, including
   the open-position snapshot; if the worker dies, stale runs are
   marked interrupted on the next boot and their recorded positions
   are closed at the then-current prices (recovery flatten).

   Auth: the project anon key only — the run tables carry permissive
   policies for this personal deployment, and the edge functions
   accept the anon JWT (the same way the public site calls them).
   ──────────────────────────────────────────────────────────────── */

import { runGraph, type RunHooks } from '../lib/parallelEngine';
import { classifyAssets, type ClassifiedAsset } from '../lib/assetClassifiers';
import type { PipeGraph } from '../lib/pipelineGraph';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const ANON = process.env.SUPABASE_ANON_KEY ?? '';
const WORKER_ID = `worker-${Math.random().toString(36).slice(2, 8)}`;
const POLL_MS = 5000;
const HEARTBEAT_MS = 15000;
const UNIVERSE = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'META', 'AMD', 'COIN', 'SPY', 'QQQ'];

if (!SUPABASE_URL || !ANON) {
  console.error('[worker] SUPABASE_URL / SUPABASE_ANON_KEY missing — exiting');
  process.exit(1);
}

const log = (...a: any[]) => console.log(new Date().toISOString(), '[worker]', ...a);

/* ── Supabase REST (anon) ─────────────────────────────────────────── */
const rest = async (path: string, method = 'GET', body?: any, prefer = 'return=representation') => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: ANON, Authorization: `Bearer ${ANON}`,
      'Content-Type': 'application/json', Prefer: prefer,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`REST ${method} ${path} → ${r.status} ${await r.text().catch(() => '')}`);
  const text = await r.text();
  return text ? JSON.parse(text) : null;
};

const callFn = async (slug: string, body: any) => {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/${slug}`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`fn ${slug} → ${r.status}`);
  return r.json();
};

/* ── Live tape: polled quotes + rolling sample buffers ────────────── */
const buffers = new Map<string, number[]>();
const lastQuote = new Map<string, { last: number; change24h: number | null }>();
const watched = new Set<string>(UNIVERSE);

const pushSample = (sym: string, price: number) => {
  const buf = buffers.get(sym) ?? [];
  buf.push(price);
  if (buf.length > 600) buf.splice(0, buf.length - 600);
  buffers.set(sym, buf);
};

const pollQuotes = async () => {
  try {
    const data = await callFn('market-quotes', { symbols: [...watched] });
    const quotes = (data?.quotes ?? {}) as Record<string, { last: number; change24h: number | null }>;
    for (const [id, q] of Object.entries(quotes)) {
      if (q && typeof q.last === 'number' && q.last > 0) {
        lastQuote.set(id, { last: q.last, change24h: q.change24h ?? null });
        pushSample(id, q.last);
      }
    }
  } catch (e) { log('quote poll failed:', (e as Error).message); }
};

const primeHistory = async (tickers: string[]) => {
  try {
    const data = await callFn('market-history', { symbols: tickers, interval: '1m', points: 300 });
    const series = (data?.series ?? {}) as Record<string, number[]>;
    for (const [sym, closes] of Object.entries(series)) {
      if (Array.isArray(closes) && closes.length) {
        buffers.set(sym, closes.slice(-300));
        const last = closes[closes.length - 1];
        if (!lastQuote.has(sym)) lastQuote.set(sym, { last, change24h: null });
      }
    }
  } catch (e) { log('history prime failed:', (e as Error).message); }
};

const priceOf = (t: string) => lastQuote.get(t)?.last ?? buffers.get(t)?.[buffers.get(t)!.length - 1] ?? 0;
const seriesOf = (t: string) => buffers.get(t) ?? [];

const classifiedNow = (): ClassifiedAsset[] => classifyAssets(
  [...watched].map((s) => {
    const series = seriesOf(s);
    const q = lastQuote.get(s);
    return {
      ticker: s, label: s, cat: 'stock', symbolKey: s,
      last: priceOf(s),
      change24h: q?.change24h ?? (series.length > 1 ? (series[series.length - 1] / series[0] - 1) * 100 : 0),
      samples: series,
    };
  }).filter((m) => m.samples.length > 0),
);

/* ── Paper ledger (FIFO lots) ─────────────────────────────────────── */
interface Lot { tradeId: string; ticker: string; qty: number; entry: number }
const lots: Lot[] = [];
let ledgerRealised = 0;

const recordOpen = async (runId: string, userId: string | null, ticker: string, lane: string, qty: number, price: number) => {
  const rows = await rest('pipeline_run_trades', 'POST', {
    run_id: runId, user_id: userId, ticker, lane_name: lane, qty, entry_price: price,
  });
  const tradeId = rows?.[0]?.id as string;
  lots.push({ tradeId, ticker, qty, entry: price });
  // The permanent trade journal gets the same fill (source 'server'),
  // keyed by the ledger row id so replays can never duplicate it.
  if (userId && tradeId) {
    await rest('trade_journal', 'POST', {
      user_id: userId, client_order_id: tradeId, run_id: runId, source: 'server',
      lane_name: lane || null, ticker, side: 'buy', qty, price, fees: 0,
      filled_at: new Date().toISOString(),
    }).catch((e: any) => log('journal open failed:', e.message));
  }
  return tradeId;
};

/* Journal the close of a lot (FIFO-matched in recordClose). */
let journalUserId: string | null = null;
let journalRunId: string | null = null;
const journalClose = async (tradeId: string, ticker: string, qty: number, entry: number, exit: number, pnl: number) => {
  if (!journalUserId) return;
  await rest('trade_journal', 'POST', {
    user_id: journalUserId, client_order_id: `${tradeId}-close`, run_id: journalRunId, source: 'server',
    ticker, side: 'sell', qty, price: exit, fees: 0, closed_pnl: pnl,
    filled_at: new Date().toISOString(),
  }).catch((e: any) => log('journal close failed:', e.message));
};

const recordClose = async (ticker: string, qtyIn: number, price: number) => {
  let remaining = qtyIn;
  while (remaining > 1e-9) {
    const lot = lots.find((l) => l.ticker === ticker && l.qty > 1e-9);
    if (!lot) break;
    const take = Math.min(lot.qty, remaining);
    const pnl = (price - lot.entry) * take;
    ledgerRealised += pnl;
    lot.qty -= take;
    remaining -= take;
    if (lot.qty <= 1e-9) {
      await rest(`pipeline_run_trades?id=eq.${lot.tradeId}`, 'PATCH', {
        exit_price: price, pnl, closed_at: new Date().toISOString(),
      });
      lots.splice(lots.indexOf(lot), 1);
    }
    if (take > 0) void journalClose(lot.tradeId, ticker, take, lot.entry, price, pnl);
  }
};

const openSnapshot = () => lots.filter((l) => l.qty > 1e-9).map((l) => ({ ticker: l.ticker, qty: l.qty, entry: l.entry }));

/* ── One run, executed here ───────────────────────────────────────── */
const executeRun = async (row: any) => {
  const graph = row.graph as PipeGraph;
  const runId = row.id as string;
  journalUserId = row.user_id ?? null;
  journalRunId = runId;
  const budget = Math.max(1, Number(graph?.risk?.maxTotalInvestmentUsd ?? 1000));
  lots.length = 0;
  ledgerRealised = 0;
  let stopRequested = false;
  let ticks = 0;
  let tradesOpened = 0;
  let tradesClosed = 0;
  let errors = 0;

  for (const lane of graph.lanes ?? []) {
    for (const st of lane.steps ?? []) {
      if (st.config?.ticker) watched.add(String(st.config.ticker));
    }
  }
  await primeHistory([...watched]);
  await pollQuotes();

  log(`claimed run ${runId} — ${graph.name} (${graph.lanes?.length ?? 0} lanes, budget $${budget})`);

  const heartbeat = setInterval(async () => {
    try {
      const rows = await rest(`pipeline_runs?id=eq.${runId}&select=status`, 'GET', undefined, '');
      if (rows?.[0]?.status === 'stop_requested') stopRequested = true;
      await rest(`pipeline_runs?id=eq.${runId}`, 'PATCH', {
        heartbeat_at: new Date().toISOString(),
        summary: {
          executor: 'server-worker', worker: WORKER_ID, ticks, tradesOpened, tradesClosed,
          realised: Number(ledgerRealised.toFixed(2)), openPositions: openSnapshot(),
        },
      });
    } catch { /* heartbeat is best-effort */ }
  }, HEARTBEAT_MS);

  const hooks = {
    getPrice: priceOf,
    getSeries: seriesOf,
    getAccount: () => ({ equity: budget + ledgerRealised, totalPnl: ledgerRealised, startingBalance: budget, cash: budget }),
    submitOrder: ({ symbol, side, qty, price }: any) => {
      const px = price > 0 ? price : priceOf(symbol);
      if (side === 'buy') {
        tradesOpened += 1;
        void recordOpen(runId, row.user_id ?? null, symbol, '', qty, px).catch((e) => log('recordOpen failed:', e.message));
      } else {
        tradesClosed += 1;
        void recordClose(symbol, qty, px).catch((e) => log('recordClose(sell) failed:', e.message));
      }
      return { id: `w_${Math.random().toString(36).slice(2, 9)}`, price: px, fees: 0 };
    },
    closePosition: ({ ticker, qty, price }: any) => {
      tradesClosed += 1;
      void recordClose(ticker, qty, price).catch((e) => log('recordClose failed:', e.message));
    },
    runAgent: async (req: any) => {
      const data = await callFn('pipeline-agent', req);
      return {
        verdict: (data?.verdict ?? 'hold') as any,
        confidence: Number(data?.confidence ?? 0),
        reason: String(data?.reason ?? 'no reason given'),
      };
    },
    blocks: [],
    onTickStart: (tick: number) => { ticks = tick; void pollQuotes(); },
    shouldStop: () => stopRequested,
  } as unknown as RunHooks;
  Object.defineProperty(hooks, 'classified', { get: classifiedNow });

  try {
    const result = await runGraph(graph, hooks, (e) => { if (e.status === 'error') errors += 1; });
    clearInterval(heartbeat);
    await rest(`pipeline_runs?id=eq.${runId}`, 'PATCH', {
      status: stopRequested ? 'stopped' : 'finished',
      stopped_at: new Date().toISOString(),
      heartbeat_at: new Date().toISOString(),
      summary: {
        executor: 'server-worker', worker: WORKER_ID, ticks: result.ticks,
        trades: result.trades.length, closedTrades: result.trades.filter((t) => !t.open).length,
        realised: Number(result.realised.toFixed(2)), fees: result.fees, errors: result.errors,
        peakDeployed: result.peakDeployed, stoppedByRisk: result.stoppedByRisk,
        openPositions: openSnapshot(),
      },
    });
    log(`run ${runId} finished — ${result.ticks} ticks, ${result.trades.length} trades, realised $${result.realised.toFixed(2)}, errors ${result.errors}`);
  } catch (e) {
    clearInterval(heartbeat);
    log(`run ${runId} FAILED:`, (e as Error).message);
    await rest(`pipeline_runs?id=eq.${runId}`, 'PATCH', {
      status: 'failed', stopped_at: new Date().toISOString(),
      summary: { executor: 'server-worker', worker: WORKER_ID, error: (e as Error).message, openPositions: openSnapshot() },
    }).catch(() => undefined);
  }
};

/* ── Recovery sweep: runs orphaned by a dead worker ──────────────── */
const recoverySweep = async () => {
  try {
    const stale = new Date(Date.now() - 120000).toISOString();
    const rows = await rest(
      `pipeline_runs?mode=eq.server&status=eq.running&heartbeat_at=lt.${encodeURIComponent(stale)}&select=id,summary`,
      'GET', undefined, '',
    );
    for (const row of rows ?? []) {
      const open = (row.summary?.openPositions ?? []) as Array<{ ticker: string; qty: number; entry: number }>;
      for (const pos of open) {
        const px = priceOf(pos.ticker);
        if (px > 0) {
          await rest('pipeline_run_trades', 'POST', {
            run_id: row.id, ticker: pos.ticker, lane_name: 'recovery-flatten',
            qty: pos.qty, entry_price: pos.entry, exit_price: px,
            pnl: (px - pos.entry) * pos.qty, closed_at: new Date().toISOString(),
          }).catch(() => undefined);
        }
      }
      await rest(`pipeline_runs?id=eq.${row.id}`, 'PATCH', {
        status: 'interrupted', stopped_at: new Date().toISOString(),
        summary: { ...(row.summary ?? {}), interruptedNote: 'worker heartbeat lost; recorded positions flattened at recovery prices' },
      }).catch(() => undefined);
      log(`recovered stale run ${row.id} → interrupted (${open.length} positions flattened)`);
    }
  } catch (e) { log('recovery sweep failed:', (e as Error).message); }
};

/* ── Main loop ────────────────────────────────────────────────────── */
const main = async () => {
  log(`starting (${WORKER_ID}) — polling every ${POLL_MS / 1000}s`);
  await pollQuotes();
  await recoverySweep();
  setInterval(pollQuotes, POLL_MS);
  setInterval(recoverySweep, 60000);
  for (;;) {
    try {
      const queued = await rest(
        'pipeline_runs?mode=eq.server&status=eq.queued&order=started_at.asc&limit=1&select=*',
        'GET', undefined, '',
      );
      const row = queued?.[0];
      if (row) {
        await rest(`pipeline_runs?id=eq.${row.id}`, 'PATCH', {
          status: 'running', heartbeat_at: new Date().toISOString(),
          summary: { executor: 'server-worker', worker: WORKER_ID, phase: 'claimed' },
        });
        await executeRun(row);
      } else {
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
    } catch (e) {
      log('loop error:', (e as Error).message);
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
  }
};

void main();
