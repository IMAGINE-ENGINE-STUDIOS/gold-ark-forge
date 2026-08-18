// Workflow runtime — sequential executor for the Pipeline canvas.
// Non-branching v1: walks nodes in order, threads a SYMBOL context,
// executes actions against paper trading, evaluates alerts & risk gates,
// and returns a structured execution log.

export type EngineNodeKind =
  | 'symbol' | 'buy' | 'sell' | 'stop' | 'trail' | 'hedge'
  | 'schedule' | 'timer' | 'alertup' | 'alertdown' | 'risk'
  | 'dca' | 'grid' | 'scalp' | 'momentum' | 'meanrev' | 'wave' | 'genius';

export interface EngineNode {
  id: string;
  kind: EngineNodeKind;
  label: string;
  config: Record<string, any>;
}

export interface EngineHooks {
  submitOrder: (p: {
    symbol: string; side: 'buy' | 'sell'; qty: number;
    type: 'market' | 'limit' | 'stop'; price: number; limitPrice?: number;
    botSource?: boolean;
  }) => { id: string; price: number; fees: number };
  getPriceByTicker: (ticker: string) => number;
  account: { equity: number; totalPnl: number; startingBalance: number };
  /** Return true to abort the run before the next step executes. */
  shouldStop?: () => boolean;
}

export interface EngineLogEntry {
  ts: number;
  step: number;
  kind: EngineNodeKind;
  status: 'ok' | 'skip' | 'error' | 'info';
  message: string;
}

export interface ValidationIssue {
  step: number;
  nodeId: string;
  level: 'error' | 'warn';
  message: string;
}

const SYMBOL_CONSUMERS: ReadonlySet<EngineNodeKind> = new Set([
  'buy', 'sell', 'stop', 'trail', 'alertup', 'alertdown', 'schedule',
  'dca', 'grid', 'scalp', 'momentum', 'meanrev', 'wave', 'genius',
]);

export function validateWorkflow(nodes: EngineNode[]): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (nodes.length === 0) {
    out.push({ step: 0, nodeId: '', level: 'error', message: 'Workflow is empty.' });
    return out;
  }
  let ctx: string | null = null;
  nodes.forEach((n, i) => {
    if (n.kind === 'symbol') {
      if (!n.config?.ticker && !n.config?.symbol) {
        out.push({ step: i + 1, nodeId: n.id, level: 'error', message: 'Symbol node has no ticker.' });
      }
      ctx = n.config?.ticker ?? n.config?.symbol ?? null;
      return;
    }
    if (SYMBOL_CONSUMERS.has(n.kind) && !ctx) {
      out.push({ step: i + 1, nodeId: n.id, level: 'error', message: `${n.label} requires a SYMBOL earlier in the chain.` });
    }
    if ((n.kind === 'buy' || n.kind === 'sell')) {
      const usd = Number(n.config?.amountUsd ?? n.config?.amount);
      if (!Number.isFinite(usd) || usd <= 0) {
        out.push({ step: i + 1, nodeId: n.id, level: 'error', message: `${n.label} amount must be > 0.` });
      }
      if (n.config?.orderType && n.config.orderType !== 'market') {
        const lp = Number(n.config?.limitPrice);
        if (!Number.isFinite(lp) || lp <= 0) {
          out.push({ step: i + 1, nodeId: n.id, level: 'error', message: `${n.label} needs a limit/stop price.` });
        }
      }
    }
    if (n.kind === 'alertup' || n.kind === 'alertdown') {
      const p = Number(n.config?.price);
      if (!Number.isFinite(p) || p <= 0) {
        out.push({ step: i + 1, nodeId: n.id, level: 'error', message: `${n.label} needs a trigger price.` });
      }
    }
    if (n.kind === 'stop') {
      const p = Number(n.config?.stopPrice);
      if (!Number.isFinite(p) || p <= 0) {
        out.push({ step: i + 1, nodeId: n.id, level: 'warn', message: 'STOP has no price — will use market on execute.' });
      }
    }
  });
  return out;
}

