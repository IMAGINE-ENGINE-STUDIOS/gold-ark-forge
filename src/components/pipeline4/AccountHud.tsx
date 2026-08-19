import { useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, Layers, Percent, Gauge } from 'lucide-react';
import type { PaperAccount, PaperPosition } from '@/hooks/usePaperTrading';

const money = (n: number, d = 0) =>
  `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}`;

function Tile({
  label, value, tone = 'neutral', sub, icon: Icon,
}: {
  label: string; value: string; tone?: 'neutral' | 'up' | 'down'; sub?: string; icon?: any;
}) {
  const color = tone === 'up' ? 'text-emerald-400' : tone === 'down' ? 'text-rose-400' : 'text-foreground';
  return (
    <div className="min-w-[128px] flex-1 rounded-lg border border-border/50 bg-background/40 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />} {label}
      </div>
      <div className={`text-[17px] font-semibold tabular-nums leading-tight ${color}`}>{value}</div>
      {sub && <div className="text-[12px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Meter({ label, pct, danger, caption }: { label: string; pct: number; danger?: boolean; caption: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="min-w-[170px] flex-1 rounded-lg border border-border/50 bg-background/40 px-3 py-2">
      <div className="flex items-center justify-between text-[12px] text-muted-foreground">
        <span>{label}</span><span className="tabular-nums">{clamped.toFixed(0)}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border/50">
        <div
          className={`h-full rounded-full transition-all ${danger ? (clamped > 66 ? 'bg-rose-500' : clamped > 33 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-primary'}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="mt-1 text-[12px] text-muted-foreground">{caption}</div>
    </div>
  );
}

export default function AccountHud({
  account, positions, budget, lossLimitPct, runStartEquity,
}: {
  account: PaperAccount;
  positions: PaperPosition[];
  budget: number;
  lossLimitPct: number;
  runStartEquity: number | null;
}) {
  const unrealized = useMemo(() => positions.reduce((s, p) => s + (p.pnl || 0), 0), [positions]);
  const deployed = useMemo(
    () => positions.reduce((s, p) => s + Math.abs(p.entryPrice * p.qty), 0),
    [positions],
  );
  const totalPct = account.startingBalance > 0 ? (account.totalPnl / account.startingBalance) * 100 : 0;
  const base = runStartEquity ?? account.startingBalance;
  const drawdownPct = base > 0 ? Math.max(0, ((base - account.equity) / base) * 100) : 0;

  return (
    <section className="mb-3 flex flex-wrap gap-2 rounded-xl border border-border/60 bg-card/40 p-2 backdrop-blur">
      <Tile label="Equity" value={money(account.equity)} icon={Wallet} sub={`Start ${money(account.startingBalance)}`} />
      <Tile label="Cash available" value={money(account.cash)} sub={`${money(deployed)} deployed`} />
      <Tile
        label="Total P&L"
        value={`${account.totalPnl >= 0 ? '+' : ''}${money(account.totalPnl, 2)}`}
        tone={account.totalPnl >= 0 ? 'up' : 'down'}
        sub={`${totalPct >= 0 ? '+' : ''}${totalPct.toFixed(2)}% all time`}
        icon={account.totalPnl >= 0 ? TrendingUp : TrendingDown}
      />
      <Tile
        label="Open P&L"
        value={`${unrealized >= 0 ? '+' : ''}${money(unrealized, 2)}`}
        tone={unrealized >= 0 ? 'up' : 'down'}
        sub={`${positions.length} open position${positions.length === 1 ? '' : 's'}`}
        icon={Layers}
      />
      <Tile
        label="Win rate"
        value={`${account.winRate.toFixed(0)}%`}
        sub={`${account.winCount}W / ${account.lossCount}L · ${account.totalTrades} fills`}
        icon={Percent}
      />
      <Tile label="Fees paid" value={money(account.totalFees, 2)} sub={`Realized ${money(account.realizedPnl, 2)}`} icon={Gauge} />
      <Meter
        label="Budget used"
        pct={budget > 0 ? (deployed / budget) * 100 : 0}
        caption={`${money(deployed)} of ${money(budget)} strategy budget`}
      />
      <Meter
        label="Drawdown vs limit"
        danger
        pct={lossLimitPct > 0 ? (drawdownPct / lossLimitPct) * 100 : 0}
        caption={`${drawdownPct.toFixed(2)}% down against a ${lossLimitPct}% stop`}
      />
    </section>
  );
}
