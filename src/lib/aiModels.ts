// aiModels — the model catalog offered to operators anywhere an AI step or the
// Genius assistant needs a brain.
//
// Configuration mirrors Startup Factory Hub: Meta Llama models served by Groq
// through the Supabase edge functions (GROQ_API_KEY secret). Ids are exact
// Groq model ids. Anything not in this list is rejected by the pipeline-agent
// edge function, so keep the two in sync.

export interface AiModelOption {
  id: string;
  /** Plain-English name shown to a non-technical operator. */
  label: string;
  /** One-line "pick me when…" hint. */
  hint: string;
  vendor: 'Meta';
  /** Rough relative cost/speed badge for the picker. */
  tier: 'fastest' | 'balanced' | 'deep';
}

export const AI_MODELS: AiModelOption[] = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', hint: 'The default brain — strongest all-round judgement for agent steps and referees.', vendor: 'Meta', tier: 'balanced' },
  { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick', hint: 'Deepest reasoning — for the hardest strategy calls.', vendor: 'Meta', tier: 'deep' },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout', hint: 'Fast and light — good for bulk screening across many lanes.', vendor: 'Meta', tier: 'balanced' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant', hint: 'Fastest — for ticks every few seconds and simple checks.', vendor: 'Meta', tier: 'fastest' },
];

export const DEFAULT_AGENT_MODEL = 'llama-3.3-70b-versatile';

export const MODEL_BY_ID = Object.fromEntries(AI_MODELS.map((m) => [m.id, m])) as Record<string, AiModelOption>;

export const MODEL_VENDORS: Array<AiModelOption['vendor']> = ['Meta'];

export const modelLabel = (id?: string) => MODEL_BY_ID[id ?? '']?.label ?? id ?? DEFAULT_AGENT_MODEL;

/** The three one-click speeds an operator picks before ever opening Advanced. */
export const SPEED_PRESETS = [
  { id: 'fastest', label: 'Fast & cheap', model: 'llama-3.1-8b-instant', note: 'Best for ticks every few seconds.' },
  { id: 'balanced', label: 'Balanced', model: DEFAULT_AGENT_MODEL, note: 'Good judgement, still quick.' },
  { id: 'deep', label: 'Deep thinker', model: 'meta-llama/llama-4-maverick-17b-128e-instruct', note: 'Slower, most careful reasoning.' },
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
