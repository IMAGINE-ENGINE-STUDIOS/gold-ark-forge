import { useState, useEffect, useRef, useCallback } from 'react';

export interface WebSocketPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  timestamp: number;
}

type PriceMap = Record<string, WebSocketPrice>;

const BINANCE_WS = 'wss://stream.binance.com:9443/ws';

// Map our symbol keys to Binance stream names
const BINANCE_STREAMS: Record<string, string> = {
  bitcoin: 'btcusdt', ethereum: 'ethusdt', solana: 'solusdt',
  xrp: 'xrpusdt', cardano: 'adausdt', dogecoin: 'dogeusdt',
  polkadot: 'dotusdt', chainlink: 'linkusdt', avalanche: 'avaxusdt',
  polygon: 'maticusdt', litecoin: 'ltcusdt', uniswap: 'uniusdt',
  near: 'nearusdt', aptos: 'aptusdt', sui: 'suiusdt',
  arbitrum: 'arbusdt', optimism: 'opusdt', injective: 'injusdt',
  render: 'renderusdt', filecoin: 'filusdt', cosmos: 'atomusdt',
  algorand: 'algousdt', stellar: 'xlmusdt', vechain: 'vetusdt',
  fantom: 'ftmusdt', hedera: 'hbarusdt', tron: 'trxusdt',
  bnb: 'bnbusdt', shiba: 'shibusdt', pepe: 'pepeusdt',
};

export const useWebSocketPrices = (symbolKeys: string[]) => {
  const [prices, setPrices] = useState<PriceMap>({});
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 10;

  const connect = useCallback(() => {
    // Only connect for crypto symbols that have Binance streams
    const streams = symbolKeys
      .filter(k => BINANCE_STREAMS[k])
      .map(k => `${BINANCE_STREAMS[k]}@miniTicker`);

    if (streams.length === 0) return;

    // Stop retrying after max attempts
    if (retryCountRef.current >= MAX_RETRIES) {
      console.warn('[WS] Max retries reached, falling back to polling-only mode');
      return;
    }

    const streamParam = streams.join('/');
    const url = `${BINANCE_WS}/${streamParam.length > 1 ? streamParam : streams[0]}`;

    try {
      const ws = new WebSocket(streams.length > 1
        ? `wss://stream.binance.com:9443/stream?streams=${streamParam}`
        : url
      );

      ws.onopen = () => {
        console.log('[WS] Connected to Binance price stream');
        retryCountRef.current = 0; // Reset on successful connect
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const raw = JSON.parse(event.data);
          const data = raw.data || raw;

          if (data.e === '24hrMiniTicker') {
            const symbol = data.s?.toLowerCase().replace('usdt', '');
            const key = Object.entries(BINANCE_STREAMS).find(([_, v]) => v === `${symbol}usdt`)?.[0];
            if (key) {
              const price = parseFloat(data.c);
              const open = parseFloat(data.o);
              const change = open > 0 ? ((price - open) / open) * 100 : 0;

              setPrices(prev => ({
                ...prev,
                [key]: {
                  symbol: key,
                  price,
                  change24h: change,
                  volume: parseFloat(data.q),
                  timestamp: Date.now(),
                },
              }));
            }
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onerror = () => {
        console.warn('[WS] Connection error, will retry...');
      };

      ws.onclose = () => {
        if (mountedRef.current && retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          // Exponential backoff: 3s → 6s → 12s → ... max 30s
          const delay = Math.min(3000 * Math.pow(2, retryCountRef.current - 1), 30000);
          console.log(`[WS] Reconnecting in ${(delay / 1000).toFixed(0)}s (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
          reconnectTimer.current = setTimeout(connect, delay);
        }
      };

      wsRef.current = ws;
    } catch (e) {
      console.warn('[WS] Failed to create WebSocket:', e);
      retryCountRef.current++;
      const delay = Math.min(5000 * Math.pow(2, retryCountRef.current - 1), 30000);
      reconnectTimer.current = setTimeout(connect, delay);
    }
  }, [symbolKeys]);

  useEffect(() => {
    mountedRef.current = true;
    retryCountRef.current = 0;
    connect();

    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  return prices;
};

