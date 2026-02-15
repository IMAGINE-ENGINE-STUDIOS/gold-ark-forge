// ─── Comprehensive Trading Symbol Universe ───────────────
// 200+ symbols across 10 categories

export interface WatchlistSymbol {
  key: string;
  label: string;
  ticker: string;
  cat: string;
}

export interface WatchlistCategory {
  label: string;
  items: WatchlistSymbol[];
}

export const WATCHLIST_CATEGORIES: WatchlistCategory[] = [
  {
    label: 'PRECIOUS METALS',
    items: [
      { key: 'gold', label: 'XAU/USD', ticker: 'GLD', cat: 'metals' },
      { key: 'silver', label: 'XAG/USD', ticker: 'SLV', cat: 'metals' },
      { key: 'platinum', label: 'XPT/USD', ticker: 'PPLT', cat: 'metals' },
      { key: 'palladium', label: 'XPD/USD', ticker: 'PALL', cat: 'metals' },
      { key: 'copper', label: 'Copper', ticker: 'HG', cat: 'metals' },
    ],
  },
  {
    label: 'CRYPTO — MAJOR',
    items: [
      { key: 'bitcoin', label: 'BTC/USD', ticker: 'BTC-USD', cat: 'crypto' },
      { key: 'ethereum', label: 'ETH/USD', ticker: 'ETH-USD', cat: 'crypto' },
      { key: 'solana', label: 'SOL/USD', ticker: 'SOL-USD', cat: 'crypto' },
      { key: 'xrp', label: 'XRP/USD', ticker: 'XRP-USD', cat: 'crypto' },
      { key: 'bnb', label: 'BNB/USD', ticker: 'BNB-USD', cat: 'crypto' },
      { key: 'cardano', label: 'ADA/USD', ticker: 'ADA-USD', cat: 'crypto' },
      { key: 'avalanche', label: 'AVAX/USD', ticker: 'AVAX-USD', cat: 'crypto' },
      { key: 'polkadot', label: 'DOT/USD', ticker: 'DOT-USD', cat: 'crypto' },
      { key: 'chainlink', label: 'LINK/USD', ticker: 'LINK-USD', cat: 'crypto' },
      { key: 'dogecoin', label: 'DOGE/USD', ticker: 'DOGE-USD', cat: 'crypto' },
    ],
  },
  {
    label: 'CRYPTO — ALT',
    items: [
      { key: 'polygon', label: 'MATIC/USD', ticker: 'MATIC-USD', cat: 'crypto' },
      { key: 'litecoin', label: 'LTC/USD', ticker: 'LTC-USD', cat: 'crypto' },
      { key: 'uniswap', label: 'UNI/USD', ticker: 'UNI-USD', cat: 'crypto' },
      { key: 'near', label: 'NEAR/USD', ticker: 'NEAR-USD', cat: 'crypto' },
      { key: 'aptos', label: 'APT/USD', ticker: 'APT-USD', cat: 'crypto' },
      { key: 'sui', label: 'SUI/USD', ticker: 'SUI-USD', cat: 'crypto' },
      { key: 'arbitrum', label: 'ARB/USD', ticker: 'ARB-USD', cat: 'crypto' },
      { key: 'optimism', label: 'OP/USD', ticker: 'OP-USD', cat: 'crypto' },
      { key: 'injective', label: 'INJ/USD', ticker: 'INJ-USD', cat: 'crypto' },
      { key: 'render', label: 'RNDR/USD', ticker: 'RNDR-USD', cat: 'crypto' },
      { key: 'filecoin', label: 'FIL/USD', ticker: 'FIL-USD', cat: 'crypto' },
      { key: 'cosmos', label: 'ATOM/USD', ticker: 'ATOM-USD', cat: 'crypto' },
      { key: 'stellar', label: 'XLM/USD', ticker: 'XLM-USD', cat: 'crypto' },
      { key: 'hedera', label: 'HBAR/USD', ticker: 'HBAR-USD', cat: 'crypto' },
      { key: 'tron', label: 'TRX/USD', ticker: 'TRX-USD', cat: 'crypto' },
      { key: 'shiba', label: 'SHIB/USD', ticker: 'SHIB-USD', cat: 'crypto' },
      { key: 'pepe', label: 'PEPE/USD', ticker: 'PEPE-USD', cat: 'crypto' },
    ],
  },
  {
    label: 'ENERGY COMMODITIES',
    items: [
      { key: 'oil', label: 'WTI Crude', ticker: 'CL', cat: 'energy' },
      { key: 'brent', label: 'Brent Crude', ticker: 'BZ', cat: 'energy' },
      { key: 'natgas', label: 'Natural Gas', ticker: 'NG', cat: 'energy' },
      { key: 'rbob', label: 'RBOB Gasoline', ticker: 'RB', cat: 'energy' },
      { key: 'heating_oil', label: 'Heating Oil', ticker: 'HO', cat: 'energy' },
      { key: 'coal', label: 'Coal', ticker: 'MTF', cat: 'energy' },
      { key: 'uranium', label: 'Uranium', ticker: 'URA', cat: 'energy' },
      { key: 'ethanol', label: 'Ethanol', ticker: 'EH', cat: 'energy' },
    ],
  },
  {
    label: 'OIL & GAS COMPANIES',
    items: [
      { key: 'xom', label: 'Exxon Mobil', ticker: 'XOM', cat: 'stocks' },
      { key: 'cvx', label: 'Chevron', ticker: 'CVX', cat: 'stocks' },
      { key: 'cop', label: 'ConocoPhillips', ticker: 'COP', cat: 'stocks' },
      { key: 'eog', label: 'EOG Resources', ticker: 'EOG', cat: 'stocks' },
      { key: 'slb', label: 'Schlumberger', ticker: 'SLB', cat: 'stocks' },
      { key: 'hal', label: 'Halliburton', ticker: 'HAL', cat: 'stocks' },
      { key: 'bp', label: 'BP plc', ticker: 'BP', cat: 'stocks' },
      { key: 'shel', label: 'Shell', ticker: 'SHEL', cat: 'stocks' },
      { key: 'tte', label: 'TotalEnergies', ticker: 'TTE', cat: 'stocks' },
      { key: 'oxy', label: 'Occidental', ticker: 'OXY', cat: 'stocks' },
      { key: 'psx', label: 'Phillips 66', ticker: 'PSX', cat: 'stocks' },
      { key: 'mpc', label: 'Marathon Petro', ticker: 'MPC', cat: 'stocks' },
      { key: 'vlo', label: 'Valero Energy', ticker: 'VLO', cat: 'stocks' },
      { key: 'dvn', label: 'Devon Energy', ticker: 'DVN', cat: 'stocks' },
      { key: 'fang', label: 'Diamondback', ticker: 'FANG', cat: 'stocks' },
    ],
  },
  {
    label: 'US INDICES & MEGA CAP',
    items: [
      { key: 'sp500', label: 'S&P 500', ticker: 'SPY', cat: 'stocks' },
      { key: 'nasdaq', label: 'Nasdaq 100', ticker: 'QQQ', cat: 'stocks' },
      { key: 'dow', label: 'Dow Jones', ticker: 'DIA', cat: 'stocks' },
      { key: 'russell', label: 'Russell 2000', ticker: 'IWM', cat: 'stocks' },
      { key: 'aapl', label: 'Apple', ticker: 'AAPL', cat: 'stocks' },
      { key: 'msft', label: 'Microsoft', ticker: 'MSFT', cat: 'stocks' },
      { key: 'nvda', label: 'NVIDIA', ticker: 'NVDA', cat: 'stocks' },
      { key: 'googl', label: 'Alphabet', ticker: 'GOOGL', cat: 'stocks' },
      { key: 'amzn', label: 'Amazon', ticker: 'AMZN', cat: 'stocks' },
      { key: 'meta', label: 'Meta', ticker: 'META', cat: 'stocks' },
      { key: 'tsla', label: 'Tesla', ticker: 'TSLA', cat: 'stocks' },
      { key: 'brk', label: 'Berkshire', ticker: 'BRK.B', cat: 'stocks' },
      { key: 'jpm', label: 'JPMorgan', ticker: 'JPM', cat: 'stocks' },
      { key: 'v', label: 'Visa', ticker: 'V', cat: 'stocks' },
      { key: 'unh', label: 'UnitedHealth', ticker: 'UNH', cat: 'stocks' },
    ],
  },
  {
    label: 'TECH & GROWTH',
    items: [
      { key: 'crm', label: 'Salesforce', ticker: 'CRM', cat: 'stocks' },
      { key: 'adbe', label: 'Adobe', ticker: 'ADBE', cat: 'stocks' },
      { key: 'nflx', label: 'Netflix', ticker: 'NFLX', cat: 'stocks' },
      { key: 'amd', label: 'AMD', ticker: 'AMD', cat: 'stocks' },
      { key: 'intc', label: 'Intel', ticker: 'INTC', cat: 'stocks' },
      { key: 'avgo', label: 'Broadcom', ticker: 'AVGO', cat: 'stocks' },
      { key: 'csco', label: 'Cisco', ticker: 'CSCO', cat: 'stocks' },
      { key: 'orcl', label: 'Oracle', ticker: 'ORCL', cat: 'stocks' },
      { key: 'snow', label: 'Snowflake', ticker: 'SNOW', cat: 'stocks' },
      { key: 'pltr', label: 'Palantir', ticker: 'PLTR', cat: 'stocks' },
      { key: 'coin', label: 'Coinbase', ticker: 'COIN', cat: 'stocks' },
      { key: 'sq', label: 'Block (SQ)', ticker: 'SQ', cat: 'stocks' },
      { key: 'shop', label: 'Shopify', ticker: 'SHOP', cat: 'stocks' },
      { key: 'uber', label: 'Uber', ticker: 'UBER', cat: 'stocks' },
      { key: 'abnb', label: 'Airbnb', ticker: 'ABNB', cat: 'stocks' },
    ],
  },
  {
    label: 'FINANCIALS & MINING',
    items: [
      { key: 'gs', label: 'Goldman Sachs', ticker: 'GS', cat: 'stocks' },
      { key: 'ms', label: 'Morgan Stanley', ticker: 'MS', cat: 'stocks' },
      { key: 'bac', label: 'Bank of America', ticker: 'BAC', cat: 'stocks' },
      { key: 'c', label: 'Citigroup', ticker: 'C', cat: 'stocks' },
      { key: 'wfc', label: 'Wells Fargo', ticker: 'WFC', cat: 'stocks' },
      { key: 'nem', label: 'Newmont Mining', ticker: 'NEM', cat: 'stocks' },
      { key: 'gold_stock', label: 'Barrick Gold', ticker: 'GOLD', cat: 'stocks' },
      { key: 'fmg', label: 'Franco-Nevada', ticker: 'FNV', cat: 'stocks' },
      { key: 'rio', label: 'Rio Tinto', ticker: 'RIO', cat: 'stocks' },
      { key: 'bhp', label: 'BHP Group', ticker: 'BHP', cat: 'stocks' },
      { key: 'vale', label: 'Vale SA', ticker: 'VALE', cat: 'stocks' },
    ],
  },
  {
    label: 'FOREX — MAJOR',
    items: [
      { key: 'eurusd', label: 'EUR/USD', ticker: 'EUR/USD', cat: 'forex' },
      { key: 'gbpusd', label: 'GBP/USD', ticker: 'GBP/USD', cat: 'forex' },
      { key: 'usdjpy', label: 'USD/JPY', ticker: 'USD/JPY', cat: 'forex' },
      { key: 'usdchf', label: 'USD/CHF', ticker: 'USD/CHF', cat: 'forex' },
      { key: 'audusd', label: 'AUD/USD', ticker: 'AUD/USD', cat: 'forex' },
      { key: 'usdcad', label: 'USD/CAD', ticker: 'USD/CAD', cat: 'forex' },
      { key: 'nzdusd', label: 'NZD/USD', ticker: 'NZD/USD', cat: 'forex' },
      { key: 'eurgbp', label: 'EUR/GBP', ticker: 'EUR/GBP', cat: 'forex' },
      { key: 'eurjpy', label: 'EUR/JPY', ticker: 'EUR/JPY', cat: 'forex' },
      { key: 'gbpjpy', label: 'GBP/JPY', ticker: 'GBP/JPY', cat: 'forex' },
      { key: 'usdmxn', label: 'USD/MXN', ticker: 'USD/MXN', cat: 'forex' },
      { key: 'usdzar', label: 'USD/ZAR', ticker: 'USD/ZAR', cat: 'forex' },
      { key: 'usdtry', label: 'USD/TRY', ticker: 'USD/TRY', cat: 'forex' },
      { key: 'usdinr', label: 'USD/INR', ticker: 'USD/INR', cat: 'forex' },
      { key: 'usdcny', label: 'USD/CNY', ticker: 'USD/CNY', cat: 'forex' },
    ],
  },
  {
    label: 'BONDS & FIXED INCOME',
    items: [
      { key: 'tlt', label: '20Y Treasury', ticker: 'TLT', cat: 'bonds' },
      { key: 'ief', label: '10Y Treasury', ticker: 'IEF', cat: 'bonds' },
      { key: 'shy', label: '1-3Y Treasury', ticker: 'SHY', cat: 'bonds' },
      { key: 'tip', label: 'TIPS Bond', ticker: 'TIP', cat: 'bonds' },
      { key: 'lqd', label: 'IG Corp Bond', ticker: 'LQD', cat: 'bonds' },
      { key: 'hyg', label: 'HY Corp Bond', ticker: 'HYG', cat: 'bonds' },
      { key: 'bnd', label: 'Total Bond', ticker: 'BND', cat: 'bonds' },
      { key: 'agg', label: 'US Agg Bond', ticker: 'AGG', cat: 'bonds' },
      { key: 'mub', label: 'Muni Bond', ticker: 'MUB', cat: 'bonds' },
      { key: 'emb', label: 'EM Bond', ticker: 'EMB', cat: 'bonds' },
      { key: 'govt', label: 'US Treasury', ticker: 'GOVT', cat: 'bonds' },
      { key: 'vcsh', label: 'Short Corp', ticker: 'VCSH', cat: 'bonds' },
    ],
  },
];

