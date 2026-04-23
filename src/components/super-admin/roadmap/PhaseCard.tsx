import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RoadmapPhase, useDeletePhase, useUpsertGoal, useUpsertPhase } from '@/hooks/useRoadmap';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useSuperAdminRole } from '@/hooks/useAdminRole';
import GoalRow from './GoalRow';

interface Props {
  phase: RoadmapPhase;
  statusFilter: string;
}

const PhaseCard = ({ phase, statusFilter }: Props) => {
  const [expanded, setExpanded] = useState(true);
  const [title, setTitle] = useState(phase.title);
  const [start, setStart] = useState<string | null>(phase.start_date);
  const [end, setEnd] = useState<string | null>(phase.end_date);

  const upsertPhase = useUpsertPhase();
  const upsertGoal = useUpsertGoal();
  const deletePhase = useDeletePhase();
  const { data: isSuperAdmin } = useSuperAdminRole();

  useEffect(() => { setTitle(phase.title); setStart(phase.start_date); setEnd(phase.end_date); }, [phase.id]);

  useAutoSave(() => {
    upsertPhase.mutate({ id: phase.id, title, start_date: start, end_date: end });
  }, [title, start, end], 1500);

  const topGoals = phase.goals.filter((g) => !g.parent_goal_id);
  const visibleGoals = statusFilter === 'all' ? topGoals : topGoals.filter((g) => g.status === statusFilter);

  const addGoal = () => {
    upsertGoal.mutate({ phase_id: phase.id, title: 'New goal', sort_order: topGoals.length });
  };

  const avg = phase.goals.length ? Math.round(phase.goals.reduce((s, g) => s + g.progress, 0) / phase.goals.length) : 0;

  return (
    <div className="border border-primary/20 bg-card/40 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
        <button onClick={() => setExpanded((e) => !e)} className="text-primary shrink-0">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-8 bg-transparent border-transparent hover:border-primary/30 focus:border-primary/60 font-display text-base text-primary flex-1"
        />

        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-[10px] font-display border-primary/20">
                <CalendarIcon size={12} className="mr-1" />
                {start ? format(parseISO(start), 'MMM d, yyyy') : 'Start'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
              <Calendar mode="single" selected={start ? parseISO(start) : undefined} onSelect={(d) => setStart(d ? format(d, 'yyyy-MM-dd') : null)} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <span className="text-primary/40">→</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-[10px] font-display border-primary/20">
                <CalendarIcon size={12} className="mr-1" />
                {end ? format(parseISO(end), 'MMM d, yyyy') : 'End'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
              <Calendar mode="single" selected={end ? parseISO(end) : undefined} onSelect={(d) => setEnd(d ? format(d, 'yyyy-MM-dd') : null)} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-24 h-2 bg-primary/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary/60 to-primary transition-all" style={{ width: `${avg}%` }} />
        </div>
        <span className="text-[10px] font-display text-primary w-10 text-right">{avg}%</span>

        <Button onClick={addGoal} variant="outline" size="sm" className="h-7 text-[10px] font-display border-primary/30 text-primary">
          <Plus size={12} className="mr-1" />Goal
        </Button>
        {isSuperAdmin && (
          <Button onClick={() => { if (confirm(`Delete phase "${phase.title}" and all goals?`)) deletePhase.mutate(phase.id); }} variant="ghost" size="icon" className="h-7 w-7 text-destructive">
            <Trash2 size={14} />
          </Button>
        )}
      </div>

      {expanded && (
        <div className="p-2">
          {visibleGoals.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">No goals yet. Click "+ Goal" to add one.</div>
          ) : (
            visibleGoals.map((g) => (
              <GoalRow key={g.id} goal={g} childGoals={phase.goals.filter((x) => x.parent_goal_id === g.id)} allGoals={phase.goals} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PhaseCard;