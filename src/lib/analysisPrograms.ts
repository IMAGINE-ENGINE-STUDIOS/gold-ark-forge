// Analysis programs — deterministic quantitative blocks for Pipeline v2.
// Each program is a pure function over a live price series. No synthetic data:
// with an insufficient series a program reports `insufficient` and the pipeline
// treats it as a skip, never as a fabricated signal.

export type Verdict = 'bullish' | 'bearish' | 'neutral' | 'insufficient';

export interface ProgramResult {
  value: number;
  verdict: Verdict;
  detail: string;
}

export interface ProgramParam {
  key: string;
  label: string;
  default: number;
  min: number;
  max: number;
  step?: number;
}

export interface AnalysisProgram {
  id: string;
  label: string;
  blurb: string;
  tint: string;
  minPoints: number;
  params: ProgramParam[];
  run: (series: number[], params: Record<string, number>) => ProgramResult;
}

const sma = (s: number[], n: number) => s.slice(-n).reduce((a, b) => a + b, 0) / Math.min(n, s.length);
const ema = (s: number[], n: number) => {
  const k = 2 / (n + 1);
  return s.reduce((acc, v, i) => (i === 0 ? v : v * k + acc * (1 - k)), 0);
};
const stdev = (s: number[]) => {
  const m = s.reduce((a, b) => a + b, 0) / s.length;
  return Math.sqrt(s.reduce((a, b) => a + (b - m) ** 2, 0) / s.length);
};
const returns = (s: number[]) => s.slice(1).map((v, i) => (v - s[i]) / s[i]);
const insufficient = (need: number): ProgramResult => ({ value: 0, verdict: 'insufficient', detail: `needs ≥ ${need} live samples` });

