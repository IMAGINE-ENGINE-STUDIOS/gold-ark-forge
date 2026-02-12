
-- Create siwe_nonces table for SIWE nonce management
CREATE TABLE public.siwe_nonces (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nonce text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS (service-role only access)
ALTER TABLE public.siwe_nonces ENABLE ROW LEVEL SECURITY;

-- Only service role can manage nonces (no client access)
CREATE POLICY "Service role manages nonces"
  ON public.siwe_nonces
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for cleanup
CREATE INDEX idx_siwe_nonces_expires ON public.siwe_nonces (expires_at);
CREATE INDEX idx_siwe_nonces_nonce ON public.siwe_nonces (nonce);
