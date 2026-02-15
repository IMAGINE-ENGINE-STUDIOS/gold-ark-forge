import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { usePositions, type Position } from '@/hooks/useBrokerTrading';

interface Props {
  connectionId: string;
}

const PositionsPanel = ({ connectionId }: Props) => {
  const { data: positions, isLoading } = usePositions(connectionId);

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

          return (
            <div
              key={pos.asset_id}
              className="flex items-center justify-between py-2 px-3 rounded bg-navy-light/30 border border-gold/5 hover:border-gold/15 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-marble font-medium">{pos.symbol}</span>
                <span className="text-marble/40 text-xs">{parseFloat(pos.qty)} shares</span>
              </div>
              <div className="text-right">
                <div className="font-mono text-xs text-marble/70">
                  ${parseFloat(pos.market_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className={`flex items-center gap-1 text-xs font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? '+' : ''}${pl.toFixed(2)} ({plPct.toFixed(2)}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PositionsPanel;
