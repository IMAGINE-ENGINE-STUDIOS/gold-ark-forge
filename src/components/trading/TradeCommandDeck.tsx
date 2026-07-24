import { ArrowUpDown, Shield, Activity, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';
import PortfolioSummary from './PortfolioSummary';
import PositionsPanel from './PositionsPanel';
import { buildTechnicalSnapshot } from '@/lib/technicalSignals';
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
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-white/80" strokeWidth={2.2} />
        <span className="font-display text-[10.5px] tracking-[0.24em] text-white font-semibold">{title}</span>
      </div>
      {badge && <span className="text-[9px] font-mono tracking-[0.14em] text-white/55">{badge}</span>}
    </div>
  );
}

// ─── Micro Technical Pulse (integrated in header) ──────
function TechnicalPulse({ candles }: { candles?: { closes: number[]; highs: number[]; lows: number[] } | null }) {
  const snap = useMemo(() => (candles ? buildTechnicalSnapshot(candles) : null), [candles]);

  if (!snap) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.03]">
        <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
        <span className="text-[9px] font-mono tracking-[0.18em] text-white/50">CALIBRATING</span>
      </div>
    );
  }

  const { overallSignal, totalBuy, totalSell, totalNeutral, overallBias } = snap;
  const isBull = overallSignal.includes('BUY');
  const isBear = overallSignal.includes('SELL');
  const Icon = isBull ? TrendingUp : isBear ? TrendingDown : Minus;

  const tone = isBull
    ? { text: 'text-emerald-300', glow: 'shadow-[0_0_20px_-4px_rgba(52,211,153,0.55)]', dot: 'bg-emerald-400', bar: 'from-emerald-500/80 to-emerald-300', ring: 'border-emerald-400/40', bg: 'bg-emerald-500/10' }
    : isBear
    ? { text: 'text-red-300', glow: 'shadow-[0_0_20px_-4px_rgba(248,113,113,0.5)]', dot: 'bg-red-400', bar: 'from-red-500/80 to-red-300', ring: 'border-red-400/40', bg: 'bg-red-500/10' }
    : { text: 'text-white/80', glow: '', dot: 'bg-white/50', bar: 'from-white/40 to-white/70', ring: 'border-white/15', bg: 'bg-white/[0.05]' };

  // Bias meter: -100..100 → 0..100
  const pct = Math.max(0, Math.min(100, 50 + overallBias / 2));

  return (
    <div className={`relative flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border ${tone.ring} ${tone.bg} ${tone.glow} backdrop-blur-md transition-all duration-500`}>
      {/* Animated pulse dot */}
      <div className="relative flex items-center justify-center w-4 h-4">
        <span className={`absolute inset-0 rounded-full ${tone.dot} opacity-30 animate-ping`} />
        <span className={`relative w-1.5 h-1.5 rounded-full ${tone.dot}`} />
      </div>

      <Icon className={`w-3.5 h-3.5 ${tone.text}`} strokeWidth={2.4} />

      <div className="flex flex-col leading-tight">
        <span className={`font-display text-[10px] tracking-[0.22em] font-bold ${tone.text}`}>{overallSignal}</span>
        {/* Bias micro-bar */}
        <div className="relative w-[92px] h-[3px] mt-0.5 rounded-full bg-white/[0.08] overflow-hidden">
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20" />
          <div
            className={`absolute top-0 bottom-0 rounded-full bg-gradient-to-r ${tone.bar} transition-all duration-700 ease-out`}
            style={
              overallBias >= 0
                ? { left: '50%', width: `${Math.min(50, pct - 50)}%` }
                : { right: '50%', width: `${Math.min(50, 50 - pct)}%` }
            }
          />
        </div>
      </div>

      {/* Signal counts */}
      <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-white/10">
        <MiniCount value={totalBuy} className="text-emerald-400" />
        <MiniCount value={totalNeutral} className="text-white/50" />
        <MiniCount value={totalSell} className="text-red-400" />
      </div>
    </div>
  );
}

function MiniCount({ value, className }: { value: number; className: string }) {
  return (
    <span className={`font-mono text-[10px] font-semibold tabular-nums ${className}`}>{value}</span>
  );
}

