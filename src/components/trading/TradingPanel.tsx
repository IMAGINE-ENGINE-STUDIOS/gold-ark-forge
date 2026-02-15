import { useState } from 'react';
import { Link2, Link2Off, DollarSign, Wallet, Loader2, ChevronDown } from 'lucide-react';
import WidgetShell from '@/components/ga-widgets/WidgetShell';
import { useBrokerConnections, useAlpacaAccount, useDeleteBrokerConnection, BROKER_META, BrokerType } from '@/hooks/useBrokerTrading';
import BrokerConnectDialog from '@/components/trading/BrokerConnectDialog';
import OrderForm from '@/components/trading/OrderForm';
import PositionsPanel from '@/components/trading/PositionsPanel';
import OrderHistory from '@/components/trading/OrderHistory';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { useToast } from '@/hooks/use-toast';

interface Props {
  activeSymbol?: string;
}

const TradingPanel = ({ activeSymbol }: Props) => {
  const [connectOpen, setConnectOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'order' | 'positions' | 'history'>('order');
  const [selectedConnIdx, setSelectedConnIdx] = useState(0);
  const [showConnDropdown, setShowConnDropdown] = useState(false);
  const { isAuthenticated } = useWallet();
  const { data: connections, isLoading: loadingConns } = useBrokerConnections();
  const activeConn = connections?.[selectedConnIdx] || connections?.[0];
  const { data: account, isLoading: loadingAcct } = useAlpacaAccount(activeConn?.id);
  const deleteConn = useDeleteBrokerConnection();
  const { toast } = useToast();

  const brokerLabel = activeConn
    ? BROKER_META[activeConn.broker as BrokerType]?.label || activeConn.broker
    : '';

  if (!isAuthenticated) {
    return (
      <WidgetShell icon={Wallet} title="TRADING" badge="MULTI-BROKER">
        <div className="text-center py-8">
          <Wallet className="w-10 h-10 text-gold/30 mx-auto mb-3" />
          <p className="text-marble/50 text-sm mb-1">Connect your wallet to start trading</p>
          <p className="text-marble/25 text-[10px]">Sign in with MetaMask to access broker integration</p>
        </div>
      </WidgetShell>
    );
  }

  if (loadingConns) {
    return (
      <WidgetShell icon={Wallet} title="TRADING" badge="MULTI-BROKER">
        <div className="flex items-center justify-center py-8 text-marble/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-xs font-display tracking-wider">LOADING...</span>
        </div>
      </WidgetShell>
    );
  }

  if (!activeConn) {
    return (
      <WidgetShell icon={Link2} title="CONNECT BROKER" badge="PHASE 2">
        <div className="text-center py-6">
          <Link2 className="w-10 h-10 text-gold/30 mx-auto mb-3" />
          <p className="text-marble/60 text-sm mb-2">Connect a broker to trade</p>
          <p className="text-marble/30 text-[10px] mb-4">
            Alpaca · Coinbase · Interactive Brokers — Gold Arrow never touches your funds.
          </p>
          <Button
            onClick={() => setConnectOpen(true)}
            className="bg-gold text-navy font-display tracking-wider hover:bg-gold-light"
          >
            CONNECT BROKER
          </Button>
        </div>
        <BrokerConnectDialog open={connectOpen} onOpenChange={setConnectOpen} />
      </WidgetShell>
    );
  }

  const envBadge = activeConn.environment === 'live' || activeConn.environment === 'production' ? 'LIVE' : 'PAPER';

  return (
    <WidgetShell icon={DollarSign} title="TRADING" badge={envBadge}>
      {/* Connection selector + disconnect */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gold/10">
        <div className="relative flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${envBadge === 'LIVE' ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
          {connections && connections.length > 1 ? (
            <button
              onClick={() => setShowConnDropdown(!showConnDropdown)}
              className="text-marble/60 text-xs font-display tracking-wider flex items-center gap-1 hover:text-gold transition-colors"
            >
              {activeConn.label || `${brokerLabel} ${activeConn.environment.toUpperCase()}`}
              <ChevronDown className="w-3 h-3" />
            </button>
          ) : (
            <span className="text-marble/60 text-xs font-display tracking-wider">
              {activeConn.label || `${brokerLabel} ${activeConn.environment.toUpperCase()}`}
            </span>
          )}

          {showConnDropdown && connections && connections.length > 1 && (
            <div className="absolute top-full left-0 mt-1 bg-navy-light border border-gold/20 rounded-lg shadow-lg z-50 min-w-[200px]">
              {connections.map((conn, idx) => {
                const bl = BROKER_META[conn.broker as BrokerType]?.label || conn.broker;
                return (
                  <button
                    key={conn.id}
                    onClick={() => { setSelectedConnIdx(idx); setShowConnDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-display tracking-wider transition-colors ${
                      idx === selectedConnIdx ? 'text-gold bg-gold/10' : 'text-marble/50 hover:text-marble hover:bg-navy-light/80'
                    }`}
                  >
                    {conn.label || `${bl} ${conn.environment.toUpperCase()}`}
                  </button>
                );
              })}
              <div className="border-t border-gold/10">
                <button
                  onClick={() => { setConnectOpen(true); setShowConnDropdown(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-display tracking-wider text-gold/60 hover:text-gold transition-colors"
                >
                  + ADD BROKER
                </button>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={async () => {
            await deleteConn.mutateAsync(activeConn.id);
            toast({ title: 'Broker Disconnected' });
            setSelectedConnIdx(0);
          }}
          className="text-marble/25 hover:text-red-400 transition-colors"
          title="Disconnect"
        >
          <Link2Off className="w-4 h-4" />
        </button>
      </div>

      {account && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-navy-light/30 rounded p-2 text-center">
            <div className="text-[10px] text-marble/40 font-display tracking-wider">EQUITY</div>
            <div className="text-sm font-mono text-marble">${parseFloat(account.equity).toLocaleString()}</div>
          </div>
          <div className="bg-navy-light/30 rounded p-2 text-center">
            <div className="text-[10px] text-marble/40 font-display tracking-wider">CASH</div>
            <div className="text-sm font-mono text-marble">${parseFloat(account.cash).toLocaleString()}</div>
          </div>
          <div className="bg-navy-light/30 rounded p-2 text-center">
            <div className="text-[10px] text-marble/40 font-display tracking-wider">BUYING POWER</div>
            <div className="text-sm font-mono text-gold">${parseFloat(account.buying_power).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['order', 'positions', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 rounded text-xs font-display tracking-wider transition-all ${
              activeTab === tab
                ? 'bg-gold/15 text-gold border border-gold/30'
                : 'text-marble/40 hover:text-marble/60 border border-transparent'
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === 'order' && <OrderForm connectionId={activeConn.id} defaultSymbol={activeSymbol} broker={activeConn.broker as BrokerType} />}
      {activeTab === 'positions' && <PositionsPanel connectionId={activeConn.id} />}
      {activeTab === 'history' && <OrderHistory connectionId={activeConn.id} />}

      <BrokerConnectDialog open={connectOpen} onOpenChange={setConnectOpen} />
    </WidgetShell>
  );
};

export default TradingPanel;
