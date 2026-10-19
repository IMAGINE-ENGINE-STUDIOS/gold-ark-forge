// Plain-language block library for Pipeline V4.
// Every entry says what it DOES in normal words — no jargon, no node kinds
// exposed to the operator.

import type { StepKind } from './pipelineGraph';

export interface BlockDef {
  id: string;
  kind: StepKind;
  name: string;
  what: string;
  group: 'Market' | 'Decide' | 'Agents' | 'Protect' | 'Trade' | 'Notify' | 'Custom';
  config?: Record<string, any>;
}

export const BLOCK_GROUPS = ['Market', 'Decide', 'Agents', 'Protect', 'Trade', 'Notify', 'Custom'] as const;

/** Default prompts for a freshly dropped agent step. */
export const DEFAULT_AGENT = {
  agentName: 'Desk analyst',
  systemPrompt: [
    'You are a disciplined short-term trading analyst on the Gold Arrow desk. You only act on evidence in the context — never invent prices, volumes or news.',
    'Doctrine: a BUY needs a real trigger, not hope. Bullish means the price has broken above its recent range AND momentum agrees (trend slope positive, signal programs bullish). A price sitting inside its range is NEUTRAL, however much you like the asset.',
    'Respect the tape: on a flat or falling tape the correct verdict is neutral or hold. Protect capital first — the desk harvests +1% targets with -0.5% stops and a hard daily loss limit, so only bless setups with room to run.',
    'Answer with the verdict, a confidence that reflects the evidence (weak evidence = low confidence), and one short reason naming the deciding evidence.',
  ].join(' '),
  taskPrompt: 'Judge whether this asset is a buy right now. Use the indicators and the recent price path in the context. If the price has not broken its range or momentum disagrees, say neutral.',
  model: 'llama-3.3-70b-versatile',
  temperature: 0.3,
  minConfidence: 0.55,
  everyTicks: 6,
  context: { price: true, series: true, indicators: true, screen: true, positions: true, lanes: true },
};

export const BLOCKS: BlockDef[] = [
  { id: 'asset', kind: 'asset', group: 'Market', name: 'Pick an asset',
    what: 'Choose exactly which instrument this lane trades.', config: { ticker: '', label: '' } },
  { id: 'screen', kind: 'screen', group: 'Market', name: 'Find assets by condition',
    what: 'Scan the live market and pick the assets that match a condition, such as the hottest movers.',
    config: { classId: 'hottest', limit: 5, bindTop: true } },

  { id: 'analysis', kind: 'analysis', group: 'Decide', name: 'Run an analysis',
    what: 'Measure the live price history and produce a buy, sell or neutral signal.',
    config: { programId: 'rsi', params: {} } },
  { id: 'branch', kind: 'branch', group: 'Decide', name: 'Only continue if',
    what: 'Stop this lane unless the analysis before it produced the signal you require.',
    config: { expects: 'bullish' } },

  { id: 'agent', kind: 'agent', group: 'Agents', name: 'AI agent',
    what: 'An AI worker you prompt yourself. It reads the live context and returns a buy, sell, neutral or hold verdict with a confidence.',
    config: { ...DEFAULT_AGENT } },
  { id: 'agent_referee', kind: 'agent', group: 'Agents', name: 'AI referee (consensus)',
    what: 'An agent that reads every parallel lane and rules on whether the strategy may trade.',
    config: {
      ...DEFAULT_AGENT,
      agentName: 'Referee',
      systemPrompt: [
        'You are the risk referee for the Gold Arrow desk. You arbitrate across several trading lanes and rule on whether the strategy may open new positions this tick.',
        'Allow risk ONLY when the lanes genuinely agree: at least the required number of lanes bullish on real breakouts, no lane flashing a hard sell or risk breach, and the tape not flat. Disagreement, stale data, or all-neutral lanes means VETO — protecting the account beats missing a move.',
        'Never invent agreement that is not in the lane results. State the count of bullish lanes and the deciding evidence in your reason.',
      ].join(' '),
      taskPrompt: 'Read every lane result in the context and decide whether the strategy may open new positions now. Count the genuinely bullish lanes; if they disagree or the tape is flat, veto.',
    } },

  { id: 'risk', kind: 'risk', group: 'Protect', name: 'Loss limit',
    what: 'Halt the whole strategy if losses reach the percentage you set.',
    config: { maxDrawdownPct: 10, blockOnBreach: true } },

  { id: 'buy', kind: 'buy', group: 'Trade', name: 'Buy',
    what: 'Invest a dollar amount at the live market price, then manage the position with a target, a stop and a time limit.',
    config: { amountUsd: 1000, takeProfitPct: 0.6, stopLossPct: 0.4, maxHoldMin: 10, maxEntries: 1, cooldownMin: 3, scaleOutPct: 0, takeProfit2Pct: 0, trailPct: 0 } },
  { id: 'sell', kind: 'sell', group: 'Trade', name: 'Sell',
    what: 'Sell a dollar amount of what this lane already holds, at the live market price.',
    config: { amountUsd: 1000, maxEntries: 3, cooldownMin: 1 } },

  { id: 'alert_up', kind: 'alert', group: 'Notify', name: 'Alert when price rises above',
    what: 'Watch the price and flag it the moment it moves above your level.',
    config: { direction: 'above', price: 0 } },
  { id: 'alert_down', kind: 'alert', group: 'Notify', name: 'Alert when price falls below',
    what: 'Watch the price and flag it the moment it drops below your level.',
    config: { direction: 'below', price: 0 } },
  { id: 'note', kind: 'note', group: 'Notify', name: 'Note',
    what: 'A written reminder that shows up in the run report.', config: { text: 'Why this lane exists' } },

  { id: 'code', kind: 'code', group: 'Custom', name: 'Custom logic',
    what: 'Run your own saved code as a step in the lane.', config: { blockId: '', params: {}, timeoutMs: 4000 } },
];

