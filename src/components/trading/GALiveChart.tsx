/**
 * Gold Arrow LIVE — Swap Terminal Chart
 * Based on the clean GALiveStandalone widget with prop interface
 * for symbol sync with the Swap terminal panel.
 */
import { useState, useMemo, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { useChartZoom } from '@/hooks/useChartZoom';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Customized } from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, Wifi, Search, X, CandlestickChart, LineChart, BarChart2, MoreHorizontal, Crosshair } from 'lucide-react';
import { addForecastLogEntry, biasToRainbowColor, biasToAngle } from '@/lib/forecastLog';
import { computeApexForecast, getApexStats, type ApexForecastPoint } from '@/lib/apexForecast';
import LivePulse from '@/components/ga-widgets/LivePulse';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useOilGasPrices } from '@/hooks/useOilGasData';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWebSocketPrices, useSimulatedStream } from '@/hooks/useWebSocketPrices';
import { SYNTHETIC_PRICES, CATEGORY_COLORS, ALL_SYMBOLS, WATCHLIST_CATEGORIES, type WatchlistSymbol } from '@/data/tradingSymbols';
import {
  IndicatorToggleBar,
  enrichChartData,
  getIndicatorLines,
  getFibonacciLines,
  hasActiveOscillators,
  OscillatorPanel,
  computeSMA,
  computeEMA,
  computeRSI as computeRSIArray,
  computeATR,
  computeMACD,
  computeBollingerBands,
  type IndicatorKey,
  type ChartDataPoint,
} from './IndicatorOverlay';
import ChartDrawingTools, { useDrawings, getDrawingReferenceLines } from './ChartDrawingTools';
import SymbolLogo from './SymbolLogo';
import { CandlestickLayer, OHLCLayer, type ChartMode } from './CandlestickRenderer';

// ═══ FORECAST ENGINE — Wave Function Simulation ═══════════
interface ForecastPoint {
  time: string;
  forecast: number;
  forecastColor: string;
  forecastHigh?: number;
  forecastLow?: number;
  value?: undefined;
}

// Timeframe-aware projection config: more points for longer timeframes
const FORECAST_DEPTH: Record<string, { points: number; label: string }> = {
  'RT': { points: 12, label: '1 min' },
  '1H': { points: 12, label: '1 hour' },
  '4H': { points: 16, label: '~1.3 hours' },
  '1D': { points: 24, label: '6 hours' },
  '1W': { points: 20, label: '~40 hours' },
  '1M': { points: 30, label: '~7.5 days' },
  '3M': { points: 30, label: '~22 days' },
  '6M': { points: 30, label: '~45 days' },
  '1Y': { points: 36, label: '~3 months' },
  '2Y': { points: 36, label: '~6 months' },
  '5Y': { points: 40, label: '~1 year' },
  'ALL': { points: 48, label: '~2 years' },
};

const computeForecastPoints = (
  values: number[], highs: number[], lows: number[],
  currentPrice: number, intervalMs: number, labelFn: (d: Date) => string, totalPoints: number,
  timeframe: string,
): { points: ForecastPoint[]; bias: number } => {
  if (values.length < 20 || currentPrice <= 0) return { points: [], bias: 0 };

  const rsiArr = computeRSIArray(values);
  const rsi = rsiArr[rsiArr.length - 1] ?? 50;
  const sma20 = computeSMA(values, 20);
  const sma50 = computeSMA(values, 50);
  const ema20 = computeEMA(values, 20);
  const macdData = computeMACD(values);
  const atrArr = computeATR(highs, lows, values);
  const boll = computeBollingerBands(values, 20, 2);

  const latestSMA20 = sma20[sma20.length - 1] ?? currentPrice;
  const latestSMA50 = sma50[sma50.length - 1] ?? currentPrice;
  const latestEMA20 = ema20[ema20.length - 1] ?? currentPrice;
  const latestMACD = macdData.macd[macdData.macd.length - 1] ?? 0;
  const latestSignal = macdData.signal[macdData.signal.length - 1] ?? 0;
  const latestATR = atrArr[atrArr.length - 1] ?? currentPrice * 0.005;
  const latestBollUpper = boll.upper[boll.upper.length - 1] ?? currentPrice;
  const latestBollLower = boll.lower[boll.lower.length - 1] ?? currentPrice;

  // Composite bias from indicators
  const rsiSignal = rsi < 30 ? 0.6 : rsi > 70 ? -0.6 : (50 - rsi) / 100;
  const sma20Signal = (currentPrice - latestSMA20) / latestATR * 0.3;
  const sma50Signal = (currentPrice - latestSMA50) / latestATR * 0.2;
  const emaSignal = (currentPrice - latestEMA20) / latestATR * 0.2;
  const macdSignalVal = isNaN(latestMACD) || isNaN(latestSignal) ? 0 :
    Math.sign(latestMACD - latestSignal) * Math.min(Math.abs(latestMACD - latestSignal) / latestATR, 0.5) * 0.4;
  const bollRange = latestBollUpper - latestBollLower;
  const bollPos = bollRange > 0 ? (currentPrice - latestBollLower) / bollRange : 0.5;
  const bollSignal = (0.5 - bollPos) * 0.3;

  const rawBias = rsiSignal + sma20Signal + sma50Signal + emaSignal + macdSignalVal + bollSignal;
  const bias = Math.max(-1, Math.min(1, rawBias));

  // Detect dominant cycle frequency from recent price oscillations
  const recentN = Math.min(values.length, 40);
  const recentSlice = values.slice(-recentN);
  let crossings = 0;
  const mean = recentSlice.reduce((a, b) => a + b, 0) / recentSlice.length;
  for (let i = 1; i < recentSlice.length; i++) {
    if ((recentSlice[i - 1] - mean) * (recentSlice[i] - mean) < 0) crossings++;
  }
  const cycleFreq = crossings > 0 ? (Math.PI * crossings) / recentN : Math.PI * 0.3;

  // Momentum (slope of last 5 prices)
  const momSlice = values.slice(-5);
  const momentum = momSlice.length >= 2
    ? (momSlice[momSlice.length - 1] - momSlice[0]) / (momSlice.length - 1)
    : 0;

  // Forecast depth per timeframe
  const depth = FORECAST_DEPTH[timeframe] ?? { points: 12 };
  const numPoints = depth.points;
  const points: ForecastPoint[] = [];
  const now = Date.now();

  // Wave simulation: drift + damped sinusoidal oscillation + expanding confidence
  const driftPerStep = (bias * latestATR * 0.08);
  const waveAmplitude = latestATR * 0.3;
  // Phase offset from recent momentum direction
  const phaseOffset = momentum > 0 ? 0 : Math.PI;

  for (let i = 1; i <= numPoints; i++) {
    const t = i / numPoints; // 0→1 progress
    const decay = Math.exp(-t * 0.5); // damping factor

    // Core wave: drift + oscillation
    const driftComponent = driftPerStep * i;
    const waveComponent = waveAmplitude * decay * Math.sin(cycleFreq * i + phaseOffset);
    const momentumComponent = momentum * i * 0.3 * decay;

    const forecastPrice = currentPrice + driftComponent + waveComponent + momentumComponent;

    // Expanding confidence band (widens into the future)
    const bandWidth = latestATR * t * 1.5;
    const forecastHigh = forecastPrice + bandWidth;
    const forecastLow = forecastPrice - bandWidth;

    // Per-segment rainbow color based on local slope
    const prevPrice = i === 1 ? currentPrice :
      currentPrice + driftPerStep * (i - 1) + waveAmplitude * Math.exp(-(i - 1) / numPoints * 0.5) * Math.sin(cycleFreq * (i - 1) + phaseOffset) + momentum * (i - 1) * 0.3 * Math.exp(-(i - 1) / numPoints * 0.5);
    const localSlope = forecastPrice - prevPrice;
    const slopeBias = Math.max(-1, Math.min(1, localSlope / (latestATR * 0.1)));

    const futureTime = new Date(now + i * intervalMs);
    const decimals = currentPrice < 10 ? 4 : 2;

    points.push({
      time: labelFn(futureTime),
      forecast: parseFloat(forecastPrice.toFixed(decimals)),
      forecastHigh: parseFloat(forecastHigh.toFixed(decimals)),
      forecastLow: parseFloat(forecastLow.toFixed(decimals)),
      forecastColor: biasToRainbowColor(slopeBias),
    });
  }

  return { points, bias };
};

