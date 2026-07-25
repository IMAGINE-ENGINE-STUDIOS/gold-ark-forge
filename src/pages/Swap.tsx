import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { bootstrapFeeds, useMarketFeed } from "@/hooks/useMarketFeed";
import type { AssetClass } from "@/lib/feeds/types";

/**
 * SWAP — a clean, TradingView-powered trading page.
 * - Chart: official TradingView Advanced Chart widget (guaranteed live data)
 * - Symbol list: curated to only tickers TradingView streams live for free
 * - Order ticket: local paper trade (kept intentionally simple + reliable)
 */

type Cat = "Crypto" | "Metals" | "Energy" | "FX" | "Index" | "Stocks" | "ETF" | "Futures";

interface Sym {
  label: string;
  tv: string; // TradingView symbol
  cat: Cat;
}

const SYMBOLS: Sym[] = [
  // Crypto
  { label: "BTC / USDT", tv: "BINANCE:BTCUSDT", cat: "Crypto" },
  { label: "ETH / USDT", tv: "BINANCE:ETHUSDT", cat: "Crypto" },
  { label: "SOL / USDT", tv: "BINANCE:SOLUSDT", cat: "Crypto" },
  { label: "XRP / USDT", tv: "BINANCE:XRPUSDT", cat: "Crypto" },
  { label: "BNB / USDT", tv: "BINANCE:BNBUSDT", cat: "Crypto" },
  { label: "ADA / USDT", tv: "BINANCE:ADAUSDT", cat: "Crypto" },
  { label: "DOGE / USDT", tv: "BINANCE:DOGEUSDT", cat: "Crypto" },
  { label: "AVAX / USDT", tv: "BINANCE:AVAXUSDT", cat: "Crypto" },
  // Metals
  { label: "Gold Spot", tv: "OANDA:XAUUSD", cat: "Metals" },
  { label: "Silver Spot", tv: "OANDA:XAGUSD", cat: "Metals" },
  { label: "Platinum", tv: "TVC:PLATINUM", cat: "Metals" },
  { label: "Palladium", tv: "TVC:PALLADIUM", cat: "Metals" },
  { label: "Copper", tv: "COMEX:HG1!", cat: "Metals" },
  // Energy
  { label: "WTI Crude", tv: "TVC:USOIL", cat: "Energy" },
  { label: "Brent Crude", tv: "TVC:UKOIL", cat: "Energy" },
  { label: "Natural Gas", tv: "NYMEX:NG1!", cat: "Energy" },
  // FX
  { label: "EUR / USD", tv: "OANDA:EURUSD", cat: "FX" },
  { label: "GBP / USD", tv: "OANDA:GBPUSD", cat: "FX" },
  { label: "USD / JPY", tv: "OANDA:USDJPY", cat: "FX" },
  { label: "USD / CHF", tv: "OANDA:USDCHF", cat: "FX" },
  { label: "AUD / USD", tv: "OANDA:AUDUSD", cat: "FX" },
  // Index
  { label: "S&P 500", tv: "TVC:SPX", cat: "Index" },
  { label: "Nasdaq 100", tv: "TVC:NDX", cat: "Index" },
  { label: "Dow Jones", tv: "TVC:DJI", cat: "Index" },
  { label: "VIX", tv: "TVC:VIX", cat: "Index" },
  { label: "DXY", tv: "TVC:DXY", cat: "Index" },
  // Stocks (TV free live/delayed via US exchanges)
  { label: "Apple", tv: "NASDAQ:AAPL", cat: "Stocks" },
  { label: "Microsoft", tv: "NASDAQ:MSFT", cat: "Stocks" },
  { label: "NVIDIA", tv: "NASDAQ:NVDA", cat: "Stocks" },
  { label: "Tesla", tv: "NASDAQ:TSLA", cat: "Stocks" },
  { label: "Amazon", tv: "NASDAQ:AMZN", cat: "Stocks" },
  { label: "Meta", tv: "NASDAQ:META", cat: "Stocks" },
  { label: "Alphabet", tv: "NASDAQ:GOOGL", cat: "Stocks" },
];

