import { Clock, XCircle, Loader2 } from 'lucide-react';
import { useOrders, useCancelOrder, type AlpacaOrder } from '@/hooks/useBrokerTrading';
import { useToast } from '@/hooks/use-toast';

interface Props {
  connectionId: string;
}

const OrderHistory = ({ connectionId }: Props) => {
  const { data: orders, isLoading } = useOrders(connectionId);
  const cancelOrder = useCancelOrder();
  const { toast } = useToast();

  const handleCancel = async (orderId: string) => {
    try {
      await cancelOrder.mutateAsync({ connectionId, orderId });
      toast({ title: 'Order Cancelled' });
    } catch (err) {
      toast({ title: 'Cancel Failed', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-marble/40">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="font-display text-xs tracking-wider">LOADING ORDERS...</span>
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="text-center py-8 text-marble/30">
        <p className="font-display text-xs tracking-wider">NO ORDERS YET</p>
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'filled': return 'text-emerald-400';
      case 'canceled': case 'expired': return 'text-marble/30';
      case 'rejected': return 'text-red-400';
      default: return 'text-gold';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-gold" />
        <span className="font-display text-sm tracking-wider text-gold-light">ORDER HISTORY</span>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {orders.slice(0, 20).map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between py-2 px-3 rounded bg-navy-light/30 border border-gold/5"
          >
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-display tracking-wider px-1.5 py-0.5 rounded ${
                order.side === 'buy' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
              }`}>
                {order.side.toUpperCase()}
              </span>
              <span className="font-mono text-sm text-marble">{order.symbol}</span>
              <span className="text-marble/40 text-xs">{order.qty} × {order.type}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-display tracking-wider ${statusColor(order.status)}`}>
                {order.status.toUpperCase()}
              </span>
              {(order.status === 'new' || order.status === 'accepted' || order.status === 'pending_new') && (
                <button
                  onClick={() => handleCancel(order.id)}
                  className="text-marble/30 hover:text-red-400 transition-colors"
                  disabled={cancelOrder.isPending}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
