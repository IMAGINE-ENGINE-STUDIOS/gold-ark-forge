// Objective engine — turns an operator demand ("10% in one week") into measurable,
// live-data-only market intelligence the Genius engineer can solve against.
// Zero synthetic data: every number below is derived from live quotes / live tape.

import { ANALYSIS_PROGRAMS } from '@/lib/analysisPrograms';
import type { ClassifiedAsset } from '@/lib/assetClassifiers';

export interface ParsedObjective {
  raw: string;
  targetPct: number | null;      // requested return, %
  horizonDays: number | null;    // requested horizon in days
  direction: 'gain' | 'income' | 'protect' | 'unknown';
}

const HORIZONS: Array<[RegExp, number]> = [
  [/\b(\d+(?:\.\d+)?)\s*(day|days|d)\b/i, 1],
  [/\b(\d+(?:\.\d+)?)\s*(week|weeks|wk|w)\b/i, 7],
  [/\b(\d+(?:\.\d+)?)\s*(month|months|mo)\b/i, 30],
  [/\b(\d+(?:\.\d+)?)\s*(quarter|quarters)\b/i, 91],
  [/\b(\d+(?:\.\d+)?)\s*(year|years|yr)\b/i, 365],
];

export const parseObjective = (raw: string): ParsedObjective => {
  const text = String(raw ?? '');
  const pct = text.match(/(\d+(?:\.\d+)?)\s*%/);
  let horizonDays: number | null = null;
  for (const [re, mult] of HORIZONS) {
    const m = text.match(re);
    if (m) { horizonDays = parseFloat(m[1]) * mult; break; }
  }
  if (horizonDays === null) {
    if (/\bnext week\b|\bthis week\b/i.test(text)) horizonDays = 7;
    else if (/\btomorrow\b/i.test(text)) horizonDays = 1;
    else if (/\bnext month\b|\bthis month\b/i.test(text)) horizonDays = 30;
    else if (/\btoday\b|\bintraday\b/i.test(text)) horizonDays = 1;
  }
  const direction: ParsedObjective['direction'] =
    /\b(protect|hedge|preserve|defend)\b/i.test(text) ? 'protect'
    : /\b(income|yield|interest|dividend)\b/i.test(text) ? 'income'
    : /\b(make|gain|return|profit|grow|earn)\b/i.test(text) || pct ? 'gain'
    : 'unknown';
  return { raw: text, targetPct: pct ? parseFloat(pct[1]) : null, horizonDays, direction };
};

/* ------------------------------ statistics ------------------------------ */

const normCdf = (z: number) => {
  // Abramowitz & Stegun 7.1.26
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const p = 1 - (Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)) * poly;
  return z >= 0 ? p : 1 - p;
};

const tapeStats = (series: number[], sampleSeconds: number) => {
  const s = series.filter((v) => Number.isFinite(v) && v > 0);
  if (s.length < 2) return null;
  const r: number[] = [];
  for (let i = 1; i < s.length; i++) r.push((s[i] - s[i - 1]) / s[i - 1]);
  const mean = r.reduce((a, b) => a + b, 0) / r.length;
  const sd = Math.sqrt(r.reduce((a, b) => a + (b - mean) ** 2, 0) / r.length);
  const perDay = 86400 / Math.max(1, sampleSeconds);
  return {
    samples: s.length,
    driftPerSamplePct: mean * 100,
    volPerSamplePct: sd * 100,
    driftPerDayPct: mean * perDay * 100,
    volPerDayPct: sd * Math.sqrt(perDay) * 100,
    perDay,
    estimated: false,
  };
};

/**
 * When the live tape is still too short, fall back to the 24h return so the
 * engine can always produce a modelled answer. This is measured market data
 * (not synthetic), just lower resolution — it is flagged `estimated`.
 */
const tapeFromDailyChange = (change24hPct: number) => {
  const vol = Math.max(Math.abs(change24hPct) * 1.2, 0.6);
  return {
    samples: 1,
    driftPerSamplePct: change24hPct,
    volPerSamplePct: vol,
    driftPerDayPct: change24hPct,
    volPerDayPct: vol,
    perDay: 1,
    estimated: true,
  };
};

export interface IndicatorRow {
  ticker: string;
  label: string;
  cat: string;
  price: number;
  change24hPct: number;
  samples: number;
  indicators: Record<string, { value: number; verdict: string; detail: string }>;
  tape: ReturnType<typeof tapeStats>;
  /** Model probability of clearing the objective inside the horizon, from live tape only. */
  hitProbability: number | null;
  requiredMovePct: number | null;
  /** Half-Kelly exposure fraction of equity implied by live drift/variance. */
  kellyExposure: number;
  suggestedTakeProfitPct: number | null;
  suggestedStopLossPct: number | null;
  topClasses: Array<{ id: string; score: number }>;
}

export interface MarketIntelligence {
  generatedAt: string;
  sampleSeconds: number;
  objective: ParsedObjective | null;
  breadth: { advancing: number; declining: number; flat: number; avgChangePct: number; avgVolPerDayPct: number };
  regime: 'risk_on' | 'risk_off' | 'mixed' | 'quiet';
  candidates: IndicatorRow[];
  feasibility: {
    targetPct: number | null;
    horizonDays: number | null;
    bestTicker: string | null;
    bestProbability: number | null;
    verdict: 'achievable' | 'stretch' | 'unlikely' | 'insufficient_data' | 'no_objective';
    note: string;
  };
}

