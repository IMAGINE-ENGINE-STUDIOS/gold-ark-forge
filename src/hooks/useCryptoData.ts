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

const FALLBACK_MARKETS: CryptoAsset[] = [];

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
    console.warn('CoinGecko markets unavailable; returning no synthetic fallback:', e);
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
