import { useMemo, useState } from 'react';
import { Bot, TrendingUp, Layers, Repeat, Activity, Zap, GitBranch, Sparkles, Play, Pause, X, Trash2, ChevronRight } from 'lucide-react';
import WaveBotPanel from '@/components/trading/WaveBotPanel';
import { STRATEGY_TEMPLATES, type StrategyTemplate, type StrategyKind } from './strategies';
import { useStrategyEngine } from '@/hooks/useStrategyEngine';
import type { RunnableKind } from '@/lib/strategies/runners';
import { WATCHLIST_CATEGORIES, type WatchlistSymbol } from '@/data/tradingSymbols';
import SymbolPicker from '@/components/shared/SymbolPicker';
import type { useWaveBot } from '@/hooks/useWaveBot';

const KIND_ICON: Record<StrategyKind, React.ElementType> = {
  grid: Layers, dca: Repeat, momentum: TrendingUp,
  meanReversion: Activity, trendFollowing: Zap, pairs: GitBranch, wave: Sparkles,
};
const RISK_COLOR: Record<StrategyTemplate['risk'], string> = {
  low: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  medium: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  high: 'text-red-400 border-red-500/30 bg-red-500/10',
};
const RUNNABLE: Record<StrategyKind, RunnableKind | null> = {
  grid: 'grid', dca: 'dca', meanReversion: 'meanReversion', trendFollowing: 'trendFollowing',
  momentum: null, pairs: null, wave: null,
};

interface Props {
  waveBot: ReturnType<typeof useWaveBot>;
  resolvePrice: (t: string) => number;
  getCandleHistory: (t: string) => number[] | null;
  onClosePosition: (posId: string, price: number) => void;
  onNavigate: (sym: WatchlistSymbol) => void;
  equity: number;
  paper: {
    submitOrder: (p: any) => any;
    positions: any[];
  };
}

const ALL_SYMBOLS: WatchlistSymbol[] = WATCHLIST_CATEGORIES.flatMap(c => c.items);

