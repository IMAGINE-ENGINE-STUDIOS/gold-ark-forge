import { useState } from 'react';
import { ExternalLink, RefreshCw, AlertTriangle, Layers, Fuel } from 'lucide-react';
import { useEthereumWallet } from '@/hooks/useEthereumWallet';

interface Props {
  address: string | null;
  mode?: 'compact' | 'full';
}

const fmtUsd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

const fmtAmount = (n: number, decimals = 4) => {
  if (n === 0) return '0';
  if (n < 0.0001) return n.toExponential(2);
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals });
};

const EthereumNetworkPanel = ({ address, mode = 'full' }: Props) => {
  const { data, isLoading, isError, refetch, isFetching } = useEthereumWallet(address);
  const [showAll, setShowAll] = useState(false);

  if (!address) {
    return (
      <div className="text-[10px] text-marble/40 p-3 border border-gold/10 rounded bg-card/40 font-display tracking-wider">
        Connect a wallet to view Ethereum holdings.
      </div>
    );
  }

  const isCompact = mode === 'compact';
  const containerCls = isCompact
    ? 'bg-card/40 border border-gold/15 rounded p-2.5 space-y-2'
    : 'relative bg-gradient-to-br from-navy-light/40 to-navy/40 border-2 border-gold/30 p-5 space-y-4';

  const visibleTokens = data?.tokens.filter(t => showAll || t.amount > 0) ?? [];

  return (
    <div className={containerCls}>
      {!isCompact && (
        <>
          <div className="ornate-corner ornate-corner-tl" />
          <div className="ornate-corner ornate-corner-tr" />
          <div className="ornate-corner ornate-corner-bl" />
          <div className="ornate-corner ornate-corner-br" />
        </>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">Ξ</span>
          </div>
          <span className={`font-display tracking-[0.2em] text-gold ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
            ETHEREUM · MAINNET
          </span>
          {!isLoading && !isError && (
            <span className="flex items-center gap-1 text-[9px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
            </span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-marble/40 hover:text-gold transition-colors p-1"
          aria-label="Refresh"
        >
          <RefreshCw size={isCompact ? 10 : 12} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {isError && (
        <div className="flex items-center gap-2 text-[10px] text-amber-300 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1.5">
          <AlertTriangle size={12} /> RPC unavailable — retrying.
        </div>
      )}

      {isLoading && !data ? (
        <div className="space-y-1.5">
          <div className="h-4 bg-navy-light/30 rounded skeleton-shimmer" />
          <div className="h-3 bg-navy-light/20 rounded skeleton-shimmer w-2/3" />
        </div>
      ) : data ? (
        <>
          {/* Balance summary */}
          <div className={`flex items-baseline justify-between border-b border-gold/10 pb-2`}>
            <div>
              <div className={`text-marble/40 font-display tracking-wider ${isCompact ? 'text-[8px]' : 'text-[10px]'}`}>
                BALANCE
              </div>
              <div className={`text-gold-light font-display ${isCompact ? 'text-sm' : 'text-2xl'}`}>
                {fmtAmount(data.ethBalance, 6)} <span className="text-marble/50 text-[10px]">ETH</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-marble/40 font-display tracking-wider ${isCompact ? 'text-[8px]' : 'text-[10px]'}`}>
                USD VALUE
              </div>
              <div className={`text-marble font-display ${isCompact ? 'text-sm' : 'text-2xl'}`}>
                {fmtUsd(data.ethUsdValue)}
              </div>
            </div>
          </div>

          {/* Tokens */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className={`text-marble/40 font-display tracking-[0.2em] ${isCompact ? 'text-[8px]' : 'text-[10px]'}`}>
                ERC-20 TOKENS
              </span>
              <button
                onClick={() => setShowAll(s => !s)}
                className={`text-gold/60 hover:text-gold transition-colors ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}
              >
                {showAll ? 'Hide zero' : 'Show all'}
              </button>
            </div>
            {visibleTokens.length === 0 ? (
              <div className={`text-marble/30 italic ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>
                No token balances detected.
              </div>
            ) : (
              <div className="space-y-0.5">
                {visibleTokens.map(t => (
                  <div
                    key={t.meta.symbol}
                    className={`flex items-center justify-between py-1 px-1.5 rounded hover:bg-gold/5 transition-colors ${isCompact ? 'text-[10px]' : 'text-xs'}`}
                  >
                    <span className="font-display tracking-wider text-gold/80 w-12">{t.meta.symbol}</span>
                    <span className="text-marble flex-1 text-right pr-3 font-mono">
                      {fmtAmount(t.amount, t.meta.symbol === 'WBTC' ? 6 : 2)}
                    </span>
                    <span className="text-marble/60 font-mono w-20 text-right">
                      {fmtUsd(t.usdValue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Network telemetry */}
          <div className={`flex items-center justify-between gap-3 border-t border-gold/10 pt-2 ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>
            <div className="flex items-center gap-1 text-marble/50">
              <Layers size={10} className="text-gold/50" />
              <span className="font-display tracking-wider">BLOCK</span>
              <span className="text-marble font-mono">{data.blockNumber?.toLocaleString() ?? '—'}</span>
            </div>
            <div className="flex items-center gap-1 text-marble/50">
              <Fuel size={10} className="text-gold/50" />
              <span className="font-display tracking-wider">GAS</span>
              <span className="text-marble font-mono">{data.gasPriceGwei ?? '—'} Gwei</span>
            </div>
            {data.baseFeeGwei !== null && (
              <div className="text-marble/40 font-mono">base {data.baseFeeGwei}</div>
            )}
          </div>

          {/* Total + explorer */}
          <div className="flex items-center justify-between pt-1">
            <div className={`${isCompact ? 'text-[10px]' : 'text-xs'}`}>
              <span className="text-marble/40 font-display tracking-wider">TOTAL </span>
              <span className="text-gold-light font-display">{fmtUsd(data.totalUsd)}</span>
            </div>
            <a
              href={`https://etherscan.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1 text-gold/60 hover:text-gold transition-colors ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}
            >
              Etherscan <ExternalLink size={10} />
            </a>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default EthereumNetworkPanel;