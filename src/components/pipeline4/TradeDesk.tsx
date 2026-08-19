import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import TickerLogo from './TickerLogo';
import LivePriceIndicator from '@/components/trading/LivePriceIndicator';
import { ALL_SYMBOLS } from '@/data/tradingSymbols';

export default function TradeDesk({
  getPrice, onSubmit, cash, defaultTicker,
}: {
  getPrice: (t: string) => number;
  onSubmit: (p: { symbol: string; side: 'buy' | 'sell'; qty: number; type: 'market' | 'limit'; price: number; limitPrice?: number }) => void;
  cash: number;
  defaultTicker?: string | null;
}) {
  const [q, setQ] = useState('');
  const [ticker, setTicker] = useState<string>(defaultTicker ?? 'BTC');
  const [amount, setAmount] = useState<number>(1000);
  const [type, setType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return ALL_SYMBOLS.filter((x) => x.ticker.toLowerCase().includes(s) || x.label.toLowerCase().includes(s)).slice(0, 24);
  }, [q]);

  const price = getPrice(ticker);
  const effective = type === 'limit' && limitPrice > 0 ? limitPrice : price;
  const qty = effective > 0 ? amount / effective : 0;

  const place = (side: 'buy' | 'sell') => {
    setErr(null); setOk(null);
    if (!(effective > 0)) { setErr('No live price for this asset yet.'); return; }
    if (!(amount > 0)) { setErr('Enter an amount greater than zero.'); return; }
    try {
      onSubmit({ symbol: ticker, side, qty, type, price, limitPrice: type === 'limit' ? limitPrice : undefined });
      setOk(`${side === 'buy' ? 'Bought' : 'Sold'} $${amount.toLocaleString()} of ${ticker}`);
    } catch (e: any) {
      setErr(e?.message ?? 'Order rejected');
    }
  };

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto pr-1">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search any asset"
          className="w-full rounded-md border border-border/60 bg-background/60 py-1.5 pl-7 pr-2 text-[13px] text-foreground outline-none focus:border-primary/60"
        />
      </div>

      {!!results.length && (
        <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border/50 bg-background/40 p-1">
          {results.map((s) => (
            <li key={s.key}>
              <button
                onClick={() => { setTicker(s.ticker); setQ(''); }}
                className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left hover:bg-primary/10"
              >
                <TickerLogo ticker={s.ticker} size={16} />
                <span className="truncate text-[13px] text-foreground">{s.label}</span>
                <span className="ml-auto text-[12px] text-muted-foreground">{s.ticker}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-lg border border-border/50 bg-background/40 p-2">
        <div className="flex items-center gap-2">
          <TickerLogo ticker={ticker} size={20} />
          <span className="text-[14px] font-semibold text-foreground">{ticker}</span>
          <div className="ml-auto"><LivePriceIndicator ticker={ticker} getPriceByTicker={getPrice} compact /></div>
        </div>
      </div>

      <label className="block space-y-1">
        <span className="block text-[13px] font-medium text-foreground">Amount (USD)</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[13px] text-foreground outline-none focus:border-primary/60"
        />
        <span className="block text-[12px] text-muted-foreground">
          ≈ {qty > 0 ? qty.toFixed(6) : '—'} units · cash ${Math.round(cash).toLocaleString()}
        </span>
      </label>

      <div className="flex gap-1">
        {(['market', 'limit'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 rounded-md border px-2 py-1 text-[13px] ${type === t ? 'border-primary/60 bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground'}`}
          >
            {t === 'market' ? 'Market' : 'Limit'}
          </button>
        ))}
      </div>

      {type === 'limit' && (
        <label className="block space-y-1">
          <span className="block text-[13px] font-medium text-foreground">Limit price</span>
          <div className="flex gap-1">
            <input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(Number(e.target.value))}
              className="w-full rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[13px] text-foreground outline-none"
            />
            <button onClick={() => setLimitPrice(price)} className="rounded-md border border-border/60 px-2 text-[12px] text-muted-foreground hover:text-foreground">
              Use live
            </button>
          </div>
        </label>
      )}

      <div className="flex gap-2">
        <button onClick={() => place('buy')} className="flex-1 rounded-md border border-emerald-500/50 bg-emerald-500/15 py-1.5 text-[13px] font-medium text-emerald-400">
          Buy
        </button>
        <button onClick={() => place('sell')} className="flex-1 rounded-md border border-rose-500/50 bg-rose-500/15 py-1.5 text-[13px] font-medium text-rose-400">
          Sell
        </button>
      </div>

      {err && <p className="text-[12px] text-rose-400">{err}</p>}
      {ok && <p className="text-[12px] text-emerald-400">{ok}</p>}
    </div>
  );
}