const BASE_PROGRAMS: AnalysisProgram[] = [
  {
    id: 'rsi', label: 'RSI', blurb: 'Relative strength of the live sample window.', tint: 'violet', minPoints: 8,
    params: [{ key: 'period', label: 'Period', default: 14, min: 3, max: 60 }],
    run: (s, p) => {
      const n = Math.min(Math.round(p.period ?? 14), s.length - 1);
      if (s.length < 3) return insufficient(3);
      const r = returns(s.slice(-(n + 1)));
      const gains = r.filter((v) => v > 0).reduce((a, b) => a + b, 0) / r.length;
      const losses = Math.abs(r.filter((v) => v < 0).reduce((a, b) => a + b, 0)) / r.length;
      const rs = losses === 0 ? 100 : gains / losses;
      const rsi = losses === 0 ? 100 : 100 - 100 / (1 + rs);
      return {
        value: Number(rsi.toFixed(2)),
        verdict: rsi >= 70 ? 'bearish' : rsi <= 30 ? 'bullish' : 'neutral',
        detail: `RSI(${n}) = ${rsi.toFixed(2)}`,
      };
    },
  },
  {
    id: 'macd', label: 'MACD', blurb: 'Fast/slow EMA convergence on live prices.', tint: 'sky', minPoints: 10,
    params: [
      { key: 'fast', label: 'Fast EMA', default: 12, min: 2, max: 50 },
      { key: 'slow', label: 'Slow EMA', default: 26, min: 3, max: 200 },
    ],
    run: (s, p) => {
      if (s.length < 5) return insufficient(5);
      const macd = ema(s, p.fast ?? 12) - ema(s, p.slow ?? 26);
      const pct = (macd / s[s.length - 1]) * 100;
      return { value: Number(pct.toFixed(4)), verdict: pct > 0.02 ? 'bullish' : pct < -0.02 ? 'bearish' : 'neutral', detail: `MACD spread ${pct.toFixed(4)}%` };
    },
  },
  {
    id: 'bollinger', label: 'BOLLINGER', blurb: 'Band position of the last print.', tint: 'cyan', minPoints: 8,
    params: [
      { key: 'window', label: 'Window', default: 20, min: 4, max: 120 },
      { key: 'sigma', label: 'Sigma', default: 2, min: 1, max: 4, step: 0.5 },
    ],
    run: (s, p) => {
      if (s.length < 5) return insufficient(5);
      const w = s.slice(-Math.round(p.window ?? 20));
      const mid = sma(w, w.length);
      const sd = stdev(w) * (p.sigma ?? 2);
      const last = s[s.length - 1];
      const z = sd > 0 ? (last - mid) / sd : 0;
      return { value: Number(z.toFixed(3)), verdict: z > 1 ? 'bearish' : z < -1 ? 'bullish' : 'neutral', detail: `band position ${z.toFixed(2)}σ` };
    },
  },
  {
    id: 'volatility', label: 'VOLATILITY', blurb: 'Realised dispersion of live returns.', tint: 'amber', minPoints: 5,
    params: [{ key: 'window', label: 'Window', default: 30, min: 4, max: 200 }],
    run: (s) => {
      if (s.length < 3) return insufficient(3);
      const vol = stdev(returns(s)) * 100;
      return { value: Number(vol.toFixed(4)), verdict: 'neutral', detail: `realised vol ${vol.toFixed(3)}% per sample` };
    },
  },
  {
    id: 'zscore', label: 'Z-SCORE', blurb: 'Statistical stretch from the live mean.', tint: 'indigo', minPoints: 6,
    params: [{ key: 'window', label: 'Window', default: 50, min: 5, max: 300 }],
    run: (s, p) => {
      if (s.length < 4) return insufficient(4);
      const w = s.slice(-Math.round(p.window ?? 50));
      const sd = stdev(w);
      const z = sd > 0 ? (w[w.length - 1] - sma(w, w.length)) / sd : 0;
      return { value: Number(z.toFixed(3)), verdict: z > 2 ? 'bearish' : z < -2 ? 'bullish' : 'neutral', detail: `z = ${z.toFixed(2)}` };
    },
  },
  {
    id: 'trend', label: 'TREND SCORE', blurb: 'Linear regression slope of the live window.', tint: 'emerald', minPoints: 5,
    params: [{ key: 'window', label: 'Window', default: 40, min: 4, max: 200 }],
    run: (s, p) => {
      const w = s.slice(-Math.round(p.window ?? 40));
      if (w.length < 3) return insufficient(3);
      const n = w.length;
      const xs = w.map((_, i) => i);
      const mx = (n - 1) / 2;
      const my = w.reduce((a, b) => a + b, 0) / n;
      const num = xs.reduce((a, x, i) => a + (x - mx) * (w[i] - my), 0);
      const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
      const slopePct = den > 0 ? ((num / den) / my) * 100 : 0;
      return { value: Number(slopePct.toFixed(5)), verdict: slopePct > 0.01 ? 'bullish' : slopePct < -0.01 ? 'bearish' : 'neutral', detail: `slope ${slopePct.toFixed(4)}% / sample` };
    },
  },
  {
    id: 'drawdown', label: 'DRAWDOWN', blurb: 'Distance below the live window high.', tint: 'rose', minPoints: 4,
    params: [],
    run: (s) => {
      if (s.length < 2) return insufficient(2);
      const hi = Math.max(...s);
      const dd = ((s[s.length - 1] - hi) / hi) * 100;
      return { value: Number(dd.toFixed(3)), verdict: dd < -3 ? 'bearish' : 'neutral', detail: `${dd.toFixed(2)}% below window high` };
    },
  },
  {
    id: 'sharpe', label: 'SHARPE PROXY', blurb: 'Drift over dispersion on live samples.', tint: 'gold', minPoints: 6,
    params: [],
    run: (s) => {
      if (s.length < 4) return insufficient(4);
      const r = returns(s);
      const mean = r.reduce((a, b) => a + b, 0) / r.length;
      const sd = stdev(r);
      const sharpe = sd > 0 ? mean / sd : 0;
      return { value: Number(sharpe.toFixed(3)), verdict: sharpe > 0.3 ? 'bullish' : sharpe < -0.3 ? 'bearish' : 'neutral', detail: `risk-adjusted drift ${sharpe.toFixed(2)}` };
    },
  },
  {
    id: 'regime', label: 'REGIME DETECT', blurb: 'Trending vs choppy classification.', tint: 'teal', minPoints: 8,
    params: [{ key: 'window', label: 'Window', default: 40, min: 6, max: 200 }],
    run: (s, p) => {
      const w = s.slice(-Math.round(p.window ?? 40));
      if (w.length < 5) return insufficient(5);
      const net = Math.abs(w[w.length - 1] - w[0]);
      const path = w.slice(1).reduce((a, v, i) => a + Math.abs(v - w[i]), 0);
      const eff = path > 0 ? net / path : 0;
      return { value: Number(eff.toFixed(3)), verdict: eff > 0.4 ? 'bullish' : 'neutral', detail: eff > 0.4 ? `trending (efficiency ${eff.toFixed(2)})` : `choppy (efficiency ${eff.toFixed(2)})` };
    },
  },
  {
    id: 'kelly', label: 'KELLY SIZING', blurb: 'Half-Kelly position fraction from live stats.', tint: 'gold', minPoints: 6,
    params: [{ key: 'fraction', label: 'Kelly fraction', default: 0.5, min: 0.1, max: 1, step: 0.1 }],
    run: (s, p) => {
      if (s.length < 4) return insufficient(4);
      const r = returns(s);
      const mean = r.reduce((a, b) => a + b, 0) / r.length;
      const varr = stdev(r) ** 2;
      const kelly = varr > 0 ? (mean / varr) * (p.fraction ?? 0.5) : 0;
      const capped = Math.max(-1, Math.min(1, kelly));
      return { value: Number(capped.toFixed(3)), verdict: capped > 0 ? 'bullish' : capped < 0 ? 'bearish' : 'neutral', detail: `suggested exposure ${(capped * 100).toFixed(1)}% of risk budget` };
    },
  },
  {
    id: 'anomaly', label: 'ANOMALY SCAN', blurb: 'Flags outlier prints in the live tape.', tint: 'orange', minPoints: 8,
    params: [{ key: 'sigma', label: 'Trigger σ', default: 3, min: 1.5, max: 6, step: 0.5 }],
    run: (s, p) => {
      if (s.length < 5) return insufficient(5);
      const r = returns(s);
      const sd = stdev(r);
      const last = r[r.length - 1];
      const sigmas = sd > 0 ? last / sd : 0;
      const hit = Math.abs(sigmas) >= (p.sigma ?? 3);
      return { value: Number(sigmas.toFixed(2)), verdict: hit ? (sigmas > 0 ? 'bullish' : 'bearish') : 'neutral', detail: hit ? `ANOMALY ${sigmas.toFixed(1)}σ print` : `tape normal (${sigmas.toFixed(1)}σ)` };
    },
  },
  {
    id: 'liquidity', label: 'PRICE STABILITY', blurb: 'Tick stability proxy for execution quality.', tint: 'slate', minPoints: 5,
    params: [],
    run: (s) => {
      if (s.length < 3) return insufficient(3);
      const r = returns(s).map(Math.abs);
      const avg = (r.reduce((a, b) => a + b, 0) / r.length) * 100;
      return { value: Number(avg.toFixed(4)), verdict: 'neutral', detail: `avg tick move ${avg.toFixed(3)}%` };
    },
  },
];

