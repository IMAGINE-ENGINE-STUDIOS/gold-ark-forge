import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RUNNERS, type RunnableKind, type StrategyIntent } from '@/lib/strategies/runners';

export interface DeployedBot {
  id: string;
  kind: RunnableKind;
  symbol: string;
  params: Record<string, any>;
  status: 'running' | 'paused' | 'killed';
  createdAt: number;
  state: Record<string, any>;
  trades: number;
  realized: number;      // realized USD P&L across sells
  lastReason: string;
  lastTick: number;
  bootPrice: number;
}

const STORAGE_KEY = 'ga_strategy_bots_v1';
const TICK_MS = 3000;

const loadBots = (): DeployedBot[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
};
const saveBots = (b: DeployedBot[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(b)); } catch { /* ignore */ }
};

interface EngineDeps {
  resolvePrice: (t: string) => number;
  getCandleHistory: (t: string) => number[] | null;
  submitOrder: (p: { symbol: string; side: 'buy' | 'sell'; qty: number; type: 'market'; price: number; botSource?: boolean }) => any;
  positions: Array<{ id: string; symbol: string; side: 'buy' | 'sell'; qty: number; entryPrice: number; botSource?: boolean }>;
  equity: number;
}

export function useStrategyEngine(deps: EngineDeps) {
  const [bots, setBots] = useState<DeployedBot[]>(loadBots);
  const botsRef = useRef(bots);
  useEffect(() => { botsRef.current = bots; saveBots(bots); }, [bots]);

  const depsRef = useRef(deps);
  useEffect(() => { depsRef.current = deps; }, [deps]);

  const deployBot = useCallback((kind: RunnableKind, symbol: string, params: Record<string, any>) => {
    const price = depsRef.current.resolvePrice(symbol) || 0;
    const bot: DeployedBot = {
      id: crypto.randomUUID(),
      kind, symbol, params,
      status: 'running',
      createdAt: Date.now(),
      state: {},
      trades: 0,
      realized: 0,
      lastReason: 'deployed',
      lastTick: 0,
      bootPrice: price,
    };
    setBots(prev => [...prev, bot]);
    return bot.id;
  }, []);

  const setStatus = useCallback((id: string, status: DeployedBot['status']) => {
    setBots(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  }, []);
  const killBot = useCallback((id: string) => setStatus(id, 'killed'), [setStatus]);
  const pauseBot = useCallback((id: string) => setStatus(id, 'paused'), [setStatus]);
  const resumeBot = useCallback((id: string) => setStatus(id, 'running'), [setStatus]);
  const removeBot = useCallback((id: string) => setBots(prev => prev.filter(b => b.id !== id)), []);
  const killAll = useCallback(() => setBots(prev => prev.map(b => ({ ...b, status: 'killed' as const }))), []);

  // ── tick loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const { resolvePrice, getCandleHistory, submitOrder, positions, equity } = depsRef.current;
      const now = Date.now();
      let mutated = false;
      const next: DeployedBot[] = botsRef.current.map(bot => {
        if (bot.status !== 'running') return bot;
        const price = resolvePrice(bot.symbol);
        if (!price || !Number.isFinite(price)) return bot;
        const closes = getCandleHistory(bot.symbol) ?? [];
        const pos = positions.find(p => p.symbol === bot.symbol && p.side === 'buy' && p.botSource);
        const ownedQty = pos?.qty ?? 0;
        const avgEntry = pos?.entryPrice ?? 0;

        const runner = RUNNERS[bot.kind];
        let intent: StrategyIntent;
        try {
          intent = runner({ price, closes, params: bot.params, state: bot.state, ownedQty, avgEntry, equity, now });
        } catch (e) {
          return { ...bot, lastReason: `error: ${(e as Error).message}`, lastTick: now };
        }

        let realized = bot.realized;
        let trades = bot.trades;
        if (intent.action !== 'hold' && intent.qty > 0) {
          // sanity: min 1e-8 qty
          const qty = Math.max(1e-8, intent.qty);
          try {
            if (intent.action === 'sell' && ownedQty <= 0) {
              // nothing to sell
            } else {
              const order = submitOrder({ symbol: bot.symbol, side: intent.action, qty, type: 'market', price, botSource: true });
              trades += 1;
              if (order?.closedPnl !== undefined) realized += order.closedPnl;
              mutated = true;
            }
          } catch (e) {
            return { ...bot, lastReason: `blocked: ${(e as Error).message}`, lastTick: now };
          }
        }

        return {
          ...bot,
          state: intent.newState ? { ...bot.state, ...intent.newState } : bot.state,
          lastReason: intent.reason,
          lastTick: now,
          trades,
          realized,
        };
      });
      if (mutated || next.some((b, i) => b.lastTick !== botsRef.current[i]?.lastTick)) {
        setBots(next);
      }
    };
    const iv = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(iv);
  }, []);

  const stats = useMemo(() => {
    const running = bots.filter(b => b.status === 'running').length;
    const totalTrades = bots.reduce((s, b) => s + b.trades, 0);
    const totalRealized = bots.reduce((s, b) => s + b.realized, 0);
    return { running, totalTrades, totalRealized, count: bots.length };
  }, [bots]);

  return { bots, deployBot, killBot, pauseBot, resumeBot, removeBot, killAll, stats };
}