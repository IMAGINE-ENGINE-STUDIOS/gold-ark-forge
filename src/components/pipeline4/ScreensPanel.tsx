import { useMemo, useState } from 'react';
import { Filter, Plus } from 'lucide-react';
import TickerLogo from './TickerLogo';
import { ASSET_CLASSES, rankByClass, type ClassId, type ClassifiedAsset } from '@/lib/assetClassifiers';

export default function ScreensPanel({
  assets, onAddScreen, onAddAsset,
}: {
  assets: ClassifiedAsset[];
  onAddScreen: (classId: ClassId, label: string) => void;
  onAddAsset: (ticker: string, label: string) => void;
}) {
  const [active, setActive] = useState<ClassId>('hottest');
  const def = ASSET_CLASSES.find((c) => c.id === active)!;
  const ranked = useMemo(() => rankByClass(assets, active, 12), [assets, active]);

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto pr-1">
      <div className="flex flex-wrap gap-1">
        {ASSET_CLASSES.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            className={`rounded-md border px-1.5 py-1 text-[12px] ${active === c.id ? 'border-primary/60 bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:text-foreground'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <p className="text-[12px] text-muted-foreground">{def.blurb}</p>

      <button
        onClick={() => onAddScreen(active, def.label)}
        className="flex items-center justify-center gap-1.5 rounded-md border border-primary/50 bg-primary/10 py-1.5 text-[13px] text-primary"
      >
        <Filter className="h-3.5 w-3.5" /> Add this screen to the lane
      </button>

      <ul className="space-y-1">
        {!ranked.length && <li className="text-[12px] text-muted-foreground">No live members yet — screens resolve from real feeds only.</li>}
        {ranked.map((a) => (
          <li key={a.ticker}>
            <button
              onClick={() => onAddAsset(a.ticker, a.label)}
              className="flex w-full items-center gap-2 rounded-md border border-border/50 bg-background/40 px-2 py-1.5 text-left hover:border-primary/50"
            >
              <TickerLogo ticker={a.ticker} size={18} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-foreground">{a.label}</span>
                <span className="block text-[12px] text-muted-foreground tabular-nums">
                  {a.last > 0 ? a.last.toFixed(4) : 'no feed'}
                  {typeof a.derived?.change === 'number' && (
                    <span className={a.derived.change >= 0 ? ' text-emerald-400' : ' text-rose-400'}>
                      {' '}{a.derived.change >= 0 ? '+' : ''}{a.derived.change.toFixed(2)}%
                    </span>
                  )}
                </span>
              </span>
              <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
