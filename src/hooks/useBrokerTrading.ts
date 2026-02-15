import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/contexts/WalletContext';

// ─── Types ───────────────────────────────────────────────

export interface BrokerConnection {
  id: string;
  broker: string;
  environment: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  buying_power: string;
  cash: string;
  portfolio_value: string;
  equity: string;
  currency: string;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
}

export interface Position {
  asset_id: string;
  symbol: string;
  qty: string;
  avg_entry_price: string;
  market_value: string;
  current_price: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  side: string;
}

export interface AlpacaOrder {
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
      label?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('broker_connections')
        .upsert({
          user_id: user.id,
          broker: params.broker,
          environment: params.environment,
          api_key: params.apiKey,
          api_secret: params.apiSecret,
          label: params.label || `${params.broker} ${params.environment}`,
          is_active: true,
        }, { onConflict: 'user_id,broker,environment' })
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
    queryKey: ['alpaca-account', connectionId],
    queryFn: async () => {
      const res = await brokerCall('account', { connectionId });
      return res.account as AlpacaAccount;
    },
    enabled: !!connectionId,
    refetchInterval: 30_000,
  });
}

export function usePositions(connectionId?: string) {
  return useQuery({
    queryKey: ['alpaca-positions', connectionId],
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
    queryKey: ['alpaca-orders', connectionId],
    queryFn: async () => {
      const res = await brokerCall('orders', { connectionId });
      return (res.orders || []) as AlpacaOrder[];
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
      qc.invalidateQueries({ queryKey: ['alpaca-orders', vars.connectionId] });
      qc.invalidateQueries({ queryKey: ['alpaca-positions', vars.connectionId] });
      qc.invalidateQueries({ queryKey: ['alpaca-account', vars.connectionId] });
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
      qc.invalidateQueries({ queryKey: ['alpaca-orders', vars.connectionId] });
    },
  });
}