// Yahoo-tracked symbols (mirrored via TradingView tickers so charts stay live).
// Yahoo symbol -> TradingView symbol.
const YAHOO_SYMBOLS: (Sym & { yahoo: string })[] = [
  // ETFs
  { label: "SPY · S&P 500 ETF",    tv: "AMEX:SPY",   cat: "ETF",     yahoo: "SPY" },
  { label: "QQQ · Nasdaq 100 ETF", tv: "NASDAQ:QQQ", cat: "ETF",     yahoo: "QQQ" },
  { label: "DIA · Dow ETF",        tv: "AMEX:DIA",   cat: "ETF",     yahoo: "DIA" },
  { label: "IWM · Russell 2000",   tv: "AMEX:IWM",   cat: "ETF",     yahoo: "IWM" },
  { label: "GLD · Gold ETF",       tv: "AMEX:GLD",   cat: "ETF",     yahoo: "GLD" },
  { label: "SLV · Silver ETF",     tv: "AMEX:SLV",   cat: "ETF",     yahoo: "SLV" },
  { label: "USO · US Oil Fund",    tv: "AMEX:USO",   cat: "ETF",     yahoo: "USO" },
  { label: "UNG · Nat Gas Fund",   tv: "AMEX:UNG",   cat: "ETF",     yahoo: "UNG" },
  { label: "TLT · 20Y Treasuries", tv: "NASDAQ:TLT", cat: "ETF",     yahoo: "TLT" },
  { label: "HYG · High Yield",     tv: "AMEX:HYG",   cat: "ETF",     yahoo: "HYG" },
  // Indexes (Yahoo carets)
  { label: "S&P 500 Index",   tv: "SP:SPX",     cat: "Index",   yahoo: "^GSPC" },
  { label: "Nasdaq Composite", tv: "NASDAQ:IXIC", cat: "Index", yahoo: "^IXIC" },
  { label: "Dow Jones Index",  tv: "DJ:DJI",    cat: "Index",   yahoo: "^DJI" },
  { label: "Russell 2000",     tv: "TVC:RUT",   cat: "Index",   yahoo: "^RUT" },
  { label: "VIX Volatility",   tv: "TVC:VIX",   cat: "Index",   yahoo: "^VIX" },
  { label: "US Dollar Index",  tv: "TVC:DXY",   cat: "Index",   yahoo: "DX-Y.NYB" },
  // Futures
  { label: "Crude Oil (CL)",   tv: "NYMEX:CL1!", cat: "Futures", yahoo: "CL=F" },
  { label: "Brent (BZ)",       tv: "NYMEX:BZ1!", cat: "Futures", yahoo: "BZ=F" },
  { label: "Nat Gas (NG)",     tv: "NYMEX:NG1!", cat: "Futures", yahoo: "NG=F" },
  { label: "Gold Futures (GC)",  tv: "COMEX:GC1!", cat: "Futures", yahoo: "GC=F" },
  { label: "Silver Futures (SI)",tv: "COMEX:SI1!", cat: "Futures", yahoo: "SI=F" },
  { label: "Copper (HG)",      tv: "COMEX:HG1!", cat: "Futures", yahoo: "HG=F" },
  { label: "Corn (ZC)",        tv: "CBOT:ZC1!",  cat: "Futures", yahoo: "ZC=F" },
  { label: "Wheat (ZW)",       tv: "CBOT:ZW1!",  cat: "Futures", yahoo: "ZW=F" },
  { label: "Soybeans (ZS)",    tv: "CBOT:ZS1!",  cat: "Futures", yahoo: "ZS=F" },
  // Extra US equities available on Yahoo
  { label: "Netflix",   tv: "NASDAQ:NFLX", cat: "Stocks", yahoo: "NFLX" },
  { label: "AMD",       tv: "NASDAQ:AMD",  cat: "Stocks", yahoo: "AMD" },
  { label: "Intel",     tv: "NASDAQ:INTC", cat: "Stocks", yahoo: "INTC" },
  { label: "Coinbase",  tv: "NASDAQ:COIN", cat: "Stocks", yahoo: "COIN" },
  { label: "MicroStrategy", tv: "NASDAQ:MSTR", cat: "Stocks", yahoo: "MSTR" },
  { label: "Palantir",  tv: "NASDAQ:PLTR", cat: "Stocks", yahoo: "PLTR" },
  { label: "JPMorgan",  tv: "NYSE:JPM",    cat: "Stocks", yahoo: "JPM" },
  { label: "Berkshire", tv: "NYSE:BRK.B",  cat: "Stocks", yahoo: "BRK-B" },
  { label: "Exxon",     tv: "NYSE:XOM",    cat: "Stocks", yahoo: "XOM" },
  { label: "Chevron",   tv: "NYSE:CVX",    cat: "Stocks", yahoo: "CVX" },
];

