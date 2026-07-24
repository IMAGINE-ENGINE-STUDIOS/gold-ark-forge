import { ArrowUpDown, TrendingUp, TrendingDown, Briefcase, Gauge, Shield, Activity, Zap } from 'lucide-react';
import PaperTradingPanel from './__paper_reexport';
import TradingPanel from './TradingPanel';
import PortfolioSummary from './PortfolioSummary';
import PositionsPanel from './PositionsPanel';
import RiskThermometer from './RiskThermometer';
import GATechnicalGauge from '@/components/ga-widgets/GATechnicalGauge';
import type { usePaperTrading } from '@/hooks/usePaperTrading';

interface Props {
  tradingMode: 'live' | 'paper';
  activeSymbol: { key: string; label: string; ticker: string; cat: string };
  activePrice: number;
  paper: ReturnType<typeof usePaperTrading>;
  activeConn?: { id: string } | null;
  activeCandles?: { closes: number[]; highs: number[]; lows: number[] } | null;
}

// ─── Glass Card wrapper ─────────────────────────────────
function GlassCard({
  title,
  icon: Icon,
  accent = 'gold',
  badge,
  children,
  className = '',
}: {
  title: string;
  icon: React.ElementType;
  accent?: 'gold' | 'emerald' | 'red' | 'blue' | 'violet';
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const glow: Record<string, string> = {
    gold: 'shadow-[0_0_40px_-12px_rgba(212,175,55,0.55)] ring-[hsl(43,72%,55%)]/25',
    emerald: 'shadow-[0_0_40px_-12px_rgba(16,185,129,0.55)] ring-emerald-400/25',
    red: 'shadow-[0_0_40px_-12px_rgba(239,68,68,0.55)] ring-red-400/25',
    blue: 'shadow-[0_0_40px_-12px_rgba(59,130,246,0.5)] ring-blue-400/25',
    violet: 'shadow-[0_0_40px_-12px_rgba(139,92,246,0.5)] ring-violet-400/25',
  };
  const dot: Record<string, string> = {
    gold: 'bg-[hsl(43,90%,60%)] shadow-[0_0_10px_hsl(43,90%,60%)]',
    emerald: 'bg-emerald-400 shadow-[0_0_10px_theme(colors.emerald.400)]',
    red: 'bg-red-400 shadow-[0_0_10px_theme(colors.red.400)]',
    blue: 'bg-blue-400 shadow-[0_0_10px_theme(colors.blue.400)]',
    violet: 'bg-violet-400 shadow-[0_0_10px_theme(colors.violet.400)]',
  };
  return (
    <div
      className={`
        relative rounded-2xl overflow-hidden
        bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-white/[0.01]
        backdrop-blur-2xl border border-white/10 ring-1 ring-inset ${glow[accent]}
        ${className}
      `}
    >
      {/* top LED bar */}
      <div className={`absolute inset-x-0 top-0 h-px ${dot[accent].replace('bg-', 'bg-')}`} />
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot[accent]} animate-pulse`} />
          <Icon className="w-3.5 h-3.5 text-white/70" />
          <span className="font-display text-[10px] tracking-[0.2em] text-white/80">{title}</span>
        </div>
        {badge && <div className="text-[9px] font-mono text-white/50">{badge}</div>}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

// ─── LED price header ───────────────────────────────────
function CommandHeader({
  activeSymbol,
  activePrice,
  paper,
  tradingMode,
}: {
  activeSymbol: Props['activeSymbol'];
  activePrice: number;
  paper: Props['paper'];
  tradingMode: 'live' | 'paper';
}) {
  const spread = activePrice * 0.0002;
  const equity = paper.account.equity;
  const pnl = paper.account.totalPnl;
  const pnlPct = paper.account.startingBalance > 0 ? (pnl / paper.account.startingBalance) * 100 : 0;
  const isProfit = pnl >= 0;
  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-black/60 via-[hsl(215,45%,10%)]/70 to-black/60 backdrop-blur-2xl border border-white/10 ring-1 ring-inset ring-white/5 shadow-[0_0_60px_-15px_rgba(212,175,55,0.4)]">
      {/* animated LED accent line */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[hsl(43,90%,60%)] to-transparent opacity-80" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="flex flex-wrap items-center gap-4 px-4 py-3">
        {/* Symbol + Price */}
        <div className="flex items-center gap-3 min-w-[220px]">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[hsl(43,90%,60%)]/40 blur-lg animate-pulse" />
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(43,90%,60%)] to-[hsl(43,72%,40%)] flex items-center justify-center text-black font-display text-[10px] tracking-widest shadow-lg">
              {activeSymbol.ticker.slice(0, 3)}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-display tracking-[0.25em] text-white/40">{activeSymbol.cat.toUpperCase()}</div>
            <div className="font-display text-sm tracking-widest text-white">{activeSymbol.label}</div>
          </div>
        </div>

        {/* LED Price */}
        <div className="flex-1 min-w-[240px]">
          <div className="flex items-baseline gap-3">
            <div
              className="font-mono text-3xl md:text-4xl font-bold text-[hsl(43,95%,65%)] tracking-tight"
              style={{ textShadow: '0 0 20px hsla(43,90%,60%,0.6), 0 0 40px hsla(43,90%,60%,0.3)' }}
            >
              ${activePrice < 10 ? activePrice.toFixed(4) : activePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[8px] font-mono text-emerald-400" style={{ textShadow: '0 0 8px rgba(16,185,129,0.6)' }}>
                BID {(activePrice - spread / 2).toFixed(activePrice < 10 ? 4 : 2)}
              </span>
              <span className="text-[8px] font-mono text-red-400" style={{ textShadow: '0 0 8px rgba(239,68,68,0.6)' }}>
                ASK {(activePrice + spread / 2).toFixed(activePrice < 10 ? 4 : 2)}
              </span>
            </div>
          </div>
        </div>

        {/* Equity chip */}
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 backdrop-blur">
            <div className="text-[8px] font-display tracking-widest text-white/40">EQUITY</div>
            <div className="font-mono text-sm text-white" style={{ textShadow: '0 0 8px rgba(255,255,255,0.3)' }}>
              ${equity.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-lg border backdrop-blur ${isProfit ? 'bg-emerald-500/10 border-emerald-400/30' : 'bg-red-500/10 border-red-400/30'}`}>
            <div className="text-[8px] font-display tracking-widest text-white/40">P&L</div>
            <div
              className={`font-mono text-sm ${isProfit ? 'text-emerald-300' : 'text-red-300'}`}
              style={{ textShadow: isProfit ? '0 0 8px rgba(16,185,129,0.6)' : '0 0 8px rgba(239,68,68,0.6)' }}
            >
              {isProfit ? '+' : ''}${pnl.toFixed(2)} <span className="text-[9px] opacity-70">({pnlPct.toFixed(1)}%)</span>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-lg border backdrop-blur ${tradingMode === 'paper' ? 'bg-blue-500/10 border-blue-400/30' : 'bg-[hsl(43,90%,60%)]/10 border-[hsl(43,90%,60%)]/40'}`}>
            <div className="text-[8px] font-display tracking-widest text-white/40">MODE</div>
            <div
              className={`font-mono text-sm ${tradingMode === 'paper' ? 'text-blue-300' : 'text-[hsl(43,95%,65%)]'}`}
              style={{ textShadow: tradingMode === 'paper' ? '0 0 8px rgba(59,130,246,0.6)' : '0 0 8px rgba(212,175,55,0.6)' }}
            >
              {tradingMode.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Command Deck ───────────────────────────────────────
export default function TradeCommandDeck({ tradingMode, activeSymbol, activePrice, paper, activeConn, activeCandles }: Props) {
  return (
    <div className="relative space-y-3">
      {/* ambient glow backdrop */}
      <div className="pointer-events-none absolute -inset-8 bg-[radial-gradient(circle_at_20%_10%,hsla(43,90%,60%,0.12),transparent_50%),radial-gradient(circle_at_80%_90%,hsla(217,91%,60%,0.10),transparent_50%)] blur-3xl" />

      <div className="relative">
        <CommandHeader activeSymbol={activeSymbol} activePrice={activePrice} paper={paper} tradingMode={tradingMode} />
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Order Ticket */}
        <GlassCard
          title="ORDER TICKET"
          icon={ArrowUpDown}
          accent="gold"
          badge={tradingMode === 'paper' ? 'PAPER' : 'LIVE'}
          className="lg:col-span-4"
        >
          {tradingMode === 'paper' ? (
            <PaperTradingPanel activeSymbol={activeSymbol} activePrice={activePrice} paper={paper} />
          ) : (
            <TradingPanel activeSymbol={activeSymbol.ticker} />
          )}
        </GlassCard>

        {/* Technicals + Risk (center column) */}
        <div className="lg:col-span-5 space-y-3">
          <GlassCard title="TECHNICAL INTELLIGENCE" icon={Gauge} accent="violet" badge={activeSymbol.ticker}>
            <GATechnicalGauge assetLabel={activeSymbol.ticker} candles={activeCandles} />
          </GlassCard>

          <GlassCard title="PORTFOLIO RISK" icon={Shield} accent={paper.positions.length ? 'red' : 'emerald'} badge="LIVE">
            {tradingMode === 'paper' && (
              <RiskThermometer positions={paper.positions} equity={paper.account.equity} />
            )}
            <div className="mt-2 grid grid-cols-3 gap-2">
              <MetricLED label="POSITIONS" value={String(paper.positions.length)} accent="blue" />
              <MetricLED label="WIN RATE" value={`${paper.account.winRate.toFixed(0)}%`} accent="emerald" />
              <MetricLED
                label="TRADES"
                value={String(paper.account.totalTrades)}
                accent="gold"
              />
            </div>
          </GlassCard>
        </div>

        {/* Portfolio */}
        <div className="lg:col-span-3 space-y-3">
          <GlassCard title="PORTFOLIO" icon={Briefcase} accent="blue" badge="AGGREGATE">
            <PortfolioSummary />
          </GlassCard>
          {activeConn && (
            <GlassCard title="POSITIONS" icon={Activity} accent="emerald">
              <PositionsPanel connectionId={activeConn.id} />
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricLED({ label, value, accent }: { label: string; value: string; accent: 'gold' | 'emerald' | 'red' | 'blue' }) {
  const color: Record<string, { text: string; shadow: string; border: string }> = {
    gold: { text: 'text-[hsl(43,95%,65%)]', shadow: '0 0 8px rgba(212,175,55,0.6)', border: 'border-[hsl(43,90%,60%)]/25' },
    emerald: { text: 'text-emerald-300', shadow: '0 0 8px rgba(16,185,129,0.6)', border: 'border-emerald-400/25' },
    red: { text: 'text-red-300', shadow: '0 0 8px rgba(239,68,68,0.6)', border: 'border-red-400/25' },
    blue: { text: 'text-blue-300', shadow: '0 0 8px rgba(59,130,246,0.6)', border: 'border-blue-400/25' },
  };
  return (
    <div className={`rounded-lg bg-black/30 border ${color[accent].border} px-2 py-1.5 text-center backdrop-blur`}>
      <div className="text-[8px] font-display tracking-widest text-white/40">{label}</div>
      <div className={`font-mono text-sm ${color[accent].text}`} style={{ textShadow: color[accent].shadow }}>
        {value}
      </div>
    </div>
  );
}
