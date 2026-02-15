import { useState, useEffect } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown, Layers, Target, GitBranch } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSubmitOrder, BrokerType, BROKER_META } from '@/hooks/useBrokerTrading';
import { useToast } from '@/hooks/use-toast';

interface Props {
  connectionId: string;
  defaultSymbol?: string;
  broker?: BrokerType;
}

const SYMBOL_HINTS: Record<string, string> = {
  alpaca: 'AAPL, BTC/USD',
  coinbase: 'BTC-USD, ETH-USD',
  ibkr: 'ES, GC, CL',
};

type OrderMode = 'simple' | 'oco' | 'bracket' | 'trailing_stop';

const ORDER_MODES: { key: OrderMode; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'simple', label: 'SIMPLE', icon: ArrowUpDown, desc: 'Market / Limit / Stop' },
  { key: 'oco', label: 'OCO', icon: GitBranch, desc: 'One-Cancels-Other' },
  { key: 'bracket', label: 'BRACKET', icon: Layers, desc: 'Entry + TP + SL' },
  { key: 'trailing_stop', label: 'TRAIL', icon: Target, desc: 'Trailing Stop' },
];

const OrderForm = ({ connectionId, defaultSymbol = '', broker = 'alpaca' }: Props) => {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [qty, setQty] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [orderMode, setOrderMode] = useState<OrderMode>('simple');

  // OCO fields
  const [ocoLimitPrice, setOcoLimitPrice] = useState('');
  const [ocoStopPrice, setOcoStopPrice] = useState('');

  // Bracket fields
  const [bracketEntryPrice, setBracketEntryPrice] = useState('');
  const [bracketTakeProfit, setBracketTakeProfit] = useState('');
  const [bracketStopLoss, setBracketStopLoss] = useState('');

  // Trailing stop fields
  const [trailPercent, setTrailPercent] = useState('');
  const [trailAmount, setTrailAmount] = useState('');
  const [trailType, setTrailType] = useState<'percent' | 'amount'>('percent');

  const submitOrder = useSubmitOrder();
  const { toast } = useToast();

  useEffect(() => {
    if (defaultSymbol) setSymbol(defaultSymbol);
  }, [defaultSymbol]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !qty) return;

    try {
      if (orderMode === 'simple') {
        await submitOrder.mutateAsync({
          connectionId,
          symbol: symbol.toUpperCase(),
          qty: parseFloat(qty),
          side,
          orderType,
          limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : undefined,
          stopPrice: orderType === 'stop' ? parseFloat(limitPrice) : undefined,
        });
        toast({ title: 'Order Submitted', description: `${side.toUpperCase()} ${qty} ${symbol.toUpperCase()} — ${orderType}` });
      } else if (orderMode === 'oco') {
        // Submit limit leg
        await submitOrder.mutateAsync({
          connectionId,
          symbol: symbol.toUpperCase(),
          qty: parseFloat(qty),
          side,
          orderType: 'limit',
          limitPrice: parseFloat(ocoLimitPrice),
        });
        // Submit stop leg
        await submitOrder.mutateAsync({
          connectionId,
          symbol: symbol.toUpperCase(),
          qty: parseFloat(qty),
          side,
          orderType: 'stop',
          stopPrice: parseFloat(ocoStopPrice),
        });
        toast({ title: 'OCO Orders Submitted', description: `Limit @ $${ocoLimitPrice} / Stop @ $${ocoStopPrice}` });
      } else if (orderMode === 'bracket') {
        // Entry order
        await submitOrder.mutateAsync({
          connectionId,
          symbol: symbol.toUpperCase(),
          qty: parseFloat(qty),
          side,
          orderType: bracketEntryPrice ? 'limit' : 'market',
          limitPrice: bracketEntryPrice ? parseFloat(bracketEntryPrice) : undefined,
        });
        // Take profit (opposite side)
        const oppSide = side === 'buy' ? 'sell' : 'buy';
        await submitOrder.mutateAsync({
          connectionId,
          symbol: symbol.toUpperCase(),
          qty: parseFloat(qty),
          side: oppSide,
          orderType: 'limit',
          limitPrice: parseFloat(bracketTakeProfit),
        });
        // Stop loss (opposite side)
        await submitOrder.mutateAsync({
          connectionId,
          symbol: symbol.toUpperCase(),
          qty: parseFloat(qty),
          side: oppSide,
          orderType: 'stop',
          stopPrice: parseFloat(bracketStopLoss),
        });
        toast({ title: 'Bracket Orders Submitted', description: `Entry + TP @ $${bracketTakeProfit} + SL @ $${bracketStopLoss}` });
      } else if (orderMode === 'trailing_stop') {
        // Submit as a stop order with trail info in the params
        await submitOrder.mutateAsync({
          connectionId,
          symbol: symbol.toUpperCase(),
          qty: parseFloat(qty),
          side,
          orderType: 'stop',
          stopPrice: trailType === 'amount' ? parseFloat(trailAmount) : undefined,
          limitPrice: trailType === 'percent' ? parseFloat(trailPercent) : undefined,
          timeInForce: 'gtc',
        });
        toast({ title: 'Trailing Stop Submitted', description: `Trail ${trailType === 'percent' ? trailPercent + '%' : '$' + trailAmount}` });
      }
      setQty('');
    } catch (err) {
      toast({
        title: 'Order Failed',
        description: err instanceof Error ? err.message : 'Failed to submit order',
        variant: 'destructive',
      });
    }
  };

  const brokerLabel = BROKER_META[broker]?.label || broker;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <ArrowUpDown className="w-4 h-4 text-gold" />
        <span className="font-display text-sm tracking-wider text-gold-light">PLACE ORDER</span>
        <span className="text-[9px] text-marble/30 font-display tracking-wider ml-auto">VIA {brokerLabel.toUpperCase()}</span>
      </div>

      {/* Order Mode Selector */}
      <div className="grid grid-cols-4 gap-1">
        {ORDER_MODES.map((mode) => (
          <button
            key={mode.key}
            type="button"
            onClick={() => setOrderMode(mode.key)}
            className={`py-1.5 rounded text-[9px] font-display tracking-wider transition-all flex flex-col items-center gap-0.5 ${
              orderMode === mode.key
                ? 'bg-gold/15 text-gold border border-gold/30'
                : 'text-marble/30 hover:text-marble/50 border border-transparent bg-navy-light/20'
            }`}
          >
            <mode.icon className="w-3 h-3" />
            {mode.label}
          </button>
        ))}
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

      {/* Symbol */}
      <Input
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        placeholder={SYMBOL_HINTS[broker] || 'Symbol'}
        className="bg-navy-light border-gold/20 text-marble font-mono text-sm uppercase"
        required
      />

      {/* Qty + type (simple mode) */}
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
        {orderMode === 'simple' && (
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as any)}
            className="bg-navy-light border border-gold/20 text-marble text-xs rounded px-2 font-display tracking-wider"
          >
            <option value="market">MARKET</option>
            <option value="limit">LIMIT</option>
            {broker !== 'coinbase' && <option value="stop">STOP</option>}
          </select>
        )}
      </div>

      {/* ─── Simple mode price fields ─── */}
      {orderMode === 'simple' && (orderType === 'limit' || orderType === 'stop') && (
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

      {/* ─── OCO fields ─── */}
      {orderMode === 'oco' && (
        <div className="space-y-2 p-2 rounded bg-navy-light/20 border border-gold/5">
          <div className="text-[9px] font-display tracking-wider text-gold/50 mb-1">ONE-CANCELS-OTHER</div>
          <Input
            type="number"
            value={ocoLimitPrice}
            onChange={(e) => setOcoLimitPrice(e.target.value)}
            placeholder="Limit Price (take profit)"
            step="0.01"
            className="bg-navy-light border-gold/20 text-marble font-mono text-sm"
            required
          />
          <Input
            type="number"
            value={ocoStopPrice}
            onChange={(e) => setOcoStopPrice(e.target.value)}
            placeholder="Stop Price (stop loss)"
            step="0.01"
            className="bg-navy-light border-gold/20 text-marble font-mono text-sm"
            required
          />
          <p className="text-[9px] text-marble/25">When one leg fills, manually cancel the other.</p>
        </div>
      )}

      {/* ─── Bracket fields ─── */}
      {orderMode === 'bracket' && (
        <div className="space-y-2 p-2 rounded bg-navy-light/20 border border-gold/5">
          <div className="text-[9px] font-display tracking-wider text-gold/50 mb-1">BRACKET ORDER (Entry + TP + SL)</div>
          <Input
            type="number"
            value={bracketEntryPrice}
            onChange={(e) => setBracketEntryPrice(e.target.value)}
            placeholder="Entry Price (blank = market)"
            step="0.01"
            className="bg-navy-light border-gold/20 text-marble font-mono text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              value={bracketTakeProfit}
              onChange={(e) => setBracketTakeProfit(e.target.value)}
              placeholder="Take Profit"
              step="0.01"
              className="bg-navy-light border-gold/20 text-emerald-400 font-mono text-sm"
              required
            />
            <Input
              type="number"
              value={bracketStopLoss}
              onChange={(e) => setBracketStopLoss(e.target.value)}
              placeholder="Stop Loss"
              step="0.01"
              className="bg-navy-light border-gold/20 text-red-400 font-mono text-sm"
              required
            />
          </div>
          <p className="text-[9px] text-marble/25">Submits 3 orders: entry, take-profit limit, and stop-loss.</p>
        </div>
      )}

      {/* ─── Trailing Stop fields ─── */}
      {orderMode === 'trailing_stop' && (
        <div className="space-y-2 p-2 rounded bg-navy-light/20 border border-gold/5">
          <div className="text-[9px] font-display tracking-wider text-gold/50 mb-1">TRAILING STOP</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTrailType('percent')}
              className={`flex-1 py-1.5 rounded text-[9px] font-display tracking-wider ${
                trailType === 'percent' ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-navy-light/50 text-marble/30 border border-gold/10'
              }`}
            >
              % TRAIL
            </button>
            <button
              type="button"
              onClick={() => setTrailType('amount')}
              className={`flex-1 py-1.5 rounded text-[9px] font-display tracking-wider ${
                trailType === 'amount' ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-navy-light/50 text-marble/30 border border-gold/10'
              }`}
            >
              $ TRAIL
            </button>
          </div>
          {trailType === 'percent' ? (
            <Input
              type="number"
              value={trailPercent}
              onChange={(e) => setTrailPercent(e.target.value)}
              placeholder="Trail %  (e.g. 2.5)"
              step="0.1"
              min="0.1"
              className="bg-navy-light border-gold/20 text-marble font-mono text-sm"
              required
            />
          ) : (
            <Input
              type="number"
              value={trailAmount}
              onChange={(e) => setTrailAmount(e.target.value)}
              placeholder="Trail $  (e.g. 5.00)"
              step="0.01"
              min="0.01"
              className="bg-navy-light border-gold/20 text-marble font-mono text-sm"
              required
            />
          )}
          <p className="text-[9px] text-marble/25">Stop follows price at a fixed distance. Locks in gains as price moves favorably.</p>
        </div>
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
        Orders execute on your {brokerLabel} account. Gold Arrow does not custody funds.
      </p>
    </form>
  );
};

export default OrderForm;