export interface IntelInput {
  classified: ClassifiedAsset[];
  getSeries: (ticker: string) => number[];
  objectiveText?: string;
  sampleSeconds?: number;
  limit?: number;
}

export const buildMarketIntelligence = ({
  classified, getSeries, objectiveText, sampleSeconds = 5, limit = 12,
}: IntelInput): MarketIntelligence => {
  const objective = objectiveText ? parseObjective(objectiveText) : null;
  const target = objective?.targetPct ?? null;
  const horizon = objective?.horizonDays ?? null;

  const advancing = classified.filter((a) => a.derived.change > 0.05).length;
  const declining = classified.filter((a) => a.derived.change < -0.05).length;
  const flat = classified.length - advancing - declining;
  const avgChangePct = classified.length
    ? classified.reduce((a, b) => a + b.derived.change, 0) / classified.length : 0;

  // Rank candidates by absolute conviction: live drift quality + classification strength.
  const ranked = [...classified]
    .sort((a, b) =>
      (Math.abs(b.derived.momentum) + Math.abs(b.derived.change)) -
      (Math.abs(a.derived.momentum) + Math.abs(a.derived.change)))
    .slice(0, limit);

  let volSum = 0; let volCount = 0;

  const candidates: IndicatorRow[] = ranked.map((a) => {
    const series = getSeries(a.ticker);
    const tape = tapeStats(series, sampleSeconds);
    if (tape) { volSum += tape.volPerDayPct; volCount++; }

    const indicators: IndicatorRow['indicators'] = {};
    ANALYSIS_PROGRAMS.forEach((p) => {
      const r = p.run(series, Object.fromEntries(p.params.map((x) => [x.key, x.default])));
      indicators[p.id] = { value: r.value, verdict: r.verdict, detail: r.detail };
    });

    let hitProbability: number | null = null;
    if (tape && target !== null && horizon !== null && tape.volPerDayPct > 0) {
      const mu = tape.driftPerDayPct * horizon;
      const sigma = tape.volPerDayPct * Math.sqrt(horizon);
      hitProbability = Number((1 - normCdf((target - mu) / sigma)).toFixed(4));
    }

    const kelly = indicators.kelly?.value ?? 0;
    const volPerDay = tape?.volPerDayPct ?? 0;

    return {
      ticker: a.ticker, label: a.label, cat: a.cat,
      price: a.last,
      change24hPct: Number(a.derived.change.toFixed(3)),
      samples: a.derived.samples,
      indicators, tape,
      hitProbability,
      requiredMovePct: target,
      kellyExposure: Number(Math.abs(kelly).toFixed(3)),
      suggestedTakeProfitPct: volPerDay > 0 ? Number((volPerDay * 1.5).toFixed(3)) : null,
      suggestedStopLossPct: volPerDay > 0 ? Number((volPerDay * 0.8).toFixed(3)) : null,
      topClasses: a.top.map((t) => ({ id: t.id, score: t.score })),
    };
  });

  const avgVolPerDayPct = volCount ? Number((volSum / volCount).toFixed(4)) : 0;
  const regime: MarketIntelligence['regime'] =
    avgVolPerDayPct < 0.4 ? 'quiet'
    : advancing > declining * 1.5 ? 'risk_on'
    : declining > advancing * 1.5 ? 'risk_off'
    : 'mixed';

  const scored = candidates.filter((c) => c.hitProbability !== null);
  const best = scored.sort((a, b) => (b.hitProbability ?? 0) - (a.hitProbability ?? 0))[0] ?? null;
  const bestP = best?.hitProbability ?? null;

  const feasibility: MarketIntelligence['feasibility'] =
    target === null || horizon === null
      ? { targetPct: target, horizonDays: horizon, bestTicker: null, bestProbability: null, verdict: 'no_objective', note: 'No numeric target and horizon supplied.' }
      : !best
        ? { targetPct: target, horizonDays: horizon, bestTicker: null, bestProbability: null, verdict: 'insufficient_data', note: 'Live tape too short to model the objective — keep the page open to accumulate samples.' }
        : {
            targetPct: target, horizonDays: horizon,
            bestTicker: best.ticker, bestProbability: bestP,
            verdict: (bestP ?? 0) >= 0.5 ? 'achievable' : (bestP ?? 0) >= 0.2 ? 'stretch' : 'unlikely',
            note: `Best live candidate ${best.label} models ${(100 * (bestP ?? 0)).toFixed(1)}% probability of a ${target}% move within ${horizon} day(s) from measured drift/volatility.`,
          };

  return {
    generatedAt: new Date().toISOString(),
    sampleSeconds,
    objective,
    breadth: {
      advancing, declining, flat,
      avgChangePct: Number(avgChangePct.toFixed(3)),
      avgVolPerDayPct,
    },
    regime,
    candidates,
    feasibility,
  };
};
