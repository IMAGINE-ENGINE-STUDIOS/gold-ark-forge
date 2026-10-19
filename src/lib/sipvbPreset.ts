/* ─────────────────── 6X preset — SIP-VB strategy ───────────────────
   Stocks-in-Play Volatility-Breakout, translated into pipeline blocks:

     Screen (in-play selection: breakout / momentum / hottest)
       → BREAKOUT analysis (price must break its prior range)
       → Branch (only continue on a bullish break)
       → Trend confirmation
       → Buy with the harvest rule: take profit +1.0%, stop −0.5%,
         20-minute max hold, cooldown + entry caps against overtrading
     Consensus referee lane can veto the whole graph; the shared risk
     envelope (−3% drawdown) can stop every lane at once.

   The "+1%" lives where the evidence says it belongs: as the take-profit
   harvest level on names already moving — not as a promise per trade.
   Runs against the paper account until the operator says otherwise.
   ──────────────────────────────────────────────────────────────────── */

import { emptyGraph, makeLane, makeStep, type PipeGraph } from './pipelineGraph';
import { BLOCK_BY_ID } from './pipelineBlocks';

const blockConfig = (id: string) => ({ ...(BLOCK_BY_ID.get(id)?.config ?? {}) });

const buyConfig = (amountUsd: number) => ({
  ...blockConfig('buy'),
  amountUsd,
  takeProfitPct: 1.0,   // the harvest level
  stopLossPct: 0.5,     // 2:1 reward:risk against the harvest
  maxHoldMin: 20,
  maxEntries: 3,
  cooldownMin: 2,
});

export const buildSipvbGraph = (): PipeGraph => {
  const g = emptyGraph();
  g.name = '6X — Stocks-in-Play Volatility Breakout';
  g.risk = { maxDrawdownPct: 3, maxTotalInvestmentUsd: 25000 };
  g.session = { durationMin: 60, tickSec: 5, flattenOnStop: true };

  const lane1 = makeLane('Scanner — range breakouts', 0);
  lane1.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'breakout', limit: 5, bindTop: true }),
    makeStep('analysis', 'BREAKOUT 30', { programId: 'breakout_30', params: { window: 30 } }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    makeStep('analysis', 'TREND SCORE', { programId: 'trend', params: {} }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    makeStep('buy', 'Buy — harvest +1%', buyConfig(2500)),
  ];

  const lane2 = makeLane('Scanner — momentum surge', 1);
  lane2.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'momentum_surge', limit: 5, bindTop: true }),
    makeStep('analysis', 'BREAKOUT 15', { programId: 'breakout_15', params: { window: 15 } }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    makeStep('buy', 'Buy — harvest +1%', buyConfig(2500)),
  ];

  const lane3 = makeLane('Scanner — hottest movers', 2);
  lane3.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'hottest', limit: 5, bindTop: true }),
    makeStep('analysis', 'BREAKOUT 30', { programId: 'breakout_30', params: { window: 30 } }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    makeStep('analysis', 'REGIME DETECT', { programId: 'regime', params: {} }),
    makeStep('buy', 'Buy — harvest +1%', buyConfig(2000)),
  ];

  const referee = makeLane('Referee — consensus & risk', 3);
  referee.consensus = true;
  referee.agree = { mode: 'any', expects: 'bullish', minConfidence: 0, veto: true };
  referee.steps = [
    makeStep('agent', 'AI referee (consensus)', blockConfig('agent_referee')),
    makeStep('risk', 'Loss limit −3%', { ...blockConfig('risk'), maxDrawdownPct: 3, blockOnBreach: true }),
  ];

  g.lanes = [lane1, lane2, lane3, referee];
  g.updatedAt = Date.now();
  return g;
};
