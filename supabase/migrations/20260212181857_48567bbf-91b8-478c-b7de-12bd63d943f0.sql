
-- Phase 1: Institutional Data Model

-- New enums
CREATE TYPE public.wallet_type AS ENUM ('evm', 'btc');
CREATE TYPE public.cert_status AS ENUM ('active', 'frozen', 'revoked', 'redeemed');
CREATE TYPE public.transfer_status AS ENUM ('proposed', 'btc_settlement_pending', 'partner_review', 'completed', 'cancelled', 'expired', 'disputed');
CREATE TYPE public.anchor_status AS ENUM ('pending', 'broadcast', 'confirmed', 'reorged', 'abandoned');
CREATE TYPE public.partner_type AS ENUM ('vault', 'dealer', 'custodian', 'arbiter');
CREATE TYPE public.partner_status AS ENUM ('active', 'suspended', 'offboarded');

-- Partners
CREATE TABLE public.partners (
  partner_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name            TEXT NOT NULL,
  jurisdiction          TEXT NOT NULL,
  partner_type          public.partner_type NOT NULL,
  status                public.partner_status NOT NULL DEFAULT 'active',
  api_base_url          TEXT NOT NULL,
  mtls_spki_fingerprint TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners are publicly viewable" ON public.partners FOR SELECT USING (true);
CREATE POLICY "Admins can manage partners" ON public.partners FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Partner sites
CREATE TABLE public.partner_sites (
  site_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  UUID NOT NULL REFERENCES public.partners(partner_id),
  site_name   TEXT NOT NULL,
  region      TEXT NOT NULL,
  address_text TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partner sites are publicly viewable" ON public.partner_sites FOR SELECT USING (true);
CREATE POLICY "Admins can manage partner sites" ON public.partner_sites FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Wallets (wallet-only identity)
CREATE TABLE public.wallets (
  wallet_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_type  public.wallet_type NOT NULL,
  address      TEXT NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Wallets are publicly viewable" ON public.wallets FOR SELECT USING (true);
CREATE POLICY "Admins can manage wallets" ON public.wallets FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Certificates
CREATE TABLE public.certificates (
  cert_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id       UUID NOT NULL REFERENCES public.partners(partner_id),
  cert_version     INT NOT NULL DEFAULT 1,
  status           public.cert_status NOT NULL DEFAULT 'active',
  owner_wallet_id  UUID NOT NULL REFERENCES public.wallets(wallet_id),
  metadata_json    JSONB NOT NULL DEFAULT '{}'::jsonb,
  partner_sig      BYTEA NOT NULL,
  partner_sig_alg  TEXT NOT NULL,
  issued_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Certificates are publicly viewable" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Admins can manage certificates" ON public.certificates FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Certificate events (append-only)
CREATE TABLE public.certificate_events (
  event_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_id         UUID NOT NULL REFERENCES public.certificates(cert_id),
  event_type      TEXT NOT NULL,
  event_payload   JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_wallet_id UUID REFERENCES public.wallets(wallet_id),
  partner_id      UUID REFERENCES public.partners(partner_id),
  partner_sig     BYTEA,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.certificate_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Certificate events are publicly viewable" ON public.certificate_events FOR SELECT USING (true);
CREATE POLICY "Admins can insert certificate events" ON public.certificate_events FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Transfers
CREATE TABLE public.transfers (
  transfer_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_id          UUID NOT NULL REFERENCES public.certificates(cert_id),
  seller_wallet_id UUID NOT NULL REFERENCES public.wallets(wallet_id),
  buyer_wallet_id  UUID NOT NULL REFERENCES public.wallets(wallet_id),
  status           public.transfer_status NOT NULL DEFAULT 'proposed',
  terms_json       JSONB NOT NULL DEFAULT '{}'::jsonb,
  psbt_base64      TEXT,
  btc_txid         TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Transfers viewable by involved wallets" ON public.transfers FOR SELECT USING (true);
CREATE POLICY "Admins can manage transfers" ON public.transfers FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Anchors
CREATE TABLE public.anchors (
  anchor_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merkle_root   BYTEA NOT NULL,
  leaf_count    INT NOT NULL DEFAULT 0,
  commit_txid   TEXT,
  commit_height BIGINT,
  commit_time   TIMESTAMPTZ,
  status        public.anchor_status NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.anchors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anchors are publicly viewable" ON public.anchors FOR SELECT USING (true);
CREATE POLICY "Admins can manage anchors" ON public.anchors FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Anchor leaves
CREATE TABLE public.anchor_leaves (
  anchor_leaf_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anchor_id      UUID NOT NULL REFERENCES public.anchors(anchor_id),
  event_id       UUID NOT NULL REFERENCES public.certificate_events(event_id),
  leaf_hash      BYTEA NOT NULL,
  leaf_index     INT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(anchor_id, leaf_index)
);
ALTER TABLE public.anchor_leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anchor leaves are publicly viewable" ON public.anchor_leaves FOR SELECT USING (true);
CREATE POLICY "Admins can manage anchor leaves" ON public.anchor_leaves FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Disputes
CREATE TABLE public.disputes (
  dispute_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id  UUID NOT NULL REFERENCES public.transfers(transfer_id),
  status       TEXT NOT NULL DEFAULT 'open',
  resolution   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Disputes are publicly viewable" ON public.disputes FOR SELECT USING (true);
CREATE POLICY "Admins can manage disputes" ON public.disputes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Audit logs
CREATE TABLE public.audit_logs (
  audit_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type    TEXT NOT NULL,
  actor_id      TEXT NOT NULL,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT NOT NULL,
  ip_addr       INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  details_json  JSONB NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read audit logs" ON public.audit_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON public.transfers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
