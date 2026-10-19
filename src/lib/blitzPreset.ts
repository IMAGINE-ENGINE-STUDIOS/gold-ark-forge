import { emptyGraph, makeLane, makeStep, type PipeGraph } from './pipelineGraph';
import { BLOCK_BY_ID } from './pipelineBlocks';
import { AGENT_TEMPLATES, templateConfig } from './agentTemplates';

/* ─────────────────── BLITZ-100 ────────────────────────────────────
   The high-count sample: built to fire ONE HUNDRED small investments
   inside a FIVE-MINUTE session on a $5,000 envelope — IF the tape
   offers that many qualifying setups.

   How the pace is possible:
   • six parallel lanes hunt different screens at once;
   • $50 tickets (1% of the envelope) with NO cooldown — a lane may
     re-enter on the very next tick, up to 25 entries per lane
     (150 slots of capacity against a 100-trade goal);
   • screens rotate across their top-5 matches, and a $250 per-asset
     cap forces the flow to spread over at least 20 different names
     before the envelope is fully deployed;
   • positions harvest fast (+0.5% target, 0.25% trailing stop,
     2-minute max hold) so capital recycles inside the session;
   • a Risk Guardian referee + a −3% ($150) loss limit still rule the
     whole blitz — speed never outranks the stop.

   The honest limit: the machine takes every qualifying setup it can
   see; a dead tape offers fewer than 100 in five minutes. The count
   is opportunity meeting capacity — capacity is no longer the cap.
   ──────────────────────────────────────────────────────────────── */

const blockConfig = (id: string) => ({ ...(BLOCK_BY_ID.get(id)?.config ?? {}) });

const blitzBuy = (label: string) => makeStep('buy', label, {
  ...blockConfig('buy'),
  amountUsd: 50,
  takeProfitPct: 0.5, stopLossPct: 0.35,
  maxHoldMin: 2, maxEntries: 25, cooldownMin: 0,
  scaleOutPct: 0, takeProfit2Pct: 0, trailPct: 0.25,
});

const blitzLane = (name: string, idx: number, classId: string, programId: string) => {
  const lane = makeLane(name, idx);
  lane.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId, limit: 5, bindTop: true, rotate: 5 }),
    makeStep('analysis', programId === 'breakout_confirm' ? 'BREAKOUT CONFIRM' : 'TREND SCORE',
      { programId, params: programId === 'breakout_confirm' ? { window: 30, hold: 2 } : {} }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    blitzBuy('Blitz buy — $50 ticket'),
  ];
  return lane;
};

export const buildBlitzGraph = (): PipeGraph => {
  const g = emptyGraph();
  g.name = 'BLITZ-100 — 100 trades in 5 minutes, $5,000';
  g.risk = { maxDrawdownPct: 3, maxTotalInvestmentUsd: 5000, maxPerAssetUsd: 250 };
  g.session = { durationMin: 5, tickSec: 5, flattenOnStop: true, tradeWindowEt: '09:30-16:00' };

  g.lanes = [
    blitzLane('BLITZ — in play', 0, 'in_play', 'trend'),
    blitzLane('BLITZ — momentum surge', 1, 'momentum_surge', 'trend'),
    blitzLane('BLITZ — confirmed breakouts', 2, 'breakout', 'breakout_confirm'),
    blitzLane('BLITZ — hottest', 3, 'hottest', 'trend'),
    blitzLane('BLITZ — fresh signals', 4, 'fresh_signal', 'trend'),
    blitzLane('BLITZ — second wave', 5, 'in_play', 'breakout_confirm'),
  ];

  const guardian = AGENT_TEMPLATES.find((t) => t.id === 'risk_guardian') ?? AGENT_TEMPLATES[1];
  const referee = makeLane('Referee — risk only', 6);
  referee.consensus = true;
  referee.agree = { mode: 'any', expects: 'bullish', minConfidence: 0, veto: true };
  referee.steps = [
    makeStep('agent', 'Risk Guardian (consensus)', {
      ...blockConfig('agent'), ...templateConfig(guardian), templateId: guardian.id, model: 'llama-3.3-70b-versatile',
    }),
    makeStep('risk', 'Loss limit −3% ($150)', { ...blockConfig('risk'), maxDrawdownPct: 3, blockOnBreach: true }),
  ];
  g.lanes.push(referee);

  g.updatedAt = Date.now();
  return g;
};
