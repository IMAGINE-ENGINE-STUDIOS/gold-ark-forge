import { useState } from 'react';
import { CalendarDays, Plus, Pause, Play, Trash2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useScheduledOrders, type ScheduledOrder } from '@/hooks/useScheduledOrders';

const SchedulePanel = () => {
  const { orders, addOrder, removeOrder, togglePause } = useScheduledOrders();
  const [showForm, setShowForm] = useState(false);
  const [symbol, setSymbol] = useState('BTC-USD');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [qty, setQty] = useState('');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [recurrence, setRecurrence] = useState<ScheduledOrder['recurrence']>('once');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [goalTarget, setGoalTarget] = useState('');
  const [floorPrice, setFloorPrice] = useState('');

  const handleAdd = () => {
    if (!symbol.trim() || !qty || !date) return;
    addOrder({
      symbol: symbol.trim(),
      side,
      qty: parseFloat(qty),
      orderType,
      scheduledAt: date.toISOString(),
      recurrence,
      endDate: endDate?.toISOString(),
      goalTarget: goalTarget ? parseFloat(goalTarget) : undefined,
      goalCurrent: 0,
      floorPrice: floorPrice ? parseFloat(floorPrice) : undefined,
    });
    setShowForm(false);
    setQty('');
    setGoalTarget('');
    setFloorPrice('');
    setDate(undefined);
    setEndDate(undefined);
  };

  const activeOrders = orders.filter(o => o.status === 'active' || o.status === 'paused');
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'expired');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-gold" />
          <span className="font-display text-sm tracking-wider text-gold-light">ORDER SCHEDULER</span>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-gold/20 text-gold border border-gold/30 font-display text-[10px] tracking-wider hover:bg-gold/30 h-7 px-3">
            <Plus className="w-3 h-3 mr-1" /> SCHEDULE
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/20 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] text-marble/30 font-display tracking-wider">SYMBOL</label>
              <Input value={symbol} onChange={(e) => setSymbol(e.target.value)}
                className="bg-navy-light border-gold/15 text-marble font-mono text-xs h-8 mt-0.5" />
            </div>
            <div>
              <label className="text-[8px] text-marble/30 font-display tracking-wider">SIDE</label>
              <div className="flex gap-1 mt-0.5">
                <button onClick={() => setSide('buy')} className={`flex-1 h-8 rounded text-[10px] font-display tracking-wider ${side === 'buy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-navy-light text-marble/30 border border-gold/10'}`}>BUY</button>
                <button onClick={() => setSide('sell')} className={`flex-1 h-8 rounded text-[10px] font-display tracking-wider ${side === 'sell' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-navy-light text-marble/30 border border-gold/10'}`}>SELL</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] text-marble/30 font-display tracking-wider">QUANTITY</label>
              <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)}
                className="bg-navy-light border-gold/15 text-marble font-mono text-xs h-8 mt-0.5" placeholder="0.01" />
            </div>
            <div>
              <label className="text-[8px] text-marble/30 font-display tracking-wider">ORDER TYPE</label>
              <select value={orderType} onChange={(e) => setOrderType(e.target.value as any)}
                className="w-full bg-navy-light border border-gold/15 text-marble text-xs rounded px-2 py-2 font-mono mt-0.5">
                <option value="market">Market</option>
                <option value="limit">Limit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] text-marble/30 font-display tracking-wider">SCHEDULE DATE</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-mono text-[10px] h-8 mt-0.5 bg-navy-light border-gold/15 text-marble", !date && "text-marble/30")}>
                    <CalendarDays className="w-3 h-3 mr-1" />
                    {date ? format(date, 'MMM d, yyyy') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-navy-dark border-gold/20" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-[8px] text-marble/30 font-display tracking-wider">RECURRENCE</label>
              <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as any)}
                className="w-full bg-navy-light border border-gold/15 text-marble text-xs rounded px-2 py-2 font-mono mt-0.5">
                <option value="once">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {recurrence !== 'once' && (
            <div>
              <label className="text-[8px] text-marble/30 font-display tracking-wider">END DATE (OPTIONAL)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-mono text-[10px] h-8 mt-0.5 bg-navy-light border-gold/15 text-marble", !endDate && "text-marble/30")}>
                    <CalendarDays className="w-3 h-3 mr-1" />
                    {endDate ? format(endDate, 'MMM d, yyyy') : 'No end date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-navy-dark border-gold/20" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Goal & Floor */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] text-marble/30 font-display tracking-wider">GOAL TARGET ($)</label>
              <Input type="number" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)}
                className="bg-navy-light border-gold/15 text-marble font-mono text-xs h-8 mt-0.5" placeholder="Optional" />
            </div>
            <div>
              <label className="text-[8px] text-marble/30 font-display tracking-wider">FLOOR PRICE ($)</label>
              <Input type="number" value={floorPrice} onChange={(e) => setFloorPrice(e.target.value)}
                className="bg-navy-light border-gold/15 text-marble font-mono text-xs h-8 mt-0.5" placeholder="Auto-sell below" />
            </div>
          </div>

          <div className="flex gap-1.5 pt-1">
            <Button onClick={() => setShowForm(false)} variant="ghost" className="text-[10px] text-marble/30 h-7 px-3">CANCEL</Button>
            <Button onClick={handleAdd} className="flex-1 bg-gold/20 text-gold border border-gold/30 font-display text-[10px] tracking-wider hover:bg-gold/30 h-7">
              CREATE SCHEDULE
            </Button>
          </div>
        </div>
      )}

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[8px] font-display tracking-wider text-marble/25">SCHEDULED ({activeOrders.length})</span>
          {activeOrders.map((order) => (
            <div key={order.id} className={`p-2 rounded border ${order.status === 'paused' ? 'bg-navy-dark/30 border-gold/5 opacity-60' : 'bg-navy-light/20 border-gold/10'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-1 rounded ${order.side === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {order.side.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-marble/60">{order.qty} {order.symbol}</span>
                  <span className="text-[8px] text-marble/25">{order.recurrence !== 'once' ? `↻ ${order.recurrence}` : 'once'}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => togglePause(order.id)} className={`p-1 ${order.status === 'paused' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {order.status === 'paused' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  </button>
                  <button onClick={() => removeOrder(order.id)} className="p-1 text-marble/25 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[8px] text-marble/20 font-mono">{format(new Date(order.scheduledAt), 'MMM d, HH:mm')}</span>
                {order.floorPrice && <span className="text-[8px] text-red-400/60">Floor: ${order.floorPrice}</span>}
              </div>
              {order.goalTarget && (
                <div className="mt-1.5">
                  <div className="flex items-center justify-between text-[7px] mb-0.5">
                    <span className="text-marble/25 flex items-center gap-0.5"><Target className="w-2.5 h-2.5" /> GOAL</span>
                    <span className="text-gold/50">${order.goalCurrent?.toFixed(0) || 0} / ${order.goalTarget}</span>
                  </div>
                  <div className="w-full h-1 bg-navy-dark/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gold/60 rounded-full" style={{ width: `${Math.min(((order.goalCurrent || 0) / order.goalTarget) * 100, 100)}%` }} />
                  </div>
                </div>
              )}
              {order.history.length > 0 && (
                <div className="text-[7px] text-marble/15 mt-1">
                  Last: {order.history[order.history.length - 1].result} @ {new Date(order.history[order.history.length - 1].timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Completed */}
      {completedOrders.length > 0 && (
        <div className="space-y-1">
          <span className="text-[8px] font-display tracking-wider text-marble/15">COMPLETED ({completedOrders.length})</span>
          {completedOrders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-1.5 bg-navy-dark/20 rounded opacity-50 text-[9px] font-mono">
              <span className="text-marble/30">{order.side.toUpperCase()} {order.qty} {order.symbol}</span>
              <span className="text-marble/20">{order.status}</span>
            </div>
          ))}
        </div>
      )}

      {orders.length === 0 && !showForm && (
        <div className="text-center py-6 text-marble/20 text-[10px] font-display tracking-wider">
          NO SCHEDULED ORDERS · CLICK SCHEDULE TO START
        </div>
      )}
    </div>
  );
};

export default SchedulePanel;
