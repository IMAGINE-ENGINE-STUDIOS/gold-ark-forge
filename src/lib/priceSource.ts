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

/**
 * Energy quote ids (all verified live on the Yahoo chart endpoint).
 * Keys absent from this map have no public real-time feed and render "NO FEED".
 */
const ENERGY_QUOTE: Record<string, string> = {
  // Physical futures contracts
  oil: 'CL=F',            // NYMEX WTI
  brent: 'BZ=F',          // ICE Brent
  natgas: 'NG=F',         // Henry Hub
  rbob: 'RB=F',           // RBOB gasoline
  heating_oil: 'HO=F',    // NY Harbor ULSD
  diesel: 'HO=F',         // ULSD settles on the HO contract
  coal: 'MTF=F',          // Coal (API2) Rotterdam futures
  ttf_gas: 'TTF=F',       // Dutch TTF natural gas
  lng: 'TTF=F',           // LNG spot proxied by TTF hub
  // Carbon / clean energy benchmarks (exchange-traded funds)
  carbon_eu: 'KRBN',
  carbon_us: 'KCCA',
  hydrogen: 'HDRO',
  uranium: 'URA',
  uranium_miners: 'URNM',
  nuclear: 'NLR',
  solar: 'TAN',
  wind: 'FAN',
  clean_energy: 'ICLN',
  energy_sector: 'XLE',
  oil_explorers: 'XOP',
  oil_services: 'OIH',
  oil_fund: 'USO',
  natgas_fund: 'UNG',
  // ethanol / lpg / jet_fuel: no free real-time public feed → NO FEED
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
