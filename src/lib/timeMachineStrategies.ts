import { emptyGraph, makeLane, makeStep, type PipeGraph, type PipeLane } from './pipelineGraph';
import { BLOCK_BY_ID } from './pipelineBlocks';
import { AGENT_TEMPLATES, templateConfig, type AgentTemplate } from './agentTemplates';

/* ─────────────── Time Machine test fleet ──────────────────────────
   Ten additional strategies developed for the Time Machine
   tournament. They exist to be MEASURED against the shipped library
   on identical history — same small-ticket doctrine ($250 tickets,
   per-asset caps, rotation, fast harvests), different hunting
   styles, so the comparison says something about the STYLE, not
   about who got bigger tickets.
   ──────────────────────────────────────────────────────────────── */

const blockConfig = (id: string) => ({ ...(BLOCK_BY_ID.get(id)?.config ?? {}) });
const tpl = (id: string): AgentTemplate => AGENT_TEMPLATES.find((t) => t.id === id) ?? AGENT_TEMPLATES[0];

const agentStep = (t: AgentTemplate, referee = false) => makeStep('agent', referee ? `${t.name} (consensus)` : t.name, {
  ...blockConfig(referee ? 'agent_referee' : 'agent'), ...templateConfig(t), templateId: t.id, model: 'llama-3.3-70b-versatile',
});

const buy = (label: string, over: Record<string, number> = {}) => makeStep('buy', label, {
  ...blockConfig('buy'), amountUsd: 250,
  takeProfitPct: 1.0, stopLossPct: 0.5, maxHoldMin: 15, maxEntries: 20, cooldownMin: 1,
  scaleOutPct: 50, takeProfit2Pct: 2.0, trailPct: 0.4, ...over,
});

const screen = (classId: string, rotate = 3) => makeStep('screen', 'Find assets by condition',
  { ...blockConfig('screen'), classId, limit: 5, bindTop: true, rotate });
const branchBull = () => makeStep('branch', 'Only continue if bullish', { expects: 'bullish' });
const analysis = (programId: string, params: Record<string, any> = {}, label?: string) =>
  makeStep('analysis', label ?? programId.toUpperCase().replace(/_/g, ' '), { programId, params });

const refereeLane = (idx: number, ddPct: number, ...agents: AgentTemplate[]) => {
  const lane = makeLane('Referee — consensus & risk', idx);
  lane.consensus = true;
  lane.agree = { mode: 'any', expects: 'bullish', minConfidence: 0, veto: true };
  lane.steps = [
    ...agents.map((t) => agentStep(t, true)),
    makeStep('risk', `Loss limit −${ddPct}%`, { ...blockConfig('risk'), maxDrawdownPct: ddPct, blockOnBreach: true }),
  ];
  return lane;
};

const base = (name: string, budget: number, ddPct: number): PipeGraph => {
  const g = emptyGraph();
  g.name = name;
  g.risk = { maxDrawdownPct: ddPct, maxTotalInvestmentUsd: budget, maxPerAssetUsd: 1000 };
  g.session = { durationMin: 60, tickSec: 5, flattenOnStop: true, tradeWindowEt: '09:30-16:00' };
  return g;
};

const laneOf = (name: string, idx: number, steps: PipeLane['steps']) => {
  const lane = makeLane(name, idx);
  lane.steps = steps;
  return lane;
};

/* 1 — buys only dips that hold: pullback programs, no breakout chasing */
export const buildDipBuyer = (): PipeGraph => {
  const g = base('TM-01 DIP BUYER — retests only', 20000, 3);
  g.lanes = [
    laneOf('Dips — strong names', 0, [screen('breakout'), analysis('pullback_entry', { window: 30 }, 'PULLBACK ENTRY'), branchBull(), agentStep(tpl('entry_sniper')), buy('Buy the dip')]),
    laneOf('Dips — in play', 1, [screen('in_play'), analysis('pullback_entry', { window: 30 }, 'PULLBACK ENTRY'), branchBull(), buy('Buy the dip — fast')]),
    refereeLane(2, 3, tpl('risk_guardian')),
  ];
  return g;
};

/* 2 — fresh moves and gap continuations, catalyst-flavoured */
export const buildGapAndGo = (): PipeGraph => {
  const g = base('TM-02 GAP & GO — fresh move continuations', 20000, 3);
  g.lanes = [
    laneOf('Fresh signals', 0, [screen('fresh_signal'), analysis('breakout_confirm', { window: 30, hold: 2 }, 'BREAKOUT CONFIRM'), branchBull(), agentStep(tpl('gap_hunter')), buy('Ride the gap')]),
    laneOf('Hottest continuations', 1, [screen('hottest'), analysis('trend'), branchBull(), agentStep(tpl('catalyst_scout')), buy('Ride the catalyst', { takeProfitPct: 1.4, takeProfit2Pct: 2.8 })]),
    refereeLane(2, 3, tpl('regime_sentinel'), tpl('risk_guardian')),
  ];
  return g;
};

