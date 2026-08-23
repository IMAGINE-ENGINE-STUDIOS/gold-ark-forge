// aiModels — the model catalog offered to operators anywhere an AI step or the
// Genius assistant needs a brain.
//
// Ids are exact Lovable AI Gateway ids. Anything not in this list is rejected by
// the pipeline-agent edge function, so keep the two in sync.

export interface AiModelOption {
  id: string;
  /** Plain-English name shown to a non-technical operator. */
  label: string;
  /** One-line "pick me when…" hint. */
  hint: string;
  vendor: 'Google' | 'OpenAI';
  /** Rough relative cost/speed badge for the picker. */
  tier: 'fastest' | 'balanced' | 'deep';
}

export const AI_MODELS: AiModelOption[] = [
  // ---- Google ----------------------------------------------------------
  { id: 'google/gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', hint: 'Cheapest — good for simple, very frequent checks.', vendor: 'Google', tier: 'fastest' },
  { id: 'google/gemini-3.7-flash', label: 'Gemini 3.7 Flash', hint: 'Latest fast Gemini. Great default for live trading ticks.', vendor: 'Google', tier: 'balanced' },
  { id: 'google/gemini-3.6-flash', label: 'Gemini 3.6 Flash', hint: 'Fast and reliable, one generation back.', vendor: 'Google', tier: 'balanced' },
  { id: 'google/gemini-3.5-flash', label: 'Gemini 3.5 Flash', hint: 'Fast reasoning for agentic lanes.', vendor: 'Google', tier: 'balanced' },
  { id: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (preview)', hint: 'Preview build of the Gemini 3 line.', vendor: 'Google', tier: 'balanced' },
  { id: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', hint: 'Strongest Gemini reasoning when quality beats speed.', vendor: 'Google', tier: 'deep' },
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', hint: 'Proven, low-cost workhorse.', vendor: 'Google', tier: 'balanced' },
  { id: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', hint: 'Very cheap for high-volume screening.', vendor: 'Google', tier: 'fastest' },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', hint: 'Deep multimodal reasoning on large context.', vendor: 'Google', tier: 'deep' },

  // ---- OpenAI ----------------------------------------------------------
  { id: 'openai/gpt-5.6-luna', label: 'GPT-5.6 Luna', hint: 'Fast and cheap GPT-5.6 for frequent decisions.', vendor: 'OpenAI', tier: 'fastest' },
  { id: 'openai/gpt-5.6-terra', label: 'GPT-5.6 Terra', hint: 'Balanced GPT-5.6 — flagship quality at lower cost.', vendor: 'OpenAI', tier: 'balanced' },
  { id: 'openai/gpt-5.6-sol', label: 'GPT-5.6 Sol', hint: 'Flagship OpenAI reasoning for the hardest calls.', vendor: 'OpenAI', tier: 'deep' },
  { id: 'openai/gpt-5.5', label: 'GPT-5.5', hint: 'Frontier analysis and complex strategy logic.', vendor: 'OpenAI', tier: 'deep' },
  { id: 'openai/gpt-5.4', label: 'GPT-5.4', hint: 'Affordable frontier model for serious analysis.', vendor: 'OpenAI', tier: 'balanced' },
  { id: 'openai/gpt-5.4-mini', label: 'GPT-5.4 Mini', hint: 'Strong mini model for high-volume lanes.', vendor: 'OpenAI', tier: 'fastest' },
  { id: 'openai/gpt-5.4-nano', label: 'GPT-5.4 Nano', hint: 'Fastest, cheapest GPT-5.4 for simple screens.', vendor: 'OpenAI', tier: 'fastest' },
  { id: 'openai/gpt-5.2', label: 'GPT-5.2', hint: 'Solid reasoning and problem solving.', vendor: 'OpenAI', tier: 'balanced' },
  { id: 'openai/gpt-5', label: 'GPT-5', hint: 'Accurate all-rounder.', vendor: 'OpenAI', tier: 'balanced' },
  { id: 'openai/gpt-5-mini', label: 'GPT-5 Mini', hint: 'Lower-cost general performance.', vendor: 'OpenAI', tier: 'fastest' },
  { id: 'openai/gpt-5-nano', label: 'GPT-5 Nano', hint: 'Cheapest OpenAI option.', vendor: 'OpenAI', tier: 'fastest' },
];

export const DEFAULT_AGENT_MODEL = 'google/gemini-3.7-flash';

export const MODEL_BY_ID = Object.fromEntries(AI_MODELS.map((m) => [m.id, m])) as Record<string, AiModelOption>;

export const MODEL_VENDORS: Array<AiModelOption['vendor']> = ['Google', 'OpenAI'];

export const modelLabel = (id?: string) => MODEL_BY_ID[id ?? '']?.label ?? id ?? DEFAULT_AGENT_MODEL;

/** The three one-click speeds an operator picks before ever opening Advanced. */
export const SPEED_PRESETS = [
  { id: 'fastest', label: 'Fast & cheap', model: 'google/gemini-3.1-flash-lite', note: 'Best for ticks every few seconds.' },
  { id: 'balanced', label: 'Balanced', model: DEFAULT_AGENT_MODEL, note: 'Good judgement, still quick.' },
  { id: 'deep', label: 'Deep thinker', model: 'openai/gpt-5.6-sol', note: 'Slower, most careful reasoning.' },
] as const;

/** Ready-made agent jobs so the operator only fills in one box (or none). */
export interface AgentPreset {
  id: string;
  label: string;
  blurb: string;
  systemPrompt: string;
  taskPrompt: string;
  temperature: number;
  minConfidence: number;
}

export const AGENT_PRESETS: AgentPreset[] = [
  {
    id: 'momentum',
    label: 'Momentum scout',
    blurb: 'Looks for a real move that has started and is still going.',
    systemPrompt: 'You are a disciplined momentum trader. You only act when price action and the indicators agree that a move is already underway.',
    taskPrompt: 'Is a tradable move underway right now on this asset? Answer bullish, bearish, neutral or hold with your confidence.',
    temperature: 0.2,
    minConfidence: 0.6,
  },
  {
    id: 'meanrev',
    label: 'Dip buyer',
    blurb: 'Buys stretched selloffs and fades over-extended rallies.',
    systemPrompt: 'You are a mean-reversion trader. You buy statistically stretched selloffs and fade over-extended rallies, never chasing.',
    taskPrompt: 'Is this asset stretched far enough from its recent average to revert? Give your verdict and confidence.',
    temperature: 0.25,
    minConfidence: 0.6,
  },
  {
    id: 'riskguard',
    label: 'Risk guard',
    blurb: 'Says hold or neutral unless the setup is genuinely safe.',
    systemPrompt: 'You are the risk officer. Your job is to protect capital. You approve a trade only when the downside is clearly limited.',
    taskPrompt: 'Given the open positions and the live context, should we add risk now? Answer hold or neutral unless the setup is clearly safe.',
    temperature: 0.1,
    minConfidence: 0.7,
  },
  {
    id: 'news',
    label: 'Macro reader',
    blurb: 'Weighs the wider market picture before committing.',
    systemPrompt: 'You are a macro strategist. You weigh the broad market backdrop and cross-asset behaviour before committing to a direction.',
    taskPrompt: 'What does the wider market picture imply for this asset over the next few hours?',
    temperature: 0.4,
    minConfidence: 0.55,
  },
  {
    id: 'referee',
    label: 'Referee',
    blurb: 'Arbitrates what the other lanes concluded (use in a consensus lane).',
    systemPrompt: 'You are the referee across parallel strategy lanes. You weigh what each lane concluded and issue one ruling for the whole desk.',
    taskPrompt: 'Read every lane verdict and issue the ruling the desk should follow.',
    temperature: 0.2,
    minConfidence: 0.6,
  },
  {
    id: 'custom',
    label: 'Custom',
    blurb: 'Write your own job description.',
    systemPrompt: '',
    taskPrompt: '',
    temperature: 0.3,
    minConfidence: 0.55,
  },
];

export const PRESET_BY_ID = Object.fromEntries(AGENT_PRESETS.map((p) => [p.id, p])) as Record<string, AgentPreset>;
