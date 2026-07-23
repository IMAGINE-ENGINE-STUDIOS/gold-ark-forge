// ─── Comprehensive Trading Symbol Universe ───────────────
// 700+ symbols across 10 categories — SINGLE SOURCE OF TRUTH
// Used by both SWAP (TradingBridge) and Marketplace

export interface WatchlistSymbol {
  key: string;
  label: string;
  ticker: string;
  cat: string;
  sub?: string;  // sub-category for marketplace filtering
}

export interface WatchlistCategory {
  label: string;
  items: WatchlistSymbol[];
}

export const WATCHLIST_CATEGORIES: WatchlistCategory[] = [
  /* ══════════════════════════════════════════════════════════
     PRECIOUS METALS (15)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'PRECIOUS METALS — SPOT',
    items: [
      { key: 'gold', label: 'XAU/USD', ticker: 'GLD', cat: 'metals', sub: 'spot' },
      { key: 'silver', label: 'XAG/USD', ticker: 'SLV', cat: 'metals', sub: 'spot' },
      { key: 'platinum', label: 'XPT/USD', ticker: 'PPLT', cat: 'metals', sub: 'spot' },
      { key: 'palladium', label: 'XPD/USD', ticker: 'PALL', cat: 'metals', sub: 'spot' },
      { key: 'rhodium', label: 'Rhodium', ticker: 'RHOD', cat: 'metals', sub: 'spot' },
      { key: 'iridium', label: 'Iridium', ticker: 'IRID', cat: 'metals', sub: 'spot' },
      { key: 'ruthenium', label: 'Ruthenium', ticker: 'RUTH', cat: 'metals', sub: 'spot' },
      { key: 'osmium', label: 'Osmium', ticker: 'OSMI', cat: 'metals', sub: 'spot' },
    ],
  },
  {
    label: 'INDUSTRIAL METALS',
    items: [
      { key: 'copper', label: 'Copper', ticker: 'HG', cat: 'metals', sub: 'industrial' },
      { key: 'aluminum', label: 'Aluminum', ticker: 'ALI', cat: 'metals', sub: 'industrial' },
      { key: 'zinc', label: 'Zinc', ticker: 'ZNC', cat: 'metals', sub: 'industrial' },
      { key: 'nickel', label: 'Nickel', ticker: 'NI', cat: 'metals', sub: 'industrial' },
      { key: 'tin', label: 'Tin', ticker: 'SN', cat: 'metals', sub: 'industrial' },
      { key: 'lead', label: 'Lead', ticker: 'PB', cat: 'metals', sub: 'industrial' },
      { key: 'cobalt', label: 'Cobalt', ticker: 'COBALT', cat: 'metals', sub: 'industrial' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     CRYPTO — MAJOR (10)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'CRYPTO — MAJOR',
    items: [
      { key: 'bitcoin', label: 'BTC/USD', ticker: 'BTC-USD', cat: 'crypto', sub: 'major' },
      { key: 'ethereum', label: 'ETH/USD', ticker: 'ETH-USD', cat: 'crypto', sub: 'major' },
      { key: 'solana', label: 'SOL/USD', ticker: 'SOL-USD', cat: 'crypto', sub: 'major' },
      { key: 'xrp', label: 'XRP/USD', ticker: 'XRP-USD', cat: 'crypto', sub: 'major' },
      { key: 'bnb', label: 'BNB/USD', ticker: 'BNB-USD', cat: 'crypto', sub: 'major' },
      { key: 'cardano', label: 'ADA/USD', ticker: 'ADA-USD', cat: 'crypto', sub: 'major' },
      { key: 'avalanche', label: 'AVAX/USD', ticker: 'AVAX-USD', cat: 'crypto', sub: 'major' },
      { key: 'polkadot', label: 'DOT/USD', ticker: 'DOT-USD', cat: 'crypto', sub: 'major' },
      { key: 'chainlink', label: 'LINK/USD', ticker: 'LINK-USD', cat: 'crypto', sub: 'major' },
      { key: 'dogecoin', label: 'DOGE/USD', ticker: 'DOGE-USD', cat: 'crypto', sub: 'major' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     CRYPTO — ALT (60)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'CRYPTO — ALT',
    items: [
      { key: 'polygon', label: 'MATIC/USD', ticker: 'MATIC-USD', cat: 'crypto', sub: 'alt' },
      { key: 'litecoin', label: 'LTC/USD', ticker: 'LTC-USD', cat: 'crypto', sub: 'alt' },
      { key: 'uniswap', label: 'UNI/USD', ticker: 'UNI-USD', cat: 'crypto', sub: 'alt' },
      { key: 'near', label: 'NEAR/USD', ticker: 'NEAR-USD', cat: 'crypto', sub: 'alt' },
      { key: 'aptos', label: 'APT/USD', ticker: 'APT-USD', cat: 'crypto', sub: 'alt' },
      { key: 'sui', label: 'SUI/USD', ticker: 'SUI-USD', cat: 'crypto', sub: 'alt' },
      { key: 'arbitrum', label: 'ARB/USD', ticker: 'ARB-USD', cat: 'crypto', sub: 'alt' },
      { key: 'optimism', label: 'OP/USD', ticker: 'OP-USD', cat: 'crypto', sub: 'alt' },
      { key: 'injective', label: 'INJ/USD', ticker: 'INJ-USD', cat: 'crypto', sub: 'alt' },
      { key: 'render', label: 'RNDR/USD', ticker: 'RNDR-USD', cat: 'crypto', sub: 'alt' },
      { key: 'filecoin', label: 'FIL/USD', ticker: 'FIL-USD', cat: 'crypto', sub: 'alt' },
      { key: 'cosmos', label: 'ATOM/USD', ticker: 'ATOM-USD', cat: 'crypto', sub: 'alt' },
      { key: 'stellar', label: 'XLM/USD', ticker: 'XLM-USD', cat: 'crypto', sub: 'alt' },
      { key: 'hedera', label: 'HBAR/USD', ticker: 'HBAR-USD', cat: 'crypto', sub: 'alt' },
      { key: 'tron', label: 'TRX/USD', ticker: 'TRX-USD', cat: 'crypto', sub: 'alt' },
      { key: 'shiba', label: 'SHIB/USD', ticker: 'SHIB-USD', cat: 'crypto', sub: 'alt' },
      { key: 'pepe', label: 'PEPE/USD', ticker: 'PEPE-USD', cat: 'crypto', sub: 'alt' },
      // New altcoins
      { key: 'kaspa', label: 'KAS/USD', ticker: 'KAS-USD', cat: 'crypto', sub: 'alt' },
      { key: 'sei', label: 'SEI/USD', ticker: 'SEI-USD', cat: 'crypto', sub: 'alt' },
      { key: 'celestia', label: 'TIA/USD', ticker: 'TIA-USD', cat: 'crypto', sub: 'alt' },
      { key: 'stacks', label: 'STX/USD', ticker: 'STX-USD', cat: 'crypto', sub: 'alt' },
      { key: 'mantle', label: 'MNT/USD', ticker: 'MNT-USD', cat: 'crypto', sub: 'alt' },
      { key: 'immutablex', label: 'IMX/USD', ticker: 'IMX-USD', cat: 'crypto', sub: 'alt' },
      { key: 'gala', label: 'GALA/USD', ticker: 'GALA-USD', cat: 'crypto', sub: 'alt' },
      { key: 'axie', label: 'AXS/USD', ticker: 'AXS-USD', cat: 'crypto', sub: 'alt' },
      { key: 'sandbox', label: 'SAND/USD', ticker: 'SAND-USD', cat: 'crypto', sub: 'alt' },
      { key: 'decentraland', label: 'MANA/USD', ticker: 'MANA-USD', cat: 'crypto', sub: 'alt' },
      { key: 'enjin', label: 'ENJ/USD', ticker: 'ENJ-USD', cat: 'crypto', sub: 'alt' },
      { key: 'theta', label: 'THETA/USD', ticker: 'THETA-USD', cat: 'crypto', sub: 'alt' },
      { key: 'aave', label: 'AAVE/USD', ticker: 'AAVE-USD', cat: 'crypto', sub: 'alt' },
      { key: 'maker', label: 'MKR/USD', ticker: 'MKR-USD', cat: 'crypto', sub: 'alt' },
      { key: 'compound', label: 'COMP/USD', ticker: 'COMP-USD', cat: 'crypto', sub: 'alt' },
      { key: 'curve', label: 'CRV/USD', ticker: 'CRV-USD', cat: 'crypto', sub: 'alt' },
      { key: 'lido', label: 'LDO/USD', ticker: 'LDO-USD', cat: 'crypto', sub: 'alt' },
      { key: 'rocketpool', label: 'RPL/USD', ticker: 'RPL-USD', cat: 'crypto', sub: 'alt' },
      { key: 'pendle', label: 'PENDLE/USD', ticker: 'PENDLE-USD', cat: 'crypto', sub: 'alt' },
      { key: 'jupiter', label: 'JUP/USD', ticker: 'JUP-USD', cat: 'crypto', sub: 'alt' },
      { key: 'raydium', label: 'RAY/USD', ticker: 'RAY-USD', cat: 'crypto', sub: 'alt' },
      { key: 'ondo', label: 'ONDO/USD', ticker: 'ONDO-USD', cat: 'crypto', sub: 'alt' },
      { key: 'worldcoin', label: 'WLD/USD', ticker: 'WLD-USD', cat: 'crypto', sub: 'alt' },
      { key: 'floki', label: 'FLOKI/USD', ticker: 'FLOKI-USD', cat: 'crypto', sub: 'alt' },
      { key: 'bonk', label: 'BONK/USD', ticker: 'BONK-USD', cat: 'crypto', sub: 'alt' },
      { key: 'wif', label: 'WIF/USD', ticker: 'WIF-USD', cat: 'crypto', sub: 'alt' },
      { key: 'fetch', label: 'FET/USD', ticker: 'FET-USD', cat: 'crypto', sub: 'alt' },
      { key: 'ocean', label: 'OCEAN/USD', ticker: 'OCEAN-USD', cat: 'crypto', sub: 'alt' },
      { key: 'singularity', label: 'AGIX/USD', ticker: 'AGIX-USD', cat: 'crypto', sub: 'alt' },
      { key: 'bittensor', label: 'TAO/USD', ticker: 'TAO-USD', cat: 'crypto', sub: 'alt' },
      { key: 'akash', label: 'AKT/USD', ticker: 'AKT-USD', cat: 'crypto', sub: 'alt' },
      { key: 'arweave', label: 'AR/USD', ticker: 'AR-USD', cat: 'crypto', sub: 'alt' },
      { key: 'vechain', label: 'VET/USD', ticker: 'VET-USD', cat: 'crypto', sub: 'alt' },
      { key: 'quant', label: 'QNT/USD', ticker: 'QNT-USD', cat: 'crypto', sub: 'alt' },
      { key: 'algorand', label: 'ALGO/USD', ticker: 'ALGO-USD', cat: 'crypto', sub: 'alt' },
      { key: 'flow', label: 'FLOW/USD', ticker: 'FLOW-USD', cat: 'crypto', sub: 'alt' },
      { key: 'mina', label: 'MINA/USD', ticker: 'MINA-USD', cat: 'crypto', sub: 'alt' },
      { key: 'zcash', label: 'ZEC/USD', ticker: 'ZEC-USD', cat: 'crypto', sub: 'alt' },
      { key: 'monero', label: 'XMR/USD', ticker: 'XMR-USD', cat: 'crypto', sub: 'alt' },
      { key: 'dash', label: 'DASH/USD', ticker: 'DASH-USD', cat: 'crypto', sub: 'alt' },
      { key: 'iota', label: 'IOTA/USD', ticker: 'IOTA-USD', cat: 'crypto', sub: 'alt' },
      { key: 'eos', label: 'EOS/USD', ticker: 'EOS-USD', cat: 'crypto', sub: 'alt' },
      { key: 'neo', label: 'NEO/USD', ticker: 'NEO-USD', cat: 'crypto', sub: 'alt' },
      { key: 'zilliqa', label: 'ZIL/USD', ticker: 'ZIL-USD', cat: 'crypto', sub: 'alt' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     CRYPTO — STABLECOINS & WRAPPED (10)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'CRYPTO — STABLECOINS',
    items: [
      { key: 'tether', label: 'USDT/USD', ticker: 'USDT-USD', cat: 'crypto', sub: 'stable' },
      { key: 'usdc', label: 'USDC/USD', ticker: 'USDC-USD', cat: 'crypto', sub: 'stable' },
      { key: 'dai', label: 'DAI/USD', ticker: 'DAI-USD', cat: 'crypto', sub: 'stable' },
      { key: 'frax', label: 'FRAX/USD', ticker: 'FRAX-USD', cat: 'crypto', sub: 'stable' },
      { key: 'tusd', label: 'TUSD/USD', ticker: 'TUSD-USD', cat: 'crypto', sub: 'stable' },
      { key: 'paxg', label: 'PAXG/USD', ticker: 'PAXG-USD', cat: 'crypto', sub: 'stable' },
      { key: 'wbtc', label: 'WBTC/USD', ticker: 'WBTC-USD', cat: 'crypto', sub: 'stable' },
      { key: 'weth', label: 'WETH/USD', ticker: 'WETH-USD', cat: 'crypto', sub: 'stable' },
      { key: 'steth', label: 'stETH/USD', ticker: 'STETH-USD', cat: 'crypto', sub: 'stable' },
      { key: 'cbeth', label: 'cbETH/USD', ticker: 'CBETH-USD', cat: 'crypto', sub: 'stable' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     ENERGY COMMODITIES (15)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'ENERGY COMMODITIES',
    items: [
      { key: 'oil', label: 'WTI Crude', ticker: 'CL', cat: 'energy', sub: 'commodities' },
      { key: 'brent', label: 'Brent Crude', ticker: 'BZ', cat: 'energy', sub: 'commodities' },
      { key: 'natgas', label: 'Natural Gas', ticker: 'NG', cat: 'energy', sub: 'commodities' },
      { key: 'rbob', label: 'RBOB Gasoline', ticker: 'RB', cat: 'energy', sub: 'commodities' },
      { key: 'heating_oil', label: 'Heating Oil', ticker: 'HO', cat: 'energy', sub: 'commodities' },
      { key: 'coal', label: 'Coal', ticker: 'MTF', cat: 'energy', sub: 'commodities' },
      { key: 'uranium', label: 'Uranium', ticker: 'URA', cat: 'energy', sub: 'commodities' },
      { key: 'ethanol', label: 'Ethanol', ticker: 'EH', cat: 'energy', sub: 'commodities' },
      { key: 'lpg', label: 'Propane LPG', ticker: 'LPG', cat: 'energy', sub: 'commodities' },
      { key: 'jet_fuel', label: 'Jet Fuel', ticker: 'JET', cat: 'energy', sub: 'commodities' },
      { key: 'diesel', label: 'Ultra-Low Diesel', ticker: 'ULS', cat: 'energy', sub: 'commodities' },
      { key: 'carbon_eu', label: 'EU Carbon', ticker: 'EUA', cat: 'energy', sub: 'commodities' },
      { key: 'carbon_us', label: 'US Carbon', ticker: 'CCA', cat: 'energy', sub: 'commodities' },
      { key: 'hydrogen', label: 'Green Hydrogen', ticker: 'H2', cat: 'energy', sub: 'commodities' },
      { key: 'lng', label: 'LNG Spot', ticker: 'LNG', cat: 'energy', sub: 'commodities' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     OIL & GAS COMPANIES (25)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'OIL & GAS COMPANIES',
    items: [
      { key: 'xom', label: 'Exxon Mobil', ticker: 'XOM', cat: 'stocks', sub: 'oil_gas' },
      { key: 'cvx', label: 'Chevron', ticker: 'CVX', cat: 'stocks', sub: 'oil_gas' },
      { key: 'cop', label: 'ConocoPhillips', ticker: 'COP', cat: 'stocks', sub: 'oil_gas' },
      { key: 'eog', label: 'EOG Resources', ticker: 'EOG', cat: 'stocks', sub: 'oil_gas' },
      { key: 'slb', label: 'Schlumberger', ticker: 'SLB', cat: 'stocks', sub: 'oil_gas' },
      { key: 'hal', label: 'Halliburton', ticker: 'HAL', cat: 'stocks', sub: 'oil_gas' },
      { key: 'bp', label: 'BP plc', ticker: 'BP', cat: 'stocks', sub: 'oil_gas' },
      { key: 'shel', label: 'Shell', ticker: 'SHEL', cat: 'stocks', sub: 'oil_gas' },
      { key: 'tte', label: 'TotalEnergies', ticker: 'TTE', cat: 'stocks', sub: 'oil_gas' },
      { key: 'oxy', label: 'Occidental', ticker: 'OXY', cat: 'stocks', sub: 'oil_gas' },
      { key: 'psx', label: 'Phillips 66', ticker: 'PSX', cat: 'stocks', sub: 'oil_gas' },
      { key: 'mpc', label: 'Marathon Petro', ticker: 'MPC', cat: 'stocks', sub: 'oil_gas' },
      { key: 'vlo', label: 'Valero Energy', ticker: 'VLO', cat: 'stocks', sub: 'oil_gas' },
      { key: 'dvn', label: 'Devon Energy', ticker: 'DVN', cat: 'stocks', sub: 'oil_gas' },
      { key: 'fang', label: 'Diamondback', ticker: 'FANG', cat: 'stocks', sub: 'oil_gas' },
      { key: 'eni', label: 'Eni SpA', ticker: 'ENI', cat: 'stocks', sub: 'oil_gas' },
      { key: 'eqnr', label: 'Equinor', ticker: 'EQNR', cat: 'stocks', sub: 'oil_gas' },
      { key: 'cnq', label: 'Canadian Natural', ticker: 'CNQ', cat: 'stocks', sub: 'oil_gas' },
      { key: 'su', label: 'Suncor Energy', ticker: 'SU', cat: 'stocks', sub: 'oil_gas' },
      { key: 'pba', label: 'Pembina Pipeline', ticker: 'PBA', cat: 'stocks', sub: 'oil_gas' },
      { key: 'wds', label: 'Woodside Energy', ticker: 'WDS', cat: 'stocks', sub: 'oil_gas' },
      { key: 'ptr', label: 'PetroChina', ticker: 'PTR', cat: 'stocks', sub: 'oil_gas' },
      { key: 'snp', label: 'China Petroleum', ticker: 'SNP', cat: 'stocks', sub: 'oil_gas' },
      { key: 'pBr', label: 'Petrobras', ticker: 'PBR', cat: 'stocks', sub: 'oil_gas' },
      { key: 'ec', label: 'Ecopetrol', ticker: 'EC', cat: 'stocks', sub: 'oil_gas' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     US INDICES & MEGA CAP (15)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'US INDICES & MEGA CAP',
    items: [
      { key: 'sp500', label: 'S&P 500', ticker: 'SPY', cat: 'stocks', sub: 'indices' },
      { key: 'nasdaq', label: 'Nasdaq 100', ticker: 'QQQ', cat: 'stocks', sub: 'indices' },
      { key: 'dow', label: 'Dow Jones', ticker: 'DIA', cat: 'stocks', sub: 'indices' },
      { key: 'russell', label: 'Russell 2000', ticker: 'IWM', cat: 'stocks', sub: 'indices' },
      { key: 'aapl', label: 'Apple', ticker: 'AAPL', cat: 'stocks', sub: 'mega' },
      { key: 'msft', label: 'Microsoft', ticker: 'MSFT', cat: 'stocks', sub: 'mega' },
      { key: 'nvda', label: 'NVIDIA', ticker: 'NVDA', cat: 'stocks', sub: 'mega' },
      { key: 'googl', label: 'Alphabet', ticker: 'GOOGL', cat: 'stocks', sub: 'mega' },
      { key: 'amzn', label: 'Amazon', ticker: 'AMZN', cat: 'stocks', sub: 'mega' },
      { key: 'meta', label: 'Meta', ticker: 'META', cat: 'stocks', sub: 'mega' },
      { key: 'tsla', label: 'Tesla', ticker: 'TSLA', cat: 'stocks', sub: 'mega' },
      { key: 'brk', label: 'Berkshire', ticker: 'BRK.B', cat: 'stocks', sub: 'mega' },
      { key: 'jpm', label: 'JPMorgan', ticker: 'JPM', cat: 'stocks', sub: 'mega' },
      { key: 'v', label: 'Visa', ticker: 'V', cat: 'stocks', sub: 'mega' },
      { key: 'unh', label: 'UnitedHealth', ticker: 'UNH', cat: 'stocks', sub: 'mega' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     TECH & GROWTH (25)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'TECH & GROWTH',
    items: [
      { key: 'crm', label: 'Salesforce', ticker: 'CRM', cat: 'stocks', sub: 'tech' },
      { key: 'adbe', label: 'Adobe', ticker: 'ADBE', cat: 'stocks', sub: 'tech' },
      { key: 'nflx', label: 'Netflix', ticker: 'NFLX', cat: 'stocks', sub: 'tech' },
      { key: 'amd', label: 'AMD', ticker: 'AMD', cat: 'stocks', sub: 'tech' },
      { key: 'intc', label: 'Intel', ticker: 'INTC', cat: 'stocks', sub: 'tech' },
      { key: 'avgo', label: 'Broadcom', ticker: 'AVGO', cat: 'stocks', sub: 'tech' },
      { key: 'csco', label: 'Cisco', ticker: 'CSCO', cat: 'stocks', sub: 'tech' },
      { key: 'orcl', label: 'Oracle', ticker: 'ORCL', cat: 'stocks', sub: 'tech' },
      { key: 'snow', label: 'Snowflake', ticker: 'SNOW', cat: 'stocks', sub: 'tech' },
      { key: 'pltr', label: 'Palantir', ticker: 'PLTR', cat: 'stocks', sub: 'tech' },
      { key: 'coin', label: 'Coinbase', ticker: 'COIN', cat: 'stocks', sub: 'tech' },
      { key: 'sq', label: 'Block (SQ)', ticker: 'SQ', cat: 'stocks', sub: 'tech' },
      { key: 'shop', label: 'Shopify', ticker: 'SHOP', cat: 'stocks', sub: 'tech' },
      { key: 'uber', label: 'Uber', ticker: 'UBER', cat: 'stocks', sub: 'tech' },
      { key: 'abnb', label: 'Airbnb', ticker: 'ABNB', cat: 'stocks', sub: 'tech' },
      { key: 'twlo', label: 'Twilio', ticker: 'TWLO', cat: 'stocks', sub: 'tech' },
      { key: 'ddog', label: 'Datadog', ticker: 'DDOG', cat: 'stocks', sub: 'tech' },
      { key: 'crwd', label: 'CrowdStrike', ticker: 'CRWD', cat: 'stocks', sub: 'tech' },
      { key: 'zs', label: 'Zscaler', ticker: 'ZS', cat: 'stocks', sub: 'tech' },
      { key: 'net', label: 'Cloudflare', ticker: 'NET', cat: 'stocks', sub: 'tech' },
      { key: 'mdb', label: 'MongoDB', ticker: 'MDB', cat: 'stocks', sub: 'tech' },
      { key: 'okta', label: 'Okta', ticker: 'OKTA', cat: 'stocks', sub: 'tech' },
      { key: 'panw', label: 'Palo Alto', ticker: 'PANW', cat: 'stocks', sub: 'tech' },
      { key: 'ftnt', label: 'Fortinet', ticker: 'FTNT', cat: 'stocks', sub: 'tech' },
      { key: 'now', label: 'ServiceNow', ticker: 'NOW', cat: 'stocks', sub: 'tech' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     FINANCIALS & MINING (20)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'FINANCIALS & MINING',
    items: [
      { key: 'gs', label: 'Goldman Sachs', ticker: 'GS', cat: 'stocks', sub: 'financial' },
      { key: 'ms', label: 'Morgan Stanley', ticker: 'MS', cat: 'stocks', sub: 'financial' },
      { key: 'bac', label: 'Bank of America', ticker: 'BAC', cat: 'stocks', sub: 'financial' },
      { key: 'c', label: 'Citigroup', ticker: 'C', cat: 'stocks', sub: 'financial' },
      { key: 'wfc', label: 'Wells Fargo', ticker: 'WFC', cat: 'stocks', sub: 'financial' },
      { key: 'nem', label: 'Newmont Mining', ticker: 'NEM', cat: 'stocks', sub: 'mining' },
      { key: 'gold_stock', label: 'Barrick Gold', ticker: 'GOLD', cat: 'stocks', sub: 'mining' },
      { key: 'fmg', label: 'Franco-Nevada', ticker: 'FNV', cat: 'stocks', sub: 'mining' },
      { key: 'rio', label: 'Rio Tinto', ticker: 'RIO', cat: 'stocks', sub: 'mining' },
      { key: 'bhp', label: 'BHP Group', ticker: 'BHP', cat: 'stocks', sub: 'mining' },
      { key: 'vale', label: 'Vale SA', ticker: 'VALE', cat: 'stocks', sub: 'mining' },
      { key: 'schw', label: 'Schwab', ticker: 'SCHW', cat: 'stocks', sub: 'financial' },
      { key: 'aig', label: 'AIG', ticker: 'AIG', cat: 'stocks', sub: 'financial' },
      { key: 'met', label: 'MetLife', ticker: 'MET', cat: 'stocks', sub: 'financial' },
      { key: 'pru', label: 'Prudential', ticker: 'PRU', cat: 'stocks', sub: 'financial' },
      { key: 'bx', label: 'Blackstone', ticker: 'BX', cat: 'stocks', sub: 'financial' },
      { key: 'kkr', label: 'KKR & Co', ticker: 'KKR', cat: 'stocks', sub: 'financial' },
      { key: 'aem', label: 'Agnico Eagle', ticker: 'AEM', cat: 'stocks', sub: 'mining' },
      { key: 'wpm', label: 'Wheaton Prec', ticker: 'WPM', cat: 'stocks', sub: 'mining' },
      { key: 'aa', label: 'Alcoa', ticker: 'AA', cat: 'stocks', sub: 'mining' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     HEALTHCARE & PHARMA (25)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'HEALTHCARE & PHARMA',
    items: [
      { key: 'lly', label: 'Eli Lilly', ticker: 'LLY', cat: 'stocks', sub: 'healthcare' },
      { key: 'jnj', label: 'Johnson & Johnson', ticker: 'JNJ', cat: 'stocks', sub: 'healthcare' },
      { key: 'pfe', label: 'Pfizer', ticker: 'PFE', cat: 'stocks', sub: 'healthcare' },
      { key: 'mrk', label: 'Merck', ticker: 'MRK', cat: 'stocks', sub: 'healthcare' },
      { key: 'abbv', label: 'AbbVie', ticker: 'ABBV', cat: 'stocks', sub: 'healthcare' },
      { key: 'amgn', label: 'Amgen', ticker: 'AMGN', cat: 'stocks', sub: 'healthcare' },
      { key: 'gild', label: 'Gilead', ticker: 'GILD', cat: 'stocks', sub: 'healthcare' },
      { key: 'bmy', label: 'Bristol Myers', ticker: 'BMY', cat: 'stocks', sub: 'healthcare' },
      { key: 'mdT', label: 'Medtronic', ticker: 'MDT', cat: 'stocks', sub: 'healthcare' },
      { key: 'isrg', label: 'Intuitive Surg', ticker: 'ISRG', cat: 'stocks', sub: 'healthcare' },
      { key: 'tmo', label: 'Thermo Fisher', ticker: 'TMO', cat: 'stocks', sub: 'healthcare' },
      { key: 'dhr', label: 'Danaher', ticker: 'DHR', cat: 'stocks', sub: 'healthcare' },
      { key: 'abt', label: 'Abbott Labs', ticker: 'ABT', cat: 'stocks', sub: 'healthcare' },
      { key: 'syk', label: 'Stryker', ticker: 'SYK', cat: 'stocks', sub: 'healthcare' },
      { key: 'bsx', label: 'Boston Sci', ticker: 'BSX', cat: 'stocks', sub: 'healthcare' },
      { key: 'regn', label: 'Regeneron', ticker: 'REGN', cat: 'stocks', sub: 'healthcare' },
      { key: 'vrtx', label: 'Vertex Pharma', ticker: 'VRTX', cat: 'stocks', sub: 'healthcare' },
      { key: 'biib', label: 'Biogen', ticker: 'BIIB', cat: 'stocks', sub: 'healthcare' },
      { key: 'hum', label: 'Humana', ticker: 'HUM', cat: 'stocks', sub: 'healthcare' },
      { key: 'ci', label: 'Cigna', ticker: 'CI', cat: 'stocks', sub: 'healthcare' },
      { key: 'elv', label: 'Elevance', ticker: 'ELV', cat: 'stocks', sub: 'healthcare' },
      { key: 'cvs_stock', label: 'CVS Health', ticker: 'CVS', cat: 'stocks', sub: 'healthcare' },
      { key: 'mrna', label: 'Moderna', ticker: 'MRNA', cat: 'stocks', sub: 'healthcare' },
      { key: 'nvo', label: 'Novo Nordisk', ticker: 'NVO', cat: 'stocks', sub: 'healthcare' },
      { key: 'azn', label: 'AstraZeneca', ticker: 'AZN', cat: 'stocks', sub: 'healthcare' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     CONSUMER & RETAIL (25)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'CONSUMER & RETAIL',
    items: [
      { key: 'wmt', label: 'Walmart', ticker: 'WMT', cat: 'stocks', sub: 'consumer' },
      { key: 'cost', label: 'Costco', ticker: 'COST', cat: 'stocks', sub: 'consumer' },
      { key: 'hd', label: 'Home Depot', ticker: 'HD', cat: 'stocks', sub: 'consumer' },
      { key: 'low', label: 'Lowes', ticker: 'LOW', cat: 'stocks', sub: 'consumer' },
      { key: 'tgt', label: 'Target', ticker: 'TGT', cat: 'stocks', sub: 'consumer' },
      { key: 'ko', label: 'Coca-Cola', ticker: 'KO', cat: 'stocks', sub: 'consumer' },
      { key: 'pep', label: 'PepsiCo', ticker: 'PEP', cat: 'stocks', sub: 'consumer' },
      { key: 'pg', label: 'Procter & Gamble', ticker: 'PG', cat: 'stocks', sub: 'consumer' },
      { key: 'cl', label: 'Colgate', ticker: 'CL', cat: 'stocks', sub: 'consumer' },
      { key: 'mcd', label: 'McDonalds', ticker: 'MCD', cat: 'stocks', sub: 'consumer' },
      { key: 'sbux', label: 'Starbucks', ticker: 'SBUX', cat: 'stocks', sub: 'consumer' },
      { key: 'nke', label: 'Nike', ticker: 'NKE', cat: 'stocks', sub: 'consumer' },
      { key: 'dis', label: 'Walt Disney', ticker: 'DIS', cat: 'stocks', sub: 'consumer' },
      { key: 'cmcsa', label: 'Comcast', ticker: 'CMCSA', cat: 'stocks', sub: 'consumer' },
      { key: 'pypl', label: 'PayPal', ticker: 'PYPL', cat: 'stocks', sub: 'consumer' },
      { key: 'ma', label: 'Mastercard', ticker: 'MA', cat: 'stocks', sub: 'consumer' },
      { key: 'tmo_consumer', label: 'T-Mobile', ticker: 'TMUS', cat: 'stocks', sub: 'consumer' },
      { key: 'vz', label: 'Verizon', ticker: 'VZ', cat: 'stocks', sub: 'consumer' },
      { key: 'att', label: 'AT&T', ticker: 'T', cat: 'stocks', sub: 'consumer' },
      { key: 'lvmh', label: 'LVMH', ticker: 'LVMUY', cat: 'stocks', sub: 'consumer' },
      { key: 'ul', label: 'Unilever', ticker: 'UL', cat: 'stocks', sub: 'consumer' },
      { key: 'nsrgy', label: 'Nestle', ticker: 'NSRGY', cat: 'stocks', sub: 'consumer' },
      { key: 'elf', label: 'e.l.f. Beauty', ticker: 'ELF', cat: 'stocks', sub: 'consumer' },
      { key: 'lulu', label: 'Lululemon', ticker: 'LULU', cat: 'stocks', sub: 'consumer' },
      { key: 'rost', label: 'Ross Stores', ticker: 'ROST', cat: 'stocks', sub: 'consumer' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     INDUSTRIALS & DEFENSE (25)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'INDUSTRIALS & DEFENSE',
    items: [
      { key: 'lmt', label: 'Lockheed Martin', ticker: 'LMT', cat: 'stocks', sub: 'industrial' },
      { key: 'rtx', label: 'RTX Corp', ticker: 'RTX', cat: 'stocks', sub: 'industrial' },
      { key: 'ba', label: 'Boeing', ticker: 'BA', cat: 'stocks', sub: 'industrial' },
      { key: 'gd', label: 'General Dynamics', ticker: 'GD', cat: 'stocks', sub: 'industrial' },
      { key: 'noc', label: 'Northrop Grumman', ticker: 'NOC', cat: 'stocks', sub: 'industrial' },
      { key: 'cat', label: 'Caterpillar', ticker: 'CAT', cat: 'stocks', sub: 'industrial' },
      { key: 'de', label: 'Deere', ticker: 'DE', cat: 'stocks', sub: 'industrial' },
      { key: 'hon', label: 'Honeywell', ticker: 'HON', cat: 'stocks', sub: 'industrial' },
      { key: 'ge', label: 'GE Aerospace', ticker: 'GE', cat: 'stocks', sub: 'industrial' },
      { key: 'mmm', label: '3M', ticker: 'MMM', cat: 'stocks', sub: 'industrial' },
      { key: 'ups', label: 'UPS', ticker: 'UPS', cat: 'stocks', sub: 'industrial' },
      { key: 'fdx', label: 'FedEx', ticker: 'FDX', cat: 'stocks', sub: 'industrial' },
      { key: 'ual', label: 'United Airlines', ticker: 'UAL', cat: 'stocks', sub: 'industrial' },
      { key: 'dal', label: 'Delta Air Lines', ticker: 'DAL', cat: 'stocks', sub: 'industrial' },
      { key: 'luv', label: 'Southwest Air', ticker: 'LUV', cat: 'stocks', sub: 'industrial' },
      { key: 'wr', label: 'Waste Mgmt', ticker: 'WM', cat: 'stocks', sub: 'industrial' },
      { key: 'rsp', label: 'Republic Svcs', ticker: 'RSG', cat: 'stocks', sub: 'industrial' },
      { key: 'nee', label: 'NextEra Energy', ticker: 'NEE', cat: 'stocks', sub: 'industrial' },
      { key: 'so', label: 'Southern Co', ticker: 'SO', cat: 'stocks', sub: 'industrial' },
      { key: 'duk', label: 'Duke Energy', ticker: 'DUK', cat: 'stocks', sub: 'industrial' },
      { key: 'aep', label: 'AEP', ticker: 'AEP', cat: 'stocks', sub: 'industrial' },
      { key: 'xel', label: 'Xcel Energy', ticker: 'XEL', cat: 'stocks', sub: 'industrial' },
      { key: 'etr', label: 'Entergy', ticker: 'ETR', cat: 'stocks', sub: 'industrial' },
      { key: 'pcar', label: 'PACCAR', ticker: 'PCAR', cat: 'stocks', sub: 'industrial' },
      { key: 'cummins', label: 'Cummins', ticker: 'CMI', cat: 'stocks', sub: 'industrial' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     GLOBAL INDICES (20)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'GLOBAL INDICES',
    items: [
      { key: 'ftse100', label: 'FTSE 100', ticker: 'ISF.L', cat: 'stocks', sub: 'global_idx' },
      { key: 'dax', label: 'DAX 40', ticker: 'EWG', cat: 'stocks', sub: 'global_idx' },
      { key: 'cac40', label: 'CAC 40', ticker: 'EWQ', cat: 'stocks', sub: 'global_idx' },
      { key: 'nikkei', label: 'Nikkei 225', ticker: 'EWJ', cat: 'stocks', sub: 'global_idx' },
      { key: 'hangseng', label: 'Hang Seng', ticker: 'EWH', cat: 'stocks', sub: 'global_idx' },
      { key: 'shanghai', label: 'Shanghai Comp', ticker: 'FXI', cat: 'stocks', sub: 'global_idx' },
      { key: 'sensex', label: 'BSE Sensex', ticker: 'INDA', cat: 'stocks', sub: 'global_idx' },
      { key: 'asx200', label: 'ASX 200', ticker: 'EWA', cat: 'stocks', sub: 'global_idx' },
      { key: 'tsx', label: 'TSX Composite', ticker: 'EWC', cat: 'stocks', sub: 'global_idx' },
      { key: 'bovespa', label: 'Bovespa', ticker: 'EWZ', cat: 'stocks', sub: 'global_idx' },
      { key: 'kospi', label: 'KOSPI', ticker: 'EWY', cat: 'stocks', sub: 'global_idx' },
      { key: 'taiwse', label: 'TAIEX', ticker: 'EWT', cat: 'stocks', sub: 'global_idx' },
      { key: 'stoxx50', label: 'Euro Stoxx 50', ticker: 'FEZ', cat: 'stocks', sub: 'global_idx' },
      { key: 'ibex35', label: 'IBEX 35', ticker: 'EWP', cat: 'stocks', sub: 'global_idx' },
      { key: 'mib', label: 'FTSE MIB', ticker: 'EWI', cat: 'stocks', sub: 'global_idx' },
      { key: 'smi', label: 'Swiss Market', ticker: 'EWL', cat: 'stocks', sub: 'global_idx' },
      { key: 'jse', label: 'JSE Top 40', ticker: 'EZA', cat: 'stocks', sub: 'global_idx' },
      { key: 'merval', label: 'Merval', ticker: 'ARGT', cat: 'stocks', sub: 'global_idx' },
      { key: 'bist100', label: 'BIST 100', ticker: 'TUR', cat: 'stocks', sub: 'global_idx' },
      { key: 'vix', label: 'VIX', ticker: 'VXX', cat: 'stocks', sub: 'global_idx' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     FOREX — MAJOR (15)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'FOREX — MAJOR',
    items: [
      { key: 'eurusd', label: 'EUR/USD', ticker: 'EUR/USD', cat: 'forex', sub: 'major' },
      { key: 'gbpusd', label: 'GBP/USD', ticker: 'GBP/USD', cat: 'forex', sub: 'major' },
      { key: 'usdjpy', label: 'USD/JPY', ticker: 'USD/JPY', cat: 'forex', sub: 'major' },
      { key: 'usdchf', label: 'USD/CHF', ticker: 'USD/CHF', cat: 'forex', sub: 'major' },
      { key: 'audusd', label: 'AUD/USD', ticker: 'AUD/USD', cat: 'forex', sub: 'major' },
      { key: 'usdcad', label: 'USD/CAD', ticker: 'USD/CAD', cat: 'forex', sub: 'major' },
      { key: 'nzdusd', label: 'NZD/USD', ticker: 'NZD/USD', cat: 'forex', sub: 'major' },
      { key: 'eurgbp', label: 'EUR/GBP', ticker: 'EUR/GBP', cat: 'forex', sub: 'cross' },
      { key: 'eurjpy', label: 'EUR/JPY', ticker: 'EUR/JPY', cat: 'forex', sub: 'cross' },
      { key: 'gbpjpy', label: 'GBP/JPY', ticker: 'GBP/JPY', cat: 'forex', sub: 'cross' },
      { key: 'usdmxn', label: 'USD/MXN', ticker: 'USD/MXN', cat: 'forex', sub: 'em' },
      { key: 'usdzar', label: 'USD/ZAR', ticker: 'USD/ZAR', cat: 'forex', sub: 'em' },
      { key: 'usdtry', label: 'USD/TRY', ticker: 'USD/TRY', cat: 'forex', sub: 'em' },
      { key: 'usdinr', label: 'USD/INR', ticker: 'USD/INR', cat: 'forex', sub: 'em' },
      { key: 'usdcny', label: 'USD/CNY', ticker: 'USD/CNY', cat: 'forex', sub: 'em' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     FOREX — CROSS & EXOTIC (35)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'FOREX — CROSS & EXOTIC',
    items: [
      { key: 'euraud', label: 'EUR/AUD', ticker: 'EUR/AUD', cat: 'forex', sub: 'cross' },
      { key: 'eurchf', label: 'EUR/CHF', ticker: 'EUR/CHF', cat: 'forex', sub: 'cross' },
      { key: 'eurcad', label: 'EUR/CAD', ticker: 'EUR/CAD', cat: 'forex', sub: 'cross' },
      { key: 'eurnzd', label: 'EUR/NZD', ticker: 'EUR/NZD', cat: 'forex', sub: 'cross' },
      { key: 'gbpaud', label: 'GBP/AUD', ticker: 'GBP/AUD', cat: 'forex', sub: 'cross' },
      { key: 'gbpcad', label: 'GBP/CAD', ticker: 'GBP/CAD', cat: 'forex', sub: 'cross' },
      { key: 'gbpchf', label: 'GBP/CHF', ticker: 'GBP/CHF', cat: 'forex', sub: 'cross' },
      { key: 'gbpnzd', label: 'GBP/NZD', ticker: 'GBP/NZD', cat: 'forex', sub: 'cross' },
      { key: 'audjpy', label: 'AUD/JPY', ticker: 'AUD/JPY', cat: 'forex', sub: 'cross' },
      { key: 'audcad', label: 'AUD/CAD', ticker: 'AUD/CAD', cat: 'forex', sub: 'cross' },
      { key: 'audchf', label: 'AUD/CHF', ticker: 'AUD/CHF', cat: 'forex', sub: 'cross' },
      { key: 'audnzd', label: 'AUD/NZD', ticker: 'AUD/NZD', cat: 'forex', sub: 'cross' },
      { key: 'nzdjpy', label: 'NZD/JPY', ticker: 'NZD/JPY', cat: 'forex', sub: 'cross' },
      { key: 'cadjpy', label: 'CAD/JPY', ticker: 'CAD/JPY', cat: 'forex', sub: 'cross' },
      { key: 'cadchf', label: 'CAD/CHF', ticker: 'CAD/CHF', cat: 'forex', sub: 'cross' },
      { key: 'chfjpy', label: 'CHF/JPY', ticker: 'CHF/JPY', cat: 'forex', sub: 'cross' },
      { key: 'eursek', label: 'EUR/SEK', ticker: 'EUR/SEK', cat: 'forex', sub: 'em' },
      { key: 'eurnok', label: 'EUR/NOK', ticker: 'EUR/NOK', cat: 'forex', sub: 'em' },
      { key: 'eurpln', label: 'EUR/PLN', ticker: 'EUR/PLN', cat: 'forex', sub: 'em' },
      { key: 'eurhuf', label: 'EUR/HUF', ticker: 'EUR/HUF', cat: 'forex', sub: 'em' },
      { key: 'eurczk', label: 'EUR/CZK', ticker: 'EUR/CZK', cat: 'forex', sub: 'em' },
      { key: 'usdsek', label: 'USD/SEK', ticker: 'USD/SEK', cat: 'forex', sub: 'em' },
      { key: 'usdnok', label: 'USD/NOK', ticker: 'USD/NOK', cat: 'forex', sub: 'em' },
      { key: 'usdpln', label: 'USD/PLN', ticker: 'USD/PLN', cat: 'forex', sub: 'em' },
      { key: 'usdsgd', label: 'USD/SGD', ticker: 'USD/SGD', cat: 'forex', sub: 'em' },
      { key: 'usdhkd', label: 'USD/HKD', ticker: 'USD/HKD', cat: 'forex', sub: 'em' },
      { key: 'usdthb', label: 'USD/THB', ticker: 'USD/THB', cat: 'forex', sub: 'em' },
      { key: 'usdidr', label: 'USD/IDR', ticker: 'USD/IDR', cat: 'forex', sub: 'em' },
      { key: 'usdphp', label: 'USD/PHP', ticker: 'USD/PHP', cat: 'forex', sub: 'em' },
      { key: 'usdtwd', label: 'USD/TWD', ticker: 'USD/TWD', cat: 'forex', sub: 'em' },
      { key: 'usdkrw', label: 'USD/KRW', ticker: 'USD/KRW', cat: 'forex', sub: 'em' },
      { key: 'usdars', label: 'USD/ARS', ticker: 'USD/ARS', cat: 'forex', sub: 'em' },
      { key: 'usdclp', label: 'USD/CLP', ticker: 'USD/CLP', cat: 'forex', sub: 'em' },
      { key: 'usdcop', label: 'USD/COP', ticker: 'USD/COP', cat: 'forex', sub: 'em' },
      { key: 'usdbrl', label: 'USD/BRL', ticker: 'USD/BRL', cat: 'forex', sub: 'em' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     BONDS & FIXED INCOME (20)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'BONDS & FIXED INCOME',
    items: [
      { key: 'tlt', label: '20Y Treasury', ticker: 'TLT', cat: 'bonds', sub: 'us_treasury' },
      { key: 'ief', label: '10Y Treasury', ticker: 'IEF', cat: 'bonds', sub: 'us_treasury' },
      { key: 'shy', label: '1-3Y Treasury', ticker: 'SHY', cat: 'bonds', sub: 'us_treasury' },
      { key: 'tip', label: 'TIPS Bond', ticker: 'TIP', cat: 'bonds', sub: 'us_treasury' },
      { key: 'lqd', label: 'IG Corp Bond', ticker: 'LQD', cat: 'bonds', sub: 'corporate' },
      { key: 'hyg', label: 'HY Corp Bond', ticker: 'HYG', cat: 'bonds', sub: 'corporate' },
      { key: 'bnd', label: 'Total Bond', ticker: 'BND', cat: 'bonds', sub: 'aggregate' },
      { key: 'agg', label: 'US Agg Bond', ticker: 'AGG', cat: 'bonds', sub: 'aggregate' },
      { key: 'mub', label: 'Muni Bond', ticker: 'MUB', cat: 'bonds', sub: 'muni' },
      { key: 'emb', label: 'EM Bond', ticker: 'EMB', cat: 'bonds', sub: 'em' },
      { key: 'govt', label: 'US Treasury', ticker: 'GOVT', cat: 'bonds', sub: 'us_treasury' },
      { key: 'vcsh', label: 'Short Corp', ticker: 'VCSH', cat: 'bonds', sub: 'corporate' },
      { key: 'bil', label: 'T-Bill 1-3M', ticker: 'BIL', cat: 'bonds', sub: 'us_treasury' },
      { key: 'shv', label: 'Short Treasury', ticker: 'SHV', cat: 'bonds', sub: 'us_treasury' },
      { key: 'bwx', label: 'Intl Treasury', ticker: 'BWX', cat: 'bonds', sub: 'intl' },
      { key: 'igov', label: 'Intl Govt Bond', ticker: 'IGOV', cat: 'bonds', sub: 'intl' },
      { key: 'pcY', label: 'PIMCO Pref', ticker: 'PFF', cat: 'bonds', sub: 'corporate' },
      { key: 'usig', label: 'US IG Corp', ticker: 'USIG', cat: 'bonds', sub: 'corporate' },
      { key: 'sjnk', label: 'Short HY', ticker: 'SJNK', cat: 'bonds', sub: 'corporate' },
      { key: 'vgit', label: 'IT Treasury', ticker: 'VGIT', cat: 'bonds', sub: 'us_treasury' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     AGRICULTURE (30)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'AGRICULTURE — GRAINS',
    items: [
      { key: 'corn', label: 'Corn', ticker: 'ZC', cat: 'agriculture', sub: 'grains' },
      { key: 'wheat', label: 'Wheat', ticker: 'ZW', cat: 'agriculture', sub: 'grains' },
      { key: 'soybeans', label: 'Soybeans', ticker: 'ZS', cat: 'agriculture', sub: 'grains' },
      { key: 'soy_oil', label: 'Soybean Oil', ticker: 'ZL', cat: 'agriculture', sub: 'grains' },
      { key: 'soy_meal', label: 'Soybean Meal', ticker: 'ZM', cat: 'agriculture', sub: 'grains' },
      { key: 'oats', label: 'Oats', ticker: 'ZO', cat: 'agriculture', sub: 'grains' },
      { key: 'rice', label: 'Rough Rice', ticker: 'ZR', cat: 'agriculture', sub: 'grains' },
      { key: 'canola', label: 'Canola', ticker: 'RS', cat: 'agriculture', sub: 'grains' },
    ],
  },
  {
    label: 'AGRICULTURE — SOFTS',
    items: [
      { key: 'coffee', label: 'Coffee', ticker: 'KC', cat: 'agriculture', sub: 'softs' },
      { key: 'cocoa', label: 'Cocoa', ticker: 'CC', cat: 'agriculture', sub: 'softs' },
      { key: 'sugar', label: 'Sugar', ticker: 'SB', cat: 'agriculture', sub: 'softs' },
      { key: 'cotton', label: 'Cotton', ticker: 'CT', cat: 'agriculture', sub: 'softs' },
      { key: 'orange_juice', label: 'Orange Juice', ticker: 'OJ', cat: 'agriculture', sub: 'softs' },
      { key: 'rubber', label: 'Rubber', ticker: 'TF', cat: 'agriculture', sub: 'softs' },
      { key: 'palm_oil', label: 'Palm Oil', ticker: 'FCPO', cat: 'agriculture', sub: 'softs' },
      { key: 'lumber', label: 'Lumber', ticker: 'LBS', cat: 'agriculture', sub: 'softs' },
    ],
  },
  {
    label: 'AGRICULTURE — LIVESTOCK',
    items: [
      { key: 'live_cattle', label: 'Live Cattle', ticker: 'LE', cat: 'agriculture', sub: 'livestock' },
      { key: 'feeder_cattle', label: 'Feeder Cattle', ticker: 'GF', cat: 'agriculture', sub: 'livestock' },
      { key: 'lean_hogs', label: 'Lean Hogs', ticker: 'HE', cat: 'agriculture', sub: 'livestock' },
      { key: 'class3_milk', label: 'Class III Milk', ticker: 'DC', cat: 'agriculture', sub: 'livestock' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     RARE EARTH & CRITICAL MINERALS (12)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'RARE EARTH & CRITICAL MINERALS',
    items: [
      { key: 'lithium', label: 'Lithium', ticker: 'LIT', cat: 'minerals', sub: 'battery' },
      { key: 'neodymium', label: 'Neodymium', ticker: 'NdPr', cat: 'minerals', sub: 'rare_earth' },
      { key: 'dysprosium', label: 'Dysprosium', ticker: 'Dy', cat: 'minerals', sub: 'rare_earth' },
      { key: 'graphite', label: 'Graphite', ticker: 'GRPH', cat: 'minerals', sub: 'battery' },
      { key: 'manganese', label: 'Manganese', ticker: 'MN', cat: 'minerals', sub: 'battery' },
      { key: 'vanadium', label: 'Vanadium', ticker: 'VAN', cat: 'minerals', sub: 'battery' },
      { key: 'gallium', label: 'Gallium', ticker: 'GA', cat: 'minerals', sub: 'semiconductor' },
      { key: 'germanium', label: 'Germanium', ticker: 'GE_MIN', cat: 'minerals', sub: 'semiconductor' },
      { key: 'tungsten', label: 'Tungsten', ticker: 'W', cat: 'minerals', sub: 'industrial_min' },
      { key: 'molybdenum', label: 'Molybdenum', ticker: 'MO', cat: 'minerals', sub: 'industrial_min' },
      { key: 'titanium', label: 'Titanium', ticker: 'TI', cat: 'minerals', sub: 'industrial_min' },
      { key: 'tellurium', label: 'Tellurium', ticker: 'TE', cat: 'minerals', sub: 'semiconductor' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     REITS (15)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'REITS',
    items: [
      { key: 'amt', label: 'American Tower', ticker: 'AMT', cat: 'reits', sub: 'tower' },
      { key: 'pld', label: 'Prologis', ticker: 'PLD', cat: 'reits', sub: 'industrial_reit' },
      { key: 'eqr', label: 'Equity Residential', ticker: 'EQR', cat: 'reits', sub: 'residential' },
      { key: 'avb', label: 'AvalonBay', ticker: 'AVB', cat: 'reits', sub: 'residential' },
      { key: 'o_reit', label: 'Realty Income', ticker: 'O', cat: 'reits', sub: 'retail' },
      { key: 'spg', label: 'Simon Property', ticker: 'SPG', cat: 'reits', sub: 'retail' },
      { key: 'dlr', label: 'Digital Realty', ticker: 'DLR', cat: 'reits', sub: 'data_center' },
      { key: 'eqix', label: 'Equinix', ticker: 'EQIX', cat: 'reits', sub: 'data_center' },
      { key: 'well', label: 'Welltower', ticker: 'WELL', cat: 'reits', sub: 'healthcare_reit' },
      { key: 'vnq', label: 'Vanguard REIT', ticker: 'VNQ', cat: 'reits', sub: 'diversified' },
      { key: 'xlre', label: 'Real Estate ETF', ticker: 'XLRE', cat: 'reits', sub: 'diversified' },
      { key: 'cci', label: 'Crown Castle', ticker: 'CCI', cat: 'reits', sub: 'tower' },
      { key: 'sbac_reit', label: 'SBA Comm', ticker: 'SBAC', cat: 'reits', sub: 'tower' },
      { key: 'are', label: 'Alexandria REIT', ticker: 'ARE', cat: 'reits', sub: 'office' },
      { key: 'bxp', label: 'BXP Inc', ticker: 'BXP', cat: 'reits', sub: 'office' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     ETFs & INDEX FUNDS (20)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'ETFS & INDEX FUNDS',
    items: [
      { key: 'spy_etf', label: 'SPDR S&P 500', ticker: 'SPY', cat: 'etfs', sub: 'equity_etf' },
      { key: 'voo', label: 'Vanguard S&P', ticker: 'VOO', cat: 'etfs', sub: 'equity_etf' },
      { key: 'ivv', label: 'iShares S&P', ticker: 'IVV', cat: 'etfs', sub: 'equity_etf' },
      { key: 'vti', label: 'Total Stock Mkt', ticker: 'VTI', cat: 'etfs', sub: 'equity_etf' },
      { key: 'vxus', label: 'Total Intl Stock', ticker: 'VXUS', cat: 'etfs', sub: 'equity_etf' },
      { key: 'eem', label: 'EM Markets', ticker: 'EEM', cat: 'etfs', sub: 'equity_etf' },
      { key: 'vea', label: 'Developed Mkts', ticker: 'VEA', cat: 'etfs', sub: 'equity_etf' },
      { key: 'iau', label: 'iShares Gold', ticker: 'IAU', cat: 'etfs', sub: 'commodity_etf' },
      { key: 'slv_etf', label: 'iShares Silver', ticker: 'SLV', cat: 'etfs', sub: 'commodity_etf' },
      { key: 'uso', label: 'US Oil Fund', ticker: 'USO', cat: 'etfs', sub: 'commodity_etf' },
      { key: 'dba', label: 'Agriculture ETF', ticker: 'DBA', cat: 'etfs', sub: 'commodity_etf' },
      { key: 'arkk', label: 'ARK Innovation', ticker: 'ARKK', cat: 'etfs', sub: 'thematic' },
      { key: 'arkw', label: 'ARK Web', ticker: 'ARKW', cat: 'etfs', sub: 'thematic' },
      { key: 'icln', label: 'Clean Energy', ticker: 'ICLN', cat: 'etfs', sub: 'thematic' },
      { key: 'tan', label: 'Solar ETF', ticker: 'TAN', cat: 'etfs', sub: 'thematic' },
      { key: 'kweb', label: 'China Internet', ticker: 'KWEB', cat: 'etfs', sub: 'thematic' },
      { key: 'bitq', label: 'Crypto Industry', ticker: 'BITQ', cat: 'etfs', sub: 'thematic' },
      { key: 'ibit', label: 'iShares Bitcoin', ticker: 'IBIT', cat: 'etfs', sub: 'thematic' },
      { key: 'etha', label: 'iShares Ether', ticker: 'ETHA', cat: 'etfs', sub: 'thematic' },
    ],
  },
  /* ══════════════════════════════════════════════════════════
     SEMICONDUCTORS (15)
     ══════════════════════════════════════════════════════════ */
  {
    label: 'SEMICONDUCTORS',
    items: [
      { key: 'tsm', label: 'TSMC', ticker: 'TSM', cat: 'stocks', sub: 'semis' },
      { key: 'asml', label: 'ASML', ticker: 'ASML', cat: 'stocks', sub: 'semis' },
      { key: 'qcom', label: 'Qualcomm', ticker: 'QCOM', cat: 'stocks', sub: 'semis' },
      { key: 'txn', label: 'Texas Instruments', ticker: 'TXN', cat: 'stocks', sub: 'semis' },
      { key: 'mrvl', label: 'Marvell Tech', ticker: 'MRVL', cat: 'stocks', sub: 'semis' },
      { key: 'mu', label: 'Micron', ticker: 'MU', cat: 'stocks', sub: 'semis' },
      { key: 'on', label: 'ON Semi', ticker: 'ON', cat: 'stocks', sub: 'semis' },
      { key: 'klac', label: 'KLA Corp', ticker: 'KLAC', cat: 'stocks', sub: 'semis' },
      { key: 'lrcx', label: 'Lam Research', ticker: 'LRCX', cat: 'stocks', sub: 'semis' },
      { key: 'amat', label: 'Applied Materials', ticker: 'AMAT', cat: 'stocks', sub: 'semis' },
      { key: 'arm', label: 'ARM Holdings', ticker: 'ARM', cat: 'stocks', sub: 'semis' },
      { key: 'smci', label: 'Super Micro', ticker: 'SMCI', cat: 'stocks', sub: 'semis' },
      { key: 'soxx', label: 'Semi ETF', ticker: 'SOXX', cat: 'stocks', sub: 'semis' },
      { key: 'snps', label: 'Synopsys', ticker: 'SNPS', cat: 'stocks', sub: 'semis' },
      { key: 'cdns', label: 'Cadence', ticker: 'CDNS', cat: 'stocks', sub: 'semis' },
    ],
  },
];

