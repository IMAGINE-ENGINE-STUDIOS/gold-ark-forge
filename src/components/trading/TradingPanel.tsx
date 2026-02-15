import { useState } from 'react';
import { Link2, Link2Off, DollarSign, Wallet, Loader2 } from 'lucide-react';
import WidgetShell from '@/components/ga-widgets/WidgetShell';
import { useBrokerConnections, useAlpacaAccount, useDeleteBrokerConnection } from '@/hooks/useBrokerTrading';
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
  const { isAuthenticated } = useWallet();
  const { data: connections, isLoading: loadingConns } = useBrokerConnections();
  const activeConn = connections?.[0];
  const { data: account, isLoading: loadingAcct } = useAlpacaAccount(activeConn?.id);
  const deleteConn = useDeleteBrokerConnection();
  const { toast } = useToast();

  if (!isAuthenticated) {
    return (
      <WidgetShell icon={Wallet} title="TRADING" badge="ALPACA">
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
      <WidgetShell icon={Wallet} title="TRADING" badge="ALPACA">
        <div className="flex items-center justify-center py-8 text-marble/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-xs font-display tracking-wider">LOADING...</span>
        </div>
      </WidgetShell>
    );
  }

  // No connection yet
  if (!activeConn) {
    return (
      <WidgetShell icon={Link2} title="CONNECT BROKER" badge="PHASE 1">
        <div className="text-center py-6">
          <Link2 className="w-10 h-10 text-gold/30 mx-auto mb-3" />
          <p className="text-marble/60 text-sm mb-2">Connect your Alpaca account to trade</p>
          <p className="text-marble/30 text-[10px] mb-4">
            Stocks & crypto via Alpaca — Gold Arrow never touches your funds.
          </p>
          <Button
            onClick={() => setConnectOpen(true)}
            className="bg-gold text-navy font-display tracking-wider hover:bg-gold-light"
          >
            CONNECT ALPACA
          </Button>
        </div>
        <BrokerConnectDialog open={connectOpen} onOpenChange={setConnectOpen} />
      </WidgetShell>
    );
  }

  // Connected — show trading interface
  return (
    <WidgetShell icon={DollarSign} title="TRADING" badge={activeConn.environment === 'paper' ? 'PAPER' : 'LIVE'}>
      {/* Account summary */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gold/10">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${activeConn.environment === 'live' ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
          <span className="text-marble/60 text-xs font-display tracking-wider">
            {activeConn.label || `ALPACA ${activeConn.environment.toUpperCase()}`}
          </span>
        </div>
        <button
          onClick={async () => {
            await deleteConn.mutateAsync(activeConn.id);
            toast({ title: 'Broker Disconnected' });
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

      {activeTab === 'order' && <OrderForm connectionId={activeConn.id} defaultSymbol={activeSymbol} />}
      {activeTab === 'positions' && <PositionsPanel connectionId={activeConn.id} />}
      {activeTab === 'history' && <OrderHistory connectionId={activeConn.id} />}

      <BrokerConnectDialog open={connectOpen} onOpenChange={setConnectOpen} />
    </WidgetShell>
  );
};

export default TradingPanel;
