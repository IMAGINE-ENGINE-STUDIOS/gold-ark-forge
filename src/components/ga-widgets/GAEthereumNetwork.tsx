import { useEffect, useState, useCallback } from 'react';
import { ExternalLink, Fuel, Layers, Clock } from 'lucide-react';
import WidgetShell from './WidgetShell';
import AnimatedNumber from './AnimatedNumber';
import LivePulse from './LivePulse';

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

  const fetchAll = useCallback(async () => {
    try {
      const [blockHex, gasPriceHex] = await Promise.all([
        rpcCall('eth_blockNumber'),
        rpcCall('eth_gasPrice'),
      ]);

      const bn = parseInt(blockHex, 16);
      setBlockNumber(bn);
      setGasPrice(Math.round(parseInt(gasPriceHex, 16) / 1e9));

      const block = await rpcCall('eth_getBlockByNumber', [blockHex, false]);
      if (block) {
        setBlockTime(parseInt(block.timestamp, 16));
        setTxCount(block.transactions?.length ?? 0);
        if (block.baseFeePerGas) {
          setBaseFee(Math.round(parseInt(block.baseFeePerGas, 16) / 1e9));
        }
      }
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

  // Gas gauge SVG
  const gasLevel = gasPrice ? Math.min(100, (gasPrice / 100) * 100) : 0;

  return (
    <WidgetShell
      icon={() => (
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
          <span className="text-[8px] font-bold text-white">Ξ</span>
        </div>
      )}
      title="ETHEREUM NETWORK"
      source="public RPC"
      onRefresh={fetchAll}
    >
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-navy-light/30 rounded skeleton-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <LivePulse connected={!!blockNumber} label="LIVE" />
            <span className="text-[10px] text-marble/20 font-mono">{txCount?.toLocaleString()} txns in block</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-navy-dark/40 rounded p-4 border border-gold/10 hover:border-gold/25 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-3.5 h-3.5 text-gold/50" />
                <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">BLOCK</span>
              </div>
              <AnimatedNumber value={blockNumber ?? 0} className="font-display text-xl text-gold-light" />
            </div>

            <div className="bg-navy-dark/40 rounded p-4 border border-gold/10 hover:border-gold/25 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-gold/50" />
                <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">LAST BLOCK</span>
              </div>
              <p className="font-display text-xl text-marble">{timeSince !== null ? `${timeSince}s ago` : '—'}</p>
              <p className="text-[10px] text-marble/30 mt-1">~12s target</p>
            </div>

            {/* Gas with visual gauge */}
            <div className="bg-navy-dark/40 rounded p-4 border border-gold/10 hover:border-gold/25 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Fuel className="w-3.5 h-3.5 text-gold/50" />
                <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">GAS PRICE</span>
              </div>
              <AnimatedNumber value={gasPrice ?? 0} suffix=" Gwei" className="font-display text-xl text-marble" />
              <div className="mt-2 h-1.5 bg-navy-light/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-gold to-red-400 transition-all duration-1000"
                  style={{ width: `${gasLevel}%` }}
                />
              </div>
              <p className="text-[10px] text-marble/30 mt-1">base: {baseFee ?? '—'} Gwei</p>
            </div>

            <div className="bg-navy-dark/40 rounded p-4 border border-gold/10 hover:border-gold/25 transition-all duration-300 flex flex-col justify-between">
              <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">EXPLORER</span>
              <a
                href={`https://etherscan.io/block/${blockNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gold/50 hover:text-gold text-xs mt-2 transition-colors duration-300"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View on Etherscan
              </a>
            </div>
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

export default GAEthereumNetwork;
