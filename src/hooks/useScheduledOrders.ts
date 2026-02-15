import { useState, useEffect, useCallback } from 'react';

export interface ScheduledOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  orderType: 'market' | 'limit';
  scheduledAt: string; // ISO date
  recurrence: 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  endDate?: string;
  goalTarget?: number;
  goalCurrent?: number;
  floorPrice?: number;
  status: 'active' | 'paused' | 'completed' | 'expired';
  history: { timestamp: string; result: 'success' | 'fail' | 'skipped'; detail?: string }[];
  createdAt: string;
}

const STORAGE_KEY = 'ga_scheduled_orders';

function load(): ScheduledOrder[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function save(orders: ScheduledOrder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function useScheduledOrders() {
  const [orders, setOrders] = useState<ScheduledOrder[]>(load);

  useEffect(() => { save(orders); }, [orders]);

  const addOrder = useCallback((order: Omit<ScheduledOrder, 'id' | 'history' | 'createdAt' | 'status'>) => {
    const newOrder: ScheduledOrder = {
      ...order,
      id: crypto.randomUUID(),
      status: 'active',
      history: [],
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => [...prev, newOrder]);
  }, []);

  const removeOrder = useCallback((id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  }, []);

  const togglePause = useCallback((id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: o.status === 'paused' ? 'active' : 'paused' } : o));
  }, []);

  const updateGoalProgress = useCallback((id: string, current: number) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, goalCurrent: current } : o));
  }, []);

  const logExecution = useCallback((id: string, result: 'success' | 'fail' | 'skipped', detail?: string) => {
    setOrders(prev => prev.map(o =>
      o.id === id
        ? { ...o, history: [...o.history, { timestamp: new Date().toISOString(), result, detail }] }
        : o
    ));
  }, []);

  // Check for due orders every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setOrders(prev => prev.map(order => {
        if (order.status !== 'active') return order;
        const scheduled = new Date(order.scheduledAt);
        if (scheduled > now) return order;

        // Check end date
        if (order.endDate && new Date(order.endDate) < now) {
          return { ...order, status: 'expired' as const };
        }

        // Order is due — log as skipped (no broker connected from hook level)
        // Actual execution would be triggered from the component level
        if (order.recurrence === 'once') {
          return {
            ...order,
            status: 'completed' as const,
            history: [...order.history, { timestamp: now.toISOString(), result: 'skipped' as const, detail: 'Executed from scheduler' }],
          };
        }

        // Calculate next scheduled time for recurring
        const next = new Date(scheduled);
        switch (order.recurrence) {
          case 'daily': next.setDate(next.getDate() + 1); break;
          case 'weekly': next.setDate(next.getDate() + 7); break;
          case 'biweekly': next.setDate(next.getDate() + 14); break;
          case 'monthly': next.setMonth(next.getMonth() + 1); break;
        }

        return {
          ...order,
          scheduledAt: next.toISOString(),
          history: [...order.history, { timestamp: now.toISOString(), result: 'skipped' as const, detail: 'Recurring trigger' }],
        };
      }));
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  return { orders, addOrder, removeOrder, togglePause, updateGoalProgress, logExecution };
}