export default function AutomationBots({ waveBot, resolvePrice, getCandleHistory, onClosePosition, onNavigate, equity, paper }: Props) {
  const engine = useStrategyEngine({
    resolvePrice, getCandleHistory,
    submitOrder: paper.submitOrder as any,
    positions: paper.positions as any,
    equity,
  });

  const [selected, setSelected] = useState<StrategyKind>('grid');
  const [deploySymbol, setDeploySymbol] = useState<string>('GLD');
  const [paramOverrides, setParamOverrides] = useState<Record<string, number>>({});
  const active = STRATEGY_TEMPLATES.find(s => s.kind === selected)!;
  const runnableKind = RUNNABLE[selected];

  const paramsForDeploy = useMemo(() => {
    const p: Record<string, any> = {};
    active.params.forEach(sp => { p[sp.key] = paramOverrides[sp.key] ?? sp.default; });
    // sensible per-kind defaults used by runners
    if (selected === 'grid') {
      p.notionalUsd = paramOverrides.notionalUsd ?? 2500;
      p.levels = paramOverrides.levels ?? 10;
      p.stepPct = 0.01;
    }
    if (selected === 'dca') {
      p.contribution = paramOverrides.contribution ?? 100;
      p.periodMs = 60_000; // 1 min demo cadence
    }
    if (selected === 'meanReversion') {
      p.notionalUsd = 1000;
    }
    if (selected === 'trendFollowing') {
      p.notionalUsd = 1000;
    }
    return p;
  }, [selected, active, paramOverrides]);

  const handleDeploy = () => {
    if (!runnableKind) return;
    engine.deployBot(runnableKind, deploySymbol, paramsForDeploy);
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-gold" />
          <span className="text-[11px] font-display tracking-[0.2em] text-gold-light">STRATEGY BOTS</span>
          <span className="text-[9px] font-mono text-marble/25">· deterministic · paper</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[9px] font-mono text-marble/40">
            <span className="text-emerald-400">{engine.stats.running}</span>/{engine.stats.count} running
          </div>
          {engine.stats.count > 0 && (
            <button onClick={engine.killAll} className="text-[8px] font-display tracking-wider text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded">
              KILL ALL
            </button>
          )}
        </div>
      </div>

      {/* LIVE BOTS PANEL */}
      {engine.bots.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[9px] font-display tracking-[0.15em] text-emerald-400">■ RUNNING BOTS</div>
            <div className="text-[9px] font-mono text-marble/50">
              trades <span className="text-gold">{engine.stats.totalTrades}</span> ·
              realized <span className={engine.stats.totalRealized >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                ${engine.stats.totalRealized.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            {engine.bots.map(b => {
              const Icon = KIND_ICON[b.kind as StrategyKind] ?? Bot;
              const px = resolvePrice(b.symbol);
              const drift = b.bootPrice > 0 ? ((px - b.bootPrice) / b.bootPrice) * 100 : 0;
              return (
                <div key={b.id} className="rounded-lg border border-gold/10 bg-navy-dark/40 px-2.5 py-2 flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-gold/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-display tracking-wider text-gold-light">{b.kind.toUpperCase()}</span>
                      <span className="text-[9px] font-mono text-marble/60">{b.symbol}</span>
                      <span className={`text-[8px] font-display tracking-wider px-1 py-0.5 rounded border ${
                        b.status === 'running' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                        b.status === 'paused'  ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                        'text-red-400 border-red-500/30 bg-red-500/10'
                      }`}>{b.status.toUpperCase()}</span>
                    </div>
                    <div className="text-[8px] font-mono text-marble/40 truncate">
                      {b.lastReason} · trades {b.trades} · realized ${b.realized.toFixed(2)} · Δ {drift.toFixed(2)}%
                    </div>
                  </div>
                  {b.status === 'running' && (
                    <button onClick={() => engine.pauseBot(b.id)} title="pause" className="text-marble/50 hover:text-amber-400 p-1">
                      <Pause className="w-3 h-3" />
                    </button>
                  )}
                  {b.status === 'paused' && (
                    <button onClick={() => engine.resumeBot(b.id)} title="resume" className="text-marble/50 hover:text-emerald-400 p-1">
                      <Play className="w-3 h-3" />
                    </button>
                  )}
                  {b.status !== 'killed' && (
                    <button onClick={() => engine.killBot(b.id)} title="kill" className="text-marble/50 hover:text-red-400 p-1">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <button onClick={() => engine.removeBot(b.id)} title="remove" className="text-marble/50 hover:text-red-400 p-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TEMPLATE GALLERY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {STRATEGY_TEMPLATES.map(t => {
          const Icon = KIND_ICON[t.kind];
          const isActive = t.kind === selected;
          return (
            <button key={t.kind} onClick={() => { setSelected(t.kind); setParamOverrides({}); }}
              className={`text-left rounded-lg p-3 border transition-all ${
                isActive
                  ? 'border-gold/40 bg-gradient-to-br from-gold/10 to-gold/5 shadow-lg shadow-gold/10'
                  : 'border-gold/10 bg-navy-dark/40 hover:border-gold/25 hover:bg-navy-dark/60'
              }`}>
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-gold' : 'text-gold/50'}`} />
                  <span className={`text-[10px] font-display tracking-wider ${isActive ? 'text-gold' : 'text-marble/60'}`}>{t.name}</span>
                </div>
                <span className={`text-[7px] font-display tracking-wider px-1 py-0.5 rounded border ${RISK_COLOR[t.risk]}`}>
                  {t.risk.toUpperCase()}
                </span>
              </div>
              <div className="text-[9px] font-mono text-marble/40 leading-relaxed mb-1.5">{t.short}</div>
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

      {/* DETAIL / DEPLOY */}
      <div className="rounded-xl border border-gold/15 bg-gradient-to-br from-navy-light/40 to-navy-dark/40 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-display tracking-[0.15em] text-gold-light">{active.name}</div>
            <div className="text-[9px] font-mono text-marble/30 mt-0.5">{active.citation}</div>
          </div>
          {active.ready ? (
            <span className="text-[8px] font-display tracking-wider text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded">LIVE</span>
          ) : (
            <span className="text-[8px] font-display tracking-wider text-marble/40 border border-gold/15 bg-navy-dark/50 px-2 py-1 rounded">TEMPLATE</span>
          )}
        </div>

        <div className="rounded-lg bg-navy-dark/60 border border-gold/10 p-2.5">
          <div className="text-[8px] font-display tracking-wider text-marble/30 mb-1">FORMULA</div>
          <code className="text-[10px] font-mono text-gold/80 break-words">{active.formula}</code>
        </div>

        {/* WAVE keeps its own widget */}
        {selected === 'wave' && (
          <div className="rounded-lg border border-gold/10 bg-navy-dark/20 p-3">
            <WaveBotPanel
              config={waveBot.config} updateConfig={waveBot.updateConfig}
              trades={waveBot.trades} stats={waveBot.stats}
              killAll={waveBot.killAll} clearHistory={waveBot.clearHistory}
              botPositions={waveBot.botPositions} resolvePrice={resolvePrice}
              onClosePosition={onClosePosition} onNavigate={onNavigate} equity={equity}
            />
          </div>
        )}

        {/* DEPLOY FORM */}
        {runnableKind && (
          <div className="rounded-lg bg-navy-dark/60 border border-gold/10 p-3 space-y-2">
            <div className="text-[8px] font-display tracking-wider text-marble/40">DEPLOY (PAPER)</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <SymbolPicker
                  label="SYMBOL"
                  value={deploySymbol}
                  onChange={(t) => setDeploySymbol(t)}
                />
              </div>
              {active.params.map(sp => (
                <label key={sp.key} className="text-[9px] font-mono text-marble/50">
                  {sp.label}{sp.unit ? ` (${sp.unit})` : ''}
                  <input type="number" step={sp.step ?? 1} min={sp.min} max={sp.max}
                    value={paramOverrides[sp.key] ?? (sp.default as number)}
                    onChange={e => setParamOverrides(prev => ({ ...prev, [sp.key]: Number(e.target.value) }))}
                    className="mt-1 w-full bg-navy-dark border border-gold/15 rounded px-2 py-1 text-[10px] font-mono text-gold" />
                </label>
              ))}
            </div>
            <button onClick={handleDeploy}
              className="w-full text-[10px] font-display tracking-[0.15em] py-2 rounded border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors">
              <Play className="w-3 h-3 inline mr-1" /> DEPLOY BOT · PAPER
            </button>
            <div className="text-[8px] font-mono text-marble/30 leading-relaxed">
              Runs every 3s. Uses paper account. Ticks with reason + realized P&L are visible in RUNNING BOTS above.
            </div>
          </div>
        )}

        {!runnableKind && selected !== 'wave' && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[9px] font-mono text-amber-400/80">
            {selected === 'momentum' || selected === 'pairs'
              ? `${active.name} needs a multi-asset universe hookup — coming with the ranker/cointegration service. Formula and defaults are locked in above.`
              : 'Not yet runnable.'}
          </div>
        )}
      </div>
    </div>
  );
}