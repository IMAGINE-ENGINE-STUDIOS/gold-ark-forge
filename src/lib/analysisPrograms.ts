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

export const ANALYSIS_PROGRAMS: AnalysisProgram[] = [
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

export const PROGRAM_BY_ID = new Map(ANALYSIS_PROGRAMS.map((p) => [p.id, p]));

export const defaultParamsFor = (id: string): Record<string, number> => {
  const p = PROGRAM_BY_ID.get(id);
  if (!p) return {};
  return Object.fromEntries(p.params.map((x) => [x.key, x.default]));
};