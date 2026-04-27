import { useQuery } from '@tanstack/react-query';

const RPC_URLS = [
  'https://eth.llamarpc.com',
  'https://rpc.ankr.com/eth',
  'https://ethereum-rpc.publicnode.com',
  'https://1rpc.io/eth',
  'https://cloudflare-eth.com',
];

const rpcCall = async (method: string, params: unknown[] = []): Promise<string> => {
  for (const url of RPC_URLS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const json = await res.json();
      if (json.result) return json.result as string;
    } catch {
      continue;
    }
  }
  throw new Error('All Ethereum RPCs failed');
};

export interface TokenMeta {
  symbol: string;
  name: string;
  contract: string;
  decimals: number;
  coingeckoId: string;
}

export const TOKENS: TokenMeta[] = [
  { symbol: 'USDC', name: 'USD Coin',   contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6,  coingeckoId: 'usd-coin' },
  { symbol: 'USDT', name: 'Tether',     contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6,  coingeckoId: 'tether' },
  { symbol: 'DAI',  name: 'Dai',        contract: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, coingeckoId: 'dai' },
  { symbol: 'WETH', name: 'Wrapped ETH',contract: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, coingeckoId: 'weth' },
  { symbol: 'WBTC', name: 'Wrapped BTC',contract: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8,  coingeckoId: 'wrapped-bitcoin' },
  { symbol: 'LINK', name: 'Chainlink',  contract: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, coingeckoId: 'chainlink' },
  { symbol: 'UNI',  name: 'Uniswap',    contract: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, coingeckoId: 'uniswap' },
];

export interface TokenBalance {
  meta: TokenMeta;
  amount: number;
  usdValue: number;
}

export interface EthereumWalletData {
  ethBalance: number;
  ethUsdValue: number;
  ethPrice: number;
  tokens: TokenBalance[];
  totalUsd: number;
  blockNumber: number | null;
  gasPriceGwei: number | null;
  baseFeeGwei: number | null;
}

const padAddress = (addr: string) => addr.toLowerCase().replace(/^0x/, '').padStart(64, '0');
const BALANCE_OF_SELECTOR = '0x70a08231';

const hexToBigInt = (hex: string): bigint => {
  if (!hex || hex === '0x') return 0n;
  return BigInt(hex);
};

const toUnit = (raw: bigint, decimals: number): number => {
  if (raw === 0n) return 0;
  const divisor = 10n ** BigInt(decimals);
  const whole = raw / divisor;
  const frac = raw % divisor;
  return Number(whole) + Number(frac) / Number(divisor);
};

const fetchPrices = async (ids: string[]): Promise<Record<string, number>> => {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`;
    const res = await fetch(url);
    if (!res.ok) return {};
    const json = await res.json();
    const out: Record<string, number> = {};
    for (const id of ids) out[id] = json[id]?.usd ?? 0;
    return out;
  } catch {
    return {};
  }
};

export const useEthereumWallet = (address: string | null) => {
  return useQuery<EthereumWalletData>({
    queryKey: ['ethereum-wallet', address],
    enabled: !!address,
    refetchInterval: 15_000,
    queryFn: async () => {
      if (!address) throw new Error('No address');

      const [ethBalanceHex, gasPriceHex, blockHex] = await Promise.all([
        rpcCall('eth_getBalance', [address, 'latest']),
        rpcCall('eth_gasPrice').catch(() => '0x0'),
        rpcCall('eth_blockNumber').catch(() => '0x0'),
      ]);

      const blockNumber = blockHex && blockHex !== '0x0' ? parseInt(blockHex, 16) : null;
      const gasPriceGwei = gasPriceHex && gasPriceHex !== '0x0'
        ? Math.round(Number(hexToBigInt(gasPriceHex)) / 1e9)
        : null;

      // Base fee from latest block
      let baseFeeGwei: number | null = null;
      if (blockHex && blockHex !== '0x0') {
        try {
          const block = await rpcCall('eth_getBlockByNumber', [blockHex, false]) as unknown as { baseFeePerGas?: string };
          if (block?.baseFeePerGas) {
            baseFeeGwei = Math.round(Number(hexToBigInt(block.baseFeePerGas)) / 1e9);
          }
        } catch { /* ignore */ }
      }

      // Token balances
      const tokenBalances = await Promise.all(
        TOKENS.map(async (t) => {
          try {
            const data = BALANCE_OF_SELECTOR + padAddress(address);
            const result = await rpcCall('eth_call', [{ to: t.contract, data }, 'latest']);
            const raw = hexToBigInt(result);
            return { meta: t, raw };
          } catch {
            return { meta: t, raw: 0n };
          }
        })
      );

      // Prices
      const prices = await fetchPrices(['ethereum', ...TOKENS.map(t => t.coingeckoId)]);
      const ethPrice = prices['ethereum'] ?? 0;
      const ethBalance = toUnit(hexToBigInt(ethBalanceHex), 18);
      const ethUsdValue = ethBalance * ethPrice;

      const tokens: TokenBalance[] = tokenBalances.map(({ meta, raw }) => {
        const amount = toUnit(raw, meta.decimals);
        const usdValue = amount * (prices[meta.coingeckoId] ?? 0);
        return { meta, amount, usdValue };
      });

      const totalUsd = ethUsdValue + tokens.reduce((s, t) => s + t.usdValue, 0);

      return { ethBalance, ethUsdValue, ethPrice, tokens, totalUsd, blockNumber, gasPriceGwei, baseFeeGwei };
    },
  });
};