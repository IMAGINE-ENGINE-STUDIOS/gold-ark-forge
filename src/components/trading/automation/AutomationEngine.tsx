/**
 * AutomationEngine — single mount point for the three-pillar Automation
 * category (Bots · Agents · Pipelines). Replaces the 4 duplicated
 * mobile+desktop render blocks that previously lived in TradingBridge.tsx
 * for the `genius | bot | automate | strategies` tab keys.
 */

import AutomationBots from './AutomationBots';
import AutomationAgents from './AutomationAgents';
import AutomationPipelines from './AutomationPipelines';
import type { useWaveBot } from '@/hooks/useWaveBot';
import type { useGeniusTrader } from '@/hooks/useGeniusTrader';
import type { usePriceAlerts } from '@/hooks/usePriceAlerts';
import type { WatchlistSymbol } from '@/data/tradingSymbols';

export type AutomationSub = 'bots' | 'agents' | 'pipelines';

interface Props {
  sub: AutomationSub;
  waveBot: ReturnType<typeof useWaveBot>;
  genius: ReturnType<typeof useGeniusTrader>;
  alertsHook: ReturnType<typeof usePriceAlerts>;
  resolvePrice: (t: string) => number;
  getCandleHistory: (t: string) => number[] | null;
  onClosePosition: (posId: string, price: number) => void;
  onNavigate: (sym: WatchlistSymbol) => void;
  equity: number;
  paper: { submitOrder: (p: any) => any; positions: any[] };
}

export default function AutomationEngine({ sub, waveBot, genius, alertsHook, resolvePrice, getCandleHistory, onClosePosition, onNavigate, equity, paper }: Props) {
  if (sub === 'bots') {
    return (
      <AutomationBots
        waveBot={waveBot}
        resolvePrice={resolvePrice}
        getCandleHistory={getCandleHistory}
        onClosePosition={onClosePosition}
        onNavigate={onNavigate}
        equity={equity}
        paper={paper}
      />
    );
  }
  if (sub === 'agents') {
    const prices: Record<string, number> = {};
    for (const p of paper.positions ?? []) {
      if (p?.symbol) prices[p.symbol] = resolvePrice(p.symbol);
    }
    const UNIVERSE = ['GLD','SLV','PPLT','PALL','HG','XOM','CVX','SPY','QQQ','IWM','DIA','TLT','BTC-USD','ETH-USD','SOL-USD','LINK-USD','AAPL','MSFT','NVDA','TSLA','META','GOOGL','AMZN','JPM'];
    UNIVERSE.forEach(t => { prices[t] = resolvePrice(t); });
    const candles: Record<string, number[]> = {};
    UNIVERSE.forEach(t => {
      const h = getCandleHistory(t);
      if (h && h.length >= 20) candles[t] = h.slice(-120);
    });
    return (
      <AutomationAgents
        genius={genius}
        equity={equity}
        positions={(paper.positions ?? []).map((p: any) => ({
          symbol: p.symbol, side: p.side ?? 'long', qty: p.qty ?? p.size ?? 0, entry: p.entry ?? p.entryPrice ?? 0,
        }))}
        prices={prices}
        candles={candles}
        onApprovedTrade={(prop) => {
          paper.submitOrder({
            symbol: prop.symbol,
            side: prop.side,
            type: 'market',
            qty: prop.sizeUsd / Math.max(1e-6, resolvePrice(prop.symbol)),
            source: 'agent',
          });
        }}
      />
    );
  }
  return (
    <AutomationPipelines
      alertsHook={alertsHook}
      resolvePrice={resolvePrice}
      getCandleHistory={getCandleHistory}
      equity={equity}
      submitOrder={paper.submitOrder}
    />
  );
}