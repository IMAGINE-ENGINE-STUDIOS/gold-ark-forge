/**
 * Unified market-feed contract. Every source adapter normalizes into `Tick`
 * so widgets pull from one API regardless of upstream provider.
 */
export type AssetClass =
  | 'crypto'
  | 'metals'
  | 'fx'
  | 'energy'
  | 'stocks'
  | 'index'
  | 'bond'
  | 'macro';

export interface Tick {
  symbol: string;         // Gold Arrow canonical ticker (e.g. XAU/USD, BTC/USDT, AAPL)
  assetClass: AssetClass;
  last: number;
  bid?: number;
  ask?: number;
  change24h?: number;
  volume24h?: number;
  ts: number;             // epoch ms
  source: string;         // 'binance-ws' | 'coinbase-ws' | 'gold-api' | 'yahoo' | 'fred' ...
  latencyMs?: number;
  stale?: boolean;
}

export interface FeedHealth {
  source: string;
  ok: boolean;
  latencyMs: number;
  lastTickAt: number;
}

export type TickListener = (tick: Tick) => void;