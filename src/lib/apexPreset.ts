/* ─────────────────── APEX + MICRO flagship strategies ───────────────────
   APEX is the full-power configuration of the Gold Arrow platform: four
   specialised lanes (confirmed breakouts, retests, catalysts, momentum),
   five specialist agents, a two-agent referee, precision exits on every
   position, the ET session window for stocks, and the −3% / $25K risk
   envelope. It is the 6X idea with every lesson applied.

   MICRO-100 is the same doctrine engineered for a $100 account: one
   lane, one position at a time, $45 tickets, a −$5 daily risk cap, and
   entries rationed to the two best setups of the session — because at
   $100 the enemy is not missing moves, it is churning the account away.
   ──────────────────────────────────────────────────────────────────── */

import { emptyGraph, makeLane, makeStep, type PipeGraph } from './pipelineGraph';
import { BLOCK_BY_ID } from './pipelineBlocks';
import { AGENT_TEMPLATE_BY_ID, templateConfig } from './agentTemplates';

const blockConfig = (id: string) => ({ ...(BLOCK_BY_ID.get(id)?.config ?? {}) });

const agentStep = (templateId: string, label: string, refereeBlock = false) => {
  const t = AGENT_TEMPLATE_BY_ID.get(templateId)!;
  return makeStep('agent', label, {
    ...blockConfig(refereeBlock ? 'agent_referee' : 'agent'),
    ...templateConfig(t),
    model: 'llama-3.3-70b-versatile',
  });
};

const refereeLane = (index: number) => {
  const referee = makeLane('Referee — regime, risk & defence', index);
  referee.consensus = true;
  referee.agree = { mode: 'any', expects: 'bullish', minConfidence: 0, veto: true };
  referee.steps = [
    agentStep('regime_sentinel', 'Regime Sentinel (consensus)', true),
    agentStep('risk_guardian', 'Risk Guardian (consensus)', true),
    makeStep('risk', 'Loss limit −3%', { ...blockConfig('risk'), maxDrawdownPct: 3, blockOnBreach: true }),
  ];
  return referee;
};

const exits = (over: Record<string, number> = {}) => ({
  takeProfitPct: 1.0, stopLossPct: 0.5, maxHoldMin: 25, maxEntries: 3, cooldownMin: 2,
  scaleOutPct: 50, takeProfit2Pct: 2.5, trailPct: 0.45, ...over,
});

export const buildApexGraph = (): PipeGraph => {
  const g = emptyGraph();
  g.name = 'APEX — Full-Spectrum Momentum System';
  g.risk = { maxDrawdownPct: 3, maxTotalInvestmentUsd: 25000 };
  g.session = { durationMin: 120, tickSec: 5, flattenOnStop: true, tradeWindowEt: '09:30-16:00' };

  const l1 = makeLane('APEX — confirmed breakouts', 0);
  l1.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'in_play', limit: 5, bindTop: true }),
    makeStep('analysis', 'BREAKOUT CONFIRM', { programId: 'breakout_confirm', params: { window: 30, hold: 3 } }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    makeStep('analysis', 'TREND SCORE', { programId: 'trend', params: {} }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    agentStep('entry_sniper', 'Entry Sniper'),
    makeStep('buy', 'Buy — bank 50% at +1%, runner to +2.5%', { ...blockConfig('buy'), amountUsd: 5000, ...exits() }),
  ];

  const l2 = makeLane('APEX — retest entries', 1);
  l2.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'breakout', limit: 5, bindTop: true }),
    makeStep('analysis', 'PULLBACK ENTRY', { programId: 'pullback_entry', params: { window: 30 } }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    agentStep('tape_reader', 'Tape Reader'),
    makeStep('buy', 'Buy the retest', { ...blockConfig('buy'), amountUsd: 4000, ...exits({ takeProfit2Pct: 2.0 }) }),
  ];

  const l3 = makeLane('APEX — catalyst gaps', 2);
  l3.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'hottest', limit: 5, bindTop: true }),
    makeStep('analysis', 'GAP SCAN 5', { programId: 'gap_5', params: { window: 5 } }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    agentStep('catalyst_scout', 'Catalyst Scout'),
    agentStep('gap_hunter', 'Gap Hunter'),
    makeStep('buy', 'Buy the catalyst', { ...blockConfig('buy'), amountUsd: 3500, ...exits({ takeProfitPct: 1.2, stopLossPct: 0.55, trailPct: 0.5 }) }),
  ];

  const l4 = makeLane('APEX — momentum runners', 3);
  l4.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'momentum_surge', limit: 5, bindTop: true }),
    makeStep('analysis', 'MACD', { programId: 'macd', params: {} }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    makeStep('analysis', 'TREND SCORE', { programId: 'trend', params: {} }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    makeStep('buy', 'Ride the momentum', {
      ...blockConfig('buy'), amountUsd: 3500,
      takeProfitPct: 3.0, stopLossPct: 0.7, maxHoldMin: 60, maxEntries: 2, cooldownMin: 5,
      scaleOutPct: 0, takeProfit2Pct: 0, trailPct: 0.5,
    }),
  ];

  g.lanes = [l1, l2, l3, l4, refereeLane(4)];
  g.updatedAt = Date.now();
  return g;
};

