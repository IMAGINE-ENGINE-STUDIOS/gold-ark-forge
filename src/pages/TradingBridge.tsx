import { useState, useMemo } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Activity, BarChart3, Briefcase, Bot, Shield, Users, ChevronLeft, ChevronRight, Calculator, AlertTriangle, TrendingUp, TrendingDown, Percent, DollarSign, PieChart, Clock, Copy, Share2, Star, Award, Flame, LineChart as LineChartIcon, ArrowUpDown, Menu, X, FlaskConical, Layers, Search } from 'lucide-react';
import { AreaChart, Area, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import ProprietaryChart from '@/components/trading/ProprietaryChart';
import GAMultiTicker from '@/components/ga-widgets/GAMultiTicker';
import GAPriceCards from '@/components/ga-widgets/GAPriceCards';
import GAFearGreed from '@/components/ga-widgets/GAFearGreed';
import GATechnicalGauge from '@/components/ga-widgets/GATechnicalGauge';
import GANewsFeed from '@/components/ga-widgets/GANewsFeed';
import GATopMovers from '@/components/ga-widgets/GATopMovers';
import GAMetalScreener from '@/components/ga-widgets/GAMetalScreener';
import TradingPanel from '@/components/trading/TradingPanel';
import PortfolioSummary from '@/components/trading/PortfolioSummary';
import PositionsPanel from '@/components/trading/PositionsPanel';
import OrderHistory from '@/components/trading/OrderHistory';
import BacktestPanel from '@/components/trading/BacktestPanel';
import DepthOfMarket from '@/components/trading/DepthOfMarket';
import RuleBuilder from '@/components/trading/RuleBuilder';
import { WATCHLIST_CATEGORIES, ALL_SYMBOLS, SYNTHETIC_PRICES } from '@/data/tradingSymbols';
import { useBrokerConnections, usePositions, useOrders, useAlpacaAccount } from '@/hooks/useBrokerTrading';
import ConnectWalletButton from '@/components/wallet/ConnectWalletButton';
import BrokerConnectDialog from '@/components/trading/BrokerConnectDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useOilGasPrices } from '@/hooks/useOilGasData';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// ─── Mobile section tabs ─────────────────────────────────
const MOBILE_TABS = [
  { key: 'chart', label: 'CHART', icon: LineChartIcon },
  { key: 'trade', label: 'TRADE', icon: ArrowUpDown },
  { key: 'portfolio', label: 'PORTFOLIO', icon: Briefcase },
  { key: 'tools', label: 'TOOLS', icon: Bot },
] as const;

type MobileTab = (typeof MOBILE_TABS)[number]['key'];

// ─── Bottom Panel Tabs ───────────────────────────────────
const BOTTOM_TABS = [
  { key: 'positions', label: 'POSITIONS', icon: Briefcase },
  { key: 'orders', label: 'ORDERS', icon: Activity },
  { key: 'backtest', label: 'BACKTEST', icon: FlaskConical },
  { key: 'analytics', label: 'ANALYTICS', icon: BarChart3 },
  { key: 'risk', label: 'RISK', icon: Shield },
  { key: 'strategies', label: 'STRATEGIES', icon: Bot },
  { key: 'social', label: 'SOCIAL', icon: Users },
] as const;

type BottomTab = (typeof BOTTOM_TABS)[number]['key'];

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

const TradingBridge = () => {
  const [activeSymbol, setActiveSymbol] = useState(ALL_SYMBOLS[0]);
  const [bottomTab, setBottomTab] = useState<BottomTab>('positions');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('chart');
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [brokerDialogOpen, setBrokerDialogOpen] = useState(false);
  const { data: connections } = useBrokerConnections();
  const activeConn = connections?.[0];
  const isMobile = useIsMobile();
  const { data: metalPricesData } = useMetalPrices();
  const { data: cryptoDataAll } = useCryptoData(50);
  const { data: oilPricesData } = useOilGasPrices();

  // Filter watchlist by search
  const filteredCategories = useMemo(() => {
    if (!symbolSearch.trim()) return WATCHLIST_CATEGORIES;
    const q = symbolSearch.toLowerCase();
    return WATCHLIST_CATEGORIES.map(cat => ({
      ...cat,
      items: cat.items.filter(s => s.label.toLowerCase().includes(q) || s.ticker.toLowerCase().includes(q) || s.key.includes(q)),
    })).filter(cat => cat.items.length > 0);
  }, [symbolSearch]);

  // Resolve current price for DOM widget
  const activePrice = useMemo(() => {
    const sym = activeSymbol;
    if (sym.cat === 'metals') {
      const metalMap: Record<string, string> = { gold: 'gold', silver: 'silver', platinum: 'platinum', copper: 'gold' };
      const key = metalMap[sym.key];
      return key ? (metalPricesData?.[key]?.price_usd ?? 0) : 0;
    }
    if (sym.cat === 'crypto') {
      const coin = cryptoDataAll?.find(c => c.id === sym.key || c.symbol === sym.key);
      return coin?.current_price ?? 0;
    }
    if (sym.cat === 'energy') {
      const oilMap: Record<string, string> = { oil: 'WTI', brent: 'BRENT', natgas: 'NG', rbob: 'RBOB' };
      const feed = oilPricesData?.find(p => p.symbol === oilMap[sym.key]);
      return feed?.price ?? 0;
    }
    const sp = SYNTHETIC_PRICES[sym.key];
    return sp?.p ?? 100;
  }, [activeSymbol, metalPricesData, cryptoDataAll, oilPricesData]);
  // ─── MOBILE LAYOUT ──────────────────────────────────
  if (isMobile) {
    return (
      <div className="h-screen w-screen flex flex-col bg-navy overflow-hidden">
        {/* Mobile Top Bar */}
        <div className="h-11 flex items-center justify-between px-3 bg-navy-dark border-b border-gold/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Link to="/" className="font-display text-xs tracking-[0.12em] text-gold">GA</Link>
            <span className="text-gold/20">|</span>
            <button
              onClick={() => setWatchlistOpen(!watchlistOpen)}
              className="flex items-center gap-1 text-marble/60 text-[11px] font-mono"
            >
              {watchlistOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
              {activeSymbol.label}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBrokerDialogOpen(true)}
              className="text-[8px] font-mono bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors cursor-pointer"
            >
              {connections?.length || 0} BROKER{connections?.length !== 1 ? 'S' : ''}
            </button>
            <ConnectWalletButton />
          </div>
        </div>

        {/* Mobile Watchlist Overlay */}
        {watchlistOpen && (
          <div className="absolute top-11 left-0 right-0 z-50 bg-navy-dark/98 border-b border-gold/20 max-h-[60vh] overflow-y-auto backdrop-blur-sm">
            <div className="sticky top-0 z-10 p-2 bg-navy-dark border-b border-gold/10">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-marble/30" />
                <input
                  type="text"
                  value={symbolSearch}
                  onChange={(e) => setSymbolSearch(e.target.value)}
                  placeholder="Search symbols..."
                  className="w-full bg-navy-light border border-gold/15 text-marble text-[11px] rounded pl-7 pr-2 py-1.5 font-mono placeholder:text-marble/20"
                />
              </div>
            </div>
            {filteredCategories.map((cat) => (
              <div key={cat.label}>
                <div className="px-3 py-1.5 text-[8px] font-display tracking-[0.2em] text-gold/30 border-b border-gold/5 bg-navy-dark/50 sticky top-[40px]">
                  {cat.label} <span className="text-marble/15">({cat.items.length})</span>
                </div>
                <div className="grid grid-cols-2 gap-px bg-gold/5">
                  {cat.items.map((sym) => (
                    <button
                      key={sym.key}
                      onClick={() => { setActiveSymbol(sym); setWatchlistOpen(false); setSymbolSearch(''); }}
                      className={`px-3 py-2.5 text-left bg-navy transition-colors ${
                        activeSymbol.key === sym.key ? 'bg-gold/10 text-gold' : 'text-marble/60'
                      }`}
                    >
                      <div className="text-[11px] font-mono">{sym.label}</div>
                      <div className="text-[8px] text-marble/25">{sym.ticker}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <div className="p-6 text-center text-marble/20 text-xs font-display">NO SYMBOLS FOUND</div>
            )}
          </div>
        )}

        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto">
          {mobileTab === 'chart' && (
            <div className="flex flex-col">
              <div className="h-[45vh] min-h-[260px]">
                <ProprietaryChart symbolKey={activeSymbol.key} category={activeSymbol.cat} label={activeSymbol.label} onSymbolChange={setActiveSymbol} />
              </div>
              <div className="p-3 space-y-3">
                <GAPriceCards />
                <GAFearGreed />
                <GATopMovers />
              </div>
            </div>
          )}

          {mobileTab === 'trade' && (
            <div className="p-3 space-y-4">
              <TradingPanel activeSymbol={activeSymbol.ticker} />
              <DepthOfMarket price={activePrice} symbolLabel={activeSymbol.label} />
            </div>
          )}

          {mobileTab === 'portfolio' && (
            <div className="p-3 space-y-4">
              <PortfolioSummary />
              {activeConn ? <PositionsPanel connectionId={activeConn.id} /> : <EmptyState text="Connect a broker to view positions" />}
              {activeConn ? <OrderHistory connectionId={activeConn.id} /> : null}
            </div>
          )}

          {mobileTab === 'tools' && (
            <div className="p-3 space-y-4">
              {/* Tool sub-tabs */}
              <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                {BOTTOM_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setBottomTab(tab.key)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-display tracking-wider whitespace-nowrap transition-all flex-shrink-0 ${
                      bottomTab === tab.key
                        ? 'bg-gold/15 text-gold border border-gold/30'
                        : 'text-marble/35 border border-gold/5'
                    }`}
                  >
                    <tab.icon className="w-3 h-3" />
                    {tab.label}
                  </button>
                ))}
              </div>
              {bottomTab === 'positions' && activeConn && <PositionsPanel connectionId={activeConn.id} />}
              {bottomTab === 'positions' && !activeConn && <EmptyState text="Connect a broker to view positions" />}
              {bottomTab === 'orders' && activeConn && <OrderHistory connectionId={activeConn.id} />}
              {bottomTab === 'orders' && !activeConn && <EmptyState text="Connect a broker to view orders" />}
              {bottomTab === 'backtest' && <BacktestPanel />}
              {bottomTab === 'analytics' && <AnalyticsPanel connectionId={activeConn?.id} />}
              {bottomTab === 'risk' && <RiskPanel connectionId={activeConn?.id} />}
              {bottomTab === 'strategies' && <StrategiesPanel />}
              {bottomTab === 'social' && <SocialPanel />}
            </div>
          )}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="flex-shrink-0 border-t border-gold/10 bg-navy-dark flex">
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMobileTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                mobileTab === tab.key ? 'text-gold' : 'text-marble/30'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-[8px] font-display tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>
        <BrokerConnectDialog open={brokerDialogOpen} onOpenChange={setBrokerDialogOpen} />
      </div>
    );
  }

  // ─── DESKTOP LAYOUT ─────────────────────────────────
  return (
    <div className="h-screen w-screen flex flex-col bg-navy overflow-hidden">
      {/* Top Bar */}
      <div className="h-10 flex items-center justify-between px-3 bg-navy-dark border-b border-gold/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-display text-sm tracking-[0.12em] text-gold hover:text-gold-light transition-colors">
            GOLD ARROW
          </Link>
          <span className="text-gold/20">|</span>
          <span className="font-display text-xs tracking-[0.2em] text-marble/40">TRADING BRIDGE</span>
          <button
            onClick={() => setBrokerDialogOpen(true)}
            className="text-[9px] font-mono bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors cursor-pointer"
          >
            {connections?.length || 0} BROKER{connections?.length !== 1 ? 'S' : ''}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/markets" className="text-[10px] font-display tracking-wider text-marble/30 hover:text-gold transition-colors">MARKETS</Link>
          <Link to="/intelligence" className="text-[10px] font-display tracking-wider text-marble/30 hover:text-gold transition-colors">INTELLIGENCE</Link>
          <Link to="/oil-gas" className="text-[10px] font-display tracking-wider text-marble/30 hover:text-gold transition-colors">OIL & GAS</Link>
          <ConnectWalletButton />
        </div>
      </div>

      {/* Live Ticker Strip */}
      <GAMultiTicker />

      {/* Main Terminal Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Watchlist Sidebar */}
        <div className={`flex-shrink-0 border-r border-gold/10 bg-navy-dark/50 transition-all duration-200 ${sidebarCollapsed ? 'w-10' : 'w-48'}`}>
          <div className="flex items-center justify-between px-2 py-2 border-b border-gold/10">
            {!sidebarCollapsed && <span className="text-[9px] font-display tracking-[0.2em] text-marble/30">WATCHLIST</span>}
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-marble/30 hover:text-gold transition-colors p-0.5">
              {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>
          </div>
          {!sidebarCollapsed && (
            <div className="px-2 py-1.5 border-b border-gold/10">
              <div className="relative">
                <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-marble/20" />
                <input
                  type="text"
                  value={symbolSearch}
                  onChange={(e) => setSymbolSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-navy-light border border-gold/10 text-marble text-[10px] rounded pl-6 pr-2 py-1 font-mono placeholder:text-marble/15"
                />
              </div>
            </div>
          )}
          <div className="overflow-y-auto" style={{ height: `calc(100% - ${sidebarCollapsed ? '33px' : '66px'})` }}>
            {filteredCategories.map((cat) => (
              <div key={cat.label}>
                {!sidebarCollapsed && (
                  <div className="px-2 py-1.5 text-[8px] font-display tracking-[0.2em] text-gold/30 border-b border-gold/5 bg-navy-dark/30">
                    {cat.label} <span className="text-marble/10">({cat.items.length})</span>
                  </div>
                )}
                {sidebarCollapsed && (
                  <div className="py-1 text-center text-[7px] font-display tracking-wider text-gold/20 border-b border-gold/5">
                    {cat.label.slice(0, 3)}
                  </div>
                )}
                {cat.items.map((sym) => (
                  <button
                    key={sym.key}
                    onClick={() => setActiveSymbol(sym)}
                    className={`w-full text-left px-2 py-1.5 transition-colors border-b border-gold/5 ${
                      activeSymbol.key === sym.key
                        ? 'bg-gold/10 text-gold'
                        : 'text-marble/50 hover:text-marble hover:bg-navy-light/30'
                    }`}
                  >
                    {sidebarCollapsed ? (
                      <span className="text-[7px] font-mono block text-center">{sym.key.slice(0, 4).toUpperCase()}</span>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono">{sym.label}</span>
                        <span className="text-[7px] text-marble/20">{sym.ticker}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ))}
            {filteredCategories.length === 0 && !sidebarCollapsed && (
              <div className="p-4 text-center text-marble/15 text-[9px] font-display">NO MATCHES</div>
            )}
          </div>
        </div>

        {/* Resizable Main Content */}
        <div className="flex-1">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={65} minSize={30}>
              <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={70} minSize={40}>
                  <div className="h-full">
                    <ProprietaryChart symbolKey={activeSymbol.key} category={activeSymbol.cat} label={activeSymbol.label} onSymbolChange={setActiveSymbol} />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle className="bg-gold/10 hover:bg-gold/30 transition-colors" />
                <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
                  <div className="h-full overflow-y-auto p-2 space-y-4">
                    <TradingPanel activeSymbol={activeSymbol.ticker} />
                    <DepthOfMarket price={activePrice} symbolLabel={activeSymbol.label} />
                    <PortfolioSummary />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-gold/10 hover:bg-gold/30 transition-colors" />

            <ResizablePanel defaultSize={35} minSize={15}>
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-1 px-2 py-1 bg-navy-dark/80 border-b border-gold/10 flex-shrink-0 overflow-x-auto">
                  {BOTTOM_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setBottomTab(tab.key)}
                      className={`flex items-center gap-1 px-3 py-1 rounded text-[10px] font-display tracking-wider transition-all whitespace-nowrap ${
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

                <div className="flex-1 overflow-y-auto p-3">
                  {bottomTab === 'positions' && activeConn && <PositionsPanel connectionId={activeConn.id} />}
                  {bottomTab === 'positions' && !activeConn && <EmptyState text="Connect a broker to view positions" />}
                  {bottomTab === 'orders' && activeConn && <OrderHistory connectionId={activeConn.id} />}
                  {bottomTab === 'orders' && !activeConn && <EmptyState text="Connect a broker to view orders" />}
                  {bottomTab === 'backtest' && <BacktestPanel />}
                  {bottomTab === 'analytics' && <AnalyticsPanel connectionId={activeConn?.id} />}
                  {bottomTab === 'risk' && <RiskPanel connectionId={activeConn?.id} />}
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
          <span className="text-[9px] font-mono text-marble/20">{activeSymbol.label}</span>
          <span className="text-[9px] font-mono text-marble/15 uppercase">{activeSymbol.cat}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono text-marble/20">NON-CUSTODIAL</span>
          <span className="text-[9px] font-mono text-marble/20">GOLD ARROW v3.0</span>
        </div>
      </div>
      <BrokerConnectDialog open={brokerDialogOpen} onOpenChange={setBrokerDialogOpen} />
    </div>
  );
};

// ─── Shared ──────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return <div className="flex items-center justify-center h-32 text-marble/30 text-xs font-display tracking-wider">{text}</div>;
}

const chartTooltipStyle = { background: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', fontSize: 10 };

// ─── Analytics Panel ─────────────────────────────────────

function AnalyticsPanel({ connectionId }: { connectionId?: string }) {
  const { data: positions } = usePositions(connectionId);
  const { data: orders } = useOrders(connectionId);
  const { data: account } = useAlpacaAccount(connectionId);

  const totalTrades = orders?.length || 0;
  const filledOrders = orders?.filter((o) => o.status === 'filled') || [];
  const winningTrades = filledOrders.filter((o) => parseFloat(o.filled_avg_price || '0') > 0);
  const winRate = filledOrders.length > 0 ? Math.round((winningTrades.length / filledOrders.length) * 100) : 0;
  const totalPnL = positions?.reduce((s, p) => s + parseFloat(p.unrealized_pl || '0'), 0) || 0;
  const equity = parseFloat(account?.equity || '0');

  const pnlCurve = useMemo(() => {
    const pts = [];
    let val = equity || 10000;
    for (let i = 30; i >= 0; i--) {
      val += (Math.random() - 0.48) * val * 0.02;
      pts.push({ day: `D-${i}`, value: Math.round(val) });
    }
    return pts;
  }, [equity]);

  const assetBreakdown = useMemo(() => {
    if (!positions?.length) return [{ name: 'Cash', value: 100 }];
    const grouped: Record<string, number> = {};
    positions.forEach((p) => {
      const val = Math.abs(parseFloat(p.market_value || p.qty));
      grouped[p.symbol] = (grouped[p.symbol] || 0) + val;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [positions]);

  const PIE_COLORS = ['hsl(43,72%,50%)', 'hsl(210,6%,67%)', 'hsl(142,71%,45%)', 'hsl(217,91%,60%)', 'hsl(262,83%,58%)', 'hsl(0,84%,60%)'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-gold" />
        <span className="font-display text-sm tracking-wider text-gold-light">TRADE ANALYTICS</span>
      </div>

      {/* KPI Row — responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {[
          { label: 'TOTAL TRADES', value: totalTrades.toString(), icon: Activity, color: 'text-marble' },
          { label: 'FILLED', value: filledOrders.length.toString(), icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'WIN RATE', value: `${winRate}%`, icon: Percent, color: winRate >= 50 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'UNREAL. P&L', value: `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`, icon: DollarSign, color: totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'EQUITY', value: equity > 0 ? `$${equity.toLocaleString()}` : '—', icon: Briefcase, color: 'text-gold' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-navy-light/30 rounded-lg p-2 sm:p-3 border border-gold/5">
            <div className="flex items-center gap-1 mb-1">
              <kpi.icon className="w-3 h-3 text-marble/25" />
              <span className="text-[8px] text-marble/35 font-display tracking-wider">{kpi.label}</span>
            </div>
            <div className={`text-sm sm:text-base font-mono ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row — responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-navy-light/20 rounded-lg p-3 border border-gold/5">
          <div className="text-[9px] font-display tracking-wider text-marble/30 mb-2">EQUITY CURVE (30D)</div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={pnlCurve}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(43,72%,50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(43,72%,50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(213,28%,24%)" />
              <XAxis dataKey="day" tick={{ fontSize: 8, fill: 'hsl(40,25%,96%,0.2)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: 'hsl(40,25%,96%,0.2)' }} axisLine={false} tickLine={false} width={50} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="value" stroke="hsl(43,72%,50%)" fill="url(#eqGrad)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-navy-light/20 rounded-lg p-3 border border-gold/5">
          <div className="text-[9px] font-display tracking-wider text-marble/30 mb-2">ALLOCATION</div>
          <ResponsiveContainer width="100%" height={120}>
            <RechartsPie>
              <Pie data={assetBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={40} innerRadius={20} strokeWidth={0}>
                {assetBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
            </RechartsPie>
          </ResponsiveContainer>
          <div className="mt-1 space-y-0.5">
            {assetBreakdown.slice(0, 4).map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5 text-[8px]">
                <div className="w-2 h-2 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-marble/40 font-mono">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Risk Panel ──────────────────────────────────────────

function RiskPanel({ connectionId }: { connectionId?: string }) {
  const [riskPercent, setRiskPercent] = useState('2');
  const [accountSize, setAccountSize] = useState('10000');
  const [stopDistance, setStopDistance] = useState('5');
  const { data: positions } = usePositions(connectionId);

  const positionSize = useMemo(() => {
    const risk = parseFloat(riskPercent) / 100;
    const acct = parseFloat(accountSize);
    const stop = parseFloat(stopDistance);
    if (!risk || !acct || !stop) return 0;
    return Math.floor((acct * risk) / stop);
  }, [riskPercent, accountSize, stopDistance]);

  const riskAmount = (parseFloat(accountSize) * parseFloat(riskPercent) / 100) || 0;

  const assets = ['XAU', 'BTC', 'SPY', 'WTI', 'TLT'];
  const corrMatrix = assets.map((_, i) =>
    assets.map((_, j) => {
      if (i === j) return 1;
      const v = [0.3, -0.2, 0.15, 0.4, -0.5, 0.6, -0.1, 0.25, -0.3, 0.1][(i * 5 + j) % 10];
      return v;
    })
  );

  const exposureData = useMemo(() => {
    if (!positions?.length) return [
      { name: 'Metals', value: 0, max: 40 },
      { name: 'Crypto', value: 0, max: 20 },
      { name: 'Stocks', value: 0, max: 50 },
      { name: 'Energy', value: 0, max: 30 },
      { name: 'Bonds', value: 0, max: 25 },
    ];
    return [
      { name: 'Metals', value: 25, max: 40 },
      { name: 'Crypto', value: 15, max: 20 },
      { name: 'Stocks', value: 35, max: 50 },
      { name: 'Energy', value: 10, max: 30 },
      { name: 'Bonds', value: 15, max: 25 },
    ];
  }, [positions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-gold" />
        <span className="font-display text-sm tracking-wider text-gold-light">RISK MANAGEMENT</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Position Sizer */}
        <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/5">
          <div className="flex items-center gap-1.5 mb-3">
            <Calculator className="w-3 h-3 text-gold/50" />
            <span className="text-[10px] font-display tracking-wider text-gold/60">POSITION SIZER</span>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-[8px] text-marble/30 font-display tracking-wider">ACCOUNT SIZE ($)</label>
              <Input type="number" value={accountSize} onChange={(e) => setAccountSize(e.target.value)} className="bg-navy-light border-gold/15 text-marble font-mono text-xs h-8 mt-0.5" />
            </div>
            <div>
              <label className="text-[8px] text-marble/30 font-display tracking-wider">RISK PER TRADE (%)</label>
              <Input type="number" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} className="bg-navy-light border-gold/15 text-marble font-mono text-xs h-8 mt-0.5" step="0.5" min="0.1" max="10" />
            </div>
            <div>
              <label className="text-[8px] text-marble/30 font-display tracking-wider">STOP DISTANCE ($)</label>
              <Input type="number" value={stopDistance} onChange={(e) => setStopDistance(e.target.value)} className="bg-navy-light border-gold/15 text-marble font-mono text-xs h-8 mt-0.5" step="0.5" />
            </div>
            <div className="bg-navy-dark/50 rounded p-2 mt-2">
              <div className="text-[8px] text-marble/30 font-display tracking-wider">RECOMMENDED SHARES</div>
              <div className="text-xl font-mono text-gold">{positionSize.toLocaleString()}</div>
              <div className="text-[8px] text-marble/20">Max risk: ${riskAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Exposure Limits */}
        <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/5">
          <div className="flex items-center gap-1.5 mb-3">
            <AlertTriangle className="w-3 h-3 text-gold/50" />
            <span className="text-[10px] font-display tracking-wider text-gold/60">EXPOSURE LIMITS</span>
          </div>
          <div className="space-y-2">
            {exposureData.map((exp) => {
              const pct = exp.max > 0 ? (exp.value / exp.max) * 100 : 0;
              const overLimit = pct > 90;
              return (
                <div key={exp.name}>
                  <div className="flex justify-between text-[8px] mb-0.5">
                    <span className="text-marble/40 font-display tracking-wider">{exp.name.toUpperCase()}</span>
                    <span className={`font-mono ${overLimit ? 'text-red-400' : 'text-marble/30'}`}>{exp.value}% / {exp.max}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-navy-dark/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${overLimit ? 'bg-red-500' : 'bg-gold/60'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Correlation Matrix */}
        <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-1.5 mb-3">
            <PieChart className="w-3 h-3 text-gold/50" />
            <span className="text-[10px] font-display tracking-wider text-gold/60">CORRELATION MATRIX</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-[7px] text-marble/20 font-display p-0.5" />
                  {assets.map((a) => <th key={a} className="text-[7px] text-marble/30 font-mono p-1">{a}</th>)}
                </tr>
              </thead>
              <tbody>
                {assets.map((a, i) => (
                  <tr key={a}>
                    <td className="text-[7px] text-marble/30 font-mono p-1">{a}</td>
                    {corrMatrix[i].map((val, j) => {
                      const color = val === 1 ? 'bg-gold/40' : val > 0.3 ? 'bg-emerald-500/30' : val < -0.3 ? 'bg-red-500/30' : 'bg-navy-light/50';
                      return (
                        <td key={j} className={`text-[7px] font-mono text-center p-1 rounded ${color}`}>
                          {val.toFixed(1)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Strategies Panel ────────────────────────────────────

function StrategiesPanel() {
  const [dcaAsset, setDcaAsset] = useState('BTC-USD');
  const [dcaAmount, setDcaAmount] = useState('100');
  const [dcaFreq, setDcaFreq] = useState('weekly');
  const [gridLow, setGridLow] = useState('');
  const [gridHigh, setGridHigh] = useState('');
  const [gridLevels, setGridLevels] = useState('10');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bot className="w-4 h-4 text-gold" />
        <span className="font-display text-sm tracking-wider text-gold-light">STRATEGY AUTOMATION</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* DCA Bot */}
        <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/5">
          <div className="flex items-center gap-1.5 mb-3">
            <Clock className="w-3 h-3 text-gold/50" />
            <span className="text-[10px] font-display tracking-wider text-gold/60">DCA BOT</span>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-[8px] text-marble/30 font-display tracking-wider">ASSET</label>
              <select value={dcaAsset} onChange={(e) => setDcaAsset(e.target.value)} className="w-full bg-navy-light border border-gold/15 text-marble text-xs rounded px-2 py-2 font-mono mt-0.5">
                <option value="BTC-USD">BTC-USD</option>
                <option value="ETH-USD">ETH-USD</option>
                <option value="GLD">GLD</option>
                <option value="SPY">SPY</option>
              </select>
            </div>
            <div>
              <label className="text-[8px] text-marble/30 font-display tracking-wider">AMOUNT ($)</label>
              <Input type="number" value={dcaAmount} onChange={(e) => setDcaAmount(e.target.value)} className="bg-navy-light border-gold/15 text-marble font-mono text-xs h-8 mt-0.5" />
            </div>
            <div>
              <label className="text-[8px] text-marble/30 font-display tracking-wider">FREQUENCY</label>
              <select value={dcaFreq} onChange={(e) => setDcaFreq(e.target.value)} className="w-full bg-navy-light border border-gold/15 text-marble text-xs rounded px-2 py-2 font-mono mt-0.5">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <Button className="w-full bg-gold/20 text-gold border border-gold/30 font-display text-[10px] tracking-wider hover:bg-gold/30 h-8" disabled>
              ACTIVATE DCA
            </Button>
            <p className="text-[8px] text-marble/20 text-center">Requires active broker connection</p>
          </div>
        </div>

        {/* Grid Trading */}
        <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/5">
          <div className="flex items-center gap-1.5 mb-3">
            <Flame className="w-3 h-3 text-gold/50" />
            <span className="text-[10px] font-display tracking-wider text-gold/60">GRID TRADING</span>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[8px] text-marble/30 font-display tracking-wider">LOW ($)</label>
                <Input type="number" value={gridLow} onChange={(e) => setGridLow(e.target.value)} placeholder="90" className="bg-navy-light border-gold/15 text-marble font-mono text-xs h-8 mt-0.5" />
              </div>
              <div>
                <label className="text-[8px] text-marble/30 font-display tracking-wider">HIGH ($)</label>
                <Input type="number" value={gridHigh} onChange={(e) => setGridHigh(e.target.value)} placeholder="110" className="bg-navy-light border-gold/15 text-marble font-mono text-xs h-8 mt-0.5" />
              </div>
            </div>
            <div>
              <label className="text-[8px] text-marble/30 font-display tracking-wider">GRID LEVELS</label>
              <Input type="number" value={gridLevels} onChange={(e) => setGridLevels(e.target.value)} className="bg-navy-light border-gold/15 text-marble font-mono text-xs h-8 mt-0.5" min="3" max="50" />
            </div>
            {gridLow && gridHigh && (
              <div className="bg-navy-dark/50 rounded p-2 space-y-0.5">
                <div className="text-[8px] text-marble/20">Spacing: ${((parseFloat(gridHigh) - parseFloat(gridLow)) / parseInt(gridLevels)).toFixed(2)} per level</div>
                <div className="text-[8px] text-marble/20">Buy orders: {Math.floor(parseInt(gridLevels) / 2)} | Sell: {Math.ceil(parseInt(gridLevels) / 2)}</div>
              </div>
            )}
            <Button className="w-full bg-gold/20 text-gold border border-gold/30 font-display text-[10px] tracking-wider hover:bg-gold/30 h-8" disabled>
              DEPLOY GRID
            </Button>
          </div>
        </div>

        {/* Custom Rules */}
        <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-1.5 mb-3">
            <Bot className="w-3 h-3 text-gold/50" />
            <span className="text-[10px] font-display tracking-wider text-gold/60">RULE ENGINE</span>
          </div>
          <div className="space-y-2">
            <div className="bg-navy-dark/50 rounded p-2 border border-gold/5">
              <div className="text-[8px] text-gold/40 font-display tracking-wider mb-1">EXAMPLE RULE</div>
              <div className="text-[9px] font-mono text-marble/40 leading-relaxed">
                <span className="text-emerald-400">IF</span> BTC price {'<'} $80,000<br />
                <span className="text-gold">THEN</span> BUY 0.01 BTC<br />
                <span className="text-marble/30">VIA</span> Coinbase
              </div>
            </div>
            <div className="bg-navy-dark/50 rounded p-2 border border-gold/5">
              <div className="text-[8px] text-gold/40 font-display tracking-wider mb-1">EXAMPLE RULE</div>
              <div className="text-[9px] font-mono text-marble/40 leading-relaxed">
                <span className="text-emerald-400">IF</span> XAU/USD {'>'} $5,200<br />
                <span className="text-gold">THEN</span> SELL 10 GLD<br />
                <span className="text-marble/30">VIA</span> Alpaca
              </div>
            </div>
            <Button className="w-full bg-gold/20 text-gold border border-gold/30 font-display text-[10px] tracking-wider hover:bg-gold/30 h-8" disabled>
              CREATE RULE
            </Button>
            <p className="text-[8px] text-marble/20 text-center">IF-THEN rules based on price, indicators, or portfolio triggers</p>
          </div>
        </div>
      </div>

      {/* Visual Rule Builder */}
      <div className="mt-4 pt-4 border-t border-gold/10">
        <RuleBuilder />
      </div>
    </div>
  );
}

// ─── Social Panel ────────────────────────────────────────

function SocialPanel() {
  const mockTraders = [
    { name: 'GoldBull_42', winRate: 72, returns: '+34.2%', followers: 1240, strategy: 'Precious metals momentum', rank: 1 },
    { name: 'CryptoWhale', winRate: 65, returns: '+28.7%', followers: 890, strategy: 'BTC/ETH swing trading', rank: 2 },
    { name: 'OilBaron_TX', winRate: 68, returns: '+21.5%', followers: 560, strategy: 'Energy sector rotation', rank: 3 },
    { name: 'BondKing', winRate: 81, returns: '+12.8%', followers: 2100, strategy: 'Treasury yield curve', rank: 4 },
    { name: 'IndexSurfer', winRate: 59, returns: '+18.3%', followers: 430, strategy: 'S&P momentum + hedging', rank: 5 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-gold" />
        <span className="font-display text-sm tracking-wider text-gold-light">SOCIAL TRADING</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Leaderboard */}
        <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/5">
          <div className="flex items-center gap-1.5 mb-3">
            <Award className="w-3 h-3 text-gold/50" />
            <span className="text-[10px] font-display tracking-wider text-gold/60">TOP TRADERS</span>
          </div>
          <div className="space-y-1.5">
            {mockTraders.map((trader) => (
              <div key={trader.name} className="flex items-center gap-2 p-2 bg-navy-dark/30 rounded border border-gold/5 hover:border-gold/15 transition-colors group">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-mono flex-shrink-0 ${
                  trader.rank === 1 ? 'bg-gold/20 text-gold' : trader.rank === 2 ? 'bg-silver/20 text-silver' : 'bg-navy-light text-marble/30'
                }`}>
                  {trader.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-marble/70 truncate">{trader.name}</span>
                    {trader.rank <= 3 && <Star className="w-2.5 h-2.5 text-gold/50 flex-shrink-0" />}
                  </div>
                  <div className="text-[8px] text-marble/25 truncate">{trader.strategy}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] font-mono text-emerald-400">{trader.returns}</div>
                  <div className="text-[8px] text-marble/25">{trader.winRate}% win</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile + Strategy Sharing */}
        <div className="space-y-3">
          <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/5">
            <div className="flex items-center gap-1.5 mb-3">
              <Share2 className="w-3 h-3 text-gold/50" />
              <span className="text-[10px] font-display tracking-wider text-gold/60">YOUR PROFILE</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: 'RANK', value: '—' },
                { label: 'FOLLOWERS', value: '0' },
                { label: 'COPIERS', value: '0' },
              ].map((s) => (
                <div key={s.label} className="bg-navy-dark/50 rounded p-2 text-center">
                  <div className="text-[7px] text-marble/25 font-display tracking-wider">{s.label}</div>
                  <div className="text-sm font-mono text-marble/40">{s.value}</div>
                </div>
              ))}
            </div>
            <Button className="w-full bg-gold/20 text-gold border border-gold/30 font-display text-[10px] tracking-wider hover:bg-gold/30 h-8" disabled>
              PUBLISH STRATEGY
            </Button>
            <p className="text-[8px] text-marble/20 text-center mt-1.5">Share your performance and let others copy your trades</p>
          </div>

          <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/5">
            <div className="flex items-center gap-1.5 mb-2">
              <Flame className="w-3 h-3 text-gold/50" />
              <span className="text-[10px] font-display tracking-wider text-gold/60">TRENDING STRATEGIES</span>
            </div>
            {['Gold Accumulator (+22% 30d)', 'BTC Grid $85k-$105k', 'Oil Mean Reversion'].map((s) => (
              <div key={s} className="flex items-center justify-between py-1.5 border-b border-gold/5 last:border-0">
                <span className="text-[9px] font-mono text-marble/40">{s}</span>
                <span className="text-[8px] text-gold/40">→</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TradingBridge;
