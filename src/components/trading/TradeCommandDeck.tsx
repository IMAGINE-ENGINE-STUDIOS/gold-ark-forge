import { ArrowUpDown, Briefcase, Gauge, Shield, Activity } from 'lucide-react';
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
  orderTicket: React.ReactNode;
}

// ─── Section header (inside unified panel) ─────────────
function SectionLabel({ icon: Icon, title, badge }: { icon: React.ElementType; title: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-white/80" strokeWidth={2.2} />
        <span className="font-display text-[11px] tracking-[0.22em] text-white font-semibold">{title}</span>
      </div>
      {badge && <span className="text-[9px] font-mono tracking-wider text-white/70">{badge}</span>}
    </div>
  );
}

// ─── Command Deck — one unified Apple-style glass panel ──
export default function TradeCommandDeck({
  tradingMode, activeSymbol, activePrice, paper, activeConn, activeCandles, orderTicket,
}: Props) {
  const spread = activePrice * 0.0002;
  const equity = paper.account.equity;
  const pnl = paper.account.totalPnl;
  const pnlPct = paper.account.startingBalance > 0 ? (pnl / paper.account.startingBalance) * 100 : 0;
  const isProfit = pnl >= 0;

  return (
    <div className="relative">
      {/* Ambient backdrop (subtle) */}
      <div className="pointer-events-none absolute -inset-8 bg-[radial-gradient(circle_at_15%_10%,hsla(43,90%,60%,0.10),transparent_55%),radial-gradient(circle_at_85%_90%,hsla(217,91%,60%,0.08),transparent_55%)] blur-3xl" />

      {/* ONE unified glass panel */}
      <div
        className="
          relative rounded-[22px] overflow-hidden
          bg-[linear-gradient(180deg,rgba(28,32,44,0.85)_0%,rgba(18,22,32,0.88)_100%)]
          backdrop-blur-2xl
          border border-white/[0.08]
          ring-1 ring-inset ring-white/[0.05]
          shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.03)_inset]
        "
      >
        {/* Specular highlight (Apple gloss) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_-10%,rgba(255,255,255,0.08),transparent_60%)]" />

        {/* ── HEADER STRIP ─────────────────────────────── */}
        <div className="relative flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4 border-b border-white/[0.06]">
          {/* Symbol */}
          <div className="flex items-center gap-3 min-w-[190px]">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-[hsl(43,90%,60%)]/25 blur-md" />
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(43,95%,68%)] via-[hsl(43,85%,55%)] to-[hsl(43,70%,38%)] flex items-center justify-center text-black font-display text-[10px] font-bold tracking-wider shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                {activeSymbol.ticker.slice(0, 3)}
              </div>
            </div>
            <div className="leading-tight">
              <div className="text-[9px] font-display tracking-[0.28em] text-white/60 font-medium">{activeSymbol.cat.toUpperCase()}</div>
              <div className="font-display text-[15px] tracking-wide text-white font-semibold">{activeSymbol.label}</div>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-4 flex-1 min-w-[240px]">
            <div className="font-mono text-[34px] leading-none font-semibold text-white tracking-tight tabular-nums">
              ${activePrice < 10
                ? activePrice.toFixed(4)
                : activePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex flex-col gap-0.5 leading-tight">
              <span className="text-[10px] font-mono text-emerald-400 tabular-nums">
                <span className="text-white/50 mr-1">BID</span>
                {(activePrice - spread / 2).toFixed(activePrice < 10 ? 4 : 2)}
              </span>
              <span className="text-[10px] font-mono text-red-400 tabular-nums">
                <span className="text-white/50 mr-1">ASK</span>
                {(activePrice + spread / 2).toFixed(activePrice < 10 ? 4 : 2)}
              </span>
            </div>
          </div>

          {/* Account chips */}
          <div className="flex items-stretch gap-2">
            <Chip label="EQUITY" value={`$${equity.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} tone="neutral" />
            <Chip
              label="P&L"
              value={`${isProfit ? '+' : ''}$${pnl.toFixed(2)}`}
              sub={`${pnlPct.toFixed(1)}%`}
              tone={isProfit ? 'up' : 'down'}
            />
            <Chip label="MODE" value={tradingMode.toUpperCase()} tone={tradingMode === 'paper' ? 'info' : 'gold'} />
          </div>
        </div>

        {/* ── BODY: three internal sections ───────────── */}
        <div className="relative grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
          {/* Order */}
          <div className="lg:col-span-4 p-6">
            <SectionLabel icon={ArrowUpDown} title="ORDER" badge={tradingMode === 'paper' ? 'PAPER' : 'LIVE'} />
            <div className="text-white [&_*]:!text-inherit">{orderTicket}</div>
          </div>

          {/* Technicals + Risk merged */}
          <div className="lg:col-span-5 p-6 space-y-6">
            <div>
              <SectionLabel icon={Gauge} title="TECHNICALS" badge={activeSymbol.ticker} />
              <GATechnicalGauge assetLabel={activeSymbol.ticker} candles={activeCandles} />
            </div>
            <div className="pt-5 border-t border-white/[0.06]">
              <SectionLabel icon={Shield} title="PORTFOLIO RISK" badge="LIVE" />
              {tradingMode === 'paper' && (
                <RiskThermometer positions={paper.positions} equity={paper.account.equity} />
              )}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <StatTile label="POSITIONS" value={String(paper.positions.length)} />
                <StatTile label="WIN RATE" value={`${paper.account.winRate.toFixed(0)}%`} />
                <StatTile label="TRADES" value={String(paper.account.totalTrades)} />
              </div>
            </div>
          </div>

          {/* Portfolio */}
          <div className="lg:col-span-3 p-6 space-y-6">
            <div>
              <SectionLabel icon={Briefcase} title="PORTFOLIO" badge="AGGREGATE" />
              <PortfolioSummary />
            </div>
            {activeConn && (
              <div className="pt-5 border-t border-white/[0.06]">
                <SectionLabel icon={Activity} title="POSITIONS" />
                <PositionsPanel connectionId={activeConn.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Header chip ────────────────────────────────────────
function Chip({
  label, value, sub, tone,
}: { label: string; value: string; sub?: string; tone: 'neutral' | 'up' | 'down' | 'info' | 'gold' }) {
  const tones: Record<string, { bg: string; border: string; text: string; sub: string }> = {
    neutral: { bg: 'bg-white/[0.06]', border: 'border-white/15', text: 'text-white', sub: 'text-white/60' },
    up: { bg: 'bg-emerald-500/15', border: 'border-emerald-400/40', text: 'text-emerald-300', sub: 'text-emerald-200/80' },
    down: { bg: 'bg-red-500/15', border: 'border-red-400/40', text: 'text-red-300', sub: 'text-red-200/80' },
    info: { bg: 'bg-blue-500/15', border: 'border-blue-400/40', text: 'text-blue-200', sub: 'text-blue-200/70' },
    gold: { bg: 'bg-[hsl(43,90%,60%)]/15', border: 'border-[hsl(43,90%,60%)]/45', text: 'text-[hsl(43,95%,72%)]', sub: 'text-[hsl(43,60%,80%)]' },
  };
  const t = tones[tone];
  return (
    <div className={`px-3 py-1.5 rounded-xl border ${t.border} ${t.bg} backdrop-blur-md min-w-[92px]`}>
      <div className="text-[9px] font-display tracking-[0.2em] text-white/70 font-medium">{label}</div>
      <div className={`font-mono text-[14px] font-semibold tabular-nums ${t.text}`}>
        {value}{sub && <span className={`ml-1 text-[10px] ${t.sub}`}>({sub})</span>}
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.04] border border-white/[0.08] px-2 py-1.5 text-center">
      <div className="text-[9px] font-display tracking-[0.18em] text-white/60 font-medium">{label}</div>
      <div className="font-mono text-[13px] font-semibold text-white tabular-nums">{value}</div>
    </div>
  );
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
export default function TradeCommandDeck({ tradingMode, activeSymbol, activePrice, paper, activeConn, activeCandles, orderTicket }: Props) {
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
          {orderTicket}
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
