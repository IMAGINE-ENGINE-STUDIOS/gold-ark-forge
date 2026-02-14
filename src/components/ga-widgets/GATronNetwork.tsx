import { useEffect, useState, useCallback } from 'react';
import { ExternalLink, Layers, Clock, Zap } from 'lucide-react';
import WidgetShell from './WidgetShell';
import AnimatedNumber from './AnimatedNumber';
import LivePulse from './LivePulse';

interface TronBlock {
  blockNumber: number;
  timestamp: number;
  txCount: number;
}

const GATronNetwork = () => {
  const [block, setBlock] = useState<TronBlock | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch('https://api.trongrid.io/wallet/getnowblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.block_header) {
        const raw = data.block_header.raw_data;
        setBlock({ blockNumber: raw.number, timestamp: raw.timestamp, txCount: data.transactions?.length ?? 0 });
      }
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

  return (
    <WidgetShell
      icon={() => (
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
          <span className="text-[8px] font-bold text-white">T</span>
        </div>
      )}
      title="TRON NETWORK"
      source="TronGrid"
      onRefresh={fetchAll}
    >
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-navy-light/30 rounded skeleton-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <LivePulse connected={!!block} label="LIVE" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-navy-dark/40 rounded p-4 border border-gold/10 hover:border-gold/25 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-3.5 h-3.5 text-gold/50" />
                <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">BLOCK</span>
              </div>
              <AnimatedNumber value={block?.blockNumber ?? 0} className="font-display text-xl text-gold-light" />
              <p className="text-[10px] text-marble/30 mt-1">{block?.txCount} txns</p>
            </div>

            <div className="bg-navy-dark/40 rounded p-4 border border-gold/10 hover:border-gold/25 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-gold/50" />
                <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">LAST BLOCK</span>
              </div>
              <p className="font-display text-xl text-marble">{timeSince !== null ? `${timeSince}s ago` : '—'}</p>
              <p className="text-[10px] text-marble/30 mt-1">~3s target</p>
            </div>

            <div className="bg-navy-dark/40 rounded p-4 border border-gold/10 hover:border-gold/25 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-gold/50" />
                <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">SPEED</span>
              </div>
              <p className="font-display text-xl text-marble">2,000</p>
              <p className="text-[10px] text-marble/30 mt-1">TPS capacity</p>
            </div>

            <div className="bg-navy-dark/40 rounded p-4 border border-gold/10 hover:border-gold/25 transition-all duration-300 flex flex-col justify-between">
              <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">EXPLORER</span>
              <a
                href={`https://tronscan.org/#/block/${block?.blockNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gold/50 hover:text-gold text-xs mt-2 transition-colors duration-300"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View on TronScan
              </a>
            </div>
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

export default GATronNetwork;
