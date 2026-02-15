import { useState, useEffect, useCallback, useRef } from 'react';
import { playAlertSound, sendDesktopNotification } from '@/lib/notificationSound';
import { toast } from 'sonner';

export interface PriceAlert {
  id: string;
  symbol: string;
  condition: 'above' | 'below' | 'crosses';
  threshold: number;
  active: boolean;
  muted: boolean;
  createdAt: string;
  triggeredAt: string[];
}

interface AlertHistory {
  id: string;
  alertId: string;
  symbol: string;
  condition: string;
  threshold: number;
  price: number;
  timestamp: string;
}

const STORAGE_KEY = 'ga_price_alerts';
const HISTORY_KEY = 'ga_alert_history';
const COOLDOWN_MS = 60_000;

function loadAlerts(): PriceAlert[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveAlerts(alerts: PriceAlert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

function loadHistory(): AlertHistory[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}

function saveHistory(h: AlertHistory[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 100)));
}

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>(loadAlerts);
  const [history, setHistory] = useState<AlertHistory[]>(loadHistory);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);
  const lastTriggered = useRef<Record<string, number>>({});
  const prevPrices = useRef<Record<string, number>>({});

  useEffect(() => { saveAlerts(alerts); }, [alerts]);
  useEffect(() => { saveHistory(history); }, [history]);

  const addAlert = useCallback((symbol: string, condition: 'above' | 'below' | 'crosses', threshold: number) => {
    const alert: PriceAlert = {
      id: crypto.randomUUID(),
      symbol,
      condition,
      threshold,
      active: true,
      muted: false,
      createdAt: new Date().toISOString(),
      triggeredAt: [],
    };
    setAlerts(prev => [...prev, alert]);
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const toggleMute = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, muted: !a.muted } : a));
  }, []);

  const toggleActive = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  }, []);

  const checkPrices = useCallback((prices: Record<string, number>) => {
    const now = Date.now();
    const triggered: AlertHistory[] = [];

    setAlerts(prev => {
      let changed = false;
      const updated = prev.map(alert => {
        if (!alert.active) return alert;
        const price = prices[alert.symbol];
        if (price === undefined) return alert;

        // Cooldown check
        const lastTime = lastTriggered.current[alert.id] || 0;
        if (now - lastTime < COOLDOWN_MS) return alert;

        let fire = false;
        if (alert.condition === 'above' && price > alert.threshold) fire = true;
        if (alert.condition === 'below' && price < alert.threshold) fire = true;
        if (alert.condition === 'crosses') {
          const prev = prevPrices.current[alert.symbol];
          if (prev !== undefined) {
            if ((prev < alert.threshold && price >= alert.threshold) || (prev > alert.threshold && price <= alert.threshold)) {
              fire = true;
            }
          }
        }

        if (fire) {
          changed = true;
          lastTriggered.current[alert.id] = now;

          const entry: AlertHistory = {
            id: crypto.randomUUID(),
            alertId: alert.id,
            symbol: alert.symbol,
            condition: alert.condition,
            threshold: alert.threshold,
            price,
            timestamp: new Date().toISOString(),
          };
          triggered.push(entry);

          if (!alert.muted) {
            if (soundEnabled) playAlertSound(volume);
            sendDesktopNotification(
              `⚡ ${alert.symbol} Alert`,
              `${alert.symbol} is ${alert.condition} $${alert.threshold.toLocaleString()} — now $${price.toLocaleString()}`
            );
            toast.warning(`${alert.symbol} ${alert.condition} $${alert.threshold}`, {
              description: `Current price: $${price.toLocaleString()}`,
            });
          }

          return { ...alert, triggeredAt: [...alert.triggeredAt, new Date().toISOString()] };
        }
        return alert;
      });

      // Update prev prices
      Object.assign(prevPrices.current, prices);

      if (!changed) return prev;
      return updated;
    });

    if (triggered.length > 0) {
      setHistory(prev => [...triggered, ...prev].slice(0, 100));
    }
  }, [soundEnabled, volume]);

  const activeCount = alerts.filter(a => a.active).length;

  return {
    alerts,
    history,
    activeCount,
    addAlert,
    removeAlert,
    toggleMute,
    toggleActive,
    checkPrices,
    soundEnabled,
    setSoundEnabled,
    volume,
    setVolume,
  };
}
