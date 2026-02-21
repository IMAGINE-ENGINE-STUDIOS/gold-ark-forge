import { useState, useMemo } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Activity, BarChart3, Briefcase, Bot, Shield, Users, ChevronLeft, ChevronRight, Calculator, AlertTriangle, TrendingUp, TrendingDown, Percent, DollarSign, PieChart, Clock, Copy, Share2, Star, Award, Flame, LineChart as LineChartIcon, ArrowUpDown, Menu, X, FlaskConical, Layers, Search, CalendarDays, Bell, RotateCcw, ChevronDown, Zap, BookOpen } from 'lucide-react';
import { AreaChart, Area, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import GALiveChart from '@/components/trading/GALiveChart';
import GAMultiTicker from '@/components/ga-widgets/GAMultiTicker';
import GAPriceCards from '@/components/ga-widgets/GAPriceCards';

import GATechnicalGauge from '@/components/ga-widgets/GATechnicalGauge';
import GANewsFeed from '@/components/ga-widgets/GANewsFeed';
import GATopMovers from '@/components/ga-widgets/GATopMovers';
import GAMetalScreener from '@/components/ga-widgets/GAMetalScreener';
import GAMarketPulse from '@/components/ga-widgets/GAMarketPulse';
import GACrossAssetDashboard from '@/components/ga-widgets/GACrossAssetDashboard';
import GAAssetOverview from '@/components/ga-widgets/GAAssetOverview';
import GAMiniCharts from '@/components/ga-widgets/GAMiniCharts';
import GAVolatilityMatrix from '@/components/ga-widgets/GAVolatilityMatrix';
import GAGoldRatio from '@/components/ga-widgets/GAGoldRatio';
import GABullionHeatmap from '@/components/ga-widgets/GABullionHeatmap';
import GAMarketHeatmap from '@/components/ga-widgets/GAMarketHeatmap';
import GACryptoHeatmap from '@/components/ga-widgets/GACryptoHeatmap';
import GAForexMatrix from '@/components/ga-widgets/GAForexMatrix';
import GAEconomicCalendar from '@/components/ga-widgets/GAEconomicCalendar';
import GAMarketQuotes from '@/components/ga-widgets/GAMarketQuotes';
import GAMarketSummary from '@/components/ga-widgets/GAMarketSummary';
import GATimeSales from '@/components/ga-widgets/GATimeSales';
import GATradeJournal from '@/components/ga-widgets/GATradeJournal';
import GAPerformanceDashboard from '@/components/ga-widgets/GAPerformanceDashboard';
import GATradingSessions from '@/components/ga-widgets/GATradingSessions';
import GAPipCalculator from '@/components/ga-widgets/GAPipCalculator';
import GAMarginCalc from '@/components/ga-widgets/GAMarginCalc';
import OneClickTrading from '@/components/trading/OneClickTrading';
import TradingPanel from '@/components/trading/TradingPanel';
import PortfolioSummary from '@/components/trading/PortfolioSummary';
import PositionsPanel from '@/components/trading/PositionsPanel';
import OrderHistory from '@/components/trading/OrderHistory';
import BacktestPanel from '@/components/trading/BacktestPanel';
import DepthOfMarket from '@/components/trading/DepthOfMarket';
import RuleBuilder from '@/components/trading/RuleBuilder';
import SchedulePanel from '@/components/trading/SchedulePanel';
import PriceAlerts from '@/components/trading/PriceAlerts';
import RiskLimits from '@/components/trading/RiskLimits';
import { WATCHLIST_CATEGORIES, ALL_SYMBOLS, SYNTHETIC_PRICES } from '@/data/tradingSymbols';
import SymbolLogo from '@/components/trading/SymbolLogo';
import { useBrokerConnections, usePositions, useOrders, useAlpacaAccount } from '@/hooks/useBrokerTrading';
import ConnectWalletButton from '@/components/wallet/ConnectWalletButton';
import BrokerConnectDialog from '@/components/trading/BrokerConnectDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useOilGasPrices } from '@/hooks/useOilGasData';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { useRiskMonitor } from '@/hooks/useRiskMonitor';
import { usePaperTrading } from '@/hooks/usePaperTrading';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import OrderConfirmationDialog, { OrderConfirmationData } from '@/components/trading/OrderConfirmationDialog';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

// ─── Collapsible Section Component ───────────────────────
function CollapsibleSection({ 
  title, 
  icon: Icon, 
  badge, 
  defaultOpen = false, 
  children 
}: { 
  title: string; 
  icon: React.ElementType; 
  badge?: string; 
  defaultOpen?: boolean; 
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-gold/10 bg-navy-dark/40 overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gold/5 transition-colors border-l-2 border-l-gold/40">
            <Icon className="w-3.5 h-3.5 text-gold/60 flex-shrink-0" />
            <span className="font-display text-[10px] tracking-[0.15em] text-marble/70 flex-1 text-left">{title}</span>
            {badge && (
              <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-gold/10 text-gold/60 border border-gold/15">{badge}</span>
            )}
            <ChevronDown className={`w-3 h-3 text-marble/30 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

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
  { key: 'trade', label: 'TRADE', icon: ArrowUpDown },
  { key: 'book', label: 'BOOK', icon: Briefcase },
  { key: 'automate', label: 'AUTOMATE', icon: CalendarDays },
  { key: 'backtest', label: 'BACKTEST', icon: FlaskConical },
  { key: 'market', label: 'MARKET', icon: Layers },
  { key: 'analytics', label: 'ANALYTICS', icon: BarChart3 },
  { key: 'risk', label: 'RISK', icon: Shield },
  { key: 'strategies', label: 'STRATEGIES', icon: Bot },
  { key: 'social', label: 'SOCIAL', icon: Users },
] as const;

type BottomTab = (typeof BOTTOM_TABS)[number]['key'];

// ─── Paper Trading Panel ─────────────────────────────────
function PaperTradingPanel({ activeSymbol, activePrice, paper }: {
  activeSymbol: { key: string; label: string; ticker: string; cat: string };
  activePrice: number;
  paper: ReturnType<typeof usePaperTrading>;
}) {
  const [qty, setQty] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop' | 'stop_limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [confirmData, setConfirmData] = useState<OrderConfirmationData | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { toast } = useToast();

  const parsedQty = parseFloat(qty) || 0;
  const fillPrice = orderType === 'market' ? activePrice : (parseFloat(limitPrice) || activePrice);
  const totalCost = parsedQty * fillPrice;
  const portfolioPct = paper.account.equity > 0 ? (totalCost / paper.account.equity) * 100 : 0;
  const remainingCash = side === 'buy' ? paper.account.cash - totalCost : paper.account.cash + totalCost;
  const spread = activePrice * 0.0002;

  const setQtyPercent = (pct: number) => {
    if (activePrice <= 0) return;
    const maxQty = (paper.account.cash * pct) / activePrice;
    setQty(maxQty < 1 ? maxQty.toFixed(4) : Math.floor(maxQty).toString());
  };

  const executeOrder = () => {
    try {
      paper.submitOrder({
        symbol: activeSymbol.ticker,
        side,
        qty: parseFloat(qty),
        type: orderType === 'stop_limit' ? 'limit' : (orderType === 'stop' ? 'stop' : orderType),
        price: activePrice,
        limitPrice: orderType === 'limit' || orderType === 'stop_limit' ? parseFloat(limitPrice) : undefined,
      });
      toast({
        title: `Paper ${side.toUpperCase()} Filled`,
        description: `${qty} ${activeSymbol.ticker} @ $${activePrice.toLocaleString()}`,
      });
      setQty('');
    } catch (err) {
      toast({ title: 'Order Failed', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qty || !activePrice) return;
    setConfirmData({
      symbol: activeSymbol.ticker,
      symbolKey: activeSymbol.key,
      symbolLabel: activeSymbol.label,
      category: activeSymbol.cat,
      side,
      qty: parsedQty,
      orderType,
      fillPrice,
      limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : undefined,
      stopPrice: orderType === 'stop' ? parseFloat(stopPrice) : undefined,
      mode: 'paper',
      currentEquity: paper.account.equity,
      currentCash: paper.account.cash,
      positionCount: paper.positions.length,
      onConfirm: executeOrder,
      onModify: () => {},
    });
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-3">
      {/* Paper Account Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-navy-light/30 rounded-lg p-2 text-center border border-gold/5">
          <div className="text-[7px] text-marble/30 font-display tracking-wider">EQUITY</div>
          <div className="text-xs font-mono text-marble">${paper.account.equity.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-navy-light/30 rounded-lg p-2 text-center border border-gold/5">
          <div className="text-[7px] text-marble/30 font-display tracking-wider">CASH</div>
          <div className="text-xs font-mono text-marble">${paper.account.cash.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-navy-light/30 rounded-lg p-2 text-center border border-gold/5">
          <div className="text-[7px] text-marble/30 font-display tracking-wider">P&L</div>
          <div className={`text-xs font-mono ${paper.account.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {paper.account.totalPnl >= 0 ? '+' : ''}${paper.account.totalPnl.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Bid/Ask Spread Indicator */}
      {activePrice > 0 && (
        <div className="flex items-center justify-between bg-navy-light/20 rounded px-2 py-1 border border-gold/5">
          <span className="text-[8px] font-mono text-emerald-400/70">BID: ${(activePrice - spread / 2).toFixed(activePrice < 10 ? 4 : 2)}</span>
          <span className="text-[7px] font-mono text-marble/20">SPREAD: ${spread.toFixed(activePrice < 10 ? 4 : 2)}</span>
          <span className="text-[8px] font-mono text-red-400/70">ASK: ${(activePrice + spread / 2).toFixed(activePrice < 10 ? 4 : 2)}</span>
        </div>
      )}

      {/* Order Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <button type="button" onClick={() => setSide('buy')}
            className={`flex-1 py-2 rounded font-display text-xs tracking-wider transition-all flex items-center justify-center gap-1 ${
              side === 'buy' ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300' : 'bg-navy-light/50 border border-gold/10 text-marble/50'
            }`}>
            <TrendingUp className="w-3 h-3" /> BUY
          </button>
          <button type="button" onClick={() => setSide('sell')}
            className={`flex-1 py-2 rounded font-display text-xs tracking-wider transition-all flex items-center justify-center gap-1 ${
              side === 'sell' ? 'bg-red-500/20 border border-red-500/50 text-red-300' : 'bg-navy-light/50 border border-gold/10 text-marble/50'
            }`}>
            <TrendingDown className="w-3 h-3" /> SELL
          </button>
        </div>

        {/* Order Type */}
        <div className="flex gap-1">
          {(['market', 'limit', 'stop', 'stop_limit'] as const).map(t => (
            <button key={t} type="button" onClick={() => setOrderType(t)}
              className={`flex-1 py-1 rounded text-[8px] font-display tracking-wider transition-all ${
                orderType === t ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-navy-light/30 text-marble/30 border border-gold/5'
              }`}>
              {t === 'stop_limit' ? 'STP-LMT' : t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Quantity + Quick Size */}
        <div>
          <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Quantity" min="0.001" step="any"
            className="bg-navy-light border-gold/20 text-marble font-mono text-sm" required />
          <div className="flex gap-1 mt-1">
            {[0.25, 0.5, 0.75, 1].map(pct => (
              <button key={pct} type="button" onClick={() => setQtyPercent(pct)}
                className="flex-1 py-0.5 rounded text-[7px] font-mono text-marble/30 bg-navy-light/30 border border-gold/5 hover:text-gold hover:border-gold/20 transition-colors">
                {pct === 1 ? 'MAX' : `${pct * 100}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Limit/Stop Price */}
        {(orderType === 'limit' || orderType === 'stop_limit') && (
          <div className="relative">
            <Input type="number" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder="Limit Price" step="0.01"
              className="bg-navy-light border-gold/20 text-marble font-mono text-sm pr-14" required />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
              <button type="button" onClick={() => setLimitPrice(p => (parseFloat(p || String(activePrice)) - (activePrice < 10 ? 0.01 : 1)).toFixed(activePrice < 10 ? 4 : 2))}
                className="w-5 h-5 rounded bg-navy-light/80 text-marble/40 hover:text-marble text-xs border border-gold/10">−</button>
              <button type="button" onClick={() => setLimitPrice(p => (parseFloat(p || String(activePrice)) + (activePrice < 10 ? 0.01 : 1)).toFixed(activePrice < 10 ? 4 : 2))}
                className="w-5 h-5 rounded bg-navy-light/80 text-marble/40 hover:text-marble text-xs border border-gold/10">+</button>
            </div>
          </div>
        )}
        {(orderType === 'stop' || orderType === 'stop_limit') && (
          <Input type="number" value={stopPrice} onChange={(e) => setStopPrice(e.target.value)} placeholder="Stop Price" step="0.01"
            className="bg-navy-light border-gold/20 text-marble font-mono text-sm" required />
        )}

        {/* Order Cost Breakdown */}
        {parsedQty > 0 && activePrice > 0 && (
          <div className="bg-navy-dark/50 rounded-lg p-2 space-y-1 border border-gold/5">
            <div className="flex justify-between text-[9px] font-mono">
              <span className="text-marble/40">{parsedQty} × ${fillPrice < 10 ? fillPrice.toFixed(4) : fillPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span className="text-marble font-semibold">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-[8px] font-mono">
              <span className="text-marble/25">Commission</span>
              <span className="text-marble/30">$0.00</span>
            </div>
            <div className="flex justify-between text-[8px] font-mono">
              <span className="text-marble/25">Portfolio %</span>
              <span className={`${portfolioPct > 25 ? 'text-amber-400' : 'text-marble/30'}`}>{portfolioPct.toFixed(1)}%</span>
            </div>
            <div className="border-t border-gold/5 pt-1 flex justify-between text-[8px] font-mono">
              <span className="text-marble/25">Cash After</span>
              <span className={`${remainingCash < 0 ? 'text-red-400' : 'text-marble/40'}`}>${remainingCash.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        )}

        <Button type="submit" disabled={!qty || (side === 'buy' && totalCost > paper.account.cash)}
          className={`w-full font-display tracking-wider ${side === 'buy' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}>
          {side.toUpperCase()} {parsedQty > 0 ? `$${totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : activeSymbol.ticker}
        </Button>
      </form>

      {/* Paper Positions */}
      {paper.positions.length > 0 && (
        <div className="space-y-1">
          <div className="text-[8px] font-display tracking-wider text-marble/30 mt-2">OPEN POSITIONS ({paper.positions.length})</div>
          {paper.positions.map(pos => (
            <div key={pos.id} className="flex items-center justify-between p-2 bg-navy-light/20 rounded border border-gold/5">
              <div>
                <div className="text-[10px] font-mono text-marble/70">{pos.symbol} <span className={pos.side === 'buy' ? 'text-emerald-400' : 'text-red-400'}>{pos.side.toUpperCase()}</span></div>
                <div className="text-[8px] text-marble/25">{pos.qty} @ ${pos.entryPrice.toFixed(2)} · MV: ${(pos.currentPrice * pos.qty).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
              </div>
              <div className="text-right">
                <div className={`text-[10px] font-mono ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)} ({pos.pnlPercent.toFixed(1)}%)
                </div>
                <button onClick={() => paper.closePosition(pos.id, pos.currentPrice)} className="text-[7px] text-marble/25 hover:text-red-400 transition-colors">CLOSE</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Orders */}
      {paper.orders.length > 0 && (
        <div className="space-y-1">
          <div className="text-[8px] font-display tracking-wider text-marble/30 mt-2">RECENT ORDERS ({paper.orders.length})</div>
          {paper.orders.slice(0, 5).map(o => (
            <div key={o.id} className="flex items-center justify-between px-2 py-1 text-[9px] font-mono text-marble/30 border-b border-gold/5">
              <span className={o.side === 'buy' ? 'text-emerald-400/60' : 'text-red-400/60'}>{o.side.toUpperCase()}</span>
              <span>{o.qty} {o.symbol}</span>
              <span>${o.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-1 mt-1">
        <div className="text-center bg-navy-light/15 rounded p-1 border border-gold/5">
          <div className="text-[7px] text-marble/20 font-display tracking-wider">TRADES</div>
          <div className="text-[10px] font-mono text-marble/50">{paper.account.totalTrades}</div>
        </div>
        <div className="text-center bg-navy-light/15 rounded p-1 border border-gold/5">
          <div className="text-[7px] text-marble/20 font-display tracking-wider">WIN RATE</div>
          <div className="text-[10px] font-mono text-marble/50">{paper.account.winRate.toFixed(0)}%</div>
        </div>
        <div className="text-center bg-navy-light/15 rounded p-1 border border-gold/5">
          <div className="text-[7px] text-marble/20 font-display tracking-wider">ROI</div>
          <div className={`text-[10px] font-mono ${paper.account.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {((paper.account.totalPnl / paper.account.startingBalance) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Reset */}
      <button onClick={paper.resetAccount} className="flex items-center gap-1 mx-auto text-[8px] text-marble/20 hover:text-red-400 transition-colors mt-2">
        <RotateCcw className="w-2.5 h-2.5" /> RESET PAPER ACCOUNT
      </button>

      <OrderConfirmationDialog open={confirmOpen} onOpenChange={setConfirmOpen} data={confirmData} />
    </div>
  );
}

// ─── Trade Tab Content (Collapsible Layout) ──────────────
function TradeTabContent({ 
  tradingMode, activeSymbol, activePrice, paper, activeConn 
}: { 
  tradingMode: 'live' | 'paper'; 
  activeSymbol: { key: string; label: string; ticker: string; cat: string }; 
  activePrice: number; 
  paper: ReturnType<typeof usePaperTrading>; 
  activeConn?: { id: string } | null;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* Column 1: Order Execution */}
      <div className="space-y-3">
        <CollapsibleSection 
          title="ORDER TICKET" 
          icon={ArrowUpDown} 
          badge={tradingMode === 'paper' ? 'PAPER' : 'LIVE'} 
          defaultOpen
        >
          {tradingMode === 'paper' ? (
            <PaperTradingPanel activeSymbol={activeSymbol} activePrice={activePrice} paper={paper} />
          ) : (
            <TradingPanel activeSymbol={activeSymbol.ticker} />
          )}
        </CollapsibleSection>

        <CollapsibleSection title="DEPTH OF MARKET" icon={BarChart3}>
          <DepthOfMarket price={activePrice} symbolLabel={activeSymbol.label} />
        </CollapsibleSection>

        <CollapsibleSection title="TIME & SALES" icon={Clock}>
          <GATimeSales symbol={activeSymbol.ticker} price={activePrice} />
        </CollapsibleSection>
      </div>

      {/* Column 2: Market Context */}
      <div className="space-y-3">
        <CollapsibleSection title="MARKET PULSE" icon={Activity} defaultOpen>
          <div className="space-y-3">
            <GAPriceCards />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="TECHNICALS" icon={LineChartIcon}>
          <GATechnicalGauge />
        </CollapsibleSection>
      </div>

      {/* Column 3: Portfolio */}
      <div className="space-y-3">
        <CollapsibleSection title="PORTFOLIO" icon={Briefcase} defaultOpen>
          <PortfolioSummary />
        </CollapsibleSection>

        {activeConn && (
          <CollapsibleSection title="POSITIONS" icon={TrendingUp}>
            <PositionsPanel connectionId={activeConn.id} />
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

const TradingBridge = () => {
  const [activeSymbol, setActiveSymbol] = useState(ALL_SYMBOLS[0]);
  const [bottomTab, setBottomTab] = useState<BottomTab>('trade');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('chart');
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [brokerDialogOpen, setBrokerDialogOpen] = useState(false);
  const [tradingMode, setTradingMode] = useState<'live' | 'paper'>('paper');
  const [oneClickOpen, setOneClickOpen] = useState(false);
  const { data: connections } = useBrokerConnections();
  const activeConn = connections?.[0];
  const isMobile = useIsMobile();
  const { data: metalPricesData } = useMetalPrices();
  const { data: cryptoDataAll } = useCryptoData(50);
  const { data: oilPricesData } = useOilGasPrices();
  const priceAlertsHook = usePriceAlerts();
  const riskMonitor = useRiskMonitor();
  const paper = usePaperTrading();

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

  // ─── Mode Toggle ───────────────────────────────────
  const ModeToggle = () => (
    <div className="flex items-center gap-0.5 bg-navy-light/50 rounded-lg p-0.5 border border-gold/10">
      <button
        onClick={() => setTradingMode('paper')}
        className={`px-2 py-1 rounded text-[9px] font-display tracking-wider transition-all ${
          tradingMode === 'paper'
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'text-marble/30 border border-transparent hover:text-marble/50'
        }`}
      >
        PAPER
      </button>
      <button
        onClick={() => setTradingMode('live')}
        className={`px-2 py-1 rounded text-[9px] font-display tracking-wider transition-all ${
          tradingMode === 'live'
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'text-marble/30 border border-transparent hover:text-marble/50'
        }`}
      >
        LIVE
      </button>
    </div>
  );

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
            <ModeToggle />
            <button
              onClick={() => setBrokerDialogOpen(true)}
              className="text-[8px] font-mono bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors cursor-pointer"
            >
              {connections?.length || 0} BROKER{connections?.length !== 1 ? 'S' : ''}
            </button>
            {priceAlertsHook.activeCount > 0 && (
              <button onClick={() => { setMobileTab('tools'); setBottomTab('automate'); }} className="relative p-1 text-gold/60 hover:text-gold">
                <Bell className="w-3.5 h-3.5" />
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full text-[6px] text-white flex items-center justify-center">{priceAlertsHook.activeCount}</span>
              </button>
            )}
            <ConnectWalletButton />
          </div>
        </div>

        {/* Mobile Watchlist Overlay */}
        {watchlistOpen && (
          <div className="absolute top-11 left-0 right-0 z-50 bg-navy-dark/98 border-b border-gold/20 max-h-[60vh] overflow-y-auto backdrop-blur-sm watchlist-scroll">
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
                      <div className="flex items-center gap-2">
                        <SymbolLogo symbolKey={sym.key} category={sym.cat} ticker={sym.ticker} size={18} />
                        <div>
                          <div className="text-[11px] font-mono">{sym.label}</div>
                          <div className="text-[8px] text-marble/25">{sym.ticker}</div>
                        </div>
                      </div>
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
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {mobileTab === 'chart' && (
            <div className="flex flex-col">
              <div className="h-[45vh] min-h-[260px]">
                <GALiveChart symbolKey={activeSymbol.key} category={activeSymbol.cat} label={activeSymbol.label} onSymbolChange={setActiveSymbol} />
              </div>
               <div className="p-3 space-y-3">
                 <GAPriceCards />
                 
                 <GATopMovers />
                 <GAMiniCharts />
                 <GAMarketPulse />
               </div>
            </div>
          )}

          {mobileTab === 'trade' && (
            <div className="p-3 space-y-3">
              <TradeTabContent 
                tradingMode={tradingMode} 
                activeSymbol={activeSymbol} 
                activePrice={activePrice} 
                paper={paper} 
                activeConn={activeConn} 
              />
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
              <div className="relative">
                <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide flex-nowrap">
                  {BOTTOM_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setBottomTab(tab.key)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-display tracking-wider whitespace-nowrap transition-all flex-shrink-0 ${
                        bottomTab === tab.key
                          ? 'bg-gold/15 text-gold border border-gold/30'
                          : 'text-marble/35 border border-gold/5'
                      }`}
                    >
                      <tab.icon className="w-2.5 h-2.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-navy to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-navy to-transparent" />
              </div>
              {bottomTab === 'trade' && (
                <TradeTabContent 
                  tradingMode={tradingMode} 
                  activeSymbol={activeSymbol} 
                  activePrice={activePrice} 
                  paper={paper} 
                  activeConn={activeConn} 
                />
              )}
              {bottomTab === 'book' && activeConn && (
                <div className="space-y-4">
                  <PositionsPanel connectionId={activeConn.id} />
                  <div className="border-t border-gold/10 pt-4">
                    <OrderHistory connectionId={activeConn.id} />
                  </div>
                </div>
              )}
              {bottomTab === 'book' && !activeConn && <EmptyState text="Connect a broker to view positions & orders" />}
              {bottomTab === 'automate' && (
                <div className="space-y-4">
                  <SchedulePanel />
                  <div className="border-t border-gold/10 pt-4">
                    <PriceAlerts alertsHook={priceAlertsHook} />
                  </div>
                </div>
              )}
              {bottomTab === 'backtest' && <BacktestPanel />}
              {bottomTab === 'analytics' && (
                <div className="space-y-4">
                  <AnalyticsPanel connectionId={activeConn?.id} />
                   <div className="border-t border-gold/10 pt-4 grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto">
                    <GAMarketPulse />
                    <GACrossAssetDashboard />
                    <GAAssetOverview />
                    <GAMiniCharts />
                  </div>
                </div>
              )}
              {bottomTab === 'risk' && (
                <>
                  <RiskPanel connectionId={activeConn?.id} />
                  <div className="mt-4 pt-4 border-t border-gold/10"><RiskLimits riskMonitor={riskMonitor} /></div>
                  <div className="mt-4 pt-4 border-t border-gold/10 grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto">
                    <GAVolatilityMatrix />
                    <GAGoldRatio />
                    <GABullionHeatmap />
                  </div>
                </>
              )}
              {bottomTab === 'market' && (
                <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto">
                  <GAMarketHeatmap />
                  <GACryptoHeatmap />
                  <GAForexMatrix />
                  <GAEconomicCalendar />
                  <GAMarketQuotes />
                  <GAMarketSummary />
                </div>
              )}
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
          <ModeToggle />
          <button
            onClick={() => setBrokerDialogOpen(true)}
            className="text-[9px] font-mono bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors cursor-pointer"
          >
            {connections?.length || 0} BROKER{connections?.length !== 1 ? 'S' : ''}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/intelligence" className="text-[10px] font-display tracking-wider text-marble/30 hover:text-gold transition-colors">INTELLIGENCE</Link>
          <Link to="/intelligence" className="text-[10px] font-display tracking-wider text-marble/30 hover:text-gold transition-colors">INTELLIGENCE</Link>
          <Link to="/oil-gas" className="text-[10px] font-display tracking-wider text-marble/30 hover:text-gold transition-colors">OIL & GAS</Link>
          {priceAlertsHook.activeCount > 0 && (
            <button onClick={() => setBottomTab('automate')} className="relative p-1 text-gold/60 hover:text-gold">
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full text-[6px] text-white flex items-center justify-center">{priceAlertsHook.activeCount}</span>
            </button>
          )}
          <ConnectWalletButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Watchlist Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-12' : 'w-48'} transition-all duration-200 bg-navy-dark border-r border-gold/10 flex flex-col flex-shrink-0`}>
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-gold/10 flex-shrink-0">
            {!sidebarCollapsed && <span className="text-[9px] font-display tracking-[0.2em] text-gold/40">WATCHLIST</span>}
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-marble/30 hover:text-marble transition-colors ml-auto">
              {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>
          {!sidebarCollapsed && (
            <div className="px-1.5 py-1 border-b border-gold/5 flex-shrink-0">
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
          <div className="overflow-y-auto watchlist-scroll" style={{ height: `calc(100% - ${sidebarCollapsed ? '33px' : '66px'})` }}>
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
                        <div className="flex items-center gap-1.5">
                          <SymbolLogo symbolKey={sym.key} category={sym.cat} ticker={sym.ticker} size={16} />
                          <span className="text-[11px] font-mono">{sym.label}</span>
                        </div>
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

        {/* Resizable Main Content — Chart takes full width now */}
        <div className="flex-1">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={65} minSize={30}>
              <div className="h-full relative">
                <GALiveChart symbolKey={activeSymbol.key} category={activeSymbol.cat} label={activeSymbol.label} onSymbolChange={setActiveSymbol} />
                {/* One-Click Trading Toggle */}
                <button
                  onClick={() => setOneClickOpen(!oneClickOpen)}
                  className={`absolute top-2 right-2 z-40 flex items-center gap-1 px-2 py-1 rounded text-[8px] font-display tracking-wider transition-all ${
                    oneClickOpen ? 'bg-gold/20 text-gold border border-gold/40' : 'bg-navy-dark/80 text-marble/30 border border-gold/10 hover:text-gold'
                  }`}
                >
                  <Zap className="w-3 h-3" /> 1-CLICK
                </button>
                {oneClickOpen && (
                  <OneClickTrading
                    symbol={activeSymbol.ticker}
                    price={activePrice}
                    paper={paper}
                    onClose={() => setOneClickOpen(false)}
                  />
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-gold/10 hover:bg-gold/30 transition-colors" />

            <ResizablePanel defaultSize={35} minSize={15}>
              <div className="h-full flex flex-col">
                <div className="relative flex-shrink-0">
                  <div className="flex items-center gap-1 px-2 py-1 bg-navy-dark/80 border-b border-gold/10 overflow-x-auto scrollbar-hide">
                    {BOTTOM_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setBottomTab(tab.key)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-display tracking-wider transition-all whitespace-nowrap flex-shrink-0 ${
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
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-navy-dark/80 to-transparent" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-navy-dark/80 to-transparent" />
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 watchlist-scroll">
                  {bottomTab === 'trade' && (
                    <TradeTabContent 
                      tradingMode={tradingMode} 
                      activeSymbol={activeSymbol} 
                      activePrice={activePrice} 
                      paper={paper} 
                      activeConn={activeConn} 
                    />
                  )}
                  {bottomTab === 'book' && tradingMode === 'paper' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] font-display tracking-wider text-emerald-400">PAPER POSITIONS & ORDERS</span>
                      </div>
                      {paper.positions.length > 0 ? (
                        <div className="space-y-1">
                          {paper.positions.map(pos => (
                            <div key={pos.id} className="flex items-center justify-between p-2 bg-navy-light/20 rounded border border-gold/5">
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${pos.side === 'buy' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>{pos.side.toUpperCase()}</span>
                                <span className="text-[11px] font-mono text-marble/70">{pos.symbol}</span>
                                <span className="text-[9px] text-marble/25">{pos.qty} @ ${pos.entryPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] font-mono text-marble/30">MV: ${(pos.currentPrice * pos.qty).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                <span className={`text-[10px] font-mono ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)} ({pos.pnlPercent.toFixed(1)}%)
                                </span>
                                <button onClick={() => paper.closePosition(pos.id, pos.currentPrice)} className="text-[8px] text-marble/25 hover:text-red-400 transition-colors px-1.5 py-0.5 rounded border border-gold/10">CLOSE</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <EmptyState text="No open paper positions" />}
                      {paper.orders.length > 0 && (
                        <div className="border-t border-gold/10 pt-3 space-y-1">
                          <div className="text-[9px] font-display tracking-wider text-marble/25 mb-1">ORDER HISTORY ({paper.orders.length})</div>
                          {paper.orders.slice(0, 20).map(o => (
                            <div key={o.id} className="flex items-center justify-between px-2 py-1.5 text-[9px] font-mono text-marble/30 border-b border-gold/5">
                              <span className={o.side === 'buy' ? 'text-emerald-400/60' : 'text-red-400/60'}>{o.side.toUpperCase()}</span>
                              <span>{o.type.toUpperCase()}</span>
                              <span>{o.qty} {o.symbol}</span>
                              <span>${o.price.toFixed(2)}</span>
                              <span className="text-marble/15">{new Date(o.filledAt).toLocaleTimeString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {bottomTab === 'book' && tradingMode === 'live' && activeConn && (
                    <div className="space-y-4">
                      <PositionsPanel connectionId={activeConn.id} />
                      <div className="border-t border-gold/10 pt-4">
                        <OrderHistory connectionId={activeConn.id} />
                      </div>
                    </div>
                  )}
                  {bottomTab === 'book' && tradingMode === 'live' && !activeConn && <EmptyState text="Connect a broker to view positions & orders" />}
                  {bottomTab === 'book' && (
                    <div className="mt-4 pt-4 border-t border-gold/10">
                      <CollapsibleSection title="TRADE JOURNAL" icon={BookOpen} badge="LOG">
                        <GATradeJournal />
                      </CollapsibleSection>
                    </div>
                  )}
                  {bottomTab === 'automate' && (
                    <div className="space-y-4">
                      <SchedulePanel />
                      <div className="border-t border-gold/10 pt-4">
                        <PriceAlerts alertsHook={priceAlertsHook} />
                      </div>
                    </div>
                  )}
                  {bottomTab === 'backtest' && <BacktestPanel />}
                  {bottomTab === 'analytics' && (
                    <div className="space-y-4">
                      <AnalyticsPanel connectionId={activeConn?.id} />
                      <div className="border-t border-gold/10 pt-4 grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-[50vh] lg:max-h-none overflow-y-auto lg:overflow-visible">
                        <GAMarketPulse />
                        <GACrossAssetDashboard />
                        <GAPerformanceDashboard />
                        <GATradingSessions />
                        <GAAssetOverview />
                        <GAMiniCharts />
                      </div>
                    </div>
                  )}
                  {bottomTab === 'risk' && (
                    <>
                      <RiskPanel connectionId={activeConn?.id} />
                      <div className="mt-4 pt-4 border-t border-gold/10"><RiskLimits riskMonitor={riskMonitor} /></div>
                      <div className="mt-4 pt-4 border-t border-gold/10 grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-[50vh] lg:max-h-none overflow-y-auto lg:overflow-visible">
                        <GAVolatilityMatrix />
                        <GAGoldRatio />
                        <GAPipCalculator />
                        <GAMarginCalc />
                        <div className="lg:col-span-2"><GABullionHeatmap /></div>
                      </div>
                    </>
                  )}
                  {bottomTab === 'market' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-[50vh] lg:max-h-none overflow-y-auto lg:overflow-visible">
                      <GAMarketHeatmap />
                      <GACryptoHeatmap />
                      <GAForexMatrix />
                      <GAEconomicCalendar />
                      <GAMarketQuotes />
                      <GAMarketSummary />
                    </div>
                  )}
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
            <div className={`w-1.5 h-1.5 rounded-full ${tradingMode === 'paper' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
            <span className={`text-[9px] font-mono ${tradingMode === 'paper' ? 'text-emerald-400/50' : 'text-red-400/50'}`}>
              {tradingMode === 'paper' ? 'PAPER MODE' : 'LIVE MODE'}
            </span>
          </div>
          <span className="text-[9px] font-mono text-marble/20">{activeSymbol.label}</span>
          <span className="text-[9px] font-mono text-marble/15 uppercase">{activeSymbol.cat}</span>
          {activePrice > 0 && (
            <span className="text-[9px] font-mono text-marble/15">SPREAD: ${(activePrice * 0.0002).toFixed(activePrice < 10 ? 4 : 2)}</span>
          )}
          <span className="text-[9px] font-mono text-marble/15">{activeSymbol.cat === 'crypto' ? 'WS' : 'SIM'}</span>
        </div>
        <div className="flex items-center gap-4">
          {tradingMode === 'paper' && (
            <span className="text-[9px] font-mono text-emerald-400/30">
              PAPER: ${paper.account.equity.toLocaleString('en-US', { maximumFractionDigits: 0 })} · {paper.positions.length} pos
            </span>
          )}
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
              <span className="text-[7px] sm:text-[8px] font-display tracking-wider text-marble/35">{kpi.label}</span>
            </div>
            <div className={`text-base sm:text-lg font-mono ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-navy-light/30 rounded-lg p-3 border border-gold/5">
          <div className="text-[9px] font-display tracking-wider text-marble/25 mb-2">EQUITY CURVE (30D)</div>
          <div className="h-32 sm:h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pnlCurve}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(43,72%,50%)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(43,72%,50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(43,72%,50%,0.05)" />
                <XAxis dataKey="day" tick={{ fontSize: 8, fill: 'hsl(40,25%,96%,0.2)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: 'hsl(40,25%,96%,0.2)' }} axisLine={false} tickLine={false} width={45} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="value" stroke="hsl(43,72%,50%)" strokeWidth={1.5} fill="url(#eqGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/5">
          <div className="text-[9px] font-display tracking-wider text-marble/25 mb-2">ASSET BREAKDOWN</div>
          <div className="h-32 sm:h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie data={assetBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={55} innerRadius={25} strokeWidth={0}>
                  {assetBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {assetBreakdown.map((a, i) => (
              <div key={a.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-[8px] font-mono text-marble/40">{a.name}</span>
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
  const { data: positions } = usePositions(connectionId);
  const [accountSize, setAccountSize] = useState('100000');
  const [riskPercent, setRiskPercent] = useState('2');
  const [stopDistance, setStopDistance] = useState('5');

  const riskAmount = (parseFloat(accountSize) || 0) * (parseFloat(riskPercent) || 0) / 100;
  const positionSize = parseFloat(stopDistance) > 0 ? Math.floor(riskAmount / parseFloat(stopDistance)) : 0;

  const assets = ['XAU', 'BTC', 'SPY', 'OIL', 'EUR'];
  const corrMatrix = useMemo(() => {
    const base = [
      [1.0, -0.2, 0.1, 0.3, 0.4],
      [-0.2, 1.0, 0.6, -0.1, 0.2],
      [0.1, 0.6, 1.0, 0.2, -0.3],
      [0.3, -0.1, 0.2, 1.0, 0.1],
      [0.4, 0.2, -0.3, 0.1, 1.0],
    ];
    return base;
  }, []);

  const exposureData = useMemo(() => {
    if (!positions?.length) {
      return [
        { name: 'Metals', value: 0, max: 40 },
        { name: 'Crypto', value: 0, max: 20 },
        { name: 'Stocks', value: 0, max: 50 },
        { name: 'Energy', value: 0, max: 30 },
        { name: 'Bonds', value: 0, max: 25 },
      ];
    }
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
