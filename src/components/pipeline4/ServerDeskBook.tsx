import { useCallback, useEffect, useState } from 'react';
import { Server } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/* ─────────────────── Server desk — in the Book ────────────────────
   Runs executed by the always-on server worker keep their own ledger
   (pipeline_run_trades in her database — permanent). The Book shows
   them next to the paper book: open server positions, closed server
   trades with their P&L, and the server's total realised line, so no
   investment or earning ever lives on only one screen.
   ──────────────────────────────────────────────────────────────── */

interface STrade {
  id: string;
  run_id: string;
  ticker: string;
  qty: number;
  entry_price: number;
  exit_price: number | null;
  pnl: number | null;
  opened_at: string;
  closed_at: string | null;
}

const money = (n: number, d = 2) => `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}`;

export default function ServerDeskBook() {
  const [trades, setTrades] = useState<STrade[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const { data: runs } = await (supabase as any)
      .from('pipeline_runs')
      .select('id')
      .eq('mode', 'server')
      .order('started_at', { ascending: false })
      .limit(10);
    const ids = (runs ?? []).map((r: any) => r.id);
    if (ids.length) {
      const { data } = await (supabase as any)
        .from('pipeline_run_trades')
        .select('id, run_id, ticker, qty, entry_price, exit_price, pnl, opened_at, closed_at')
        .in('run_id', ids)
        .order('opened_at', { ascending: false })
        .limit(60);
      if (Array.isArray(data)) setTrades(data as STrade[]);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
    const iv = setInterval(() => void load(), 15000);
    return () => clearInterval(iv);
  }, [load]);

  if (!loaded || trades.length === 0) return null;
  const open = trades.filter((t) => t.exit_price === null);
  const closed = trades.filter((t) => t.exit_price !== null);
  const realised = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const deployed = open.reduce((s, t) => s + t.qty * t.entry_price, 0);

  return (
    <div className="space-y-2 border-t border-gold/10 pt-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-display tracking-wider text-gold">
          <Server className="h-3.5 w-3.5" /> SERVER DESK — WORKER INVESTMENTS
        </span>
        <span className={`font-mono text-[10px] ${realised >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          realised {realised >= 0 ? '+' : ''}{money(realised)}
        </span>
      </div>
      <div className="font-mono text-[10px] text-marble/40">
        {open.length} open · {money(deployed)} deployed · {closed.length} closed
      </div>
      {open.map((t) => (
        <div key={t.id} className="flex items-center justify-between px-2 py-1.5 font-mono text-[10px] text-marble/60 border-b border-gold/5">
          <span className="text-emerald-400/80">OPEN</span>
          <span>{Number(t.qty).toFixed(4)} {t.ticker}</span>
          <span>@ ${Number(t.entry_price).toFixed(2)}</span>
          <span className="text-marble/30">{new Date(t.opened_at).toLocaleTimeString()}</span>
        </div>
      ))}
      {closed.slice(0, 10).map((t) => (
        <div key={t.id} className="flex items-center justify-between px-2 py-1.5 font-mono text-[10px] text-marble/60 border-b border-gold/5">
          <span className="text-marble/40">CLOSED</span>
          <span>{Number(t.qty).toFixed(4)} {t.ticker}</span>
          <span>${Number(t.entry_price).toFixed(2)} → ${Number(t.exit_price).toFixed(2)}</span>
          <span className={(t.pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {(t.pnl ?? 0) >= 0 ? '+' : ''}{money(t.pnl ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
}
