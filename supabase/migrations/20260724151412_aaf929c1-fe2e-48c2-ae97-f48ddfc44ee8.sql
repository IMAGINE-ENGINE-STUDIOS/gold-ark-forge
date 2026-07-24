DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'price_feeds'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.price_feeds;
  END IF;
END $$;
ALTER TABLE public.price_feeds REPLICA IDENTITY FULL;