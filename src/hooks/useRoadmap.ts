import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type RoadmapGoal = {
  id: string;
  phase_id: string;
  parent_goal_id: string | null;
  title: string;
  description: string | null;
  target_date: string | null;
  status: string;
  priority: string;
  progress: number;
  sort_order: number;
  created_by: string | null;
};

export type RoadmapPhase = {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  color: string | null;
  sort_order: number;
  created_by: string | null;
  goals: RoadmapGoal[];
};

export const useRoadmapPhases = () => {
  return useQuery({
    queryKey: ['roadmap-phases'],
    queryFn: async (): Promise<RoadmapPhase[]> => {
      const [{ data: phases, error: pErr }, { data: goals, error: gErr }] = await Promise.all([
        supabase.from('roadmap_phases').select('*').order('sort_order', { ascending: true }),
        supabase.from('roadmap_goals').select('*').order('sort_order', { ascending: true }),
      ]);
      if (pErr) throw pErr;
      if (gErr) throw gErr;
      return (phases ?? []).map((p) => ({
        ...p,
        goals: (goals ?? []).filter((g) => g.phase_id === p.id),
      }));
    },
  });
};

export const useUpsertPhase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (phase: Partial<RoadmapPhase> & { id?: string }) => {
      const { goals, ...rest } = phase as any;
      if (rest.id) {
        const { error } = await supabase.from('roadmap_phases').update(rest).eq('id', rest.id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('roadmap_phases').insert({
          title: rest.title ?? 'New Phase',
          description: rest.description ?? null,
          start_date: rest.start_date ?? null,
          end_date: rest.end_date ?? null,
          color: rest.color ?? 'gold',
          sort_order: rest.sort_order ?? 0,
          created_by: user?.id ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roadmap-phases'] }),
  });
};

export const useDeletePhase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('roadmap_phases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roadmap-phases'] }),
  });
};

export const useUpsertGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (goal: Partial<RoadmapGoal> & { id?: string; phase_id: string }) => {
      if (goal.id) {
        const { id, ...rest } = goal;
        const { error } = await supabase.from('roadmap_goals').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('roadmap_goals').insert({
          phase_id: goal.phase_id,
          parent_goal_id: goal.parent_goal_id ?? null,
          title: goal.title ?? 'New Goal',
          description: goal.description ?? null,
          target_date: goal.target_date ?? null,
          status: goal.status ?? 'planned',
          priority: goal.priority ?? 'medium',
          progress: goal.progress ?? 0,
          sort_order: goal.sort_order ?? 0,
          created_by: user?.id ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roadmap-phases'] }),
  });
};

export const useDeleteGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('roadmap_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roadmap-phases'] }),
  });
};

export const useReorder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ table, id, sort_order }: { table: 'roadmap_phases' | 'roadmap_goals'; id: string; sort_order: number }) => {
      const { error } = await supabase.from(table).update({ sort_order }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roadmap-phases'] }),
  });
};