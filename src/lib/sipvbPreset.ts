/* ─────────────────── 6X preset v2 — SIP-VB strategy ───────────────────
   Stocks-in-Play Volatility-Breakout, translated into pipeline blocks:

     Screen (STOCKS IN PLAY — a real move, live volatility, deep evidence)
       → BREAKOUT CONFIRM (the break must HOLD — pokes do not count)
       → Branch (only continue on a bullish confirmed break)
       → Trend confirmation
       → Entry Sniper agent (blesses only quality entries, re-checks
         every 6 ticks instead of burning an AI call every tick)
       → Buy with the precision exit plan: bank 50% at the +1.0%
         harvest, the runner rides to +2.0% behind a 0.4% trailing
         stop with its stop moved to breakeven; hard stop −0.5%;
         20-minute max hold; cooldown + entry caps against overtrading.
     Lane 2 hunts the retest (PULLBACK ENTRY) instead of the chase.
     Consensus referee lane (Risk Guardian) can veto the whole graph;
     the shared risk envelope (−3% drawdown) can stop every lane.
     Stock entries respect the 09:30–16:00 ET session window; crypto
     and metals trade around the clock.

   The "+1%" lives where the evidence says it belongs: as the take-profit
   harvest level on names already moving — not as a promise per trade.
   Runs against the paper account until the operator says otherwise.
   ──────────────────────────────────────────────────────────────────── */

import { emptyGraph, makeLane, makeStep, type PipeGraph } from './pipelineGraph';
import { BLOCK_BY_ID } from './pipelineBlocks';
import { AGENT_TEMPLATE_BY_ID, templateConfig } from './agentTemplates';

const blockConfig = (id: string) => ({ ...(BLOCK_BY_ID.get(id)?.config ?? {}) });

const buyConfig = (amountUsd: number) => ({
  ...blockConfig('buy'),
  amountUsd,
  takeProfitPct: 1.0,   // the harvest level
  stopLossPct: 0.5,     // 2:1 reward:risk against the harvest
  maxHoldMin: 15,
  maxEntries: 20,
  cooldownMin: 1,
  scaleOutPct: 50,      // bank half at +1%…
  takeProfit2Pct: 2.0,  // …the runner aims for +2%…
  trailPct: 0.4,        // …protected by a trailing stop, stop to breakeven
});

const sniperStep = () => {
  const t = AGENT_TEMPLATE_BY_ID.get('entry_sniper')!;
  return makeStep('agent', 'Entry Sniper', { ...blockConfig('agent'), ...templateConfig(t), model: 'llama-3.3-70b-versatile' });
};

export const buildSipvbGraph = (): PipeGraph => {
  const g = emptyGraph();
  g.name = '6X — Stocks-in-Play Volatility Breakout';
  g.risk = { maxDrawdownPct: 3, maxTotalInvestmentUsd: 25000, maxPerAssetUsd: 1000 };
  g.session = { durationMin: 60, tickSec: 5, flattenOnStop: true, tradeWindowEt: '09:30-16:00' };

  const lane1 = makeLane('Scanner — in-play breakouts', 0);
  lane1.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'in_play', limit: 5, bindTop: true, rotate: 3 }),
    makeStep('analysis', 'BREAKOUT CONFIRM', { programId: 'breakout_confirm', params: { window: 30, hold: 3 } }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    makeStep('analysis', 'TREND SCORE', { programId: 'trend', params: {} }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    sniperStep(),
    makeStep('buy', 'Buy — harvest +1%, runner to +2%', buyConfig(250)),
  ];

  const lane2 = makeLane('Scanner — retest entries', 1);
  lane2.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'momentum_surge', limit: 5, bindTop: true, rotate: 3 }),
    makeStep('analysis', 'BREAKOUT 15', { programId: 'breakout_15', params: { window: 15 } }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    makeStep('analysis', 'PULLBACK ENTRY', { programId: 'pullback_entry', params: { window: 30 } }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    makeStep('buy', 'Buy the retest — harvest +1%', buyConfig(250)),
  ];

  const lane3 = makeLane('Scanner — hottest movers', 2);
  lane3.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'hottest', limit: 5, bindTop: true, rotate: 3 }),
    makeStep('analysis', 'BREAKOUT CONFIRM', { programId: 'breakout_confirm', params: { window: 30, hold: 3 } }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    makeStep('analysis', 'REGIME DETECT', { programId: 'regime', params: {} }),
    makeStep('buy', 'Buy — harvest +1%, runner to +2%', buyConfig(250)),
  ];

  const referee = makeLane('Referee — consensus & risk', 3);
  referee.consensus = true;
  referee.agree = { mode: 'any', expects: 'bullish', minConfidence: 0, veto: true };
  const guardian = AGENT_TEMPLATE_BY_ID.get('risk_guardian')!;
  referee.steps = [
    makeStep('agent', 'Risk Guardian (consensus)', { ...blockConfig('agent_referee'), ...templateConfig(guardian), model: 'llama-3.3-70b-versatile' }),
    makeStep('risk', 'Loss limit −3%', { ...blockConfig('risk'), maxDrawdownPct: 3, blockOnBreach: true }),
  ];

  g.lanes = [lane1, lane2, lane3, referee];
  g.updatedAt = Date.now();
  return g;
};
