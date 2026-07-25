/**
 * TVLiteChart — TradingView-style chart built on lightweight-charts.
 *
 * Renders real candles + live tick from the shared FeedRouter / useLiveMarketData
 * pipeline. Bootstraps historical bars via useHistoricalBars for non-crypto,
 * and via CoinGecko sparklines (already flowing through useLiveMarketData for
 * crypto). The last candle is mutated on every incoming tick so the chart
 * ticks live exactly like TradingView.
 *
 * Kept prop-compatible with the previous GALiveChart so TradingBridge.tsx and
 * any other consumer keeps working without changes.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type CandlestickData,
  type LineData,
} from 'lightweight-charts';
import { CandlestickChart, LineChart as LineIcon, AreaChart, Activity } from 'lucide-react';
import { useHistoricalBars } from '@/hooks/useHistoricalBars';
import { useCryptoData } from '@/hooks/useCryptoData';
import { FeedRouter } from '@/lib/feeds/router';
import type { WatchlistSymbol } from '@/data/tradingSymbols';
import SymbolLogo from './SymbolLogo';

type ChartKind = 'candles' | 'line' | 'area';
type TF = 'RT' | '1H' | '4H' | '1D' | '1W' | '1M';

interface Props {
  symbolKey: string;
  category: string;
  label: string;
  livePrice?: number;
  liveChange?: number;
  onSymbolChange?: (sym: WatchlistSymbol) => void;
  headerLeftSlot?: ReactNode;
  headerRightSlot?: ReactNode;
}

const TF_META: Record<TF, { bucketMs: number; label: string }> = {
  RT: { bucketMs: 1_000, label: '1s' },
  '1H': { bucketMs: 60_000, label: '1m' },
  '4H': { bucketMs: 5 * 60_000, label: '5m' },
  '1D': { bucketMs: 15 * 60_000, label: '15m' },
  '1W': { bucketMs: 60 * 60_000, label: '1h' },
  '1M': { bucketMs: 4 * 60 * 60_000, label: '4h' },
};

// Try common candidates against FeedRouter for a symbol key.
const CRYPTO_BASE: Record<string, string> = {
  bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', xrp: 'XRP', bnb: 'BNB',
  cardano: 'ADA', avalanche: 'AVAX', polkadot: 'DOT', chainlink: 'LINK',
  dogecoin: 'DOGE', polygon: 'MATIC', litecoin: 'LTC',
};
const METAL_FEED: Record<string, string> = {
  gold: 'XAU/USD', silver: 'XAG/USD', platinum: 'XPT/USD', palladium: 'XPD/USD',
};

function feedCandidates(symbolKey: string, category: string): string[] {
  const k = symbolKey.toLowerCase();
  if (category === 'crypto' || category === 'defi') {
    const b = CRYPTO_BASE[k] ?? k.toUpperCase();
    return [`${b}/USD`, `${b}/USDT`];
  }
  if (category === 'metals' && METAL_FEED[k]) return [METAL_FEED[k]];
  return [symbolKey.toUpperCase(), k];
}

function latestTick(symbolKey: string, category: string): number | undefined {
  for (const c of feedCandidates(symbolKey, category)) {
    const t = FeedRouter.latest(c);
    if (t && Number.isFinite(t.last) && t.last > 0) return t.last;
  }
  return undefined;
}

function subscribeTicks(symbolKey: string, category: string, fn: (price: number) => void): () => void {
  const unsubs: Array<() => void> = [];
  for (const c of feedCandidates(symbolKey, category)) {
    unsubs.push(FeedRouter.subscribe(c, (tick) => {
      if (Number.isFinite(tick.last) && tick.last > 0) fn(tick.last);
    }));
  }
  return () => { for (const u of unsubs) u(); };
}

function seedFromCloses(closes: number[], highs: number[] | undefined, lows: number[] | undefined, bucketMs: number, live?: number): CandlestickData<UTCTimestamp>[] {
  if (!closes?.length) return [];
  const now = Math.floor(Date.now() / bucketMs) * bucketMs;
  const out: CandlestickData<UTCTimestamp>[] = [];
  for (let i = 0; i < closes.length; i++) {
    const c = closes[i];
    const prev = i > 0 ? closes[i - 1] : c;
    const o = prev;
    const h = highs?.[i] ?? Math.max(o, c);
    const l = lows?.[i] ?? Math.min(o, c);
    const time = ((now - (closes.length - 1 - i) * bucketMs) / 1000) as UTCTimestamp;
    out.push({ time, open: o, high: h, low: l, close: c });
  }
  if (live && Number.isFinite(live) && live > 0) {
    const last = out[out.length - 1];
    last.close = live;
    last.high = Math.max(last.high, live);
    last.low = Math.min(last.low, live);
  }
  return out;
}

export default function TVLiteChart({
  symbolKey, category, label, livePrice, liveChange, headerLeftSlot, headerRightSlot,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick' | 'Line' | 'Area'> | null>(null);
  const currentBarRef = useRef<CandlestickData<UTCTimestamp> | null>(null);
  const [kind, setKind] = useState<ChartKind>('candles');
  const [tf, setTf] = useState<TF>('RT');
  const [lastPrice, setLastPrice] = useState<number | undefined>(livePrice);

  const { data: bars } = useHistoricalBars(symbolKey, category !== 'crypto');
  const { data: cryptoAll } = useCryptoData(50);

  // Seed closes: Yahoo bars for non-crypto, CoinGecko sparklines for crypto.
  const seed = useMemo(() => {
    if (bars?.closes?.length) return { closes: bars.closes, highs: bars.highs, lows: bars.lows };
    if (category === 'crypto' && cryptoAll) {
      const coin = cryptoAll.find((c: any) => c.id === symbolKey || c.symbol?.toLowerCase() === symbolKey.toLowerCase());
      const sp = coin?.sparkline_in_7d?.price as number[] | undefined;
      if (sp?.length) return { closes: sp, highs: undefined, lows: undefined };
    }
    return null;
  }, [bars, cryptoAll, category, symbolKey]);

  // Build chart once.
  useEffect(() => {
    if (!wrapRef.current) return;
    const chart = createChart(wrapRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: 'hsl(45 30% 75%)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'hsla(45, 40%, 50%, 0.06)' },
        horzLines: { color: 'hsla(45, 40%, 50%, 0.08)' },
      },
      rightPriceScale: { borderColor: 'hsla(45, 40%, 50%, 0.2)', scaleMargins: { top: 0.08, bottom: 0.08 } },
      timeScale: { borderColor: 'hsla(45, 40%, 50%, 0.2)', timeVisible: true, secondsVisible: true, rightOffset: 6 },
      crosshair: { mode: CrosshairMode.Normal },
      autoSize: true,
    });
    chartRef.current = chart;

    const ro = new ResizeObserver(() => chart.applyOptions({}));
    ro.observe(wrapRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      currentBarRef.current = null;
    };
  }, []);

  // Rebuild series when kind, tf, symbol or seed changes.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (seriesRef.current) {
      try { chart.removeSeries(seriesRef.current as any); } catch {}
      seriesRef.current = null;
    }
    const bucketMs = TF_META[tf].bucketMs;
    const live = latestTick(symbolKey, category) ?? livePrice;
    const data = seed ? seedFromCloses(seed.closes, seed.highs, seed.lows, bucketMs, live) : [];

    if (kind === 'candles') {
      const s = chart.addSeries(CandlestickSeries, {
        upColor: 'hsl(140 70% 45%)', downColor: 'hsl(0 75% 55%)',
        borderUpColor: 'hsl(140 70% 45%)', borderDownColor: 'hsl(0 75% 55%)',
        wickUpColor: 'hsl(140 70% 45%)', wickDownColor: 'hsl(0 75% 55%)',
      });
      s.setData(data);
      seriesRef.current = s as any;
    } else if (kind === 'line') {
      const s = chart.addSeries(LineSeries, { color: 'hsl(45 90% 55%)', lineWidth: 2 });
      s.setData(data.map<LineData<UTCTimestamp>>(d => ({ time: d.time, value: d.close })));
      seriesRef.current = s as any;
    } else {
      const s = chart.addSeries(AreaSeries, {
        lineColor: 'hsl(45 90% 55%)',
        topColor: 'hsla(45, 90%, 55%, 0.4)',
        bottomColor: 'hsla(45, 90%, 55%, 0.02)',
        lineWidth: 2,
      });
      s.setData(data.map<LineData<UTCTimestamp>>(d => ({ time: d.time, value: d.close })));
      seriesRef.current = s as any;
    }

    currentBarRef.current = data.length ? { ...data[data.length - 1] } : null;
    chart.timeScale().fitContent();
  }, [kind, tf, symbolKey, category, seed, livePrice]);

  // Live-tick loop — update the current bar on every incoming tick from FeedRouter.
  useEffect(() => {
    const bucketMs = TF_META[tf].bucketMs;
    let raf = 0;
    let pending: number | null = null;

    const applyPrice = (price: number) => {
      if (!Number.isFinite(price) || price <= 0) return;
      pending = price;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const p = pending!; pending = null;
        setLastPrice(p);
        const s = seriesRef.current;
        const cur = currentBarRef.current;
        if (!s) return;
        const nowBucket = (Math.floor(Date.now() / bucketMs) * bucketMs / 1000) as UTCTimestamp;
        if (!cur || (cur.time as number) < (nowBucket as number)) {
          const next: CandlestickData<UTCTimestamp> = {
            time: nowBucket,
            open: cur ? cur.close : p,
            high: p, low: p, close: p,
          };
          currentBarRef.current = next;
          if (kind === 'candles') (s as ISeriesApi<'Candlestick'>).update(next);
          else (s as ISeriesApi<'Line'>).update({ time: next.time, value: p });
        } else {
          cur.close = p;
          if (p > cur.high) cur.high = p;
          if (p < cur.low) cur.low = p;
          if (kind === 'candles') (s as ISeriesApi<'Candlestick'>).update(cur);
          else (s as ISeriesApi<'Line'>).update({ time: cur.time, value: p });
        }
      });
    };

    const unsub = subscribeTicks(symbolKey, category, applyPrice);
    // Seed initial from external livePrice as well.
    if (livePrice) applyPrice(livePrice);
    return () => { unsub(); if (raf) cancelAnimationFrame(raf); };
  }, [symbolKey, category, tf, kind, livePrice]);

  const displayPrice = lastPrice ?? livePrice;
  const changePos = (liveChange ?? 0) >= 0;

  return (
    <div className="h-full w-full flex flex-col bg-navy-dark/40">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-gold/15 backdrop-blur-md bg-navy-dark/70">
        {headerLeftSlot}
        <div className="flex items-center gap-2 min-w-0">
          <SymbolLogo symbolKey={symbolKey} category={category} ticker={label} size={22} />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[11px] font-display tracking-[0.14em] text-gold truncate">{label}</span>
            <span className="text-[8px] text-gold/40 uppercase tracking-widest">{category} · {TF_META[tf].label}</span>
          </div>
        </div>
        <div className="flex items-baseline gap-2 ml-2">
          <span className="text-lg font-mono tabular-nums text-white">
            {displayPrice ? displayPrice.toLocaleString(undefined, { maximumFractionDigits: displayPrice < 10 ? 4 : 2 }) : '—'}
          </span>
          {liveChange !== undefined && (
            <span className={`text-[10px] font-mono tabular-nums ${changePos ? 'text-emerald-400' : 'text-red-400'}`}>
              {changePos ? '+' : ''}{liveChange.toFixed(2)}%
            </span>
          )}
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" title="LIVE" />
        </div>

        <div className="ml-auto flex items-center gap-1">
          {/* Timeframe */}
          <div className="flex items-center gap-0.5 mr-2">
            {(Object.keys(TF_META) as TF[]).map(t => (
              <button key={t} onClick={() => setTf(t)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wide transition-colors ${
                  tf === t ? 'bg-gold/25 text-gold border border-gold/50' : 'text-gold/50 hover:text-gold hover:bg-gold/10'
                }`}>{t}</button>
            ))}
          </div>
          {/* Chart kind */}
          <div className="flex items-center gap-0.5 border-l border-gold/20 pl-2">
            <button onClick={() => setKind('candles')} title="Candles"
              className={`p-1 rounded ${kind === 'candles' ? 'bg-gold/25 text-gold' : 'text-gold/50 hover:text-gold'}`}>
              <CandlestickChart className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setKind('line')} title="Line"
              className={`p-1 rounded ${kind === 'line' ? 'bg-gold/25 text-gold' : 'text-gold/50 hover:text-gold'}`}>
              <LineIcon className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setKind('area')} title="Area"
              className={`p-1 rounded ${kind === 'area' ? 'bg-gold/25 text-gold' : 'text-gold/50 hover:text-gold'}`}>
              <AreaChart className="w-3.5 h-3.5" />
            </button>
          </div>
          {headerRightSlot}
        </div>
      </div>

      {/* Chart canvas */}
      <div className="flex-1 min-h-0 relative">
        <div ref={wrapRef} className="absolute inset-0" />
        {!seed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 text-[10px] font-mono text-gold/50">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              WAITING FOR HISTORICAL DATA…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}