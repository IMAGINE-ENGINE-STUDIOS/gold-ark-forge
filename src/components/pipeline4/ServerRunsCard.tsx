import { useCallback, useEffect, useState } from 'react';
import { Server, Square, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/* ─────────────────── Server runs ──────────────────────────────────
   Runs queued to the always-on server worker (Phase 0). The worker
   executes them with the same engine, on its own paper ledger, and
   heartbeats progress into pipeline_runs — this card is the window:
   live status while they run (tab can be closed; the run continues),
   the final summary when they finish, and a Stop that the worker
   honors at its next heartbeat.
   ──────────────────────────────────────────────────────────────── */

interface ServerRun {
  id: string;
  graph_name: string | null;
  status: string;
  started_at: string | null;
  stopped_at: string | null;
  heartbeat_at: string | null;
  summary: any;
}

const parseSummary = (s: any) => {
  if (!s) return {};
  if (typeof s === 'string') { try { return JSON.parse(s); } catch { return {}; } }
  return s;
};

const STATUS_STYLE: Record<string, string> = {
  queued: 'text-amber-200 border-amber-300/40 bg-amber-300/10',
  running: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10',
  finished: 'text-sky-200 border-sky-300/40 bg-sky-300/10',
  stopped: 'text-muted-foreground border-border/60 bg-white/5',
  failed: 'text-red-300 border-red-400/40 bg-red-400/10',
  interrupted: 'text-red-300 border-red-400/40 bg-red-400/10',
  stop_requested: 'text-amber-200 border-amber-300/40 bg-amber-300/10',
};

export default function ServerRunsCard() {
  const [runs, setRuns] = useState<ServerRun[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('pipeline_runs')
      .select('id, graph_name, status, started_at, stopped_at, heartbeat_at, summary')
      .eq('mode', 'server')
      .order('started_at', { ascending: false })
      .limit(8);
    if (Array.isArray(data)) setRuns(data as ServerRun[]);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
    const iv = setInterval(() => void load(), 10000);
    return () => clearInterval(iv);
  }, [load]);

  const stop = async (r: ServerRun) => {
    const next = r.status === 'queued' ? 'cancelled' : 'stop_requested';
    await (supabase as any).from('pipeline_runs').update({ status: next }).eq('id', r.id);
    void load();
  };

  if (!loaded || runs.length === 0) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
          <Server className="h-3.5 w-3.5 text-primary" /> Server runs — the always-on worker
        </p>
        <button onClick={() => void load()} className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>
      <div className="space-y-2">
        {runs.map((r) => {
          const s = parseSummary(r.summary);
          const live = r.status === 'running' || r.status === 'queued';
          return (
            <div key={r.id} className="flex items-center gap-2 rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-foreground">{r.graph_name ?? 'Untitled strategy'}</p>
                <p className="text-[11px] text-muted-foreground">
                  {r.started_at ? new Date(r.started_at).toLocaleString() : ''}
                  {typeof s.ticks === 'number' ? ` · ${s.ticks} ticks` : ''}
                  {typeof s.trades === 'number' ? ` · ${s.trades} trades` : ''}
                  {typeof s.tradesOpened === 'number' && typeof s.trades !== 'number' ? ` · ${s.tradesOpened} opened` : ''}
                  {typeof s.realised === 'number' ? ` · realised $${Number(s.realised).toFixed(2)}` : ''}
                  {s.stoppedByRisk ? ' · stopped by risk limit' : ''}
                  {s.interruptedNote ? ` · ${s.interruptedNote}` : ''}
                </p>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[r.status] ?? STATUS_STYLE.stopped}`}>
                {r.status.replace('_', ' ')}
              </span>
              {live && (
                <button
                  onClick={() => void stop(r)}
                  className="flex items-center gap-1 rounded-md border border-destructive/50 px-2 py-1 text-[11px] text-destructive"
                >
                  <Square className="h-3 w-3" /> Stop
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Server runs execute on the worker's own paper ledger with live prices and the real AI specialists — you can close this tab and they keep trading.
      </p>
    </div>
  );
}
