// ─────────────────────────────────────────────────────────────
// PIPELINE NODE REGISTRY — closed enum of node kinds,
// each mapped to a PURE FUNCTION. No eval, no new Function.
// ─────────────────────────────────────────────────────────────

export type NodeKind =
  | 'signal.rsi'
  | 'signal.bollinger'
  | 'signal.donchian'
  | 'trigger.priceAbove'
  | 'trigger.priceBelow'
  | 'trigger.crossover'
  | 'trigger.schedule'
  | 'filter.regime'
  | 'filter.volatility'
  | 'risk.atrStop'
  | 'risk.maxPositionPct'
  | 'risk.fixedUsd'
  | 'analysis.trend'
  | 'analysis.momentum'
  | 'predict.forecast'
  | 'action.buy'
  | 'action.sell'
  | 'execution.orderIntent'
  | 'alert.notify'
  | 'monitor.log';

export interface PipelineContext {
  symbol: string;
  price: number;
  candles: number[];   // recent closes
  equity: number;
  now: number;         // ms epoch of the current tick
  tickCount: number;   // monotonic tick index for this runner
}

export interface NodeSpec {
  id: string;
  kind: NodeKind;
  params: Record<string, number | string | boolean>;
  inputs?: string[]; // ids of upstream nodes
}

export interface Pipeline {
  id: string;
  name: string;
  nodes: NodeSpec[];
}

export type NodeOutput =
  | { type: 'signal'; value: number; reason: string }         // -1..+1
  | { type: 'gate'; pass: boolean; reason: string }
  | { type: 'risk'; sizeUsd: number; stopPrice?: number; reason: string }
  | { type: 'intent'; side: 'buy' | 'sell'; sizeUsd: number; stopPrice?: number; reason: string }
  | { type: 'alert'; severity: 'info' | 'warn'; message: string }
  | { type: 'log'; message: string };

export type PureFn = (params: Record<string, any>, inputs: NodeOutput[], ctx: PipelineContext) => NodeOutput;

// ── math helpers (pure) ─────────────────────────────────────
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
const std  = (a: number[]) => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };

function rsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  const rs = losses === 0 ? 100 : gains / losses;
  return 100 - 100 / (1 + rs);
}

