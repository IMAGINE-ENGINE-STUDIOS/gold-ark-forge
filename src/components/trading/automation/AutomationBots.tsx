import { useState } from 'react';
import { Bot, TrendingUp, Layers, Repeat, Activity, Zap, GitBranch, Sparkles, ChevronRight, Play, Info } from 'lucide-react';
import WaveBotPanel from '@/components/trading/WaveBotPanel';
import { STRATEGY_TEMPLATES, type StrategyTemplate, type StrategyKind } from './strategies';
import type { useWaveBot } from '@/hooks/useWaveBot';
import type { WatchlistSymbol } from '@/data/tradingSymbols';

const KIND_ICON: Record<StrategyKind, React.ElementType> = {
  grid: Layers,
  dca: Repeat,
  momentum: TrendingUp,
  meanReversion: Activity,
  trendFollowing: Zap,
  pairs: GitBranch,
  wave: Sparkles,
};

const RISK_COLOR: Record<StrategyTemplate['risk'], string> = {
  low: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  medium: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  high: 'text-red-400 border-red-500/30 bg-red-500/10',
};

interface Props {
  waveBot: ReturnType<typeof useWaveBot>;
  resolvePrice: (t: string) => number;
  onClosePosition: (posId: string, price: number) => void;
  onNavigate: (sym: WatchlistSymbol) => void;
  equity: number;
}

export default function AutomationBots({ waveBot, resolvePrice, onClosePosition, onNavigate, equity }: Props) {
  const [selected, setSelected] = useState<StrategyKind>('wave');
  const active = STRATEGY_TEMPLATES.find(s => s.kind === selected)!;

  return (
    <div className="space-y-4">
      {/* ══════ ENGINE HEADER ══════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-gold" />
          <span className="text-[11px] font-display tracking-[0.2em] text-gold-light">STRATEGY BOTS</span>
          <span className="text-[9px] font-mono text-marble/25">· deterministic · paper-only</span>
        </div>
        <div className="text-[9px] font-mono text-marble/30">
          {STRATEGY_TEMPLATES.filter(s => s.ready).length}/{STRATEGY_TEMPLATES.length} live
        </div>
      </div>

      {/* ══════ TEMPLATE GALLERY ══════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {STRATEGY_TEMPLATES.map(t => {
          const Icon = KIND_ICON[t.kind];
          const isActive = t.kind === selected;
          return (
            <button
              key={t.kind}
              onClick={() => setSelected(t.kind)}
              className={`text-left rounded-lg p-3 border transition-all ${
                isActive
                  ? 'border-gold/40 bg-gradient-to-br from-gold/10 to-gold/5 shadow-lg shadow-gold/10'
                  : 'border-gold/10 bg-navy-dark/40 hover:border-gold/25 hover:bg-navy-dark/60'
              }`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-gold' : 'text-gold/50'}`} />
                  <span className={`text-[10px] font-display tracking-wider ${isActive ? 'text-gold' : 'text-marble/60'}`}>
                    {t.name}
                  </span>
                </div>
                <span className={`text-[7px] font-display tracking-wider px-1 py-0.5 rounded border ${RISK_COLOR[t.risk]}`}>
                  {t.risk.toUpperCase()}
                </span>
              </div>
              <div className="text-[9px] font-mono text-marble/40 leading-relaxed mb-1.5">
                {t.short}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[7px] font-mono ${t.ready ? 'text-emerald-400/70' : 'text-marble/25'}`}>
                  {t.ready ? '● LIVE' : '○ TEMPLATE'}
                </span>
                <ChevronRight className={`w-3 h-3 ${isActive ? 'text-gold' : 'text-marble/20'}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* ══════ DETAIL PANEL ══════ */}
      <div className="rounded-xl border border-gold/15 bg-gradient-to-br from-navy-light/40 to-navy-dark/40 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-display tracking-[0.15em] text-gold-light">{active.name}</div>
            <div className="text-[9px] font-mono text-marble/30 mt-0.5">{active.citation}</div>
          </div>
          {active.ready ? (
            <span className="text-[8px] font-display tracking-wider text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded">
              LIVE
            </span>
          ) : (
            <span className="text-[8px] font-display tracking-wider text-marble/40 border border-gold/15 bg-navy-dark/50 px-2 py-1 rounded">
              PHASE 1 · SOON
            </span>
          )}
        </div>

        <div className="rounded-lg bg-navy-dark/60 border border-gold/10 p-2.5">
          <div className="text-[8px] font-display tracking-wider text-marble/30 mb-1">FORMULA</div>
          <code className="text-[10px] font-mono text-gold/80 break-words">{active.formula}</code>
        </div>

        {active.params.length > 0 && (
          <div>
            <div className="text-[8px] font-display tracking-wider text-marble/30 mb-1.5">DEFAULT PARAMETERS</div>
            <div className="grid grid-cols-2 gap-1.5">
              {active.params.map(p => (
                <div key={p.key} className="rounded bg-navy-dark/40 border border-gold/5 px-2 py-1.5">
                  <div className="text-[8px] font-mono text-marble/40">{p.label}</div>
                  <div className="text-[10px] font-mono text-gold">
                    {String(p.default)}{p.unit ? ` ${p.unit}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="text-[8px] font-display tracking-wider text-red-400/70 mb-1.5 flex items-center gap-1">
            <Info className="w-3 h-3" /> KNOWN PITFALLS
          </div>
          <ul className="space-y-0.5">
            {active.pitfalls.map((p, i) => (
              <li key={i} className="text-[9px] font-mono text-marble/45 flex gap-1.5">
                <span className="text-red-400/40">›</span>{p}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-navy-dark/60 border border-gold/10 p-2.5">
          <div className="text-[8px] font-display tracking-wider text-marble/30 mb-1">MANDATORY RISK OVERLAY</div>
          <div className="text-[9px] font-mono text-marble/50 leading-relaxed">
            Fixed-fractional 0.5–1% risk/trade · ATR stop · ≤ Half-Kelly cap · per-strategy 15–20% max-DD circuit breaker · paper-only until server-side gate is deployed.
          </div>
        </div>

        {!active.ready && (
          <button
            disabled
            className="w-full text-[10px] font-display tracking-[0.15em] py-2 rounded border border-gold/15 bg-navy-dark/40 text-marble/25 cursor-not-allowed"
          >
            <Play className="w-3 h-3 inline mr-1" /> DEPLOY · PHASE 1
          </button>
        )}
      </div>

      {/* ══════ LIVE: WAVE BOT ══════ */}
      {active.ready && active.kind === 'wave' && (
        <div className="rounded-xl border border-gold/10 bg-navy-dark/20 p-3">
          <WaveBotPanel
            config={waveBot.config}
            updateConfig={waveBot.updateConfig}
            trades={waveBot.trades}
            stats={waveBot.stats}
            killAll={waveBot.killAll}
            clearHistory={waveBot.clearHistory}
            botPositions={waveBot.botPositions}
            resolvePrice={resolvePrice}
            onClosePosition={onClosePosition}
            onNavigate={onNavigate}
            equity={equity}
          />
        </div>
      )}
    </div>
  );
}