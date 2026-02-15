
-- Broker connections: stores user's API keys for external brokers
-- Keys are stored encrypted at rest by Supabase; platform never custodies funds
CREATE TABLE public.broker_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker TEXT NOT NULL DEFAULT 'alpaca',
  environment TEXT NOT NULL DEFAULT 'paper', -- 'paper' or 'live'
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  label TEXT, -- user-friendly name like "My Alpaca Paper"
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, broker, environment)
);

ALTER TABLE public.broker_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own broker connections"
  ON public.broker_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own broker connections"
  ON public.broker_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own broker connections"
  ON public.broker_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own broker connections"
  ON public.broker_connections FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_broker_connections_updated_at
  BEFORE UPDATE ON public.broker_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Order history: local log of orders placed through the platform
CREATE TABLE public.broker_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.broker_connections(id) ON DELETE CASCADE,
  broker_order_id TEXT, -- ID returned by the broker
  symbol TEXT NOT NULL,
  side TEXT NOT NULL, -- 'buy' or 'sell'
  order_type TEXT NOT NULL DEFAULT 'market', -- 'market', 'limit', 'stop'
  qty NUMERIC NOT NULL,
  limit_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending','filled','partial','cancelled','rejected'
  filled_qty NUMERIC DEFAULT 0,
  filled_avg_price NUMERIC,
  broker_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.broker_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.broker_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON public.broker_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON public.broker_orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_broker_orders_updated_at
  BEFORE UPDATE ON public.broker_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