export const ALL_SYMBOLS = WATCHLIST_CATEGORIES.flatMap((c) => c.items);

// ─── Comprehensive synthetic price map ───────────────────
// Provides base prices for all non-API-sourced symbols

export const SYNTHETIC_PRICES: Record<string, { p: number; c: number }> = {
  // Metals
  palladium: { p: 985, c: -0.45 },
  // Energy
  heating_oil: { p: 2.385, c: -0.41 }, coal: { p: 135, c: 0.8 }, uranium: { p: 92, c: 1.2 }, ethanol: { p: 2.15, c: -0.3 },
  // Oil & Gas Companies
  cop: { p: 108, c: -0.32 }, eog: { p: 125, c: 0.15 }, slb: { p: 42, c: -0.55 },
  hal: { p: 31, c: -0.42 }, bp: { p: 34, c: -0.22 }, shel: { p: 68, c: 0.12 },
  tte: { p: 62, c: -0.15 }, oxy: { p: 52, c: 0.38 }, psx: { p: 142, c: 0.22 },
  mpc: { p: 158, c: 0.45 }, vlo: { p: 145, c: -0.18 }, dvn: { p: 38, c: -0.62 },
  fang: { p: 168, c: 0.55 },
  // Indices & Mega Cap
  sp500: { p: 5940, c: 0.35 }, nasdaq: { p: 520, c: 0.48 }, dow: { p: 438, c: 0.22 },
  russell: { p: 225, c: -0.15 },
  aapl: { p: 235, c: 0.22 }, msft: { p: 445, c: 0.31 }, nvda: { p: 875, c: 1.85 },
  googl: { p: 175, c: 0.42 }, amzn: { p: 195, c: 0.65 }, meta: { p: 585, c: 0.92 },
  tsla: { p: 245, c: -1.2 }, brk: { p: 465, c: 0.18 }, jpm: { p: 215, c: 0.28 },
  v: { p: 285, c: 0.35 }, unh: { p: 545, c: -0.22 },
  // Tech & Growth
  crm: { p: 265, c: 0.55 }, adbe: { p: 485, c: 0.42 }, nflx: { p: 895, c: 0.85 },
  amd: { p: 165, c: 1.15 }, intc: { p: 22, c: -0.85 }, avgo: { p: 1680, c: 0.72 },
  csco: { p: 55, c: 0.18 }, orcl: { p: 175, c: 0.38 }, snow: { p: 165, c: -0.45 },
  pltr: { p: 72, c: 2.15 }, coin: { p: 285, c: 3.2 }, sq: { p: 78, c: 1.05 },
  shop: { p: 105, c: 0.62 }, uber: { p: 72, c: 0.45 }, abnb: { p: 138, c: -0.32 },
  // O&G companies already above
  xom: { p: 115, c: -0.18 }, cvx: { p: 162, c: -0.12 },
  // Financials & Mining
  gs: { p: 545, c: 0.42 }, ms: { p: 108, c: 0.28 }, bac: { p: 42, c: 0.15 },
  c: { p: 68, c: 0.22 }, wfc: { p: 62, c: 0.18 },
  nem: { p: 42, c: 1.8 }, gold_stock: { p: 18, c: 2.2 }, fmg: { p: 128, c: 1.5 },
  rio: { p: 68, c: 0.85 }, bhp: { p: 58, c: 0.62 }, vale: { p: 11, c: -0.55 },
  // Forex
  eurusd: { p: 1.0845, c: 0.12 }, gbpusd: { p: 1.2685, c: -0.08 },
  usdjpy: { p: 152.35, c: 0.22 }, usdchf: { p: 0.8825, c: -0.15 },
  audusd: { p: 0.6545, c: 0.18 }, usdcad: { p: 1.3575, c: -0.05 },
  nzdusd: { p: 0.6125, c: 0.25 }, eurgbp: { p: 0.8548, c: 0.08 },
  eurjpy: { p: 165.22, c: 0.35 }, gbpjpy: { p: 193.15, c: 0.28 },
  usdmxn: { p: 17.25, c: -0.32 }, usdzar: { p: 18.45, c: 0.55 },
  usdtry: { p: 32.85, c: 0.42 }, usdinr: { p: 83.25, c: 0.08 },
  usdcny: { p: 7.225, c: -0.05 },
  // Bonds
  tlt: { p: 92, c: 0.08 }, ief: { p: 96, c: 0.05 }, shy: { p: 82, c: 0.02 },
  tip: { p: 108, c: 0.06 }, lqd: { p: 110, c: 0.06 }, hyg: { p: 78, c: -0.04 },
  bnd: { p: 72, c: 0.03 }, agg: { p: 100, c: 0.04 }, mub: { p: 108, c: 0.02 },
  emb: { p: 88, c: -0.12 }, govt: { p: 24, c: 0.01 }, vcsh: { p: 78, c: 0.02 },
};

// Category color map
export const CATEGORY_COLORS: Record<string, string> = {
  metals: 'hsl(43, 72%, 50%)',
  crypto: 'hsl(38, 92%, 50%)',
  energy: 'hsl(25, 95%, 53%)',
  stocks: 'hsl(217, 91%, 60%)',
  bonds: 'hsl(210, 6%, 67%)',
  forex: 'hsl(170, 70%, 50%)',
};