// Custom SVG renderer for rainbow-colored forecast wave with confidence band
const ForecastRainbowLine = ({ data, xScale, yScale }: {
  data: any[];
  xScale: (i: number) => number;
  yScale: (v: number) => number;
}) => {
  const forecastIndices: number[] = [];
  data.forEach((d, i) => { if (d.forecast !== undefined) forecastIndices.push(i); });
  if (forecastIndices.length < 2) return null;

  const elements: React.ReactElement[] = [];

  // Confidence band (filled polygon from forecastHigh to forecastLow)
  const bandPoints: string[] = [];
  const bandPointsReverse: string[] = [];
  for (const idx of forecastIndices) {
    const d = data[idx];
    const x = xScale(idx);
    const yH = yScale(d.forecastHigh ?? d.forecast);
    const yL = yScale(d.forecastLow ?? d.forecast);
    if (isNaN(x) || isNaN(yH) || isNaN(yL)) continue;
    bandPoints.push(`${x},${yH}`);
    bandPointsReverse.unshift(`${x},${yL}`);
  }
  if (bandPoints.length > 1) {
    elements.push(
      <polygon
        key="fc-band"
        points={[...bandPoints, ...bandPointsReverse].join(' ')}
        fill="hsl(270, 60%, 50%)"
        fillOpacity={0.08}
        stroke="hsl(270, 60%, 50%)"
        strokeWidth={0.5}
        strokeOpacity={0.15}
        strokeDasharray="4 2"
      />
    );
  }

  // Wave line segments with per-segment rainbow color
  for (let j = 0; j < forecastIndices.length - 1; j++) {
    const i1 = forecastIndices[j];
    const i2 = forecastIndices[j + 1];
    const d1 = data[i1];
    const d2 = data[i2];
    const x1 = xScale(i1);
    const x2 = xScale(i2);
    const y1 = yScale(d1.forecast);
    const y2 = yScale(d2.forecast);
    if (isNaN(x1) || isNaN(x2) || isNaN(y1) || isNaN(y2)) continue;

    // Main line
    elements.push(
      <line key={`fc-${j}`} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={d2.forecastColor || 'hsl(60,80%,55%)'}
        strokeWidth={2.5} strokeLinecap="round" strokeDasharray="6 3" opacity={0.85}
      />
    );
    // Glow
    elements.push(
      <line key={`fc-glow-${j}`} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={d2.forecastColor || 'hsl(60,80%,55%)'}
        strokeWidth={7} strokeLinecap="round" strokeDasharray="6 3" opacity={0.12}
      />
    );
  }

  // Endpoint dot with pulse
  const lastIdx = forecastIndices[forecastIndices.length - 1];
  const lastD = data[lastIdx];
  const lx = xScale(lastIdx);
  const ly = yScale(lastD.forecast);
  if (!isNaN(lx) && !isNaN(ly)) {
    elements.push(
      <circle key="fc-dot-glow" cx={lx} cy={ly} r={8} fill={lastD.forecastColor} opacity={0.2}>
        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite" />
      </circle>
    );
    elements.push(
      <circle key="fc-dot" cx={lx} cy={ly} r={4} fill={lastD.forecastColor} stroke="hsl(213,32%,16%)" strokeWidth={2} />
    );
    // Price label at endpoint
    elements.push(
      <text key="fc-label" x={lx + 8} y={ly + 3} fontSize={9} fill={lastD.forecastColor} fontFamily="monospace" opacity={0.8}>
        ${lastD.forecast?.toFixed(2)}
      </text>
    );
  }

  return <g>{elements}</g>;
};

interface Props {
  symbolKey: string;
  category: string;
  label: string;
  onSymbolChange?: (sym: WatchlistSymbol) => void;
  headerLeftSlot?: ReactNode;
  headerRightSlot?: ReactNode;
}

const shortTimeframes = ['RT', '1H', '4H', '1D', '1W', '1M'] as const;
const longTimeframes = ['3M', '6M', '1Y', '2Y', '5Y', 'ALL'] as const;
const timeframes = [...shortTimeframes, ...longTimeframes] as const;
type Timeframe = (typeof timeframes)[number];

interface TFConfig {
  points: number;
  intervalMs: number;
  candleMs: number;
  volatility: number;
  labelFn: (d: Date) => string;
}

