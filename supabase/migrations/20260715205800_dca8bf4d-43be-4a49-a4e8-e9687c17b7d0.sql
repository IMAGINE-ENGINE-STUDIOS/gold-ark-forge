
-- ══════ AUTOMATION CONFIGS ══════
CREATE TABLE public.automation_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('bot','agent','pipeline')),
  strategy TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT,
  spec JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','running','paused','killed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_configs TO authenticated;
GRANT ALL ON public.automation_configs TO service_role;
ALTER TABLE public.automation_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own configs read"   ON public.automation_configs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own configs insert" ON public.automation_configs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own configs update" ON public.automation_configs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own configs delete" ON public.automation_configs FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX automation_configs_user_idx ON public.automation_configs(user_id, kind, status);
CREATE TRIGGER trg_ac_updated BEFORE UPDATE ON public.automation_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ══════ AUTOMATION RUNS ══════
CREATE TABLE public.automation_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config_id UUID REFERENCES public.automation_configs(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  strategy TEXT NOT NULL,
  symbol TEXT,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','killed','error')),
  trades_count INT NOT NULL DEFAULT 0,
  realized_pnl NUMERIC NOT NULL DEFAULT 0,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_ms INT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_runs TO authenticated;
GRANT ALL ON public.automation_runs TO service_role;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own runs read"   ON public.automation_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own runs insert" ON public.automation_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own runs update" ON public.automation_runs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own runs delete" ON public.automation_runs FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX automation_runs_user_idx ON public.automation_runs(user_id, started_at DESC);

-- ══════ AUTOMATION EVENTS ══════
CREATE TABLE public.automation_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id UUID REFERENCES public.automation_runs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('signal','order','approval','kill','error','tick','agent_proposal','agent_reply')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.automation_events TO authenticated;
GRANT ALL ON public.automation_events TO service_role;
ALTER TABLE public.automation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own events read"   ON public.automation_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own events insert" ON public.automation_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX automation_events_user_idx ON public.automation_events(user_id, created_at DESC);
CREATE INDEX automation_events_run_idx  ON public.automation_events(run_id, created_at DESC);

-- ══════ AGENT APPROVALS ══════
CREATE TABLE public.agent_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id UUID REFERENCES public.automation_runs(id) ON DELETE SET NULL,
  agent TEXT NOT NULL,
  proposal JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired','executed')),
  reasoning TEXT,
  decided_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_approvals TO authenticated;
GRANT ALL ON public.agent_approvals TO service_role;
ALTER TABLE public.agent_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own approvals read"   ON public.agent_approvals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own approvals insert" ON public.agent_approvals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own approvals update" ON public.agent_approvals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own approvals delete" ON public.agent_approvals FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX agent_approvals_user_idx ON public.agent_approvals(user_id, status, created_at DESC);
