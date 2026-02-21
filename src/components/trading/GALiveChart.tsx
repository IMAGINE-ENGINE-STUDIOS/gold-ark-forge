import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Customized } from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, Wifi, Search, X, CandlestickChart, LineChart, BarChart2, MoreHorizontal, Layers, BrickWall, Pencil, ChevronDown } from 'lucide-react';
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
  type IndicatorKey,
  type ChartDataPoint,
} from './IndicatorOverlay';
import ChartDrawingTools, { useDrawings, getDrawingReferenceLines } from './ChartDrawingTools';
import SymbolLogo from './SymbolLogo';
import { CandlestickLayer, OHLCLayer, HeikinAshiLayer, RenkoLayer, type ChartMode } from './CandlestickRenderer';

interface Props {
  symbolKey: string;
  category: string;
  label: string;
  onSymbolChange?: (sym: WatchlistSymbol) => void;
}

const timeframes = ['RT', '1m', '5m', '15m', '30m', '1H', '2H', '3H', '4H', '6H', '8H', '1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL'] as const;
type Timeframe = (typeof timeframes)[number];

interface TFConfig {
  points: number;
  intervalMs: number;
  candleMs: number; // how long each candle lasts in realtime mode
  volatility: number;
  labelFn: (d: Date) => string;
}

