/**
 * Forecast Log — localStorage-based registry of forecast predictions.
 * Each entry records the symbol, timeframe, bias, projected direction,
 * timestamp, and indicator snapshot at the time of projection.
 */

export interface ForecastLogEntry {
  id: string;
  timestamp: string;
  symbol: string;
  category: string;
  timeframe: string;
  currentPrice: number;
  projectedPrice: number;
  bias: number; // -1 to 1
  direction: 'bullish' | 'bearish' | 'neutral';
  angle: number; // degrees, -90 to 90
  color: string; // HSL color from rainbow
  indicators: {
    rsi: number;
    sma20: number;
    ema20: number;
    macdCross: string;
    atr: number;
  };
}

const STORAGE_KEY = 'ga-forecast-log';
const MAX_ENTRIES = 200;

export const getForecastLog = (): ForecastLogEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addForecastLogEntry = (entry: Omit<ForecastLogEntry, 'id'>): ForecastLogEntry => {
  const full: ForecastLogEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
  const log = getForecastLog();
  log.unshift(full);
  if (log.length > MAX_ENTRIES) log.length = MAX_ENTRIES;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  return full;
};

export const clearForecastLog = () => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Maps a bias value (-1 to 1) to a rainbow HSL color.
 * -1 (strong bearish) = red (0°)
 * -0.5 = orange (30°)
 * 0 (neutral) = yellow (60°)
 * 0.5 = green (120°)
 * 1 (strong bullish) = cyan/teal (180°)
 * Full rainbow spectrum based on directional angle.
 */
export const biasToRainbowColor = (bias: number): string => {
  // Map bias from [-1, 1] to hue [0, 180]
  // -1 = 0 (red), 0 = 60 (yellow), 1 = 140 (green)
  const clamped = Math.max(-1, Math.min(1, bias));
  const hue = Math.round(((clamped + 1) / 2) * 140);
  return `hsl(${hue}, 80%, 55%)`;
};

export const biasToAngle = (bias: number): number => {
  return Math.round(bias * 45); // -45° to +45°
};