/* ─────────────────────────────────────────────────────────────
   GENERATED PROGRAM FAMILIES
   Parameterised variants of the core quant blocks so operators can
   drop a precise study (RSI-9, EMA 8/34 cross, ROC-20, ATR-14 …)
   straight into a blueprint instead of hand-tuning every time.
   Every program still runs on LIVE samples only.
   ───────────────────────────────────────────────────────────── */

const mean = (s: number[]) => s.reduce((a, b) => a + b, 0) / (s.length || 1);
const wnd = (s: number[], n: number) => s.slice(-Math.max(2, Math.round(n)));
const verdictFrom = (v: number, up: number, dn: number): Verdict => (v > up ? 'bullish' : v < dn ? 'bearish' : 'neutral');
const WINDOW = (def: number): ProgramParam => ({ key: 'window', label: 'Window', default: def, min: 3, max: 400 });

const GENERATED: AnalysisProgram[] = [];
const add = (
  id: string, label: string, blurb: string, tint: string, minPoints: number,
  params: ProgramParam[], run: AnalysisProgram['run'],
) => { GENERATED.push({ id, label, blurb, tint, minPoints, params, run }); };

// ── RSI variants ──
[5, 7, 9, 14, 21, 28, 50].forEach((n) => add(
  `rsi_${n}`, `RSI ${n}`, `Relative strength over a ${n}-sample live window.`, 'violet', 6, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 3) return insufficient(3);
    const r = returns(w);
    const g = r.filter((v) => v > 0).reduce((a, b) => a + b, 0) / r.length;
    const l = Math.abs(r.filter((v) => v < 0).reduce((a, b) => a + b, 0)) / r.length;
    const rsi = l === 0 ? 100 : 100 - 100 / (1 + g / l);
    return { value: Number(rsi.toFixed(2)), verdict: rsi >= 70 ? 'bearish' : rsi <= 30 ? 'bullish' : 'neutral', detail: `RSI(${n}) = ${rsi.toFixed(1)}` };
  },
));

// ── EMA crosses ──
([[3, 8], [5, 13], [8, 21], [9, 26], [12, 26], [13, 34], [20, 50], [21, 55], [34, 89], [50, 200]] as const).forEach(([f, sl]) => add(
  `emacross_${f}_${sl}`, `EMA ${f}/${sl}`, `Fast ${f} vs slow ${sl} EMA separation.`, 'sky', 6,
  [{ key: 'fast', label: 'Fast', default: f, min: 2, max: 200 }, { key: 'slow', label: 'Slow', default: sl, min: 3, max: 400 }],
  (s, p) => {
    if (s.length < 4) return insufficient(4);
    const spread = ((ema(s, p.fast ?? f) - ema(s, p.slow ?? sl)) / s[s.length - 1]) * 100;
    return { value: Number(spread.toFixed(4)), verdict: verdictFrom(spread, 0.02, -0.02), detail: `EMA${f}−EMA${sl} = ${spread.toFixed(3)}%` };
  },
));

// ── SMA crosses ──
([[5, 20], [10, 30], [20, 60], [50, 150]] as const).forEach(([f, sl]) => add(
  `smacross_${f}_${sl}`, `SMA ${f}/${sl}`, `Simple moving average crossover state.`, 'cyan', 6,
  [{ key: 'fast', label: 'Fast', default: f, min: 2, max: 200 }, { key: 'slow', label: 'Slow', default: sl, min: 3, max: 400 }],
  (s, p) => {
    if (s.length < 4) return insufficient(4);
    const spread = ((sma(s, Math.round(p.fast ?? f)) - sma(s, Math.round(p.slow ?? sl))) / s[s.length - 1]) * 100;
    return { value: Number(spread.toFixed(4)), verdict: verdictFrom(spread, 0.02, -0.02), detail: `SMA${f}−SMA${sl} = ${spread.toFixed(3)}%` };
  },
));

// ── Rate of change / momentum ──
[3, 5, 8, 13, 21, 34, 55].forEach((n) => add(
  `roc_${n}`, `ROC ${n}`, `Rate of change across ${n} live samples.`, 'emerald', 4, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, (p.window ?? n) + 1);
    if (w.length < 2) return insufficient(2);
    const roc = ((w[w.length - 1] - w[0]) / w[0]) * 100;
    return { value: Number(roc.toFixed(4)), verdict: verdictFrom(roc, 0.05, -0.05), detail: `${roc.toFixed(3)}% over ${w.length - 1} samples` };
  },
));

