import { useState } from 'react';
import { Play, Power, Skull, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Target, Trash2, Activity } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import type { WaveBotConfig, WaveTradeRecord, WaveBotStats } from '@/hooks/useWaveBot';
import PositionMiniCard from '@/components/trading/PositionMiniCard';
import type { WatchlistSymbol } from '@/data/tradingSymbols';

interface Props {
  config: WaveBotConfig;
  updateConfig: (patch: Partial<WaveBotConfig>) => void;
  trades: WaveTradeRecord[];
  stats: WaveBotStats;
  killAll: () => void;
  clearHistory: () => void;
  botPositions: Array<{ id: string; symbol: string; side: 'buy' | 'sell'; qty: number; entryPrice: number; currentPrice: number; pnl: number; pnlPercent?: number; botSource?: boolean }>;
  resolvePrice: (ticker: string) => number;
  onClosePosition: (posId: string, price: number) => void;
  onNavigate: (sym: WatchlistSymbol) => void;
  equity: number;
}

export default function WaveBotPanel({
  config, updateConfig, trades, stats, killAll, clearHistory,
  botPositions, resolvePrice, onClosePosition, onNavigate, equity,
}: Props) {
  const isOn = config.enabled;
  const [showLog, setShowLog] = useState(false);
  const [showTuning, setShowTuning] = useState(false);

  const budgetUsed = botPositions.reduce((s, p) => s + p.currentPrice * p.qty, 0);
  const pnlColor = stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400';
  const accuracyColor = stats.accuracy >= 60 ? 'text-emerald-400' : stats.accuracy >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-3">
      {/* ══════ MAIN CARD ══════ */}
      <div className="rounded-xl p-4 border border-gold/10 bg-gradient-to-br from-navy-light/60 to-navy-dark/40">
        {!isOn ? (
          <div className="space-y-4">
            {/* Budget */}
            <div>
              <div className="text-[10px] font-display tracking-[0.15em] text-marble/40 mb-2">INVESTMENT BUDGET</div>
              <div className="text-2xl font-mono font-bold text-gold mb-2">${config.budget.toLocaleString()}</div>
              <Slider
                value={[config.budget]}
                onValueChange={([v]) => updateConfig({ budget: v })}
                min={1000} max={100000} step={1000}
                className="w-full mb-2"
              />
              <div className="flex gap-1.5">
                {[5000, 10000, 25000, 50000].map(v => (
                  <button key={v} onClick={() => updateConfig({ budget: v })}
                    className={`flex-1 text-[10px] font-mono py-1.5 rounded transition-all ${
                      config.budget === v ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-navy-dark/50 text-marble/30 border border-gold/5 hover:border-gold/15'
                    }`}>
                    ${(v / 1000).toFixed(0)}K
                  </button>
                ))}
              </div>
            </div>

            {/* Interval */}
            <div>
              <div className="text-[10px] font-display tracking-[0.15em] text-marble/40 mb-2">
                SCAN INTERVAL: <span className="text-gold">{config.intervalSec}s</span>
              </div>
              <Slider
                value={[config.intervalSec]}
                onValueChange={([v]) => updateConfig({ intervalSec: v })}
                min={10} max={300} step={10}
                className="w-full"
              />
            </div>

            <Button
              onClick={() => updateConfig({ enabled: true })}
              className="w-full h-14 text-base font-display tracking-[0.2em] bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-5 h-5 mr-2" /> START WAVE BOT
            </Button>
            <div className="text-[9px] text-marble/25 text-center font-mono">
              🌊 WAVE Forecast → Trade every {config.intervalSec}s • ${config.budget.toLocaleString()} budget
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/40" />
                <span className="text-xs font-display tracking-[0.12em] text-emerald-400">🌊 WAVE TRADING</span>
                <span className="text-[9px] font-mono text-marble/25">every {config.intervalSec}s</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => updateConfig({ enabled: false })}
                className="h-7 text-[10px] font-display tracking-wider border-red-500/30 text-red-400 hover:bg-red-500/10">
                <Power className="w-3 h-3 mr-1" /> STOP
              </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-navy-dark/50 rounded-lg p-3 border border-gold/5">
                <div className="text-[9px] text-marble/30 font-display tracking-wider mb-0.5">ACCURACY</div>
                <div className={`text-xl font-mono font-bold ${accuracyColor}`}>
                  {stats.closedTrades > 0 ? `${stats.accuracy.toFixed(1)}%` : '—'}
                </div>
                <div className="text-[9px] font-mono text-marble/20 mt-0.5">
                  {stats.correctTrades}/{stats.closedTrades} correct
                </div>
              </div>
              <div className="bg-navy-dark/50 rounded-lg p-3 border border-gold/5">
                <div className="text-[9px] text-marble/30 font-display tracking-wider mb-0.5">P&L</div>
                <div className={`text-xl font-mono font-bold ${pnlColor}`}>
                  {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
                </div>
                <div className="text-[9px] font-mono text-marble/20 mt-0.5">
                  {stats.totalTrades} trades
                </div>
              </div>
              <div className="bg-navy-dark/50 rounded-lg p-3 border border-gold/5">
                <div className="text-[9px] text-marble/30 font-display tracking-wider mb-0.5">BUDGET</div>
                <div className="text-xl font-mono font-bold text-gold">${config.budget.toLocaleString()}</div>
                <div className="text-[9px] font-mono text-marble/20 mt-0.5">
                  ${budgetUsed.toFixed(0)} used
                </div>
              </div>
            </div>

            {/* Accuracy progress bar */}
            {stats.closedTrades > 0 && (
              <div className="rounded-lg px-3 py-2 border border-gold/5 bg-navy-dark/30">
                <div className="flex justify-between text-[9px] font-mono text-marble/30 mb-1">
                  <span><Target className="w-3 h-3 inline mr-1" />Forecast Accuracy</span>
                  <span className={accuracyColor}>{stats.accuracy.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-navy-dark/60 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${
                    stats.accuracy >= 60 ? 'bg-emerald-500' : stats.accuracy >= 40 ? 'bg-amber-500' : 'bg-red-500'
                  }`} style={{ width: `${Math.min(stats.accuracy, 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════ WAVE PARAMETER TUNING ══════ */}
      <button onClick={() => setShowTuning(!showTuning)}
        className="flex items-center gap-1.5 text-[10px] font-display tracking-[0.15em] text-marble/30 hover:text-marble/50 transition-colors w-full">
        {showTuning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        🌊 WAVE PARAMETERS — TUNE FOR ACCURACY
      </button>
      {showTuning && (
        <div className="space-y-3 bg-navy-dark/30 rounded-xl p-3 border border-gold/5">
          <ParamSlider label="Drift Multiplier" value={config.waveDrift} min={0.01} max={0.20} step={0.01}
            description="Trend-following strength"
            onChange={v => updateConfig({ waveDrift: v })} />
          <ParamSlider label="Wave Amplitude" value={config.waveAmplitude} min={0.1} max={0.8} step={0.05}
            description="Oscillation size"
            onChange={v => updateConfig({ waveAmplitude: v })} />
          <ParamSlider label="Damping" value={config.waveDamping} min={0.1} max={1.5} step={0.1}
            description="How quickly oscillation fades"
            onChange={v => updateConfig({ waveDamping: v })} />
          <ParamSlider label="Cycle Sensitivity" value={config.cycleSensitivity} min={0.1} max={1.0} step={0.05}
            description="Base frequency when no cycles detected"
            onChange={v => updateConfig({ cycleSensitivity: v })} />
          <ParamSlider label="Entry Threshold" value={config.entryThreshold} min={0.05} max={0.50} step={0.01}
            description="Minimum bias to enter a trade"
            onChange={v => updateConfig({ entryThreshold: v })} />
          <ParamSlider label="Max Positions" value={config.maxPositions} min={1} max={15} step={1}
            description="Maximum concurrent positions"
            onChange={v => updateConfig({ maxPositions: v })} />
        </div>
      )}

      {/* ══════ LIVE POSITIONS ══════ */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-display tracking-[0.15em] text-marble/40">
            📊 LIVE POSITIONS ({botPositions.length})
          </span>
          {botPositions.length > 0 && (
            <button onClick={killAll} className="text-[9px] font-display tracking-wider text-red-400/60 hover:text-red-400 transition-colors">
              <Skull className="w-3 h-3 inline mr-1" />CLOSE ALL
            </button>
          )}
        </div>
        {botPositions.length === 0 ? (
          <div className="rounded-lg p-3 border border-gold/5 bg-navy-dark/30 text-[10px] text-marble/35 font-mono">
            No WAVE positions yet. The bot scans every {config.intervalSec}s and opens trades when forecast bias exceeds {config.entryThreshold.toFixed(2)}.
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto watchlist-scroll">
            {botPositions.map(pos => (
              <PositionMiniCard
                key={pos.id}
                symbol={pos.symbol}
                side={pos.side}
                qty={pos.qty}
                entryPrice={pos.entryPrice}
                currentPrice={pos.currentPrice}
                pnl={pos.pnl ?? 0}
                pnlPercent={pos.pnlPercent ?? 0}
                posId={pos.id}
                resolvedPrice={resolvePrice(pos.symbol)}
                onClose={onClosePosition}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>

      {/* ══════ TRADE LOG WITH ACCURACY ══════ */}
      {trades.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <button onClick={() => setShowLog(!showLog)}
              className="flex items-center gap-1.5 text-[10px] font-display tracking-[0.15em] text-marble/30 hover:text-marble/50 transition-colors">
              {showLog ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              FORECAST LOG ({trades.length})
            </button>
            <button onClick={clearHistory} className="text-[8px] font-mono text-marble/20 hover:text-red-400 transition-colors">
              <Trash2 className="w-3 h-3 inline mr-0.5" />Clear
            </button>
          </div>
          {showLog && (
            <div className="space-y-1 mt-2 max-h-[300px] overflow-y-auto watchlist-scroll">
              {trades.slice(0, 50).map(t => (
                <div key={t.id} className="bg-navy-dark/30 rounded px-2.5 py-1.5 border border-gold/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {t.side === 'buy' ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
                      <span className={`text-[10px] font-mono font-bold ${t.side === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.side.toUpperCase()} {t.symbol}
                      </span>
                      <span className="text-[8px] font-mono text-marble/20">
                        bias: {t.forecastBias > 0 ? '+' : ''}{t.forecastBias.toFixed(3)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.closedAt && (
                        <span className={`text-[9px] font-mono font-bold ${t.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                          {t.correct ? '✓' : '✗'}
                        </span>
                      )}
                      {t.pnl !== undefined && (
                        <span className={`text-[9px] font-mono ${(t.pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {(t.pnl ?? 0) >= 0 ? '+' : ''}${(t.pnl ?? 0).toFixed(2)}
                        </span>
                      )}
                      <span className="text-[8px] font-mono text-marble/15">
                        {new Date(t.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 text-[8px] font-mono text-marble/20 mt-0.5 pl-5">
                    <span>Entry: ${t.entryPrice < 10 ? t.entryPrice.toFixed(4) : t.entryPrice.toFixed(2)}</span>
                    <span>Forecast: ${t.forecastPrice < 10 ? t.forecastPrice.toFixed(4) : t.forecastPrice.toFixed(2)}</span>
                    {t.exitPrice && <span>Exit: ${t.exitPrice < 10 ? t.exitPrice.toFixed(4) : t.exitPrice.toFixed(2)}</span>}
                    <span>{t.predictedDirection === 'bullish' ? '📈' : '📉'} {t.predictedDirection}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Reusable Slider ─────────────────────────────────────

function ParamSlider({ label, description, value, min, max, step, onChange }: {
  label: string; description: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[9px] font-display tracking-wider text-marble/40">{label}</span>
        <span className="text-[10px] font-mono text-gold">{value.toFixed(step < 0.1 ? 2 : 1)}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} className="w-full" />
      <div className="text-[8px] font-mono text-marble/15 mt-0.5">{description}</div>
    </div>
  );
}