const tfConfigs: Record<Timeframe, TFConfig> = {
  'RT': { points: 60, intervalMs: 5_000, candleMs: 5_000, volatility: 0.0002, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) },
  '1H': { points: 12, intervalMs: 5 * 60_000, candleMs: 5 * 60_000, volatility: 0.0004, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '4H': { points: 48, intervalMs: 5 * 60_000, candleMs: 5 * 60_000, volatility: 0.0005, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '1D': { points: 96, intervalMs: 15 * 60_000, candleMs: 15 * 60_000, volatility: 0.0008, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '1W': { points: 84, intervalMs: 2 * 3_600_000, candleMs: 2 * 3_600_000, volatility: 0.0015, labelFn: (d) => d.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' }) },
  '1M': { points: 120, intervalMs: 6 * 3_600_000, candleMs: 6 * 3_600_000, volatility: 0.003, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
  '3M': { points: 90, intervalMs: 24 * 3_600_000, candleMs: 24 * 3_600_000, volatility: 0.005, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
  '6M': { points: 120, intervalMs: 2 * 24 * 3_600_000, candleMs: 2 * 24 * 3_600_000, volatility: 0.008, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
  '1Y': { points: 120, intervalMs: 3 * 24 * 3_600_000, candleMs: 3 * 24 * 3_600_000, volatility: 0.012, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) },
  '2Y': { points: 120, intervalMs: 6 * 24 * 3_600_000, candleMs: 6 * 24 * 3_600_000, volatility: 0.018, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) },
  '5Y': { points: 150, intervalMs: 12 * 24 * 3_600_000, candleMs: 12 * 24 * 3_600_000, volatility: 0.025, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) },
  'ALL': { points: 180, intervalMs: 30 * 24 * 3_600_000, candleMs: 30 * 24 * 3_600_000, volatility: 0.035, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) },
};

const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
};

const hashSeed = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const buildFromSparkline = (sparkline: number[], tf: Timeframe, _livePrice: number): ChartDataPoint[] => {
  const cfg = tfConfigs[tf];
  const totalPrices = sparkline.length;
  const step = Math.max(1, Math.floor(totalPrices / cfg.points));
  const now = Date.now();
  const data: ChartDataPoint[] = [];
  for (let i = 0; i < cfg.points; i++) {
    const srcIdx = Math.min(Math.floor(i * step), totalPrices - 1);
    const endIdx = Math.min(srcIdx + step, totalPrices);
    const slice = sparkline.slice(srcIdx, endIdx);
    if (slice.length === 0) continue;
    const open = slice[0];
    const close = slice[slice.length - 1];
    const high = Math.max(...slice);
    const low = Math.min(...slice);
    const time = new Date(now - (cfg.points - i) * cfg.intervalMs);
    data.push({ time: cfg.labelFn(time), value: parseFloat(close.toFixed(2)), open: parseFloat(open.toFixed(2)), close: parseFloat(close.toFixed(2)), high: parseFloat(high.toFixed(2)), low: parseFloat(low.toFixed(2)) });
  }
  return data;
};

const generateChartData = (price: number, change: number, tf: Timeframe, symbolKey: string): ChartDataPoint[] => {
  const cfg = tfConfigs[tf];
  const seed = hashSeed(`${symbolKey}:${tf}:${Math.floor(Date.now() / 3_600_000)}`);
  const rand = seededRandom(seed);
  const data: ChartDataPoint[] = [];
  const now = Date.now();
  let walkPrice = price / (1 + change / 100);
  const drift = (price - walkPrice) / cfg.points;
  for (let i = 0; i < cfg.points; i++) {
    const r1 = rand() - 0.5;
    const r2 = rand() - 0.5;
    const r3 = rand();
    const step = drift + r1 * walkPrice * cfg.volatility * 2;
    walkPrice += step;
    const spread = Math.abs(r2) * walkPrice * cfg.volatility * 1.5;
    const direction = r1 > 0;
    const open = walkPrice - (direction ? spread * 0.3 : -spread * 0.3);
    const close = walkPrice;
    const wickUp = r3 * walkPrice * cfg.volatility * 0.8;
    const wickDown = (1 - r3) * walkPrice * cfg.volatility * 0.8;
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;
    const time = new Date(now - (cfg.points - i) * cfg.intervalMs);
    data.push({ time: cfg.labelFn(time), value: parseFloat(close.toFixed(price < 10 ? 4 : 2)), open: parseFloat(open.toFixed(price < 10 ? 4 : 2)), close: parseFloat(close.toFixed(price < 10 ? 4 : 2)), high: parseFloat(high.toFixed(price < 10 ? 4 : 2)), low: parseFloat(low.toFixed(price < 10 ? 4 : 2)) });
  }
  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-navy-dark border border-gold/30 rounded px-3 py-2 shadow-lg">
      <p className="text-[10px] text-marble/50 font-mono mb-1">{label}</p>
      <p className="text-sm font-display text-gold-light font-semibold">
        ${payload[0].value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
      {d && (
        <div className="flex gap-2 mt-1 text-[10px] text-marble/40 font-mono">
          <span>O: ${d.open?.toFixed(2)}</span>
          <span>H: ${d.high?.toFixed(2)}</span>
          <span>L: ${d.low?.toFixed(2)}</span>
          <span>C: ${d.close?.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
};

const METAL_MAP: Record<string, 'gold' | 'silver' | 'platinum'> = {
  gold: 'gold', silver: 'silver', platinum: 'platinum', copper: 'gold',
};

const OIL_SYMBOL_MAP: Record<string, string> = {
  oil: 'WTI', brent: 'BRENT', natgas: 'NG', rbob: 'RBOB',
};

// Live Candle Engine
const useLiveCandleEngine = (price: number, tf: Timeframe, historicalData: ChartDataPoint[], symbolKey: string) => {
  const candlesRef = useRef<ChartDataPoint[]>([]);
  const currentCandleStartRef = useRef<number>(0);
  const lastSymbolRef = useRef<string>('');
  const lastTfRef = useRef<Timeframe>('1D');
  const [candles, setCandles] = useState<ChartDataPoint[]>([]);
  const tickCountRef = useRef(0);
  const cfg = tfConfigs[tf];

  useEffect(() => {
    const symbolChanged = symbolKey !== lastSymbolRef.current;
    const tfChanged = tf !== lastTfRef.current;
    const dataArrived = candlesRef.current.length === 0 && historicalData.length > 0;
    if (symbolChanged || tfChanged || dataArrived) {
      lastSymbolRef.current = symbolKey;
      lastTfRef.current = tf;
      candlesRef.current = [...historicalData];
      currentCandleStartRef.current = Date.now();
      tickCountRef.current = 0;
      setCandles([...historicalData]);
    }
  }, [symbolKey, tf, historicalData]);

  useEffect(() => {
    if (price <= 0 || candlesRef.current.length === 0) return;
    const now = Date.now();
    const elapsed = now - currentCandleStartRef.current;
    const arr = candlesRef.current;
    if (elapsed >= cfg.candleMs) {
      const newCandle: ChartDataPoint = { time: cfg.labelFn(new Date()), value: price, open: price, close: price, high: price, low: price };
      arr.push(newCandle);
      const maxPoints = tf === 'RT' ? 120 : cfg.points + 30;
      if (arr.length > maxPoints) arr.splice(0, arr.length - maxPoints);
      currentCandleStartRef.current = now;
    } else {
      const last = arr[arr.length - 1];
      if (last) {
        const decimals = price < 10 ? 4 : 2;
        last.close = parseFloat(price.toFixed(decimals));
        last.value = last.close;
        last.high = parseFloat(Math.max(last.high, price).toFixed(decimals));
        last.low = parseFloat(Math.min(last.low, price).toFixed(decimals));
      }
    }
    tickCountRef.current++;
    setCandles([...arr]);
  }, [price, cfg.candleMs, cfg.labelFn, tf]);

  return candles;
};

// ─── Long Timeframe Dropdown ────────────────────────────
const LongTimeframeDropdown = ({ tf, setTf }: { tf: Timeframe; setTf: (t: Timeframe) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isLongActive = (longTimeframes as readonly string[]).includes(tf);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`px-2 py-0.5 text-[9px] font-mono tracking-wider rounded transition-all flex items-center gap-1 border ${
          isLongActive ? 'bg-gold/15 text-gold border-gold/30' : 'text-marble/30 hover:text-marble/60 border-transparent'
        }`}
      >
        {isLongActive ? tf : 'MORE'}
        <MoreHorizontal className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-[200] bg-navy-dark border border-gold/30 rounded-lg shadow-xl overflow-hidden min-w-[90px]">
          {longTimeframes.map((t) => (
            <button
              key={t}
              onClick={() => { setTf(t); setOpen(false); }}
              className={`w-full px-3 py-2 text-left text-[10px] font-mono tracking-wider transition-colors ${
                tf === t ? 'bg-gold/10 text-gold' : 'text-marble/50 hover:bg-gold/5 hover:text-marble'
              }`}
            >
              {t === 'ALL' ? 'ALL (Lifetime)' : t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Mobile Timeframe Dropdown ───────────────────────────
const MobileTimeframeMenu = ({ tf, setTf }: { tf: Timeframe; setTf: (t: Timeframe) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`px-2 py-0.5 text-[9px] font-mono tracking-wider rounded transition-all flex items-center gap-1 ${
          tf === 'RT' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-gold/15 text-gold border border-gold/30'
        }`}
      >
        {tf}
        <MoreHorizontal className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-[200] bg-navy-dark border border-gold/30 rounded-lg shadow-xl overflow-hidden min-w-[90px]">
          <div className="px-3 py-1 text-[8px] font-display tracking-wider text-marble/30 bg-navy-dark/80 border-b border-gold/10">SHORT</div>
          {shortTimeframes.map((t) => (
            <button
              key={t}
              onClick={() => { setTf(t); setOpen(false); }}
              className={`w-full px-3 py-2 text-left text-[10px] font-mono tracking-wider transition-colors ${
                tf === t
                  ? t === 'RT' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gold/10 text-gold'
                  : 'text-marble/50 hover:bg-gold/5 hover:text-marble'
              }`}
            >
              {t} {t === 'RT' && '●'}
            </button>
          ))}
          <div className="px-3 py-1 text-[8px] font-display tracking-wider text-marble/30 bg-navy-dark/80 border-b border-gold/10 border-t border-gold/10">LONG</div>
          {longTimeframes.map((t) => (
            <button
              key={t}
              onClick={() => { setTf(t); setOpen(false); }}
              className={`w-full px-3 py-2 text-left text-[10px] font-mono tracking-wider transition-colors ${
                tf === t ? 'bg-gold/10 text-gold' : 'text-marble/50 hover:bg-gold/5 hover:text-marble'
              }`}
            >
              {t === 'ALL' ? 'ALL (Lifetime)' : t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// GOLD ARROW LIVE — Swap Terminal Chart
// ═══════════════════════════════════════════════════════════
const GALiveChart = ({ symbolKey, category, label, onSymbolChange, headerLeftSlot, headerRightSlot }: Props) => {
  const [tf, setTf] = useState<Timeframe>('RT');
  const [chartMode, setChartMode] = useState<ChartMode>('area');
  const [activeIndicators, setActiveIndicators] = useState<Set<IndicatorKey>>(new Set());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { drawings, activeTool, setActiveTool, addDrawing, deleteDrawing, clearAll, showList, toggleList } = useDrawings();
  const [pendingClick, setPendingClick] = useState<number | null>(null);
  const [showForecast, setShowForecast] = useState(false);
  const [showApex, setShowApex] = useState(false);
  const lastLoggedForecastRef = useRef<string>('');

  const { data: metalPrices } = useMetalPrices();
  const { data: cryptoData } = useCryptoData(50);
  const { data: oilPrices } = useOilGasPrices();
  const wsPrices = useWebSocketPrices([symbolKey]);
  const wsData = wsPrices[symbolKey];

  const { basePrice, baseChange } = useMemo(() => {
    if (wsData && wsData.price > 0) return { basePrice: wsData.price, baseChange: wsData.change24h };
    if (category === 'metals') {
      const key = METAL_MAP[symbolKey];
      const feed = key ? metalPrices?.[key] : undefined;
      return { basePrice: feed?.price_usd ?? 0, baseChange: feed?.change_24h ?? 0 };
    }
    if (category === 'crypto') {
      const coin = cryptoData?.find((c) => c.id === symbolKey || c.symbol === symbolKey);
      return { basePrice: coin?.current_price ?? 0, baseChange: coin?.price_change_percentage_24h ?? 0 };
    }
    if (category === 'energy') {
      const sym = OIL_SYMBOL_MAP[symbolKey];
      const feed = oilPrices?.find((p) => p.symbol === sym);
      return { basePrice: feed?.price ?? 0, baseChange: feed?.change ?? 0 };
    }
    const sp = SYNTHETIC_PRICES[symbolKey] ?? { p: 100, c: 0 };
    return { basePrice: sp.p, baseChange: sp.c };
  }, [symbolKey, category, metalPrices, cryptoData, oilPrices, wsData]);

  const { price: streamedPrice, change: streamedChange } = useSimulatedStream(basePrice, baseChange, symbolKey);
  const isWsLive = !!wsData && wsData.price > 0;
  const price = isWsLive ? wsData.price : streamedPrice;
  const change = isWsLive ? wsData.change24h : streamedChange;

  const sparklineData = useMemo(() => {
    if (category !== 'crypto' || !cryptoData) return null;
    const coin = cryptoData.find((c) => c.id === symbolKey || c.symbol === symbolKey);
    return coin?.sparkline_in_7d?.price ?? null;
  }, [category, cryptoData, symbolKey]);

  const historicalData = useMemo(() => {
    const effectivePrice = basePrice || price;
    if (effectivePrice <= 0) return [];
    if (sparklineData && sparklineData.length > 10) return buildFromSparkline(sparklineData, tf, effectivePrice);
    return generateChartData(effectivePrice, change, tf, symbolKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sparklineData, tf, symbolKey, basePrice]);

  const liveCandles = useLiveCandleEngine(price, tf, historicalData, symbolKey);

  // ═══ ZOOM THROUGH TIME ═══
  const zoom = useChartZoom({ totalPoints: liveCandles.length, minVisible: 10, maxVisible: liveCandles.length * 3 });
  const visibleCandles = useMemo(() => zoom.sliceData(liveCandles), [zoom.sliceData, liveCandles]);
  const enrichedData = useMemo(() => enrichChartData(visibleCandles, activeIndicators), [visibleCandles, activeIndicators]);

  // ═══ FORECAST PROJECTION ═══
  const cfg = tfConfigs[tf];
  const { forecastPoints, forecastBias } = useMemo(() => {
    if (!showForecast && !showApex) return { forecastPoints: [] as ForecastPoint[], forecastBias: 0 };
    const vals = liveCandles.map(d => d.value);
    const his = liveCandles.map(d => d.high);
    const los = liveCandles.map(d => d.low);
    const result = computeForecastPoints(vals, his, los, price, cfg.intervalMs, cfg.labelFn, cfg.points, tf);
    return { forecastPoints: result.points, forecastBias: result.bias };
  }, [liveCandles, price, tf, showForecast, showApex, cfg]);

  // ═══ APEX ADAPTIVE FORECAST ═══
  const { apexPoints, apexBias, apexConfidence, apexStats } = useMemo(() => {
    if (!showApex) return { apexPoints: [] as ApexForecastPoint[], apexBias: 0, apexConfidence: 0, apexStats: getApexStats() };
    const vals = liveCandles.map(d => d.value);
    const his = liveCandles.map(d => d.high);
    const los = liveCandles.map(d => d.low);
    const depth = FORECAST_DEPTH[tf] ?? { points: 12 };
    const result = computeApexForecast(
      vals, his, los, price, cfg.intervalMs, cfg.labelFn, depth.points, tf,
      forecastBias, forecastPoints,
    );
    const stats = getApexStats();
    return { apexPoints: result.points, apexBias: result.bias, apexConfidence: result.confidence, apexStats: stats };
  }, [liveCandles, price, tf, showApex, cfg, forecastBias, forecastPoints]);

  // Merge real + forecast + apex data
  const chartData = useMemo(() => {
    if (forecastPoints.length === 0 && apexPoints.length === 0) return enrichedData;
    const lastReal = enrichedData[enrichedData.length - 1];
    const result = [...enrichedData];
    
    // Determine how many forecast points we need
    const maxLen = Math.max(forecastPoints.length, apexPoints.length);
    if (maxLen === 0) return result;
    
    // Bridge point
    if (lastReal) {
      const bridge: any = { ...lastReal };
      if (showForecast && forecastPoints.length > 0) {
        bridge.forecast = lastReal.value;
        bridge.forecastColor = biasToRainbowColor(0);
      }
      if (showApex && apexPoints.length > 0) {
        bridge.apexForecast = lastReal.value;
        bridge.apexColor = 'hsl(185, 80%, 55%)';
        if (showForecast && forecastPoints.length > 0) {
          bridge.waveGhost = lastReal.value;
        }
      }
      result[result.length - 1] = bridge;
    }
    
    // Merge forecast + apex points
    for (let i = 0; i < maxLen; i++) {
      const merged: any = {};
      if (i < forecastPoints.length && showForecast) {
        Object.assign(merged, forecastPoints[i]);
      }
      if (i < apexPoints.length && showApex) {
        merged.time = apexPoints[i].time;
        merged.apexForecast = apexPoints[i].apexForecast;
        merged.apexColor = apexPoints[i].apexColor;
        merged.apexHigh = apexPoints[i].apexHigh;
        merged.apexLow = apexPoints[i].apexLow;
        if (apexPoints[i].waveGhost !== undefined) {
          merged.waveGhost = apexPoints[i].waveGhost;
        }
      }
      if (!merged.time && i < forecastPoints.length) merged.time = forecastPoints[i].time;
      if (!merged.time && i < apexPoints.length) merged.time = apexPoints[i].time;
      result.push(merged);
    }
    
    return result;
  }, [enrichedData, forecastPoints, apexPoints, showForecast, showApex]);

  // Log forecast to registry when toggled on
  useEffect(() => {
    if (!showForecast || forecastPoints.length === 0 || price <= 0) return;
    const logKey = `${symbolKey}:${tf}:${Math.floor(Date.now() / 30000)}`; // throttle to 30s
    if (lastLoggedForecastRef.current === logKey) return;
    lastLoggedForecastRef.current = logKey;
    const lastForecast = forecastPoints[forecastPoints.length - 1];
    addForecastLogEntry({
      timestamp: new Date().toISOString(),
      symbol: label,
      category,
      timeframe: tf,
      currentPrice: price,
      projectedPrice: lastForecast.forecast,
      bias: forecastBias,
      direction: forecastBias > 0.1 ? 'bullish' : forecastBias < -0.1 ? 'bearish' : 'neutral',
      angle: biasToAngle(forecastBias),
      color: biasToRainbowColor(forecastBias),
      indicators: {
        rsi: computeRSIArray(liveCandles.map(d => d.value)).at(-1) ?? 50,
        sma20: computeSMA(liveCandles.map(d => d.value), 20).at(-1) ?? price,
        ema20: computeEMA(liveCandles.map(d => d.value), 20).at(-1) ?? price,
        macdCross: (() => { const m = computeMACD(liveCandles.map(d => d.value)); return (m.macd.at(-1) ?? 0) > (m.signal.at(-1) ?? 0) ? 'bullish' : 'bearish'; })(),
        atr: computeATR(liveCandles.map(d => d.high), liveCandles.map(d => d.low), liveCandles.map(d => d.value)).at(-1) ?? 0,
      },
    });
  }, [showForecast, forecastPoints, forecastBias, symbolKey, tf, price, label, category, liveCandles]);

  const color = CATEGORY_COLORS[category] ?? 'hsl(43, 72%, 50%)';
  const gradientId = `galive-grad-${symbolKey}`;
  const chartValues = visibleCandles.map((d) => d.value);
  const chartHighs = visibleCandles.map((d) => d.high);
  const chartLows = visibleCandles.map((d) => d.low);

  const headerStats = useMemo(() => {
    const rsiArr = computeRSIArray(chartValues);
    const rsi = rsiArr[rsiArr.length - 1] ?? 50;
    const sma20 = computeSMA(chartValues, 20).at(-1) ?? price;
    const ema20 = computeEMA(chartValues, 20).at(-1) ?? price;
    const atr = computeATR(chartHighs, chartLows, chartValues).at(-1) ?? 0;
    const macdData = computeMACD(chartValues);
    const macdVal = macdData.macd.at(-1) ?? 0;
    const macdSig = macdData.signal.at(-1) ?? 0;
    const macdCross = !isNaN(macdVal) && !isNaN(macdSig) ? (macdVal > macdSig ? 'bullish' : 'bearish') : 'neutral';
    return { rsi, sma20, ema20, atr, macdCross };
  }, [chartValues, chartHighs, chartLows, price]);

  const toggleIndicator = useCallback((key: IndicatorKey) => {
    setActiveIndicators(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  }, []);

  const handleChartClick = useCallback((e: any) => {
    if (!activeTool || !e?.activePayload?.[0]) return;
    const clickedPrice = e.activePayload[0].value;
    if (activeTool === 'hline') {
      addDrawing({ type: 'hline', y1: clickedPrice, color: 'hsl(43,72%,50%)', label: `$${clickedPrice.toFixed(2)}` });
      setActiveTool(null);
    } else if (activeTool === 'trendline' || activeTool === 'fib' || activeTool === 'measure') {
      if (pendingClick === null) {
        setPendingClick(clickedPrice);
      } else {
        const y1 = pendingClick;
        const y2 = clickedPrice;
        if (activeTool === 'trendline') {
          addDrawing({ type: 'trendline', y1, y2, color: 'hsl(170,70%,50%)', label: `Trend $${y1.toFixed(2)}→$${y2.toFixed(2)}` });
        } else if (activeTool === 'fib') {
          const diff = Math.abs(y1 - y2);
          const high = Math.max(y1, y2);
          [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1].forEach(level => {
            addDrawing({ type: 'hline', y1: high - diff * level, color: 'hsl(43,72%,50%)', label: `Fib ${(level * 100).toFixed(1)}% $${(high - diff * level).toFixed(2)}` });
          });
        } else if (activeTool === 'measure') {
          const diff = y2 - y1;
          const pct = ((diff / y1) * 100).toFixed(2);
          addDrawing({ type: 'hline', y1, color: 'hsl(210,80%,60%)', label: `Start $${y1.toFixed(2)}` });
          addDrawing({ type: 'hline', y1: y2, color: 'hsl(210,80%,60%)', label: `End $${y2.toFixed(2)} (${diff >= 0 ? '+' : ''}${pct}%)` });
        }
        setPendingClick(null);
        setActiveTool(null);
      }
    }
  }, [activeTool, addDrawing, setActiveTool, pendingClick]);

  const indicatorLines = useMemo(() => getIndicatorLines(activeIndicators), [activeIndicators]);
  const fibLines = useMemo(() => getFibonacciLines(activeIndicators, chartData as ChartDataPoint[]), [activeIndicators, chartData]);
  const drawingRefLines = useMemo(() => getDrawingReferenceLines(drawings), [drawings]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return ALL_SYMBOLS;
    const q = searchQuery.toLowerCase();
    return ALL_SYMBOLS.filter(s => s.label.toLowerCase().includes(q) || s.ticker.toLowerCase().includes(q) || s.key.includes(q) || s.cat.toLowerCase().includes(q));
  }, [searchQuery]);

  const selectSearchSymbol = (sym: WatchlistSymbol) => {
    onSymbolChange?.(sym);
    setSearchOpen(false);
    setSearchQuery('');
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !searchOpen && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); setSearchOpen(true); setSearchQuery(''); }
      if (e.key === 'Escape' && searchOpen) setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen]);

  useEffect(() => { if (searchOpen && searchInputRef.current) searchInputRef.current.focus(); }, [searchOpen]);

  return (
    <div className="h-full flex flex-col bg-navy relative">
      {/* Search Overlay */}
      {searchOpen && (
        <div className="absolute inset-0 z-50 bg-navy/95 backdrop-blur-sm flex flex-col items-center pt-12">
          <div className="w-full max-w-md px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/50" />
              <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any symbol… (type / to open)"
                className="w-full bg-navy-light border border-gold/30 text-marble text-sm rounded-lg pl-10 pr-10 py-3 font-mono placeholder:text-marble/20 focus:outline-none focus:border-gold/60"
                onKeyDown={(e) => { if (e.key === 'Enter' && searchResults.length > 0) selectSearchSymbol(searchResults[0]); if (e.key === 'Escape') setSearchOpen(false); }}
              />
              <button onClick={() => setSearchOpen(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-marble/30 hover:text-marble"><X className="w-4 h-4" /></button>
            </div>
            <div className="mt-2 bg-navy-light border border-gold/15 rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
              <div className="px-3 py-1.5 text-[9px] font-display tracking-wider text-marble/30 bg-navy-dark/50 sticky top-0">
                {searchQuery.trim() ? `${searchResults.length} RESULTS` : `ALL SYMBOLS (${ALL_SYMBOLS.length})`}
              </div>
              {searchResults.map((sym) => (
                <button key={sym.key} onClick={() => selectSearchSymbol(sym)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-gold/10 border-b border-gold/5 last:border-0 ${sym.key === symbolKey ? 'bg-gold/10 text-gold' : 'text-marble/70'}`}>
                  <div className="flex items-center gap-2">
                    <SymbolLogo symbolKey={sym.key} category={sym.cat} ticker={sym.ticker} size={18} />
                    <span className="text-sm font-mono">{sym.label}</span>
                    <span className="text-[9px] text-marble/25 ml-1">{sym.ticker}</span>
                  </div>
                  <span className="text-[8px] font-display tracking-wider text-marble/20 uppercase">{sym.cat}</span>
                </button>
              ))}
            </div>
            <p className="text-marble/15 text-[9px] text-center mt-2 font-mono">Press <kbd className="bg-navy-light px-1.5 py-0.5 rounded text-marble/30 border border-gold/10">ESC</kbd> to close</p>
          </div>
        </div>
      )}

      {/* Header — clean 2-row layout from GALiveStandalone */}
      <div className="flex flex-col border-b border-gold/10 flex-shrink-0 bg-navy-dark/30">
        {/* Row 1: Symbol + Price */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <BarChart3 className="w-4 h-4 text-gold flex-shrink-0" />
            {headerLeftSlot}
            <SymbolLogo symbolKey={symbolKey} category={category} ticker={label} size={20} />
            <button onClick={() => { setSearchOpen(true); setSearchQuery(''); }}
              className="flex items-center gap-1 hover:bg-gold/10 rounded px-1.5 py-0.5 transition-colors group" title="Search symbol (press /)">
              <span className="font-display text-sm tracking-wider text-marble group-hover:text-gold truncate max-w-[80px] sm:max-w-none">{label}</span>
              <Search className="w-3 h-3 text-marble/20 group-hover:text-gold/60 flex-shrink-0" />
            </button>
            {isWsLive ? (
              <span className="flex items-center gap-0.5 text-[8px] font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20"><Wifi className="w-2.5 h-2.5" /> WS</span>
            ) : (
              <LivePulse label="LIVE" />
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {headerRightSlot}
            <span className="font-display text-lg text-marble">
              ${price < 10 ? price.toFixed(3) : price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${change >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
              {change >= 0 ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : <TrendingDown className="w-3 h-3 inline mr-0.5" />}
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
        </div>
        {/* Row 2: Tools — chart modes, timeframes, drawing tools, indicators */}
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-gold/5 gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Day H/L — desktop only */}
            {!isMobile && liveCandles.length > 0 && (() => {
              const dayHigh = Math.max(...chartHighs);
              const dayLow = Math.min(...chartLows);
              const range = dayHigh - dayLow;
              const pct = range > 0 ? ((price - dayLow) / range) * 100 : 50;
              return (
                <span className="flex items-center gap-1.5">
                  <span className="text-[8px] font-mono text-red-400/40">L:{dayLow < 10 ? dayLow.toFixed(4) : dayLow.toFixed(2)}</span>
                  <div className="w-16 h-1.5 bg-navy-light/50 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 via-marble/20 to-emerald-500/30 rounded-full" />
                    <div className="absolute top-0 h-full w-1 bg-gold rounded-full" style={{ left: `${Math.min(Math.max(pct, 0), 100)}%` }} />
                  </div>
                  <span className="text-[8px] font-mono text-emerald-400/40">H:{dayHigh < 10 ? dayHigh.toFixed(4) : dayHigh.toFixed(2)}</span>
                </span>
              );
            })()}
            {/* Indicator stats — desktop only */}
            {!isMobile && (
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-marble/30">RSI <span className={headerStats.rsi > 70 ? 'text-red-400' : headerStats.rsi < 30 ? 'text-emerald-400' : 'text-marble/50'}>{headerStats.rsi.toFixed(1)}</span></span>
                <span className="text-[9px] font-mono text-marble/30">SMA20 <span className={price > headerStats.sma20 ? 'text-emerald-400' : 'text-red-400'}>${headerStats.sma20.toFixed(2)}</span></span>
                <span className={`text-[9px] font-mono ${headerStats.macdCross === 'bullish' ? 'text-emerald-400' : 'text-red-400'}`}>MACD {headerStats.macdCross === 'bullish' ? '▲' : '▼'}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {pendingClick !== null && activeTool && (
              <span className="text-[8px] font-mono text-gold animate-pulse bg-gold/10 px-2 py-0.5 rounded border border-gold/20">Click 2nd · ${pendingClick.toFixed(2)}</span>
            )}
            {!isMobile && (
              <ChartDrawingTools activeTool={activeTool} onSelectTool={setActiveTool} drawings={drawings} onClearAll={clearAll} onDeleteDrawing={deleteDrawing} drawingCount={drawings.length} showList={showList} onToggleList={toggleList} />
            )}
            {/* Chart mode */}
            <div className="flex gap-0.5">
              {([
                { mode: 'area' as ChartMode, icon: LineChart, tip: 'Area' },
                { mode: 'candlestick' as ChartMode, icon: CandlestickChart, tip: 'Candles' },
                { mode: 'ohlc' as ChartMode, icon: BarChart2, tip: 'OHLC' },
              ]).map(({ mode, icon: Icon, tip }) => (
                <button key={mode} onClick={() => setChartMode(mode)} className={`p-1 rounded transition-all ${chartMode === mode ? 'bg-gold/15 text-gold' : 'text-marble/25 hover:text-marble/50'}`} title={tip}>
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
            {/* Timeframes */}
            {isMobile ? (
              <MobileTimeframeMenu tf={tf} setTf={setTf} />
            ) : (
              <div className="flex gap-0.5 items-center">
                {shortTimeframes.map((t) => (
                  <button key={t} onClick={() => setTf(t)}
                    className={`px-2 py-0.5 text-[9px] font-mono tracking-wider rounded transition-all ${
                      tf === t ? t === 'RT' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-gold/15 text-gold border border-gold/30'
                      : 'text-marble/30 hover:text-marble/60 border border-transparent'
                    }`}>{t}</button>
                ))}
                <LongTimeframeDropdown tf={tf} setTf={setTf} />
              </div>
            )}
            {/* Forecast toggle */}
            <button
              onClick={() => setShowForecast(prev => !prev)}
              className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono tracking-wider rounded transition-all border ${
                showForecast ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' : 'text-marble/25 border-transparent hover:text-marble/50'
              }`}
              title={`Wave forecast — ${FORECAST_DEPTH[tf]?.label ?? tf} projection`}
            >
              <Crosshair className="w-3 h-3" />
              <span className="hidden sm:inline">WAVE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Indicators */}
      <div className="border-b border-gold/5 flex-shrink-0">
        <IndicatorToggleBar active={activeIndicators} onToggle={toggleIndicator} />
      </div>

      {/* Chart Area */}
      <div {...zoom.containerProps} className={`px-1 py-1 ${hasActiveOscillators(activeIndicators) ? '' : 'flex-1'}`} style={{ cursor: activeTool ? 'crosshair' : 'default', flex: hasActiveOscillators(activeIndicators) ? '1 1 70%' : undefined, minHeight: 0, touchAction: 'pan-x' }}>
        {price === 0 || liveCandles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            <span className="text-marble/30 text-xs font-display tracking-[0.2em]">LOADING MARKET DATA</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }} onClick={handleChartClick}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(213, 28%, 24%)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(40,25%,96%,0.2)' }} axisLine={{ stroke: 'hsl(213, 28%, 24%)' }} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={[(dataMin: number) => dataMin * 0.999, (dataMax: number) => dataMax * 1.001]} tick={{ fontSize: 9, fill: 'hsl(40,25%,96%,0.2)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} width={65} />
              <Tooltip content={<CustomTooltip />} />
              {drawingRefLines.map((rl, i) => (
                <ReferenceLine key={`dr-${i}`} y={rl.y} stroke={rl.stroke} strokeDasharray={rl.strokeDasharray} strokeWidth={rl.strokeWidth} label={rl.label} />
              ))}
              {fibLines}
              {chartMode === 'area' && (
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 4, fill: color, stroke: 'hsl(213, 32%, 16%)', strokeWidth: 2 }} isAnimationActive={false} />
              )}
              {chartMode === 'candlestick' && (
                <Customized component={(props: any) => {
                  const { xAxisMap, yAxisMap } = props;
                  const xAxis = xAxisMap && Object.values(xAxisMap)[0] as any;
                  const yAxis = yAxisMap && Object.values(yAxisMap)[0] as any;
                  if (!xAxis?.scale || !yAxis?.scale) return null;
                  const barW = Math.max(Math.floor((xAxis.width || 600) / chartData.length * 0.6), 3);
                  return <CandlestickLayer data={chartData as any} xScale={(i: number) => xAxis.scale(chartData[i]?.time)} yScale={yAxis.scale} barWidth={barW} />;
                }} />
              )}
              {chartMode === 'ohlc' && (
                <Customized component={(props: any) => {
                  const { xAxisMap, yAxisMap } = props;
                  const xAxis = xAxisMap && Object.values(xAxisMap)[0] as any;
                  const yAxis = yAxisMap && Object.values(yAxisMap)[0] as any;
                  if (!xAxis?.scale || !yAxis?.scale) return null;
                  const barW = Math.max(Math.floor((xAxis.width || 600) / chartData.length * 0.6), 3);
                  return <OHLCLayer data={chartData as any} xScale={(i: number) => xAxis.scale(chartData[i]?.time)} yScale={yAxis.scale} barWidth={barW} />;
                }} />
              )}
              {chartMode !== 'area' && (
                <>
                  <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1} strokeOpacity={0.4} dot={false} connectNulls isAnimationActive={false} />
                  <Area type="monotone" dataKey="value" stroke="transparent" strokeWidth={0} fill="transparent" dot={false} activeDot={{ r: 3, fill: color, stroke: 'hsl(213, 32%, 16%)', strokeWidth: 2 }} isAnimationActive={false} />
                </>
              )}
              {indicatorLines}
              {/* Rainbow Forecast Line */}
              {showForecast && forecastPoints.length > 0 && (
                <Customized component={(props: any) => {
                  const { xAxisMap, yAxisMap } = props;
                  const xAxis = xAxisMap && Object.values(xAxisMap)[0] as any;
                  const yAxis = yAxisMap && Object.values(yAxisMap)[0] as any;
                  if (!xAxis?.scale || !yAxis?.scale) return null;
                  return <ForecastRainbowLine data={chartData as any[]} xScale={(i: number) => xAxis.scale(chartData[i]?.time)} yScale={yAxis.scale} />;
                }} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Oscillator Sub-Panel */}
      {hasActiveOscillators(activeIndicators) && chartData.length > 0 && (
        <div className="border-t border-gold/10 overflow-y-auto" style={{ flex: '0 0 auto', maxHeight: '30%' }}>
          <OscillatorPanel data={chartData as ChartDataPoint[]} activeIndicators={activeIndicators} />
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-gold/10 flex-shrink-0 bg-navy-dark/20">
        <span className="text-[9px] font-display tracking-wider text-marble/20 uppercase">
          {category} · {tf === 'RT' ? 'REALTIME' : tf}
          {tf === 'RT' && <span className="ml-1 text-emerald-400 animate-pulse">●</span>}
        </span>
        <div className="flex items-center gap-3">
          {activeIndicators.size > 0 && (
            <span className="text-[8px] font-mono text-gold/30">{activeIndicators.size} indicator{activeIndicators.size !== 1 ? 's' : ''}</span>
          )}
           <span className="text-[8px] font-mono text-marble/15">{isWsLive ? 'WS' : 'SIM'} · {visibleCandles.length}/{liveCandles.length} bars</span>
            {zoom.zoomLabel !== 'FIT' && (
              <button onClick={zoom.resetZoom} className="text-[8px] font-mono text-gold/40 hover:text-gold transition-colors px-1 py-0.5 rounded bg-gold/5 border border-gold/10">
                🔍 {zoom.zoomLabel} · RESET
              </button>
            )}
          <span className="text-[9px] font-mono text-gold/40 tracking-wider">GOLD ARROW LIVE</span>
        </div>
      </div>
    </div>
  );
};

export default GALiveChart;
