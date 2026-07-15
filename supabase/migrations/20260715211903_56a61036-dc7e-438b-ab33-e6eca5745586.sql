CREATE TABLE public.rank_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  goal_pct numeric NOT NULL,
  horizon_h integer NOT NULL,
  direction text NOT NULL CHECK (direction IN ('long','short')),
  scope text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('stat','ai')),
  payload jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX rank_snapshots_user_created_idx ON public.rank_snapshots (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rank_snapshots TO authenticated;
GRANT ALL ON public.rank_snapshots TO service_role;

ALTER TABLE public.rank_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own snapshots select" ON public.rank_snapshots
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own snapshots insert" ON public.rank_snapshots
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own snapshots update" ON public.rank_snapshots
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own snapshots delete" ON public.rank_snapshots
  FOR DELETE TO authenticated USING (auth.uid() = user_id);