import { useState } from 'react';
import { Bell, BellOff, Plus, Trash2, Volume2, VolumeX, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { requestNotificationPermission } from '@/lib/notificationSound';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';

interface PriceAlertsProps {
  alertsHook: ReturnType<typeof usePriceAlerts>;
}

const PriceAlerts = ({ alertsHook }: PriceAlertsProps) => {
  const {
    alerts, history, addAlert, removeAlert, toggleMute, toggleActive,
    soundEnabled, setSoundEnabled, volume, setVolume,
  } = alertsHook;

  const [newSymbol, setNewSymbol] = useState('BTC');
  const [newCondition, setNewCondition] = useState<'above' | 'below' | 'crosses'>('above');
  const [newThreshold, setNewThreshold] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleAdd = () => {
    const thresh = parseFloat(newThreshold);
    if (!newSymbol.trim() || isNaN(thresh) || thresh <= 0) return;
    addAlert(newSymbol.trim().toUpperCase(), newCondition, thresh);
    setNewThreshold('');
  };

  const handleEnableDesktop = async () => {
    await requestNotificationPermission();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gold" />
          <span className="font-display text-sm tracking-wider text-gold-light">PRICE ALERTS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-1 text-marble/30 hover:text-gold">
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setShowHistory(!showHistory)} className={`p-1 ${showHistory ? 'text-gold' : 'text-marble/30 hover:text-gold'}`}>
            <History className="w-3.5 h-3.5" />
          </button>
          <Button onClick={handleEnableDesktop} className="bg-gold/10 text-gold/60 border border-gold/20 font-display text-[8px] tracking-wider h-6 px-2 hover:bg-gold/20">
            ENABLE DESKTOP
          </Button>
        </div>
      </div>

      {/* Sound volume */}
      {soundEnabled && (
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-marble/25 font-display tracking-wider">VOL</span>
          <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-gold" />
        </div>
      )}

      {/* Create alert */}
      <div className="bg-navy-light/30 rounded-lg p-2.5 border border-gold/10">
        <div className="flex items-center gap-1.5">
          <Input value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)}
            className="bg-navy-light border-gold/15 text-marble font-mono text-[10px] h-7 w-20" placeholder="Symbol" />
          <select value={newCondition} onChange={(e) => setNewCondition(e.target.value as any)}
            className="bg-navy-light border border-gold/10 text-marble text-[10px] rounded px-1.5 py-1 font-mono">
            <option value="above">Above</option>
            <option value="below">Below</option>
            <option value="crosses">Crosses</option>
          </select>
          <Input type="number" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)}
            className="bg-navy-light border-gold/15 text-marble font-mono text-[10px] h-7 w-24" placeholder="Price" />
          <Button onClick={handleAdd} className="bg-gold/20 text-gold border border-gold/30 h-7 px-2">
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Active alerts */}
      {alerts.length > 0 && (
        <div className="space-y-1">
          <span className="text-[8px] font-display tracking-wider text-marble/25">ACTIVE ALERTS ({alerts.filter(a => a.active).length})</span>
          {alerts.map((alert) => (
            <div key={alert.id} className={`flex items-center justify-between p-2 rounded border ${
              alert.active ? 'bg-navy-light/20 border-gold/10' : 'bg-navy-dark/30 border-gold/5 opacity-50'
            }`}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-[10px] font-mono text-gold">{alert.symbol}</span>
                <span className={`text-[8px] px-1 rounded ${
                  alert.condition === 'above' ? 'bg-emerald-500/20 text-emerald-400' :
                  alert.condition === 'below' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                }`}>{alert.condition.toUpperCase()}</span>
                <span className="text-[10px] font-mono text-marble/60">${alert.threshold.toLocaleString()}</span>
                {alert.triggeredAt.length > 0 && (
                  <span className="text-[7px] bg-amber-500/20 text-amber-400 px-1 rounded">{alert.triggeredAt.length}×</span>
                )}
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button onClick={() => toggleActive(alert.id)} className={`p-1 ${alert.active ? 'text-emerald-400' : 'text-marble/25'}`}>
                  <Bell className="w-3 h-3" />
                </button>
                <button onClick={() => toggleMute(alert.id)} className={`p-1 ${alert.muted ? 'text-amber-400' : 'text-marble/25'}`}>
                  <BellOff className="w-3 h-3" />
                </button>
                <button onClick={() => removeAlert(alert.id)} className="p-1 text-marble/25 hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {showHistory && history.length > 0 && (
        <div className="space-y-1">
          <span className="text-[8px] font-display tracking-wider text-marble/25">ALERT HISTORY</span>
          {history.slice(0, 20).map((h) => (
            <div key={h.id} className="flex items-center justify-between p-1.5 bg-navy-dark/30 rounded text-[9px] font-mono">
              <div className="flex items-center gap-2">
                <span className="text-gold">{h.symbol}</span>
                <span className="text-marble/30">{h.condition} ${h.threshold}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-marble/40">${h.price.toFixed(2)}</span>
                <span className="text-marble/20">{new Date(h.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {alerts.length === 0 && !showHistory && (
        <div className="text-center py-4 text-marble/20 text-[10px] font-display tracking-wider">
          NO ALERTS SET · CREATE ONE ABOVE
        </div>
      )}
    </div>
  );
};

export default PriceAlerts;
