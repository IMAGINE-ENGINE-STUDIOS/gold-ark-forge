import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Customized } from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, Wifi, Search, X, CandlestickChart, LineChart, BarChart2 } from 'lucide-react';
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
import { CandlestickLayer, OHLCLayer, type ChartMode } from './CandlestickRenderer';

interface Props {
  symbolKey: string;
  category: string;
  label: string;
  onSymbolChange?: (sym: WatchlistSymbol) => void;
}

const timeframes = ['1H', '4H', '1D', '1W', '1M'] as const;
type Timeframe = (typeof timeframes)[number];

interface TFConfig {
  points: number;
  intervalMs: number;
  noiseScale: number;
  labelFn: (d: Date) => string;
}

const tfConfigs: Record<Timeframe, TFConfig> = {
  '1H': { points: 12, intervalMs: 5 * 60_000, noiseScale: 0.001, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '4H': { points: 48, intervalMs: 5 * 60_000, noiseScale: 0.002, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '1D': { points: 96, intervalMs: 15 * 60_000, noiseScale: 0.003, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '1W': { points: 84, intervalMs: 2 * 3_600_000, noiseScale: 0.008, labelFn: (d) => d.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' }) },
  '1M': { points: 120, intervalMs: 6 * 3_600_000, noiseScale: 0.015, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
};

// Use CATEGORY_COLORS from tradingSymbols.ts

const generateChartData = (price: number, change: number, tf: Timeframe): ChartDataPoint[] => {
  const cfg = tfConfigs[tf];
  const data: ChartDataPoint[] = [];
  const startPrice = price / (1 + change / 100);
  const now = Date.now();
  for (let i = 0; i < cfg.points; i++) {
    const progress = i / (cfg.points - 1);
    const trend = startPrice + (price - startPrice) * progress;
    const noise = Math.sin(i * 2.3 + progress * 5) * price * cfg.noiseScale + Math.cos(i * 1.1) * price * cfg.noiseScale * 0.7;
    const volatility = Math.sin(i * 0.5 + progress * 3) * price * cfg.noiseScale * 0.5;
    const value = trend + noise + volatility;
    const time = new Date(now - (cfg.points - i) * cfg.intervalMs);
    const openNoise = Math.sin(i * 1.7) * price * cfg.noiseScale * 0.3;
    const open = parseFloat((value + openNoise).toFixed(2));
    const close = parseFloat(value.toFixed(2));
    const high = parseFloat((Math.max(open, close) + Math.abs(noise) * 0.5).toFixed(2));
    const low = parseFloat((Math.min(open, close) - Math.abs(noise) * 0.5).toFixed(2));
    data.push({
      time: cfg.labelFn(time),
      value: close,
      open,
      close,
      high,
      low,
    });
  }
  return data;
};

// Removed inline computeRSI — using proper computeRSIArray from IndicatorOverlay

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

const ProprietaryChart = ({ symbolKey, category, label, onSymbolChange }: Props) => {
  const [tf, setTf] = useState<Timeframe>('1D');
  const [chartMode, setChartMode] = useState<ChartMode>('area');
  const [activeIndicators, setActiveIndicators] = useState<Set<IndicatorKey>>(new Set());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
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
    // Check WebSocket first (sub-second updates for crypto)
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
    // Use expanded synthetic prices for stocks, bonds, forex
    const sp = SYNTHETIC_PRICES[symbolKey] ?? { p: 100, c: 0 };
    return { basePrice: sp.p, baseChange: sp.c };
  }, [symbolKey, category, metalPrices, cryptoData, oilPrices, wsData]);

  // Simulated sub-second streaming for non-WebSocket assets
  const { price: streamedPrice, change: streamedChange } = useSimulatedStream(basePrice, baseChange, symbolKey);
  const isWsLive = !!wsData && wsData.price > 0;
  const price = isWsLive ? wsData.price : streamedPrice;
  const change = isWsLive ? wsData.change24h : streamedChange;

  const rawChartData = useMemo(() => generateChartData(price, change, tf), [price, change, tf]);
  const chartData = useMemo(() => enrichChartData(rawChartData, activeIndicators), [rawChartData, activeIndicators]);

  const color = CATEGORY_COLORS[category] ?? 'hsl(43, 72%, 50%)';
  const gradientId = `prop-grad-${symbolKey}`;

  const chartValues = rawChartData.map((d) => d.value);
  const chartHighs = rawChartData.map((d) => d.high);
  const chartLows = rawChartData.map((d) => d.low);

  // Real-time computed indicators from streaming chart data
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
          const low = Math.min(y1, y2);
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-gold/10 flex-shrink-0">
        <div className="flex items-center gap-2">
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
        </div>
        <div className="flex items-center gap-3">
          {/* Indicators */}
          <div className="hidden lg:flex items-center gap-2 mr-2">
            <span className="text-[9px] font-mono text-marble/30">RSI <span className={headerStats.rsi > 70 ? 'text-red-400' : headerStats.rsi < 30 ? 'text-emerald-400' : 'text-marble/50'}>{headerStats.rsi.toFixed(1)}</span></span>
            <span className="text-[9px] font-mono text-marble/30">SMA20 <span className={price > headerStats.sma20 ? 'text-emerald-400' : 'text-red-400'}>${headerStats.sma20.toFixed(2)}</span></span>
            <span className="text-[9px] font-mono text-marble/30">EMA20 <span className={price > headerStats.ema20 ? 'text-emerald-400' : 'text-red-400'}>${headerStats.ema20.toFixed(2)}</span></span>
            <span className="text-[9px] font-mono text-marble/30">ATR <span className="text-marble/50">{headerStats.atr.toFixed(2)}</span></span>
            <span className={`text-[9px] font-mono ${headerStats.macdCross === 'bullish' ? 'text-emerald-400' : 'text-red-400'}`}>
              MACD {headerStats.macdCross === 'bullish' ? '▲' : '▼'}
            </span>
          </div>
          {/* Pending click indicator */}
          {pendingClick !== null && activeTool && (
            <span className="text-[8px] font-mono text-gold animate-pulse bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
              Click 2nd point · ${ pendingClick.toFixed(2)}
            </span>
          )}
          {/* Drawing tools (desktop only) */}
          {!isMobile && (
            <ChartDrawingTools
              activeTool={activeTool}
              onSelectTool={setActiveTool}
              drawings={drawings}
              onClearAll={clearAll}
              onDeleteDrawing={deleteDrawing}
              drawingCount={drawings.length}
              showList={showList}
              onToggleList={toggleList}
            />
          )}
          {/* Chart mode toggle */}
          <div className="flex gap-0.5 mr-1">
            {([
              { mode: 'area' as ChartMode, icon: LineChart, tip: 'Area' },
              { mode: 'candlestick' as ChartMode, icon: CandlestickChart, tip: 'Candles' },
              { mode: 'ohlc' as ChartMode, icon: BarChart2, tip: 'OHLC' },
            ]).map(({ mode, icon: Icon, tip }) => (
              <button
                key={mode}
                onClick={() => setChartMode(mode)}
                className={`p-1 rounded transition-all ${
                  chartMode === mode ? 'bg-gold/15 text-gold' : 'text-marble/25 hover:text-marble/50'
                }`}
                title={tip}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
          {/* Timeframe selector */}
          <div className="flex gap-0.5">
            {timeframes.map((t) => (
              <button
                key={t}
                onClick={() => setTf(t)}
                className={`px-2 py-0.5 text-[9px] font-mono tracking-wider rounded transition-all ${
                  tf === t ? 'bg-gold/15 text-gold border border-gold/30' : 'text-marble/30 hover:text-marble/60 border border-transparent'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Indicator toggle bar */}
      <div className="border-b border-gold/5 flex-shrink-0">
        <IndicatorToggleBar active={activeIndicators} onToggle={toggleIndicator} />
      </div>

      {/* Chart */}
      <div className="flex-1 px-1 py-1" style={{ cursor: activeTool ? 'crosshair' : 'default' }}>
        {price === 0 ? (
          <div className="h-full flex items-center justify-center text-marble/20 text-xs font-display tracking-wider">
            LOADING MARKET DATA...
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
              <XAxis
                dataKey="time"
                tick={{ fontSize: 9, fill: 'hsl(40,25%,96%,0.2)' }}
                axisLine={{ stroke: 'hsl(213, 28%, 24%)' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 9, fill: 'hsl(40,25%,96%,0.2)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
                width={65}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Drawing reference lines */}
              {drawingRefLines.map((rl, i) => (
                <ReferenceLine key={`dr-${i}`} y={rl.y} stroke={rl.stroke} strokeDasharray={rl.strokeDasharray} strokeWidth={rl.strokeWidth} label={rl.label} />
              ))}

              {/* Fibonacci levels */}
              {fibLines}

              {/* Main chart rendering based on mode */}
              {chartMode === 'area' && (
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 4, fill: color, stroke: 'hsl(213, 32%, 16%)', strokeWidth: 2 }} />
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
              {/* Transparent area for hover tooltip on candle/OHLC modes */}
              {chartMode !== 'area' && (
                <Area type="monotone" dataKey="value" stroke="transparent" strokeWidth={0} fill="transparent" dot={false} activeDot={{ r: 3, fill: color, stroke: 'hsl(213, 32%, 16%)', strokeWidth: 2 }} />
              )}

              {/* Indicator overlays */}
              {indicatorLines}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-gold/10 flex-shrink-0">
        <span className="text-[9px] font-display tracking-wider text-marble/20 uppercase">{category} · {tf}</span>
        <div className="flex items-center gap-3">
          {activeIndicators.size > 0 && (
            <span className="text-[8px] font-mono text-gold/30">{activeIndicators.size} indicator{activeIndicators.size !== 1 ? 's' : ''}</span>
          )}
          <span className="text-[9px] font-mono text-marble/15">GOLD ARROW PROPRIETARY</span>
        </div>
      </div>
    </div>
  );
};

export default ProprietaryChart;