// ── registry ────────────────────────────────────────────────
export const NodeRegistry: Record<NodeKind, PureFn> = {
  'signal.rsi': (p, _i, ctx) => {
    const period = Number(p.period ?? 14);
    const os = Number(p.oversold ?? 30);
    const ob = Number(p.overbought ?? 70);
    const r = rsi(ctx.candles, period);
    const value = r < os ? +1 : r > ob ? -1 : 0;
    return { type: 'signal', value, reason: `RSI(${period})=${r.toFixed(1)} os=${os} ob=${ob}` };
  },
  'signal.bollinger': (p, _i, ctx) => {
    const period = Number(p.period ?? 20);
    const k = Number(p.k ?? 2);
    const win = ctx.candles.slice(-period);
    if (win.length < period) return { type: 'signal', value: 0, reason: 'insufficient data' };
    const m = mean(win), s = std(win);
    const upper = m + k * s, lower = m - k * s;
    const value = ctx.price < lower ? +1 : ctx.price > upper ? -1 : 0;
    return { type: 'signal', value, reason: `BB μ=${m.toFixed(2)} ±${(k*s).toFixed(2)} px=${ctx.price.toFixed(2)}` };
  },
  'signal.donchian': (p, _i, ctx) => {
    const period = Number(p.period ?? 20);
    const win = ctx.candles.slice(-period);
    if (win.length < period) return { type: 'signal', value: 0, reason: 'insufficient data' };
    const hi = Math.max(...win), lo = Math.min(...win);
    const value = ctx.price >= hi ? +1 : ctx.price <= lo ? -1 : 0;
    return { type: 'signal', value, reason: `Donchian hi=${hi.toFixed(2)} lo=${lo.toFixed(2)}` };
  },
  'trigger.priceAbove': (p, _i, ctx) => {
    const threshold = Number(p.threshold ?? 0);
    const value = ctx.price > threshold ? +1 : 0;
    return { type: 'signal', value, reason: `price ${ctx.price.toFixed(2)} ${value ? '>' : '≤'} ${threshold}` };
  },
  'trigger.priceBelow': (p, _i, ctx) => {
    const threshold = Number(p.threshold ?? 0);
    const value = ctx.price < threshold ? -1 : 0;
    return { type: 'signal', value, reason: `price ${ctx.price.toFixed(2)} ${value ? '<' : '≥'} ${threshold}` };
  },
  'trigger.crossover': (p, _i, ctx) => {
    const fast = Number(p.fastPeriod ?? 9);
    const slow = Number(p.slowPeriod ?? 21);
    if (ctx.candles.length < slow + 1) return { type: 'signal', value: 0, reason: `warmup ${ctx.candles.length}/${slow + 1}` };
    const fastNow = mean(ctx.candles.slice(-fast));
    const slowNow = mean(ctx.candles.slice(-slow));
    const fastPrev = mean(ctx.candles.slice(-fast - 1, -1));
    const slowPrev = mean(ctx.candles.slice(-slow - 1, -1));
    const value = fastPrev <= slowPrev && fastNow > slowNow ? +1
                : fastPrev >= slowPrev && fastNow < slowNow ? -1
                : 0;
    return { type: 'signal', value, reason: `${fast}/${slow} MA cross ${value > 0 ? 'up' : value < 0 ? 'down' : 'flat'}` };
  },
  'trigger.schedule': (p, _i, ctx) => {
    const everyTicks = Math.max(1, Number(p.everyTicks ?? 15));
    const side = String(p.side ?? 'buy');
    const fires = ctx.tickCount > 0 && ctx.tickCount % everyTicks === 0;
    if (!fires) return { type: 'signal', value: 0, reason: `sched idle (${ctx.tickCount}/${everyTicks})` };
    return { type: 'signal', value: side === 'sell' ? -1 : +1, reason: `sched ${side.toUpperCase()} every ${everyTicks} ticks` };
  },
  'filter.regime': (_p, _i, ctx) => {
    const n = Math.min(50, ctx.candles.length);
    if (n < 20) return { type: 'gate', pass: false, reason: 'insufficient regime data' };
    const win = ctx.candles.slice(-n);
    const trend = (win[win.length - 1] - win[0]) / win[0];
    const pass = Math.abs(trend) > 0.005;
    return { type: 'gate', pass, reason: `regime Δ=${(trend * 100).toFixed(2)}%` };
  },
  'filter.volatility': (p, _i, ctx) => {
    const period = Number(p.period ?? 20);
    const maxSigma = Number(p.maxSigma ?? 0.05);
    const win = ctx.candles.slice(-period);
    if (win.length < period) return { type: 'gate', pass: false, reason: 'insufficient vol data' };
    const sigma = std(win) / mean(win);
    return { type: 'gate', pass: sigma <= maxSigma, reason: `σ=${(sigma * 100).toFixed(2)}% cap=${(maxSigma * 100).toFixed(1)}%` };
  },
  'risk.atrStop': (p, _i, ctx) => {
    const mult = Number(p.mult ?? 1.5);
    const win = ctx.candles.slice(-14);
    const atr = win.length > 1 ? mean(win.slice(1).map((c, i) => Math.abs(c - win[i]))) : ctx.price * 0.01;
    const stop = ctx.price - mult * atr;
    return { type: 'risk', sizeUsd: 0, stopPrice: stop, reason: `ATR stop @${stop.toFixed(2)} (${mult}×ATR)` };
  },
  'risk.maxPositionPct': (p, _i, ctx) => {
    const pct = Number(p.pct ?? 0.05);
    const sizeUsd = ctx.equity * pct;
    return { type: 'risk', sizeUsd, reason: `size $${sizeUsd.toFixed(0)} (${(pct * 100).toFixed(1)}% equity)` };
  },
  'risk.fixedUsd': (p) => {
    const sizeUsd = Math.max(0, Number(p.sizeUsd ?? 500));
    return { type: 'risk', sizeUsd, reason: `fixed $${sizeUsd.toFixed(0)} per trade` };
  },
  'analysis.trend': (p, _i, ctx) => {
    const period = Math.min(Number(p.period ?? 30), ctx.candles.length);
    if (period < 5) return { type: 'signal', value: 0, reason: 'insufficient trend data' };
    const win = ctx.candles.slice(-period);
    const first = win[0], last = win[win.length - 1];
    const slopePct = (last - first) / first;
    const strong = Number(p.strongPct ?? 0.01);
    const value = slopePct > strong ? +1 : slopePct < -strong ? -1 : 0;
    return { type: 'signal', value, reason: `TREND ${period}b Δ=${(slopePct * 100).toFixed(2)}%` };
  },
  'analysis.momentum': (p, _i, ctx) => {
    const lookback = Math.min(Number(p.lookback ?? 10), ctx.candles.length - 1);
    if (lookback < 2) return { type: 'signal', value: 0, reason: 'insufficient momentum data' };
    const now = ctx.candles[ctx.candles.length - 1];
    const past = ctx.candles[ctx.candles.length - 1 - lookback];
    const roc = (now - past) / past;
    const th = Number(p.threshold ?? 0.005);
    const value = roc > th ? +1 : roc < -th ? -1 : 0;
    return { type: 'signal', value, reason: `MOMO ${lookback}b ROC=${(roc * 100).toFixed(2)}%` };
  },
  'predict.forecast': (p, _i, ctx) => {
    const period = Math.min(Number(p.period ?? 20), ctx.candles.length);
    const horizon = Math.max(1, Number(p.horizon ?? 5));
    if (period < 5) return { type: 'signal', value: 0, reason: 'insufficient forecast data' };
    const win = ctx.candles.slice(-period);
    // linear regression slope
    const n = win.length;
    const xs = Array.from({ length: n }, (_, i) => i);
    const mx = mean(xs), my = mean(win);
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (win[i] - my); den += (xs[i] - mx) ** 2; }
    const slope = den === 0 ? 0 : num / den;
    const projected = ctx.price + slope * horizon;
    const expectedPct = (projected - ctx.price) / ctx.price;
    const th = Number(p.threshold ?? 0.003);
    const value = expectedPct > th ? +1 : expectedPct < -th ? -1 : 0;
    return { type: 'signal', value, reason: `FCST +${horizon}b →${projected.toFixed(2)} (${(expectedPct * 100).toFixed(2)}%)` };
  },
  'action.buy': (_p, inputs, ctx) => {
    const risk = inputs.find(i => i.type === 'risk' && (i as any).sizeUsd > 0) as any;
    const stop = inputs.find(i => i.type === 'risk' && (i as any).stopPrice != null) as any;
    const gate = inputs.find(i => i.type === 'gate') as any;
    if (gate && !gate.pass) return { type: 'log', message: `BUY blocked: ${gate.reason}` };
    const sizeUsd = risk?.sizeUsd ?? ctx.equity * 0.02;
    return { type: 'intent', side: 'buy', sizeUsd, stopPrice: stop?.stopPrice, reason: `forced BUY | ${risk?.reason ?? '2% default'}` };
  },
  'action.sell': (_p, inputs, ctx) => {
    const risk = inputs.find(i => i.type === 'risk' && (i as any).sizeUsd > 0) as any;
    const stop = inputs.find(i => i.type === 'risk' && (i as any).stopPrice != null) as any;
    const gate = inputs.find(i => i.type === 'gate') as any;
    if (gate && !gate.pass) return { type: 'log', message: `SELL blocked: ${gate.reason}` };
    const sizeUsd = risk?.sizeUsd ?? ctx.equity * 0.02;
    return { type: 'intent', side: 'sell', sizeUsd, stopPrice: stop?.stopPrice, reason: `forced SELL | ${risk?.reason ?? '2% default'}` };
  },
  'execution.orderIntent': (_p, inputs) => {
    const sig = inputs.find(i => i.type === 'signal') as any;
    const risk = inputs.find(i => i.type === 'risk' && i.sizeUsd > 0) as any;
    const stop = inputs.find(i => i.type === 'risk' && i.stopPrice != null) as any;
    const gate = inputs.find(i => i.type === 'gate') as any;
    if (!sig || sig.value === 0) return { type: 'log', message: 'no signal → skip' };
    if (gate && !gate.pass) return { type: 'log', message: `blocked by gate: ${gate.reason}` };
    if (!risk) return { type: 'log', message: 'no risk sizer → skip' };
    return {
      type: 'intent',
      side: sig.value > 0 ? 'buy' : 'sell',
      sizeUsd: risk.sizeUsd,
      stopPrice: stop?.stopPrice,
      reason: `${sig.reason} | ${risk.reason}${stop ? ' | ' + stop.reason : ''}`,
    };
  },
  'alert.notify': (p, inputs) => {
    const sig = inputs.find(i => i.type === 'signal') as any;
    const intent = inputs.find(i => i.type === 'intent') as any;
    const message = String(p.message ?? 'pipeline alert');
    const active = (sig && sig.value !== 0) || !!intent;
    if (!active) return { type: 'log', message: `alert idle: ${message}` };
    const detail = intent ? `${intent.side.toUpperCase()} ${intent.reason}` : sig?.reason ?? '';
    return { type: 'alert', severity: 'warn', message: `${message} — ${detail}` };
  },
  'monitor.log': (p, inputs) => {
    const last = inputs[inputs.length - 1];
    return { type: 'log', message: `${p.tag ?? 'LOG'}: ${last ? (last as any).reason ?? (last as any).message ?? 'n/a' : 'no input'}` };
  },
};

