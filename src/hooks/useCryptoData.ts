import { useQuery } from '@tanstack/react-query';

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: { price: number[] };
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  ath: number;
  ath_change_percentage: number;
}

// Fallback static data when CoinGecko is rate-limited
const FALLBACK_MARKETS: CryptoAsset[] = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png', current_price: 97500, market_cap: 1930000000000, market_cap_rank: 1, total_volume: 42000000000, price_change_percentage_24h: 1.2, price_change_percentage_7d_in_currency: 3.5, high_24h: 98200, low_24h: 96100, circulating_supply: 19800000, total_supply: 21000000, ath: 108000, ath_change_percentage: -9.7, sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => 95000 + Math.sin(i / 10) * 2000 + i * 15) } },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png', current_price: 3450, market_cap: 415000000000, market_cap_rank: 2, total_volume: 18000000000, price_change_percentage_24h: 0.8, price_change_percentage_7d_in_currency: 2.1, high_24h: 3510, low_24h: 3380, circulating_supply: 120300000, total_supply: null, ath: 4878, ath_change_percentage: -29.3, sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => 3300 + Math.sin(i / 12) * 100 + i * 0.8) } },
  { id: 'tether', symbol: 'usdt', name: 'Tether', image: 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png', current_price: 1.0, market_cap: 140000000000, market_cap_rank: 3, total_volume: 55000000000, price_change_percentage_24h: 0.01, price_change_percentage_7d_in_currency: -0.02, high_24h: 1.001, low_24h: 0.999, circulating_supply: 140000000000, total_supply: 140000000000, ath: 1.32, ath_change_percentage: -24.2, sparkline_in_7d: { price: Array.from({ length: 168 }, () => 1 + (Math.random() - 0.5) * 0.002) } },
  { id: 'binancecoin', symbol: 'bnb', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png', current_price: 680, market_cap: 100000000000, market_cap_rank: 4, total_volume: 1800000000, price_change_percentage_24h: -0.5, price_change_percentage_7d_in_currency: 1.8, high_24h: 690, low_24h: 672, circulating_supply: 147000000, total_supply: 147000000, ath: 793, ath_change_percentage: -14.2, sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => 670 + Math.sin(i / 8) * 15 + i * 0.05) } },
  { id: 'solana', symbol: 'sol', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/thumb/solana.png', current_price: 195, market_cap: 95000000000, market_cap_rank: 5, total_volume: 3500000000, price_change_percentage_24h: 2.3, price_change_percentage_7d_in_currency: 5.1, high_24h: 198, low_24h: 189, circulating_supply: 487000000, total_supply: 588000000, ath: 260, ath_change_percentage: -25, sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => 185 + Math.sin(i / 7) * 8 + i * 0.06) } },
  { id: 'ripple', symbol: 'xrp', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/thumb/xrp-symbol-white-128.png', current_price: 2.45, market_cap: 140000000000, market_cap_rank: 6, total_volume: 8000000000, price_change_percentage_24h: -1.1, price_change_percentage_7d_in_currency: -2.3, high_24h: 2.52, low_24h: 2.40, circulating_supply: 57000000000, total_supply: 100000000000, ath: 3.4, ath_change_percentage: -28, sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => 2.4 + Math.sin(i / 9) * 0.08) } },
  { id: 'cardano', symbol: 'ada', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/thumb/cardano.png', current_price: 0.75, market_cap: 27000000000, market_cap_rank: 7, total_volume: 900000000, price_change_percentage_24h: 1.5, price_change_percentage_7d_in_currency: 4.2, high_24h: 0.77, low_24h: 0.73, circulating_supply: 36000000000, total_supply: 45000000000, ath: 3.09, ath_change_percentage: -75.7, sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => 0.72 + Math.sin(i / 11) * 0.03 + i * 0.0002) } },
  { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/thumb/dogecoin.png', current_price: 0.32, market_cap: 47000000000, market_cap_rank: 8, total_volume: 2500000000, price_change_percentage_24h: 3.1, price_change_percentage_7d_in_currency: 8.4, high_24h: 0.33, low_24h: 0.31, circulating_supply: 147000000000, total_supply: null, ath: 0.73, ath_change_percentage: -56, sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => 0.3 + Math.sin(i / 6) * 0.015 + i * 0.0001) } },
  { id: 'tron', symbol: 'trx', name: 'TRON', image: 'https://assets.coingecko.com/coins/images/1094/thumb/tron-logo.png', current_price: 0.235, market_cap: 20000000000, market_cap_rank: 9, total_volume: 600000000, price_change_percentage_24h: -0.3, price_change_percentage_7d_in_currency: 1.2, high_24h: 0.24, low_24h: 0.232, circulating_supply: 85000000000, total_supply: 85000000000, ath: 0.30, ath_change_percentage: -21.7, sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => 0.23 + Math.sin(i / 10) * 0.005) } },
  { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/thumb/Avalanche_Circle_RedWhite_Trans.png', current_price: 38.5, market_cap: 16000000000, market_cap_rank: 10, total_volume: 800000000, price_change_percentage_24h: 1.8, price_change_percentage_7d_in_currency: 6.2, high_24h: 39.2, low_24h: 37.5, circulating_supply: 415000000, total_supply: 720000000, ath: 144, ath_change_percentage: -73.3, sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => 36 + Math.sin(i / 8) * 2 + i * 0.015) } },
  { id: 'polkadot', symbol: 'dot', name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/thumb/polkadot.png', current_price: 7.2, market_cap: 10500000000, market_cap_rank: 11, total_volume: 350000000, price_change_percentage_24h: 0.9, price_change_percentage_7d_in_currency: 3.1, high_24h: 7.35, low_24h: 7.05, circulating_supply: 1460000000, total_supply: 1460000000, ath: 54.98, ath_change_percentage: -86.9, sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => 7 + Math.sin(i / 9) * 0.2 + i * 0.001) } },
  { id: 'chainlink', symbol: 'link', name: 'Chainlink', image: 'https://assets.coingecko.com/coins/images/877/thumb/chainlink-new-logo.png', current_price: 18.5, market_cap: 11800000000, market_cap_rank: 12, total_volume: 650000000, price_change_percentage_24h: 2.1, price_change_percentage_7d_in_currency: 7.3, high_24h: 19.0, low_24h: 17.9, circulating_supply: 638000000, total_supply: 1000000000, ath: 52.7, ath_change_percentage: -64.9, sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => 17 + Math.sin(i / 7) * 1 + i * 0.009) } },
];

const FALLBACK_GLOBAL: CryptoGlobal = {
  total_market_cap: { usd: 3200000000000 },
  total_volume: { usd: 145000000000 },
  market_cap_percentage: { btc: 57.8, eth: 12.4 },
  market_cap_change_percentage_24h_usd: 0.82,
  active_cryptocurrencies: 16234,
  markets: 1120,
};

const fetchCryptoMarkets = async (perPage = 50): Promise<CryptoAsset[]> => {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=true&price_change_percentage=7d`
    );
    if (!res.ok) throw new Error('CoinGecko API error');
    return res.json();
  } catch (e) {
    console.warn('CoinGecko markets unavailable, using fallback data:', e);
    return FALLBACK_MARKETS.slice(0, perPage);
  }
};

export const useCryptoData = (perPage = 50) => {
  return useQuery({
    queryKey: ['crypto-markets', perPage],
    queryFn: () => fetchCryptoMarkets(perPage),
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 2,
  });
};

export interface CryptoGlobal {
  total_market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  market_cap_percentage: Record<string, number>;
  market_cap_change_percentage_24h_usd: number;
  active_cryptocurrencies: number;
  markets: number;
}

const fetchCryptoGlobal = async (): Promise<CryptoGlobal> => {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/global');
    if (!res.ok) throw new Error('CoinGecko global API error');
    const json = await res.json();
    return json.data;
  } catch (e) {
    console.warn('CoinGecko global unavailable, using fallback data:', e);
    return FALLBACK_GLOBAL;
  }
};

export const useCryptoGlobal = () => {
  return useQuery({
    queryKey: ['crypto-global'],
    queryFn: fetchCryptoGlobal,
    refetchInterval: 60000,
    staleTime: 30000,
  });
};

export interface TrendingCoin {
  item: {
    id: string;
    coin_id: number;
    name: string;
    symbol: string;
    thumb: string;
    score: number;
    data?: {
      price: number;
      price_change_percentage_24h?: Record<string, number>;
      market_cap: string;
    };
  };
}

const fetchTrending = async (): Promise<TrendingCoin[]> => {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/search/trending');
    if (!res.ok) throw new Error('CoinGecko trending API error');
    const json = await res.json();
    return json.coins ?? [];
  } catch (e) {
    console.warn('CoinGecko trending unavailable:', e);
    return [];
  }
};

export const useCryptoTrending = () => {
  return useQuery({
    queryKey: ['crypto-trending'],
    queryFn: fetchTrending,
    refetchInterval: 120000,
    staleTime: 60000,
  });
};
