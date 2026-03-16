/**
 * APEX Performance Dashboard — Prediction log with accuracy %,
 * weight evolution, correction timeline, and adaptive threshold status.
 */
import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  BarChart3, Activity, Target, RefreshCw, Zap, Brain, Shield, ShieldAlert,
  Timer, ArrowLeftRight, Trash2,
} from 'lucide-react';
import { getApexStats, resetApexState, DEFAULT_WEIGHTS, type ApexStats } from '@/lib/apexForecast';

// v5: Auto-reset poisoned data from v4 inverted signals on first load
const V5_RESET_KEY = 'ga_apex_v5_reset_done';


const WEIGHT_LABELS: Record<string, string> = {
  rsi: 'RSI', sma20: 'SMA 20', sma50: 'SMA 50', ema20: 'EMA 20',
  macd: 'MACD', boll: 'Bollinger', momentum: 'Momentum', vwap: 'VWAP',
  stochastic: 'Stochastic', roc: 'ROC', adx: 'ADX', smaCross: 'SMA Cross',
};

const WeightBar = ({ name, value, defaultValue, sigAcc, isMuted }: { name: string; value: number; defaultValue: number; sigAcc?: { correct: number; wrong: number; pct: number }; isMuted?: boolean }) => {
  const pct = Math.min(100, (value / 2.0) * 100);
  const defaultPct = Math.min(100, (defaultValue / 2.0) * 100);
  const diff = ((value - defaultValue) / defaultValue * 100);
  const isUp = diff > 2;
  const isDown = diff < -2;

  return (
    <div className={`flex items-center gap-2 ${isMuted ? 'opacity-30' : ''}`}>
      <span className="text-[9px] font-mono text-marble/50 w-16 text-right">{WEIGHT_LABELS[name] ?? name}</span>
      <div className="flex-1 h-3 bg-navy-dark/80 rounded-full overflow-hidden relative">
        <div className="absolute top-0 h-full w-px bg-marble/20" style={{ left: `${defaultPct}%` }} />
        <div
          className={`h-full rounded-full transition-all duration-500 ${isMuted ? 'bg-marble/20' : isUp ? 'bg-emerald-500' : isDown ? 'bg-red-400' : 'bg-gold/60'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[9px] font-mono w-10 text-right ${isMuted ? 'text-marble/20' : isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-marble/30'}`}>
        {value.toFixed(2)}
      </span>
      {sigAcc && (sigAcc.correct + sigAcc.wrong) > 0 && (
        <span className={`text-[8px] font-mono w-10 text-right ${sigAcc.pct >= 60 ? 'text-emerald-400' : sigAcc.pct >= 45 ? 'text-amber-400' : 'text-red-400'}`}>
          {sigAcc.pct.toFixed(0)}%
        </span>
      )}
      {isMuted && <span className="text-[7px] px-1 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/20">MUTED</span>}
      {!isMuted && isUp && <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />}
      {!isMuted && isDown && <TrendingDown className="w-2.5 h-2.5 text-red-400" />}
      {!isMuted && !isUp && !isDown && <Minus className="w-2.5 h-2.5 text-marble/20" />}
    </div>
  );
};

