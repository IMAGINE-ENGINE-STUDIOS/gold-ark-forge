/**
 * APEX Performance Dashboard — Real-time accuracy tracking,
 * weight evolution, correction timeline, and shot history.
 */
import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  BarChart3, Activity, Target, RefreshCw, Zap, Brain,
} from 'lucide-react';
import { getApexStats, resetApexState, DEFAULT_WEIGHTS, type ApexStats } from '@/lib/apexForecast';

const WEIGHT_LABELS: Record<string, string> = {
  rsi: 'RSI',
  sma20: 'SMA 20',
  sma50: 'SMA 50',
  ema20: 'EMA 20',
  macd: 'MACD',
  boll: 'Bollinger',
  momentum: 'Momentum',
  vwap: 'VWAP',
};

const WeightBar = ({ name, value, defaultValue }: { name: string; value: number; defaultValue: number }) => {
  const pct = Math.min(100, (value / 2.0) * 100); // max weight is 2.0
  const defaultPct = Math.min(100, (defaultValue / 2.0) * 100);
  const diff = ((value - defaultValue) / defaultValue * 100);
  const isUp = diff > 2;
  const isDown = diff < -2;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-marble/50 w-16 text-right">{WEIGHT_LABELS[name] ?? name}</span>
      <div className="flex-1 h-3 bg-navy-dark/80 rounded-full overflow-hidden relative">
        {/* Default marker */}
        <div
          className="absolute top-0 h-full w-px bg-marble/20"
          style={{ left: `${defaultPct}%` }}
        />
        {/* Current value */}
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isUp ? 'bg-emerald-500' : isDown ? 'bg-red-400' : 'bg-gold/60'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[9px] font-mono w-10 text-right ${isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-marble/30'}`}>
        {value.toFixed(2)}
      </span>
      {isUp && <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />}
      {isDown && <TrendingDown className="w-2.5 h-2.5 text-red-400" />}
      {!isUp && !isDown && <Minus className="w-2.5 h-2.5 text-marble/20" />}
    </div>
  );
};