export const buildMicroGraph = (): PipeGraph => {
  const g = emptyGraph();
  g.name = 'MICRO-100 — the $100 account strategy';
  g.risk = { maxDrawdownPct: 5, maxTotalInvestmentUsd: 100 };
  g.session = { durationMin: 120, tickSec: 5, flattenOnStop: true, tradeWindowEt: '09:30-16:00' };

  // Many small trades, capital recycling fast: $10 tickets, up to a dozen
  // entries per lane per session, 10-minute holds, +0.8% harvests against
  // -0.4% stops, a 0.3% trailing stop to squeeze the runners. Three
  // lanes hunt different setups so the account is always working; the
  // $100 deployed cap and the -$5 session limit still rule everything.
  const microBuy = (label: string, over: Record<string, number> = {}) => makeStep('buy', label, {
    ...blockConfig('buy'), amountUsd: 10,
    takeProfitPct: 0.8, stopLossPct: 0.4, maxHoldMin: 10, maxEntries: 12, cooldownMin: 1,
    scaleOutPct: 0, takeProfit2Pct: 0, trailPct: 0.3, ...over,
  });

  const l1 = makeLane('MICRO — breakout swarm', 0);
  l1.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'in_play', limit: 3, bindTop: true }),
    makeStep('analysis', 'BREAKOUT CONFIRM', { programId: 'breakout_confirm', params: { window: 30, hold: 3 } }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    agentStep('entry_sniper', 'Entry Sniper'),
    microBuy('Buy — $10 ticket'),
  ];

  const l2 = makeLane('MICRO — retest swarm', 1);
  l2.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'breakout', limit: 3, bindTop: true }),
    makeStep('analysis', 'PULLBACK ENTRY', { programId: 'pullback_entry', params: { window: 30 } }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    microBuy('Buy the retest — $10 ticket'),
  ];

  const l3 = makeLane('MICRO — momentum swarm', 2);
  l3.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'momentum_surge', limit: 3, bindTop: true }),
    makeStep('analysis', 'TREND SCORE', { programId: 'trend', params: {} }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    microBuy('Ride it — $10 ticket', { takeProfitPct: 1.2, trailPct: 0.4 }),
  ];

  const referee = makeLane('Referee — risk only', 3);
  referee.consensus = true;
  referee.agree = { mode: 'any', expects: 'bullish', minConfidence: 0, veto: true };
  referee.steps = [
    agentStep('risk_guardian', 'Risk Guardian (consensus)', true),
    makeStep('risk', 'Loss limit −5% ($5)', { ...blockConfig('risk'), maxDrawdownPct: 5, blockOnBreach: true }),
  ];

  g.lanes = [l1, l2, l3, referee];
  g.updatedAt = Date.now();
  return g;
};
