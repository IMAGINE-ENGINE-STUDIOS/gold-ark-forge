import { useState } from 'react';
import { Wallet, Zap, Layers } from 'lucide-react';
import type { PipeGraph } from '@/lib/pipelineGraph';
import { previewRunBudget, capitalPlan, type RunSetup } from '@/lib/runBudget';

/* ─────────────────── ONE FORM RULES THE RUN ───────────────────────
   Amount + limits + behaviour, unified in a single panel (the old
   split — a budget box here, limit inputs scattered in the command
   bar — is gone). What the operator sets here is exactly what the
   run obeys: the amount becomes the budget and the swarm works the
   FULL amount into the chosen strategy; the limits are stamped onto
   the run copy; the saved strategy design is never mutated.
   ──────────────────────────────────────────────────────────────── */

const CHIPS = [100, 500, 1000, 5000, 25000];
const fmt = (n: number) => n.toLocaleString('en-US');

interface Props {
  graph: PipeGraph;
  budget: number;
  onBudget: (n: number) => void;
  setup: RunSetup;
  onSetup: (s: RunSetup) => void;
  disabled?: boolean;
}

export default function RunSetupPanel({ graph, budget, onBudget, setup, onSetup, disabled }: Props) {
  const [text, setText] = useState(String(budget));
  const preview = previewRunBudget(graph, budget);
  const plan = capitalPlan(graph, budget);
  const set = (patch: Partial<RunSetup>) => onSetup({ ...setup, ...patch });

  const commitText = (raw: string) => {
    setText(raw);
    const n = Number(raw.replace(/[^0-9.]/g, ''));
    if (Number.isFinite(n) && n > 0) onBudget(Math.round(n));
  };

  const numField = (
    label: string,
    value: number,
    apply: (n: number) => void,
    opts: { min?: number; max?: number; width?: string; title?: string } = {},
  ) => (
    <label className="text-[11px] text-muted-foreground" title={opts.title}>
      {label}
      <input
        type="number"
        min={opts.min}
        max={opts.max}
        value={value}
        disabled={disabled}
        onChange={(e) => apply(Number(e.target.value))}
        className={`ml-2 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[13px] text-foreground outline-none disabled:opacity-50 ${opts.width ?? 'w-16'}`}
      />
    </label>
  );

  const toggle = (label: string, on: boolean, apply: (b: boolean) => void, title: string, Icon: typeof Zap) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => apply(!on)}
      title={title}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50 ${
        on ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-500' : 'border-border/60 text-muted-foreground hover:border-primary/50'
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label} {on ? 'ON' : 'OFF'}
    </button>
  );

  return (
    <section className="rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-card to-card p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Wallet className="h-4.5 w-4.5" />
          </span>
          <div>
            <div className="text-[13px] font-semibold leading-tight text-foreground">How much do you want to run this strategy on?</div>
            <div className="text-[11px] leading-tight text-muted-foreground">One form rules the run — amount, limits and how the swarm invests it.</div>
          </div>
        </div>

        <div className="flex items-center rounded-lg border border-primary/40 bg-background px-2 py-1">
          <span className="text-[15px] font-semibold text-muted-foreground">$</span>
          <input
            aria-label="Run budget in dollars"
            inputMode="numeric"
            value={text}
            disabled={disabled}
            onChange={(e) => commitText(e.target.value)}
            onBlur={() => setText(String(budget))}
            className="w-24 bg-transparent px-1 py-0.5 text-[17px] font-bold text-foreground outline-none disabled:opacity-50"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={disabled}
              onClick={() => { onBudget(c); setText(String(c)); }}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${
                budget === c ? 'border-primary bg-primary/15 text-primary' : 'border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
            >
              ${fmt(c)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {numField('Loss limit %', setup.lossPct, (n) => set({ lossPct: n }), { min: 0.5, max: 50, width: 'w-16', title: 'The run stops when it is down this much.' })}
          {numField('Run for (min)', setup.durationMin, (n) => set({ durationMin: n }), { min: 1, max: 480, width: 'w-16', title: 'How long the strategy stays live.' })}
          {numField('Check every (s)', setup.tickSec, (n) => set({ tickSec: n }), { min: 2, max: 600, width: 'w-14', title: 'How often every lane re-reads live prices and re-decides.' })}
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground" title="Close every position the session opened when it ends.">
            <input
              type="checkbox"
              checked={setup.flatten}
              disabled={disabled}
              onChange={(e) => set({ flatten: e.target.checked })}
            />
            Close all at end
          </label>
        </div>

        <div className="ml-auto flex flex-wrap gap-1.5">
          {toggle('Deploy the full amount', setup.fullDeployment, (b) => set({ fullDeployment: b }),
            'The swarm works the WHOLE typed budget into the strategy: screens pick the names, the specialist agents judge them, the referee guards the book, and position sizes follow a deployment schedule that targets 100% invested by the end of the session. Entries still need the strategy\u2019s own signals — the money follows the analysis, it never forces a trade the screens and agents rejected.', Layers)}
          {toggle('Adaptive sizing', setup.adaptive, (b) => set({ adaptive: b }),
            'The adaptive governor reads live market breadth, tape strength and the run\u2019s own P&L every tick — pressing size into opportunity, cutting it under risk, pausing entries when breadth collapses.', Zap)}
        </div>
      </div>

      <p className="mt-2 text-[11.5px] leading-snug text-muted-foreground">
        At <span className="font-semibold text-foreground">${fmt(budget)}</span> the swarm allocation plan is:{' '}
        {plan.length > 0
          ? plan.map((p) => `${p.lane} ${p.weightPct}% (tickets from $${fmt(p.ticket)})`).join(' · ')
          : 'no buy lanes in this strategy'}
        {' '}· at most <span className="font-semibold text-foreground">{preview.perAssetCap !== null ? `$${fmt(preview.perAssetCap)}` : 'the full budget'}</span> in any one name · the engine can never deploy more than ${fmt(budget)}.
      </p>
    </section>
  );
}
