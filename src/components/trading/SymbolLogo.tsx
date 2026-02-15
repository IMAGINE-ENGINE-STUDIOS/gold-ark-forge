import { useMemo } from 'react';

// ─── Crypto logos from CoinGecko CDN ─────────────────────
const CRYPTO_LOGO_IDS: Record<string, { id: number; img: string }> = {
  bitcoin: { id: 1, img: 'bitcoin' },
  ethereum: { id: 279, img: 'ethereum' },
  solana: { id: 4128, img: 'solana' },
  xrp: { id: 44, img: 'xrp' },
  bnb: { id: 825, img: 'bnb' },
  cardano: { id: 975, img: 'cardano' },
  avalanche: { id: 12559, img: 'avalanche-2' },
  polkadot: { id: 12171, img: 'polkadot' },
  chainlink: { id: 877, img: 'chainlink' },
  dogecoin: { id: 5, img: 'dogecoin' },
  polygon: { id: 4713, img: 'matic-network' },
  litecoin: { id: 2, img: 'litecoin' },
  uniswap: { id: 12504, img: 'uniswap' },
  near: { id: 10365, img: 'near' },
  aptos: { id: 26455, img: 'aptos' },
  sui: { id: 26375, img: 'sui' },
  arbitrum: { id: 16547, img: 'arbitrum' },
  optimism: { id: 25244, img: 'optimism' },
  injective: { id: 12882, img: 'injective-protocol' },
  render: { id: 11636, img: 'render-token' },
  filecoin: { id: 12817, img: 'filecoin' },
  cosmos: { id: 1481, img: 'cosmos' },
  stellar: { id: 100, img: 'stellar' },
  hedera: { id: 3688, img: 'hedera-hashgraph' },
  tron: { id: 1094, img: 'tron' },
  shiba: { id: 11939, img: 'shiba-inu' },
  pepe: { id: 29850, img: 'pepe' },
  algorand: { id: 4030, img: 'algorand' },
  vechain: { id: 1104, img: 'vechain' },
  fantom: { id: 4001, img: 'fantom' },
};

const getCryptoLogoUrl = (key: string): string | null => {
  const info = CRYPTO_LOGO_IDS[key];
  if (!info) return null;
  return `https://assets.coingecko.com/coins/images/${info.id}/small/${info.img}.png`;
};

// ─── Stock / ETF / Company domain map for Clearbit logos ──
const STOCK_DOMAINS: Record<string, string> = {
  // Oil & Gas
  xom: 'exxonmobil.com', cvx: 'chevron.com', cop: 'conocophillips.com',
  eog: 'eogresources.com', slb: 'slb.com', hal: 'halliburton.com',
  bp: 'bp.com', shel: 'shell.com', tte: 'totalenergies.com',
  oxy: 'oxy.com', psx: 'phillips66.com', mpc: 'marathonpetroleum.com',
  vlo: 'valero.com', dvn: 'devonenergy.com', fang: 'diamondbackenergy.com',
  // Indices & Mega Cap
  sp500: 'spglobal.com', nasdaq: 'nasdaq.com', dow: 'dowjones.com',
  russell: 'ftserussell.com',
  aapl: 'apple.com', msft: 'microsoft.com', nvda: 'nvidia.com',
  googl: 'google.com', amzn: 'amazon.com', meta: 'meta.com',
  tsla: 'tesla.com', brk: 'berkshirehathaway.com', jpm: 'jpmorganchase.com',
  v: 'visa.com', unh: 'unitedhealthgroup.com',
  // Tech & Growth
  crm: 'salesforce.com', adbe: 'adobe.com', nflx: 'netflix.com',
  amd: 'amd.com', intc: 'intel.com', avgo: 'broadcom.com',
  csco: 'cisco.com', orcl: 'oracle.com', snow: 'snowflake.com',
  pltr: 'palantir.com', coin: 'coinbase.com', sq: 'block.xyz',
  shop: 'shopify.com', uber: 'uber.com', abnb: 'airbnb.com',
  // Financials & Mining
  gs: 'goldmansachs.com', ms: 'morganstanley.com', bac: 'bankofamerica.com',
  c: 'citigroup.com', wfc: 'wellsfargo.com',
  nem: 'newmont.com', gold_stock: 'barrick.com', fmg: 'franco-nevada.com',
  rio: 'riotinto.com', bhp: 'bhp.com', vale: 'vale.com',
  // Bonds / ETFs (provider logos)
  tlt: 'ishares.com', ief: 'ishares.com', shy: 'ishares.com',
  tip: 'ishares.com', lqd: 'ishares.com', hyg: 'ishares.com',
  agg: 'ishares.com', mub: 'ishares.com', emb: 'ishares.com',
  bnd: 'vanguard.com', govt: 'ishares.com', vcsh: 'vanguard.com',
  // Energy commodities (use related ETF/company logos)
  oil: 'cmegroup.com', brent: 'theice.com', natgas: 'cmegroup.com',
  rbob: 'cmegroup.com', heating_oil: 'cmegroup.com', coal: 'cmegroup.com',
  uranium: 'globalxetfs.com', ethanol: 'cmegroup.com',
};

