-- Enums for bullion registry
CREATE TYPE public.metal_type AS ENUM ('gold', 'silver', 'platinum');
CREATE TYPE public.custody_status AS ENUM ('free', 'pledged', 'redeemed');
CREATE TYPE public.holding_status AS ENUM ('active', 'pending_redemption', 'redeemed');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table (for admin access control)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Profiles table (links wallet addresses to auth users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  wallet_address TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bullion bars registry
CREATE TABLE public.bullion_bars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number TEXT UNIQUE NOT NULL,
  metal_type metal_type NOT NULL,
  weight_oz DECIMAL(12, 4) NOT NULL,
  purity DECIMAL(6, 4) NOT NULL DEFAULT 0.9999,
  vault_id TEXT NOT NULL,
  jurisdiction TEXT NOT NULL DEFAULT 'Switzerland',
  custody_status custody_status NOT NULL DEFAULT 'free',
  price_per_oz DECIMAL(12, 2),
  last_verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vault holdings (links wallets to bullion)
CREATE TABLE public.vault_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  bar_id UUID REFERENCES public.bullion_bars(id) ON DELETE CASCADE NOT NULL,
  acquired_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status holding_status NOT NULL DEFAULT 'active',
  UNIQUE (bar_id)
);

-- Attestations (government/authority verifications)
CREATE TABLE public.attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id UUID REFERENCES public.bullion_bars(id) ON DELETE CASCADE NOT NULL,
  authority_name TEXT NOT NULL,
  document_hash TEXT NOT NULL,
  document_url TEXT,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reserve snapshots (for Chainlink PoR)
CREATE TABLE public.reserve_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id TEXT UNIQUE NOT NULL,
  merkle_root TEXT NOT NULL,
  total_gold_oz DECIMAL(16, 4) NOT NULL DEFAULT 0,
  total_silver_oz DECIMAL(16, 4) NOT NULL DEFAULT 0,
  total_platinum_oz DECIMAL(16, 4) NOT NULL DEFAULT 0,
  bar_count INTEGER NOT NULL DEFAULT 0,
  bitcoin_txid TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Price feeds cache
CREATE TABLE public.price_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metal_type metal_type NOT NULL UNIQUE,
  price_usd DECIMAL(12, 2) NOT NULL,
  change_24h DECIMAL(8, 4),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bullion_bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserve_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_feeds ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for bullion_bars (public read, admin write)
CREATE POLICY "Bullion bars are publicly viewable"
  ON public.bullion_bars FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert bullion bars"
  ON public.bullion_bars FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bullion bars"
  ON public.bullion_bars FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for vault_holdings
CREATE POLICY "Users can view their own holdings"
  ON public.vault_holdings FOR SELECT
  TO authenticated
  USING (
    wallet_address = (
      SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all holdings"
  ON public.vault_holdings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage holdings"
  ON public.vault_holdings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for attestations (public read)
CREATE POLICY "Attestations are publicly viewable"
  ON public.attestations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage attestations"
  ON public.attestations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for reserve_snapshots (public read)
CREATE POLICY "Reserve snapshots are publicly viewable"
  ON public.reserve_snapshots FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage snapshots"
  ON public.reserve_snapshots FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for price_feeds (public read)
CREATE POLICY "Price feeds are publicly viewable"
  ON public.price_feeds FOR SELECT
  USING (true);

CREATE POLICY "Service role can update price feeds"
  ON public.price_feeds FOR ALL
  TO service_role
  USING (true);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profile updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_bullion_bars_metal_type ON public.bullion_bars(metal_type);
CREATE INDEX idx_bullion_bars_custody_status ON public.bullion_bars(custody_status);
CREATE INDEX idx_vault_holdings_wallet ON public.vault_holdings(wallet_address);
CREATE INDEX idx_attestations_bar_id ON public.attestations(bar_id);
CREATE INDEX idx_profiles_wallet ON public.profiles(wallet_address);