export const ALL_SYMBOLS = WATCHLIST_CATEGORIES.flatMap((c) => c.items);

/** Total number of instruments — EXACT, DETERMINISTIC count */
export const TOTAL_INSTRUMENT_COUNT = ALL_SYMBOLS.length;

// ─── Symbols with REAL live price feeds (no synthetic data) ───
export const REAL_FEED_CATEGORIES = new Set(['crypto', 'metals', 'energy']);
export const REAL_FEED_SYMBOLS = ALL_SYMBOLS.filter(s => REAL_FEED_CATEGORIES.has(s.cat));

// ─── Comprehensive synthetic price map ───────────────────
// WARNING: These are STATIC approximations for DISPLAY ONLY on symbols without live feeds.

export const SYNTHETIC_PRICES: Record<string, { p: number; c: number }> = {
  // Metals — precious
  palladium: { p: 985, c: -0.45 }, rhodium: { p: 4850, c: 0.22 }, iridium: { p: 4200, c: 0.15 },
  ruthenium: { p: 450, c: -0.12 }, osmium: { p: 400, c: 0.08 },
  // Metals — industrial
  aluminum: { p: 2340, c: 0.32 }, zinc: { p: 2680, c: -0.18 }, nickel: { p: 16200, c: 0.55 },
  tin: { p: 28500, c: 0.42 }, lead: { p: 2150, c: -0.22 }, cobalt: { p: 28000, c: -0.85 },
  // Energy (some don't have EIA feeds)
  heating_oil: { p: 2.385, c: -0.41 }, coal: { p: 135, c: 0.8 }, uranium: { p: 92, c: 1.2 }, ethanol: { p: 2.15, c: -0.3 },
  lpg: { p: 0.72, c: 0.15 }, jet_fuel: { p: 2.65, c: -0.28 }, diesel: { p: 2.48, c: -0.18 },
  carbon_eu: { p: 68, c: 1.4 }, carbon_us: { p: 32, c: 0.8 }, hydrogen: { p: 5.2, c: -0.5 }, lng: { p: 12.5, c: 0.35 },
  // Oil & Gas Companies
  cop: { p: 108, c: -0.32 }, eog: { p: 125, c: 0.15 }, slb: { p: 42, c: -0.55 },
  hal: { p: 31, c: -0.42 }, bp: { p: 34, c: -0.22 }, shel: { p: 68, c: 0.12 },
  tte: { p: 62, c: -0.15 }, oxy: { p: 52, c: 0.38 }, psx: { p: 142, c: 0.22 },
  mpc: { p: 158, c: 0.45 }, vlo: { p: 145, c: -0.18 }, dvn: { p: 38, c: -0.62 },
  fang: { p: 168, c: 0.55 }, eni: { p: 14, c: -0.18 }, eqnr: { p: 26, c: 0.32 },
  cnq: { p: 32, c: -0.15 }, su: { p: 28, c: 0.22 }, pba: { p: 38, c: 0.12 },
  wds: { p: 18, c: -0.35 }, ptr: { p: 48, c: 0.08 }, snp: { p: 52, c: 0.15 },
  pBr: { p: 14, c: -0.42 }, ec: { p: 9, c: -0.85 },
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
  twlo: { p: 68, c: 0.42 }, ddog: { p: 128, c: 0.85 }, crwd: { p: 345, c: 1.22 },
  zs: { p: 218, c: 0.65 }, net: { p: 92, c: 1.45 }, mdb: { p: 285, c: -0.55 },
  okta: { p: 98, c: 0.32 }, panw: { p: 325, c: 0.78 }, ftnt: { p: 82, c: 0.48 },
  now: { p: 885, c: 0.65 },
  // O&G companies already above
  xom: { p: 115, c: -0.18 }, cvx: { p: 162, c: -0.12 },
  // Financials & Mining
  gs: { p: 545, c: 0.42 }, ms: { p: 108, c: 0.28 }, bac: { p: 42, c: 0.15 },
  c: { p: 68, c: 0.22 }, wfc: { p: 62, c: 0.18 },
  nem: { p: 42, c: 1.8 }, gold_stock: { p: 18, c: 2.2 }, fmg: { p: 128, c: 1.5 },
  rio: { p: 68, c: 0.85 }, bhp: { p: 58, c: 0.62 }, vale: { p: 11, c: -0.55 },
  schw: { p: 72, c: 0.28 }, aig: { p: 78, c: 0.12 }, met: { p: 75, c: 0.22 },
  pru: { p: 118, c: 0.15 }, bx: { p: 148, c: 0.85 }, kkr: { p: 112, c: 0.72 },
  aem: { p: 62, c: 1.42 }, wpm: { p: 55, c: 1.85 }, aa: { p: 32, c: -0.45 },
  // Healthcare
  lly: { p: 785, c: 0.92 }, jnj: { p: 158, c: 0.12 }, pfe: { p: 28, c: -0.42 },
  mrk: { p: 128, c: 0.22 }, abbv: { p: 178, c: 0.35 }, amgn: { p: 285, c: 0.18 },
  gild: { p: 82, c: 0.28 }, bmy: { p: 52, c: -0.15 }, mdT: { p: 82, c: 0.08 },
  isrg: { p: 425, c: 0.55 }, tmo: { p: 545, c: 0.32 }, dhr: { p: 248, c: 0.22 },
  abt: { p: 112, c: 0.15 }, syk: { p: 345, c: 0.42 }, bsx: { p: 78, c: 0.35 },
  regn: { p: 885, c: 0.28 }, vrtx: { p: 445, c: 0.55 }, biib: { p: 218, c: -0.32 },
  hum: { p: 345, c: -0.42 }, ci: { p: 318, c: 0.22 }, elv: { p: 425, c: 0.15 },
  cvs_stock: { p: 68, c: -0.28 }, mrna: { p: 98, c: 1.85 }, nvo: { p: 128, c: 0.72 },
  azn: { p: 72, c: 0.35 },
  // Consumer
  wmt: { p: 168, c: 0.15 }, cost: { p: 745, c: 0.22 }, hd: { p: 378, c: 0.28 },
  low: { p: 245, c: 0.18 }, tgt: { p: 142, c: -0.22 }, ko: { p: 62, c: 0.08 },
  pep: { p: 168, c: 0.12 }, pg: { p: 165, c: 0.15 }, cl: { p: 92, c: 0.08 },
  mcd: { p: 285, c: 0.22 }, sbux: { p: 98, c: -0.15 }, nke: { p: 78, c: -0.42 },
  dis: { p: 108, c: 0.32 }, cmcsa: { p: 42, c: 0.12 }, pypl: { p: 72, c: 0.55 },
  ma: { p: 475, c: 0.35 }, tmo_consumer: { p: 168, c: 0.42 }, vz: { p: 42, c: 0.08 },
  att: { p: 18, c: 0.05 }, lvmh: { p: 168, c: -0.22 }, ul: { p: 52, c: 0.12 },
  nsrgy: { p: 108, c: 0.08 }, elf: { p: 118, c: 1.85 }, lulu: { p: 385, c: -0.42 },
  rost: { p: 148, c: 0.22 },
  // Industrial & Defense
  lmt: { p: 485, c: 0.22 }, rtx: { p: 108, c: 0.15 }, ba: { p: 178, c: -0.55 },
  gd: { p: 285, c: 0.18 }, noc: { p: 478, c: 0.22 }, cat: { p: 345, c: 0.32 },
  de: { p: 378, c: -0.18 }, hon: { p: 198, c: 0.12 }, ge: { p: 168, c: 0.42 },
  mmm: { p: 128, c: -0.22 }, ups: { p: 142, c: -0.15 }, fdx: { p: 268, c: 0.28 },
  ual: { p: 72, c: 0.85 }, dal: { p: 52, c: 0.62 }, luv: { p: 28, c: -0.42 },
  wr: { p: 198, c: 0.12 }, rsp: { p: 185, c: 0.15 }, nee: { p: 72, c: 0.22 },
  so: { p: 82, c: 0.08 }, duk: { p: 108, c: 0.12 }, aep: { p: 98, c: 0.08 },
  xel: { p: 62, c: 0.05 }, etr: { p: 118, c: 0.12 }, pcar: { p: 98, c: 0.22 },
  cummins: { p: 285, c: 0.15 },
  // Global Indices
  ftse100: { p: 48, c: 0.18 }, dax: { p: 32, c: 0.22 }, cac40: { p: 35, c: 0.15 },
  nikkei: { p: 68, c: 0.42 }, hangseng: { p: 22, c: -0.35 }, shanghai: { p: 28, c: 0.12 },
  sensex: { p: 52, c: 0.55 }, asx200: { p: 28, c: 0.22 }, tsx: { p: 38, c: 0.18 },
  bovespa: { p: 32, c: -0.42 }, kospi: { p: 62, c: 0.35 }, taiwse: { p: 58, c: 0.48 },
  stoxx50: { p: 52, c: 0.22 }, ibex35: { p: 32, c: 0.15 }, mib: { p: 35, c: 0.18 },
  smi: { p: 45, c: 0.12 }, jse: { p: 58, c: 0.32 }, merval: { p: 18, c: 1.85 },
  bist100: { p: 28, c: 0.42 }, vix: { p: 16, c: -2.5 },
  // Forex
  eurusd: { p: 1.0845, c: 0.12 }, gbpusd: { p: 1.2685, c: -0.08 },
  usdjpy: { p: 152.35, c: 0.22 }, usdchf: { p: 0.8825, c: -0.15 },
  audusd: { p: 0.6545, c: 0.18 }, usdcad: { p: 1.3575, c: -0.05 },
  nzdusd: { p: 0.6125, c: 0.25 }, eurgbp: { p: 0.8548, c: 0.08 },
  eurjpy: { p: 165.22, c: 0.35 }, gbpjpy: { p: 193.15, c: 0.28 },
  usdmxn: { p: 17.25, c: -0.32 }, usdzar: { p: 18.45, c: 0.55 },
  usdtry: { p: 32.85, c: 0.42 }, usdinr: { p: 83.25, c: 0.08 },
  usdcny: { p: 7.225, c: -0.05 },
  // Forex cross & exotic
  euraud: { p: 1.658, c: 0.12 }, eurchf: { p: 0.9575, c: -0.08 }, eurcad: { p: 1.472, c: 0.05 },
  eurnzd: { p: 1.772, c: 0.15 }, gbpaud: { p: 1.938, c: 0.08 }, gbpcad: { p: 1.722, c: -0.05 },
  gbpchf: { p: 1.12, c: 0.12 }, gbpnzd: { p: 2.072, c: 0.18 }, audjpy: { p: 99.65, c: 0.22 },
  audcad: { p: 0.888, c: 0.05 }, audchf: { p: 0.578, c: -0.08 }, audnzd: { p: 1.069, c: 0.05 },
  nzdjpy: { p: 93.25, c: 0.18 }, cadjpy: { p: 112.15, c: 0.15 }, cadchf: { p: 0.65, c: -0.05 },
  chfjpy: { p: 172.55, c: 0.12 }, eursek: { p: 11.42, c: 0.08 }, eurnok: { p: 11.68, c: 0.12 },
  eurpln: { p: 4.32, c: -0.15 }, eurhuf: { p: 392.5, c: 0.22 }, eurczk: { p: 25.18, c: 0.05 },
  usdsek: { p: 10.52, c: 0.15 }, usdnok: { p: 10.78, c: 0.18 }, usdpln: { p: 3.98, c: -0.08 },
  usdsgd: { p: 1.342, c: 0.05 }, usdhkd: { p: 7.812, c: 0.01 }, usdthb: { p: 35.65, c: 0.08 },
  usdidr: { p: 15850, c: 0.12 }, usdphp: { p: 56.75, c: 0.08 }, usdtwd: { p: 31.85, c: 0.05 },
  usdkrw: { p: 1345, c: 0.15 }, usdars: { p: 885, c: 0.55 }, usdclp: { p: 925, c: -0.22 },
  usdcop: { p: 3985, c: -0.15 }, usdbrl: { p: 4.98, c: -0.32 },
  // Bonds
  tlt: { p: 92, c: 0.08 }, ief: { p: 96, c: 0.05 }, shy: { p: 82, c: 0.02 },
  tip: { p: 108, c: 0.06 }, lqd: { p: 110, c: 0.06 }, hyg: { p: 78, c: -0.04 },
  bnd: { p: 72, c: 0.03 }, agg: { p: 100, c: 0.04 }, mub: { p: 108, c: 0.02 },
  emb: { p: 88, c: -0.12 }, govt: { p: 24, c: 0.01 }, vcsh: { p: 78, c: 0.02 },
  bil: { p: 91.5, c: 0.01 }, shv: { p: 110, c: 0.01 }, bwx: { p: 25, c: -0.05 },
  igov: { p: 42, c: -0.03 }, pcY: { p: 32, c: 0.02 }, usig: { p: 52, c: 0.04 },
  sjnk: { p: 25, c: -0.02 }, vgit: { p: 60, c: 0.03 },
  // Agriculture
  corn: { p: 4.52, c: -0.22 }, wheat: { p: 5.85, c: 0.42 }, soybeans: { p: 11.25, c: 0.18 },
  soy_oil: { p: 0.445, c: 0.28 }, soy_meal: { p: 325, c: -0.15 }, oats: { p: 3.82, c: -0.35 },
  rice: { p: 17.85, c: 0.12 }, canola: { p: 648, c: 0.08 },
  coffee: { p: 2.45, c: 1.85 }, cocoa: { p: 8250, c: -0.55 }, sugar: { p: 0.218, c: 0.42 },
  cotton: { p: 0.785, c: -0.18 }, orange_juice: { p: 4.85, c: 0.92 }, rubber: { p: 1.68, c: 0.15 },
  palm_oil: { p: 3850, c: 0.22 }, lumber: { p: 485, c: -0.42 },
  live_cattle: { p: 1.825, c: 0.15 }, feeder_cattle: { p: 2.45, c: 0.22 },
  lean_hogs: { p: 0.885, c: -0.32 }, class3_milk: { p: 18.25, c: 0.08 },
  // Rare Earth
  lithium: { p: 42, c: -1.2 }, neodymium: { p: 72, c: 0.85 }, dysprosium: { p: 38, c: 0.42 },
  graphite: { p: 550, c: -0.15 }, manganese: { p: 1850, c: 0.22 }, vanadium: { p: 28, c: -0.35 },
  gallium: { p: 285, c: 0.55 }, germanium: { p: 1450, c: 0.32 }, tungsten: { p: 285, c: 0.18 },
  molybdenum: { p: 42, c: 0.42 }, titanium: { p: 12500, c: 0.12 }, tellurium: { p: 85, c: -0.22 },
  // REITs
  amt: { p: 218, c: 0.32 }, pld: { p: 128, c: 0.22 }, eqr: { p: 72, c: 0.15 },
  avb: { p: 215, c: 0.18 }, o_reit: { p: 58, c: 0.08 }, spg: { p: 158, c: 0.35 },
  dlr: { p: 148, c: 0.42 }, eqix: { p: 845, c: 0.28 }, well: { p: 108, c: 0.22 },
  vnq: { p: 88, c: 0.12 }, xlre: { p: 42, c: 0.08 }, cci: { p: 108, c: 0.15 },
  sbac_reit: { p: 225, c: 0.22 }, are: { p: 118, c: -0.15 }, bxp: { p: 68, c: -0.22 },
  // ETFs
  spy_etf: { p: 592, c: 0.35 }, voo: { p: 545, c: 0.35 }, ivv: { p: 594, c: 0.35 },
  vti: { p: 268, c: 0.32 }, vxus: { p: 58, c: 0.22 }, eem: { p: 42, c: 0.18 },
  vea: { p: 48, c: 0.15 }, gld_etf: { p: 218, c: 0.42 }, iau: { p: 42, c: 0.42 },
  slv_etf: { p: 28, c: 0.55 }, uso: { p: 72, c: -0.18 }, dba: { p: 25, c: 0.12 },
  arkk: { p: 48, c: 1.45 }, arkw: { p: 78, c: 1.22 }, icln: { p: 14, c: 0.35 },
  tan: { p: 42, c: 0.55 }, kweb: { p: 28, c: -0.42 }, bitq: { p: 12, c: 2.85 },
  ibit: { p: 52, c: 2.15 }, etha: { p: 28, c: 1.85 },
  // Crypto — new alts
  kaspa: { p: 0.12, c: 2.5 }, sei: { p: 0.42, c: 1.85 }, celestia: { p: 8.5, c: 1.42 },
  stacks: { p: 1.85, c: 0.92 }, mantle: { p: 0.72, c: 0.55 }, immutablex: { p: 1.45, c: 0.85 },
  gala: { p: 0.025, c: -1.2 }, axie: { p: 7.5, c: -0.42 }, sandbox: { p: 0.42, c: -0.55 },
  decentraland: { p: 0.38, c: -0.65 }, enjin: { p: 0.28, c: 0.42 }, theta: { p: 1.15, c: 0.55 },
  aave: { p: 92, c: 1.22 }, maker: { p: 1450, c: 0.85 }, compound: { p: 52, c: 0.42 },
  curve: { p: 0.55, c: -0.22 }, lido: { p: 1.85, c: 0.65 }, rocketpool: { p: 28, c: 0.42 },
  pendle: { p: 4.85, c: 2.15 }, jupiter: { p: 0.92, c: 1.55 }, raydium: { p: 1.85, c: 2.42 },
  ondo: { p: 1.22, c: 1.85 }, worldcoin: { p: 2.45, c: 0.55 }, floki: { p: 0.00018, c: 1.22 },
  bonk: { p: 0.000022, c: -0.85 }, wif: { p: 2.15, c: -1.42 }, fetch: { p: 1.55, c: 1.85 },
  ocean: { p: 0.85, c: 0.42 }, singularity: { p: 0.72, c: 0.55 }, bittensor: { p: 425, c: 2.85 },
  akash: { p: 3.85, c: 1.42 }, arweave: { p: 18, c: 0.92 }, vechain: { p: 0.035, c: 0.42 },
  quant: { p: 108, c: 0.55 }, algorand: { p: 0.18, c: -0.22 }, flow: { p: 0.72, c: 0.35 },
  mina: { p: 0.58, c: -0.15 }, zcash: { p: 28, c: 0.42 }, monero: { p: 168, c: 0.22 },
  dash: { p: 28, c: -0.18 }, iota: { p: 0.22, c: 0.35 }, eos: { p: 0.78, c: -0.42 },
  neo: { p: 12, c: 0.55 }, zilliqa: { p: 0.018, c: -0.22 },
  // Stablecoins
  tether: { p: 1.0, c: 0.0 }, usdc: { p: 1.0, c: 0.0 }, dai: { p: 1.0, c: 0.01 },
  frax: { p: 1.0, c: -0.01 }, tusd: { p: 1.0, c: 0.0 }, paxg: { p: 2380, c: 0.42 },
  wbtc: { p: 68500, c: 1.85 }, weth: { p: 3450, c: 1.42 }, steth: { p: 3445, c: 1.38 },
  cbeth: { p: 3680, c: 1.45 },
  // Semiconductors
  tsm: { p: 168, c: 0.85 }, asml: { p: 885, c: 0.55 }, qcom: { p: 168, c: 0.42 },
  txn: { p: 178, c: 0.22 }, mrvl: { p: 72, c: 1.22 }, mu: { p: 92, c: 0.85 },
  on: { p: 68, c: 0.42 }, klac: { p: 685, c: 0.55 }, lrcx: { p: 785, c: 0.65 },
  amat: { p: 198, c: 0.72 }, arm: { p: 145, c: 1.85 }, smci: { p: 42, c: -2.5 },
  soxx: { p: 228, c: 0.75 }, snps: { p: 525, c: 0.42 }, cdns: { p: 285, c: 0.55 },
};

// Category color map
export const CATEGORY_COLORS: Record<string, string> = {
  metals: 'hsl(43, 72%, 50%)',
  crypto: 'hsl(38, 92%, 50%)',
  energy: 'hsl(25, 95%, 53%)',
  stocks: 'hsl(217, 91%, 60%)',
  bonds: 'hsl(210, 6%, 67%)',
  forex: 'hsl(170, 70%, 50%)',
  agriculture: 'hsl(120, 55%, 45%)',
  minerals: 'hsl(280, 60%, 55%)',
  reits: 'hsl(340, 65%, 50%)',
  etfs: 'hsl(200, 80%, 55%)',
};
