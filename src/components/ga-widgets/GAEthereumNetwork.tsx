import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, ExternalLink, Fuel, Layers, Clock } from 'lucide-react';

const RPC_URL = 'https://eth.llamarpc.com';

const rpcCall = async (method: string, params: unknown[] = []) => {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  return json.result;
};

const GAEthereumNetwork = () => {
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [gasPrice, setGasPrice] = useState<number | null>(null);
  const [baseFee, setBaseFee] = useState<number | null>(null);
  const [blockTime, setBlockTime] = useState<number | null>(null);
  const [txCount, setTxCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAll = useCallback(async () => {
    try {
      const [blockHex, gasPriceHex] = await Promise.all([
        rpcCall('eth_blockNumber'),
        rpcCall('eth_gasPrice'),
      ]);

      const bn = parseInt(blockHex, 16);
      setBlockNumber(bn);
      setGasPrice(Math.round(parseInt(gasPriceHex, 16) / 1e9));

      // Get block details
      const block = await rpcCall('eth_getBlockByNumber', [blockHex, false]);
      if (block) {
        setBlockTime(parseInt(block.timestamp, 16));
        setTxCount(block.transactions?.length ?? 0);
        if (block.baseFeePerGas) {
          setBaseFee(Math.round(parseInt(block.baseFeePerGas, 16) / 1e9));
        }
      }
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Ethereum fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const timeSince = blockTime ? Math.floor(Date.now() / 1000 - blockTime) : null;

  if (loading) {
    return (
      <div className="rounded-sm border border-gold/20 bg-navy-light/50 p-8 animate-pulse">
        <div className="h-6 w-48 bg-gold/10 rounded mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gold/5 rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-gold/20 bg-navy-light/50 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10 bg-navy-dark/50">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">Ξ</span>
          </div>
          <span className="font-display text-sm tracking-[0.15em] text-gold-light">ETHEREUM NETWORK</span>
          <span className="text-[10px] text-marble/30 font-mono ml-2">public RPC</span>
        </div>
        <button onClick={fetchAll} className="text-marble/40 hover:text-gold transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-navy-dark/40 rounded p-4 border border-gold/10">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-3.5 h-3.5 text-gold/60" />
            <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">BLOCK</span>
          </div>
          <p className="font-display text-xl text-gold-light">{blockNumber?.toLocaleString()}</p>
          <p className="text-[10px] text-marble/30 mt-1">{txCount?.toLocaleString()} txns</p>
        </div>

        <div className="bg-navy-dark/40 rounded p-4 border border-gold/10">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-gold/60" />
            <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">LAST BLOCK</span>
          </div>
          <p className="font-display text-xl text-marble">{timeSince !== null ? `${timeSince}s ago` : '—'}</p>
          <p className="text-[10px] text-marble/30 mt-1">~12s target</p>
        </div>

        <div className="bg-navy-dark/40 rounded p-4 border border-gold/10">
          <div className="flex items-center gap-2 mb-2">
            <Fuel className="w-3.5 h-3.5 text-gold/60" />
            <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">GAS PRICE</span>
          </div>
          <p className="font-display text-xl text-marble">{gasPrice} Gwei</p>
          <p className="text-[10px] text-marble/30 mt-1">base: {baseFee ?? '—'} Gwei</p>
        </div>

        <div className="bg-navy-dark/40 rounded p-4 border border-gold/10 flex flex-col justify-between">
          <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">EXPLORER</span>
          <a
            href={`https://etherscan.io/block/${blockNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gold/70 hover:text-gold text-xs mt-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View on Etherscan
          </a>
          <p className="text-[10px] text-marble/20 mt-1">{lastRefresh.toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default GAEthereumNetwork;