// ─── Forex flag codes for flagcdn.com ─────────────────────
const FOREX_FLAG_MAP: Record<string, [string, string]> = {
  eurusd: ['eu', 'us'], gbpusd: ['gb', 'us'], usdjpy: ['us', 'jp'],
  usdchf: ['us', 'ch'], audusd: ['au', 'us'], usdcad: ['us', 'ca'],
  nzdusd: ['nz', 'us'], eurgbp: ['eu', 'gb'], eurjpy: ['eu', 'jp'],
  gbpjpy: ['gb', 'jp'], usdmxn: ['us', 'mx'], usdzar: ['us', 'za'],
  usdtry: ['us', 'tr'], usdinr: ['us', 'in'], usdcny: ['us', 'cn'],
};

// ─── Metal icon URLs (commodity-specific from public sources) ──
const METAL_ICONS: Record<string, string> = {
  gold: 'https://logo.clearbit.com/gold.org',
  silver: 'https://logo.clearbit.com/silverinstitute.org',
  platinum: 'https://logo.clearbit.com/platinuminvestment.com',
  palladium: 'https://logo.clearbit.com/platinuminvestment.com',
  copper: 'https://logo.clearbit.com/copper.org',
};

// Category badge colors (fallback)
const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  metals: { bg: 'hsl(43,72%,50%)', text: 'hsl(213,32%,12%)' },
  crypto: { bg: 'hsl(38,92%,50%)', text: 'hsl(213,32%,12%)' },
  energy: { bg: 'hsl(25,95%,53%)', text: 'hsl(0,0%,100%)' },
  stocks: { bg: 'hsl(217,91%,60%)', text: 'hsl(0,0%,100%)' },
  bonds: { bg: 'hsl(210,6%,67%)', text: 'hsl(213,32%,12%)' },
  forex: { bg: 'hsl(170,70%,50%)', text: 'hsl(213,32%,12%)' },
};

interface SymbolLogoProps {
  symbolKey: string;
  category: string;
  ticker: string;
  size?: number;
  className?: string;
}

const SymbolLogo = ({ symbolKey, category, ticker, size = 20, className = '' }: SymbolLogoProps) => {
  const content = useMemo(() => {
    // Crypto: CoinGecko CDN
    if (category === 'crypto') {
      const url = getCryptoLogoUrl(symbolKey);
      if (url) return { type: 'image' as const, url };
    }
    // Forex: dual flag badges from flagcdn
    if (category === 'forex' && FOREX_FLAG_MAP[symbolKey]) {
      const [base, quote] = FOREX_FLAG_MAP[symbolKey];
      return {
        type: 'forex' as const,
        baseFlag: `https://flagcdn.com/w40/${base}.png`,
        quoteFlag: `https://flagcdn.com/w40/${quote}.png`,
      };
    }
    // Metals: use commodity org logos
    if (category === 'metals' && METAL_ICONS[symbolKey]) {
      return { type: 'image' as const, url: METAL_ICONS[symbolKey] };
    }
    // Stocks, bonds, energy, indices: Clearbit logo
    const domain = STOCK_DOMAINS[symbolKey];
    if (domain) {
      return { type: 'image' as const, url: `https://logo.clearbit.com/${domain}` };
    }
    // Fallback: colored badge with ticker initials
    const initials = ticker.slice(0, 2).toUpperCase();
    const colors = BADGE_COLORS[category] ?? BADGE_COLORS.stocks;
    return { type: 'badge' as const, initials, ...colors };
  }, [symbolKey, category, ticker]);

  const s = size;
  const fallbackBadge = useMemo(() => {
    const initials = ticker.slice(0, 2).toUpperCase();
    const colors = BADGE_COLORS[category] ?? BADGE_COLORS.stocks;
    return { initials, ...colors };
  }, [ticker, category]);

  if (content.type === 'forex') {
    return (
      <span className={`relative inline-flex items-center ${className}`} style={{ width: s * 1.4, height: s }}>
        <img
          src={content.baseFlag}
          alt="base"
          className="rounded-sm absolute left-0 top-0 z-[1] border border-navy/50"
          style={{ width: s * 0.75, height: s * 0.55, objectFit: 'cover' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <img
          src={content.quoteFlag}
          alt="quote"
          className="rounded-sm absolute right-0 bottom-0 border border-navy/50"
          style={{ width: s * 0.75, height: s * 0.55, objectFit: 'cover' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </span>
    );
  }

  if (content.type === 'image') {
    return (
      <span className={`relative inline-flex ${className}`} style={{ width: s, height: s, minWidth: s }}>
        <img
          src={content.url}
          alt={symbolKey}
          width={s}
          height={s}
          className="rounded-full object-contain"
          style={{ width: s, height: s, minWidth: s }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const fb = e.currentTarget.nextElementSibling;
            if (fb) (fb as HTMLElement).style.display = 'flex';
          }}
        />
        {/* Hidden fallback badge */}
        <span
          className="items-center justify-center rounded-full font-mono font-bold absolute inset-0"
          style={{
            display: 'none',
            width: s,
            height: s,
            minWidth: s,
            fontSize: s * 0.4,
            backgroundColor: fallbackBadge.bg,
            color: fallbackBadge.text,
          }}
        >
          {fallbackBadge.initials}
        </span>
      </span>
    );
  }

  // Badge fallback
  return (
    <span
      className={`flex items-center justify-center rounded-full font-mono font-bold ${className}`}
      style={{
        width: s,
        height: s,
        minWidth: s,
        fontSize: s * 0.4,
        backgroundColor: content.bg,
        color: content.text,
      }}
    >
      {content.initials}
    </span>
  );
};

export default SymbolLogo;
