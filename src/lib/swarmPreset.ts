/* ─────────────────────────── SWARM ───────────────────────────
   The committee strategy. Every lane is a COUNCIL: several specialists
   judge the same setup in sequence, each one reading the fresh verdicts
   the others posted to the shared blackboard (context.peerVerdicts), so
   later judges reason over earlier calls instead of judging blind.
   The referee is a three-agent committee (Regime Sentinel, Breadth
   Reader, Defensive Captain) whose lane signal is decided by majority
   vote, with veto power for the referee-grade members. Entries happen
   only when a council AND the committee both lean bullish.
   ─────────────────────────────────────────────────────────────── */

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

const councilExits = (over: Record<string, number> = {}) => ({
  takeProfitPct: 1.0, stopLossPct: 0.5, maxHoldMin: 15, maxEntries: 20, cooldownMin: 1,
  scaleOutPct: 50, takeProfit2Pct: 2.5, trailPct: 0.45, ...over,
});

export const buildSwarmGraph = (): PipeGraph => {
  const g = emptyGraph();
  g.name = 'SWARM — the agent committee';
  g.risk = { maxDrawdownPct: 3, maxTotalInvestmentUsd: 25000, maxPerAssetUsd: 1000 };
  g.session = { durationMin: 120, tickSec: 5, flattenOnStop: true, tradeWindowEt: '09:30-16:00' };

  const l1 = makeLane('Council — confirmed breakouts', 0);
  l1.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'in_play', limit: 5, bindTop: true, rotate: 3 }),
    makeStep('analysis', 'BREAKOUT CONFIRM', { programId: 'breakout_confirm', params: { window: 30, hold: 3 } }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    agentStep('entry_sniper', 'Entry Sniper (council)'),
    agentStep('tape_reader', 'Tape Reader (council)'),
    agentStep('vwap_anchor', 'VWAP Anchor (council)'),
    makeStep('buy', 'Buy — council approved', { ...blockConfig('buy'), amountUsd: 250, ...councilExits() }),
  ];

  const l2 = makeLane('Council — retest entries', 1);
  l2.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'breakout', limit: 5, bindTop: true, rotate: 3 }),
    makeStep('analysis', 'PULLBACK ENTRY', { programId: 'pullback_entry', params: { window: 30 } }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    agentStep('tape_reader', 'Tape Reader (council)'),
    agentStep('catalyst_scout', 'Catalyst Scout (council)'),
    makeStep('buy', 'Buy the retest — council approved', { ...blockConfig('buy'), amountUsd: 250, ...councilExits({ takeProfit2Pct: 2.0 }) }),
  ];

  const l3 = makeLane('Council — momentum', 2);
  l3.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'momentum_surge', limit: 5, bindTop: true, rotate: 3 }),
    makeStep('analysis', 'TREND SCORE', { programId: 'trend', params: {} }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    agentStep('scalp_sergeant', 'Scalp Sergeant (council)'),
    agentStep('sector_rotator', 'Sector Rotator (council)'),
    makeStep('buy', 'Ride it — council approved', {
      ...blockConfig('buy'), amountUsd: 250,
      takeProfitPct: 3.0, stopLossPct: 0.7, maxHoldMin: 30, maxEntries: 12, cooldownMin: 2,
      scaleOutPct: 0, takeProfit2Pct: 0, trailPct: 0.5,
    }),
  ];

  const committee = makeLane('Committee — regime, breadth & defence', 3);
  committee.consensus = true;
  committee.agree = { mode: 'any', expects: 'bullish', minConfidence: 0, veto: true };
  committee.steps = [
    agentStep('regime_sentinel', 'Regime Sentinel (committee)', true),
    agentStep('breadth_reader', 'Breadth Reader (committee)', true),
    agentStep('defensive_captain', 'Defensive Captain (committee)', true),
    makeStep('risk', 'Loss limit −3%', { ...blockConfig('risk'), maxDrawdownPct: 3, blockOnBreach: true }),
  ];

  g.lanes = [l1, l2, l3, committee];
  g.updatedAt = Date.now();
  return g;
};