// Merge Yahoo-tracked symbols, deduped by TradingView ticker.
for (const y of YAHOO_SYMBOLS) {
  if (!SYMBOLS.some((s) => s.tv === y.tv)) SYMBOLS.push(y);
}

const CAT_TO_ASSET: Record<Cat, AssetClass> = {
  Crypto: "crypto",
  Metals: "metals",
  Energy: "energy",
  FX: "fx",
  Index: "index",
  Stocks: "stocks",
  ETF: "stocks",
  Futures: "energy",
};

// Map crypto TV symbols to Binance WS pairs for true sub-second ticks.
function cryptoPairFromTV(tv: string): string | null {
  const m = tv.match(/^BINANCE:([A-Z]+)(USDT|USD|BUSD)$/);
  if (!m) return null;
  return `${m[1]}/${m[2]}`;
}

const CATS: (Cat | "All")[] = ["All", "Crypto", "Metals", "Energy", "FX", "Index", "Stocks", "ETF", "Futures"];

/**
 * LiveTickChart — proprietary time-series chart driven purely by the LIVE
 * QUOTE ticker. Every incoming tick is plotted at its arrival timestamp so the
 * curve grows in real time. No external chart library required.
 */
function LiveTickChart({
  symbolKey,
  price,
  ts,
  label,
}: {
  symbolKey: string;
  price: number | undefined;
  ts: number | undefined;
  label: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 420 });
  const [pts, setPts] = useState<{ t: number; p: number }[]>([]);
  const [now, setNow] = useState(Date.now());
  const [windowMs, setWindowMs] = useState(5 * 60_000); // 5m rolling window
  const lastRef = useRef<number | undefined>(undefined);

  // Reset points when the symbol changes.
  useEffect(() => {
    setPts([]);
    lastRef.current = undefined;
  }, [symbolKey]);

  // Resize observer.
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: Math.max(200, r.width), h: Math.max(160, r.height) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Tick clock so the x-axis advances even without new prices.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  // Append new price samples as they arrive.
  useEffect(() => {
    if (price === undefined || !Number.isFinite(price) || ts === undefined) return;
    if (lastRef.current === ts) return;
    lastRef.current = ts;
    setPts((prev) => {
      const cutoff = Date.now() - windowMs - 5_000;
      const next = [...prev, { t: ts, p: price }].filter((x) => x.t >= cutoff);
      // Cap for perf
      return next.length > 4000 ? next.slice(next.length - 4000) : next;
    });
  }, [price, ts, windowMs]);

  const { w, h } = size;
  const padL = 52;
  const padR = 12;
  const padT = 12;
  const padB = 24;
  const iw = Math.max(1, w - padL - padR);
  const ih = Math.max(1, h - padT - padB);

  const tMax = now;
  const tMin = now - windowMs;
  const visible = pts.filter((x) => x.t >= tMin - 1000);
  const prices = visible.map((x) => x.p);
  const pMin = prices.length ? Math.min(...prices) : (price ?? 0);
  const pMax = prices.length ? Math.max(...prices) : (price ?? 1);
  const span = pMax - pMin || Math.max(1e-6, Math.abs(pMax) * 0.001);
  const yMin = pMin - span * 0.08;
  const yMax = pMax + span * 0.08;

  const xOf = (t: number) => padL + ((t - tMin) / windowMs) * iw;
  const yOf = (p: number) => padT + (1 - (p - yMin) / (yMax - yMin)) * ih;

  const path = visible.length
    ? visible.map((x, i) => `${i === 0 ? "M" : "L"}${xOf(x.t).toFixed(2)},${yOf(x.p).toFixed(2)}`).join(" ")
    : "";
  const area = visible.length
    ? `${path} L${xOf(visible[visible.length - 1].t).toFixed(2)},${(padT + ih).toFixed(2)} L${xOf(visible[0].t).toFixed(2)},${(padT + ih).toFixed(2)} Z`
    : "";

  const first = visible[0]?.p;
  const last = visible[visible.length - 1]?.p ?? price;
  const delta = first !== undefined && last !== undefined ? last - first : 0;
  const deltaPct = first ? (delta / first) * 100 : 0;
  const up = delta >= 0;
  const stroke = up ? "#34d399" : "#f87171";
  const fill = up ? "rgba(52,211,153,0.14)" : "rgba(248,113,113,0.14)";

  // Grid / ticks
  const ySteps = 5;
  const yTicks = Array.from({ length: ySteps + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / ySteps);
  const xSteps = 6;
  const xTicks = Array.from({ length: xSteps + 1 }, (_, i) => tMin + (windowMs * i) / xSteps);
  const fmtPrice = (v: number) =>
    v.toLocaleString(undefined, { maximumFractionDigits: Math.abs(v) < 10 ? 5 : 2 });
  const fmtTime = (t: number) =>
    new Date(t).toLocaleTimeString(undefined, { hour12: false, minute: "2-digit", second: "2-digit" });

  const RANGES: { label: string; ms: number }[] = [
    { label: "1M", ms: 60_000 },
    { label: "5M", ms: 5 * 60_000 },
    { label: "15M", ms: 15 * 60_000 },
    { label: "1H", ms: 60 * 60_000 },
  ];

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      {/* Range picker */}
      <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-md border border-white/10 bg-black/50 p-1 backdrop-blur">
        {RANGES.map((r) => (
          <button
            key={r.label}
            onClick={() => setWindowMs(r.ms)}
            className={`rounded px-2 py-0.5 text-[10px] font-medium tracking-wider ${
              windowMs === r.ms ? "bg-[#d4af37]/20 text-[#d4af37]" : "text-neutral-400 hover:text-neutral-100"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Header stats */}
      <div className="absolute left-3 top-3 z-10 flex items-baseline gap-3">
        <div className="text-[10px] tracking-widest text-neutral-500">{label}</div>
        <div className="tabular-nums text-lg font-semibold text-neutral-100">
          {last !== undefined ? fmtPrice(last) : "—"}
        </div>
        <div className={`tabular-nums text-xs font-medium ${up ? "text-emerald-300" : "text-rose-300"}`}>
          {first !== undefined && last !== undefined
            ? `${up ? "+" : ""}${delta.toFixed(Math.abs(delta) < 1 ? 4 : 2)} (${up ? "+" : ""}${deltaPct.toFixed(2)}%)`
            : ""}
        </div>
      </div>

      <svg width={w} height={h} className="block">
        <defs>
          <linearGradient id="ga-live-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {yTicks.map((v, i) => {
          const y = yOf(v);
          return (
            <g key={`y${i}`}>
              <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="rgba(212,175,55,0.06)" />
              <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#71717a">
                {fmtPrice(v)}
              </text>
            </g>
          );
        })}
        {xTicks.map((t, i) => {
          const x = xOf(t);
          return (
            <g key={`x${i}`}>
              <line x1={x} x2={x} y1={padT} y2={h - padB} stroke="rgba(255,255,255,0.03)" />
              <text x={x} y={h - padB + 12} textAnchor="middle" fontSize="9" fill="#71717a">
                {fmtTime(t)}
              </text>
            </g>
          );
        })}

        {/* Area + line */}
        {area && <path d={area} fill="url(#ga-live-fill)" opacity={0.9} />}
        {path && <path d={path} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />}

        {/* Current price marker */}
        {last !== undefined && visible.length > 0 && (() => {
          const cx = xOf(visible[visible.length - 1].t);
          const cy = yOf(last);
          return (
            <g>
              <line x1={padL} x2={w - padR} y1={cy} y2={cy} stroke={stroke} strokeDasharray="2 3" opacity={0.35} />
              <circle cx={cx} cy={cy} r={4} fill={stroke}>
                <animate attributeName="r" values="4;7;4" dur="1.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.4;1" dur="1.4s" repeatCount="indefinite" />
              </circle>
              <rect x={w - padR - 62} y={cy - 9} width={60} height={18} rx={3} fill={stroke} opacity={0.9} />
              <text x={w - padR - 32} y={cy + 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="#0a0a0c">
                {fmtPrice(last)}
              </text>
            </g>
          );
        })()}

        {visible.length === 0 && (
          <text x={w / 2} y={h / 2} textAnchor="middle" fontSize="11" fill="#52525b">
            Waiting for live ticks…
          </text>
        )}
      </svg>
    </div>
  );
}

function TVTicker({ symbol }: { symbol: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    ref.current.appendChild(inner);
    const s = document.createElement("script");
    s.src = "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js";
    s.async = true;
    s.type = "text/javascript";
    s.innerHTML = JSON.stringify({
      symbol,
      colorTheme: "dark",
      isTransparent: true,
      locale: "en",
      width: "100%",
    });
    ref.current.appendChild(s);
  }, [symbol]);
  return <div ref={ref} className="w-full" />;
}

interface Order {
  id: string;
  ts: number;
  side: "BUY" | "SELL";
  symbol: string;
  qty: number;
}

export default function Swap() {
  const [active, setActive] = useState<Sym>(SYMBOLS[0]);
  const [cat, setCat] = useState<Cat | "All">("All");
  const [q, setQ] = useState("");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [qty, setQty] = useState<string>("1");
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("swap.orders") ?? "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("swap.orders", JSON.stringify(orders.slice(0, 50)));
  }, [orders]);

  // Bootstrap live feeds. TradingView relay (~1s) covers all symbols;
  // Binance WS gives real sub-second ticks for crypto; metals hit gold-api.
  useEffect(() => {
    const cryptoPairs = Array.from(new Set(
      SYMBOLS.map(s => cryptoPairFromTV(s.tv)).filter((x): x is string => !!x),
    ));
    bootstrapFeeds({
      crypto: cryptoPairs,
      cryptoUsd: [],
      tradingView: SYMBOLS.map(s => ({
        symbol: s.tv,
        assetClass: CAT_TO_ASSET[s.cat],
        tvSymbols: [s.tv],
      })),
    });
  }, []);

  // Prefer Binance WS pair for crypto, otherwise the TV-keyed feed.
  const feedSymbol = cryptoPairFromTV(active.tv) ?? active.tv;
  const tick = useMarketFeed(feedSymbol);
  const livePrice = tick?.last;
  const liveChange = tick?.change24h;
  const liveAgeMs = tick ? Date.now() - tick.ts : undefined;
  const liveSource = tick?.source;

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return SYMBOLS.filter(
      (s) =>
        (cat === "All" || s.cat === cat) &&
        (!query || s.label.toLowerCase().includes(query) || s.tv.toLowerCase().includes(query)),
    );
  }, [cat, q]);

  const submit = () => {
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) return;
    setOrders((o) => [
      { id: crypto.randomUUID(), ts: Date.now(), side, symbol: active.label, qty: n },
      ...o,
    ]);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-100">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm font-semibold tracking-wider text-[#d4af37]">
            GOLD ARROW · SWAP
          </Link>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            {livePrice ? `LIVE · ${liveSource ?? "feed"}` : "CONNECTING…"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-neutral-400">{active.label} · {active.tv}</span>
          {livePrice !== undefined && (
            <span className="tabular-nums font-semibold text-neutral-100">
              {livePrice.toLocaleString(undefined, { maximumFractionDigits: livePrice < 10 ? 5 : 2 })}
            </span>
          )}
          {liveChange !== undefined && Number.isFinite(liveChange) && (
            <span className={`tabular-nums ${liveChange >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {liveChange >= 0 ? "+" : ""}{liveChange.toFixed(2)}%
            </span>
          )}
          {liveAgeMs !== undefined && (
            <span className="text-[10px] text-neutral-500">{liveAgeMs < 1500 ? "●" : "○"} {Math.max(0, Math.round(liveAgeMs))}ms</span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-3 p-3" style={{ height: "calc(100vh - 53px)" }}>
        {/* Left: symbols */}
        <aside className="col-span-3 flex flex-col overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
          <div className="p-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search symbol…"
              className="w-full rounded-lg border border-white/5 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-neutral-500 focus:border-[#d4af37]/50"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {CATS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`rounded-md px-2 py-1 text-[10px] font-medium tracking-wide ${
                    cat === c
                      ? "bg-[#d4af37]/20 text-[#d4af37]"
                      : "bg-white/5 text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {c.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {filtered.map((s) => (
              <button
                key={s.tv}
                onClick={() => setActive(s)}
                className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                  active.tv === s.tv
                    ? "bg-[#d4af37]/10 text-[#d4af37] ring-1 ring-[#d4af37]/40"
                    : "hover:bg-white/5"
                }`}
              >
                <div>
                  <div className="font-medium">{s.label}</div>
                  <div className="text-[10px] text-neutral-500">{s.tv}</div>
                </div>
                <span className="text-[9px] text-emerald-400">●</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="p-4 text-center text-xs text-neutral-500">No symbols</div>
            )}
          </div>
        </aside>

        {/* Center: chart */}
        <main className="col-span-6 overflow-hidden rounded-xl border border-white/5 bg-black/40">
          <LiveTickChart
            symbolKey={active.tv}
            price={livePrice}
            ts={tick?.ts}
            label={`${active.label} · ${liveSource ?? "feed"}`}
          />
        </main>

        {/* Right: ticker + order + orders */}
        <aside className="col-span-3 flex flex-col gap-3 overflow-hidden">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="mb-2 text-[10px] tracking-widest text-neutral-500">LIVE QUOTE</div>
            <TVTicker key={active.tv} symbol={active.tv} />
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="mb-2 text-[10px] tracking-widest text-neutral-500">ORDER TICKET</div>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => setSide("BUY")}
                className={`rounded-lg py-2 text-sm font-semibold ${
                  side === "BUY"
                    ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                    : "bg-white/5 text-neutral-400"
                }`}
              >
                BUY
              </button>
              <button
                onClick={() => setSide("SELL")}
                className={`rounded-lg py-2 text-sm font-semibold ${
                  side === "SELL"
                    ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40"
                    : "bg-white/5 text-neutral-400"
                }`}
              >
                SELL
              </button>
            </div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-neutral-500">
              Quantity
            </label>
            <input
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              inputMode="decimal"
              className="mb-3 w-full rounded-lg border border-white/5 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#d4af37]/50"
            />
            <button
              onClick={submit}
              className="w-full rounded-lg bg-[#d4af37] py-2 text-sm font-semibold text-black hover:bg-[#e6c352]"
            >
              {side} {active.label}
            </button>
          </div>

          <div className="flex-1 overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
            <div className="border-b border-white/5 p-3 text-[10px] tracking-widest text-neutral-500">
              RECENT ORDERS · PAPER
            </div>
            <div className="max-h-full overflow-y-auto">
              {orders.length === 0 && (
                <div className="p-4 text-center text-xs text-neutral-500">No orders yet</div>
              )}
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between border-b border-white/5 px-3 py-2 text-xs"
                >
                  <div>
                    <div
                      className={
                        o.side === "BUY" ? "font-semibold text-emerald-300" : "font-semibold text-rose-300"
                      }
                    >
                      {o.side} {o.qty}
                    </div>
                    <div className="text-[10px] text-neutral-500">{o.symbol}</div>
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    {new Date(o.ts).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}