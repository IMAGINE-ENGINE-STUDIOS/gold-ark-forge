import { useState, useEffect, useCallback } from 'react';
import { playAlertSound, sendDesktopNotification } from '@/lib/notificationSound';
import { toast } from 'sonner';

export interface RiskLimitsConfig {
  floors: Record<string, number>; // symbol -> floor price
  drawdownLimit: number; // percentage
  dailyLossLimit: number; // dollar amount
  positionSizeLimit: number; // percentage per asset
  peakValue: number;
  dailyLossToday: number;
  lastResetDate: string;
  paused: boolean;
}

const STORAGE_KEY = 'ga_risk_limits';

const DEFAULT_CONFIG: RiskLimitsConfig = {
  floors: {},
  drawdownLimit: 10,
  dailyLossLimit: 500,
  positionSizeLimit: 25,
  peakValue: 0,
  dailyLossToday: 0,
  lastResetDate: new Date().toISOString().slice(0, 10),
  paused: false,
};

function loadConfig(): RiskLimitsConfig {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return stored ? { ...DEFAULT_CONFIG, ...stored } : DEFAULT_CONFIG;
  } catch { return DEFAULT_CONFIG; }
}

function saveConfig(config: RiskLimitsConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function useRiskMonitor() {
  const [config, setConfig] = useState<RiskLimitsConfig>(loadConfig);
  const [breachedSymbols, setBreachedSymbols] = useState<string[]>([]);

  useEffect(() => { saveConfig(config); }, [config]);

  // Reset daily loss at midnight
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (config.lastResetDate !== today) {
      setConfig(prev => ({ ...prev, dailyLossToday: 0, lastResetDate: today }));
    }
  }, [config.lastResetDate]);

  const setFloor = useCallback((symbol: string, price: number) => {
    setConfig(prev => ({ ...prev, floors: { ...prev.floors, [symbol]: price } }));
  }, []);

  const removeFloor = useCallback((symbol: string) => {
    setConfig(prev => {
      const floors = { ...prev.floors };
      delete floors[symbol];
      return { ...prev, floors };
    });
  }, []);

  const updateDrawdownLimit = useCallback((pct: number) => {
    setConfig(prev => ({ ...prev, drawdownLimit: pct }));
  }, []);

  const updateDailyLossLimit = useCallback((amount: number) => {
    setConfig(prev => ({ ...prev, dailyLossLimit: amount }));
  }, []);

  const updatePositionSizeLimit = useCallback((pct: number) => {
    setConfig(prev => ({ ...prev, positionSizeLimit: pct }));
  }, []);

  const togglePause = useCallback(() => {
    setConfig(prev => ({ ...prev, paused: !prev.paused }));
  }, []);

  const checkPrices = useCallback((prices: Record<string, number>, portfolioValue?: number) => {
    if (config.paused) return;

    // Update peak
    if (portfolioValue && portfolioValue > config.peakValue) {
      setConfig(prev => ({ ...prev, peakValue: portfolioValue }));
    }

    // Check drawdown
    if (portfolioValue && config.peakValue > 0) {
      const drawdown = ((config.peakValue - portfolioValue) / config.peakValue) * 100;
      if (drawdown >= config.drawdownLimit) {
        toast.error(`⚠️ Portfolio drawdown ${drawdown.toFixed(1)}% exceeds ${config.drawdownLimit}% limit`);
        playAlertSound(0.5);
        sendDesktopNotification('Risk Alert', `Drawdown ${drawdown.toFixed(1)}% exceeds limit`);
        setConfig(prev => ({ ...prev, paused: true }));
      }
    }

    // Check floor prices
    const breached: string[] = [];
    Object.entries(config.floors).forEach(([symbol, floor]) => {
      const price = prices[symbol];
      if (price !== undefined && price < floor) {
        breached.push(symbol);
        toast.error(`🔻 ${symbol} broke floor $${floor} — now $${price.toFixed(2)}`, {
          description: 'Auto-sell would be triggered with active broker',
        });
        playAlertSound(0.5);
        sendDesktopNotification('Floor Breached', `${symbol} at $${price.toFixed(2)} (floor: $${floor})`);
      }
    });
    setBreachedSymbols(breached);
  }, [config]);

  return {
    config,
    breachedSymbols,
    setFloor,
    removeFloor,
    updateDrawdownLimit,
    updateDailyLossLimit,
    updatePositionSizeLimit,
    togglePause,
    checkPrices,
  };
}
