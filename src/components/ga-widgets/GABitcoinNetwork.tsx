import { useEffect, useState, useCallback } from 'react';
import { Bitcoin, Clock, Zap, HardDrive, RefreshCw, ExternalLink } from 'lucide-react';

interface BlockData {
  height: number;
  timestamp: number;
  tx_count: number;
  size: number;
}

interface FeeData {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  minimumFee: number;
}

interface MempoolInfo {
  count: number;
  vsize: number;
}

const GABitcoinNetwork = () => {
  const [block, setBlock] = useState<BlockData | null>(null);
  const [fees, setFees] = useState<FeeData | null>(null);
  const [mempool, setMempool] = useState<MempoolInfo | null>(null);
  const [hashrate, setHashrate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAll = useCallback(async () => {
    try {
      const [blockRes, feeRes, mempoolRes, hashrateRes] = await Promise.all([
        fetch('https://mempool.space/api/blocks/tip/height').then(r => r.text()),
        fetch('https://mempool.space/api/v1/fees/recommended').then(r => r.json()),
        fetch('https://mempool.space/api/mempool').then(r => r.json()),
        fetch('https://mempool.space/api/v1/mining/hashrate/1w').then(r => r.json()).catch(() => null),
      ]);

      const tipHeight = parseInt(blockRes);
      // Fetch latest block details
      const blockDetail = await fetch(`https://mempool.space/api/block-height/${tipHeight}`).then(r => r.text());
      const blockInfo = await fetch(`https://mempool.space/api/block/${blockDetail}`).then(r => r.json());

      setBlock({ height: tipHeight, timestamp: blockInfo.timestamp, tx_count: blockInfo.tx_count, size: blockInfo.size });
      setFees(feeRes);
      setMempool({ count: mempoolRes.count, vsize: mempoolRes.vsize });
      if (hashrateRes?.currentHashrate) {
        const ehps = hashrateRes.currentHashrate / 1e18;
        setHashrate(`${ehps.toFixed(1)} EH/s`);
      }
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Bitcoin network fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const timeSinceBlock = block ? Math.floor((Date.now() / 1000 - block.timestamp) / 60) : null;

  if (loading) {
    return (
      <div className="rounded-sm border border-gold/20 bg-navy-light/50 p-8 animate-pulse">
        <div className="h-6 w-48 bg-gold/10 rounded mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-gold/5 rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-gold/20 bg-navy-light/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10 bg-navy-dark/50">
        <div className="flex items-center gap-3">
          <Bitcoin className="w-5 h-5 text-gold" />
          <span className="font-display text-sm tracking-[0.15em] text-gold-light">BITCOIN NETWORK</span>
          <span className="text-[10px] text-marble/30 font-mono ml-2">mempool.space</span>
        </div>
        <button onClick={fetchAll} className="text-marble/40 hover:text-gold transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Block Height */}
        <div className="bg-navy-dark/40 rounded p-4 border border-gold/10">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-3.5 h-3.5 text-gold/60" />
            <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">BLOCK HEIGHT</span>
          </div>
          <p className="font-display text-2xl text-gold-light">{block?.height?.toLocaleString()}</p>
          <p className="text-[10px] text-marble/30 mt-1">{block?.tx_count?.toLocaleString()} txns · {((block?.size ?? 0) / 1e6).toFixed(2)} MB</p>
        </div>

        {/* Time Since Block */}
        <div className="bg-navy-dark/40 rounded p-4 border border-gold/10">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-gold/60" />
            <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">LAST BLOCK</span>
          </div>
          <p className="font-display text-2xl text-marble">
            {timeSinceBlock !== null ? `${timeSinceBlock}m ago` : '—'}
          </p>
          <p className="text-[10px] text-marble/30 mt-1">~10 min target</p>
        </div>

        {/* Hashrate */}
        <div className="bg-navy-dark/40 rounded p-4 border border-gold/10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5 text-gold/60" />
            <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">HASHRATE</span>
          </div>
          <p className="font-display text-2xl text-marble">{hashrate ?? '—'}</p>
          <p className="text-[10px] text-marble/30 mt-1">network security</p>
        </div>

        {/* Fee Estimates */}
        <div className="bg-navy-dark/40 rounded p-4 border border-gold/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">FEE ESTIMATES</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-marble/40">Priority</span>
              <span className="text-gold-light font-mono">{fees?.fastestFee} sat/vB</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-marble/40">Standard</span>
              <span className="text-marble font-mono">{fees?.halfHourFee} sat/vB</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-marble/40">Economy</span>
              <span className="text-marble/60 font-mono">{fees?.hourFee} sat/vB</span>
            </div>
          </div>
        </div>

        {/* Mempool */}
        <div className="bg-navy-dark/40 rounded p-4 border border-gold/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">MEMPOOL</span>
          </div>
          <p className="font-display text-2xl text-marble">{mempool?.count?.toLocaleString()}</p>
          <p className="text-[10px] text-marble/30 mt-1">{((mempool?.vsize ?? 0) / 1e6).toFixed(1)} MvB pending</p>
        </div>

        {/* Explorer Link */}
        <div className="bg-navy-dark/40 rounded p-4 border border-gold/10 flex flex-col justify-between">
          <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">EXPLORER</span>
          <a
            href={`https://mempool.space/block/${block?.height}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gold/70 hover:text-gold text-xs mt-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View on mempool.space
          </a>
          <p className="text-[10px] text-marble/20 mt-1">
            {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GABitcoinNetwork;
