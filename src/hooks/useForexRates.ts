import { useQuery } from '@tanstack/react-query';

export interface ForexRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD'];

const fetchForexRates = async (): Promise<Record<string, ForexRates>> => {
  const results: Record<string, ForexRates> = {};
  // Fetch rates from each base currency
  const promises = currencies.map(async (base) => {
    const others = currencies.filter((c) => c !== base).join(',');
    const res = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${others}`);
    if (!res.ok) throw new Error(`Frankfurter API error for ${base}`);
    const data = await res.json();
    results[base] = { base, date: data.date, rates: { [base]: 1, ...data.rates } };
  });
  await Promise.all(promises);
  return results;
};

export const useForexRates = () => {
  return useQuery({
    queryKey: ['forex-rates'],
    queryFn: fetchForexRates,
    refetchInterval: 60000, // 1 min auto-refresh
    staleTime: 30000,
  });
};
