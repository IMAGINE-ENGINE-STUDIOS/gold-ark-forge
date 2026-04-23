import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRoadmapPhases, useUpsertPhase } from '@/hooks/useRoadmap';
import RoadmapTimelineStrip from './RoadmapTimelineStrip';
import PhaseCard from './PhaseCard';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'planned', label: 'Planned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
  { key: 'blocked', label: 'Blocked' },
];

const RoadmapBoard = () => {
  const { data: phases, isLoading } = useRoadmapPhases();
  const upsertPhase = useUpsertPhase();
  const [statusFilter, setStatusFilter] = useState('all');

  const addPhase = () => {
    upsertPhase.mutate({ title: 'New Phase', sort_order: phases?.length ?? 0 });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RoadmapTimelineStrip phases={phases ?? []} />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'px-3 py-1 text-[10px] font-display tracking-[0.15em] uppercase rounded-full border transition-colors',
                statusFilter === f.key
                  ? 'bg-primary/20 border-primary/60 text-primary'
                  : 'bg-card/40 border-primary/20 text-muted-foreground hover:text-primary hover:border-primary/40',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button onClick={addPhase} variant="outline" className="border-primary/40 text-primary font-display">
          <Plus size={14} className="mr-1" />Add Phase
        </Button>
      </div>

      <div className="space-y-3">
        {(phases ?? []).map((p) => (
          <PhaseCard key={p.id} phase={p} statusFilter={statusFilter} />
        ))}
        {(phases ?? []).length === 0 && (
          <div className="text-center py-12 border border-dashed border-primary/20 rounded-lg">
            <p className="text-muted-foreground mb-4">No phases yet. Start by creating your first roadmap phase.</p>
            <Button onClick={addPhase} variant="outline" className="border-primary/40 text-primary font-display">
              <Plus size={14} className="mr-1" />Create First Phase
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadmapBoard;