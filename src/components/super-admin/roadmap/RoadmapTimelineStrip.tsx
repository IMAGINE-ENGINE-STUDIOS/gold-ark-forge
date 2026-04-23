import { RoadmapPhase } from '@/hooks/useRoadmap';

interface Props { phases: RoadmapPhase[] }

const phaseProgress = (p: RoadmapPhase) => {
  if (!p.goals.length) return 0;
  return Math.round(p.goals.reduce((s, g) => s + (g.progress ?? 0), 0) / p.goals.length);
};

const RoadmapTimelineStrip = ({ phases }: Props) => {
  if (!phases.length) return null;
  return (
    <div className="border border-primary/20 bg-card/40 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-display text-xs text-primary/60 tracking-[0.15em] uppercase">Timeline</span>
        <span className="text-[10px] text-muted-foreground">{phases.length} phases</span>
      </div>
      <div className="flex gap-1 h-8">
        {phases.map((p) => {
          const pct = phaseProgress(p);
          return (
            <div key={p.id} className="flex-1 relative bg-primary/5 rounded overflow-hidden border border-primary/20" title={`${p.title} • ${pct}%`}>
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/40 to-primary/70 transition-all" style={{ width: `${pct}%` }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-display text-foreground/80 truncate px-1">{p.title}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoadmapTimelineStrip;