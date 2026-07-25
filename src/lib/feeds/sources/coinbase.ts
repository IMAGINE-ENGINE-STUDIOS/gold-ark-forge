/**
 * Coinbase Exchange public WebSocket adapter.
 * Provides a second source for crypto NBBO. Free, no key.
 * Symbol format: `BTC/USD`, `ETH/USD` (Coinbase uses USD not USDT).
 */
import { FeedRouter } from '../router';

const WS_URL = 'wss://ws-feed.exchange.coinbase.com';
let socket: WebSocket | null = null;
let subscribed = new Set<string>();
let backoff = 1000;

function toCoinbaseId(sym: string): string | null {
  const [b, q] = sym.split('/');
  if (!b || !q) return null;
  return `${b}-${q}`;
}

function connect() {
  if (typeof window === 'undefined') return;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
  const ids = Array.from(subscribed).map(toCoinbaseId).filter(Boolean) as string[];
  if (!ids.length) return;
  socket = new WebSocket(WS_URL);
  socket.onopen = () => {
    backoff = 1000;
    socket?.send(JSON.stringify({
      type: 'subscribe',
      channels: [{ name: 'ticker', product_ids: ids }],
    }));
  };
  socket.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.type !== 'ticker' || !msg.product_id) return;
      const [b, q] = msg.product_id.split('-');
      const symbol = `${b}/${q}`;
      const last = parseFloat(msg.price);
      const bid = parseFloat(msg.best_bid);
      const ask = parseFloat(msg.best_ask);
      const vol = parseFloat(msg.volume_24h);
      const open = parseFloat(msg.open_24h);
      const change = Number.isFinite(open) && open > 0 ? ((last - open) / open) * 100 : undefined;
      if (!Number.isFinite(last) || last <= 0) return;
      FeedRouter.publish({
        symbol,
        assetClass: 'crypto',
        last,
        bid: Number.isFinite(bid) ? bid : undefined,
        ask: Number.isFinite(ask) ? ask : undefined,
        change24h: change,
        volume24h: Number.isFinite(vol) ? vol : undefined,
        ts: Date.now(),
        source: 'coinbase-ws',
      });
    } catch {/* ignore */}
  };
  socket.onclose = () => {
    socket = null;
    const wait = Math.min(backoff, 30_000);
    backoff = Math.min(backoff * 2, 30_000);
    setTimeout(connect, wait);
  };
  socket.onerror = () => { try { socket?.close(); } catch {/*noop*/} };
}

export function startCoinbase(symbols: string[]) {
  const before = subscribed.size;
  symbols.forEach(s => subscribed.add(s));
  if (subscribed.size !== before && socket) {
    try { socket.close(); } catch {/*noop*/}
    socket = null;
  }
  connect();
}