// ── Stochastic oscillator ──
[7, 14, 21].forEach((n) => add(
  `stoch_${n}`, `STOCHASTIC ${n}`, `Position in the ${n}-sample high/low range.`, 'fuchsia', 5, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 3) return insufficient(3);
    const hi = Math.max(...w); const lo = Math.min(...w);
    const k = hi > lo ? ((w[w.length - 1] - lo) / (hi - lo)) * 100 : 50;
    return { value: Number(k.toFixed(2)), verdict: k >= 80 ? 'bearish' : k <= 20 ? 'bullish' : 'neutral', detail: `%K = ${k.toFixed(1)}` };
  },
));

// ── Williams %R ──
[7, 14, 28].forEach((n) => add(
  `willr_${n}`, `WILLIAMS %R ${n}`, `Inverted range position over ${n} samples.`, 'indigo', 5, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 3) return insufficient(3);
    const hi = Math.max(...w); const lo = Math.min(...w);
    const r = hi > lo ? ((hi - w[w.length - 1]) / (hi - lo)) * -100 : -50;
    return { value: Number(r.toFixed(2)), verdict: r <= -80 ? 'bullish' : r >= -20 ? 'bearish' : 'neutral', detail: `%R = ${r.toFixed(1)}` };
  },
));

// ── CCI ──
[14, 20, 40].forEach((n) => add(
  `cci_${n}`, `CCI ${n}`, `Commodity channel deviation over ${n} samples.`, 'amber', 6, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 4) return insufficient(4);
    const m = mean(w);
    const md = mean(w.map((v) => Math.abs(v - m)));
    const cci = md > 0 ? (w[w.length - 1] - m) / (0.015 * md) : 0;
    return { value: Number(cci.toFixed(1)), verdict: cci > 100 ? 'bearish' : cci < -100 ? 'bullish' : 'neutral', detail: `CCI = ${cci.toFixed(0)}` };
  },
));

// ── ATR proxy / range studies ──
[7, 14, 21, 50].forEach((n) => add(
  `atr_${n}`, `ATR ${n}`, `Average true range proxy over ${n} samples.`, 'orange', 5, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 3) return insufficient(3);
    const tr = w.slice(1).map((v, i) => Math.abs(v - w[i]));
    const atrPct = (mean(tr) / w[w.length - 1]) * 100;
    return { value: Number(atrPct.toFixed(4)), verdict: 'neutral', detail: `ATR ≈ ${atrPct.toFixed(3)}% per sample` };
  },
));

// ── Donchian breakout ──
[10, 20, 55].forEach((n) => add(
  `donchian_${n}`, `DONCHIAN ${n}`, `Breakout state of the ${n}-sample channel.`, 'emerald', 5, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 4) return insufficient(4);
    const hi = Math.max(...w.slice(0, -1)); const lo = Math.min(...w.slice(0, -1));
    const l = w[w.length - 1];
    const pos = hi > lo ? (l - lo) / (hi - lo) : 0.5;
    return { value: Number(pos.toFixed(3)), verdict: l > hi ? 'bullish' : l < lo ? 'bearish' : 'neutral', detail: l > hi ? 'upper channel break' : l < lo ? 'lower channel break' : `inside channel (${(pos * 100).toFixed(0)}%)` };
  },
));

// ── Keltner / Bollinger squeezes ──
[10, 20, 40].forEach((n) => add(
  `squeeze_${n}`, `SQUEEZE ${n}`, `Band compression vs the ${n}-sample baseline.`, 'teal', 6, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 5) return insufficient(5);
    const width = (stdev(w) / mean(w)) * 100;
    const base = (stdev(s) / mean(s)) * 100;
    const ratio = base > 0 ? width / base : 1;
    return { value: Number(ratio.toFixed(3)), verdict: ratio < 0.6 ? 'bullish' : 'neutral', detail: ratio < 0.6 ? `compressed (${ratio.toFixed(2)}×) — expansion pending` : `normal width (${ratio.toFixed(2)}×)` };
  },
));

// ── Volatility windows ──
[10, 20, 50, 100].forEach((n) => add(
  `vol_${n}`, `VOLATILITY ${n}`, `Realised dispersion over ${n} samples.`, 'amber', 5, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 3) return insufficient(3);
    const v = stdev(returns(w)) * 100;
    return { value: Number(v.toFixed(4)), verdict: 'neutral', detail: `vol ${v.toFixed(3)}% / sample` };
  },
));

// ── Z-score windows ──
[10, 20, 50, 100, 200].forEach((n) => add(
  `z_${n}`, `Z-SCORE ${n}`, `Stretch from the ${n}-sample mean.`, 'indigo', 5, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 4) return insufficient(4);
    const sd = stdev(w);
    const z = sd > 0 ? (w[w.length - 1] - mean(w)) / sd : 0;
    return { value: Number(z.toFixed(3)), verdict: z > 2 ? 'bearish' : z < -2 ? 'bullish' : 'neutral', detail: `z = ${z.toFixed(2)}` };
  },
));