const ApexDashboard = ({ stats: externalStats }: { stats?: Partial<ApexStats> }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'weights' | 'history' | 'timeline'>('weights');
  const stats = { ...getApexStats(), ...externalStats };

  const accuracyColor = stats.winRate >= 60 ? 'text-emerald-400' : stats.winRate >= 40 ? 'text-amber-400' : 'text-red-400';
  const accuracyBg = stats.winRate >= 60 ? 'bg-emerald-500/15 border-emerald-500/30' : stats.winRate >= 40 ? 'bg-amber-400/10 border-amber-400/30' : 'bg-red-500/15 border-red-500/30';

  return (
    <div className="border border-gold/15 rounded-sm bg-navy-dark/40 overflow-hidden">
      {/* Collapsed Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gold/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-display tracking-[0.15em] text-marble/70">APEX PERFORMANCE</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Mini stats */}
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono ${accuracyColor}`}>
              {stats.winRate.toFixed(0)}% win
            </span>
            <span className="text-[9px] font-mono text-marble/25">
              G{stats.generation}
            </span>
            <span className="text-[9px] font-mono text-marble/25">
              {stats.corrections} fix{stats.corrections !== 1 ? 'es' : ''}
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
            {stats.last5Detail.length === 0 && (
              <span className="text-[8px] text-marble/20">no data</span>
            )}
          </div>
          {expanded ? <ChevronUp className="w-3 h-3 text-marble/30" /> : <ChevronDown className="w-3 h-3 text-marble/30" />}
        </div>
      </button>

      {/* Expanded Dashboard */}
      {expanded && (
        <div className="border-t border-gold/10 p-3 space-y-3">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className={`rounded p-2 border ${accuracyBg}`}>
              <div className="text-[8px] font-display tracking-wider text-marble/30 mb-0.5">ACCURACY</div>
              <div className={`text-lg font-display font-semibold ${accuracyColor}`}>
                {stats.winRate.toFixed(1)}%
              </div>
              <div className="text-[8px] text-marble/20">{stats.totalShots} evaluated</div>
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
              <div className="text-[8px] font-display tracking-wider text-marble/30 mb-0.5">GENERATION</div>
              <div className="text-lg font-display text-marble">{stats.generation}</div>
              <div className="text-[8px] text-marble/20">learning cycles</div>
            </div>
            <div className="bg-navy/40 rounded p-2 border border-gold/10">
              <div className="text-[8px] font-display tracking-wider text-marble/30 mb-0.5">CORRECTIONS</div>
              <div className="text-lg font-display text-amber-400">{stats.corrections}</div>
              <div className="text-[8px] text-marble/20">weight adjustments</div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 border-b border-gold/10 pb-1">
            {(['weights', 'history', 'timeline'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-[9px] font-display tracking-[0.15em] rounded-t transition-colors ${
                  activeTab === tab ? 'bg-gold/10 text-gold border border-gold/20 border-b-0' : 'text-marble/30 hover:text-marble/50'
                }`}
              >
                {tab === 'weights' && <BarChart3 className="w-3 h-3 inline mr-1" />}
                {tab === 'history' && <Target className="w-3 h-3 inline mr-1" />}
                {tab === 'timeline' && <Activity className="w-3 h-3 inline mr-1" />}
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Weight Evolution */}
          {activeTab === 'weights' && (
            <div className="space-y-1.5">
              <div className="text-[8px] font-display tracking-wider text-marble/20 mb-2">
                INDICATOR WEIGHTS · DEFAULT MARKER (|) · CURRENT BAR
              </div>
              {Object.entries(stats.weights).map(([name, value]) => (
                <WeightBar
                  key={name}
                  name={name}
                  value={value}
                  defaultValue={DEFAULT_WEIGHTS[name as keyof typeof DEFAULT_WEIGHTS]}
                />
              ))}
            </div>
          )}

          {/* Shot History */}
          {activeTab === 'history' && (
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              <div className="text-[8px] font-display tracking-wider text-marble/20 mb-2">
                PREDICTION LOG · LAST {Math.min(20, stats.shots.length)} SHOTS
              </div>
              {stats.shots.length === 0 && (
                <div className="text-[10px] text-marble/20 text-center py-4">No shots recorded yet. Enable APEX to start tracking.</div>
              )}
              {stats.shots.slice(0, 20).map((shot, i) => {
                const isEval = shot.correct !== undefined;
                return (
                  <div key={shot.id || i} className={`flex items-center gap-2 px-2 py-1.5 rounded text-[9px] font-mono border ${
                    isEval
                      ? shot.correct ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'
                      : 'bg-navy/30 border-gold/5'
                  }`}>
                    {/* Status dot */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isEval ? (shot.correct ? 'bg-emerald-400' : 'bg-red-400') : 'bg-marble/15 animate-pulse'
                    }`} />

                    {/* Direction */}
                    <span className={`w-12 ${
                      shot.predictedDirection === 'bullish' ? 'text-emerald-400' :
                      shot.predictedDirection === 'bearish' ? 'text-red-400' : 'text-marble/30'
                    }`}>
                      {shot.predictedDirection === 'bullish' ? '▲ BULL' : shot.predictedDirection === 'bearish' ? '▼ BEAR' : '— FLAT'}
                    </span>

                    {/* Probability */}
                    <span className="text-marble/30 w-8">
                      {((shot.probability ?? 0.5) * 100).toFixed(0)}%
                    </span>

                    {/* Entry → Predicted */}
                    <span className="text-marble/20 flex-1 text-right">
                      ${shot.entryPrice.toFixed(2)} → ${shot.predictedPrice.toFixed(2)}
                    </span>

                    {/* Actual & Error */}
                    {isEval && shot.actualPrice !== undefined && (
                      <span className={`w-20 text-right ${shot.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                        ${shot.actualPrice.toFixed(2)} ({shot.error !== undefined && shot.error >= 0 ? '+' : ''}{(shot.error ?? 0).toFixed(2)})
                      </span>
                    )}
                    {!isEval && <span className="w-20 text-right text-marble/15">pending…</span>}

                    {/* Time ago */}
                    <span className="text-marble/15 w-14 text-right">
                      {formatTimeAgo(shot.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Correction Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              <div className="text-[8px] font-display tracking-wider text-marble/20 mb-2">
                WEIGHT EVOLUTION TIMELINE · ACCURACY AT EACH GENERATION
              </div>
              {stats.weightHistory.length === 0 && (
                <div className="text-[10px] text-marble/20 text-center py-4">No correction cycles completed yet.</div>
              )}
              {stats.weightHistory.map((snap, i) => (
                <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded text-[9px] font-mono border ${
                  snap.correctionApplied ? 'bg-amber-400/5 border-amber-400/15' : 'bg-navy/30 border-gold/5'
                }`}>
                  <span className="text-marble/30 w-8">G{snap.generation}</span>
                  
                  {/* Accuracy bar */}
                  <div className="flex-1 flex items-center gap-1.5">
                    <div className="flex-1 h-2 bg-navy-dark/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          snap.accuracy >= 60 ? 'bg-emerald-500' : snap.accuracy >= 40 ? 'bg-amber-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${snap.accuracy}%` }}
                      />
                    </div>
                    <span className={`w-10 text-right ${
                      snap.accuracy >= 60 ? 'text-emerald-400' : snap.accuracy >= 40 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {snap.accuracy.toFixed(0)}%
                    </span>
                  </div>

                  {/* Correction badge */}
                  {snap.correctionApplied && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                      CORRECTED
                    </span>
                  )}

                  <span className="text-marble/15 w-14 text-right">
                    {formatTimeAgo(snap.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Reset Button */}
          <div className="flex justify-end pt-1 border-t border-gold/5">
            <button
              onClick={() => {
                resetApexState();
                setExpanded(false);
              }}
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
