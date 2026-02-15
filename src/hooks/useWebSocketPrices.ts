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

  const connect = useCallback(() => {
    // Only connect for crypto symbols that have Binance streams
    const streams = symbolKeys
      .filter(k => BINANCE_STREAMS[k])
      .map(k => `${BINANCE_STREAMS[k]}@miniTicker`);

    if (streams.length === 0) return;

    const streamParam = streams.join('/');
    const url = `${BINANCE_WS}/${streamParam.length > 1 ? streamParam : streams[0]}`;

    try {
      const ws = new WebSocket(streams.length > 1
        ? `wss://stream.binance.com:9443/stream?streams=${streamParam}`
        : url
      );

      ws.onopen = () => {
        console.log('[WS] Connected to Binance price stream');
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const raw = JSON.parse(event.data);
          const data = raw.data || raw; // Combined stream wraps in { stream, data }

          if (data.e === '24hrMiniTicker') {
            const symbol = data.s?.toLowerCase().replace('usdt', '');
            // Reverse-map back to our key
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
        if (mountedRef.current) {
          reconnectTimer.current = setTimeout(connect, 3000);
        }
      };

      wsRef.current = ws;
    } catch (e) {
      console.warn('[WS] Failed to create WebSocket:', e);
      reconnectTimer.current = setTimeout(connect, 5000);
    }
  }, [symbolKeys]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  return prices;
};

// Simulate real-time streaming for non-crypto assets (metals, stocks, bonds, energy, forex)
// Uses micro-jitter on top of base prices to create sub-second visual updates
export const useSimulatedStream = (basePrice: number, baseChange: number, symbolKey: string) => {
  const [streamedPrice, setStreamedPrice] = useState(basePrice);
  const [streamedChange, setStreamedChange] = useState(baseChange);

  useEffect(() => {
    if (!basePrice || basePrice === 0) return;
    setStreamedPrice(basePrice);
    setStreamedChange(baseChange);

    const interval = setInterval(() => {
      setStreamedPrice(prev => {
        const jitter = (Math.random() - 0.5) * prev * 0.0003; // 0.03% jitter
        return parseFloat((prev + jitter).toFixed(prev < 10 ? 4 : 2));
      });
    }, 800 + Math.random() * 400); // 800-1200ms intervals

    return () => clearInterval(interval);
  }, [basePrice, baseChange, symbolKey]);

  return { price: streamedPrice, change: streamedChange };
};
