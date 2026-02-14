import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, ExternalLink, Layers, Clock, Zap } from 'lucide-react';

interface TronBlock {
  blockNumber: number;
  timestamp: number;
  txCount: number;
  witnessAddress: string;
}

const GATronNetwork = () => {
  const [block, setBlock] = useState<TronBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch('https://api.trongrid.io/wallet/getnowblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (data.block_header) {
        const raw = data.block_header.raw_data;
        setBlock({
          blockNumber: raw.number,
          timestamp: raw.timestamp,
          txCount: data.transactions?.length ?? 0,
          witnessAddress: raw.witness_address ?? '',
        });
      }
      setLastRefresh(new Date());
    } catch (e) {
      console.error('TRON fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const timeSince = block ? Math.floor((Date.now() - block.timestamp) / 1000) : null;

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
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">T</span>
          </div>
          <span className="font-display text-sm tracking-[0.15em] text-gold-light">TRON NETWORK</span>
          <span className="text-[10px] text-marble/30 font-mono ml-2">TronGrid</span>
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
          <p className="font-display text-xl text-gold-light">{block?.blockNumber?.toLocaleString()}</p>
          <p className="text-[10px] text-marble/30 mt-1">{block?.txCount} txns</p>
        </div>

        <div className="bg-navy-dark/40 rounded p-4 border border-gold/10">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-gold/60" />
            <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">LAST BLOCK</span>
          </div>
          <p className="font-display text-xl text-marble">{timeSince !== null ? `${timeSince}s ago` : '—'}</p>
          <p className="text-[10px] text-marble/30 mt-1">~3s target</p>
        </div>

        <div className="bg-navy-dark/40 rounded p-4 border border-gold/10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5 text-gold/60" />
            <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">SPEED</span>
          </div>
          <p className="font-display text-xl text-marble">2,000</p>
          <p className="text-[10px] text-marble/30 mt-1">TPS capacity</p>
        </div>

        <div className="bg-navy-dark/40 rounded p-4 border border-gold/10 flex flex-col justify-between">
          <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">EXPLORER</span>
          <a
            href={`https://tronscan.org/#/block/${block?.blockNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gold/70 hover:text-gold text-xs mt-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View on TronScan
          </a>
          <p className="text-[10px] text-marble/20 mt-1">{lastRefresh.toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default GATronNetwork;