// ── Kahn topo-sort (rejects cycles) ─────────────────────────
export function compile(pipeline: Pipeline): { order: string[] } | { error: string } {
  const ids = new Set(pipeline.nodes.map(n => n.id));
  const indeg = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of pipeline.nodes) {
    indeg.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const n of pipeline.nodes) {
    for (const inId of n.inputs ?? []) {
      if (!ids.has(inId)) return { error: `unknown input ${inId} referenced by ${n.id}` };
      adj.get(inId)!.push(n.id);
      indeg.set(n.id, (indeg.get(n.id) ?? 0) + 1);
    }
  }
  const queue = pipeline.nodes.filter(n => (indeg.get(n.id) ?? 0) === 0).map(n => n.id);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const nxt of adj.get(id) ?? []) {
      indeg.set(nxt, (indeg.get(nxt) ?? 0) - 1);
      if ((indeg.get(nxt) ?? 0) === 0) queue.push(nxt);
    }
  }
  if (order.length !== pipeline.nodes.length) return { error: 'cycle detected' };
  return { order };
}

export function evaluate(pipeline: Pipeline, ctx: PipelineContext): { outputs: Record<string, NodeOutput>; intents: any[]; logs: string[] } | { error: string } {
  const comp = compile(pipeline);
  if ('error' in comp) return comp;
  const byId = new Map(pipeline.nodes.map(n => [n.id, n]));
  const outputs: Record<string, NodeOutput> = {};
  const intents: any[] = [];
  const logs: string[] = [];
  for (const id of comp.order) {
    const n = byId.get(id)!;
    const fn = NodeRegistry[n.kind];
    if (!fn) { logs.push(`${id}: unknown kind ${n.kind}`); continue; }
    const inputs = (n.inputs ?? []).map(i => outputs[i]).filter(Boolean) as NodeOutput[];
    const out = fn(n.params, inputs, ctx);
    outputs[id] = out;
    if (out.type === 'intent') intents.push({ nodeId: id, symbol: ctx.symbol, ...out });
    if (out.type === 'log') logs.push(`${id}: ${out.message}`);
  }
  return { outputs, intents, logs };
}

