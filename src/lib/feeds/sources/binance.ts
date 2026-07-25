/**
 * Binance public WebSocket adapter.
 * Multiplexes all requested crypto symbols on a single WS connection.
 * Symbol format expected: `BTC/USDT`, `ETH/USDT`, ...
 * Free, official, no key. Direct browser WS.
 */
import { FeedRouter } from '../router';

const WS_URL = 'wss://stream.binance.com:9443/stream';
let socket: WebSocket | null = null;
let subscribed = new Set<string>();
let backoff = 1000;

function toStreamName(sym: string): string | null {
  // BTC/USDT -> btcusdt@ticker
  const [b, q] = sym.split('/');
  if (!b || !q) return null;
  return `${b}${q}`.toLowerCase() + '@ticker';
}

function connect() {
  if (typeof window === 'undefined') return;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
  const streams = Array.from(subscribed).map(toStreamName).filter(Boolean).join('/');
  if (!streams) return;
  const url = `${WS_URL}?streams=${streams}`;
  socket = new WebSocket(url);
  const sentAt = Date.now();
  socket.onopen = () => { backoff = 1000; };
  socket.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      const d = msg?.data;
      if (!d || !d.s) return;
      // reverse: BTCUSDT -> BTC/USDT (assume 3-4 char quote)
      const raw: string = d.s;
      const quote = raw.endsWith('USDT') ? 'USDT' : raw.endsWith('USDC') ? 'USDC' : raw.slice(-3);
      const base = raw.slice(0, raw.length - quote.length);
      const symbol = `${base}/${quote}`;
      const last = parseFloat(d.c);
      const bid = parseFloat(d.b);
      const ask = parseFloat(d.a);
      const change = parseFloat(d.P);
      const vol = parseFloat(d.q);
      if (!Number.isFinite(last) || last <= 0) return;
      FeedRouter.publish({
        symbol,
        assetClass: 'crypto',
        last,
        bid: Number.isFinite(bid) ? bid : undefined,
        ask: Number.isFinite(ask) ? ask : undefined,
        change24h: Number.isFinite(change) ? change : undefined,
        volume24h: Number.isFinite(vol) ? vol : undefined,
        ts: Date.now(),
        source: 'binance-ws',
        latencyMs: Date.now() - sentAt,
      });
    } catch {/* ignore parse errors */}
  };
  socket.onclose = () => {
    socket = null;
    const wait = Math.min(backoff, 30_000);
    backoff = Math.min(backoff * 2, 30_000);
    setTimeout(connect, wait);
  };
  socket.onerror = () => { try { socket?.close(); } catch {/*noop*/} };
}

export function startBinance(symbols: string[]) {
  const before = subscribed.size;
  symbols.forEach(s => subscribed.add(s));
  if (subscribed.size !== before && socket) {
    try { socket.close(); } catch {/*noop*/}
    socket = null;
  }
  connect();
}