// Plain-language block library for Pipeline V4.
// Every entry says what it DOES in normal words — no jargon, no node kinds
// exposed to the operator.

import type { StepKind } from './pipelineGraph';

export interface BlockDef {
  id: string;
  kind: StepKind;
  name: string;
  what: string;
  group: 'Market' | 'Decide' | 'Protect' | 'Trade' | 'Notify' | 'Custom';
  config?: Record<string, any>;
}

export const BLOCK_GROUPS = ['Market', 'Decide', 'Protect', 'Trade', 'Notify', 'Custom'] as const;

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

  { id: 'risk', kind: 'risk', group: 'Protect', name: 'Loss limit',
    what: 'Halt the whole strategy if losses reach the percentage you set.',
    config: { maxDrawdownPct: 10, blockOnBreach: true } },

  { id: 'buy', kind: 'buy', group: 'Trade', name: 'Buy',
    what: 'Invest a dollar amount at the live market price.', config: { amountUsd: 1000 } },
  { id: 'sell', kind: 'sell', group: 'Trade', name: 'Sell',
    what: 'Sell a dollar amount at the live market price.', config: { amountUsd: 1000 } },

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
    case 'sell': return `$${Number(config.amountUsd ?? 0).toLocaleString()}`;
    case 'alert': return `${config.direction ?? 'above'} ${config.price ?? 0}`;
    case 'code': return config.blockName || 'custom code';
    case 'note': return String(config.text ?? '');
    default: return '';
  }
};

export const KIND_COLOR: Record<string, string> = {
  asset: '#d4af37', screen: '#38bdf8', analysis: '#a78bfa', branch: '#f59e0b',
  risk: '#f43f5e', buy: '#34d399', sell: '#fb7185', alert: '#22d3ee',
  code: '#c084fc', note: '#94a3b8',
};