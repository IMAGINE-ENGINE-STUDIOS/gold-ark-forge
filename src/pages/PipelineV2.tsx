import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Workflow, Cpu, Sparkles, ArrowLeft, Boxes } from 'lucide-react';
import Header from '@/components/Header';
import { PipelineProvider, usePipeline } from '@/components/pipeline/PipelineProvider';
import ClassifierBoard from '@/components/pipeline/ClassifierBoard';
import BlueprintCanvas from '@/components/pipeline/BlueprintCanvas';
import CodeStudio from '@/components/pipeline/CodeStudio';
import { useLiveSeries } from '@/hooks/useLiveSeries';
import { classifyAssets, type ClassId } from '@/lib/assetClassifiers';
import { loadBlocks, type CustomBlock } from '@/lib/customBlocks';
import { REAL_FEED_SYMBOLS } from '@/data/tradingSymbols';

const SEED = REAL_FEED_SYMBOLS.slice(0, 40).map((s) => s.ticker);

const Workspace = () => {
  const { paper, resolvePriceForTicker, changeForTicker, subscribe, symbols } = usePipeline();
  const [blocks, setBlocks] = useState<CustomBlock[]>(() => loadBlocks());
  const apiRef = useRef<{ addAsset: (t: string, l: string) => void; addScreen: (c: ClassId) => void; addBlock: (b: CustomBlock) => void } | null>(null);

  const tracked = useMemo(() => Array.from(new Set(SEED)), []);
  const { getSeries, version } = useLiveSeries(tracked, resolvePriceForTicker, { intervalMs: 5000 });

  const classified = useMemo(() => {
    const bySeed = new Set(tracked);
    const metrics = symbols
      .filter((s) => bySeed.has(s.ticker))
      .map((s) => ({
        ticker: s.ticker, label: s.label, cat: s.cat, symbolKey: s.key,
        last: resolvePriceForTicker(s.ticker), change24h: changeForTicker(s.ticker),
        samples: getSeries(s.ticker),
      }));
    return classifyAssets(metrics);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols, tracked, version, resolvePriceForTicker, changeForTicker]);

  const registerApi = useCallback((api: any) => { apiRef.current = api; }, []);

  return (
    <>
      <section className="relative z-10 mb-4">
        <div className="alien-panel alien-scan relative overflow-hidden p-5 sm:p-7">
          <span className="alien-orb -left-10 -top-16 h-56 w-56 bg-gold/30" />
          <span className="alien-orb right-0 top-10 h-48 w-48 bg-cyan-400/20" style={{ animationDelay: '3s' }} />
          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <Workflow className="h-5 w-5 text-gold-light" />
            <h1 className="font-display text-xl tracking-[0.28em] text-gold-light sm:text-2xl">PIPELINE V2</h1>
            <span className="alien-chip px-2.5 py-1 font-mono text-[8px] tracking-[0.2em] text-muted-foreground">BLUEPRINT DEVELOPMENT ENVIRONMENT</span>
            <Link to="/pipeline" className="alien-chip ml-auto flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] text-gold-light hover:text-gold">
              <ArrowLeft className="h-3 w-3" /> V1
            </Link>
          </div>
          <p className="relative z-10 mt-3 max-w-3xl font-mono text-[10px] leading-relaxed tracking-wider text-muted-foreground">
            CLASSIFY THE UNIVERSE INTO LIVE SCREENS — HOTTEST, BEST PERFORMING, BIGGEST OPPORTUNITY, CRITICAL RISK AND MORE.
            WIRE ANALYSIS PROGRAMS AND YOUR OWN CODE BOXES INTO AN EXECUTABLE GRAPH. NO PROGRAMMING REQUIRED — BUT ANY CODE IS WELCOME.
          </p>
          <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2">
            <span className="alien-chip flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-[0.18em] text-gold-light"><Cpu className="h-3 w-3" /> ENGINE READY</span>
            <span className="alien-chip flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-[0.18em] text-emerald-400"><Boxes className="h-3 w-3" /> {classified.length} LIVE INSTRUMENTS</span>
            <span className="alien-chip flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-[0.18em] text-cyan-300"><Sparkles className="h-3 w-3" /> {blocks.length} CUSTOM BOXES</span>
          </div>
        </div>
      </section>

      <div className="relative z-10 mb-4">
        <ClassifierBoard
          assets={classified}
          onAddScreen={(c) => apiRef.current?.addScreen(c)}
          onAddAsset={(t, l) => apiRef.current?.addAsset(t, l)}
        />
      </div>

      <div className="relative z-10 mb-4">
        <BlueprintCanvas
          classified={classified}
          blocks={blocks}
          getPrice={resolvePriceForTicker}
          getSeries={getSeries}
          account={paper.account}
          submitOrder={paper.submitOrder as any}
          subscribe={subscribe}
          registerApi={registerApi}
        />
      </div>

      <div className="relative z-10">
        <CodeStudio
          blocks={blocks}
          onBlocksChange={setBlocks}
          onAddToBlueprint={(b) => apiRef.current?.addBlock(b)}
          sampleInput={() => {
            const lead = classified[0];
            return {
              ticker: lead?.ticker ?? 'GLD', label: lead?.label ?? 'XAU/USD',
              price: lead?.last ?? 0, series: lead ? getSeries(lead.ticker) : [],
              change: lead?.derived.change ?? 0, account: paper.account,
              screen: classified.slice(0, 5).map((a) => ({ ticker: a.ticker, label: a.label, score: a.scores.hottest })),
              analysis: null, params: {},
            };
          }}
        />
      </div>
    </>
  );
};

export default function PipelineV2() {
  return (
    <div className="alien-field min-h-screen">
      <Header />
      <main className="relative z-10 mx-auto max-w-[1700px] px-3 pb-16 pt-4 sm:px-6">
        <PipelineProvider seedTickers={SEED}>
          <Workspace />
        </PipelineProvider>
      </main>
    </div>
  );
}