import { useState } from 'react';
import { Workflow, Cpu, Waves, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { PipelineProvider, usePipeline } from '@/components/pipeline/PipelineProvider';
import AssetUniverse from '@/components/pipeline/AssetUniverse';
import WorkflowCanvas from '@/components/trading/WorkflowCanvas';
import { LivePriceIndicator } from '@/components/trading/LivePriceIndicator';
import type { WatchlistSymbol } from '@/data/tradingSymbols';

const PipelineWorkspace = () => {
  const { paper, resolvePriceForTicker, subscribe } = usePipeline();
  const [focus, setFocus] = useState<WatchlistSymbol | null>(null);

  const pick = (s: WatchlistSymbol) => {
    subscribe(s.ticker);
    setFocus(s);
  };

  return (
    <>
      <section className="relative z-10 mb-5">
        <div className="alien-panel alien-scan relative overflow-hidden p-5 sm:p-7">
          <span className="alien-orb -left-10 -top-16 h-56 w-56 bg-gold/30" />
          <span className="alien-orb right-0 top-10 h-48 w-48 bg-emerald-400/25" style={{ animationDelay: '3s' }} />
          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <Workflow className="h-5 w-5 text-gold-light" />
            <h1 className="font-display text-xl tracking-[0.28em] text-gold-light sm:text-2xl">PIPELINE</h1>
            <span className="alien-chip px-2.5 py-1 font-mono text-[8px] tracking-[0.2em] text-muted-foreground">
              AUTONOMOUS EXECUTION FABRIC
            </span>
            <Link
              to="/trading-bridge"
              className="alien-chip ml-auto flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] text-gold-light hover:text-gold"
            >
              <ArrowLeft className="h-3 w-3" /> SWAP
            </Link>
          </div>
          <p className="relative z-10 mt-3 max-w-2xl font-mono text-[10px] leading-relaxed tracking-wider text-muted-foreground">
            DRAG ANY INSTRUMENT FROM THE UNIVERSE INTO THE CANVAS. CHAIN ACTIONS, ALERTS AND STRATEGIES.
            EVERY NODE READS THE SAME LIVE PRICE SUBSTRATE — REAL FEEDS ONLY.
          </p>
          <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2">
            <span className="alien-chip flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-[0.18em] text-gold-light">
              <Cpu className="h-3 w-3" /> ENGINE READY
            </span>
            <span className="alien-chip flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-[0.18em] text-emerald-400">
              <Waves className="h-3 w-3" /> EQUITY ${paper.account.equity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            {focus && (
              <span className="alien-chip flex items-center gap-2 px-3 py-1.5">
                <span className="font-display text-[10px] tracking-[0.16em] text-gold-light">{focus.label}</span>
                <LivePriceIndicator ticker={focus.ticker} getPriceByTicker={resolvePriceForTicker} compact />
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="relative z-10 mb-5">
        <AssetUniverse onPick={pick} />
      </div>

      <section className="alien-panel alien-scan relative z-10 overflow-hidden p-2 sm:p-4">
        <div className="relative z-10">
          <WorkflowCanvas paper={paper} getPriceByTicker={resolvePriceForTicker} />
        </div>
      </section>
    </>
  );
};

export default function Pipeline() {
  return (
    <div className="alien-field min-h-screen">
      <Header />
      <main className="relative z-10 mx-auto max-w-[1600px] px-3 pb-16 pt-4 sm:px-6">
        <PipelineProvider>
          <PipelineWorkspace />
        </PipelineProvider>
      </main>
    </div>
  );
}