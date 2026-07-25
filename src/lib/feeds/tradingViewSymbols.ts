import type { WatchlistSymbol } from '@/data/tradingSymbols';
import type { AssetClass } from './types';

export interface TradingViewTrackedSymbol {
  symbol: string;
  assetClass: AssetClass;
  tvSymbols: string[];
}

const METAL_CANONICAL: Record<string, string> = {
  gold: 'XAU/USD',
  silver: 'XAG/USD',
  platinum: 'XPT/USD',
  palladium: 'XPD/USD',
};

const METAL_TV: Record<string, string[]> = {
  gold: ['OANDA:XAUUSD', 'TVC:GOLD', 'COMEX:GC1!'],
  silver: ['OANDA:XAGUSD', 'TVC:SILVER', 'COMEX:SI1!'],
  platinum: ['TVC:PLATINUM', 'NYMEX:PL1!'],
  palladium: ['TVC:PALLADIUM', 'NYMEX:PA1!'],
  copper: ['COMEX:HG1!'],
};

const ENERGY_CANONICAL: Record<string, string> = {
  oil: 'CL=F',
  brent: 'BZ=F',
  natgas: 'NG=F',
  rbob: 'RB=F',
  heating_oil: 'HO=F',
};

const ENERGY_TV: Record<string, string[]> = {
  oil: ['NYMEX:CL1!', 'TVC:USOIL'],
  brent: ['NYMEX:BZ1!', 'TVC:UKOIL', 'ICEEUR:BRN1!'],
  natgas: ['NYMEX:NG1!'],
  rbob: ['NYMEX:RB1!'],
  heating_oil: ['NYMEX:HO1!'],
  coal: ['NASDAQ:KOL'],
  uranium: ['AMEX:URA'],
  lng: ['NYSE:LNG'],
};

const AGRICULTURE_TV: Record<string, string[]> = {
  corn: ['CBOT:ZC1!'],
  wheat: ['CBOT:ZW1!'],
  soybeans: ['CBOT:ZS1!'],
  soy_oil: ['CBOT:ZL1!'],
  soy_meal: ['CBOT:ZM1!'],
  oats: ['CBOT:ZO1!'],
  rice: ['CBOT:ZR1!'],
  coffee: ['ICEUS:KC1!'],
  cocoa: ['ICEUS:CC1!'],
  sugar: ['ICEUS:SB1!'],
  cotton: ['ICEUS:CT1!'],
  orange_juice: ['ICEUS:OJ1!'],
  lumber: ['CME:LBR1!'],
  live_cattle: ['CME:LE1!'],
  feeder_cattle: ['CME:GF1!'],
  lean_hogs: ['CME:HE1!'],
  class3_milk: ['CME:DC1!'],
};

const assetClassFor = (cat: string): AssetClass => {
  if (cat === 'crypto') return 'crypto';
  if (cat === 'metals') return 'metals';
  if (cat === 'energy') return 'energy';
  if (cat === 'forex') return 'fx';
  if (cat === 'bonds') return 'bond';
  return 'stocks';
};

const cryptoBase = (sym: WatchlistSymbol) => {
  const fromLabel = sym.label.split('/')[0]?.toUpperCase();
  if (fromLabel && /^[A-Z0-9]{2,12}$/.test(fromLabel)) return fromLabel;
  return sym.ticker.split('-')[0]?.toUpperCase() ?? '';
};

const securityCandidates = (ticker: string) => {
  const t = ticker.toUpperCase().replace(/[^A-Z0-9.]/g, '');
  if (!t) return [];
  return [`NASDAQ:${t}`, `NYSE:${t}`, `AMEX:${t}`, `CBOE:${t}`, `BATS:${t}`];
};

export const canonicalFeedSymbol = (sym: WatchlistSymbol): string => {
  if (sym.cat === 'crypto') {
    const base = cryptoBase(sym);
    return base ? `${base}/USDT` : sym.ticker;
  }
  if (sym.cat === 'metals') return METAL_CANONICAL[sym.key] ?? sym.ticker;
  if (sym.cat === 'energy') return ENERGY_CANONICAL[sym.key] ?? sym.ticker;
  return sym.ticker;
};

export const tradingViewSymbolsFor = (sym: WatchlistSymbol): string[] => {
  if (sym.cat === 'metals') return METAL_TV[sym.key] ?? securityCandidates(sym.ticker);
  if (sym.cat === 'energy') return ENERGY_TV[sym.key] ?? securityCandidates(sym.ticker);
  if (sym.cat === 'agriculture') return AGRICULTURE_TV[sym.key] ?? securityCandidates(sym.ticker);
  if (sym.cat === 'forex') {
    const pair = sym.ticker.replace('/', '').toUpperCase();
    return [`FX_IDC:${pair}`, `OANDA:${pair}`];
  }
  if (sym.cat === 'crypto') {
    const base = cryptoBase(sym);
    return base ? [`BINANCE:${base}USDT`, `COINBASE:${base}USD`, `KRAKEN:${base}USD`] : [];
  }
  return securityCandidates(sym.ticker);
};

export const buildTradingViewSymbols = (symbols: WatchlistSymbol[]): TradingViewTrackedSymbol[] =>
  symbols
    .map((sym) => ({
      symbol: canonicalFeedSymbol(sym),
      assetClass: assetClassFor(sym.cat),
      tvSymbols: tradingViewSymbolsFor(sym),
    }))
    .filter((entry) => entry.tvSymbols.length > 0);