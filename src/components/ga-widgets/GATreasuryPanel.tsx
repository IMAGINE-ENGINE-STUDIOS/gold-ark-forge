/**
 * GATreasuryPanel — sovereign macro card powered by U.S. Treasury FiscalData.
 * Live avg yields on marketable securities + total public debt trend + FX rates.
 * Roman PAX aesthetic — compact, dense, gold-accented.
 */
import { useTreasuryData } from '@/hooks/useTreasuryData';
import { Landmark, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

function fmtMoney(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

export function GATreasuryPanel() {
  const { data, isLoading } = useTreasuryData();

  return (
    <div className="border border-gold/20 rounded-lg bg-navy-dark/70 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gold/10">
        <div className="flex items-center gap-2">
          <Landmark className="w-3.5 h-3.5 text-gold-light" />
          <span className="font-display text-[11px] tracking-[0.15em] text-gold-light uppercase">
            U.S. Treasury · Sovereign Macro
          </span>
        </div>
        <span className="text-[8px] font-mono text-marble/40">
          {data?.source ?? 'fiscaldata.treasury.gov'}
          {data?.cached ? ' · cached' : ''}
        </span>
      </div>

      {isLoading && (
        <div className="p-4 text-[10px] font-mono text-marble/40">Loading Treasury data…</div>
      )}

      {!isLoading && data && (
        <div className="p-3 space-y-3">
          {/* Public debt */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 rounded border border-gold/10 bg-black/30 p-2">
              <div className="text-[8px] font-mono uppercase tracking-wider text-marble/50">
                Total Public Debt
              </div>
              <div className="font-display text-[14px] text-gold-light tabular-nums">
                {fmtMoney(data.public_debt.latest)}
              </div>
              <div className="text-[8px] font-mono text-marble/40">
                as of {data.public_debt.latest_date ?? '—'}
              </div>
            </div>
            <div className="rounded border border-gold/10 bg-black/30 p-2">
              <div className="text-[8px] font-mono uppercase tracking-wider text-marble/50">
                30d Δ
              </div>
              <div className={`font-display text-[14px] tabular-nums flex items-center gap-1 ${
                (data.public_debt.change_30d_pct ?? 0) >= 0 ? 'text-rose-300' : 'text-emerald-300'
              }`}>
                {(data.public_debt.change_30d_pct ?? 0) >= 0
                  ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {data.public_debt.change_30d_pct != null
                  ? `${data.public_debt.change_30d_pct >= 0 ? '+' : ''}${data.public_debt.change_30d_pct.toFixed(2)}%`
                  : '—'}
              </div>
            </div>
          </div>

          {/* Avg interest rates */}
          <div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-marble/50 mb-1">
              Avg Interest · Marketable Treasuries · {data.avg_interest_rates.as_of ?? '—'}
            </div>
            <div className="grid grid-cols-2 gap-1">
              {data.avg_interest_rates.rates.slice(0, 6).map(r => (
                <div key={r.security} className="flex items-center justify-between rounded border border-gold/10 bg-black/20 px-2 py-1">
                  <span className="text-[9px] text-marble/70 truncate">{r.security}</span>
                  <span className="text-[11px] font-mono text-gold-light tabular-nums">
                    {r.rate.toFixed(3)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* FX rates */}
          <div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-marble/50 mb-1 flex items-center gap-1">
              <DollarSign className="w-2.5 h-2.5" /> Official Reporting FX (USD →)
            </div>
            <div className="grid grid-cols-3 gap-1">
              {Object.entries(data.fx).slice(0, 6).map(([country, q]) => (
                <div key={country} className="rounded border border-gold/10 bg-black/20 px-2 py-1">
                  <div className="text-[8px] text-marble/50 truncate">{country}</div>
                  <div className="text-[10px] font-mono text-marble/90 tabular-nums">
                    {q.rate.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !data && (
        <div className="p-4 text-[10px] font-mono text-rose-300/70">
          Treasury feed unavailable — check network.
        </div>
      )}
    </div>
  );
}