// ── Sharpe / Sortino / Calmar windows ──
[20, 50, 100].forEach((n) => add(
  `sharpe_${n}`, `SHARPE ${n}`, `Risk-adjusted drift on ${n} samples.`, 'gold', 6, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 4) return insufficient(4);
    const r = returns(w); const sd = stdev(r);
    const v = sd > 0 ? mean(r) / sd : 0;
    return { value: Number(v.toFixed(3)), verdict: verdictFrom(v, 0.3, -0.3), detail: `sharpe ${v.toFixed(2)}` };
  },
));
[20, 50, 100].forEach((n) => add(
  `sortino_${n}`, `SORTINO ${n}`, `Downside-only risk-adjusted drift.`, 'gold', 6, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 4) return insufficient(4);
    const r = returns(w);
    const down = r.filter((x) => x < 0);
    const dd = down.length ? Math.sqrt(mean(down.map((x) => x * x))) : 0;
    const v = dd > 0 ? mean(r) / dd : mean(r) > 0 ? 1 : 0;
    return { value: Number(v.toFixed(3)), verdict: verdictFrom(v, 0.3, -0.3), detail: `sortino ${v.toFixed(2)}` };
  },
));
[30, 60].forEach((n) => add(
  `calmar_${n}`, `CALMAR ${n}`, `Drift over max drawdown across ${n} samples.`, 'gold', 8, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 6) return insufficient(6);
    let peak = w[0]; let mdd = 0;
    w.forEach((v) => { peak = Math.max(peak, v); mdd = Math.min(mdd, (v - peak) / peak); });
    const drift = (w[w.length - 1] - w[0]) / w[0];
    const v = mdd < 0 ? drift / Math.abs(mdd) : drift > 0 ? 3 : 0;
    return { value: Number(v.toFixed(3)), verdict: verdictFrom(v, 0.5, -0.5), detail: `calmar ${v.toFixed(2)} (mdd ${(mdd * 100).toFixed(2)}%)` };
  },
));

// ── Tail risk ──
[50, 100].forEach((n) => add(
  `var95_${n}`, `VALUE AT RISK ${n}`, `95% one-sample loss estimate.`, 'red', 8, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 8) return insufficient(8);
    const r = returns(w).sort((a, b) => a - b);
    const v = r[Math.floor(r.length * 0.05)] * 100;
    return { value: Number(v.toFixed(4)), verdict: v < -1 ? 'bearish' : 'neutral', detail: `VaR95 ${v.toFixed(3)}%` };
  },
));
[50, 100].forEach((n) => add(
  `cvar95_${n}`, `CVAR ${n}`, `Expected shortfall beyond the 95% tail.`, 'red', 8, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 8) return insufficient(8);
    const r = returns(w).sort((a, b) => a - b);
    const tail = r.slice(0, Math.max(1, Math.floor(r.length * 0.05)));
    const v = mean(tail) * 100;
    return { value: Number(v.toFixed(4)), verdict: v < -1.5 ? 'bearish' : 'neutral', detail: `CVaR95 ${v.toFixed(3)}%` };
  },
));

// ── Distribution shape ──
[30, 60].forEach((n) => add(
  `skew_${n}`, `SKEW ${n}`, `Return asymmetry over ${n} samples.`, 'violet', 8, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 6) return insufficient(6);
    const r = returns(w); const m = mean(r); const sd = stdev(r);
    const v = sd > 0 ? mean(r.map((x) => ((x - m) / sd) ** 3)) : 0;
    return { value: Number(v.toFixed(3)), verdict: verdictFrom(v, 0.5, -0.5), detail: `skew ${v.toFixed(2)}` };
  },
));
[30, 60].forEach((n) => add(
  `kurtosis_${n}`, `KURTOSIS ${n}`, `Fat-tail intensity over ${n} samples.`, 'violet', 8, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 6) return insufficient(6);
    const r = returns(w); const m = mean(r); const sd = stdev(r);
    const v = sd > 0 ? mean(r.map((x) => ((x - m) / sd) ** 4)) - 3 : 0;
    return { value: Number(v.toFixed(3)), verdict: 'neutral', detail: `excess kurtosis ${v.toFixed(2)}` };
  },
));

