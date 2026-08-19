import { useMemo, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { BLOCKS, BLOCK_GROUPS, KIND_COLOR, type BlockDef } from '@/lib/pipelineBlocks';

export default function BlockPalette({ onAdd, laneName }: { onAdd: (b: BlockDef) => void; laneName: string }) {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<string>('all');

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return BLOCKS.filter(
      (b) =>
        (group === 'all' || b.group === group) &&
        (!needle || b.name.toLowerCase().includes(needle) || b.what.toLowerCase().includes(needle)),
    );
  }, [q, group]);

  return (
    <div className="flex h-full flex-col gap-2">
      <div>
        <div className="text-[13px] font-semibold text-foreground">Add a step</div>
        <div className="text-[12px] text-muted-foreground">Goes into “{laneName}”.</div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search steps"
          className="w-full rounded-md border border-border/60 bg-background/60 py-1.5 pl-7 pr-2 text-[13px] outline-none focus:border-primary/60"
        />
      </div>

      <div className="flex flex-wrap gap-1">
        {['all', ...BLOCK_GROUPS].map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`rounded-full border px-2 py-0.5 text-[12px] transition ${
              group === g ? 'border-primary/60 bg-primary/15 text-primary' : 'border-border/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            {g === 'all' ? 'All' : g}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
        {list.map((b) => (
          <button
            key={b.id}
            onClick={() => onAdd(b)}
            className="group w-full rounded-md border border-border/50 bg-background/50 p-2 text-left transition hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: KIND_COLOR[b.kind] }} />
              <span className="text-[13px] font-medium text-foreground">{b.name}</span>
              <Plus className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </div>
            <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{b.what}</p>
          </button>
        ))}
        {!list.length && <p className="text-[12px] text-muted-foreground">Nothing matches that search.</p>}
      </div>
    </div>
  );
}