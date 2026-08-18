// Blueprint runtime — Pipeline v2 executor.
// Threads an execution context (symbol, live series, screen list, last analysis)
// through an ordered graph of blueprint nodes: assets, class screens, analysis
// programs, custom code blocks, and trade actions.

import { ANALYSIS_PROGRAMS, PROGRAM_BY_ID } from './analysisPrograms';
import { rankByClass, type ClassId, type ClassifiedAsset } from './assetClassifiers';
import { runBlockCode, type CustomBlock } from './customBlocks';

export type BpKind =
  | 'asset' | 'screen' | 'analysis' | 'code'
  | 'branch' | 'buy' | 'sell' | 'alert' | 'risk' | 'note';

export interface BpNode {
  id: string;
  kind: BpKind;
  label: string;
  config: Record<string, any>;
}

export interface BpLogEntry {
  ts: number;
  step: number;
  kind: BpKind;
  status: 'ok' | 'skip' | 'error' | 'info';
  message: string;
  data?: any;
}

export interface BpIssue { step: number; nodeId: string; level: 'error' | 'warn'; message: string }

export interface BpHooks {
  getPrice: (ticker: string) => number;
  getSeries: (ticker: string) => number[];
  classified: ClassifiedAsset[];
  blocks: CustomBlock[];
  account: { equity: number; totalPnl: number; startingBalance: number };
  submitOrder: (p: {
    symbol: string; side: 'buy' | 'sell'; qty: number;
    type: 'market' | 'limit' | 'stop'; price: number; limitPrice?: number; botSource?: boolean;
  }) => { id: string; price: number; fees: number };
  shouldStop?: () => boolean;
}

const NEEDS_SYMBOL: ReadonlySet<BpKind> = new Set(['analysis', 'buy', 'sell', 'alert']);

export function validateBlueprint(nodes: BpNode[]): BpIssue[] {
  const out: BpIssue[] = [];
  if (!nodes.length) {
    out.push({ step: 0, nodeId: '', level: 'error', message: 'Blueprint is empty — drop an asset or a screen to begin.' });
    return out;
  }
  let ctx = false;
  nodes.forEach((n, i) => {
    const step = i + 1;
    if (n.kind === 'asset') { ctx = !!n.config?.ticker; if (!ctx) out.push({ step, nodeId: n.id, level: 'error', message: 'Asset node has no instrument.' }); return; }
    if (n.kind === 'screen') { ctx = true; if (!n.config?.classId) out.push({ step, nodeId: n.id, level: 'error', message: 'Screen node has no classification selected.' }); return; }
    if (NEEDS_SYMBOL.has(n.kind) && !ctx) out.push({ step, nodeId: n.id, level: 'error', message: `${n.label} needs an ASSET or SCREEN upstream.` });
    if (n.kind === 'analysis' && !PROGRAM_BY_ID.has(n.config?.programId)) out.push({ step, nodeId: n.id, level: 'error', message: 'Analysis node references an unknown program.' });
    if ((n.kind === 'buy' || n.kind === 'sell') && !(Number(n.config?.amountUsd ?? n.config?.amount) > 0)) out.push({ step, nodeId: n.id, level: 'error', message: `${n.label} amount must be > 0.` });
    if (n.kind === 'code' && !n.config?.blockId) out.push({ step, nodeId: n.id, level: 'error', message: 'Code block node has no program attached.' });
    if (n.kind === 'branch' && !n.config?.expects) out.push({ step, nodeId: n.id, level: 'warn', message: 'Branch has no expected signal — it will pass through.' });
  });
  return out;
}

