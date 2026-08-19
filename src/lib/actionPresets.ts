// Action presets — ready-to-drop blueprint nodes for Pipeline v2.
// Every preset resolves to an existing runtime node kind with a pre-filled
// configuration, so the operator can compose a full strategy without typing
// a single number. No synthetic data is introduced: presets only carry sizing,
// routing and guardrail intent — prices always come from the live feed.

import type { BpKind } from './blueprintEngine';

export interface ActionPreset {
  id: string;
  label: string;
  blurb: string;
  kind: BpKind;
  tint: string;
  group: 'ORDERS' | 'GUARDS' | 'LOGIC' | 'ALERTS' | 'PLAYBOOKS';
  config: Record<string, unknown>;
}

const usd = (n: number) => (n >= 1000 ? `$${n / 1000}K` : `$${n}`);
const P: ActionPreset[] = [];
const add = (p: ActionPreset) => P.push(p);

/* ── ORDERS ── */
const SIZES = [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
SIZES.forEach((n) => add({
  id: `buy_${n}`, label: `BUY ${usd(n)}`, blurb: `Market buy ${usd(n)} notional on the active instrument.`,
  kind: 'buy', tint: 'emerald', group: 'ORDERS', config: { amountUsd: n },
}));
SIZES.forEach((n) => add({
  id: `sell_${n}`, label: `SELL ${usd(n)}`, blurb: `Market sell ${usd(n)} notional on the active instrument.`,
  kind: 'sell', tint: 'rose', group: 'ORDERS', config: { amountUsd: n },
}));
([['SCALE IN', [250, 250, 250]], ['PYRAMID', [500, 1000, 2000]], ['DCA LADDER', [1000, 1000, 1000, 1000]]] as const)
  .forEach(([name, legs]) => legs.forEach((amt, i) => add({
    id: `${name.toLowerCase().replace(/\s+/g, '_')}_${i + 1}`,
    label: `${name} LEG ${i + 1} (${usd(amt)})`,
    blurb: `Leg ${i + 1} of a ${name.toLowerCase()} entry sequence.`,
    kind: 'buy', tint: 'emerald', group: 'ORDERS', config: { amountUsd: amt },
  })));
([['TAKE PROFIT', [500, 1000, 2500]], ['SCALE OUT', [250, 250, 250]]] as const)
  .forEach(([name, legs]) => legs.forEach((amt, i) => add({
    id: `${name.toLowerCase().replace(/\s+/g, '_')}_${i + 1}`,
    label: `${name} LEG ${i + 1} (${usd(amt)})`,
    blurb: `Leg ${i + 1} of a ${name.toLowerCase()} exit sequence.`,
    kind: 'sell', tint: 'rose', group: 'ORDERS', config: { amountUsd: amt },
  })));

/* ── GUARDS ── */
[1, 2, 3, 4, 5, 7, 10, 12, 15, 20, 25, 30].forEach((pct) => {
  add({
    id: `risk_hard_${pct}`, label: `RISK STOP ${pct}%`, blurb: `Halt the pipeline if account drawdown exceeds ${pct}%.`,
    kind: 'risk', tint: 'red', group: 'GUARDS', config: { maxDrawdownPct: pct, blockOnBreach: true },
  });
  add({
    id: `risk_warn_${pct}`, label: `RISK WARN ${pct}%`, blurb: `Log a warning at ${pct}% drawdown but keep running.`,
    kind: 'risk', tint: 'amber', group: 'GUARDS', config: { maxDrawdownPct: pct, blockOnBreach: false },
  });
});

/* ── LOGIC ── */
(['bullish', 'bearish', 'neutral'] as const).forEach((sig) => add({
  id: `branch_${sig}`, label: `BRANCH IF ${sig.toUpperCase()}`,
  blurb: `Continue only when the upstream signal is ${sig}.`,
  kind: 'branch', tint: 'indigo', group: 'LOGIC', config: { expects: sig },
}));
add({ id: 'branch_pass', label: 'BRANCH PASS-THROUGH', blurb: 'Placeholder branch that always continues.', kind: 'branch', tint: 'indigo', group: 'LOGIC', config: { expects: '' } });

/* ── ALERTS ── */
(['above', 'below'] as const).forEach((dir) => add({
  id: `alert_${dir}`, label: `ALERT ${dir.toUpperCase()}`,
  blurb: `Fire when the live price trades ${dir} your level.`,
  kind: 'alert', tint: 'sky', group: 'ALERTS', config: { direction: dir, price: '' },
}));
([['TAKE PROFIT', 'above'], ['STOP LOSS', 'below'], ['BREAKOUT', 'above'], ['BREAKDOWN', 'below'],
  ['TRAIL CHECK', 'below'], ['TARGET 1', 'above'], ['TARGET 2', 'above'], ['PANIC LEVEL', 'below']] as const)
  .forEach(([name, dir]) => add({
    id: `alert_${name.toLowerCase().replace(/\s+/g, '_')}`, label: `ALERT · ${name}`,
    blurb: `${name} watch — fires ${dir} the level you set from the live price.`,
    kind: 'alert', tint: 'sky', group: 'ALERTS', config: { direction: dir, price: '' },
  }));

/* ── PLAYBOOKS (documented stage markers) ── */
const PLAYBOOKS: [string, string][] = [
  ['MOMENTUM ENTRY', 'Buy strength while trend slope and sharpe proxy both confirm.'],
  ['MEAN REVERSION', 'Fade stretched z-scores back toward the live mean.'],
  ['BREAKOUT CHASE', 'Enter on a confirmed Donchian channel break.'],
  ['PULLBACK BUY', 'Buy the first controlled dip inside an intact uptrend.'],
  ['RANGE SCALP', 'Work both sides of a bounded range with tight targets.'],
  ['GRID DEPLOY', 'Ladder orders through a bounded oscillating tape.'],
  ['TREND FOLLOW', 'Ride persistent drift, exit when efficiency collapses.'],
  ['VOLATILITY BREAKOUT', 'Trade the expansion out of a compressed squeeze.'],
  ['NEWS SPIKE FADE', 'Fade the exhaustion print after a violent dislocation.'],
  ['RISK OFF ROTATION', 'Cut beta, rotate into stability anchors.'],
  ['RISK ON ROTATION', 'Add beta while breadth is positive.'],
  ['HEDGE OVERLAY', 'Offset book exposure with an inverse position.'],
  ['PAIR SPREAD', 'Long the strong leg, short the weak leg of a pair.'],
  ['CARRY HOLD', 'Hold a stable instrument for slow accumulation.'],
  ['CAPITULATION BUY', 'Stage entries only after the flush stops accelerating.'],
  ['BLOW-OFF EXIT', 'Exit into parabolic strength before mean reversion.'],
  ['DRAWDOWN RECOVERY', 'Rebuild size gradually after a losing sequence.'],
  ['SESSION OPEN PLAN', 'Define what must be true before the first order.'],
  ['SESSION CLOSE PLAN', 'Flatten or reduce risk into the session end.'],
  ['CIRCUIT BREAKER', 'Stop all activity when the daily loss cap is hit.'],
  ['POSITION SIZING NOTE', 'Kelly-derived exposure capped at 25% of equity.'],
  ['LIQUIDITY CHECK', 'Only trade instruments with clean tick behaviour.'],
  ['CORRELATION CHECK', 'Avoid stacking correlated exposures.'],
  ['DATA QUALITY GATE', 'Require enough live samples before trusting signals.'],
  ['REVIEW CHECKPOINT', 'Log the outcome and what to change next run.'],
  ['ASSUMPTION LOG', 'Write the assumptions this pipeline depends on.'],
  ['EXIT RULES', 'Define target, stop and time-based exit up front.'],
  ['MAX EXPOSURE', 'Cap total notional across all open legs.'],
  ['SLIPPAGE BUDGET', 'Accept only fills inside the slippage budget.'],
  ['POST-MORTEM', 'Explain why the last run behaved the way it did.'],
];
PLAYBOOKS.forEach(([name, text]) => add({
  id: `play_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, label: name, blurb: text,
  kind: 'note', tint: 'slate', group: 'PLAYBOOKS', config: { text: `${name}: ${text}` },
}));

export const ACTION_PRESETS: ActionPreset[] = P;
export const PRESET_GROUPS = ['ORDERS', 'GUARDS', 'LOGIC', 'ALERTS', 'PLAYBOOKS'] as const;
export const PRESET_BY_ID = new Map(ACTION_PRESETS.map((p) => [p.id, p]));
