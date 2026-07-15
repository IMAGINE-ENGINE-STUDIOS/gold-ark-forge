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
  onClosePosition: (posId: string, price: number) => void;
  onNavigate: (sym: WatchlistSymbol) => void;
  equity: number;
}

export default function AutomationEngine({ sub, waveBot, genius, alertsHook, resolvePrice, onClosePosition, onNavigate, equity }: Props) {
  if (sub === 'bots') {
    return (
      <AutomationBots
        waveBot={waveBot}
        resolvePrice={resolvePrice}
        onClosePosition={onClosePosition}
        onNavigate={onNavigate}
        equity={equity}
      />
    );
  }
  if (sub === 'agents') {
    return <AutomationAgents genius={genius} />;
  }
  return <AutomationPipelines alertsHook={alertsHook} />;
}