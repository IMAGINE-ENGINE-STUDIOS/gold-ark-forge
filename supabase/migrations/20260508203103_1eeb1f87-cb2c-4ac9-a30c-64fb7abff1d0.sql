DROP POLICY IF EXISTS "Listed assets are publicly viewable" ON public.swap_custom_assets;
DROP POLICY IF EXISTS "Admins can insert swap assets" ON public.swap_custom_assets;
DROP POLICY IF EXISTS "Admins can update swap assets" ON public.swap_custom_assets;
DROP POLICY IF EXISTS "Super admins can delete swap assets" ON public.swap_custom_assets;

CREATE POLICY "TEST public read swap assets"
  ON public.swap_custom_assets FOR SELECT USING (true);
CREATE POLICY "TEST public insert swap assets"
  ON public.swap_custom_assets FOR INSERT WITH CHECK (true);
CREATE POLICY "TEST public update swap assets"
  ON public.swap_custom_assets FOR UPDATE USING (true);
CREATE POLICY "TEST public delete swap assets"
  ON public.swap_custom_assets FOR DELETE USING (true);