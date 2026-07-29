import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useFxRates, currencyGlyph, currencyName } from '@/hooks/useFxRates';
import { ChevronDown, Search } from 'lucide-react';

interface Props {
  amount: number | string;
  currency: string;
  onAmountChange: (v: number | '') => void;
  onCurrencyChange: (code: string) => void;
  /** Optional live instrument price (quoted in USD) for unit estimation. */
  livePrice?: number;
  /** Reports the USD-converted value whenever amount, currency or rate changes. */
  onUsdChange?: (usd: number) => void;
}

const fmt = (v: number, code: string) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: v < 10 ? 4 : 2 }).format(v) + ' ' + code;

/** Amount input with a clickable currency selector over the live international monetary system. */
export function CurrencyAmountField({
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  livePrice = 0,
  onUsdChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { data, isLoading, isError } = useFxRates();

  const codes = useMemo(() => (data ? Object.keys(data.rates).sort() : []), [data]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return codes;
    return codes.filter(c => c.toLowerCase().includes(q) || currencyName(c).toLowerCase().includes(q));
  }, [codes, query]);

  const rate = data?.rates?.[currency]; // units of `currency` per 1 USD
  const amt = Number(amount || 0);
  const usdValue = rate && rate > 0 ? amt / rate : currency === 'USD' ? amt : 0;
  const units = livePrice > 0 && usdValue > 0 ? usdValue / livePrice : 0;

  useEffect(() => {
    onUsdChange?.(usdValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usdValue]);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="h-9 px-2 flex items-center gap-1 rounded border border-gold/40 bg-black/60 text-gold-light hover:bg-gold/10"
          >
            <span className="text-xs font-mono">{currencyGlyph(currency)}</span>
            <span className="text-[9px] font-mono text-gold/60">{currency}</span>
            <ChevronDown className="w-3 h-3 text-gold/60" />
          </button>
          {open && (
            <div className="absolute z-50 mt-1 left-0 w-56 rounded border border-gold/30 bg-black/95 shadow-lg">
              <div className="flex items-center gap-1 px-2 py-1 border-b border-gold/20">
                <Search className="w-3 h-3 text-gold/50" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search currency…"
                  className="w-full bg-transparent text-[10px] font-mono text-gold-light outline-none placeholder:text-gold/30"
                />
              </div>
              <div className="max-h-56 overflow-y-auto">
                {isLoading && <p className="px-2 py-2 text-[9px] font-mono text-gold/50">Loading live rates…</p>}
                {isError && <p className="px-2 py-2 text-[9px] font-mono text-rose-400/80">Rate feed unavailable.</p>}
                {filtered.map(code => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => { onCurrencyChange(code); setOpen(false); setQuery(''); }}
                    className={`w-full flex items-center justify-between gap-2 px-2 py-1 text-left hover:bg-gold/10 ${code === currency ? 'bg-gold/10' : ''}`}
                  >
                    <span className="text-[10px] font-mono text-gold-light">
                      {currencyGlyph(code)} {code}
                    </span>
                    <span className="text-[8px] font-mono text-gold/50 truncate max-w-[110px]">{currencyName(code)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <Input
          type="number"
          value={amount ?? ''}
          placeholder="0.00"
          onChange={e => onAmountChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      </div>

      <div className="flex items-center justify-between text-[9px] font-mono">
        <span className="flex items-center gap-1 text-gold/60">
          <span className={`w-1.5 h-1.5 rounded-full ${rate ? 'bg-emerald-400 animate-pulse' : 'bg-gold/30'}`} />
          {rate ? `1 USD = ${fmt(rate, currency)}` : isError ? 'FX feed offline' : 'Fetching FX…'}
        </span>
        {amt > 0 && currency !== 'USD' && usdValue > 0 && (
          <span className="text-gold-light">≈ ${usdValue.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD</span>
        )}
      </div>

      {units > 0 && (
        <p className="text-[9px] font-mono text-gold/50">
          ≈ {units.toLocaleString('en-US', { maximumFractionDigits: 6 })} units @ ${livePrice.toLocaleString('en-US', { maximumFractionDigits: livePrice < 10 ? 4 : 2 })}
        </p>
      )}
    </div>
  );
}
