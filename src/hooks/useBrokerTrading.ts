import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ───────────────────────────────────────────────

export type BrokerType = 'alpaca' | 'coinbase' | 'ibkr' | 'tradier' | 'webull' | 'kraken' | 'gemini' | 'oanda' | 'td_ameritrade';

export interface BrokerConnection {
  id: string;
  broker: string;
  environment: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BrokerAccount {
  id: string;
  account_number?: string;
  status: string;
  buying_power: string;
  cash: string;
  portfolio_value: string;
  equity: string;
  currency: string;
  pattern_day_trader?: boolean;
  trading_blocked?: boolean;
  balances?: Array<{ currency: string; available: string; balance: string }>;
}

export interface Position {
  asset_id?: string;
  symbol: string;
  qty: string;
  avg_entry_price: string;
  market_value: string;
  current_price: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  side: string;
}

export interface BrokerOrder {
  id: string;
  symbol: string;
  qty: string;
  filled_qty: string;
  side: string;
  type: string;
  status: string;
  submitted_at: string;
  filled_at: string | null;
  filled_avg_price: string | null;
  limit_price: string | null;
}

// Keep backward compat alias
export type AlpacaAccount = BrokerAccount;
export type AlpacaOrder = BrokerOrder;

// ─── Broker metadata ────────────────────────────────────

export const BROKER_META: Record<BrokerType, {
  label: string;
  assets: string;
  environments: { value: string; label: string }[];
  fields: string[];
}> = {
  alpaca: {
    label: 'Alpaca',
    assets: 'Stocks · ETFs · Crypto',
    environments: [
      { value: 'paper', label: 'Paper' },
      { value: 'live', label: 'Live' },
    ],
    fields: ['apiKey', 'apiSecret'],
  },
  coinbase: {
    label: 'Coinbase',
    assets: 'Crypto',
    environments: [
      { value: 'sandbox', label: 'Sandbox' },
      { value: 'production', label: 'Production' },
    ],
    fields: ['apiKey', 'apiSecret', 'apiPassphrase'],
  },
  ibkr: {
    label: 'Interactive Brokers',
    assets: 'Stocks · Options · Futures · Forex · Bonds',
    environments: [
      { value: 'paper', label: 'Paper' },
      { value: 'live', label: 'Live' },
    ],
    fields: ['apiKey', 'apiSecret'],
  },
  tradier: {
    label: 'Tradier',
    assets: 'Stocks · ETFs · Options',
    environments: [
      { value: 'sandbox', label: 'Sandbox' },
      { value: 'live', label: 'Live' },
    ],
    fields: ['apiKey', 'apiSecret'],
  },
  webull: {
    label: 'Webull',
    assets: 'Stocks · ETFs · Options · Crypto',
    environments: [
      { value: 'paper', label: 'Paper' },
      { value: 'live', label: 'Live' },
    ],
    fields: ['apiKey', 'apiSecret'],
  },
  kraken: {
    label: 'Kraken',
    assets: 'Crypto · Forex',
    environments: [
      { value: 'sandbox', label: 'Sandbox' },
      { value: 'production', label: 'Production' },
    ],
    fields: ['apiKey', 'apiSecret'],
  },
  gemini: {
    label: 'Gemini',
    assets: 'Crypto',
    environments: [
      { value: 'sandbox', label: 'Sandbox' },
      { value: 'production', label: 'Production' },
    ],
    fields: ['apiKey', 'apiSecret'],
  },
  oanda: {
    label: 'OANDA',
    assets: 'Forex · CFDs · Indices · Commodities',
    environments: [
      { value: 'practice', label: 'Practice' },
      { value: 'live', label: 'Live' },
    ],
    fields: ['apiKey', 'apiSecret'],
  },
  td_ameritrade: {
    label: 'TD Ameritrade / Schwab',
    assets: 'Stocks · ETFs · Options · Futures · Forex',
    environments: [
      { value: 'paper', label: 'Paper' },
      { value: 'live', label: 'Live' },
    ],
    fields: ['apiKey', 'apiSecret'],
  },
};

// ─── Broker Connection CRUD ──────────────────────────────

export function useBrokerConnections() {
  return useQuery({
    queryKey: ['broker-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broker_connections')
        .select('id, broker, environment, label, is_active, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as BrokerConnection[];
    },
    enabled: true,
  });
}

export function useAddBrokerConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      broker: string;
      environment: string;
      apiKey: string;
      apiSecret: string;
      apiPassphrase?: string;
      label?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const row: Record<string, unknown> = {
        user_id: user.id,
        broker: params.broker,
        environment: params.environment,
        api_key: params.apiKey,
        api_secret: params.apiSecret,
        label: params.label || `${params.broker} ${params.environment}`,
        is_active: true,
      };
      if (params.apiPassphrase) {
        row.api_passphrase = params.apiPassphrase;
      }

      const { data, error } = await supabase
        .from('broker_connections')
        .upsert(row as any, { onConflict: 'user_id,broker,environment' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['broker-connections'] }),
  });
}

export function useDeleteBrokerConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('broker_connections')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['broker-connections'] }),
  });
}

// ─── Broker API Proxy Calls ──────────────────────────────

async function brokerCall(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('broker-proxy', {
    body: { action, ...params },
  });
  if (error) throw new Error(error.message || 'Broker proxy error');
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useAlpacaAccount(connectionId?: string) {
  return useQuery({
    queryKey: ['broker-account', connectionId],
    queryFn: async () => {
      const res = await brokerCall('account', { connectionId });
      return res.account as BrokerAccount;
    },
    enabled: !!connectionId,
    refetchInterval: 30_000,
  });
}

export function usePositions(connectionId?: string) {
  return useQuery({
    queryKey: ['broker-positions', connectionId],
    queryFn: async () => {
      const res = await brokerCall('positions', { connectionId });
      return (res.positions || []) as Position[];
    },
    enabled: !!connectionId,
    refetchInterval: 15_000,
  });
}

export function useOrders(connectionId?: string) {
  return useQuery({
    queryKey: ['broker-orders', connectionId],
    queryFn: async () => {
      const res = await brokerCall('orders', { connectionId });
      return (res.orders || []) as BrokerOrder[];
    },
    enabled: !!connectionId,
    refetchInterval: 10_000,
  });
}

export function useSubmitOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      connectionId: string;
      symbol: string;
      qty: number;
      side: 'buy' | 'sell';
      orderType: 'market' | 'limit' | 'stop';
      limitPrice?: number;
      stopPrice?: number;
      timeInForce?: string;
    }) => {
      const res = await brokerCall('order', params);
      return res.order;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['broker-orders', vars.connectionId] });
      qc.invalidateQueries({ queryKey: ['broker-positions', vars.connectionId] });
      qc.invalidateQueries({ queryKey: ['broker-account', vars.connectionId] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { connectionId: string; orderId: string }) => {
      await brokerCall('cancel', params);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['broker-orders', vars.connectionId] });
    },
  });
}