/* 3 — value reclaimer: oversold quality, z-score discipline */
export const buildValueReclaimer = (): PipeGraph => {
  const g = base('TM-03 VALUE RECLAIMER — oversold quality', 20000, 2.5);
  g.lanes = [
    laneOf('Oversold scanner', 0, [screen('oversold'), analysis('zscore', { window: 50 }, 'Z-SCORE'), makeStep('branch', 'Only continue if bearish', { expects: 'bearish' }), agentStep(tpl('vwap_anchor')), buy('Buy the reclaim', { takeProfitPct: 0.9, takeProfit2Pct: 1.8 })]),
    laneOf('Washed-out opportunity', 1, [screen('opportunity'), analysis('pullback_entry', { window: 30 }, 'PULLBACK ENTRY'), branchBull(), buy('Buy the washout')]),
    refereeLane(2, 2.5, tpl('risk_guardian')),
  ];
  return g;
};

/* 4 — pure fade room: two mean-reversion lanes, fade agent leads */
export const buildFadeRoom = (): PipeGraph => {
  const g = base('TM-04 FADE ROOM — mean reversion only', 15000, 2.5);
  g.lanes = [
    laneOf('Fade the stretch', 0, [screen('oversold'), analysis('zscore', { window: 50 }, 'Z-SCORE'), makeStep('branch', 'Only continue if bearish', { expects: 'bearish' }), agentStep(tpl('fade_trader')), buy('Buy the bounce', { takeProfitPct: 0.8, stopLossPct: 0.4, takeProfit2Pct: 1.6 })]),
    laneOf('Fade the storm', 1, [screen('volatility_storm'), analysis('zscore', { window: 50 }, 'Z-SCORE'), makeStep('branch', 'Only continue if bearish', { expects: 'bearish' }), buy('Buy the storm fade', { takeProfitPct: 0.8, stopLossPct: 0.4 })]),
    refereeLane(2, 2.5, tpl('defensive_captain')),
  ];
  return g;
};

/* 5 — scalp rush: the fastest exits on the desk */
export const buildScalpRush = (): PipeGraph => {
  const g = base('TM-05 SCALP RUSH — seconds matter', 20000, 3);
  const scalpBuy = (label: string) => buy(label, { takeProfitPct: 0.4, stopLossPct: 0.25, maxHoldMin: 5, maxEntries: 30, cooldownMin: 0, scaleOutPct: 0, takeProfit2Pct: 0, trailPct: 0.2 });
  g.lanes = [
    laneOf('Scalp — in play', 0, [screen('in_play', 5), analysis('trend'), branchBull(), agentStep(tpl('scalp_sergeant')), scalpBuy('Scalp it')]),
    laneOf('Scalp — momentum', 1, [screen('momentum_surge', 5), analysis('trend'), branchBull(), scalpBuy('Scalp the surge')]),
    refereeLane(2, 3, tpl('risk_guardian')),
  ];
  return g;
};

/* 6 — trend rider X: pure trend following, runners trailed wide */
export const buildTrendRiderX = (): PipeGraph => {
  const g = base('TM-06 TREND RIDER X — pure trend', 20000, 3);
  const ride = (label: string) => buy(label, { takeProfitPct: 1.2, scaleOutPct: 40, takeProfit2Pct: 3.2, trailPct: 0.7, maxHoldMin: 45 });
  g.lanes = [
    laneOf('Trend — up', 0, [screen('trend_up'), analysis('trend'), branchBull(), ride('Ride the trend')]),
    laneOf('Trend — best performing', 1, [screen('best'), analysis('trend'), branchBull(), agentStep(tpl('tape_reader')), ride('Ride the leader')]),
    refereeLane(2, 3, tpl('regime_sentinel')),
  ];
  return g;
};

/* 7 — breakout vault: confirmed breakouts only, tightest risk */
export const buildBreakoutVault = (): PipeGraph => {
  const g = base('TM-07 BREAKOUT VAULT — confirmed only, tight risk', 20000, 2);
  g.lanes = [
    laneOf('Vault — breakouts', 0, [screen('breakout'), analysis('breakout_confirm', { window: 30, hold: 3 }, 'BREAKOUT CONFIRM'), branchBull(), agentStep(tpl('entry_sniper')), buy('Vault entry', { takeProfitPct: 1.1, takeProfit2Pct: 2.2 })]),
    laneOf('Vault — in play breaks', 1, [screen('in_play'), analysis('breakout_confirm', { window: 30, hold: 3 }, 'BREAKOUT CONFIRM'), branchBull(), buy('Vault entry — fast', { takeProfitPct: 1.1, takeProfit2Pct: 2.2 })]),
    refereeLane(2, 2, tpl('risk_guardian'), tpl('breadth_reader')),
  ];
  return g;
};