// ── Structure & persistence ──
[20, 50, 100].forEach((n) => add(
  `hurst_${n}`, `HURST ${n}`, `Trend persistence vs mean reversion.`, 'teal', 10, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 8) return insufficient(8);
    const r = returns(w); const m = mean(r);
    const dev = r.map((_, i) => r.slice(0, i + 1).reduce((a, b) => a + (b - m), 0));
    const R = Math.max(...dev) - Math.min(...dev);
    const S = stdev(r);
    const h = S > 0 && R > 0 ? Math.log(R / S) / Math.log(r.length) : 0.5;
    return { value: Number(h.toFixed(3)), verdict: h > 0.55 ? 'bullish' : h < 0.45 ? 'bearish' : 'neutral', detail: h > 0.55 ? `persistent trend (H=${h.toFixed(2)})` : h < 0.45 ? `mean reverting (H=${h.toFixed(2)})` : `random walk (H=${h.toFixed(2)})` };
  },
));
[10, 30].forEach((n) => add(
  `autocorr_${n}`, `AUTOCORRELATION ${n}`, `Lag-1 return correlation over ${n} samples.`, 'indigo', 8, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 6) return insufficient(6);
    const r = returns(w); const m = mean(r);
    const num = r.slice(1).reduce((a, v, i) => a + (v - m) * (r[i] - m), 0);
    const den = r.reduce((a, v) => a + (v - m) ** 2, 0);
    const v = den > 0 ? num / den : 0;
    return { value: Number(v.toFixed(3)), verdict: verdictFrom(v, 0.2, -0.2), detail: `ρ1 = ${v.toFixed(2)}` };
  },
));
[20, 50].forEach((n) => add(
  `efficiency_${n}`, `EFFICIENCY ${n}`, `Net move over path length — trend quality.`, 'emerald', 6, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 4) return insufficient(4);
    const net = w[w.length - 1] - w[0];
    const path = w.slice(1).reduce((a, v, i) => a + Math.abs(v - w[i]), 0);
    const eff = path > 0 ? net / path : 0;
    return { value: Number(eff.toFixed(3)), verdict: verdictFrom(eff, 0.3, -0.3), detail: `efficiency ${eff.toFixed(2)}` };
  },
));
[14, 30].forEach((n) => add(
  `choppiness_${n}`, `CHOPPINESS ${n}`, `Range-bound intensity index.`, 'slate', 6, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 4) return insufficient(4);
    const path = w.slice(1).reduce((a, v, i) => a + Math.abs(v - w[i]), 0);
    const range = Math.max(...w) - Math.min(...w);
    const ci = range > 0 && path > 0 ? (100 * Math.log10(path / range)) / Math.log10(w.length) : 50;
    return { value: Number(ci.toFixed(2)), verdict: 'neutral', detail: ci > 60 ? `choppy (${ci.toFixed(0)})` : `directional (${ci.toFixed(0)})` };
  },
));

// ── Drawdown / recovery ──
[20, 60, 120].forEach((n) => add(
  `maxdd_${n}`, `MAX DRAWDOWN ${n}`, `Worst peak-to-trough over ${n} samples.`, 'rose', 6, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 4) return insufficient(4);
    let peak = w[0]; let mdd = 0;
    w.forEach((v) => { peak = Math.max(peak, v); mdd = Math.min(mdd, ((v - peak) / peak) * 100); });
    return { value: Number(mdd.toFixed(3)), verdict: mdd < -5 ? 'bearish' : 'neutral', detail: `max drawdown ${mdd.toFixed(2)}%` };
  },
));
[20, 60].forEach((n) => add(
  `recovery_${n}`, `RECOVERY ${n}`, `Rebound from the ${n}-sample low.`, 'emerald', 6, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 4) return insufficient(4);
    const lo = Math.min(...w);
    const v = lo > 0 ? ((w[w.length - 1] - lo) / lo) * 100 : 0;
    return { value: Number(v.toFixed(3)), verdict: verdictFrom(v, 0.5, -0.5), detail: `${v.toFixed(2)}% off window low` };
  },
));

// ── Streaks & tape ──
[5, 10, 20].forEach((n) => add(
  `streak_${n}`, `STREAK ${n}`, `Directional print balance over ${n} samples.`, 'sky', 5, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 3) return insufficient(3);
    const r = returns(w);
    const up = r.filter((v) => v > 0).length;
    const bal = (up / r.length) * 2 - 1;
    return { value: Number(bal.toFixed(3)), verdict: verdictFrom(bal, 0.3, -0.3), detail: `${up}/${r.length} up prints` };
  },
));
[10, 30].forEach((n) => add(
  `imbalance_${n}`, `TAPE IMBALANCE ${n}`, `Weight of up moves vs down moves.`, 'cyan', 5, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 3) return insufficient(3);
    const r = returns(w);
    const up = r.filter((v) => v > 0).reduce((a, b) => a + b, 0);
    const dn = Math.abs(r.filter((v) => v < 0).reduce((a, b) => a + b, 0));
    const v = up + dn > 0 ? (up - dn) / (up + dn) : 0;
    return { value: Number(v.toFixed(3)), verdict: verdictFrom(v, 0.2, -0.2), detail: `imbalance ${(v * 100).toFixed(0)}%` };
  },
));

