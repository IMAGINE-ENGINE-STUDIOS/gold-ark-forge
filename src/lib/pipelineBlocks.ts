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
  systemPrompt: 'You are a disciplined short-term trading analyst. You only act on evidence in the context.',
  taskPrompt: 'Judge whether this asset is a buy right now. Use the indicators and the recent price path in the context.',
  model: 'google/gemini-2.5-flash',
  temperature: 0.3,
  minConfidence: 0.55,
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
      systemPrompt: 'You arbitrate across several trading lanes. You allow risk only when the lanes genuinely agree.',
      taskPrompt: 'Read every lane result in the context and decide whether the strategy may open new positions now.',
    } },

  { id: 'risk', kind: 'risk', group: 'Protect', name: 'Loss limit',
    what: 'Halt the whole strategy if losses reach the percentage you set.',
    config: { maxDrawdownPct: 10, blockOnBreach: true } },

  { id: 'buy', kind: 'buy', group: 'Trade', name: 'Buy',
    what: 'Invest a dollar amount at the live market price, then manage the position with a target, a stop and a time limit.',
    config: { amountUsd: 1000, takeProfitPct: 0.6, stopLossPct: 0.4, maxHoldMin: 10, maxEntries: 1, cooldownMin: 3 } },
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