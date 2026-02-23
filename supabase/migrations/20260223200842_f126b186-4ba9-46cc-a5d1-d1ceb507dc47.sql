
-- ═══ User Preferences table ═══
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  last_symbol_key text DEFAULT 'gold',
  last_timeframe text DEFAULT '1D',
  default_symbol_key text DEFAULT 'gold',
  platform_config jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ═══ Paper Portfolios table ═══
CREATE TABLE public.paper_portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  cash numeric NOT NULL DEFAULT 100000,
  positions jsonb NOT NULL DEFAULT '[]'::jsonb,
  orders jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.paper_portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own paper portfolio"
  ON public.paper_portfolios FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own paper portfolio"
  ON public.paper_portfolios FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own paper portfolio"
  ON public.paper_portfolios FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER update_paper_portfolios_updated_at
  BEFORE UPDATE ON public.paper_portfolios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
