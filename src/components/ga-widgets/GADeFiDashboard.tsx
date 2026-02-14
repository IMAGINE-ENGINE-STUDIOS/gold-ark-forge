import { useEffect, useState, useCallback } from 'react';
import { Layers, TrendingUp, TrendingDown } from 'lucide-react';
import WidgetShell from './WidgetShell';
import AnimatedNumber from './AnimatedNumber';

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

      const sorted = (chainsRes as any[])
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, 10)
        .map((c: any) => ({ name: c.name, tvl: c.tvl, change_1d: c.change_1d ?? 0 }));
      setChains(sorted);
      setTotalTVL(sorted.reduce((acc: number, c: ChainTVL) => acc + c.tvl, 0));

      const topProtocols = (protocolsRes as any[])
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, 10)
        .map((p: any) => ({
          name: p.name,
          tvl: p.tvl,
          chain: p.chain ?? p.chains?.[0] ?? 'Multi',
          change_1d: p.change_1d ?? 0,
          category: p.category ?? '—',
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

  const maxChainTVL = chains.length > 0 ? chains[0].tvl : 1;

  return (
    <WidgetShell icon={Layers} title="DeFi TVL DASHBOARD" source="defillama.com" onRefresh={fetchData}>
      {loading ? (
        <div className="space-y-3">
          <div className="h-16 bg-navy-light/30 rounded skeleton-shimmer" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-navy-light/20 rounded skeleton-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Total TVL */}
          <div className="text-center py-3 rounded bg-navy-dark/30 border border-gold/10">
            <span className="text-[10px] font-display tracking-[0.3em] text-marble/35">TOTAL VALUE LOCKED</span>
            <div className="mt-1">
              <AnimatedNumber value={totalTVL} prefix="$" decimals={0} className="font-display text-3xl text-gold-light" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chains with visual bars */}
            <div>
              <h3 className="text-[10px] font-display tracking-[0.2em] text-marble/40 mb-3">TOP CHAINS</h3>
              <div className="space-y-2">
                {chains.map((chain, i) => {
                  const barWidth = Math.max(4, (chain.tvl / maxChainTVL) * 100);
                  return (
                    <div key={chain.name} className="group relative">
                      {/* Bar background */}
                      <div
                        className="absolute inset-y-0 left-0 bg-gold/[0.04] rounded transition-all duration-700 ease-out"
                        style={{ width: `${barWidth}%` }}
                      />
                      <div className="relative flex items-center justify-between px-3 py-2 rounded hover:bg-gold/5 transition-colors duration-300">
                        <div className="flex items-center gap-2">
                          <span className="text-marble/25 font-mono text-[10px] w-4">{i + 1}</span>
                          <span className="text-marble text-xs font-display tracking-wider">{chain.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-marble/60">{formatTVL(chain.tvl)}</span>
                          {chain.change_1d !== 0 && (
                            <span className={`font-mono text-[10px] flex items-center gap-0.5 ${chain.change_1d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {chain.change_1d >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                              {Math.abs(chain.change_1d).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Protocols */}
            <div>
              <h3 className="text-[10px] font-display tracking-[0.2em] text-marble/40 mb-3">TOP PROTOCOLS</h3>
              <div className="space-y-2">
                {protocols.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between px-3 py-2 rounded hover:bg-gold/5 transition-colors duration-300">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-marble/25 font-mono text-[10px] w-4">{i + 1}</span>
                      <div className="min-w-0">
                        <span className="text-marble text-xs font-display tracking-wider block truncate">{p.name}</span>
                        <span className="text-marble/25 text-[9px]">{p.category} · {p.chain}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-mono text-xs text-marble/60">{formatTVL(p.tvl)}</span>
                      {p.change_1d !== 0 && (
                        <span className={`font-mono text-[10px] ${p.change_1d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
      )}
    </WidgetShell>
  );
};

export default GADeFiDashboard;
