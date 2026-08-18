import React, { useMemo, useState } from 'react';
import { Flame, Filter, Plus, TrendingUp } from 'lucide-react';
import SymbolLogo from '@/components/trading/SymbolLogo';
import {
  ASSET_CLASSES, classTint, rankByClass, type ClassId, type ClassifiedAsset,
} from '@/lib/assetClassifiers';

export interface ClassifierBoardProps {
  assets: ClassifiedAsset[];
  onAddScreen: (classId: ClassId) => void;
  onAddAsset: (ticker: string, label: string) => void;
}

export default function ClassifierBoard({ assets, onAddScreen, onAddAsset }: ClassifierBoardProps) {
  const [active, setActive] = useState<ClassId>('hottest');
  const def = ASSET_CLASSES.find((c) => c.id === active)!;
  const ranked = useMemo(() => rankByClass(assets, active, 12), [assets, active]);

  return (
    <section className="alien-panel alien-scan relative overflow-hidden p-3 sm:p-4">
      <div className="relative z-10 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Flame className="h-4 w-4 text-orange-400" />
          <span className="font-display text-[11px] tracking-[0.26em] text-gold-light">CLASSIFICATION ENGINE</span>
          <span className="alien-chip px-2 py-1 font-mono text-[8px] tracking-[0.18em] text-muted-foreground">
            {ASSET_CLASSES.length} SCREENS · {assets.length} LIVE INSTRUMENTS
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {ASSET_CLASSES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`rounded-md border px-2 py-1 font-mono text-[8px] tracking-[0.16em] transition ${classTint(c.tint)} ${active === c.id ? 'ring-1 ring-gold/60' : 'opacity-70 hover:opacity-100'}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-[9px] tracking-wider text-muted-foreground">{def.blurb}</p>
          <button
            onClick={() => onAddScreen(active)}
            className="alien-chip ml-auto flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[9px] tracking-[0.18em] text-gold-light hover:text-gold"
          >
            <Filter className="h-3 w-3" /> ADD SCREEN TO BLUEPRINT
          </button>
        </div>

        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ranked.length === 0 && (
            <p className="col-span-full font-mono text-[9px] tracking-wider text-muted-foreground">
              NO LIVE MEMBERS YET — SCREENS RESOLVE FROM REAL FEEDS ONLY. GIVE THE TAPE A MOMENT.
            </p>
          )}
          {ranked.map((a) => (
            <button
              key={a.ticker}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('application/x-ga-asset', JSON.stringify({ ticker: a.ticker, label: a.label }))}
              onClick={() => onAddAsset(a.ticker, a.label)}
              className="alien-chip group flex items-center gap-2 p-2 text-left transition hover:ring-1 hover:ring-gold/50"
            >
              <SymbolLogo symbol={a.label} ticker={a.ticker} cat={a.cat} className="h-6 w-6" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[10px] tracking-[0.12em] text-foreground">{a.label}</span>
                <span className="block font-mono text-[8px] tracking-wider text-muted-foreground">
                  {a.last > 0 ? a.last.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'} ·{' '}
                  <span className={a.derived.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {a.derived.change >= 0 ? '+' : ''}{a.derived.change.toFixed(2)}%
                  </span>
                </span>
              </span>
              <span className={`rounded border px-1.5 py-0.5 font-mono text-[8px] ${classTint(def.tint)}`}>
                {(a.scores[active] * 100).toFixed(0)}
              </span>
              <Plus className="h-3 w-3 text-gold-light opacity-0 transition group-hover:opacity-100" />
            </button>
          ))}
        </div>

        {ranked[0] && (
          <p className="flex items-center gap-1.5 font-mono text-[8px] tracking-[0.16em] text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            LEADER {ranked[0].label} · VOL {ranked[0].derived.volatility.toFixed(2)}% · DD {ranked[0].derived.drawdown.toFixed(2)}%
          </p>
        )}
      </div>
    </section>
  );
}