import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoadmapGoal, useDeleteGoal, useUpsertGoal } from '@/hooks/useRoadmap';
import { useAutoSave } from '@/hooks/useAutoSave';

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/30 text-primary',
  done: 'bg-green-500/20 text-green-400',
  blocked: 'bg-destructive/20 text-destructive',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-muted-foreground/40',
  medium: 'bg-primary/60',
  high: 'bg-orange-500',
  critical: 'bg-destructive',
};

interface Props {
  goal: RoadmapGoal;
  childGoals: RoadmapGoal[];
  allGoals: RoadmapGoal[];
  depth?: number;
}

const GoalRow = ({ goal, childGoals, allGoals, depth = 0 }: Props) => {
  const [title, setTitle] = useState(goal.title);
  const [progress, setProgress] = useState(goal.progress);
  const [status, setStatus] = useState(goal.status);
  const [priority, setPriority] = useState(goal.priority);
  const [targetDate, setTargetDate] = useState<string | null>(goal.target_date);
  const [expanded, setExpanded] = useState(false);

  const upsert = useUpsertGoal();
  const del = useDeleteGoal();

  useEffect(() => { setTitle(goal.title); setProgress(goal.progress); setStatus(goal.status); setPriority(goal.priority); setTargetDate(goal.target_date); }, [goal.id]);

  useAutoSave(() => {
    upsert.mutate({ id: goal.id, phase_id: goal.phase_id, title, progress, status, priority, target_date: targetDate });
  }, [title, progress, status, priority, targetDate], 1500);

  const addSubGoal = () => {
    upsert.mutate({ phase_id: goal.phase_id, parent_goal_id: goal.id, title: 'New sub-goal', sort_order: childGoals.length });
    setExpanded(true);
  };

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-2 rounded hover:bg-primary/5 group"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        <button onClick={() => setExpanded((e) => !e)} className="text-muted-foreground hover:text-primary shrink-0">
          {childGoals.length > 0 ? (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="inline-block w-[14px]" />}
        </button>

        <span className={cn('w-2 h-2 rounded-full shrink-0', PRIORITY_COLORS[priority])} title={`Priority: ${priority}`} />

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-7 bg-transparent border-transparent hover:border-primary/30 focus:border-primary/60 text-sm flex-1 min-w-0"
        />

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className={cn('h-6 w-[110px] text-[10px] font-display tracking-wide border-0', STATUS_COLORS[status])}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="h-6 w-[80px] text-[10px] font-display border-primary/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 w-[140px]">
          <Slider value={[progress]} onValueChange={(v) => setProgress(v[0])} min={0} max={100} step={5} className="flex-1" />
          <span className="text-[10px] text-muted-foreground w-8 text-right">{progress}%</span>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 text-[10px] font-display border-primary/20 px-2">
              <CalendarIcon size={12} className="mr-1" />
              {targetDate ? format(parseISO(targetDate), 'MMM d') : 'Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="end">
            <Calendar
              mode="single"
              selected={targetDate ? parseISO(targetDate) : undefined}
              onSelect={(d) => setTargetDate(d ? format(d, 'yyyy-MM-dd') : null)}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {depth === 0 && (
          <Button onClick={addSubGoal} variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" title="Add sub-goal">
            <Plus size={12} />
          </Button>
        )}
        <Button onClick={() => del.mutate(goal.id)} variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100">
          <Trash2 size={12} />
        </Button>
      </div>

      {expanded && childGoals.map((c) => (
        <GoalRow key={c.id} goal={c} childGoals={allGoals.filter((g) => g.parent_goal_id === c.id)} allGoals={allGoals} depth={depth + 1} />
      ))}
    </div>
  );
};

export default GoalRow;