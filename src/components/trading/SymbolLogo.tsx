import { useMemo } from 'react';

// Crypto logos from CoinGecko CDN
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

// Category badge colors
const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  metals: { bg: 'hsl(43,72%,50%)', text: 'hsl(213,32%,12%)' },
  crypto: { bg: 'hsl(38,92%,50%)', text: 'hsl(213,32%,12%)' },
  energy: { bg: 'hsl(25,95%,53%)', text: 'hsl(0,0%,100%)' },
  stocks: { bg: 'hsl(217,91%,60%)', text: 'hsl(0,0%,100%)' },
  bonds: { bg: 'hsl(210,6%,67%)', text: 'hsl(213,32%,12%)' },
  forex: { bg: 'hsl(170,70%,50%)', text: 'hsl(213,32%,12%)' },
};

// Metal symbols
const METAL_EMOJIS: Record<string, string> = {
  gold: '🥇', silver: '🥈', platinum: '💎', palladium: '⚡', copper: '🔶',
};

// Currency flags for forex
const FOREX_FLAGS: Record<string, string> = {
  eurusd: '🇪🇺', gbpusd: '🇬🇧', usdjpy: '🇯🇵', usdchf: '🇨🇭', audusd: '🇦🇺',
  usdcad: '🇨🇦', nzdusd: '🇳🇿', eurgbp: '🇪🇺', eurjpy: '🇪🇺', gbpjpy: '🇬🇧',
  usdmxn: '🇲🇽', usdzar: '🇿🇦', usdtry: '🇹🇷', usdinr: '🇮🇳', usdcny: '🇨🇳',
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
    // Crypto: use CDN image
    if (category === 'crypto') {
      const url = getCryptoLogoUrl(symbolKey);
      if (url) {
        return { type: 'image' as const, url };
      }
    }
    // Metals: emoji
    if (category === 'metals' && METAL_EMOJIS[symbolKey]) {
      return { type: 'emoji' as const, emoji: METAL_EMOJIS[symbolKey] };
    }
    // Forex: flag emoji
    if (category === 'forex' && FOREX_FLAGS[symbolKey]) {
      return { type: 'emoji' as const, emoji: FOREX_FLAGS[symbolKey] };
    }
    // Fallback: colored badge with ticker initials
    const initials = ticker.slice(0, 2).toUpperCase();
    const colors = BADGE_COLORS[category] ?? BADGE_COLORS.stocks;
    return { type: 'badge' as const, initials, ...colors };
  }, [symbolKey, category, ticker]);

  const s = size;

  if (content.type === 'image') {
    return (
      <img
        src={content.url}
        alt={symbolKey}
        width={s}
        height={s}
        className={`rounded-full ${className}`}
        style={{ width: s, height: s, minWidth: s }}
        onError={(e) => {
          // Fallback to badge on image load error
          const target = e.currentTarget;
          target.style.display = 'none';
          const next = target.nextElementSibling;
          if (next) (next as HTMLElement).style.display = 'flex';
        }}
      />
    );
  }

  if (content.type === 'emoji') {
    return (
      <span
        className={`flex items-center justify-center ${className}`}
        style={{ width: s, height: s, fontSize: s * 0.7, lineHeight: 1 }}
      >
        {content.emoji}
      </span>
    );
  }

  // Badge
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
