/**
 * Gold Arrow LIVE — Trading Bridge Chart
 * Based on the clean GALiveStandalone widget with prop interface
 * for symbol sync with the Trading Bridge panel.
 */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Customized } from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, Wifi, Search, X, CandlestickChart, LineChart, BarChart2, MoreHorizontal, Crosshair } from 'lucide-react';
import { addForecastLogEntry, biasToRainbowColor, biasToAngle } from '@/lib/forecastLog';
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

// ═══ FORECAST ENGINE ═══════════════════════════════════════
interface ForecastPoint {
  time: string;
  forecast: number;
  forecastColor: string;
  value?: undefined;
}

const computeForecastPoints = (
  values: number[], highs: number[], lows: number[],
  currentPrice: number, intervalMs: number, labelFn: (d: Date) => string, totalPoints: number,
): { points: ForecastPoint[]; bias: number } => {
  if (values.length < 30 || currentPrice <= 0) return { points: [], bias: 0 };

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

  const numPoints = Math.max(4, Math.ceil(totalPoints * 0.1));
  const points: ForecastPoint[] = [];
  const now = Date.now();
  const driftPerStep = (bias * latestATR * 0.15) / numPoints;

  for (let i = 1; i <= numPoints; i++) {
    const progress = i / numPoints;
    const futurePrice = currentPrice + driftPerStep * i;
    // Per-segment bias lerps from 0 to full bias
    const segmentBias = bias * progress;
    const futureTime = new Date(now + i * intervalMs);

    points.push({
      time: labelFn(futureTime),
      forecast: parseFloat(futurePrice.toFixed(currentPrice < 10 ? 4 : 2)),
      forecastColor: biasToRainbowColor(segmentBias),
    });
  }

  return { points, bias };
};

// Custom SVG renderer for rainbow-colored forecast line segments
const ForecastRainbowLine = ({ data, xScale, yScale }: {
  data: any[];
  xScale: (i: number) => number;
  yScale: (v: number) => number;
}) => {
  // Find forecast points
  const forecastIndices: number[] = [];
  data.forEach((d, i) => { if (d.forecast !== undefined) forecastIndices.push(i); });
  if (forecastIndices.length < 2) return null;

  const segments: React.ReactElement[] = [];
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

    segments.push(
      <line
        key={`fc-${j}`}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={d2.forecastColor || 'hsl(60,80%,55%)'}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray="6 3"
        opacity={0.85}
      />
    );
    // Glow effect
    segments.push(
      <line
        key={`fc-glow-${j}`}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={d2.forecastColor || 'hsl(60,80%,55%)'}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray="6 3"
        opacity={0.15}
      />
    );
  }

  // Endpoint dot
  const lastIdx = forecastIndices[forecastIndices.length - 1];
  const lastD = data[lastIdx];
  const lx = xScale(lastIdx);
  const ly = yScale(lastD.forecast);
  if (!isNaN(lx) && !isNaN(ly)) {
    segments.push(
      <circle key="fc-dot" cx={lx} cy={ly} r={4} fill={lastD.forecastColor} stroke="hsl(213,32%,16%)" strokeWidth={2} />
    );
  }

  return <g>{segments}</g>;
};

interface Props {
  symbolKey: string;
  category: string;
  label: string;
  onSymbolChange?: (sym: WatchlistSymbol) => void;
}

const timeframes = ['RT', '1H', '4H', '1D', '1W', '1M'] as const;
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
        <div className="absolute right-0 top-full mt-1 z-[60] bg-navy-dark border border-gold/30 rounded-lg shadow-xl overflow-hidden min-w-[90px]">
          {timeframes.map((t) => (
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
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// GOLD ARROW LIVE — Trading Bridge Chart
// ═══════════════════════════════════════════════════════════
const GALiveChart = ({ symbolKey, category, label, onSymbolChange }: Props) => {
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
  const enrichedData = useMemo(() => enrichChartData(liveCandles, activeIndicators), [liveCandles, activeIndicators]);

  // ═══ FORECAST PROJECTION ═══
  const cfg = tfConfigs[tf];
  const { forecastPoints, forecastBias } = useMemo(() => {
    if (!showForecast) return { forecastPoints: [] as ForecastPoint[], forecastBias: 0 };
    const vals = liveCandles.map(d => d.value);
    const his = liveCandles.map(d => d.high);
    const los = liveCandles.map(d => d.low);
    const result = computeForecastPoints(vals, his, los, price, cfg.intervalMs, cfg.labelFn, cfg.points);
    return { forecastPoints: result.points, forecastBias: result.bias };
  }, [liveCandles, price, tf, showForecast, cfg]);

  // Merge real + forecast data
  const chartData = useMemo(() => {
    if (forecastPoints.length === 0) return enrichedData;
    const lastReal = enrichedData[enrichedData.length - 1];
    const bridge = lastReal ? { ...lastReal, forecast: lastReal.value, forecastColor: biasToRainbowColor(0) } : undefined;
    const result = [...enrichedData];
    if (bridge) result[result.length - 1] = bridge;
    return [...result, ...forecastPoints];
  }, [enrichedData, forecastPoints]);

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
  const chartValues = liveCandles.map((d) => d.value);
  const chartHighs = liveCandles.map((d) => d.high);
  const chartLows = liveCandles.map((d) => d.low);

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
            <span className="font-display text-xs tracking-[0.15em] text-gold-light hidden sm:inline">GOLD ARROW LIVE</span>
            <span className="text-gold/20 mx-1 hidden sm:inline">|</span>
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
              <div className="flex gap-0.5">
                {timeframes.map((t) => (
                  <button key={t} onClick={() => setTf(t)}
                    className={`px-2 py-0.5 text-[9px] font-mono tracking-wider rounded transition-all ${
                      tf === t ? t === 'RT' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-gold/15 text-gold border border-gold/30'
                      : 'text-marble/30 hover:text-marble/60 border border-transparent'
                    }`}>{t}</button>
                ))}
              </div>
            )}
            {/* Forecast toggle */}
            <button
              onClick={() => setShowForecast(prev => !prev)}
              className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono tracking-wider rounded transition-all border ${
                showForecast ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' : 'text-marble/25 border-transparent hover:text-marble/50'
              }`}
              title="Toggle forecast projection"
            >
              <Crosshair className="w-3 h-3" />
              <span className="hidden sm:inline">FORECAST</span>
            </button>
          </div>
        </div>
      </div>

      {/* Indicators */}
      <div className="border-b border-gold/5 flex-shrink-0">
        <IndicatorToggleBar active={activeIndicators} onToggle={toggleIndicator} />
      </div>

      {/* Chart Area */}
      <div className={`px-1 py-1 ${hasActiveOscillators(activeIndicators) ? '' : 'flex-1'}`} style={{ cursor: activeTool ? 'crosshair' : 'default', flex: hasActiveOscillators(activeIndicators) ? '1 1 70%' : undefined, minHeight: 0 }}>
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
          <span className="text-[8px] font-mono text-marble/15">{isWsLive ? 'WS' : 'SIM'} · {liveCandles.length} bars</span>
          <span className="text-[9px] font-mono text-gold/40 tracking-wider">GOLD ARROW LIVE</span>
        </div>
      </div>
    </div>
  );
};

export default GALiveChart;
