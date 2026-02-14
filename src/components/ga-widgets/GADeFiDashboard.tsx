import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Layers, TrendingUp, TrendingDown } from 'lucide-react';

interface ChainTVL {
  name: string;
  tvl: number;
  change_1d: number;
}

interface Protocol {
  name: string;
  tvl: number;
  chain: string;
  change_1d: number;
  category: string;
  symbol: string;
}

const formatTVL = (n: number) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
};

const GADeFiDashboard = () => {
  const [chains, setChains] = useState<ChainTVL[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [totalTVL, setTotalTVL] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [chainsRes, protocolsRes] = await Promise.all([
        fetch('https://api.llama.fi/v2/chains').then(r => r.json()),
        fetch('https://api.llama.fi/protocols').then(r => r.json()),
      ]);

      // Top chains by TVL
      const sorted = (chainsRes as any[])
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, 10)
        .map((c: any) => ({ name: c.name, tvl: c.tvl, change_1d: c.change_1d ?? 0 }));
      setChains(sorted);
      setTotalTVL(sorted.reduce((acc: number, c: ChainTVL) => acc + c.tvl, 0));

      // Top protocols
      const topProtocols = (protocolsRes as any[])
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, 10)
        .map((p: any) => ({
          name: p.name,
          tvl: p.tvl,
          chain: p.chain ?? p.chains?.[0] ?? 'Multi',
          change_1d: p.change_1d ?? 0,
          category: p.category ?? '—',
          symbol: p.symbol ?? '',
        }));
      setProtocols(topProtocols);
    } catch (e) {
      console.error('DeFi Llama fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="rounded-sm border border-gold/20 bg-navy-light/50 p-8 animate-pulse">
        <div className="h-6 w-48 bg-gold/10 rounded mb-4" />
        {[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-gold/5 rounded mb-2" />)}
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-gold/20 bg-navy-light/50 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10 bg-navy-dark/50">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-gold" />
          <span className="font-display text-sm tracking-[0.15em] text-gold-light">DeFi TVL DASHBOARD</span>
          <span className="text-[10px] text-marble/30 font-mono ml-2">defillama.com</span>
        </div>
        <button onClick={fetchData} className="text-marble/40 hover:text-gold transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Total TVL Banner */}
      <div className="px-6 py-4 border-b border-gold/10 bg-navy-dark/30 text-center">
        <span className="text-[10px] font-display tracking-[0.3em] text-marble/40">TOTAL VALUE LOCKED</span>
        <p className="font-display text-3xl text-gold-light mt-1">{formatTVL(totalTVL)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gold/10">
        {/* Chains */}
        <div className="p-4">
          <h3 className="text-[10px] font-display tracking-[0.2em] text-marble/40 mb-3 px-2">TOP CHAINS</h3>
          <div className="space-y-1">
            {chains.map((chain, i) => (
              <div key={chain.name} className="flex items-center justify-between px-2 py-2 rounded hover:bg-gold/5 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-marble/30 font-mono text-[10px] w-4">{i + 1}</span>
                  <span className="text-marble text-xs font-display tracking-wider">{chain.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-marble/60">{formatTVL(chain.tvl)}</span>
                  {chain.change_1d !== 0 && (
                    <span className={`font-mono text-[10px] flex items-center gap-0.5 ${chain.change_1d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {chain.change_1d >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                      {Math.abs(chain.change_1d).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Protocols */}
        <div className="p-4">
          <h3 className="text-[10px] font-display tracking-[0.2em] text-marble/40 mb-3 px-2">TOP PROTOCOLS</h3>
          <div className="space-y-1">
            {protocols.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between px-2 py-2 rounded hover:bg-gold/5 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-marble/30 font-mono text-[10px] w-4">{i + 1}</span>
                  <div className="min-w-0">
                    <span className="text-marble text-xs font-display tracking-wider block truncate">{p.name}</span>
                    <span className="text-marble/30 text-[9px]">{p.category} · {p.chain}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-mono text-xs text-marble/60">{formatTVL(p.tvl)}</span>
                  {p.change_1d !== 0 && (
                    <span className={`font-mono text-[10px] ${p.change_1d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {p.change_1d >= 0 ? '+' : ''}{p.change_1d.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GADeFiDashboard;
