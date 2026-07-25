
CREATE TABLE public.market_ticks (
  symbol TEXT NOT NULL,
  source TEXT NOT NULL,
  asset_class TEXT NOT NULL,
  last NUMERIC NOT NULL,
  bid NUMERIC,
  ask NUMERIC,
  change_24h NUMERIC,
  volume_24h NUMERIC,
  latency_ms INTEGER,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (symbol, source)
);

CREATE INDEX idx_market_ticks_symbol ON public.market_ticks(symbol);
CREATE INDEX idx_market_ticks_ts ON public.market_ticks(ts DESC);

GRANT SELECT ON public.market_ticks TO anon;
GRANT SELECT ON public.market_ticks TO authenticated;
GRANT ALL ON public.market_ticks TO service_role;

ALTER TABLE public.market_ticks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_ticks readable by everyone"
  ON public.market_ticks FOR SELECT
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.market_ticks;
ALTER TABLE public.market_ticks REPLICA IDENTITY FULL;

CREATE TABLE public.macro_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id TEXT NOT NULL,
  title TEXT NOT NULL,
  value NUMERIC,
  units TEXT,
  observed_at DATE NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'FRED',
  UNIQUE (series_id, observed_at)
);
CREATE INDEX idx_macro_releases_series ON public.macro_releases(series_id, observed_at DESC);
GRANT SELECT ON public.macro_releases TO anon, authenticated;
GRANT ALL ON public.macro_releases TO service_role;
ALTER TABLE public.macro_releases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "macro_releases readable by everyone"
  ON public.macro_releases FOR SELECT USING (true);
