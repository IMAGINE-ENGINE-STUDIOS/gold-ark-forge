import { useQuery } from '@tanstack/react-query';

export interface FxSnapshot {
  base: string;
  updated: string;
  /** rate = units of currency per 1 USD */
  rates: Record<string, number>;
}

/** Live USD-based rates for the full international monetary system (160+ ISO codes). */
const fetchFxRates = async (): Promise<FxSnapshot> => {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error('FX rate provider unavailable');
  const data = await res.json();
  if (data?.result !== 'success' || !data?.rates) throw new Error('FX rate provider returned no data');
  return {
    base: 'USD',
    updated: data.time_last_update_utc ?? '',
    rates: data.rates as Record<string, number>,
  };
};

export const useFxRates = () =>
  useQuery({
    queryKey: ['fx-rates-usd'],
    queryFn: fetchFxRates,
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 2,
  });

/** Minimal glyph + name map; codes not listed still render with their ISO code. */
export const CURRENCY_META: Record<string, { symbol: string; name: string }> = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  CHF: { symbol: 'Fr', name: 'Swiss Franc' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar' },
  CNY: { symbol: '¥', name: 'Chinese Yuan' },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar' },
  SEK: { symbol: 'kr', name: 'Swedish Krona' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone' },
  DKK: { symbol: 'kr', name: 'Danish Krone' },
  PLN: { symbol: 'zł', name: 'Polish Zloty' },
  CZK: { symbol: 'Kč', name: 'Czech Koruna' },
  HUF: { symbol: 'Ft', name: 'Hungarian Forint' },
  TRY: { symbol: '₺', name: 'Turkish Lira' },
  RUB: { symbol: '₽', name: 'Russian Ruble' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  BRL: { symbol: 'R$', name: 'Brazilian Real' },
  MXN: { symbol: 'Mex$', name: 'Mexican Peso' },
  ZAR: { symbol: 'R', name: 'South African Rand' },
  KRW: { symbol: '₩', name: 'South Korean Won' },
  TWD: { symbol: 'NT$', name: 'Taiwan Dollar' },
  THB: { symbol: '฿', name: 'Thai Baht' },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah' },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit' },
  PHP: { symbol: '₱', name: 'Philippine Peso' },
  VND: { symbol: '₫', name: 'Vietnamese Dong' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham' },
  SAR: { symbol: '﷼', name: 'Saudi Riyal' },
  QAR: { symbol: '﷼', name: 'Qatari Riyal' },
  ILS: { symbol: '₪', name: 'Israeli Shekel' },
  NGN: { symbol: '₦', name: 'Nigerian Naira' },
  EGP: { symbol: 'E£', name: 'Egyptian Pound' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
  ARS: { symbol: 'AR$', name: 'Argentine Peso' },
  CLP: { symbol: 'CL$', name: 'Chilean Peso' },
  COP: { symbol: 'CO$', name: 'Colombian Peso' },
  PEN: { symbol: 'S/', name: 'Peruvian Sol' },
  UAH: { symbol: '₴', name: 'Ukrainian Hryvnia' },
  XDR: { symbol: 'SDR', name: 'IMF Special Drawing Rights' },
  XAU: { symbol: 'Au', name: 'Gold Ounce' },
  XAG: { symbol: 'Ag', name: 'Silver Ounce' },
};

export const currencyGlyph = (code: string) => CURRENCY_META[code]?.symbol ?? code;
export const currencyName = (code: string) => CURRENCY_META[code]?.name ?? code;
