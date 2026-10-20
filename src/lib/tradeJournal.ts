import { supabase } from '@/integrations/supabase/client';

/* ─────────────────── THE TRADE JOURNAL ────────────────────────────
   One permanent, server-side record of EVERY fill — pipeline runs,
   server-worker runs and manual Swap trades alike — so the Book,
   the Fills and the Report show the same truth on every device.
   The paper store calls journalFill() for each executed order; rows
   are idempotent (user + client order id), and anything filled while
   signed out waits in a local outbox and lands the moment a session
   exists. Nothing about a trade lives only in one browser again.
   ──────────────────────────────────────────────────────────────── */

export interface JournalFill {
  clientOrderId: string;
  ticker: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  fees: number;
  closedPnl?: number;
  filledAt: number; // epoch ms
  source: 'pipeline' | 'server' | 'swap';
  runId?: string | null;
  laneName?: string | null;
}

export interface JournalRow extends JournalFill {
  id: string;
  userId: string;
}

const OUTBOX_KEY = 'ga_trade_journal_outbox_v1';

export const buildJournalRow = (fill: JournalFill, userId: string) => ({
  user_id: userId,
  client_order_id: fill.clientOrderId,
  run_id: fill.runId ?? null,
  source: fill.source,
  lane_name: fill.laneName ?? null,
  ticker: fill.ticker,
  side: fill.side,
  qty: fill.qty,
  price: fill.price,
  fees: fill.fees,
  closed_pnl: fill.closedPnl ?? null,
  filled_at: new Date(fill.filledAt).toISOString(),
});

const readOutbox = (): JournalFill[] => {
  try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) ?? '[]'); } catch { return []; }
};
const writeOutbox = (rows: JournalFill[]) => {
  try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(rows.slice(-300))); } catch { /* private mode */ }
};

let flushing = false;

/** Send every waiting fill to the journal. Safe to call often. */
export async function flushJournal(): Promise<void> {
  if (flushing) return;
  const outbox = readOutbox();
  if (!outbox.length) return;
  flushing = true;
  try {
    const { data: u } = await supabase.auth.getUser();
    const userId = u?.user?.id;
    if (!userId) return;
    const rows = outbox.map((f) => buildJournalRow(f, userId));
    const { error } = await (supabase as any)
      .from('trade_journal')
      .upsert(rows, { onConflict: 'user_id,client_order_id', ignoreDuplicates: true });
    if (!error) writeOutbox([]);
  } catch { /* stays in the outbox for the next flush */ } finally {
    flushing = false;
  }
}

/** Record one executed fill. Never throws, never blocks the trade. */
export function journalFill(fill: JournalFill): void {
  const outbox = readOutbox();
  if (!outbox.some((f) => f.clientOrderId === fill.clientOrderId)) {
    outbox.push(fill);
    writeOutbox(outbox);
  }
  void flushJournal();
}

/** History rescue: journal any local orders that predate the journal. */
export function backfillJournal(orders: Array<{
  id: string; symbol: string; side: 'buy' | 'sell'; qty: number; price: number;
  fees?: number; closedPnl?: number; filledAt: number;
}>): void {
  for (const o of orders) {
    journalFill({
      clientOrderId: o.id, ticker: o.symbol, side: o.side, qty: o.qty, price: o.price,
      fees: o.fees ?? 0, closedPnl: o.closedPnl, filledAt: o.filledAt, source: 'swap',
    });
  }
}

/** The newest journal rows for the signed-in user (all devices). */
export async function fetchJournal(limit = 40): Promise<JournalRow[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user?.id) return [];
  const { data, error } = await (supabase as any)
    .from('trade_journal')
    .select('id, user_id, client_order_id, run_id, source, lane_name, ticker, side, qty, price, fees, closed_pnl, filled_at')
    .eq('user_id', u.user.id)
    .order('filled_at', { ascending: false })
    .limit(limit);
  if (error || !Array.isArray(data)) return [];
  return data.map((r: any) => ({
    id: r.id, userId: r.user_id, clientOrderId: r.client_order_id, runId: r.run_id,
    source: r.source, laneName: r.lane_name, ticker: r.ticker, side: r.side,
    qty: Number(r.qty), price: Number(r.price), fees: Number(r.fees),
    closedPnl: r.closed_pnl === null ? undefined : Number(r.closed_pnl),
    filledAt: new Date(r.filled_at).getTime(),
  }));
}
