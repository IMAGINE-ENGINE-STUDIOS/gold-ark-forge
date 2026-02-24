import { toast } from '@/hooks/use-toast';

interface TradeRecapParams {
  side: 'buy' | 'sell';
  qty: number;
  symbol: string;
  price: number;
}

export function showTradeRecap({ side, qty, symbol, price }: TradeRecapParams) {
  const totalCost = qty * price;
  const action = side === 'buy' ? 'bought' : 'sold';
  const priceStr = price < 10 ? price.toFixed(4) : price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  toast({
    title: `📋 Trade Recap: ${side.toUpperCase()} ${symbol}`,
    description: `You ${action} ${qty} ${symbol} at $${priceStr}. Total ${side === 'buy' ? 'cost' : 'proceeds'}: $${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. ${side === 'buy' ? "Watch your position in the BOOK tab." : "Check remaining positions."}`,
  });
}
