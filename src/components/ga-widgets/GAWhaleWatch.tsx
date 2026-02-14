import { useEffect, useState, useCallback } from 'react';
import { Fish, ExternalLink, ArrowRight } from 'lucide-react';
import WidgetShell from './WidgetShell';
import AnimatedNumber from './AnimatedNumber';

interface WhaleTx {
  txid: string;
  value: number;
  fee: number;
}

const formatBTC = (sats: number) => (sats / 1e8).toFixed(4);
const truncate = (s: string) => `${s.slice(0, 8)}…${s.slice(-6)}`;

const GAWhaleWatch = () => {
  const [txs, setTxs] = useState<WhaleTx[]>([]);
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [mempoolRes, priceRes] = await Promise.all([
        fetch('https://mempool.space/api/mempool/recent').then(r => r.json()),
        fetch('https://mempool.space/api/v1/prices').then(r => r.json()),
      ]);

      setBtcPrice(priceRes.USD ?? 0);

      const sorted = (mempoolRes as any[])
        .filter((tx: any) => tx.value > 0)
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 12)
        .map((tx: any) => ({ txid: tx.txid, value: tx.value, fee: tx.fee }));

      setTxs(sorted);
    } catch (e) {
      console.error('Whale watch fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const maxValue = txs.length > 0 ? txs[0].value : 1;

  return (
    <WidgetShell icon={Fish} title="WHALE WATCH" source="mempool recent" onRefresh={fetchData}>
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-navy-light/30 rounded skeleton-shimmer" style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {btcPrice > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-display tracking-[0.2em] text-marble/30">BTC/USD</span>
              <AnimatedNumber value={btcPrice} prefix="$" className="font-mono text-sm text-gold-light" />
            </div>
          )}

          <div className="space-y-1.5">
            {txs.map((tx, i) => {
              const btcVal = tx.value / 1e8;
              const isLarge = btcVal >= 1;
              const barWidth = Math.max(4, (tx.value / maxValue) * 100);

              return (
                <div
                  key={tx.txid}
                  className={`relative group rounded overflow-hidden transition-all duration-300 hover:bg-gold/5 ${isLarge ? '' : 'opacity-60'}`}
                >
                  {/* Background volume bar */}
                  <div
                    className="absolute inset-y-0 left-0 bg-gold/[0.04] transition-all duration-700 ease-out"
                    style={{ width: `${barWidth}%` }}
                  />

                  <div className="relative flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-marble/20 font-mono text-[10px] w-4">{i + 1}</span>
                      {/* Size indicator dot */}
                      <div
                        className="rounded-full flex-shrink-0 transition-all duration-300"
                        style={{
                          width: Math.max(6, Math.min(14, btcVal * 4)),
                          height: Math.max(6, Math.min(14, btcVal * 4)),
                          backgroundColor: isLarge ? 'hsl(43,72%,50%)' : 'hsl(210,6%,40%)',
                          opacity: 0.6,
                        }}
                      />
                      <a
                        href={`https://mempool.space/tx/${tx.txid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-marble/40 hover:text-gold transition-colors duration-300 flex items-center gap-1"
                      >
                        {truncate(tx.txid)}
                        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`font-mono text-sm ${isLarge ? 'text-gold-light' : 'text-marble/50'}`}>
                          {formatBTC(tx.value)} BTC
                        </span>
                        {btcPrice > 0 && (
                          <span className="text-marble/25 font-mono text-[10px] ml-2">
                            ${(btcVal * btcPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        )}
                      </div>
                      <ArrowRight className="w-3 h-3 text-gold/20 group-hover:text-gold/50 transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {txs.length === 0 && (
            <div className="p-8 text-center text-marble/30 text-sm font-display tracking-widest">
              NO RECENT MEMPOOL TRANSACTIONS
            </div>
          )}
        </div>
      )}
    </WidgetShell>
  );
};

export default GAWhaleWatch;