// ─── Micro Risk Pulse (integrated in header) ───────────
function RiskPulse({ positions, equity }: { positions: Array<{ currentPrice: number; qty: number; symbol: string }>; equity: number }) {
  const { level, score, label, concentration } = useMemo(() => {
    if (positions.length === 0 || equity <= 0) {
      return { level: 'none' as const, score: 0, label: 'NO RISK', concentration: 0 };
    }
    const posValues = positions.map((p) => p.currentPrice * p.qty);
    const totalExposure = posValues.reduce((s, v) => s + v, 0);
    const maxPosition = Math.max(...posValues);
    const concentration = totalExposure > 0 ? (maxPosition / totalExposure) * 100 : 0;
    const exposureRatio = (totalExposure / equity) * 100;
    const score = Math.min(100, concentration * 0.5 + exposureRatio * 0.3 + (positions.length > 5 ? 10 : 0));
    if (score < 30) return { level: 'low' as const, score, label: 'LOW RISK', concentration };
    if (score < 60) return { level: 'medium' as const, score, label: 'MODERATE', concentration };
    return { level: 'high' as const, score, label: 'HIGH RISK', concentration };
  }, [positions, equity]);

  const tone =
    level === 'low'
      ? { text: 'text-emerald-300', dot: 'bg-emerald-400', bar: 'from-emerald-500/80 to-emerald-300', ring: 'border-emerald-400/40', bg: 'bg-emerald-500/10', glow: 'shadow-[0_0_20px_-4px_rgba(52,211,153,0.55)]' }
      : level === 'medium'
      ? { text: 'text-amber-300', dot: 'bg-amber-400', bar: 'from-amber-500/80 to-amber-300', ring: 'border-amber-400/40', bg: 'bg-amber-500/10', glow: 'shadow-[0_0_20px_-4px_rgba(251,191,36,0.55)]' }
      : level === 'high'
      ? { text: 'text-red-300', dot: 'bg-red-400', bar: 'from-red-500/80 to-red-300', ring: 'border-red-400/40', bg: 'bg-red-500/10', glow: 'shadow-[0_0_20px_-4px_rgba(248,113,113,0.5)]' }
      : { text: 'text-white/70', dot: 'bg-white/40', bar: 'from-white/40 to-white/70', ring: 'border-white/15', bg: 'bg-white/[0.05]', glow: '' };

  const barWidth = Math.max(4, Math.min(100, score));

  return (
    <div className={`relative flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border ${tone.ring} ${tone.bg} ${tone.glow} backdrop-blur-md transition-all duration-500`}>
      <div className="relative flex items-center justify-center w-4 h-4">
        <span className={`absolute inset-0 rounded-full ${tone.dot} opacity-30 animate-ping`} />
        <span className={`relative w-1.5 h-1.5 rounded-full ${tone.dot}`} />
      </div>

      {concentration > 50 ? (
        <AlertTriangle className={`w-3.5 h-3.5 ${tone.text}`} strokeWidth={2.4} />
      ) : (
        <Shield className={`w-3.5 h-3.5 ${tone.text}`} strokeWidth={2.4} />
      )}

      <div className="flex flex-col leading-tight">
        <span className={`font-display text-[10px] tracking-[0.22em] font-bold ${tone.text}`}>{label}</span>
        <div className="relative w-[92px] h-[3px] mt-0.5 rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${tone.bar} transition-all duration-700 ease-out`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-white/10">
        <span className={`font-mono text-[10px] font-semibold tabular-nums ${tone.text}`}>{Math.round(score)}</span>
        <span className="font-mono text-[9px] text-white/40">/100</span>
      </div>
    </div>
  );
}

// ─── Command Deck — one unified Apple-style glass panel ──
export default function TradeCommandDeck({
  tradingMode, activeSymbol, activePrice, paper, activeConn, activeCandles, orderTicket,
}: Props) {
  // ── LIVE PRICE: REAL DATA ONLY.
  // `activePrice` is already resolved from the shared useLiveMarketData feed
  // in TradingBridge (Binance WS for crypto, real feeds for metals/energy).
  // No local simulation, no synthetic fallback.
  const displayPrice = activePrice;
  const hasPrice = displayPrice > 0;
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
        <div className="relative flex flex-wrap items-center gap-x-7 gap-y-4 px-7 py-5 border-b border-white/[0.06]">
          {/* Symbol */}
          <div className="flex items-center gap-3 min-w-[180px]">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-[hsl(43,90%,60%)]/25 blur-md" />
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(43,95%,68%)] via-[hsl(43,85%,55%)] to-[hsl(43,70%,38%)] flex items-center justify-center text-black font-display text-[10px] font-bold tracking-wider shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                {activeSymbol.ticker.slice(0, 3)}
              </div>
            </div>
            <div className="leading-tight">
              <div className="text-[9px] font-display tracking-[0.28em] text-white/55 font-medium">{activeSymbol.cat.toUpperCase()}</div>
              <div className="font-display text-[15px] tracking-wide text-white font-semibold">{activeSymbol.label}</div>
            </div>
          </div>

          {/* Price + integrated Technical Pulse */}
          <div className="flex items-center gap-5 flex-1 min-w-[300px]">
            <div className="flex flex-col">
              <div className="font-mono text-[32px] leading-none font-semibold text-white tracking-tight tabular-nums">
                {hasPrice ? (
                  <>${displayPrice < 10
                    ? displayPrice.toFixed(4)
                    : displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                ) : (
                  <span className="text-white/40">—</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`inline-flex items-center gap-1 text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded border ${hasPrice ? 'text-emerald-300 bg-emerald-500/10 border-emerald-400/25' : 'text-amber-300 bg-amber-500/10 border-amber-400/25'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasPrice ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {hasPrice ? 'LIVE' : 'NO DATA'}
                </span>
                <span className="text-[9px] font-mono text-white/40">REAL FEED ONLY</span>
              </div>
            </div>
            <TechnicalPulse candles={activeCandles} />
            {tradingMode === 'paper' && (
              <RiskPulse positions={paper.positions} equity={paper.account.equity} />
            )}
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
          <div className="lg:col-span-8 p-7 space-y-6">
            <SectionLabel icon={ArrowUpDown} title="ORDER TICKET" badge={tradingMode === 'paper' ? 'PAPER' : 'LIVE'} />
            <div className="text-white [&_*]:!text-inherit">{orderTicket}</div>
            <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-white/[0.06]">
              <StatTile label="POSITIONS" value={String(paper.positions.length)} />
              <StatTile label="WIN RATE" value={`${paper.account.winRate.toFixed(0)}%`} />
              <StatTile label="TRADES" value={String(paper.account.totalTrades)} />
            </div>
          </div>

          {/* Portfolio */}
          <div className="lg:col-span-4 p-7 space-y-6">
            <div className="[&_>div]:!bg-transparent [&_>div]:!border-0 [&_>div]:!shadow-none [&_>div]:!p-0">
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
    <div className="rounded-xl bg-white/[0.035] border border-white/[0.07] px-2.5 py-2 text-center">
      <div className="text-[8.5px] font-display tracking-[0.2em] text-white/55 font-medium">{label}</div>
      <div className="font-mono text-[14px] mt-0.5 font-semibold text-white tabular-nums">{value}</div>
    </div>
  );
}
