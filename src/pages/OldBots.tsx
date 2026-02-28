import { Link } from 'react-router-dom';
import { ArrowLeft, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OldBots() {
  return (
    <div className="min-h-screen bg-navy text-marble p-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/trading-bridge">
          <Button variant="ghost" className="mb-6 text-marble/50 hover:text-marble">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Trading Bridge
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Archive className="w-8 h-8 text-gold/50" />
          <div>
            <h1 className="text-2xl font-display text-gold">Archived Bot Systems</h1>
            <p className="text-sm text-marble/40 mt-1">Previous trading bot implementations preserved for reference</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Old Bot #1: 30-Indicator AI Bot */}
          <div className="rounded-xl border border-gold/10 bg-navy-light/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display text-marble/70">🤖 Multi-Indicator AI Bot</h2>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">DEPRECATED</span>
            </div>
            <p className="text-sm text-marble/40 mb-4">
              30-indicator composite signal engine with AI edge function validation. Used trend, momentum, volatility, 
              volume and wave groups with configurable strategy presets (Conservative, Balanced, Aggressive, Wave-First, Micro).
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-marble/30">
              <div>
                <div className="text-marble/50 mb-1">Files</div>
                <div>src/hooks/useTradingBot.ts</div>
                <div>src/components/trading/BotControlPanel.tsx</div>
              </div>
              <div>
                <div className="text-marble/50 mb-1">Why Archived</div>
                <div>Bot never reliably opened positions. Complex indicator pipeline produced signals that were consistently filtered out by downstream checks. AI edge function added latency without improving accuracy.</div>
              </div>
            </div>
          </div>

          {/* Current System Reference */}
          <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display text-emerald-400">🌊 WAVE Forecast Engine</h2>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ACTIVE</span>
            </div>
            <p className="text-sm text-marble/40">
              Replaced the old bot with a direct WAVE forecast → trade → measure → tune pipeline. 
              Trades every 80 seconds based on the forecast bias, tracks real-time accuracy, 
              and exposes tunable parameters (drift, amplitude, damping, cycle sensitivity).
            </p>
            <Link to="/trading-bridge" className="inline-block mt-3">
              <Button variant="outline" size="sm" className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10">
                Open Trading Bridge →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
