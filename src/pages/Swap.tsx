import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

/**
 * SWAP — a clean, TradingView-powered trading page.
 * - Chart: official TradingView Advanced Chart widget (guaranteed live data)
 * - Symbol list: curated to only tickers TradingView streams live for free
 * - Order ticket: local paper trade (kept intentionally simple + reliable)
 */

type Cat = "Crypto" | "Metals" | "Energy" | "FX" | "Index" | "Stocks";

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

const CATS: (Cat | "All")[] = ["All", "Crypto", "Metals", "Energy", "FX", "Index", "Stocks"];

function TVChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const div = document.createElement("div");
    div.className = "tradingview-widget-container__widget";
    div.style.height = "100%";
    div.style.width = "100%";
    containerRef.current.appendChild(div);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "5",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(10, 10, 12, 1)",
      gridColor: "rgba(212, 175, 55, 0.06)",
      allow_symbol_change: false,
      hide_side_toolbar: false,
      studies: ["STD;EMA", "STD;RSI"],
      support_host: "https://www.tradingview.com",
    });
    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container h-full w-full"
      style={{ height: "100%", width: "100%" }}
    />
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
            LIVE · TradingView
          </span>
        </div>
        <div className="text-xs text-neutral-400">{active.label} · {active.tv}</div>
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
          <TVChart key={active.tv} symbol={active.tv} />
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