// ── Range position / pivots ──
[20, 50, 100].forEach((n) => add(
  `rangepos_${n}`, `RANGE POSITION ${n}`, `Where price sits in the ${n}-sample range.`, 'gold', 5, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 3) return insufficient(3);
    const hi = Math.max(...w); const lo = Math.min(...w);
    const pos = hi > lo ? (w[w.length - 1] - lo) / (hi - lo) : 0.5;
    return { value: Number(pos.toFixed(3)), verdict: pos > 0.85 ? 'bearish' : pos < 0.15 ? 'bullish' : 'neutral', detail: `${(pos * 100).toFixed(0)}% of range` };
  },
));
[20, 50].forEach((n) => add(
  `pivot_${n}`, `PIVOT LEVELS ${n}`, `Classic pivot vs live price.`, 'amber', 5, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 3) return insufficient(3);
    const hi = Math.max(...w); const lo = Math.min(...w); const c = w[w.length - 1];
    const pivot = (hi + lo + c) / 3;
    const dist = ((c - pivot) / pivot) * 100;
    return { value: Number(dist.toFixed(4)), verdict: verdictFrom(dist, 0.05, -0.05), detail: `${dist.toFixed(3)}% vs pivot ${pivot.toFixed(4)}` };
  },
));
[20, 50].forEach((n) => add(
  `vwapdrift_${n}`, `VWAP DRIFT ${n}`, `Distance from the sample-average price.`, 'teal', 5, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 3) return insufficient(3);
    const avg = mean(w);
    const d = ((w[w.length - 1] - avg) / avg) * 100;
    return { value: Number(d.toFixed(4)), verdict: d > 0.3 ? 'bearish' : d < -0.3 ? 'bullish' : 'neutral', detail: `${d.toFixed(3)}% vs VWAP proxy` };
  },
));

// ── TRIX / Ulcer / gap ──
[9, 15].forEach((n) => add(
  `trix_${n}`, `TRIX ${n}`, `Triple-smoothed momentum.`, 'violet', 8, [WINDOW(n)],
  (s, p) => {
    if (s.length < 6) return insufficient(6);
    const k = Math.round(p.window ?? n);
    const e1 = ema(s, k); const e2 = ema(s.map(() => e1), k);
    const trix = ((e1 - e2) / (e2 || 1)) * 100 + ((s[s.length - 1] - e1) / e1) * 100;
    return { value: Number(trix.toFixed(4)), verdict: verdictFrom(trix, 0.05, -0.05), detail: `TRIX ${trix.toFixed(3)}%` };
  },
));
[14, 30].forEach((n) => add(
  `ulcer_${n}`, `ULCER INDEX ${n}`, `Depth and duration of pain in the window.`, 'red', 8, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, p.window ?? n);
    if (w.length < 5) return insufficient(5);
    let peak = w[0];
    const dd = w.map((v) => { peak = Math.max(peak, v); return (((v - peak) / peak) * 100) ** 2; });
    const ui = Math.sqrt(mean(dd));
    return { value: Number(ui.toFixed(3)), verdict: ui > 3 ? 'bearish' : 'neutral', detail: `ulcer ${ui.toFixed(2)}` };
  },
));
[3, 5].forEach((n) => add(
  `gap_${n}`, `GAP SCAN ${n}`, `Sudden dislocation across ${n} samples.`, 'orange', 4, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, (p.window ?? n) + 1);
    if (w.length < 2) return insufficient(2);
    const g = ((w[w.length - 1] - w[0]) / w[0]) * 100;
    return { value: Number(g.toFixed(4)), verdict: Math.abs(g) > 0.5 ? (g > 0 ? 'bullish' : 'bearish') : 'neutral', detail: `${g.toFixed(3)}% dislocation` };
  },
));

// ── Range breakout (SIP-VB entry engine) ──
// Compares the latest print with the high/low of the PRIOR window: a close
// beyond the range is the breakout signal; value = % travelled beyond it.
[15, 30, 60].forEach((n) => add(
  `breakout_${n}`, `BREAKOUT ${n}`, `Break of the prior ${n}-sample range (opening/rolling range).`, 'rose', n + 2, [WINDOW(n)],
  (s, p) => {
    const w = wnd(s, (p.window ?? n) + 1);
    if (w.length < 6) return insufficient(6);
    const prior = w.slice(0, -1);
    const last = w[w.length - 1];
    const hi = Math.max(...prior);
    const lo = Math.min(...prior);
    const widthPct = lo > 0 ? ((hi - lo) / lo) * 100 : 0;
    if (last > hi) {
      const beyond = ((last - hi) / hi) * 100;
      return { value: Number(beyond.toFixed(4)), verdict: 'bullish', detail: `broke range high by ${beyond.toFixed(3)}% · range width ${widthPct.toFixed(2)}%` };
    }
    if (last < lo) {
      const beyond = ((lo - last) / lo) * 100;
      return { value: Number((-beyond).toFixed(4)), verdict: 'bearish', detail: `broke range low by ${beyond.toFixed(3)}% · range width ${widthPct.toFixed(2)}%` };
    }
    const pos = hi > lo ? ((last - lo) / (hi - lo)) * 100 : 50;
    return { value: Number(pos.toFixed(2)), verdict: 'neutral', detail: `inside range (${pos.toFixed(0)}% of range) · width ${widthPct.toFixed(2)}%` };
  },
));

