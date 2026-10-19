import { useMemo, useState } from 'react';
import { ClipboardList, Loader2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { memoryTotals, type RunMemoryEntry } from '@/lib/pipelineMemory';
import type { GeniusAction, GeniusMemory } from './GeniusPanel';

/* ───────────────── Genius performance report ──────────────────────
   The desk's report card, in two layers:
   • THE NUMBERS (computed locally, always true): pipeline totals
     across every remembered run, plus a per-specialist table — how
     often each agent ruled, its bullish/neutral/bearish mix and its
     average confidence — and the run error count.
   • THE PLAN (Genius): the operator can ask Genius to review those
     numbers and propose concrete improvements AS ACTIONS. Nothing is
     applied automatically — each proposal is a card the operator
     approves or dismisses; approval runs it through the same action
     machinery the Genius chat uses.
   ──────────────────────────────────────────────────────────────── */

interface AgentRow {
  name: string; calls: number; bullish: number; neutral: number; bearish: number; avgConf: number;
}

export default function PerformanceReport({
  memory,
  buildContext,
  onApplyActions,
}: {
  memory: RunMemoryEntry[];
  buildContext: (m: GeniusMemory) => any;
  onApplyActions: (actions: GeniusAction[]) => string[];
}) {
  const [busy, setBusy] = useState(false);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [plans, setPlans] = useState<GeniusAction[]>([]);
  const [applied, setApplied] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => memoryTotals(memory), [memory]);

  const agents = useMemo<AgentRow[]>(() => {
    const map = new Map<string, AgentRow & { confSum: number }>();
    for (const run of memory) {
      for (const [name, st] of Object.entries(run.agentStats ?? {})) {
        const row = map.get(name) ?? { name, calls: 0, bullish: 0, neutral: 0, bearish: 0, avgConf: 0, confSum: 0 };
        row.calls += st.calls; row.bullish += st.bullish; row.neutral += st.neutral; row.bearish += st.bearish; row.confSum += st.confSum;
        map.set(name, row);
      }
    }
    return [...map.values()]
      .map((r) => ({ ...r, avgConf: r.calls ? r.confSum / r.calls : 0 }))
      .sort((a, b) => b.calls - a.calls);
  }, [memory]);

  const errorsTotal = useMemo(() => memory.reduce((a, r) => a + r.errors, 0), [memory]);
  const riskStops = useMemo(() => memory.filter((r) => r.stoppedByRisk).length, [memory]);

  const brief = () => {
    const lines = [
      `PERFORMANCE REPORT REQUEST. Review the desk's recorded results and propose concrete improvements as ACTIONS (the operator will approve each one before anything changes — do not assume approval).`,
      `Pipeline totals across ${memory.length} remembered runs: ${totals.trades} closed trades, ${totals.wins}W/${totals.losses}L, realised $${totals.realised.toFixed(2)}, fees $${totals.fees.toFixed(2)}, total errors ${errorsTotal}, risk-limit stops ${riskStops}.`,
      agents.length
        ? `Per-agent record: ${agents.map((a) => `${a.name}: ${a.calls} verdicts (${a.bullish} bullish / ${a.neutral} neutral / ${a.bearish} bearish), avg confidence ${Math.round(a.avgConf * 100)}%`).join('; ')}.`
        : 'No agent verdicts recorded yet.',
      `Focus your proposals on what the numbers show: agents that never commit, lanes that bleed, error sources, sizing and exit tuning. Keep the reply short: the headline verdict, then one line per proposal matching each action you emit.`,
    ];
    return lines.join('\n');
  };

  const generate = async () => {
    setBusy(true); setError(null); setPlans([]); setApplied({});
    try {
      const { data, error: err } = await supabase.functions.invoke('pipeline-v4-genius', {
        body: { message: brief(), page: buildContext({ objective: '', budget: null, notes: '' }), history: [] },
      });
      if (err) throw err;
      if (data?.error) throw new Error(data.details ?? data.error);
      const parts: string[] = [];
      if (data?.feasibility) parts.push(`Honest read: ${data.feasibility}`);
      if (data?.reply) parts.push(data.reply);
      setNarrative(parts.join('\n\n') || 'Genius returned no commentary.');
      setPlans(Array.isArray(data?.actions) ? data.actions : []);
      if (!Array.isArray(data?.actions) || !data.actions.length) {
        setNarrative((n) => `${n ?? ''}\n\nGenius proposed no machine-applicable changes this time — its advice above stands as guidance you can apply by hand.`);
      }
    } catch (e: any) {
      setError(`Genius could not generate the report: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };

  const describe = (a: GeniusAction): string => {
    const lane = a.laneIndex !== undefined ? `lane ${a.laneIndex + 1}` : '';
    switch (a.op) {
      case 'update_step': return `Change settings on a step${a.stepIndex !== undefined ? ` (step ${a.stepIndex + 1}${lane ? `, ${lane}` : ''})` : ''}: ${JSON.stringify(a.config ?? {})}`;
      case 'add_step': return `Add a step${lane ? ` to ${lane}` : ''}: ${a.label ?? a.kind ?? 'step'} ${JSON.stringify(a.config ?? {})}`;
      case 'remove_step': return `Remove step ${a.stepIndex !== undefined ? a.stepIndex + 1 : ''}${lane ? ` from ${lane}` : ''}`;
      case 'remove_lane': return `Remove ${lane || 'a lane'}`;
      case 'replace_lane': return `Rebuild ${lane || 'a lane'}${a.lanes?.[0]?.name ? ` as "${a.lanes[0].name}"` : ''}`;
      case 'add_lanes': return `Add ${a.lanes?.length ?? 0} new lane(s): ${(a.lanes ?? []).map((l) => l.name).join(', ')}`;
      case 'replace_all': return `Rebuild the whole strategy (${a.lanes?.length ?? 0} lanes)`;
      case 'set_risk': return `Change risk limits: ${JSON.stringify(a.risk ?? {})}`;
      case 'set_session': return `Change the session: ${JSON.stringify(a.session ?? {})}`;
      case 'rename_lane': return `Rename ${lane} to "${a.laneName ?? ''}"`;
      case 'clear': return 'Clear the strategy';
      default: return `${a.op}${lane ? ` on ${lane}` : ''}`;
    }
  };

  if (!memory.length) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
          <ClipboardList className="h-3.5 w-3.5 text-primary" /> Performance report — agents & pipeline
        </p>
        <button
          onClick={() => void generate()}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[12px] font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Ask Genius for the improvement plan
        </button>
      </div>

      <p className="mb-3 text-[12px] text-muted-foreground">
        {memory.length} runs · {totals.trades} closed trades · {totals.wins}W/{totals.losses}L ·
        realised <span className={totals.realised >= 0 ? 'text-emerald-300' : 'text-red-300'}>${totals.realised.toFixed(2)}</span> ·
        errors {errorsTotal} · risk stops {riskStops}
      </p>

      {agents.length > 0 && (
        <div className="mb-3 overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="text-muted-foreground">
                <th className="pb-1 pr-2 font-medium">Agent</th>
                <th className="pb-1 pr-2 font-medium">Verdicts</th>
                <th className="pb-1 pr-2 font-medium">Bull / Flat / Bear</th>
                <th className="pb-1 font-medium">Avg confidence</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.name} className="border-t border-white/5 text-foreground/90">
                  <td className="py-1 pr-2 font-medium">{a.name}</td>
                  <td className="py-1 pr-2">{a.calls}</td>
                  <td className="py-1 pr-2">
                    <span className="text-emerald-300">{a.bullish}</span> / {a.neutral} / <span className="text-red-300">{a.bearish}</span>
                  </td>
                  <td className="py-1">{Math.round(a.avgConf * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {agents.length === 0 && (
        <p className="mb-3 text-[12px] text-muted-foreground">
          No agent verdicts in the remembered runs yet — run a strategy with specialists (SWARM or APEX) and their record will build here.
        </p>
      )}

      {error && <p className="mb-2 text-[12px] text-red-300">{error}</p>}
      {narrative && (
        <div className="mb-3 whitespace-pre-wrap rounded-md border border-white/10 bg-white/[0.02] p-2.5 text-[12px] leading-relaxed text-foreground/90">
          {narrative}
        </div>
      )}

      {plans.length > 0 && (
        <div className="space-y-2">
          <p className="text-[12px] font-semibold text-foreground">Improvement plans — nothing applies until you approve it</p>
          {plans.map((a, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-2">
              <p className="min-w-0 flex-1 text-[12px] text-foreground/90">{describe(a)}</p>
              {applied[i] ? (
                <span className="flex items-center gap-1 text-[12px] text-emerald-300"><Check className="h-3.5 w-3.5" /> {applied[i]}</span>
              ) : (
                <>
                  <button
                    onClick={() => {
                      const notes = onApplyActions([a]);
                      setApplied((s) => ({ ...s, [i]: notes[0] ?? 'applied' }));
                    }}
                    className="rounded-md bg-primary px-2 py-1 text-[12px] font-medium text-primary-foreground"
                  >
                    Approve & apply
                  </button>
                  <button
                    onClick={() => setApplied((s) => ({ ...s, [i]: 'dismissed' }))}
                    className="flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-[12px] text-muted-foreground"
                  >
                    <X className="h-3 w-3" /> Dismiss
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
