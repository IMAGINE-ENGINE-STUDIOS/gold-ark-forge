import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export interface UserPreferences {
  id: string;
  user_id: string;
  last_symbol_key: string;
  last_timeframe: string;
  default_symbol_key: string;
  platform_config: Record<string, any>;
  updated_at: string;
}

const getLocalPrefs = (): Partial<UserPreferences> => {
  try {
    const raw = localStorage.getItem('ga_user_preferences');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const setLocalPrefs = (prefs: Partial<UserPreferences>) => {
  try {
    const existing = getLocalPrefs();
    localStorage.setItem('ga_user_preferences', JSON.stringify({ ...existing, ...prefs }));
  } catch { /* ignore */ }
};

export const useUserPreferences = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const query = useQuery({
    queryKey: ['user-preferences', userId],
    queryFn: async (): Promise<UserPreferences | null> => {
      if (!userId) {
        const local = getLocalPrefs();
        return local as UserPreferences | null;
      }
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        // Create default preferences
        const { data: created, error: createErr } = await supabase
          .from('user_preferences')
          .insert({ user_id: userId })
          .select()
          .single();
        if (createErr) throw createErr;
        return created as unknown as UserPreferences;
      }
      return data as unknown as UserPreferences;
    },
    staleTime: 60_000,
  });

  const updatePrefs = useMutation({
    mutationFn: async (updates: Partial<Pick<UserPreferences, 'last_symbol_key' | 'last_timeframe' | 'default_symbol_key' | 'platform_config'>>) => {
      if (!userId) {
        setLocalPrefs(updates as Partial<UserPreferences>);
        return updates;
      }
      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences', userId] });
    },
  });

  return { preferences: query.data, isLoading: query.isLoading, updatePrefs: updatePrefs.mutate };
};
