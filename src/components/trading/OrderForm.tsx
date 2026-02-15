import { useState } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSubmitOrder } from '@/hooks/useBrokerTrading';
import { useToast } from '@/hooks/use-toast';

interface Props {
  connectionId: string;
  defaultSymbol?: string;
}

const OrderForm = ({ connectionId, defaultSymbol = '' }: Props) => {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [qty, setQty] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const submitOrder = useSubmitOrder();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !qty) return;

    try {
      await submitOrder.mutateAsync({
        connectionId,
        symbol: symbol.toUpperCase(),
        qty: parseFloat(qty),
        side,
        orderType,
        limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : undefined,
        stopPrice: orderType === 'stop' ? parseFloat(limitPrice) : undefined,
      });
      toast({
        title: 'Order Submitted',
        description: `${side.toUpperCase()} ${qty} ${symbol.toUpperCase()} — ${orderType}`,
      });
      setQty('');
    } catch (err) {
      toast({
        title: 'Order Failed',
        description: err instanceof Error ? err.message : 'Failed to submit order',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <ArrowUpDown className="w-4 h-4 text-gold" />
        <span className="font-display text-sm tracking-wider text-gold-light">PLACE ORDER</span>
      </div>

      {/* Side toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSide('buy')}
          className={`flex-1 py-2 rounded font-display text-xs tracking-wider transition-all flex items-center justify-center gap-1 ${
            side === 'buy'
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
              : 'bg-navy-light/50 border border-gold/10 text-marble/50'
          }`}
        >
          <TrendingUp className="w-3 h-3" /> BUY
        </button>
        <button
          type="button"
          onClick={() => setSide('sell')}
          className={`flex-1 py-2 rounded font-display text-xs tracking-wider transition-all flex items-center justify-center gap-1 ${
            side === 'sell'
              ? 'bg-red-500/20 border border-red-500/50 text-red-300'
              : 'bg-navy-light/50 border border-gold/10 text-marble/50'
          }`}
        >
          <TrendingDown className="w-3 h-3" /> SELL
        </button>
      </div>

      <Input
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        placeholder="AAPL"
        className="bg-navy-light border-gold/20 text-marble font-mono text-sm uppercase"
        required
      />

      <div className="flex gap-2">
        <Input
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="Qty"
          min="0.001"
          step="any"
          className="bg-navy-light border-gold/20 text-marble font-mono text-sm flex-1"
          required
        />
        <select
          value={orderType}
          onChange={(e) => setOrderType(e.target.value as any)}
          className="bg-navy-light border border-gold/20 text-marble text-xs rounded px-2 font-display tracking-wider"
        >
          <option value="market">MARKET</option>
          <option value="limit">LIMIT</option>
          <option value="stop">STOP</option>
        </select>
      </div>

      {(orderType === 'limit' || orderType === 'stop') && (
        <Input
          type="number"
          value={limitPrice}
          onChange={(e) => setLimitPrice(e.target.value)}
          placeholder={orderType === 'limit' ? 'Limit Price' : 'Stop Price'}
          step="0.01"
          className="bg-navy-light border-gold/20 text-marble font-mono text-sm"
          required
        />
      )}

      <Button
        type="submit"
        disabled={submitOrder.isPending || !symbol || !qty}
        className={`w-full font-display tracking-wider ${
          side === 'buy'
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
            : 'bg-red-600 hover:bg-red-500 text-white'
        }`}
      >
        {submitOrder.isPending ? 'SUBMITTING...' : `${side.toUpperCase()} ${symbol || '...'}`}
      </Button>

      <p className="text-marble/25 text-[10px] text-center">
        Orders execute on your Alpaca account. Gold Arrow does not custody funds.
      </p>
    </form>
  );
};

export default OrderForm;
