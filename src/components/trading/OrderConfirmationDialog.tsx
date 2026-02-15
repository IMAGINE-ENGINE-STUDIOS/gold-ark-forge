import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Clock, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import SymbolLogo from './SymbolLogo';

export interface OrderConfirmationData {
  symbol: string;
  symbolKey?: string;
  symbolLabel?: string;
  category?: string;
  side: 'buy' | 'sell';
  qty: number;
  orderType: string;
  fillPrice: number;
  limitPrice?: number;
  stopPrice?: number;
  // Paper trading context
  mode: 'paper' | 'live';
  brokerName?: string;
  // Portfolio context
  currentEquity?: number;
  currentCash?: number;
  positionCount?: number;
  // Callbacks
  onConfirm: () => void;
  onModify: () => void;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: OrderConfirmationData | null;
}

const OrderConfirmationDialog = ({ open, onOpenChange, data }: Props) => {
  if (!data) return null;

  const totalCost = data.qty * data.fillPrice;
  const spreadCost = data.fillPrice * 0.0002 * data.qty;
  const commission = data.mode === 'paper' ? 0 : 0; // Broker-dependent
  const totalWithFees = totalCost + spreadCost + commission;

  const newEquity = data.currentEquity ?? 100000;
  const newCash = data.side === 'buy'
    ? (data.currentCash ?? 100000) - totalCost
    : (data.currentCash ?? 100000) + totalCost;
  const newPositions = (data.positionCount ?? 0) + 1;
  const concentration = newEquity > 0 ? (totalCost / newEquity) * 100 : 0;

  // Risk assessment
  const volatility = data.fillPrice > 1000 ? 'Medium' : data.fillPrice > 100 ? 'Low' : 'High';
  const maxLoss = data.stopPrice ? Math.abs(data.fillPrice - data.stopPrice) * data.qty : totalCost;
  const drawdown = newEquity > 0 ? (maxLoss / newEquity) * 100 : 0;

  const warnings: string[] = [];
  if (concentration > 25) warnings.push('>25% CONCENTRATION');
  if (newCash < 0) warnings.push('INSUFFICIENT CASH');
  if (totalCost > (data.currentCash ?? 100000) * 0.5) warnings.push('>50% OF CASH');
  if (drawdown > 10) warnings.push('HIGH DRAWDOWN RISK');

  const isBuy = data.side === 'buy';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-navy border-gold/30 text-marble max-w-lg sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Order Confirmation</DialogTitle>
        </DialogHeader>

        {/* ─── Order Summary Header ─── */}
        <div className="flex items-center gap-3 pb-3 border-b border-gold/10">
          <SymbolLogo symbolKey={data.symbolKey || ''} category={data.category || 'stocks'} ticker={data.symbol} size={32} />
          <div className="flex-1">
            <div className="font-display text-sm tracking-wider text-marble">{data.symbolLabel || data.symbol}</div>
            <div className="text-[10px] font-mono text-marble/40">{data.symbol} · ${data.fillPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="flex gap-2">
            <Badge className={`font-display tracking-wider text-[9px] ${isBuy ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
              {data.side.toUpperCase()}
            </Badge>
            <Badge className="bg-gold/10 text-gold border-gold/20 font-display tracking-wider text-[9px]">
              {data.orderType.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* ─── Cost Breakdown ─── */}
        <div className="space-y-1.5 py-3 border-b border-gold/10">
          <div className="text-[8px] font-display tracking-[0.2em] text-marble/30">COST BREAKDOWN</div>
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-marble/50">{data.qty} × ${data.fillPrice < 10 ? data.fillPrice.toFixed(4) : data.fillPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="text-marble">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-[9px] font-mono">
            <span className="text-marble/30">Est. Spread Cost</span>
            <span className="text-marble/40">${spreadCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[9px] font-mono">
            <span className="text-marble/30">Commission</span>
            <span className="text-marble/40">${commission.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs font-mono pt-1 border-t border-gold/5">
            <span className="text-gold font-display tracking-wider text-[10px]">TOTAL ORDER VALUE</span>
            <span className="text-gold font-bold">${totalWithFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* ─── Position Impact ─── */}
        <div className="space-y-1.5 py-3 border-b border-gold/10">
          <div className="text-[8px] font-display tracking-[0.2em] text-marble/30">POSITION IMPACT</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-navy-light/20 rounded p-2 border border-gold/5">
              <div className="text-[7px] text-marble/25 font-display tracking-wider">CASH REMAINING</div>
              <div className={`text-xs font-mono ${newCash < 0 ? 'text-red-400' : 'text-marble'}`}>${newCash.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="bg-navy-light/20 rounded p-2 border border-gold/5">
              <div className="text-[7px] text-marble/25 font-display tracking-wider">POSITIONS AFTER</div>
              <div className="text-xs font-mono text-marble">{newPositions}</div>
            </div>
            <div className="bg-navy-light/20 rounded p-2 border border-gold/5">
              <div className="text-[7px] text-marble/25 font-display tracking-wider">CONCENTRATION</div>
              <div className={`text-xs font-mono ${concentration > 25 ? 'text-amber-400' : 'text-marble'}`}>{concentration.toFixed(1)}%</div>
            </div>
            <div className="bg-navy-light/20 rounded p-2 border border-gold/5">
              <div className="text-[7px] text-marble/25 font-display tracking-wider">EQUITY</div>
              <div className="text-xs font-mono text-marble">${newEquity.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {warnings.map(w => (
                <Badge key={w} className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[7px] font-display tracking-wider">
                  <AlertTriangle className="w-2.5 h-2.5 mr-1" />{w}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* ─── Risk Assessment ─── */}
        <div className="space-y-1.5 py-3 border-b border-gold/10">
          <div className="text-[8px] font-display tracking-[0.2em] text-marble/30">RISK ASSESSMENT</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-[7px] text-marble/25 font-display tracking-wider">VOLATILITY</div>
              <div className={`text-[10px] font-mono ${volatility === 'High' ? 'text-red-400' : volatility === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}`}>{volatility}</div>
            </div>
            <div className="text-center">
              <div className="text-[7px] text-marble/25 font-display tracking-wider">MAX LOSS</div>
              <div className="text-[10px] font-mono text-red-400">${maxLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="text-center">
              <div className="text-[7px] text-marble/25 font-display tracking-wider">DRAWDOWN</div>
              <div className={`text-[10px] font-mono ${drawdown > 5 ? 'text-red-400' : 'text-marble/50'}`}>{drawdown.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* ─── Execution Details ─── */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Badge className={`text-[8px] font-display tracking-wider ${data.mode === 'paper' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}`}>
              {data.mode === 'paper' ? 'PAPER' : 'LIVE'}
            </Badge>
            <span className="text-[9px] font-mono text-marble/30">{data.mode === 'paper' ? 'SIMULATED' : data.brokerName || 'BROKER'}</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-mono text-marble/20">
            <Clock className="w-3 h-3" /> GTC
          </div>
        </div>

        {/* ─── Action Buttons ─── */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => { data.onConfirm(); onOpenChange(false); }}
            className={`flex-1 font-display tracking-wider text-sm py-5 ${
              isBuy ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            CONFIRM {data.side.toUpperCase()} ${totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </Button>
          <Button variant="outline" onClick={() => { data.onModify(); onOpenChange(false); }}
            className="border-gold/20 text-marble/50 hover:text-marble font-display tracking-wider text-[10px]">
            MODIFY
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}
            className="border-gold/20 text-marble/30 hover:text-marble/50 font-display tracking-wider text-[10px]">
            CANCEL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderConfirmationDialog;
