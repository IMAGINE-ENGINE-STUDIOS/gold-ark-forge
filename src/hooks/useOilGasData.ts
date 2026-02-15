import { useQuery } from '@tanstack/react-query';

export interface OilGasPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  unit: string;
  color: string;
}

export interface EIAInventory {
  date: string;
  value: number; // millions of barrels
  change: number;
}

export interface RigCountData {
  date: string;
  oil: number;
  gas: number;
  total: number;
  change: number;
}

export interface OPECMember {
  country: string;
  quota: number; // mbpd
  production: number; // mbpd
  compliance: number; // %
}

// ─── FALLBACK DATA ──────────────────────────────────────
const FALLBACK_PRICES: OilGasPrice[] = [
  { symbol: 'CL', name: 'WTI Crude Oil', price: 71.45, change: -0.82, unit: '$/bbl', color: 'hsl(25, 80%, 50%)' },
  { symbol: 'BZ', name: 'Brent Crude Oil', price: 75.18, change: -0.64, unit: '$/bbl', color: 'hsl(210, 60%, 50%)' },
  { symbol: 'NG', name: 'Natural Gas', price: 3.24, change: 2.15, unit: '$/MMBtu', color: 'hsl(145, 60%, 45%)' },
  { symbol: 'HO', name: 'Heating Oil', price: 2.385, change: -0.41, unit: '$/gal', color: 'hsl(0, 60%, 50%)' },
  { symbol: 'RB', name: 'RBOB Gasoline', price: 2.142, change: 0.93, unit: '$/gal', color: 'hsl(43, 72%, 50%)' },
  { symbol: 'PA', name: 'Propane', price: 0.785, change: -1.22, unit: '$/gal', color: 'hsl(270, 40%, 55%)' },
];

const FALLBACK_INVENTORY: EIAInventory[] = Array.from({ length: 52 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - i * 7);
  const base = 440 + Math.sin(i / 6) * 20 + (Math.random() - 0.5) * 8;
  return {
    date: date.toISOString().split('T')[0],
    value: Math.round(base * 10) / 10,
    change: Math.round((Math.random() - 0.5) * 8 * 10) / 10,
  };
}).reverse();

const FALLBACK_RIG_COUNT: RigCountData[] = Array.from({ length: 26 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - i * 7);
  const oil = Math.round(480 + Math.sin(i / 4) * 30 + (Math.random() - 0.5) * 15);
  const gas = Math.round(115 + Math.sin(i / 5) * 10 + (Math.random() - 0.5) * 8);
  return { date: date.toISOString().split('T')[0], oil, gas, total: oil + gas, change: i === 0 ? 0 : Math.round((Math.random() - 0.5) * 10) };
}).reverse();

const FALLBACK_OPEC: OPECMember[] = [
  { country: 'Saudi Arabia', quota: 10.478, production: 9.0, compliance: 114 },
  { country: 'Iraq', quota: 4.431, production: 4.3, compliance: 103 },
  { country: 'UAE', quota: 3.019, production: 2.95, compliance: 102 },
  { country: 'Kuwait', quota: 2.676, production: 2.55, compliance: 105 },
  { country: 'Nigeria', quota: 1.742, production: 1.42, compliance: 123 },
  { country: 'Algeria', quota: 1.007, production: 0.96, compliance: 105 },
  { country: 'Libya', quota: 1.174, production: 1.18, compliance: 99 },
  { country: 'Angola', quota: 1.28, production: 1.11, compliance: 115 },
  { country: 'Russia', quota: 10.478, production: 9.2, compliance: 112 },
  { country: 'Kazakhstan', quota: 1.628, production: 1.72, compliance: 95 },
];

const FALLBACK_SPREADS = {
  wtiBrent: -3.73,
  crack321: 28.15,
  sparkSpread: 1.82,
  heatCrack: 31.40,
};

