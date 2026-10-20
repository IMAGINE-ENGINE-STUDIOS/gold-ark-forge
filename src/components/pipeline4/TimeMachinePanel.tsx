import { useEffect, useMemo, useState } from 'react';
import { History, Play, Loader2, Download, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BUILT_IN_STRATEGIES } from '@/lib/strategyLibrary';
import { TIME_MACHINE_STRATEGIES } from '@/lib/timeMachineStrategies';
import { TM_POOL, TM_SESSIONS, alignBars, runTournamentV2, type Bars, type StrategyScore, type TmScenario } from '@/lib/timeMachine';

/* ─────────────────────── Time Machine ─────────────────────────────
   Real market history, a FRESH scenario every run: the tournament
   draws a rotated 10-name universe from the pool, a shifted window
   across the fetched history, varied session lengths and a per-run
   execution friction — all from one seed (shown in the panel, so
   any scenario replays exactly). Every strategy faces the SAME
   scenario inside one tournament, on causal data only (no strategy
   can see a future bar). Agent verdicts inside history come from
   one fixed causal rule, identical for everyone (disclosed).
   ──────────────────────────────────────────────────────────────── */

const money = (v: number) => `${v < 0 ? '−' : '+'}$${Math.abs(v).toFixed(2)}`;

export default function TimeMachinePanel() {
  const [bars, setBars] = useState<Bars | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [scores, setScores] = useState<StrategyScore[] | null>(null);
  const [scenario, setScenario] = useState<TmScenario | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [ranAt, setRanAt] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('market-history', {
          body: { symbols: TM_POOL, interval: '5m', range: '5d', points: 600 },
        });
        if (error) throw error;
        const series = (data?.series ?? {}) as Bars;
        if (!Object.keys(series).length) throw new Error('the history service returned no series');
        if (alive) setBars(alignBars(series));
      } catch (e: any) {
        if (alive) setLoadError(`Could not load the week's history: ${e?.message ?? e}`);
      }
    })();
    return () => { alive = false; };
  }, []);

  const entries = useMemo(() => [
    ...BUILT_IN_STRATEGIES.map((e) => ({ id: e.id, name: e.name, build: e.build })),
    ...TIME_MACHINE_STRATEGIES.map((e) => ({ id: e.id, name: e.name, build: e.build })),
  ], []);

  const barCount = bars ? bars[Object.keys(bars)[0]]?.length ?? 0 : 0;

  const run = async () => {
    if (!bars || running) return;
    setRunning(true); setScores(null); setProgress({ done: 0, total: entries.length * TM_SESSIONS, current: '' });
    try {
      const seed = (Date.now() % 2147483647) + Math.floor(Math.random() * 100000);
      const { scores: result, scenario: sc } = await runTournamentV2(entries, bars, (done, total, current) => setProgress({ done, total, current }), seed);
      setScores(result);
      setScenario(sc);
      setRanAt(Date.now());
    } finally {
      setRunning(false);
      setProgress(null);
    }
  };

  const download = () => {
    if (!scores) return;
    const blob = new Blob([JSON.stringify({ ranAt, scenario, scores }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'time-machine-results.json'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-3">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <p className="text-[13px] font-semibold text-foreground">Time Machine — real history, a fresh scenario every run, every strategy, one fair fight</p>
      </div>

      <div className="rounded-md border border-white/10 bg-white/[0.02] p-2.5 text-[12px] leading-relaxed text-muted-foreground">
        <p className="flex items-start gap-1.5">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
          <span>
            <span className="text-foreground">No cheating, by construction:</span> at every tick a strategy only ever
            receives bars up to that moment — the future is never handed to a screen, a program or an agent.
            Agent verdicts inside history come from one fixed rule reading the same past-only data (the live desk
            uses the Groq specialists; history uses the rule so all {entries.length} strategies face identical
            judgment). Cooldowns compress in fast-forward and bars are closes only — the table says so, and the
            ranking is what counts.
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
        <span>
          {bars
            ? <>History loaded: {Object.keys(bars).length} symbols in the pool · {barCount} five-minute bars each · {entries.length} strategies. Each run draws a NEW scenario (rotated universe, shifted window, varied sessions, execution friction) from a fresh seed.</>
            : loadError ?? 'Loading market history…'}
        </span>
        <span className="ml-auto flex items-center gap-2">
          {scores && (
            <button onClick={download} className="flex items-center gap-1.5 rounded-md border border-border/60 px-2.5 py-1.5 text-[12px] text-foreground">
              <Download className="h-3.5 w-3.5" /> Results JSON
            </button>
          )}
          <button
            onClick={() => void run()}
            disabled={!bars || running}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground disabled:opacity-50"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Run the tournament
          </button>
        </span>
      </div>

      {running && progress && (
        <div>
          <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
            <span>Testing {progress.current}…</span>
            <span>{progress.done}/{progress.total} sessions</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div className="h-full bg-primary transition-all" style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">The whole tournament is built to finish in minutes — comfortably inside one hour.</p>
        </div>
      )}

      {scores && (
        <div className="overflow-x-auto">
          <p className="mb-2 text-[12px] text-muted-foreground">
            Final comparison — ranked by realised P&L across all {TM_SESSIONS} sessions
            {ranAt ? ` · finished ${new Date(ranAt).toLocaleTimeString()}` : ''}
            {scenario ? ` · scenario #${scenario.seed}: ${scenario.universe.join(', ')} · bars ${scenario.startBar}–${scenario.startBar + scenario.segLen * scenario.sessions} of ${scenario.totalBars} · friction ${scenario.frictionBps}bps` : ''}
          </p>
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="text-muted-foreground">
                <th className="pb-1 pr-2 font-medium">#</th>
                <th className="pb-1 pr-2 font-medium">Strategy</th>
                <th className="pb-1 pr-2 font-medium">Trades</th>
                <th className="pb-1 pr-2 font-medium">Win %</th>
                <th className="pb-1 pr-2 font-medium">Realised</th>
                <th className="pb-1 pr-2 font-medium">Return on budget</th>
                <th className="pb-1 pr-2 font-medium">Sessions won</th>
                <th className="pb-1 pr-2 font-medium">Peak deployed</th>
                <th className="pb-1 font-medium">Errors</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, i) => (
                <>
                  <tr
                    key={s.id}
                    className="cursor-pointer border-t border-white/5 text-foreground/90 hover:bg-white/[0.02]"
                    onClick={() => setOpenId(openId === s.id ? null : s.id)}
                  >
                    <td className="py-1.5 pr-2">{i + 1}</td>
                    <td className="py-1.5 pr-2 font-medium">
                      <span className="mr-1 inline-block align-middle text-muted-foreground">
                        {openId === s.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </span>
                      {s.name}
                    </td>
                    <td className="py-1.5 pr-2">{s.trades}</td>
                    <td className="py-1.5 pr-2">{s.trades ? s.winRatePct.toFixed(0) : '—'}</td>
                    <td className={`py-1.5 pr-2 font-semibold ${s.realised >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{money(s.realised)}</td>
                    <td className="py-1.5 pr-2">{s.returnOnBudgetPct >= 0 ? '+' : ''}{s.returnOnBudgetPct.toFixed(2)}%</td>
                    <td className="py-1.5 pr-2">{s.sessionsWon}/{TM_SESSIONS}</td>
                    <td className="py-1.5 pr-2">${s.peakDeployed.toLocaleString()}</td>
                    <td className="py-1.5">{s.errors}</td>
                  </tr>
                  {openId === s.id && (
                    <tr key={`${s.id}_detail`} className="border-t border-white/5 bg-white/[0.01]">
                      <td colSpan={9} className="px-2 py-2">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-5">
                          {s.sessions.map((ss) => (
                            <p key={ss.session} className="text-[11px] text-muted-foreground">
                              Session {ss.session}: {ss.trades} trades · {ss.wins}W/{ss.losses}L ·{' '}
                              <span className={ss.realised >= 0 ? 'text-emerald-300' : 'text-red-300'}>{money(ss.realised)}</span>
                            </p>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
