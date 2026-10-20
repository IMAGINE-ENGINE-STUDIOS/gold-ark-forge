import { useCallback, useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { fetchJournal, type JournalRow } from '@/lib/tradeJournal';

/* ─── The permanent trade journal, in the UI ───────────────────────
   Reads trade_journal (the database record of every fill from every
   run and device) — this is the list that cannot be empty just
   because the browser changed. Polls while visible. */

const money = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(2)}`;
const SRC_LABEL: Record<JournalRow['source'], string> = { pipeline: 'PIPELINE', server: 'SERVER', swap: 'SWAP' };

export default function TradeJournalPanel({ compact = false }: { compact?: boolean }) {
  const [rows, setRows] = useState<JournalRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setRows(await fetchJournal(compact ? 15 : 40));
    setLoaded(true);
  }, [compact]);

  useEffect(() => {
    void load();
    const iv = setInterval(() => void load(), 20000);
    return () => clearInterval(iv);
  }, [load]);

  if (!loaded) return null;
  const closed = rows.filter((r) => r.closedPnl !== undefined);
  const realised = closed.reduce((s, r) => s + (r.closedPnl ?? 0), 0);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-display tracking-wider text-gold">
          <BookOpen className="h-3.5 w-3.5" /> TRADE JOURNAL — EVERY FILL, EVERY DEVICE
        </span>
        {rows.length > 0 && (
          <span className={`font-mono text-[10px] ${realised >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            closed {realised >= 0 ? '+' : ''}{money(realised)}
          </span>
        )}
      </div>
      {rows.length === 0 && (
        <p className="font-mono text-[10px] text-marble/35">
          No fills recorded yet. Every trade from a pipeline run, the server worker, or a manual Swap order lands here permanently once you are signed in.
        </p>
      )}
      {rows.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-2 border-b border-gold/5 px-2 py-1.5 font-mono text-[10px] text-marble/60">
          <span className={r.side === 'buy' ? 'text-emerald-400/80' : 'text-red-400/80'}>{r.side.toUpperCase()}</span>
          <span className="rounded border border-gold/20 px-1 text-[8px] text-gold/80">{SRC_LABEL[r.source]}</span>
          <span>{Number(r.qty).toFixed(4)} {r.ticker}</span>
          <span>@ ${Number(r.price).toFixed(2)}</span>
          {r.closedPnl !== undefined
            ? <span className={r.closedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>{r.closedPnl >= 0 ? '+' : ''}{money(r.closedPnl)}</span>
            : <span className="text-marble/30">open</span>}
          <span className="text-marble/30">{new Date(r.filledAt).toLocaleString([], { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
        </div>
      ))}
    </div>
  );
}
