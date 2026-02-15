import { useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Activity, BarChart3, Briefcase, Bot, Shield, Users, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import TradingViewChart from '@/components/tradingview/TradingViewChart';
import TradingPanel from '@/components/trading/TradingPanel';
import PortfolioSummary from '@/components/trading/PortfolioSummary';
import PositionsPanel from '@/components/trading/PositionsPanel';
import OrderHistory from '@/components/trading/OrderHistory';
import { useBrokerConnections } from '@/hooks/useBrokerTrading';
import ConnectWalletButton from '@/components/wallet/ConnectWalletButton';
import { Link } from 'react-router-dom';

// ─── Symbol List (watchlist) ──────────────────────────────
const WATCHLIST = [
  { key: 'gold', label: 'XAU/USD', tv: 'OANDA:XAUUSD', ticker: 'GLD' },
  { key: 'silver', label: 'XAG/USD', tv: 'OANDA:XAGUSD', ticker: 'SLV' },
  { key: 'platinum', label: 'XPT/USD', tv: 'OANDA:XPTUSD', ticker: 'PPLT' },
  { key: 'bitcoin', label: 'BTC/USD', tv: 'BITSTAMP:BTCUSD', ticker: 'BTC-USD' },
  { key: 'ethereum', label: 'ETH/USD', tv: 'BITSTAMP:ETHUSD', ticker: 'ETH-USD' },
  { key: 'oil', label: 'WTI Crude', tv: 'NYMEX:CL1!', ticker: 'CL' },
  { key: 'sp500', label: 'S&P 500', tv: 'FOREXCOM:SPXUSD', ticker: 'SPY' },
  { key: 'natgas', label: 'Nat Gas', tv: 'NYMEX:NG1!', ticker: 'NG' },
];

// ─── Bottom Panel Tabs ───────────────────────────────────
const BOTTOM_TABS = [
  { key: 'positions', label: 'POSITIONS', icon: Briefcase },
  { key: 'orders', label: 'ORDERS', icon: Activity },
  { key: 'analytics', label: 'ANALYTICS', icon: BarChart3 },
  { key: 'risk', label: 'RISK', icon: Shield },
  { key: 'strategies', label: 'STRATEGIES', icon: Bot },
  { key: 'social', label: 'SOCIAL', icon: Users },
] as const;

type BottomTab = typeof BOTTOM_TABS[number]['key'];

const TradingBridge = () => {
  const [activeSymbol, setActiveSymbol] = useState(WATCHLIST[0]);
  const [bottomTab, setBottomTab] = useState<BottomTab>('positions');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { data: connections } = useBrokerConnections();
  const activeConn = connections?.[0];

  return (
    <div className="h-screen w-screen flex flex-col bg-navy overflow-hidden">
      {/* ─── Top Bar ──────────────────────────────────── */}
      <div className="h-10 flex items-center justify-between px-3 bg-navy-dark border-b border-gold/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-display text-sm tracking-[0.12em] text-gold hover:text-gold-light transition-colors">
            GOLD ARROW
          </Link>
          <span className="text-gold/20">|</span>
          <span className="font-display text-xs tracking-[0.2em] text-marble/40">TRADING BRIDGE</span>
          <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
            {connections?.length || 0} BROKER{connections?.length !== 1 ? 'S' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/markets" className="text-[10px] font-display tracking-wider text-marble/30 hover:text-gold transition-colors">
            MARKETS
          </Link>
          <Link to="/intelligence" className="text-[10px] font-display tracking-wider text-marble/30 hover:text-gold transition-colors">
            INTELLIGENCE
          </Link>
          <ConnectWalletButton />
        </div>
      </div>

      {/* ─── Main Terminal Area ────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Watchlist Sidebar */}
        <div className={`flex-shrink-0 border-r border-gold/10 bg-navy-dark/50 transition-all duration-200 ${sidebarCollapsed ? 'w-10' : 'w-48'}`}>
          <div className="flex items-center justify-between px-2 py-2 border-b border-gold/10">
            {!sidebarCollapsed && (
              <span className="text-[9px] font-display tracking-[0.2em] text-marble/30">WATCHLIST</span>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-marble/30 hover:text-gold transition-colors p-0.5"
            >
              {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>
          </div>
          <div className="overflow-y-auto" style={{ height: 'calc(100% - 33px)' }}>
            {WATCHLIST.map((sym) => (
              <button
                key={sym.key}
                onClick={() => setActiveSymbol(sym)}
                className={`w-full text-left px-2 py-2 transition-colors border-b border-gold/5 ${
                  activeSymbol.key === sym.key
                    ? 'bg-gold/10 text-gold'
                    : 'text-marble/50 hover:text-marble hover:bg-navy-light/30'
                }`}
              >
                {sidebarCollapsed ? (
                  <span className="text-[8px] font-mono block text-center">{sym.key.slice(0, 3).toUpperCase()}</span>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono">{sym.label}</span>
                    <span className="text-[8px] text-marble/25">{sym.ticker}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Resizable Main Content */}
        <div className="flex-1">
          <ResizablePanelGroup direction="vertical">
            {/* Top: Chart + Order Entry */}
            <ResizablePanel defaultSize={65} minSize={30}>
              <ResizablePanelGroup direction="horizontal">
                {/* Chart */}
                <ResizablePanel defaultSize={70} minSize={40}>
                  <div className="h-full p-1">
                    <TradingViewChart symbol={activeSymbol.tv} height={9999} />
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle className="bg-gold/10 hover:bg-gold/30 transition-colors" />

                {/* Right Panel: Order + Portfolio */}
                <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
                  <div className="h-full overflow-y-auto p-2 space-y-4">
                    <TradingPanel activeSymbol={activeSymbol.ticker} />
                    <PortfolioSummary />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-gold/10 hover:bg-gold/30 transition-colors" />

            {/* Bottom Panel: Positions / Orders / Analytics / Risk / Strategies / Social */}
            <ResizablePanel defaultSize={35} minSize={15}>
              <div className="h-full flex flex-col">
                {/* Bottom tabs */}
                <div className="flex items-center gap-1 px-2 py-1 bg-navy-dark/80 border-b border-gold/10 flex-shrink-0">
                  {BOTTOM_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setBottomTab(tab.key)}
                      className={`flex items-center gap-1 px-3 py-1 rounded text-[10px] font-display tracking-wider transition-all ${
                        bottomTab === tab.key
                          ? 'bg-gold/15 text-gold border border-gold/30'
                          : 'text-marble/35 hover:text-marble/60 border border-transparent'
                      }`}
                    >
                      <tab.icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto p-3">
                  {bottomTab === 'positions' && activeConn && <PositionsPanel connectionId={activeConn.id} />}
                  {bottomTab === 'positions' && !activeConn && <EmptyState text="Connect a broker to view positions" />}

                  {bottomTab === 'orders' && activeConn && <OrderHistory connectionId={activeConn.id} />}
                  {bottomTab === 'orders' && !activeConn && <EmptyState text="Connect a broker to view orders" />}

                  {bottomTab === 'analytics' && <AnalyticsPanel />}
                  {bottomTab === 'risk' && <RiskPanel />}
                  {bottomTab === 'strategies' && <StrategiesPanel />}
                  {bottomTab === 'social' && <SocialPanel />}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 flex items-center justify-between px-3 bg-navy-dark border-t border-gold/10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-mono text-marble/30">CONNECTED</span>
          </div>
          <span className="text-[9px] font-mono text-marble/20">{activeSymbol.tv}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono text-marble/20">NON-CUSTODIAL</span>
          <span className="text-[9px] font-mono text-marble/20">GOLD ARROW v2.0</span>
        </div>
      </div>
    </div>
  );
};

// ─── Placeholder Panels (Phase 3 & 4) ───────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-marble/30 text-xs font-display tracking-wider">
      {text}
    </div>
  );
}

function AnalyticsPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-gold" />
        <span className="font-display text-sm tracking-wider text-gold-light">TRADE ANALYTICS</span>
        <span className="text-[9px] bg-gold/10 text-gold/60 px-1.5 py-0.5 rounded font-display tracking-wider">PHASE 4</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'TOTAL TRADES', value: '—', sub: 'All time' },
          { label: 'WIN RATE', value: '—%', sub: 'Last 30d' },
          { label: 'AVG P&L', value: '$—', sub: 'Per trade' },
          { label: 'MAX DRAWDOWN', value: '—%', sub: 'Peak to trough' },
        ].map((s) => (
          <div key={s.label} className="bg-navy-light/30 rounded-lg p-3 border border-gold/5">
            <div className="text-[9px] text-marble/35 font-display tracking-wider">{s.label}</div>
            <div className="text-lg font-mono text-marble mt-1">{s.value}</div>
            <div className="text-[8px] text-marble/20 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="bg-navy-light/20 rounded-lg p-6 border border-gold/5 text-center">
        <BarChart3 className="w-8 h-8 text-gold/15 mx-auto mb-2" />
        <p className="text-marble/30 text-xs font-display tracking-wider">P&L chart, trade journal, and performance reports will appear here once you execute trades.</p>
      </div>
    </div>
  );
}

function RiskPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-gold" />
        <span className="font-display text-sm tracking-wider text-gold-light">RISK MANAGEMENT</span>
        <span className="text-[9px] bg-gold/10 text-gold/60 px-1.5 py-0.5 rounded font-display tracking-wider">PHASE 4</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'POSITION SIZER', desc: 'Calculate optimal position size based on risk tolerance and stop-loss distance.' },
          { label: 'EXPOSURE LIMITS', desc: 'Set max allocation per asset class, sector, or broker to prevent concentration risk.' },
          { label: 'CORRELATION MATRIX', desc: 'Visualize cross-asset correlations to identify hidden portfolio risks.' },
        ].map((card) => (
          <div key={card.label} className="bg-navy-light/30 rounded-lg p-4 border border-gold/5">
            <div className="text-[10px] text-gold/60 font-display tracking-wider mb-2">{card.label}</div>
            <p className="text-[10px] text-marble/30 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StrategiesPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="w-4 h-4 text-gold" />
        <span className="font-display text-sm tracking-wider text-gold-light">STRATEGY AUTOMATION</span>
        <span className="text-[9px] bg-gold/10 text-gold/60 px-1.5 py-0.5 rounded font-display tracking-wider">PHASE 4</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'DCA BOT', desc: 'Dollar-cost average into any asset on a schedule. Set amount, frequency, and broker.', status: 'COMING SOON' },
          { label: 'GRID TRADING', desc: 'Place buy/sell orders at regular intervals within a price range. Ideal for ranging markets.', status: 'COMING SOON' },
          { label: 'CUSTOM RULES', desc: 'Define IF-THEN rules: trigger orders based on price, indicator, or portfolio conditions.', status: 'COMING SOON' },
        ].map((card) => (
          <div key={card.label} className="bg-navy-light/30 rounded-lg p-4 border border-gold/5 relative overflow-hidden">
            <div className="text-[10px] text-gold/60 font-display tracking-wider mb-2">{card.label}</div>
            <p className="text-[10px] text-marble/30 leading-relaxed mb-3">{card.desc}</p>
            <span className="text-[8px] font-display tracking-wider text-marble/20 bg-navy-light/50 px-2 py-0.5 rounded">{card.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SocialPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-gold" />
        <span className="font-display text-sm tracking-wider text-gold-light">SOCIAL TRADING</span>
        <span className="text-[9px] bg-gold/10 text-gold/60 px-1.5 py-0.5 rounded font-display tracking-wider">PHASE 4</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'COPY TRADING', desc: 'Follow top-performing traders and mirror their positions automatically across your connected brokers.' },
          { label: 'STRATEGY SHARING', desc: 'Publish your trading strategies and track performance metrics publicly. Earn reputation.' },
        ].map((card) => (
          <div key={card.label} className="bg-navy-light/30 rounded-lg p-4 border border-gold/5">
            <div className="text-[10px] text-gold/60 font-display tracking-wider mb-2">{card.label}</div>
            <p className="text-[10px] text-marble/30 leading-relaxed">{card.desc}</p>
            <div className="mt-3">
              <span className="text-[8px] font-display tracking-wider text-marble/20 bg-navy-light/50 px-2 py-0.5 rounded">COMING SOON</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TradingBridge;
