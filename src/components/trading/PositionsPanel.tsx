import { useState } from 'react';
import { TrendingUp, TrendingDown, Loader2, ChevronDown } from 'lucide-react';
import { usePositions, type Position } from '@/hooks/useBrokerTrading';

interface Props {
  connectionId: string;
}

const PARTIAL_CLOSE = [0.25, 0.5, 0.75] as const;

const PositionsPanel = ({ connectionId }: Props) => {
  const { data: positions, isLoading } = usePositions(connectionId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-marble/40">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="font-display text-xs tracking-wider">LOADING POSITIONS...</span>
      </div>
    );
  }

  if (!positions?.length) {
    return (
      <div className="text-center py-8 text-marble/30">
        <p className="font-display text-xs tracking-wider">NO OPEN POSITIONS</p>
        <p className="text-[10px] mt-1">Place an order to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-gold" />
        <span className="font-display text-sm tracking-wider text-gold-light">POSITIONS</span>
        <span className="text-marble/30 text-xs ml-auto">{positions.length} open</span>
      </div>

      <div className="space-y-1">
        {positions.map((pos) => {
          const pl = parseFloat(pos.unrealized_pl);
          const plPct = parseFloat(pos.unrealized_plpc) * 100;
          const isPositive = pl >= 0;
          const isExpanded = expandedId === pos.asset_id;

          return (
            <div key={pos.asset_id} className="rounded bg-navy-light/30 border border-gold/5 hover:border-gold/15 transition-colors">
              <button
                onClick={() => setExpandedId(isExpanded ? null : pos.asset_id)}
                className="w-full flex items-center justify-between py-2 px-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-marble font-medium">{pos.symbol}</span>
                  <span className="text-marble/40 text-xs">{parseFloat(pos.qty)} shares</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-mono text-xs text-marble/70">
                      ${parseFloat(pos.market_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isPositive ? '+' : ''}${pl.toFixed(2)} ({plPct.toFixed(2)}%)
                    </div>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-marble/20 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Expanded: Partial Close + Details */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-gold/5 space-y-2">
                  {/* Position Details */}
                  <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
                    <div>
                      <span className="text-marble/25">AVG COST</span>
                      <div className="text-marble/60">${parseFloat(pos.avg_entry_price).toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-marble/25">CURRENT</span>
                      <div className="text-marble/60">${parseFloat(pos.current_price).toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-marble/25">SIDE</span>
                      <div className={pos.side === 'long' ? 'text-emerald-400' : 'text-red-400'}>{pos.side.toUpperCase()}</div>
                    </div>
                  </div>

                  {/* Partial Close Buttons */}
                  <div className="flex gap-1">
                    {PARTIAL_CLOSE.map(pct => (
                      <button
                        key={pct}
                        className="flex-1 py-1.5 rounded text-[8px] font-display tracking-wider bg-red-500/10 text-red-400/70 border border-red-500/15 hover:bg-red-500/20 hover:text-red-300 transition-all"
                      >
                        CLOSE {pct * 100}%
                      </button>
                    ))}
                    <button className="flex-1 py-1.5 rounded text-[8px] font-display tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all">
                      CLOSE ALL
                    </button>
                  </div>

                  {/* SL/TP Inline Edit */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[7px] font-display tracking-wider text-red-400/50 w-6">SL</span>
                      <input
                        type="number"
                        placeholder="Stop Loss"
                        className="flex-1 bg-navy-light/50 border border-red-500/15 text-red-400/70 text-[10px] font-mono rounded px-2 py-1 placeholder:text-marble/15 focus:outline-none focus:border-red-500/40"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[7px] font-display tracking-wider text-emerald-400/50 w-6">TP</span>
                      <input
                        type="number"
                        placeholder="Take Profit"
                        className="flex-1 bg-navy-light/50 border border-emerald-500/15 text-emerald-400/70 text-[10px] font-mono rounded px-2 py-1 placeholder:text-marble/15 focus:outline-none focus:border-emerald-500/40"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PositionsPanel;
