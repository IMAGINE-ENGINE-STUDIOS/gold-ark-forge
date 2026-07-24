import { Layers } from 'lucide-react';
import LivePulse from '@/components/ga-widgets/LivePulse';

interface Props {
  price: number;
  symbolLabel: string;
}

const DepthOfMarket = ({ price, symbolLabel }: Props) => {
  if (!price) return null;

  return (
    <div className="bg-navy-light/30 rounded-lg border border-gold/5 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gold/10">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-gold" />
          <span className="text-[10px] font-display tracking-wider text-gold-light">DEPTH OF MARKET</span>
          <LivePulse label="LIVE PRICE" />
        </div>
        <span className="text-[8px] font-mono text-marble/30">{symbolLabel}</span>
      </div>

      <div className="px-3 py-4 text-center">
        <div className="text-[8px] font-display tracking-[0.18em] text-marble/25">CURRENT LIVE MID</div>
        <div className="mt-1 font-mono text-lg text-gold">
          ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="mt-3 text-[9px] font-mono text-marble/35">
          ORDER-BOOK DEPTH FEED UNAVAILABLE
        </div>
      </div>
    </div>
  );
};

export default DepthOfMarket;