/* 8 — sector rotator: always in the strongest group */
export const buildSectorRotatorTm = (): PipeGraph => {
  const g = base('TM-08 SECTOR ROTATOR — strongest groups only', 20000, 3);
  g.lanes = [
    laneOf('Rotation — hottest', 0, [screen('hottest', 4), analysis('trend'), branchBull(), agentStep(tpl('sector_rotator')), buy('Rotate in')]),
    laneOf('Rotation — momentum', 1, [screen('momentum_surge', 4), analysis('breakout_confirm', { window: 30, hold: 2 }, 'BREAKOUT CONFIRM'), branchBull(), buy('Rotate in — confirmed')]),
    refereeLane(2, 3, tpl('regime_sentinel'), tpl('risk_guardian')),
  ];
  return g;
};

/* 9 — defensive turtle: smallest harvests, hardest referees */
export const buildDefensiveTurtle = (): PipeGraph => {
  const g = base('TM-09 DEFENSIVE TURTLE — capital first', 20000, 1.5);
  const safe = (label: string) => buy(label, { takeProfitPct: 0.6, stopLossPct: 0.3, takeProfit2Pct: 1.2, maxHoldMin: 12 });
  g.lanes = [
    laneOf('Turtle — calm waters', 0, [screen('calm'), analysis('trend'), branchBull(), safe('Turtle entry')]),
    laneOf('Turtle — quality dips', 1, [screen('opportunity'), analysis('pullback_entry', { window: 30 }, 'PULLBACK ENTRY'), branchBull(), agentStep(tpl('vwap_anchor')), safe('Turtle dip entry')]),
    refereeLane(2, 1.5, tpl('defensive_captain'), tpl('risk_guardian')),
  ];
  return g;
};

/* 10 — omni desk: one lane of every style + a three-referee committee */
export const buildOmniDesk = (): PipeGraph => {
  const g = base('TM-10 OMNI DESK — every style at once', 25000, 3);
  g.lanes = [
    laneOf('Omni — breakouts', 0, [screen('breakout'), analysis('breakout_confirm', { window: 30, hold: 2 }, 'BREAKOUT CONFIRM'), branchBull(), agentStep(tpl('entry_sniper')), buy('Omni breakout')]),
    laneOf('Omni — dips', 1, [screen('in_play'), analysis('pullback_entry', { window: 30 }, 'PULLBACK ENTRY'), branchBull(), buy('Omni dip')]),
    laneOf('Omni — momentum', 2, [screen('momentum_surge'), analysis('trend'), branchBull(), agentStep(tpl('scalp_sergeant')), buy('Omni momentum', { takeProfitPct: 0.7, trailPct: 0.3 })]),
    laneOf('Omni — fades', 3, [screen('oversold'), analysis('zscore', { window: 50 }, 'Z-SCORE'), makeStep('branch', 'Only continue if bearish', { expects: 'bearish' }), agentStep(tpl('fade_trader')), buy('Omni fade', { takeProfitPct: 0.8, stopLossPct: 0.4 })]),
    refereeLane(4, 3, tpl('regime_sentinel'), tpl('breadth_reader'), tpl('defensive_captain')),
  ];
  return g;
};

export const TIME_MACHINE_STRATEGIES: Array<{ id: string; name: string; build: () => PipeGraph }> = [
  { id: 'tm01', name: 'TM-01 DIP BUYER', build: buildDipBuyer },
  { id: 'tm02', name: 'TM-02 GAP & GO', build: buildGapAndGo },
  { id: 'tm03', name: 'TM-03 VALUE RECLAIMER', build: buildValueReclaimer },
  { id: 'tm04', name: 'TM-04 FADE ROOM', build: buildFadeRoom },
  { id: 'tm05', name: 'TM-05 SCALP RUSH', build: buildScalpRush },
  { id: 'tm06', name: 'TM-06 TREND RIDER X', build: buildTrendRiderX },
  { id: 'tm07', name: 'TM-07 BREAKOUT VAULT', build: buildBreakoutVault },
  { id: 'tm08', name: 'TM-08 SECTOR ROTATOR', build: buildSectorRotatorTm },
  { id: 'tm09', name: 'TM-09 DEFENSIVE TURTLE', build: buildDefensiveTurtle },
  { id: 'tm10', name: 'TM-10 OMNI DESK', build: buildOmniDesk },
];
