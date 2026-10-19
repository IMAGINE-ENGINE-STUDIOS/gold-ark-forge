import { useMemo, useState } from 'react';
import { Wallet, Zap, ShieldCheck } from 'lucide-react';
import type { PipeGraph } from '../../lib/pipelineGraph';
import { previewRunBudget } from '../../lib/runBudget';

/* ─────────────────── Run capital ──────────────────────────────────
   The one question before a run: how much money does this strategy
   run on? The typed number IS the budget — tickets and caps rescale
   to it live (preview below), the engine can never deploy more, and
   the same number is what a server run is queued with.
   ──────────────────────────────────────────────────────────────── */

const QUICK = [100, 500, 1000, 5000, 25000];
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default function RunCapitalPanel({
  graph, budget, onBudgetChange, adaptive, onAdaptiveChange, disabled,
}: {
  graph: PipeGraph;
  budget: number;
  onBudgetChange: (n: number) => void;
  adaptive: boolean;
  onAdaptiveChange: (b: boolean) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState<string | null>(null);
  const preview = useMemo(() => previewRunBudget(graph, Math.max(1, budget || 0)), [graph, budget]);
  const shown = text ?? String(budget || '');

  const commit = (raw: string) => {
    const n = Number(raw.replace(/[^0-9.]/g, ''));
    if (Number.isFinite(n) && n > 0) onBudgetChange(Math.round(n * 100) / 100);
  };

  return (
    <section className="mb-3 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/60 to-card/40 p-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Wallet className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-[14px] font-semibold leading-tight text-foreground">How much do you want to run this strategy on?</p>
            <p className="text-[12px] leading-tight text-muted-foreground">Type it — that exact amount becomes the strategy's budget.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-primary/50 bg-background/70 px-3 py-2 shadow-[0_0_18px_hsl(var(--primary)/0.15)]">
            <span className="mr-1 text-[16px] font-semibold text-primary">$</span>
            <input
              value={shown}
              disabled={disabled}
              inputMode="decimal"
              onChange={(e) => { setText(e.target.value); commit(e.target.value); }}
              onBlur={() => setText(null)}
              className="w-28 bg-transparent text-[17px] font-bold tabular-nums text-foreground outline-none"
              aria-label="Run budget in dollars"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {QUICK.map((q) => (
              <button
                key={q}
                disabled={disabled}
                onClick={() => { setText(null); onBudgetChange(q); }}
                className={`rounded-full border px-2.5 py-1 text-[12px] font-medium transition ${budget === q ? 'border-primary/70 bg-primary/25 text-primary' : 'border-border/60 bg-card/50 text-muted-foreground hover:text-foreground'}`}
              >
                {money(q)}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onAdaptiveChange(!adaptive)}
          disabled={disabled}
          className={`ml-auto flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${adaptive ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300' : 'border-border/60 bg-card/50 text-muted-foreground'}`}
          title="The adaptive governor reads live market breadth, tape strength and the run's own P&L every tick — pressing size into opportunity, cutting it under risk, pausing entries when breadth collapses"
        >
          {adaptive ? <Zap className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          Adaptive sizing {adaptive ? 'ON' : 'OFF'}
        </button>
      </div>

      {preview.lanes.length > 0 && (
        <p className="mt-2.5 border-t border-primary/15 pt-2 text-[12px] leading-relaxed text-muted-foreground">
          At <span className="font-semibold text-foreground">{money(preview.budget)}</span> this strategy adapts to:{' '}
          {preview.lanes.map((l, i) => (
            <span key={l.lane}>
              {i > 0 ? ' · ' : ''}
              {l.lane} tickets <span className="font-semibold text-foreground">{money(l.ticket)}</span>
              {l.designTicket !== l.ticket ? ` (designed at ${money(l.designTicket)})` : ''} × {l.maxEntries}
            </span>
          ))}
          {preview.perAssetCap !== null && (
            <> · at most <span className="font-semibold text-foreground">{money(preview.perAssetCap)}</span> in any one name</>
          )}
          {' '}· the engine can never deploy more than {money(preview.budget)}.
        </p>
      )}
    </section>
  );
}