const ApexDashboard = ({ stats: externalStats }: { stats?: Partial<ApexStats> }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'predictions' | 'weights' | 'timeline'>('predictions');
  const stats = { ...getApexStats(), ...externalStats };

  const accColor = stats.accuracyPct >= 75 ? 'text-emerald-400' : stats.accuracyPct >= 50 ? 'text-amber-400' : 'text-red-400';
  const accBg = stats.accuracyPct >= 75 ? 'bg-emerald-500/15 border-emerald-500/30' : stats.accuracyPct >= 50 ? 'bg-amber-400/10 border-amber-400/30' : 'bg-red-500/15 border-red-500/30';

  return (
    <div className="border border-gold/15 rounded-sm bg-navy-dark/40 overflow-hidden">
      {/* Collapsed Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gold/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-display tracking-[0.15em] text-marble/70">APEX ACCURACY</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Accuracy badge */}
          <div className="flex items-center gap-1.5">
            {stats.aboveFloor
              ? <Shield className="w-3 h-3 text-emerald-400" />
              : <ShieldAlert className="w-3 h-3 text-red-400 animate-pulse" />
            }
            <span className={`text-[11px] font-mono font-semibold ${accColor}`}>
              {stats.totalEvaluated > 0 ? `${stats.accuracyPct.toFixed(1)}%` : '—'}
            </span>
            <span className="text-[9px] font-mono text-marble/25">
              {stats.totalCorrect}/{stats.totalEvaluated}
            </span>
          </div>
          {/* Last 5 dots */}
          <div className="flex items-center gap-0.5">
            {stats.last5Detail.map((shot, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${shot.correct ? 'bg-emerald-400' : 'bg-red-400'}`}
                title={`${shot.direction}: ${shot.correct ? '✓' : '✗'}`}
              />
            ))}
            {stats.last5Detail.length === 0 && <span className="text-[8px] text-marble/20">no data</span>}
          </div>
          {expanded ? <ChevronUp className="w-3 h-3 text-marble/30" /> : <ChevronDown className="w-3 h-3 text-marble/30" />}
        </div>
      </button>

      {/* Expanded Dashboard */}
      {expanded && (
        <div className="border-t border-gold/10 p-3 space-y-3">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className={`rounded p-2 border ${accBg}`}>
              <div className="text-[8px] font-display tracking-wider text-marble/30 mb-0.5">ACCURACY</div>
              <div className={`text-lg font-display font-semibold ${accColor}`}>
                {stats.totalEvaluated > 0 ? `${stats.accuracyPct.toFixed(1)}%` : '—'}
              </div>
              <div className="text-[8px] text-marble/20">{stats.totalCorrect}✓ / {stats.totalEvaluated} eval</div>
            </div>
            <div className="bg-navy/40 rounded p-2 border border-gold/10">
              <div className="text-[8px] font-display tracking-wider text-marble/30 mb-0.5">PREDICTIONS</div>
              <div className="text-lg font-display text-marble">{stats.totalPredictions}</div>
              <div className="text-[8px] text-marble/20">{stats.totalPredictions - stats.totalEvaluated} pending</div>
            </div>
            <div className="bg-navy/40 rounded p-2 border border-gold/10">
              <div className="text-[8px] font-display tracking-wider text-marble/30 mb-0.5">STREAK</div>
              <div className="text-lg font-display text-marble">
                {stats.streak}
                {stats.streak >= 3 && <Zap className="w-3 h-3 inline ml-1 text-gold" />}
              </div>
              <div className="text-[8px] text-marble/20">consecutive ✓</div>
            </div>
            <div className="bg-navy/40 rounded p-2 border border-gold/10">
              <div className="text-[8px] font-display tracking-wider text-marble/30 mb-0.5">GATE</div>
              <div className={`text-lg font-display ${stats.aboveFloor ? 'text-emerald-400' : 'text-amber-400'}`}>
                {stats.adaptiveThreshold}
              </div>
              <div className="text-[8px] text-marble/20">min signals req.</div>
            </div>
          </div>

          {/* Accuracy floor indicator */}
          {!stats.aboveFloor && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-red-500/10 border border-red-500/20 text-[9px] text-red-400">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
              Accuracy below 75% — confluence threshold raised to {stats.adaptiveThreshold} signals to recover
            </div>
          )}

          {/* v4.1: Cooldown indicator */}
          {(stats as any).inCooldown && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-amber-400/10 border border-amber-400/20 text-[9px] text-amber-400">
              <Timer className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
              Cooldown active — {(stats as any).cooldownRemainingSec}s remaining after consecutive misses
            </div>
          )}

          {/* v4.1: Direction persistence indicator */}
          {(stats as any).lastDirection && (stats as any).lastDirection !== 'neutral' && (
            <div className="flex items-center gap-2 px-2 py-1 text-[8px] text-marble/30">
              <ArrowLeftRight className="w-3 h-3" />
              Last direction: <span className={(stats as any).lastDirection === 'bullish' ? 'text-emerald-400' : 'text-red-400'}>
                {(stats as any).lastDirection === 'bullish' ? '▲ BULL' : '▼ BEAR'}
              </span> · flip requires |bias| {'>'} 0.15
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex gap-1 border-b border-gold/10 pb-1">
            {(['predictions', 'weights', 'timeline'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-[9px] font-display tracking-[0.15em] rounded-t transition-colors ${
                  activeTab === tab ? 'bg-gold/10 text-gold border border-gold/20 border-b-0' : 'text-marble/30 hover:text-marble/50'
                }`}
              >
                {tab === 'predictions' && <Target className="w-3 h-3 inline mr-1" />}
                {tab === 'weights' && <BarChart3 className="w-3 h-3 inline mr-1" />}
                {tab === 'timeline' && <Activity className="w-3 h-3 inline mr-1" />}
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Prediction Log */}
          {activeTab === 'predictions' && (
            <div className="space-y-1 max-h-[280px] overflow-y-auto">
              <div className="text-[8px] font-display tracking-wider text-marble/20 mb-2">
                DIRECTIONAL PREDICTIONS · UP/DOWN ONLY · ACCURACY: {stats.totalEvaluated > 0 ? `${stats.accuracyPct.toFixed(1)}%` : '—'}
              </div>
              {stats.predictionLog.length === 0 && (
                <div className="text-[10px] text-marble/20 text-center py-4">No directional predictions yet. APEX will predict when {stats.adaptiveThreshold}+ signals agree.</div>
              )}
              {stats.predictionLog.map((p) => {
                const isEval = p.correct !== undefined;
                return (
                  <div key={p.id} className={`flex items-center gap-2 px-2 py-1.5 rounded text-[9px] font-mono border ${
                    isEval
                      ? p.correct ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'
                      : 'bg-navy/30 border-gold/5'
                  }`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isEval ? (p.correct ? 'bg-emerald-400' : 'bg-red-400') : 'bg-marble/15 animate-pulse'
                    }`} />
                    <span className={`w-8 font-semibold ${p.direction === 'bullish' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {p.direction === 'bullish' ? '▲ UP' : '▼ DN'}
                    </span>
                    <span className="text-marble/30 w-8">{(p.probability * 100).toFixed(0)}%</span>
                    <span className="text-[8px] text-marble/15 w-6">{p.confluence}sig</span>
                    <span className="text-marble/20 flex-1 text-right">
                      ${p.entryPrice.toFixed(2)}
                    </span>
                    {isEval && p.actualPrice !== undefined && (
                      <span className={`w-16 text-right font-semibold ${p.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                        {p.correct ? '✓ HIT' : '✗ MISS'}
                      </span>
                    )}
                    {!isEval && <span className="w-16 text-right text-marble/15">pending…</span>}
                    <span className="text-marble/15 w-12 text-right">{formatTimeAgo(p.timestamp)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Weight Evolution */}
          {activeTab === 'weights' && (
            <div className="space-y-1.5">
              <div className="text-[8px] font-display tracking-wider text-marble/20 mb-2">
                INDICATOR WEIGHTS · DEFAULT (|) · ACCURACY % · MUTED = KILL-SWITCHED
              </div>
              {Object.entries(stats.weights).map(([name, value]) => (
                <WeightBar
                  key={name}
                  name={name}
                  value={value}
                  defaultValue={DEFAULT_WEIGHTS[name as keyof typeof DEFAULT_WEIGHTS]}
                  sigAcc={(stats as any).signalAccuracy?.[name]}
                  isMuted={(stats as any).mutedSignals?.includes(name)}
                />
              ))}
            </div>
          )}

          {/* Correction Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              <div className="text-[8px] font-display tracking-wider text-marble/20 mb-2">
                WEIGHT EVOLUTION · ACCURACY AT EACH GENERATION
              </div>
              {stats.weightHistory.length === 0 && (
                <div className="text-[10px] text-marble/20 text-center py-4">No correction cycles completed yet.</div>
              )}
              {stats.weightHistory.map((snap, i) => (
                <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded text-[9px] font-mono border ${
                  snap.correctionApplied ? 'bg-amber-400/5 border-amber-400/15' : 'bg-navy/30 border-gold/5'
                }`}>
                  <span className="text-marble/30 w-8">G{snap.generation}</span>
                  <div className="flex-1 flex items-center gap-1.5">
                    <div className="flex-1 h-2 bg-navy-dark/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          snap.accuracy >= 75 ? 'bg-emerald-500' : snap.accuracy >= 50 ? 'bg-amber-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${snap.accuracy}%` }}
                      />
                    </div>
                    <span className={`w-10 text-right ${
                      snap.accuracy >= 75 ? 'text-emerald-400' : snap.accuracy >= 50 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {snap.accuracy.toFixed(0)}%
                    </span>
                  </div>
                  {snap.correctionApplied && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                      CORRECTED
                    </span>
                  )}
                  <span className="text-marble/15 w-14 text-right">{formatTimeAgo(snap.timestamp)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reset */}
          <div className="flex justify-end pt-1 border-t border-gold/5">
            <button
              onClick={() => { resetApexState(); setExpanded(false); }}
              className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-display tracking-wider text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors border border-transparent hover:border-red-500/20"
            >
              <RefreshCw className="w-3 h-3" />
              RESET LEARNING
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

export default ApexDashboard;
