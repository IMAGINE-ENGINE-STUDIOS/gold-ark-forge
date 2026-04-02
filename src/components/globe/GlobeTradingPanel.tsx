import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowUpRight, ArrowDownRight, ExternalLink, TrendingUp, Wallet } from 'lucide-react';
import type { GlobeMarker } from '@/data/globeLocations';

interface Props {
  marker: GlobeMarker | null;
  onClose: () => void;
}

const ASSET_MAP: Record<string, { symbol: string; price: number; change: number }> = {
  us: { symbol: 'XOM', price: 108.42, change: 1.2 },
  saudi: { symbol: 'ARAMCO', price: 28.15, change: -0.4 },
  russia: { symbol: 'GAZP', price: 4.82, change: 0.8 },
  brazil: { symbol: 'PBR', price: 14.67, change: 2.1 },
  canada: { symbol: 'CNQ', price: 31.20, change: 0.3 },
  uae: { symbol: 'ADNOC', price: 12.95, change: 0.6 },
  china: { symbol: 'PTR', price: 48.30, change: -0.2 },
  comex: { symbol: 'GC', price: 2345.60, change: 0.8 },
  lme: { symbol: 'HG', price: 4.12, change: -1.1 },
  cme: { symbol: 'CL', price: 78.43, change: 1.5 },
  ice: { symbol: 'BZ', price: 82.10, change: 1.3 },
  shfe: { symbol: 'AU', price: 545.20, change: 0.4 },
  venezuela: { symbol: 'PDVSA', price: 0.12, change: -3.2 },
};

const GlobeTradingPanel = ({ marker, onClose }: Props) => {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [qty, setQty] = useState('1');

  const asset = marker ? ASSET_MAP[marker.id] : null;

  return (
    <div className="absolute top-16 left-4 w-[300px] bg-navy/95 backdrop-blur-md border border-gold/20 rounded-lg z-30 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gold/15">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-gold" />
          <span className="font-display text-sm tracking-[0.15em] text-gold">QUICK TRADE</span>
        </div>
        <button onClick={onClose} className="text-marble/40 hover:text-gold transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {marker && asset ? (
          <>
            {/* Asset info */}
            <div className="bg-navy-light/30 border border-gold/10 rounded p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-display text-xs tracking-wider text-marble/50">{marker.name}</span>
                <span className="text-[10px] font-display tracking-wider text-gold/50">{asset.symbol}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl text-marble">${asset.price.toLocaleString()}</span>
                <span className={`text-xs font-display flex items-center gap-0.5 ${asset.change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {asset.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(asset.change)}%
                </span>
              </div>
            </div>

            {/* Buy/Sell toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSide('buy')}
                className={`py-2 rounded text-xs font-display tracking-wider transition-all ${side === 'buy' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-navy-light/20 border border-gold/10 text-marble/40'}`}
              >
                BUY
              </button>
              <button
                onClick={() => setSide('sell')}
                className={`py-2 rounded text-xs font-display tracking-wider transition-all ${side === 'sell' ? 'bg-red-500/20 border border-red-500/40 text-red-400' : 'bg-navy-light/20 border border-gold/10 text-marble/40'}`}
              >
                SELL
              </button>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-[9px] font-display tracking-[0.2em] text-marble/40 block mb-1">QUANTITY</label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full bg-navy-light/30 border border-gold/15 rounded px-3 py-2 text-sm text-marble font-display focus:outline-none focus:border-gold/40"
              />
            </div>

            {/* Total */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-marble/40 font-display tracking-wider">EST. TOTAL</span>
              <span className="font-display text-marble">${(asset.price * Number(qty || 0)).toLocaleString()}</span>
            </div>

            {/* Execute via Swap */}
            <Link
              to="/swap"
              className={`block w-full text-center py-3 rounded text-sm font-display tracking-wider transition-all ${side === 'buy' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'}`}
            >
              <span className="flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4" />
                EXECUTE IN SWAP
                <ExternalLink className="w-3 h-3" />
              </span>
            </Link>
          </>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="w-8 h-8 text-gold/30 mx-auto mb-3" />
            <p className="text-xs text-marble/40 font-display tracking-wider">SELECT A MARKER TO TRADE</p>
            <p className="text-[10px] text-marble/25 mt-1">Click any asset on the globe</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobeTradingPanel;
