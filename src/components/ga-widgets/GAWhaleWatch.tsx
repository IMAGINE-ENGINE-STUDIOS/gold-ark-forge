import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Fish, ExternalLink, ArrowRight } from 'lucide-react';

interface WhaleTx {
  txid: string;
  value: number; // satoshis
  fee: number;
  size: number;
  weight: number;
}

const formatBTC = (sats: number) => (sats / 1e8).toFixed(4);
const formatUSD = (btc: number, price: number) => `$${(btc * price).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const truncate = (s: string) => `${s.slice(0, 8)}…${s.slice(-6)}`;

const GAWhaleWatch = () => {
  const [txs, setTxs] = useState<WhaleTx[]>([]);
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      const [mempoolRes, priceRes] = await Promise.all([
        fetch('https://mempool.space/api/mempool/recent').then(r => r.json()),
        fetch('https://mempool.space/api/v1/prices').then(r => r.json()),
      ]);

      setBtcPrice(priceRes.USD ?? 0);

      // Sort by value descending, pick top 10 whale txs
      const sorted = (mempoolRes as any[])
        .filter((tx: any) => tx.value > 0)
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 12)
        .map((tx: any) => ({
          txid: tx.txid,
          value: tx.value,
          fee: tx.fee,
          size: tx.size ?? 0,
          weight: tx.weight ?? 0,
        }));

      setTxs(sorted);
      setLastRefresh(new Date());
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

  if (loading) {
    return (
      <div className="rounded-sm border border-gold/20 bg-navy-light/50 p-8 animate-pulse">
        <div className="h-6 w-48 bg-gold/10 rounded mb-4" />
        {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gold/5 rounded mb-2" />)}
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-gold/20 bg-navy-light/50 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10 bg-navy-dark/50">
        <div className="flex items-center gap-3">
          <Fish className="w-5 h-5 text-gold" />
          <span className="font-display text-sm tracking-[0.15em] text-gold-light">WHALE WATCH</span>
          <span className="text-[10px] text-marble/30 font-mono ml-2">mempool recent</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-marble/20">{lastRefresh.toLocaleTimeString()}</span>
          <button onClick={fetchData} className="text-marble/40 hover:text-gold transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {btcPrice > 0 && (
        <div className="px-6 py-2 border-b border-gold/10 bg-navy-dark/30 text-center">
          <span className="text-[10px] font-display tracking-[0.2em] text-marble/30">BTC/USD</span>
          <span className="font-mono text-sm text-gold-light ml-3">${btcPrice.toLocaleString()}</span>
        </div>
      )}

      <div className="divide-y divide-gold/5">
        {txs.map((tx, i) => {
          const btcVal = tx.value / 1e8;
          const isLarge = btcVal >= 1;
          return (
            <div key={tx.txid} className={`flex items-center justify-between px-6 py-3 hover:bg-gold/5 transition-colors ${isLarge ? '' : 'opacity-70'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-marble/20 font-mono text-[10px] w-4">{i + 1}</span>
                <a
                  href={`https://mempool.space/tx/${tx.txid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-marble/50 hover:text-gold transition-colors flex items-center gap-1"
                >
                  {truncate(tx.txid)}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className={`font-mono text-sm ${isLarge ? 'text-gold-light' : 'text-marble/60'}`}>
                    {formatBTC(tx.value)} BTC
                  </span>
                  {btcPrice > 0 && (
                    <span className="text-marble/30 font-mono text-[10px] ml-2">
                      {formatUSD(btcVal, btcPrice)}
                    </span>
                  )}
                </div>
                <ArrowRight className="w-3 h-3 text-gold/30" />
              </div>
            </div>
          );
        })}
      </div>

      {txs.length === 0 && (
        <div className="p-8 text-center text-marble/30 text-sm">No recent mempool transactions</div>
      )}
    </div>
  );
};

export default GAWhaleWatch;
