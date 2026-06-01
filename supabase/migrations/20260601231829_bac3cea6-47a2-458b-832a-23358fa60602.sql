
-- Helper: is the signed-in user a @goldarrow.io email
CREATE OR REPLACE FUNCTION public.is_goldarrow_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND lower(email) LIKE '%@goldarrow.io'
  )
$$;

-- Documents table: dataroom policies
CREATE POLICY "Goldarrow users view dataroom docs"
ON public.documents FOR SELECT
TO authenticated
USING (category = 'dataroom' AND public.is_goldarrow_user());

CREATE POLICY "Goldarrow users insert dataroom docs"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (category = 'dataroom' AND public.is_goldarrow_user() AND uploaded_by = auth.uid());

CREATE POLICY "Goldarrow users update dataroom docs"
ON public.documents FOR UPDATE
TO authenticated
USING (category = 'dataroom' AND public.is_goldarrow_user());

CREATE POLICY "Goldarrow users delete dataroom docs"
ON public.documents FOR DELETE
TO authenticated
USING (category = 'dataroom' AND public.is_goldarrow_user());

-- Storage policies for dataroom/ folder inside 'documents' bucket
CREATE POLICY "Goldarrow read dataroom files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = 'dataroom' AND public.is_goldarrow_user());

CREATE POLICY "Goldarrow upload dataroom files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = 'dataroom' AND public.is_goldarrow_user());

CREATE POLICY "Goldarrow update dataroom files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = 'dataroom' AND public.is_goldarrow_user());

CREATE POLICY "Goldarrow delete dataroom files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = 'dataroom' AND public.is_goldarrow_user());
