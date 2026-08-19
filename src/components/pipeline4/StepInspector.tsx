import { useMemo, useState } from 'react';
import { Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { ALL_SYMBOLS } from '@/data/tradingSymbols';
import { ASSET_CLASSES } from '@/lib/assetClassifiers';
import { ANALYSIS_PROGRAMS } from '@/lib/analysisPrograms';
import type { CustomBlock } from '@/lib/customBlocks';
import type { PipeStep } from '@/lib/pipelineGraph';

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <label className="block space-y-1">
    <span className="block text-[13px] font-medium text-foreground">{label}</span>
    {children}
    {hint && <span className="block text-[12px] text-muted-foreground">{hint}</span>}
  </label>
);

const inputCls =
  'w-full rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[13px] text-foreground outline-none focus:border-primary/60';

export default function StepInspector({
  step, price, blocks, onChange, onDelete, onMove,
}: {
  step: PipeStep;
  price: number;
  blocks: CustomBlock[];
  onChange: (config: Record<string, any>, label?: string) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [assetQuery, setAssetQuery] = useState('');
  const cfg = step.config ?? {};
  const set = (patch: Record<string, any>, label?: string) => onChange({ ...cfg, ...patch }, label);

  const assetResults = useMemo(() => {
    const q = assetQuery.trim().toLowerCase();
    if (!q) return ALL_SYMBOLS.slice(0, 25);
    return ALL_SYMBOLS.filter(
      (s) => s.ticker.toLowerCase().includes(q) || s.label.toLowerCase().includes(q),
    ).slice(0, 40);
  }, [assetQuery]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-foreground">{step.label}</div>
          <div className="text-[12px] text-muted-foreground">Configure this step</div>
        </div>
        <button onClick={() => onMove(-1)} className="rounded border border-border/60 p-1 text-muted-foreground hover:text-foreground" title="Move earlier">
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onMove(1)} className="rounded border border-border/60 p-1 text-muted-foreground hover:text-foreground" title="Move later">
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDelete} className="rounded border border-destructive/50 p-1 text-destructive hover:bg-destructive/10" title="Remove step">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5">
        {step.kind === 'asset' && (
          <>
            <Field label="Which asset should this lane trade?">
              <input value={assetQuery} onChange={(e) => setAssetQuery(e.target.value)} placeholder="Search gold, BTC, AAPL…" className={inputCls} />
            </Field>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border/50 p-1">
              {assetResults.map((s) => (
                <button
                  key={s.key}
                  onClick={() => set({ ticker: s.ticker, label: s.label }, s.label)}
                  className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-[13px] transition hover:bg-primary/10 ${
                    cfg.ticker === s.ticker ? 'bg-primary/15 text-primary' : 'text-foreground'
                  }`}
                >
                  <span className="truncate">{s.label}</span>
                  <span className="ml-2 shrink-0 font-mono text-[12px] text-muted-foreground">{s.ticker}</span>
                </button>
              ))}
            </div>
            {cfg.ticker && (
              <p className="text-[12px] text-muted-foreground">
                Live price: {price > 0 ? price.toLocaleString(undefined, { maximumFractionDigits: 4 }) : 'waiting for the feed'}
              </p>
            )}
          </>
        )}

        {step.kind === 'screen' && (
          <>
            <Field label="Market condition to look for">
              <select value={cfg.classId ?? ''} onChange={(e) => set({ classId: e.target.value }, ASSET_CLASSES.find((c) => c.id === e.target.value)?.label)} className={inputCls}>
                {ASSET_CLASSES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            <p className="text-[12px] text-muted-foreground">
              {ASSET_CLASSES.find((c) => c.id === cfg.classId)?.blurb}
            </p>
            <Field label="How many assets to keep">
              <input type="number" min={1} max={25} value={cfg.limit ?? 5} onChange={(e) => set({ limit: Number(e.target.value) })} className={inputCls} />
            </Field>
            <label className="flex items-center gap-2 text-[13px] text-foreground">
              <input type="checkbox" checked={cfg.bindTop !== false} onChange={(e) => set({ bindTop: e.target.checked })} />
              Trade the strongest match automatically
            </label>
          </>
        )}

        {step.kind === 'analysis' && (
          <>
            <Field label="Analysis to run" hint="Produces a buy, sell or neutral signal from live prices.">
              <select
                value={cfg.programId ?? ''}
                onChange={(e) => set({ programId: e.target.value, params: {} }, ANALYSIS_PROGRAMS.find((p) => p.id === e.target.value)?.label)}
                className={inputCls}
              >
                {ANALYSIS_PROGRAMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </Field>
            {(ANALYSIS_PROGRAMS.find((p) => p.id === cfg.programId)?.params ?? []).map((p) => (
              <Field key={p.key} label={p.label}>
                <input
                  type="number" min={p.min} max={p.max} step={p.step ?? 1}
                  value={cfg.params?.[p.key] ?? p.default}
                  onChange={(e) => set({ params: { ...(cfg.params ?? {}), [p.key]: Number(e.target.value) } })}
                  className={inputCls}
                />
              </Field>
            ))}
          </>
        )}

        {step.kind === 'branch' && (
          <Field label="Only continue when the signal is" hint="Anything else stops this lane, leaving the other lanes running.">
            <select value={cfg.expects ?? 'bullish'} onChange={(e) => set({ expects: e.target.value })} className={inputCls}>
              <option value="bullish">Buy signal</option>
              <option value="bearish">Sell signal</option>
              <option value="neutral">Neutral</option>
            </select>
          </Field>
        )}

        {step.kind === 'risk' && (
          <>
            <Field label="Stop everything if losses reach (%)">
              <input type="number" min={1} max={90} value={cfg.maxDrawdownPct ?? 10} onChange={(e) => set({ maxDrawdownPct: Number(e.target.value) })} className={inputCls} />
            </Field>
            <label className="flex items-center gap-2 text-[13px] text-foreground">
              <input type="checkbox" checked={cfg.blockOnBreach !== false} onChange={(e) => set({ blockOnBreach: e.target.checked })} />
              Halt every lane when the limit is hit
            </label>
          </>
        )}

        {(step.kind === 'buy' || step.kind === 'sell') && (
          <>
            <Field label="Investment amount (USD)" hint={price > 0 ? `At the live price this is about ${(Number(cfg.amountUsd ?? 0) / price).toFixed(6)} units.` : 'Waiting on a live price for this asset.'}>
              <input type="number" min={0} step={50} value={cfg.amountUsd ?? 0} onChange={(e) => set({ amountUsd: Number(e.target.value) })} className={inputCls} />
            </Field>
            <div className="flex flex-wrap gap-1">
              {[250, 500, 1000, 5000, 10000].map((v) => (
                <button key={v} onClick={() => set({ amountUsd: v })} className="rounded-full border border-border/60 px-2 py-0.5 text-[12px] text-muted-foreground hover:text-foreground">
                  ${v.toLocaleString()}
                </button>
              ))}
            </div>
          </>
        )}

        {step.kind === 'alert' && (
          <>
            <Field label="Direction">
              <select value={cfg.direction ?? 'above'} onChange={(e) => set({ direction: e.target.value })} className={inputCls}>
                <option value="above">Price rises above</option>
                <option value="below">Price falls below</option>
              </select>
            </Field>
            <Field label="Price level">
              <input type="number" value={cfg.price ?? 0} onChange={(e) => set({ price: Number(e.target.value) })} className={inputCls} />
            </Field>
            {price > 0 && (
              <button onClick={() => set({ price: Number(price.toFixed(4)) })} className="rounded-full border border-primary/50 px-2 py-0.5 text-[12px] text-primary">
                Use live price {price.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </button>
            )}
          </>
        )}

        {step.kind === 'code' && (
          <Field label="Saved code to run" hint="Write and save code in the Code Studio, then pick it here.">
            <select value={cfg.blockId ?? ''} onChange={(e) => set({ blockId: e.target.value, blockName: blocks.find((b) => b.id === e.target.value)?.name }, blocks.find((b) => b.id === e.target.value)?.name)} className={inputCls}>
              <option value="">Choose saved code…</option>
              {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
        )}

        {step.kind === 'note' && (
          <Field label="Note">
            <textarea value={cfg.text ?? ''} onChange={(e) => set({ text: e.target.value })} rows={4} className={inputCls} />
          </Field>
        )}
      </div>
    </div>
  );
}