// ── Preset pipelines ────────────────────────────────────────
export const PIPELINE_PRESETS: Pipeline[] = [
  {
    id: 'half-kelly-trend',
    name: 'Half-Kelly Trend',
    nodes: [
      { id: 'sig',   kind: 'signal.donchian', params: { period: 20 } },
      { id: 'reg',   kind: 'filter.regime',   params: {} },
      { id: 'size',  kind: 'risk.maxPositionPct', params: { pct: 0.05 } },
      { id: 'stop',  kind: 'risk.atrStop', params: { mult: 1.5 } },
      { id: 'exec',  kind: 'execution.orderIntent', params: {}, inputs: ['sig', 'reg', 'size', 'stop'] },
      { id: 'log',   kind: 'monitor.log', params: { tag: 'TREND' }, inputs: ['exec'] },
    ],
  },
  {
    id: 'bollinger-reversion',
    name: 'Bollinger Reversion',
    nodes: [
      { id: 'sig',  kind: 'signal.bollinger', params: { period: 20, k: 2 } },
      { id: 'vol',  kind: 'filter.volatility', params: { period: 20, maxSigma: 0.05 } },
      { id: 'size', kind: 'risk.maxPositionPct', params: { pct: 0.03 } },
      { id: 'stop', kind: 'risk.atrStop', params: { mult: 0.8 } },
      { id: 'exec', kind: 'execution.orderIntent', params: {}, inputs: ['sig', 'vol', 'size', 'stop'] },
      { id: 'log',  kind: 'monitor.log', params: { tag: 'REV' }, inputs: ['exec'] },
    ],
  },
  {
    id: 'rsi-mean-reversion',
    name: 'RSI Mean-Reversion',
    nodes: [
      { id: 'sig',  kind: 'signal.rsi', params: { period: 14, oversold: 30, overbought: 70 } },
      { id: 'reg',  kind: 'filter.regime', params: {} },
      { id: 'size', kind: 'risk.maxPositionPct', params: { pct: 0.04 } },
      { id: 'exec', kind: 'execution.orderIntent', params: {}, inputs: ['sig', 'reg', 'size'] },
      { id: 'log',  kind: 'monitor.log', params: { tag: 'RSI' }, inputs: ['exec'] },
    ],
  },
];