/* ── Specialist agent blocks ──────────────────────────────────────
   Every desk specialist is its own one-click block (Agents tab): the
   block carries the specialist's full doctrine, task and temperament
   via templateConfig, so adding "Entry Sniper" adds the real Sniper —
   not a blank agent. ─────────────────────────────────────────────── */
import { AGENT_TEMPLATES, templateConfig } from './agentTemplates';

const AGENT_BLOCK_DEFS: BlockDef[] = AGENT_TEMPLATES.map((t) => ({
  id: `agent_${t.id}`,
  kind: 'agent' as const,
  group: 'Agents',
  name: t.name,
  what: `${t.role} Temperament: checks every ${t.everyTicks} ticks, needs ${Math.round(t.minConfidence * 100)}% confidence${t.referee ? ' — serves as a referee' : ''}.`,
  config: {
    ...DEFAULT_AGENT,
    ...templateConfig(t),
    templateId: t.id,
    model: 'llama-3.3-70b-versatile',
  },
}));

/* Pre-configured analysis blocks for the newer programs, so they are
   one click in the Decide tab instead of hidden in the inspector. */
const PROGRAM_BLOCK_DEFS: BlockDef[] = [
  { id: 'analysis_breakout_confirm', kind: 'analysis', group: 'Decide', name: 'BREAKOUT CONFIRM',
    what: 'Bullish only when a breakout HOLDS above the prior high for several samples and the drift agrees — the fakeout filter.',
    config: { programId: 'breakout_confirm', params: { window: 30, hold: 3 } } },
  { id: 'analysis_pullback_entry', kind: 'analysis', group: 'Decide', name: 'PULLBACK ENTRY',
    what: 'Bullish when price dips 0.15-0.70% off a strong run yet holds above the level it broke — buy the retest, not the chase.',
    config: { programId: 'pullback_entry', params: { window: 30 } } },
];

BLOCKS.push(...PROGRAM_BLOCK_DEFS, ...AGENT_BLOCK_DEFS);

export const BLOCK_BY_ID = new Map(BLOCKS.map((b) => [b.id, b]));

/** Human sentence describing a configured step, used across the 3D scene and reports. */
export const describeStep = (kind: StepKind, config: Record<string, any> = {}): string => {
  switch (kind) {
    case 'asset': return config.label || config.ticker || 'no asset chosen';
    case 'screen': return `${String(config.classId ?? 'condition').replace(/_/g, ' ')} · top ${config.limit ?? 5}`;
    case 'analysis': return String(config.programId ?? 'no program');
    case 'branch': return `needs ${config.expects ?? 'any'} signal`;
    case 'risk': return `stop at −${config.maxDrawdownPct ?? 10}%`;
    case 'buy':
      return `$${Number(config.amountUsd ?? 0).toLocaleString()} · +${config.takeProfitPct ?? 0}% / −${config.stopLossPct ?? 0}%`;
    case 'sell': return `$${Number(config.amountUsd ?? 0).toLocaleString()}`;
    case 'agent': return String(config.agentName || 'AI agent');
    case 'alert': return `${config.direction ?? 'above'} ${config.price ?? 0}`;
    case 'code': return config.blockName || 'custom code';
    case 'note': return String(config.text ?? '');
    default: return '';
  }
};

export const KIND_COLOR: Record<string, string> = {
  asset: '#d4af37', screen: '#38bdf8', analysis: '#a78bfa', branch: '#f59e0b',
  risk: '#f43f5e', buy: '#34d399', sell: '#fb7185', alert: '#22d3ee',
  code: '#c084fc', note: '#94a3b8', agent: '#f0abfc',
};