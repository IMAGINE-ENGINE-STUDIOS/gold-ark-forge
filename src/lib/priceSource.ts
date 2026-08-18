// ─── Unified quote-id mapping ─────────────────────────────
// Maps our internal symbol catalog to provider quote ids consumed by the
// `market-quotes` edge function. Returns null when NO real feed exists —
// callers must render a "NO FEED" state instead of inventing a price.

import type { WatchlistSymbol } from '@/data/tradingSymbols';

/** Metals that have a genuine spot feed (gold-api / coinbase / COMEX fallback). */
const METAL_QUOTE: Record<string, string> = {
  gold: 'METAL:XAU',
  silver: 'METAL:XAG',
  platinum: 'METAL:XPT',
  palladium: 'METAL:XPD',
  copper: 'METAL:HG',
  aluminum: 'ALI=F',
};

/** Energy contracts available on Yahoo futures. */
const ENERGY_QUOTE: Record<string, string> = {
  oil: 'CL=F',
  brent: 'BZ=F',
  natgas: 'NG=F',
  rbob: 'RB=F',
  heating_oil: 'HO=F',
  uranium: 'URA',
  coal: 'BTU',
  lng: 'LNG',
  carbon_eu: 'KRBN',
  hydrogen: 'HDRO',
};

/** CME/ICE agricultural contracts (ticker + "=F"). */
const AG_FUTURES = new Set([
  'ZC', 'ZW', 'ZS', 'ZL', 'ZM', 'ZO', 'ZR', 'KC', 'CC', 'SB', 'CT', 'OJ', 'LE', 'GF', 'HE', 'DC', 'LBS',
]);

/** Returns the provider quote id for a symbol, or null when it has no live feed. */
export function quoteIdFor(sym: Pick<WatchlistSymbol, 'key' | 'cat' | 'ticker'>): string | null {
  switch (sym.cat) {
    case 'metals':
      return METAL_QUOTE[sym.key] ?? null;
    case 'energy':
      return ENERGY_QUOTE[sym.key] ?? null;
    case 'agriculture':
      return AG_FUTURES.has(sym.ticker) ? `${sym.ticker}=F` : null;
    case 'forex':
      return `${sym.key.toUpperCase()}=X`;
    case 'crypto':
      return sym.ticker.includes('-') ? sym.ticker : `${sym.ticker}-USD`;
    case 'minerals':
      return null; // no public real-time market for rare-earth spot
    case 'stocks':
    case 'etfs':
    case 'reits':
    case 'bonds':
      // Yahoo uses a dash for share classes (BRK.B -> BRK-B) but keeps
      // exchange suffixes intact (ISF.L).
      return sym.ticker.replace(/\.([A-Z])$/, '-$1');
    default:
      return null;
  }
}

/** True when the symbol can be priced from a real feed. */
export const hasLiveFeed = (sym: Pick<WatchlistSymbol, 'key' | 'cat' | 'ticker'>) => quoteIdFor(sym) !== null;

export type QuoteSource = 'ws' | 'live' | 'cached' | 'none';