export async function runBlueprint(
  nodes: BpNode[],
  hooks: BpHooks,
  onLog: (e: BpLogEntry) => void,
): Promise<BpLogEntry[]> {
  const log: BpLogEntry[] = [];
  const push = (e: Omit<BpLogEntry, 'ts'>) => { const full = { ts: Date.now(), ...e }; log.push(full); onLog(full); };

  let ticker: string | null = null;
  let label: string | null = null;
  let screen: { ticker: string; label: string; score: number }[] = [];
  let lastAnalysis: { id: string; value: number; verdict: string; detail: string } | null = null;
  let lastSignal: string | null = null;
  let halted = false;
  const startEquity = hooks.account.equity;

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const step = i + 1;
    if (hooks.shouldStop?.()) { push({ step, kind: n.kind, status: 'skip', message: `Run stopped by operator before ${n.label}.` }); break; }
    if (halted) { push({ step, kind: n.kind, status: 'skip', message: `Skipped ${n.label} — flow halted upstream.` }); continue; }

    try {
      switch (n.kind) {
        case 'note': {
          push({ step, kind: n.kind, status: 'info', message: n.config?.text || 'Comment' });
          break;
        }
        case 'asset': {
          ticker = n.config?.ticker ?? null;
          label = n.config?.label ?? ticker;
          const px = ticker ? hooks.getPrice(ticker) : 0;
          push({ step, kind: n.kind, status: px > 0 ? 'ok' : 'info', message: `Context → ${label} (${ticker}) @ ${px > 0 ? px.toFixed(4) : 'awaiting live feed'}` });
          break;
        }
        case 'screen': {
          const classId = n.config?.classId as ClassId;
          const limit = Math.max(1, Math.min(25, Number(n.config?.limit ?? 5)));
          const ranked = rankByClass(hooks.classified, classId, limit);
          screen = ranked.map((a) => ({ ticker: a.ticker, label: a.label, score: a.scores[classId] }));
          if (!screen.length) {
            push({ step, kind: n.kind, status: 'skip', message: `Screen ${classId} returned no live members — no synthetic fill.` });
            halted = !!n.config?.haltIfEmpty;
            break;
          }
          if (n.config?.bindTop !== false) { ticker = screen[0].ticker; label = screen[0].label; }
          push({ step, kind: n.kind, status: 'ok', data: screen, message: `Screen ${classId} → ${screen.map((s) => `${s.label} (${(s.score * 100).toFixed(0)})`).join(', ')}${n.config?.bindTop !== false ? ` — bound to ${label}` : ''}` });
          break;
        }
        case 'analysis': {
          if (!ticker) throw new Error('No asset context');
          const prog = PROGRAM_BY_ID.get(n.config?.programId);
          if (!prog) throw new Error('Unknown analysis program');
          const series = hooks.getSeries(ticker);
          const res = prog.run(series, n.config?.params ?? {});
          lastAnalysis = { id: prog.id, ...res };
          lastSignal = res.verdict;
          push({
            step, kind: n.kind, data: lastAnalysis,
            status: res.verdict === 'insufficient' ? 'skip' : 'ok',
            message: `${prog.label} on ${label}: ${res.detail} → ${res.verdict.toUpperCase()}`,
          });
          break;
        }
        case 'code': {
          const block = hooks.blocks.find((b) => b.id === n.config?.blockId);
          if (!block) throw new Error('Custom block not found');
          const series = ticker ? hooks.getSeries(ticker) : [];
          const res = await runBlockCode(block.code, {
            ticker, label, price: ticker ? hooks.getPrice(ticker) : 0,
            series, change: null, account: hooks.account, screen, analysis: lastAnalysis,
            params: n.config?.params ?? {},
          }, Number(n.config?.timeoutMs ?? 4000));
          if (!res.ok) throw new Error(res.error ?? 'block failed');
          const out = res.output;
          if (out && typeof out === 'object' && typeof out.signal === 'string') lastSignal = out.signal;
          push({ step, kind: n.kind, status: 'ok', data: out, message: `${block.name} ⇒ ${JSON.stringify(out)} (${res.ms}ms)${res.logs.length ? ` | ${res.logs.join(' • ')}` : ''}` });
          break;
        }
        case 'branch': {
          const expects = String(n.config?.expects ?? '');
          if (!expects) { push({ step, kind: n.kind, status: 'info', message: 'Branch pass-through (no condition).' }); break; }
          const ok = lastSignal === expects;
          if (!ok) halted = true;
          push({ step, kind: n.kind, status: ok ? 'ok' : 'skip', message: `Branch expects "${expects}", upstream signal "${lastSignal ?? 'none'}" — ${ok ? 'continue' : 'halt downstream'}.` });
          break;
        }
        case 'risk': {
          const dd = Number(n.config?.maxDrawdownPct ?? 10);
          const pnlPct = startEquity > 0 ? ((hooks.account.equity - startEquity) / startEquity) * 100 : 0;
          if (pnlPct <= -dd) { halted = !!n.config?.blockOnBreach; push({ step, kind: n.kind, status: 'error', message: `Risk breached ${pnlPct.toFixed(2)}% ≤ -${dd}%${halted ? ' — halting.' : ''}` }); }
          else push({ step, kind: n.kind, status: 'ok', message: `Risk OK (${pnlPct.toFixed(2)}% within -${dd}%)` });
          break;
        }
        case 'alert': {
          if (!ticker) throw new Error('No asset context');
          const price = hooks.getPrice(ticker);
          const trigger = Number(n.config?.price);
          const dir = n.config?.direction === 'below' ? 'below' : 'above';
          const fired = dir === 'above' ? price >= trigger : price <= trigger;
          push({ step, kind: n.kind, status: fired ? 'ok' : 'info', message: fired ? `ALERT ${dir} — ${label} @ ${price.toFixed(4)} vs ${trigger}` : `Alert armed: ${label} ${dir} ${trigger} (now ${price.toFixed(4)})` });
          break;
        }
        case 'buy':
        case 'sell': {
          if (!ticker) throw new Error('No asset context');
          const price = hooks.getPrice(ticker);
          if (!(price > 0)) throw new Error(`No live price for ${ticker}`);
          const notional = Number(n.config?.amountUsd ?? n.config?.amount ?? 0);
          const qty = notional / price;
          const order = hooks.submitOrder({ symbol: ticker, side: n.kind, qty, type: 'market', price, botSource: true });
          push({ step, kind: n.kind, status: 'ok', message: `${n.kind.toUpperCase()} ${qty.toFixed(6)} ${label} ($${notional.toLocaleString()}) @ ${order.price.toFixed(4)} (fee $${order.fees.toFixed(2)})` });
          break;
        }
      }
    } catch (err: any) {
      push({ step, kind: n.kind, status: 'error', message: `${n.label} failed: ${err?.message ?? err}` });
    }
  }
  return log;
}

export const ANALYSIS_CATALOG = ANALYSIS_PROGRAMS;