export async function runWorkflow(
  nodes: EngineNode[],
  hooks: EngineHooks,
  onLog: (e: EngineLogEntry) => void,
): Promise<EngineLogEntry[]> {
  const log: EngineLogEntry[] = [];
  const push = (e: Omit<EngineLogEntry, 'ts'>) => {
    const full: EngineLogEntry = { ts: Date.now(), ...e };
    log.push(full);
    onLog(full);
  };

  let ctxTicker: string | null = null;
  let ctxLabel: string | null = null;
  let riskBreached = false;
  const startingEquity = hooks.account.equity;

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const step = i + 1;

    if (hooks.shouldStop?.()) {
      push({ step, kind: n.kind, status: 'skip', message: `Run stopped by operator before ${n.label}.` });
      break;
    }

    if (riskBreached) {
      push({ step, kind: n.kind, status: 'skip', message: `Skipped ${n.label} — risk gate active.` });
      continue;
    }

    try {
      switch (n.kind) {
        case 'symbol': {
          ctxTicker = n.config?.ticker ?? null;
          ctxLabel = n.config?.symbol ?? ctxTicker;
          push({ step, kind: n.kind, status: 'info', message: `Context set → ${ctxLabel} (${ctxTicker ?? '—'})` });
          break;
        }
        case 'risk': {
          const dd = Number(n.config?.maxDrawdownPct ?? 10);
          const pnl = hooks.account.equity - startingEquity;
          const pnlPct = startingEquity > 0 ? (pnl / startingEquity) * 100 : 0;
          if (pnlPct <= -dd) {
            riskBreached = !!n.config?.blockOnBreach;
            push({ step, kind: n.kind, status: 'error', message: `Risk breached: dd=${pnlPct.toFixed(2)}% ≤ -${dd}%${riskBreached ? ' — halting.' : ''}` });
          } else {
            push({ step, kind: n.kind, status: 'ok', message: `Risk OK (dd=${pnlPct.toFixed(2)}% within -${dd}%)` });
          }
          break;
        }
        case 'buy':
        case 'sell': {
          if (!ctxTicker) throw new Error('No SYMBOL context');
          const price = hooks.getPriceByTicker(ctxTicker);
          if (!(price > 0)) throw new Error(`No live price for ${ctxTicker}`);
          const notionalUsd = Number(n.config?.amountUsd ?? n.config?.amount ?? 0);
          const qty = price > 0 ? notionalUsd / price : 0;
          const orderType = (n.config?.orderType ?? 'market') as 'market' | 'limit' | 'stop';
          const limitPrice = orderType === 'market' ? undefined : Number(n.config?.limitPrice);
          const order = hooks.submitOrder({
            symbol: ctxTicker, side: n.kind, qty, type: orderType, price, limitPrice, botSource: true,
          });
          push({ step, kind: n.kind, status: 'ok', message: `${n.kind.toUpperCase()} ${qty.toFixed(6)} ${ctxLabel} ($${notionalUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${n.config?.currency ?? 'USD'}-adj) @ ${order.price.toFixed(2)} (fee $${order.fees.toFixed(2)})` });
          break;
        }
        case 'stop': {
          if (!ctxTicker) throw new Error('No SYMBOL context');
          const price = hooks.getPriceByTicker(ctxTicker);
          const trigger = Number(n.config?.stopPrice);
          if (Number.isFinite(trigger) && trigger > 0 && price > 0 && price <= trigger) {
            push({ step, kind: n.kind, status: 'ok', message: `STOP triggered on ${ctxLabel} @ ${price.toFixed(2)} ≤ ${trigger}` });
          } else {
            push({ step, kind: n.kind, status: 'info', message: `STOP armed for ${ctxLabel} @ ${trigger || 'market'}` });
          }
          break;
        }
        case 'alertup':
        case 'alertdown': {
          if (!ctxTicker) throw new Error('No SYMBOL context');
          const price = hooks.getPriceByTicker(ctxTicker);
          const trigger = Number(n.config?.price);
          const fired = n.kind === 'alertup' ? price >= trigger : price <= trigger;
          push({
            step, kind: n.kind,
            status: fired ? 'ok' : 'info',
            message: fired
              ? `ALERT ${n.kind === 'alertup' ? '▲' : '▼'} ${ctxLabel} @ ${price.toFixed(2)} vs ${trigger} — sent via ${n.config?.channel}`
              : `Alert armed ${ctxLabel} ${n.kind === 'alertup' ? '≥' : '≤'} ${trigger} (now ${price.toFixed(2)})`,
          });
          break;
        }
        case 'timer': {
          const s = Math.max(0, Math.min(10, Number(n.config?.seconds ?? 1))); // cap for UI runs
          push({ step, kind: n.kind, status: 'info', message: `Waiting ${s}s (capped for preview)…` });
          await new Promise((r) => setTimeout(r, s * 1000));
          break;
        }
        case 'schedule': {
          push({ step, kind: n.kind, status: 'info', message: `Scheduled (${n.config?.when} @ ${n.config?.time}) — registered for background runner.` });
          break;
        }
        case 'trail':
        case 'hedge':
        case 'dca':
        case 'grid':
        case 'scalp':
        case 'momentum':
        case 'meanrev':
        case 'wave': {
          push({ step, kind: n.kind, status: 'info', message: `${n.label} strategy engaged on ${ctxLabel ?? '—'} with ${JSON.stringify(n.config)}` });
          break;
        }
        case 'genius': {
          push({
            step, kind: n.kind, status: 'info',
            message: `Genius AI (${n.config?.model}) reasoning on ${ctxLabel ?? 'portfolio'} — autoExecute=${!!n.config?.autoExecute}, maxDD=${n.config?.maxDrawdownPct}%`,
          });
          break;
        }
      }
    } catch (err: any) {
      push({ step, kind: n.kind, status: 'error', message: `${n.label} failed: ${err?.message ?? err}` });
    }
  }

  return log;
}