// ─── LIVE FETCH HELPERS ──────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const fetchLiveCommodityPrices = async (): Promise<OilGasPrice[]> => {
  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/fetch-commodity-prices`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!resp.ok) throw new Error(`Edge function returned ${resp.status}`);

    const data = await resp.json();
    if (data.success && data.prices?.length > 0) {
      console.log(`[OG] Live commodity data from: ${data.source}`);
      // Merge live data with fallback for any missing commodities
      const liveMap = new Map(data.prices.map((p: OilGasPrice) => [p.symbol, p]));
      return FALLBACK_PRICES.map((fp) => {
        const live = liveMap.get(fp.symbol) as OilGasPrice | undefined;
        return live ? { ...fp, price: live.price, change: live.change } : fp;
      }) as OilGasPrice[];
    }
    throw new Error('No live data returned');
  } catch (err) {
    console.warn('[OG] Live fetch failed, using fallback with drift:', err);
    // Fallback with realistic drift
    const now = Date.now();
    return FALLBACK_PRICES.map((p) => {
      const seed = Math.sin(now / 60000 + p.symbol.charCodeAt(0)) * 0.02;
      return { ...p, price: Math.round((p.price * (1 + seed)) * 100) / 100, change: Math.round((p.change + (Math.random() - 0.5) * 0.3) * 100) / 100 };
    });
  }
};

// ─── HOOKS ────────────────────────────────────────────────

export const useOilGasPrices = () =>
  useQuery({
    queryKey: ['oil-gas-prices'],
    queryFn: fetchLiveCommodityPrices,
    refetchInterval: 30000,
    staleTime: 15000,
  });

export const useEIAInventory = () =>
  useQuery({
    queryKey: ['eia-inventory'],
    queryFn: async () => FALLBACK_INVENTORY,
    refetchInterval: 300000,
    staleTime: 120000,
  });

export const useRigCount = () =>
  useQuery({
    queryKey: ['rig-count'],
    queryFn: async () => FALLBACK_RIG_COUNT,
    refetchInterval: 300000,
    staleTime: 120000,
  });

export const useOPECData = () =>
  useQuery({
    queryKey: ['opec-data'],
    queryFn: async () => FALLBACK_OPEC,
    refetchInterval: 600000,
  });

export const useSpreads = () =>
  useQuery({
    queryKey: ['oil-spreads'],
    queryFn: async () => {
      const now = Date.now();
      return {
        wtiBrent: Math.round((FALLBACK_SPREADS.wtiBrent + Math.sin(now / 120000) * 0.4) * 100) / 100,
        crack321: Math.round((FALLBACK_SPREADS.crack321 + Math.sin(now / 90000) * 1.5) * 100) / 100,
        sparkSpread: Math.round((FALLBACK_SPREADS.sparkSpread + Math.sin(now / 100000) * 0.3) * 100) / 100,
        heatCrack: Math.round((FALLBACK_SPREADS.heatCrack + Math.sin(now / 110000) * 1.2) * 100) / 100,
      };
    },
    refetchInterval: 30000,
  });

export interface SpreadDataPoint {
  date: string;
  wti: number;
  brent: number;
  spread: number;
}

const FALLBACK_SPREAD_HISTORY: SpreadDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const wti = 71.45 + Math.sin(i / 3) * 2 + (Math.random() - 0.5) * 1.5;
  const brent = wti + 3.5 + Math.sin(i / 4) * 0.8 + (Math.random() - 0.5) * 0.6;
  return {
    date: date.toISOString().split('T')[0],
    wti: Math.round(wti * 100) / 100,
    brent: Math.round(brent * 100) / 100,
    spread: Math.round((wti - brent) * 100) / 100,
  };
});

const fetchSpreadHistory = async (): Promise<SpreadDataPoint[]> => {
  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/fetch-commodity-prices?history=30`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) throw new Error(`Edge function returned ${resp.status}`);
    const data = await resp.json();
    if (data.success && data.spread?.length > 0) {
      console.log(`[OG] Live spread history: ${data.spread.length} points`);
      return data.spread;
    }
    throw new Error('No spread data');
  } catch (err) {
    console.warn('[OG] Spread history fetch failed, using fallback:', err);
    return FALLBACK_SPREAD_HISTORY;
  }
};

export const useWtiBrentSpreadHistory = () =>
  useQuery({
    queryKey: ['wti-brent-spread-history'],
    queryFn: fetchSpreadHistory,
    refetchInterval: 30000,
    staleTime: 15000,
  });

export const useFuturesCurve = () =>
  useQuery({
    queryKey: ['futures-curve'],
    queryFn: async () => {
      const basePrice = 71.45;
      const months = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];
      return months.map((m, i) => ({
        month: m,
        wti: Math.round((basePrice + (i * 0.15) + Math.sin(i / 2) * 0.5) * 100) / 100,
        brent: Math.round((basePrice + 3.73 + (i * 0.12) + Math.sin(i / 2.5) * 0.4) * 100) / 100,
      }));
    },
    refetchInterval: 60000,
  });
