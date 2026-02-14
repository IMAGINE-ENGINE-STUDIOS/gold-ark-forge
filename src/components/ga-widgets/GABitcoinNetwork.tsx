import { useEffect, useState, useCallback } from 'react';
import { Bitcoin, Clock, Zap, HardDrive, ExternalLink } from 'lucide-react';
import WidgetShell from './WidgetShell';
import AnimatedNumber from './AnimatedNumber';
import LivePulse from './LivePulse';

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

const StatCard = ({ icon: Icon, label, children }: { icon?: any; label: string; children: React.ReactNode }) => (
  <div className="bg-navy-dark/40 rounded p-4 border border-gold/10 hover:border-gold/25 transition-all duration-300 group">
    <div className="flex items-center gap-2 mb-2">
      {Icon && <Icon className="w-3.5 h-3.5 text-gold/50 group-hover:text-gold transition-colors duration-300" />}
      <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">{label}</span>
    </div>
    {children}
  </div>
);

const GABitcoinNetwork = () => {
  const [block, setBlock] = useState<BlockData | null>(null);
  const [fees, setFees] = useState<FeeData | null>(null);
  const [mempool, setMempool] = useState<MempoolInfo | null>(null);
  const [hashrate, setHashrate] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [blockRes, feeRes, mempoolRes, hashrateRes] = await Promise.all([
        fetch('https://mempool.space/api/blocks/tip/height').then(r => r.text()),
        fetch('https://mempool.space/api/v1/fees/recommended').then(r => r.json()),
        fetch('https://mempool.space/api/mempool').then(r => r.json()),
        fetch('https://mempool.space/api/v1/mining/hashrate/1w').then(r => r.json()).catch(() => null),
      ]);

      const tipHeight = parseInt(blockRes);
      const blockDetail = await fetch(`https://mempool.space/api/block-height/${tipHeight}`).then(r => r.text());
      const blockInfo = await fetch(`https://mempool.space/api/block/${blockDetail}`).then(r => r.json());

      setBlock({ height: tipHeight, timestamp: blockInfo.timestamp, tx_count: blockInfo.tx_count, size: blockInfo.size });
      setFees(feeRes);
      setMempool({ count: mempoolRes.count, vsize: mempoolRes.vsize });
      if (hashrateRes?.currentHashrate) {
        setHashrate(hashrateRes.currentHashrate / 1e18);
      }
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

  // Fee urgency bar
  const maxFee = fees ? Math.max(fees.fastestFee, 1) : 1;
  const feeEntries = fees ? [
    { label: 'Priority', value: fees.fastestFee, color: 'bg-gold' },
    { label: 'Standard', value: fees.halfHourFee, color: 'bg-gold/60' },
    { label: 'Economy', value: fees.hourFee, color: 'bg-gold/30' },
  ] : [];

  return (
    <WidgetShell icon={Bitcoin} title="BITCOIN NETWORK" source="mempool.space" onRefresh={fetchAll}>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-navy-light/30 rounded skeleton-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Live indicator */}
          <div className="flex items-center justify-between">
            <LivePulse connected={!!block} label="LIVE" />
            <span className="text-[10px] text-marble/20 font-mono">
              {block?.tx_count?.toLocaleString()} txns · {((block?.size ?? 0) / 1e6).toFixed(2)} MB
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard icon={HardDrive} label="BLOCK HEIGHT">
              <AnimatedNumber value={block?.height ?? 0} className="font-display text-2xl text-gold-light" />
            </StatCard>

            <StatCard icon={Clock} label="LAST BLOCK">
              <p className="font-display text-2xl text-marble">
                {timeSinceBlock !== null ? `${timeSinceBlock}m ago` : '—'}
              </p>
              <p className="text-[10px] text-marble/30 mt-1">~10 min target</p>
            </StatCard>

            <StatCard icon={Zap} label="HASHRATE">
              <AnimatedNumber value={hashrate} decimals={1} suffix=" EH/s" className="font-display text-2xl text-marble" />
              <p className="text-[10px] text-marble/30 mt-1">network security</p>
            </StatCard>

            {/* Fee Estimates - Visual bar */}
            <div className="bg-navy-dark/40 rounded p-4 border border-gold/10 md:col-span-2">
              <span className="text-[10px] font-display tracking-[0.2em] text-marble/40 block mb-3">FEE ESTIMATES</span>
              <div className="space-y-2.5">
                {feeEntries.map((f) => (
                  <div key={f.label} className="flex items-center gap-3">
                    <span className="text-[10px] text-marble/40 w-14">{f.label}</span>
                    <div className="flex-1 h-2 bg-navy-light/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${f.color} transition-all duration-1000 ease-out`}
                        style={{ width: `${Math.max(8, (f.value / maxFee) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gold-light font-mono w-16 text-right">{f.value} sat/vB</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mempool */}
            <StatCard label="MEMPOOL">
              <AnimatedNumber value={mempool?.count ?? 0} className="font-display text-2xl text-marble" />
              <p className="text-[10px] text-marble/30 mt-1">{((mempool?.vsize ?? 0) / 1e6).toFixed(1)} MvB pending</p>
            </StatCard>
          </div>

          {/* Explorer link */}
          <div className="flex items-center justify-between pt-2 border-t border-gold/10">
            <a
              href={`https://mempool.space/block/${block?.height}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gold/50 hover:text-gold text-xs transition-colors duration-300"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View on mempool.space
            </a>
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

export default GABitcoinNetwork;
