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

const fetchCryptoMarkets = async (perPage = 50): Promise<CryptoAsset[]> => {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=true&price_change_percentage=7d`
  );
  if (!res.ok) throw new Error('CoinGecko API error');
  return res.json();
};

export const useCryptoData = (perPage = 50) => {
  return useQuery({
    queryKey: ['crypto-markets', perPage],
    queryFn: () => fetchCryptoMarkets(perPage),
    refetchInterval: 30000, // 30s auto-refresh
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
  const res = await fetch('https://api.coingecko.com/api/v3/global');
  if (!res.ok) throw new Error('CoinGecko global API error');
  const json = await res.json();
  return json.data;
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
  const res = await fetch('https://api.coingecko.com/api/v3/search/trending');
  if (!res.ok) throw new Error('CoinGecko trending API error');
  const json = await res.json();
  return json.coins ?? [];
};

export const useCryptoTrending = () => {
  return useQuery({
    queryKey: ['crypto-trending'],
    queryFn: fetchTrending,
    refetchInterval: 120000,
    staleTime: 60000,
  });
};