const tfConfigs: Record<Timeframe, TFConfig> = {
  'RT': { points: 60, intervalMs: 5_000, candleMs: 5_000, volatility: 0.0002, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) },
  '1m': { points: 60, intervalMs: 60_000, candleMs: 60_000, volatility: 0.00015, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) },
  '5m': { points: 60, intervalMs: 5 * 60_000, candleMs: 5 * 60_000, volatility: 0.0003, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '15m': { points: 48, intervalMs: 15 * 60_000, candleMs: 15 * 60_000, volatility: 0.00035, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '30m': { points: 48, intervalMs: 30 * 60_000, candleMs: 30 * 60_000, volatility: 0.0004, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '1H': { points: 12, intervalMs: 5 * 60_000, candleMs: 5 * 60_000, volatility: 0.0004, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '2H': { points: 48, intervalMs: 2 * 3_600_000, candleMs: 2 * 3_600_000, volatility: 0.0006, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '3H': { points: 40, intervalMs: 3 * 3_600_000, candleMs: 3 * 3_600_000, volatility: 0.0008, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '4H': { points: 48, intervalMs: 5 * 60_000, candleMs: 5 * 60_000, volatility: 0.0005, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '6H': { points: 28, intervalMs: 6 * 3_600_000, candleMs: 6 * 3_600_000, volatility: 0.0012, labelFn: (d) => d.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' }) },
  '8H': { points: 21, intervalMs: 8 * 3_600_000, candleMs: 8 * 3_600_000, volatility: 0.0015, labelFn: (d) => d.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' }) },
  '1D': { points: 96, intervalMs: 15 * 60_000, candleMs: 15 * 60_000, volatility: 0.0008, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '1W': { points: 84, intervalMs: 2 * 3_600_000, candleMs: 2 * 3_600_000, volatility: 0.0015, labelFn: (d) => d.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' }) },
  '1M': { points: 120, intervalMs: 6 * 3_600_000, candleMs: 6 * 3_600_000, volatility: 0.003, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
  '3M': { points: 90, intervalMs: 86_400_000, candleMs: 86_400_000, volatility: 0.005, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
  '6M': { points: 120, intervalMs: 2 * 86_400_000, candleMs: 2 * 86_400_000, volatility: 0.008, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
  '1Y': { points: 120, intervalMs: 3 * 86_400_000, candleMs: 3 * 86_400_000, volatility: 0.012, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) },
  'YTD': { points: Math.max(1, Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86_400_000)), intervalMs: 86_400_000, candleMs: 86_400_000, volatility: 0.006, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
  'ALL': { points: 200, intervalMs: 7 * 86_400_000, candleMs: 7 * 86_400_000, volatility: 0.02, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) },
};

// Deterministic seeded PRNG
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

// Build chart from real sparkline data (crypto)
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

    data.push({
      time: cfg.labelFn(time),
      value: parseFloat(close.toFixed(2)),
      open: parseFloat(open.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
    });
  }

  return data;
};

// Generate deterministic chart data for non-sparkline assets
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

    data.push({
      time: cfg.labelFn(time),
      value: parseFloat(close.toFixed(price < 10 ? 4 : 2)),
      open: parseFloat(open.toFixed(price < 10 ? 4 : 2)),
      close: parseFloat(close.toFixed(price < 10 ? 4 : 2)),
      high: parseFloat(high.toFixed(price < 10 ? 4 : 2)),
      low: parseFloat(low.toFixed(price < 10 ? 4 : 2)),
    });
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
        ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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

// ═══════════════════════════════════════════════════════════
// LIVE CANDLE ENGINE HOOK
// Maintains a persistent array of candles. On each price tick:
//   - Updates the LAST candle's close, high, low in-place
//   - When the candle period expires, closes it and starts a new one
// This creates the real-time growing/shrinking animation like TradingView.
// ═══════════════════════════════════════════════════════════
const useLiveCandleEngine = (
  price: number,
  tf: Timeframe,
  historicalData: ChartDataPoint[],
  symbolKey: string,
) => {
  const candlesRef = useRef<ChartDataPoint[]>([]);
  const currentCandleStartRef = useRef<number>(0);
  const lastSymbolRef = useRef<string>('');
  const lastTfRef = useRef<Timeframe>('1D');
  const [candles, setCandles] = useState<ChartDataPoint[]>([]);
  const tickCountRef = useRef(0);

  const cfg = tfConfigs[tf];

  // Reset candles when symbol, timeframe, or historicalData changes
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

  // On each price tick, update the live candle
  useEffect(() => {
    if (price <= 0 || candlesRef.current.length === 0) return;

    const now = Date.now();
    const elapsed = now - currentCandleStartRef.current;
    const arr = candlesRef.current;

    if (elapsed >= cfg.candleMs) {
      // ── Close current candle and start a new one ──
      const newCandleTime = new Date();
      const newCandle: ChartDataPoint = {
        time: cfg.labelFn(newCandleTime),
        value: price,
        open: price,
        close: price,
        high: price,
        low: price,
      };
      arr.push(newCandle);

      // Keep array trimmed to max points
      const maxPoints = tf === 'RT' ? 120 : cfg.points + 30;
      if (arr.length > maxPoints) {
        arr.splice(0, arr.length - maxPoints);
      }

      currentCandleStartRef.current = now;
    } else {
      // ── Update the last candle with the new tick ──
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
    // Force React re-render with a new array reference
    setCandles([...arr]);
  }, [price, cfg.candleMs, cfg.labelFn, tf]);

  return candles;
};

const GALiveChart = ({ symbolKey, category, label, onSymbolChange }: Props) => {
  const [tf, setTf] = useState<Timeframe>('RT');
  const [chartMode, setChartMode] = useState<ChartMode>('area');
  const [activeIndicators, setActiveIndicators] = useState<Set<IndicatorKey>>(new Set());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tfMenuOpen, setTfMenuOpen] = useState(false);
  const [showDrawMenu, setShowDrawMenu] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tfMenuRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { drawings, activeTool, setActiveTool, addDrawing, deleteDrawing, clearAll, showList, toggleList } = useDrawings();
  const [pendingClick, setPendingClick] = useState<number | null>(null);

  const { data: metalPrices } = useMetalPrices();
  const { data: cryptoData } = useCryptoData(50);
  const { data: oilPrices } = useOilGasPrices();

  // WebSocket real-time prices for crypto
  const wsPrices = useWebSocketPrices([symbolKey]);
  const wsData = wsPrices[symbolKey];

  // Resolve base price from APIs
  const { basePrice, baseChange } = useMemo(() => {
    if (wsData && wsData.price > 0) {
      return { basePrice: wsData.price, baseChange: wsData.change24h };
    }
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

  // Simulated sub-second streaming for non-WebSocket assets
  const { price: streamedPrice, change: streamedChange } = useSimulatedStream(basePrice, baseChange, symbolKey);
  const isWsLive = !!wsData && wsData.price > 0;
  const price = isWsLive ? wsData.price : streamedPrice;
  const change = isWsLive ? wsData.change24h : streamedChange;

  // Get sparkline data for crypto assets
  const sparklineData = useMemo(() => {
    if (category !== 'crypto' || !cryptoData) return null;
    const coin = cryptoData.find((c) => c.id === symbolKey || c.symbol === symbolKey);
    return coin?.sparkline_in_7d?.price ?? null;
  }, [category, cryptoData, symbolKey]);

  // Historical data (seed data for the candle engine)
  const historicalData = useMemo(() => {
    const effectivePrice = basePrice || price;
    if (effectivePrice <= 0) return []; // Don't generate data with zero price
    if (sparklineData && sparklineData.length > 10) {
      return buildFromSparkline(sparklineData, tf, effectivePrice);
    }
    return generateChartData(effectivePrice, change, tf, symbolKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sparklineData, tf, symbolKey, basePrice]);

  // ═══ LIVE CANDLE ENGINE ═══
  // This is the key difference from static charts:
  // Instead of regenerating all candles on every render, we maintain persistent
  // candle state. Each price tick updates the last candle's OHLC in real-time,
  // and when the candle period expires, it closes and a new one starts.
  const liveCandles = useLiveCandleEngine(price, tf, historicalData, symbolKey);

  // Enrich with indicators (computed from the live candle data)
  const chartData = useMemo(() => enrichChartData(liveCandles, activeIndicators), [liveCandles, activeIndicators]);

  const color = CATEGORY_COLORS[category] ?? 'hsl(43, 72%, 50%)';
  const gradientId = `prop-grad-${symbolKey}`;

  const chartValues = liveCandles.map((d) => d.value);
  const chartHighs = liveCandles.map((d) => d.high);
  const chartLows = liveCandles.map((d) => d.low);

  // Real-time computed indicators from live candle data
  const headerStats = useMemo(() => {
    const rsiArr = computeRSIArray(chartValues);
    const rsi = rsiArr[rsiArr.length - 1] ?? 50;
    const sma20Arr = computeSMA(chartValues, 20);
    const sma20 = sma20Arr[sma20Arr.length - 1] ?? price;
    const sma50Arr = computeSMA(chartValues, 50);
    const sma50 = sma50Arr[sma50Arr.length - 1] ?? price;
    const ema20Arr = computeEMA(chartValues, 20);
    const ema20 = ema20Arr[ema20Arr.length - 1] ?? price;
    const atrArr = computeATR(chartHighs, chartLows, chartValues);
    const atr = atrArr[atrArr.length - 1] ?? 0;
    const macdData = computeMACD(chartValues);
    const macdVal = macdData.macd[macdData.macd.length - 1] ?? 0;
    const macdSig = macdData.signal[macdData.signal.length - 1] ?? 0;
    const macdCross = !isNaN(macdVal) && !isNaN(macdSig) ? (macdVal > macdSig ? 'bullish' : 'bearish') : 'neutral';
    return { rsi, sma20, sma50, ema20, atr, macdCross, macdVal };
  }, [chartValues, chartHighs, chartLows, price]);

  const toggleIndicator = useCallback((key: IndicatorKey) => {
    setActiveIndicators(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
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
  const fibLines = useMemo(() => getFibonacciLines(activeIndicators, chartData), [activeIndicators, chartData]);
  const drawingRefLines = useMemo(() => getDrawingReferenceLines(drawings), [drawings]);

  // Symbol search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return ALL_SYMBOLS;
    const q = searchQuery.toLowerCase();
    return ALL_SYMBOLS.filter(s =>
      s.label.toLowerCase().includes(q) ||
      s.ticker.toLowerCase().includes(q) ||
      s.key.includes(q) ||
      s.cat.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Keyboard shortcut: / to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !searchOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setSearchOpen(true);
        setSearchQuery('');
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const selectSearchSymbol = (sym: WatchlistSymbol) => {
    onSymbolChange?.(sym);
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="h-full flex flex-col bg-navy relative">
      {/* Symbol Search Overlay */}
      {searchOpen && (
        <div className="absolute inset-0 z-50 bg-navy/95 backdrop-blur-sm flex flex-col items-center pt-16">
          <div className="w-full max-w-md px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/50" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any symbol… (type / to open)"
                className="w-full bg-navy-light border border-gold/30 text-marble text-sm rounded-lg pl-10 pr-10 py-3 font-mono placeholder:text-marble/20 focus:outline-none focus:border-gold/60"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchResults.length > 0) selectSearchSymbol(searchResults[0]);
                  if (e.key === 'Escape') setSearchOpen(false);
                }}
              />
              <button onClick={() => setSearchOpen(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-marble/30 hover:text-marble">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 bg-navy-light border border-gold/15 rounded-lg overflow-hidden max-h-[60vh] overflow-y-auto">
              <div className="px-3 py-1.5 text-[9px] font-display tracking-wider text-marble/30 bg-navy-dark/50 sticky top-0">
                {searchQuery.trim() ? `${searchResults.length} RESULTS` : `ALL SYMBOLS (${ALL_SYMBOLS.length})`}
              </div>
              {searchResults.map((sym) => (
                <button
                  key={sym.key}
                  onClick={() => selectSearchSymbol(sym)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-gold/10 border-b border-gold/5 last:border-0 ${
                    sym.key === symbolKey ? 'bg-gold/10 text-gold' : 'text-marble/70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <SymbolLogo symbolKey={sym.key} category={sym.cat} ticker={sym.ticker} size={18} />
                    <span className="text-sm font-mono">{sym.label}</span>
                    <span className="text-[9px] text-marble/25 ml-1">{sym.ticker}</span>
                  </div>
                  <span className="text-[8px] font-display tracking-wider text-marble/20 uppercase">{sym.cat}</span>
                </button>
              ))}
              {searchResults.length === 0 && (
                <div className="p-6 text-center text-marble/20 text-xs font-display">NO SYMBOLS FOUND</div>
              )}
            </div>
            <p className="text-marble/15 text-[9px] text-center mt-2 font-mono">Press <kbd className="bg-navy-light px-1.5 py-0.5 rounded text-marble/30 border border-gold/10">ESC</kbd> to close · <kbd className="bg-navy-light px-1.5 py-0.5 rounded text-marble/30 border border-gold/10">ENTER</kbd> to select</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between px-3 py-1.5 border-b border-gold/10 flex-shrink-0 relative z-30">
        {/* Row 1: Symbol info */}
        <div className="flex items-center gap-2 flex-shrink-0 min-w-0 overflow-hidden">
          <SymbolLogo symbolKey={symbolKey} category={category} ticker={label} size={22} />
          <button
            onClick={() => { setSearchOpen(true); setSearchQuery(''); }}
            className="flex items-center gap-1.5 hover:bg-gold/10 rounded px-1.5 py-0.5 transition-colors group"
            title="Search symbol (press /)"
          >
            <span className="font-display text-sm tracking-wider text-gold-light group-hover:text-gold">{label}</span>
            <Search className="w-3 h-3 text-marble/20 group-hover:text-gold/60" />
          </button>
          {isWsLive ? (
            <span className="flex items-center gap-0.5 text-[8px] font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
              <Wifi className="w-2.5 h-2.5" /> WS
            </span>
          ) : (
            <LivePulse label="LIVE" />
          )}
          <span className="font-display text-lg text-marble ml-2">
            ${price < 10 ? price.toFixed(3) : price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${change >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : <TrendingDown className="w-3 h-3 inline mr-0.5" />}
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </span>
          {/* Bid/Ask Spread */}
          {price > 0 && (() => {
            const spread = price * 0.0002;
            const bid = price - spread / 2;
            const ask = price + spread / 2;
            return (
              <span className="hidden lg:flex items-center gap-1 text-[9px] font-mono ml-1">
                <span className="text-emerald-400/60">B:{bid < 10 ? bid.toFixed(4) : bid.toFixed(2)}</span>
                <span className="text-marble/20">·</span>
                <span className="text-red-400/60">A:{ask < 10 ? ask.toFixed(4) : ask.toFixed(2)}</span>
                <span className="text-marble/15 ml-0.5">({(spread < 0.01 ? spread.toFixed(4) : spread.toFixed(2))})</span>
              </span>
            );
          })()}
          {/* Day High/Low */}
          {liveCandles.length > 0 && (() => {
            const dayHigh = Math.max(...chartHighs);
            const dayLow = Math.min(...chartLows);
            const range = dayHigh - dayLow;
            const pct = range > 0 ? ((price - dayLow) / range) * 100 : 50;
            return (
              <span className="hidden xl:flex items-center gap-1.5 ml-2">
                <span className="text-[8px] font-mono text-red-400/40">L:{dayLow < 10 ? dayLow.toFixed(4) : dayLow.toFixed(2)}</span>
                <div className="w-16 h-1.5 bg-navy-light/50 rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 via-marble/20 to-emerald-500/30 rounded-full" />
                  <div className="absolute top-0 h-full w-1 bg-gold rounded-full" style={{ left: `${Math.min(Math.max(pct, 0), 100)}%` }} />
                </div>
                <span className="text-[8px] font-mono text-emerald-400/40">H:{dayHigh < 10 ? dayHigh.toFixed(4) : dayHigh.toFixed(2)}</span>
              </span>
            );
          })()}
        </div>
        {/* Row 2: Tool controls — wraps to second row on mobile */}
        <div className="flex items-center gap-1.5 flex-shrink-0 mt-1 lg:mt-0">
          {/* Indicators */}
          <div className="hidden xl:flex items-center gap-2 mr-1">
            <span className="text-[8px] font-mono text-marble/30">RSI <span className={headerStats.rsi > 70 ? 'text-red-400' : headerStats.rsi < 30 ? 'text-emerald-400' : 'text-marble/50'}>{headerStats.rsi.toFixed(0)}</span></span>
            <span className={`text-[8px] font-mono ${headerStats.macdCross === 'bullish' ? 'text-emerald-400' : 'text-red-400'}`}>
              MACD {headerStats.macdCross === 'bullish' ? '▲' : '▼'}
            </span>
          </div>
          {pendingClick !== null && activeTool && (
            <span className="text-[8px] font-mono text-gold animate-pulse bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
              Click 2nd point · ${pendingClick.toFixed(2)}
            </span>
          )}
          {/* Drawing Tools Dropdown */}
          {!isMobile && (
            <div className="relative">
              <button
                onClick={() => setShowDrawMenu(prev => !prev)}
                className={`flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono rounded transition-all border ${
                  activeTool ? 'bg-gold/15 text-gold border-gold/30' : 'text-marble/25 border-transparent hover:text-marble/50'
                }`}
                title="Drawing tools"
              >
                <Pencil className="w-3 h-3" />
                {drawings.length > 0 && <span className="text-gold/50">{drawings.length}</span>}
              </button>
              {showDrawMenu && (
                <div className="absolute right-0 top-full mt-1 z-[60] bg-navy-dark border border-gold/30 rounded-lg shadow-xl overflow-hidden min-w-[140px]">
                  <ChartDrawingTools
                    activeTool={activeTool}
                    onSelectTool={(t) => { setActiveTool(t); setShowDrawMenu(false); }}
                    drawings={drawings}
                    onClearAll={() => { clearAll(); setShowDrawMenu(false); }}
                    onDeleteDrawing={deleteDrawing}
                    drawingCount={drawings.length}
                    showList={showList}
                    onToggleList={toggleList}
                  />
                </div>
              )}
            </div>
          )}
          {/* Chart Mode Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowModeMenu(prev => !prev)}
              className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono rounded transition-all text-marble/40 hover:text-marble/70 border border-transparent"
              title="Chart mode"
            >
              {(() => {
                const modes = [
                  { mode: 'area' as ChartMode, icon: LineChart },
                  { mode: 'candlestick' as ChartMode, icon: CandlestickChart },
                  { mode: 'ohlc' as ChartMode, icon: BarChart2 },
                  { mode: 'heikinashi' as ChartMode, icon: BarChart3 },
                  { mode: 'renko' as ChartMode, icon: Layers },
                ];
                const cur = modes.find(m => m.mode === chartMode) || modes[0];
                const CurIcon = cur.icon;
                return <CurIcon className="w-3.5 h-3.5 text-gold" />;
              })()}
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
            {showModeMenu && (
              <div className="absolute right-0 top-full mt-1 z-[60] bg-navy-dark border border-gold/30 rounded-lg shadow-xl overflow-hidden min-w-[130px]">
                {([
                  { mode: 'area' as ChartMode, icon: LineChart, tip: 'Area' },
                  { mode: 'candlestick' as ChartMode, icon: CandlestickChart, tip: 'Candlestick' },
                  { mode: 'ohlc' as ChartMode, icon: BarChart2, tip: 'OHLC' },
                  { mode: 'heikinashi' as ChartMode, icon: BarChart3, tip: 'Heikin-Ashi' },
                  { mode: 'renko' as ChartMode, icon: Layers, tip: 'Renko' },
                ]).map(({ mode, icon: Icon, tip }) => (
                  <button key={mode} onClick={() => { setChartMode(mode); setShowModeMenu(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[10px] font-mono tracking-wider transition-colors ${
                      chartMode === mode ? 'bg-gold/10 text-gold' : 'text-marble/50 hover:bg-gold/5 hover:text-marble'
                    }`}>
                    <Icon className="w-3.5 h-3.5" />
                    {tip}
                    {chartMode === mode && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Timeframe Dropdown */}
          <div className="relative" ref={tfMenuRef}>
            <button onClick={() => setTfMenuOpen(!tfMenuOpen)}
              className={`px-2 py-0.5 text-[9px] font-mono tracking-wider rounded transition-all flex items-center gap-1 ${
                tf === 'RT' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-gold/15 text-gold border border-gold/30'
              }`}>
              {tf} <ChevronDown className="w-2.5 h-2.5" />
            </button>
            {tfMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-[60] bg-navy-dark border border-gold/30 rounded-lg shadow-xl overflow-hidden min-w-[100px] max-h-[300px] overflow-y-auto">
                <div className="px-3 py-1 text-[7px] font-display tracking-wider text-marble/25 bg-navy-dark/80 sticky top-0">INTRADAY</div>
                {(['RT','1m','5m','15m','30m'] as Timeframe[]).map(t => (
                  <button key={t} onClick={() => { setTf(t); setTfMenuOpen(false); }}
                    className={`w-full px-3 py-1.5 text-left text-[10px] font-mono tracking-wider transition-colors ${
                      tf === t ? t === 'RT' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gold/10 text-gold' : 'text-marble/50 hover:bg-gold/5'
                    }`}>{t}{t === 'RT' ? ' ●' : ''}</button>
                ))}
                <div className="px-3 py-1 text-[7px] font-display tracking-wider text-marble/25 bg-navy-dark/80 sticky top-0 border-t border-gold/10">HOURLY</div>
                {(['1H','2H','3H','4H','6H','8H'] as Timeframe[]).map(t => (
                  <button key={t} onClick={() => { setTf(t); setTfMenuOpen(false); }}
                    className={`w-full px-3 py-1.5 text-left text-[10px] font-mono tracking-wider transition-colors ${
                      tf === t ? 'bg-gold/10 text-gold' : 'text-marble/50 hover:bg-gold/5'
                    }`}>{t}</button>
                ))}
                <div className="px-3 py-1 text-[7px] font-display tracking-wider text-marble/25 bg-navy-dark/80 sticky top-0 border-t border-gold/10">DAILY+</div>
                {(['1D','1W','1M'] as Timeframe[]).map(t => (
                  <button key={t} onClick={() => { setTf(t); setTfMenuOpen(false); }}
                    className={`w-full px-3 py-1.5 text-left text-[10px] font-mono tracking-wider transition-colors ${
                      tf === t ? 'bg-gold/10 text-gold' : 'text-marble/50 hover:bg-gold/5'
                    }`}>{t}</button>
                ))}
                <div className="px-3 py-1 text-[7px] font-display tracking-wider text-marble/25 bg-navy-dark/80 sticky top-0 border-t border-gold/10">EXTENDED</div>
                {(['3M','6M','1Y','YTD','ALL'] as Timeframe[]).map(t => (
                  <button key={t} onClick={() => { setTf(t); setTfMenuOpen(false); }}
                    className={`w-full px-3 py-1.5 text-left text-[10px] font-mono tracking-wider transition-colors ${
                      tf === t ? 'bg-gold/10 text-gold' : 'text-marble/50 hover:bg-gold/5'
                    }`}>{t}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Indicator toggle bar */}
      <div className="border-b border-gold/5 flex-shrink-0">
        <IndicatorToggleBar active={activeIndicators} onToggle={toggleIndicator} />
      </div>

      {/* Chart */}
      <div className={`px-1 py-1 ${hasActiveOscillators(activeIndicators) ? '' : 'flex-1'}`} style={{ cursor: activeTool ? 'crosshair' : 'default', flex: hasActiveOscillators(activeIndicators) ? '1 1 70%' : undefined, minHeight: 0 }}>
        {price === 0 || liveCandles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            <span className="text-marble/30 text-xs font-display tracking-[0.2em]">LOADING MARKET DATA</span>
            <span className="text-marble/15 text-[9px] font-mono">Connecting to price feed...</span>
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
              {chartMode === 'heikinashi' && (
                <Customized component={(props: any) => {
                  const { xAxisMap, yAxisMap } = props;
                  const xAxis = xAxisMap && Object.values(xAxisMap)[0] as any;
                  const yAxis = yAxisMap && Object.values(yAxisMap)[0] as any;
                  if (!xAxis?.scale || !yAxis?.scale) return null;
                  const barW = Math.max(Math.floor((xAxis.width || 600) / chartData.length * 0.6), 3);
                  return <HeikinAshiLayer data={chartData as any} xScale={(i: number) => xAxis.scale(chartData[i]?.time)} yScale={yAxis.scale} barWidth={barW} />;
                }} />
              )}
              {chartMode === 'renko' && (
                <Customized component={(props: any) => {
                  const { xAxisMap, yAxisMap } = props;
                  const xAxis = xAxisMap && Object.values(xAxisMap)[0] as any;
                  const yAxis = yAxisMap && Object.values(yAxisMap)[0] as any;
                  if (!xAxis?.scale || !yAxis?.scale) return null;
                  const barW = Math.max(Math.floor((xAxis.width || 600) / chartData.length * 0.6), 3);
                  return <RenkoLayer data={chartData as any} xScale={(i: number) => xAxis.scale(chartData[i]?.time)} yScale={yAxis.scale} barWidth={barW} />;
                }} />
              )}
              {chartMode !== 'area' && (
                <>
                  <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1} strokeOpacity={0.4} dot={false} connectNulls isAnimationActive={false} />
                  <Area type="monotone" dataKey="value" stroke="transparent" strokeWidth={0} fill="transparent" dot={false} activeDot={{ r: 3, fill: color, stroke: 'hsl(213, 32%, 16%)', strokeWidth: 2 }} isAnimationActive={false} />
                </>
              )}
              {indicatorLines}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Oscillator Sub-Panel */}
      {hasActiveOscillators(activeIndicators) && chartData.length > 0 && (
        <div className="border-t border-gold/10 overflow-y-auto" style={{ flex: '0 0 auto', maxHeight: '30%' }}>
          <OscillatorPanel data={chartData} activeIndicators={activeIndicators} />
        </div>
      )}

      {/* Bottom info bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-gold/10 flex-shrink-0">
        <span className="text-[9px] font-display tracking-wider text-marble/20 uppercase">
          {category} · {tf === 'RT' ? 'REALTIME' : tf}
          {tf === 'RT' && <span className="ml-1 text-emerald-400 animate-pulse">●</span>}
        </span>
        <div className="flex items-center gap-3">
          {price > 0 && (
            <span className="text-[8px] font-mono text-marble/15">
              SPREAD: {(price * 0.0002).toFixed(price < 10 ? 4 : 2)}
            </span>
          )}
          <span className="text-[8px] font-mono text-marble/15">
            {isWsLive ? 'WS' : 'SIM'} · {liveCandles.length} bars
          </span>
          {activeIndicators.size > 0 && (
            <span className="text-[8px] font-mono text-gold/30">{activeIndicators.size} indicator{activeIndicators.size !== 1 ? 's' : ''}</span>
          )}
          <span className="text-[9px] font-mono text-marble/15">GOLD ARROW LIVE</span>
        </div>
      </div>
    </div>
  );
};

export default GALiveChart;
