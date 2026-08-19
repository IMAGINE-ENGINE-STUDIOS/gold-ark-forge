import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Workflow, Cpu, Sparkles, ArrowLeft, Boxes, LayoutGrid, Bot, Code2, GitBranch } from 'lucide-react';
import Header from '@/components/Header';
import { PipelineProvider, usePipeline } from '@/components/pipeline/PipelineProvider';
import ClassifierBoard from '@/components/pipeline/ClassifierBoard';
import BlueprintCanvas, { type BlueprintApi } from '@/components/pipeline/BlueprintCanvas';
import CodeStudio from '@/components/pipeline/CodeStudio';
import GeniusV2Assistant, { type GeniusV2Action } from '@/components/pipeline/GeniusV2Assistant';
import { useLiveSeries } from '@/hooks/useLiveSeries';
import { ASSET_CLASSES, classifyAssets, type ClassId } from '@/lib/assetClassifiers';
import { ANALYSIS_PROGRAMS } from '@/lib/analysisPrograms';
import { buildMarketIntelligence } from '@/lib/objectiveEngine';
import { loadBlocks, saveBlocks, normalizeBlockCode, type CustomBlock } from '@/lib/customBlocks';
import { REAL_FEED_SYMBOLS } from '@/data/tradingSymbols';
import type { BpKind } from '@/lib/blueprintEngine';

const SEED = REAL_FEED_SYMBOLS.slice(0, 40).map((s) => s.ticker);
const blockUid = () => `blk_${Math.random().toString(36).slice(2, 9)}`;

const TABS = [
  { id: 'genius', label: 'Genius', icon: Bot },
  { id: 'screens', label: 'Live Screens', icon: LayoutGrid },
  { id: 'blueprint', label: 'Blueprint', icon: GitBranch },
  { id: 'code', label: 'Code Studio', icon: Code2 },
] as const;
type TabId = (typeof TABS)[number]['id'];

