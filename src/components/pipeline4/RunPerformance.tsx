import { useMemo } from 'react';
import type { RunEvent } from '@/lib/parallelEngine';

export interface LaneStat {
  laneId: string;
  laneName: string;
  steps: number;
  done: number;
  trades: number;
  invested: number;
  errors: number;
  status: 'idle' | 'running' | 'error' | 'done';
  last: string;
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) {
    return <div className="flex h-16 items-center justify-center text-[12px] text-muted-foreground">Equity curve builds while a run is live.</div>;
  }
  const min = Math.min(...points), max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => `${(i / (points.length - 1)) * 100},${30 - ((p - min) / span) * 28}`)
    .join(' ');
  const up = points[points.length - 1] >= points[0];
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-16 w-full">
      <polyline points={d} fill="none" stroke={up ? '#34d399' : '#fb7185'} strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function RunPerformance({
  events, lanes, equityCurve, running, startEquity, equity,
}: {
  events: RunEvent[];
  lanes: LaneStat[];
  equityCurve: number[];
  running: boolean;
  startEquity: number | null;
  equity: number;
}) {
  const delta = startEquity != null ? equity - startEquity : 0;
  const deltaPct = startEquity ? (delta / startEquity) * 100 : 0;
  const trace = useMemo(() => events.slice(-120).reverse(), [events]);

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto pr-1">
      <div className="rounded-lg border border-border/50 bg-background/40 p-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-muted-foreground">{running ? 'Live run' : startEquity != null ? 'Last run' : 'No run yet'}</span>
          <span className={`text-[15px] font-semibold tabular-nums ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {startEquity != null ? `${delta >= 0 ? '+' : ''}$${delta.toFixed(2)} (${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(2)}%)` : '—'}
          </span>
        </div>
        <Sparkline points={equityCurve} />
      </div>

      <div className="space-y-1.5">
        {lanes.map((l) => (
          <div key={l.laneId} className="rounded-lg border border-border/50 bg-background/40 p-2">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${
                l.status === 'running' ? 'animate-pulse bg-primary'
                : l.status === 'error' ? 'bg-rose-500'
                : l.status === 'done' ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`}
              />
              <span className="truncate text-[13px] font-medium text-foreground">{l.laneName}</span>
              <span className="ml-auto text-[12px] text-muted-foreground tabular-nums">{l.done}/{l.steps} steps</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[12px] text-muted-foreground tabular-nums">
              <span>{l.trades} trade{l.trades === 1 ? '' : 's'}</span>
              <span>${Math.round(l.invested).toLocaleString()} deployed</span>
              <span className={l.errors ? 'text-rose-400' : ''}>{l.errors} error{l.errors === 1 ? '' : 's'}</span>
            </div>
            {l.last && <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">{l.last}</p>}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {!trace.length && <p className="text-[13px] text-muted-foreground">Press “Run all lanes” and every step reports here in real time.</p>}
        {trace.map((e, i) => (
          <p key={i} className={`text-[12px] leading-snug ${
            e.status === 'error' ? 'text-rose-400'
            : e.status === 'skip' ? 'text-amber-300'
            : e.status === 'info' ? 'text-muted-foreground' : 'text-foreground'}`}
          >
            <span className="text-muted-foreground">{e.laneName} › {e.stepLabel}: </span>{e.message}
          </p>
        ))}
      </div>
    </div>
  );
}
