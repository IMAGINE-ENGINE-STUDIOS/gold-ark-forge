ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS folder_path text NOT NULL DEFAULT '/';

CREATE TABLE IF NOT EXISTS public.investor_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL UNIQUE,
  name text NOT NULL,
  parent_path text NOT NULL DEFAULT '/',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.investor_folders TO service_role;
ALTER TABLE public.investor_folders ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.investor_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  target text NOT NULL,
  actor text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.investor_activity TO service_role;
ALTER TABLE public.investor_activity ENABLE ROW LEVEL SECURITY;

INSERT INTO public.investor_folders (path, name, parent_path, description)
VALUES
  ('/corporate', 'Corporate', '/', 'Incorporation, cap table, governance'),
  ('/financials', 'Financials', '/', 'Models, statements, projections'),
  ('/legal', 'Legal', '/', 'Contracts, IP, compliance'),
  ('/product', 'Product & Technology', '/', 'Architecture, roadmap, security'),
  ('/market', 'Market & Traction', '/', 'Research, metrics, pipeline'),
  ('/deck', 'Investor Materials', '/', 'Deck, memo, one-pagers')
ON CONFLICT (path) DO NOTHING;