const Workspace = () => {
  const [tab, setTab] = useState<TabId>('genius');
  const { paper, resolvePriceForTicker, changeForTicker, subscribe, symbols } = usePipeline();
  const [blocks, setBlocks] = useState<CustomBlock[]>(() => loadBlocks());
  const apiRef = useRef<BlueprintApi | null>(null);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const [bpState, setBpState] = useState<{ nodes: any[]; issues: any[]; log: any[]; running: boolean }>({ nodes: [], issues: [], log: [], running: false });

  useEffect(() => {
    const t = setInterval(() => {
      const s = apiRef.current?.getState();
      if (s) setBpState({ nodes: s.nodes, issues: s.issues, log: s.log, running: s.running });
    }, 1000);
    return () => clearInterval(t);
  }, []);

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

  const buildPageContext = useCallback((message?: string) => {
    const api = apiRef.current?.getState();
    const intel = buildMarketIntelligence({
      classified,
      getSeries,
      objectiveText: message,
      sampleSeconds: 5,
      limit: 12,
    });
    return {
      route: '/pipeline-v3',
      account: paper.account,
      marketIntelligence: intel,
      screens: ASSET_CLASSES.map((c) => ({
        id: c.id, label: c.label, blurb: c.blurb,
        top: [...classified]
          .sort((a, b) => (b.scores[c.id] ?? 0) - (a.scores[c.id] ?? 0))
          .slice(0, 5)
          .map((a) => ({ ticker: a.ticker, label: a.label, score: Number((a.scores[c.id] ?? 0).toFixed(3)), price: a.last, change: a.derived.change })),
      })),
      universe: classified.slice(0, 40).map((a) => ({ ticker: a.ticker, label: a.label, cat: a.cat, price: a.last, change: a.derived.change })),
      analysisPrograms: ANALYSIS_PROGRAMS.map((p) => ({ id: p.id, label: p.label, blurb: p.blurb, params: p.params.map((x) => x.key) })),
      codeBoxes: blocksRef.current.map((b) => ({ id: b.id, name: b.name, description: b.description, code: b.code.slice(0, 1200) })),
      blueprint: (api?.nodes ?? []).map((n, i) => ({ index: i, kind: n.kind, label: n.label, config: n.config })),
      validationIssues: api?.issues ?? [],
      lastExecutionTrace: (api?.log ?? []).slice(-30),
      running: api?.running ?? false,
    };
  }, [classified, paper.account, getSeries]);

  const applyActions = useCallback((actions: GeniusV2Action[]) => {
    const api = apiRef.current;
    const notes: string[] = [];
    if (!api) return ['Blueprint canvas not ready.'];
    let created = [...blocksRef.current];
    let blocksMutated = false;
    for (const a of actions) {
      try {
        switch (a.op) {
          case 'add_asset':
            if (a.ticker) { api.addAsset(a.ticker, a.label ?? a.ticker); notes.push(`asset ${a.ticker} added`); }
            break;
          case 'add_screen':
            if (a.classId) { api.addScreen(a.classId as ClassId); notes.push(`screen ${a.classId} added`); }
            break;
          case 'add_analysis':
            if (a.programId) { api.addAnalysis(a.programId); notes.push(`analysis ${a.programId} added`); }
            break;
          case 'add_node':
            if (a.kind) { api.addKind(a.kind as BpKind, a.config, a.label); notes.push(`${a.kind} node added`); }
            break;
          case 'add_code': {
            const b = created.find((x) => x.name === a.blockName) ?? created.find((x) => x.id === a.blockName);
            if (b) { api.addBlock(b); notes.push(`code box "${b.name}" wired in`); }
            else notes.push(`code box "${a.blockName}" not found`);
            break;
          }
          case 'create_code_block': {
            if (!a.code) { notes.push('create_code_block had no code'); break; }
            const name = a.blockName ?? 'Genius Block';
            const code = normalizeBlockCode(a.code);
            const existing = created.find((x) => x.name === name);
            const next: CustomBlock = existing
              ? { ...existing, code, description: a.description ?? existing.description, updatedAt: Date.now() }
              : { id: blockUid(), name, description: a.description ?? '', language: 'javascript', code, tint: 'cyan', createdAt: Date.now(), updatedAt: Date.now() };
            created = existing ? created.map((x) => (x.id === next.id ? next : x)) : [...created, next];
            blocksMutated = true;
            notes.push(`code box "${name}" ${existing ? 'updated' : 'created'}`);
            break;
          }
          case 'update_node':
            if (typeof a.index === 'number' && a.config) { api.updateNode(a.index, a.config); notes.push(`node ${a.index + 1} reconfigured`); }
            break;
          case 'remove_node':
            if (typeof a.index === 'number') { api.removeNode(a.index); notes.push(`node ${a.index + 1} removed`); }
            break;
          case 'replace_all':
            if (Array.isArray(a.nodes)) {
              api.replaceAll(a.nodes.map((n) => ({ kind: n.kind as BpKind, label: n.label, config: n.config })));
              notes.push(`blueprint rebuilt with ${a.nodes.length} nodes`);
            }
            break;
          case 'clear': api.clear(); notes.push('blueprint cleared'); break;
          case 'select_node': api.select(typeof a.index === 'number' ? a.index : null); break;
          case 'run': setTimeout(() => api.run(), 250); notes.push('run triggered'); break;
          case 'stop': api.stop(); notes.push('stop signalled'); break;
        }
      } catch (e: any) {
        notes.push(`action ${a.op} failed: ${e?.message ?? e}`);
      }
    }
    if (blocksMutated) { blocksRef.current = created; setBlocks(created); saveBlocks(created); }
    return notes;
  }, []);

  return (
    <>
      <section className="relative z-10 mb-5">
        <div className="alien-panel relative overflow-hidden p-6 sm:p-8">
          <span className="alien-orb -left-16 -top-24 h-64 w-64 bg-gold/20" />
          <span className="alien-orb right-0 top-6 h-52 w-52 bg-cyan-400/10" style={{ animationDelay: '3s' }} />
          <div className="relative z-10 flex flex-wrap items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10">
              <Workflow className="h-5 w-5 text-gold-light" />
            </div>
            <div className="min-w-[240px] flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground sm:text-[30px]">Pipeline</h1>
                <span className="rounded-lg border border-gold/30 bg-gold/10 px-2 py-0.5 text-[13px] font-medium text-gold-light">V3</span>
              </div>
              <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
                Build trading logic visually. Classify the live universe, wire analysis programs and your own code
                into an executable graph, and let Genius design, test and debug it for you.
              </p>
            </div>
            <Link to="/pipeline-v2" className="alien-chip flex items-center gap-2 px-3 text-[13px] text-muted-foreground hover:text-gold-light">
              <ArrowLeft className="h-3.5 w-3.5" /> V2
            </Link>
          </div>

          <div className="relative z-10 mt-6 flex flex-wrap gap-2.5">
            <span className="alien-chip flex items-center gap-2 px-3 text-[13px] text-gold-light"><Cpu className="h-3.5 w-3.5" /> Engine ready</span>
            <span className="alien-chip flex items-center gap-2 px-3 text-[13px] text-emerald-400"><Boxes className="h-3.5 w-3.5" /> {classified.length} live instruments</span>
            <span className="alien-chip flex items-center gap-2 px-3 text-[13px] text-cyan-300"><Sparkles className="h-3.5 w-3.5" /> {blocks.length} custom boxes</span>
            <span className="alien-chip flex items-center gap-2 px-3 text-[13px] text-muted-foreground">{bpState.nodes.length} nodes · {bpState.issues.length} issues</span>
          </div>
        </div>
      </section>

      <nav className="sticky top-2 z-30 mb-5">
        <div className="v3-rail flex flex-wrap items-center gap-1.5 p-1.5">
          {TABS.map((t) => (
            <button key={t.id} type="button" className="v3-tab flex items-center gap-2" data-active={tab === t.id} onClick={() => setTab(t.id)}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
          <span className="ml-auto pr-2 text-[13px] text-muted-foreground">
            {bpState.running ? <span className="text-emerald-400">Running…</span> : 'Idle'}
          </span>
        </div>
      </nav>

      <div className="relative z-10 space-y-5">
        <div className={tab === 'screens' ? 'block' : 'hidden'}>
          <ClassifierBoard
            assets={classified}
            onAddScreen={(c) => { apiRef.current?.addScreen(c); setTab('blueprint'); }}
            onAddAsset={(t, l) => { apiRef.current?.addAsset(t, l); setTab('blueprint'); }}
          />
        </div>

        <div className={tab === 'genius' ? 'block' : 'hidden'}>
          <GeniusV2Assistant
            buildPageContext={buildPageContext}
            onActions={applyActions}
            running={bpState.running}
            nodeCount={bpState.nodes.length}
            issueCount={bpState.issues.length}
          />
        </div>

        <div className={tab === 'blueprint' ? 'block' : 'hidden'}>
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

        <div className={tab === 'code' ? 'block' : 'hidden'}>
          <CodeStudio
            blocks={blocks}
            onBlocksChange={setBlocks}
            onAddToBlueprint={(b) => { apiRef.current?.addBlock(b); setTab('blueprint'); }}
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
      </div>
    </>
  );
};

export default function PipelineV3() {
  return (
    <div className="pipeline-v3 alien-field min-h-screen">
      <Header />
      <main className="relative z-10 mx-auto max-w-[1600px] px-4 pb-20 pt-5 sm:px-8">
        <PipelineProvider seedTickers={SEED}>
          <Workspace />
        </PipelineProvider>
      </main>
    </div>
  );
}
