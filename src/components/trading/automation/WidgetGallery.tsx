/**
 * ══════════════════════════════════════════════════════════════════════
 *  AUTOMATION WIDGET GALLERY
 * ══════════════════════════════════════════════════════════════════════
 *
 *  Purpose: preserve every legacy Automation widget exactly as it was
 *  before the new AutomationEngine rewrite. Nothing in this file
 *  changes behavior — it only re-exports the original components and
 *  offers a single <LegacyAutomationGallery/> composition so that any
 *  Swap surface can drop the whole set back in with one line.
 *
 *  DO NOT modify the underlying widget files. If a widget needs to
 *  evolve, fork it inside AutomationEngine sub-modules; the Gallery
 *  stays frozen as the "as-of" snapshot.
 * ══════════════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, Bot, CalendarDays, Bell, Layers } from 'lucide-react';

import GeniusPanel from '@/components/trading/GeniusPanel';
import WaveBotPanel from '@/components/trading/WaveBotPanel';
import SchedulePanel from '@/components/trading/SchedulePanel';
import PriceAlerts from '@/components/trading/PriceAlerts';
import RuleBuilder from '@/components/trading/RuleBuilder';

import type { useWaveBot } from '@/hooks/useWaveBot';
import type { useGeniusTrader } from '@/hooks/useGeniusTrader';
import type { usePriceAlerts } from '@/hooks/usePriceAlerts';
import type { WatchlistSymbol } from '@/data/tradingSymbols';

// ─── Re-exports (single import surface) ────────────────────────
export { GeniusPanel, WaveBotPanel, SchedulePanel, PriceAlerts, RuleBuilder };

// ─── Gallery composition ───────────────────────────────────────

export interface LegacyAutomationGalleryProps {
  waveBot: ReturnType<typeof useWaveBot>;
  genius: ReturnType<typeof useGeniusTrader>;
  alertsHook: ReturnType<typeof usePriceAlerts>;
  resolvePrice: (ticker: string) => number;
  onClosePosition: (posId: string, price: number) => void;
  onNavigate: (sym: WatchlistSymbol) => void;
  equity: number;
  /** Which sections start expanded. Defaults to none (all collapsed). */
  initialOpen?: Array<'genius' | 'wave' | 'schedule' | 'alerts' | 'rules'>;
}

type SectionKey = 'genius' | 'wave' | 'schedule' | 'alerts' | 'rules';

const SECTIONS: Array<{ key: SectionKey; label: string; icon: React.ElementType; description: string }> = [
  { key: 'genius',   label: 'GENIUS STRATEGIST',  icon: Brain,        description: 'AI cycle trader — manual-first, circuit-broken' },
  { key: 'wave',     label: 'WAVE BOT',           icon: Bot,          description: 'Damped-sinusoid forecast bot (paper only)' },
  { key: 'schedule', label: 'SCHEDULED ORDERS',   icon: CalendarDays, description: 'Time-based order queue' },
  { key: 'alerts',   label: 'PRICE ALERTS',       icon: Bell,         description: 'Threshold + sound/notification alerts' },
  { key: 'rules',    label: 'RULE BUILDER',       icon: Layers,       description: 'Visual IF/THEN rules (dry-run)' },
];

export function LegacyAutomationGallery(props: LegacyAutomationGalleryProps) {
  const { waveBot, genius, alertsHook, resolvePrice, onClosePosition, onNavigate, equity } = props;
  const [open, setOpen] = useState<Set<SectionKey>>(() => new Set(props.initialOpen ?? []));

  const toggle = (k: SectionKey) => {
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <div className="text-[9px] font-display tracking-[0.2em] text-marble/30 mb-1">
        LEGACY AUTOMATION WIDGETS · PRESERVED
      </div>

      {SECTIONS.map(({ key, label, icon: Icon, description }) => {
        const isOpen = open.has(key);
        return (
          <div key={key} className="rounded-lg border border-gold/10 bg-navy-dark/30 overflow-hidden">
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-gold/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-gold/60" />
                <div className="text-left">
                  <div className="text-[10px] font-display tracking-[0.12em] text-gold-light">{label}</div>
                  <div className="text-[8px] font-mono text-marble/30">{description}</div>
                </div>
              </div>
              {isOpen
                ? <ChevronUp className="w-3.5 h-3.5 text-marble/40" />
                : <ChevronDown className="w-3.5 h-3.5 text-marble/40" />}
            </button>

            {isOpen && (
              <div className="px-3 pb-3 pt-1 border-t border-gold/10">
                {key === 'genius'   && <GeniusPanel {...genius} />}
                {key === 'wave'     && (
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
                )}
                {key === 'schedule' && <SchedulePanel />}
                {key === 'alerts'   && <PriceAlerts alertsHook={alertsHook} resolvePrice={resolvePrice} />}
                {key === 'rules'    && <RuleBuilder />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default LegacyAutomationGallery;