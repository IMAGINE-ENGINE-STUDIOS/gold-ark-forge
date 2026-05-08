-- Custom swap assets created by admins
CREATE TABLE public.swap_custom_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol_key TEXT NOT NULL UNIQUE,
  ticker TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  -- Company / issuer details
  company_name TEXT NOT NULL,
  company_legal_name TEXT,
  company_website TEXT,
  company_logo_url TEXT,
  company_description TEXT,
  company_country TEXT,
  company_industry TEXT,
  company_founded_year INTEGER,
  company_ceo TEXT,
  company_headquarters TEXT,
  company_employees INTEGER,
  company_email TEXT,
  company_phone TEXT,
  -- Asset specs
  asset_type TEXT NOT NULL DEFAULT 'equity',
  base_currency TEXT NOT NULL DEFAULT 'USD',
  initial_price NUMERIC NOT NULL DEFAULT 0,
  total_supply NUMERIC,
  circulating_supply NUMERIC,
  market_cap NUMERIC,
  isin TEXT,
  cusip TEXT,
  contract_address TEXT,
  blockchain TEXT,
  -- Compliance / metadata
  jurisdiction TEXT,
  regulatory_status TEXT,
  whitepaper_url TEXT,
  prospectus_url TEXT,
  custom_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'draft',
  is_listed BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.swap_custom_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listed assets are publicly viewable"
  ON public.swap_custom_assets FOR SELECT
  USING (is_listed = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can insert swap assets"
  ON public.swap_custom_assets FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can update swap assets"
  ON public.swap_custom_assets FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete swap assets"
  ON public.swap_custom_assets FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_swap_custom_assets_updated_at
  BEFORE UPDATE ON public.swap_custom_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_swap_custom_assets_category ON public.swap_custom_assets(category);
CREATE INDEX idx_swap_custom_assets_listed ON public.swap_custom_assets(is_listed);