// ── Sizing helpers ──
[0.25, 0.5, 1].forEach((f) => add(
  `kelly_${String(f).replace('.', '')}`, `KELLY ${f === 1 ? 'FULL' : `${f * 100}%`}`, `Kelly exposure at ${f * 100}% fraction.`, 'gold', 6,
  [{ key: 'fraction', label: 'Fraction', default: f, min: 0.1, max: 1, step: 0.05 }],
  (s, p) => {
    if (s.length < 4) return insufficient(4);
    const r = returns(s); const v = stdev(r) ** 2;
    const kelly = v > 0 ? (mean(r) / v) * (p.fraction ?? f) : 0;
    const capped = Math.max(-1, Math.min(1, kelly));
    return { value: Number(capped.toFixed(3)), verdict: verdictFrom(capped, 0, 0), detail: `exposure ${(capped * 100).toFixed(1)}% of budget` };
  },
));
[1, 2, 3].forEach((r) => add(
  `rr_${r}`, `R:R TARGET ${r}:1`, `Take-profit / stop distances at ${r}:1 on live volatility.`, 'emerald', 5,
  [{ key: 'atrMult', label: 'ATR mult', default: 1, min: 0.25, max: 5, step: 0.25 }],
  (s, p) => {
    if (s.length < 3) return insufficient(3);
    const tr = returns(s).map(Math.abs);
    const atr = mean(tr) * 100 * (p.atrMult ?? 1);
    return { value: Number((atr * r).toFixed(4)), verdict: 'neutral', detail: `stop ${atr.toFixed(3)}% · target ${(atr * r).toFixed(3)}%` };
  },
));

// ── Precision entries (fewer false breaks, better fills) ──
// BREAKOUT CONFIRM: a break only counts if price broke the prior range a few
// samples ago AND still holds beyond it with the short drift agreeing —
// filters the one-print pokes that fade straight back inside.
add(
  'breakout_confirm', 'BREAKOUT CONFIRM', 'A range break that HELD for several samples with drift agreeing — precision entry filter.', 'rose', 20,
  [{ key: 'window', label: 'Range window', default: 30, min: 8, max: 120 }, { key: 'hold', label: 'Hold samples', default: 3, min: 2, max: 8 }],
  (s, p) => {
    const w = wnd(s, (p.window ?? 30) + (p.hold ?? 3) + 1);
    const hold = Math.max(2, p.hold ?? 3);
    if (w.length < hold + 8) return insufficient(hold + 8);
    const last = w[w.length - 1];
    const breakPoint = w[w.length - 1 - hold];
    const prior = w.slice(0, w.length - 1 - hold);
    const hi = Math.max(...prior); const lo = Math.min(...prior);
    const heldAbove = w.slice(-hold).every((v) => v > hi);
    const heldBelow = w.slice(-hold).every((v) => v < lo);
    const drift = ((last - w[w.length - 4]) / w[w.length - 4]) * 100;
    if (breakPoint > hi && heldAbove && drift >= 0) {
      const beyond = ((last - hi) / hi) * 100;
      return { value: Number(beyond.toFixed(4)), verdict: 'bullish', detail: `break held ${hold} samples · ${beyond.toFixed(3)}% beyond the high · drift ${drift.toFixed(3)}%` };
    }
    if (breakPoint < lo && heldBelow && drift <= 0) {
      const beyond = ((lo - last) / lo) * 100;
      return { value: Number((-beyond).toFixed(4)), verdict: 'bearish', detail: `breakdown held ${hold} samples · ${beyond.toFixed(3)}% beyond the low · drift ${drift.toFixed(3)}%` };
    }
    return { value: 0, verdict: 'neutral', detail: 'no held break — pokes beyond the range do not count' };
  },
);
// PULLBACK ENTRY: after a real break above the range, the first orderly dip
// that holds ABOVE the broken level is the higher-quality entry.
add(
  'pullback_entry', 'PULLBACK ENTRY', 'Post-breakout dip that holds above the broken range — buy the retest, not the chase.', 'emerald', 24,
  [{ key: 'window', label: 'Range window', default: 30, min: 10, max: 120 }],
  (s, p) => {
    const w = wnd(s, (p.window ?? 30) + 12);
    if (w.length < 16) return insufficient(16);
    const prior = w.slice(0, -12);
    const hi = Math.max(...prior);
    const recent = w.slice(-12);
    const last = w[w.length - 1];
    const peak = Math.max(...recent);
    const brokeOut = peak > hi;
    const dipPct = peak > 0 ? ((peak - last) / peak) * 100 : 0;
    const holdsAbove = last > hi;
    if (brokeOut && holdsAbove && dipPct >= 0.15 && dipPct <= 0.7) {
      return { value: Number(dipPct.toFixed(4)), verdict: 'bullish', detail: `retest holding ${( ((last - hi) / hi) * 100).toFixed(3)}% above the broken high after a ${dipPct.toFixed(2)}% dip` };
    }
    return { value: 0, verdict: 'neutral', detail: brokeOut ? (holdsAbove ? `dip ${dipPct.toFixed(2)}% — outside the 0.15–0.70% retest band` : 'retest failed — back inside the range') : 'no breakout to retest yet' };
  },
);

export const ANALYSIS_PROGRAMS: AnalysisProgram[] = [...BASE_PROGRAMS, ...GENERATED];

export const PROGRAM_BY_ID = new Map(ANALYSIS_PROGRAMS.map((p) => [p.id, p]));

export const defaultParamsFor = (id: string): Record<string, number> => {
  const p = PROGRAM_BY_ID.get(id);
  if (!p) return {};
  return Object.fromEntries(p.params.map((x) => [x.key, x.default]));
};