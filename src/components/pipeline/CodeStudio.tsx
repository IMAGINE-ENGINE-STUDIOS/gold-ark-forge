import React, { useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  Code2, Play, Save, Sparkles, Wand2, Bug, Gauge, Plus, Trash2, Box, Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  loadBlocks, saveBlocks, runBlockCode, normalizeBlockCode, STARTER_CODE, type CustomBlock,
} from '@/lib/customBlocks';

const uid = () => `blk_${Math.random().toString(36).slice(2, 9)}`;

export interface CodeStudioProps {
  blocks: CustomBlock[];
  onBlocksChange: (b: CustomBlock[]) => void;
  onAddToBlueprint: (b: CustomBlock) => void;
  sampleInput: () => any;
}

export default function CodeStudio({ blocks, onBlocksChange, onAddToBlueprint, sampleInput }: CodeStudioProps) {
  const [activeId, setActiveId] = useState<string | null>(blocks[0]?.id ?? null);
  const active = useMemo(() => blocks.find((b) => b.id === activeId) ?? null, [blocks, activeId]);
  const [draft, setDraft] = useState<CustomBlock>(() => active ?? {
    id: uid(), name: 'New Block', description: '', language: 'javascript',
    code: STARTER_CODE, tint: 'gold', createdAt: Date.now(), updatedAt: Date.now(),
  });
  const [output, setOutput] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiReply, setAiReply] = useState('');
  const [prompt, setPrompt] = useState('');

  const select = (b: CustomBlock) => { setActiveId(b.id); setDraft({ ...b }); setOutput(''); setAiReply(''); };
  const blank = () => {
    const b: CustomBlock = { id: uid(), name: 'New Block', description: '', language: 'javascript', code: STARTER_CODE, tint: 'gold', createdAt: Date.now(), updatedAt: Date.now() };
    setActiveId(b.id); setDraft(b); setOutput(''); setAiReply('');
  };

  const persist = () => {
    const next = blocks.some((b) => b.id === draft.id)
      ? blocks.map((b) => (b.id === draft.id ? { ...draft, updatedAt: Date.now() } : b))
      : [...blocks, { ...draft, updatedAt: Date.now() }];
    onBlocksChange(next); saveBlocks(next); setActiveId(draft.id);
  };

  const remove = (id: string) => {
    const next = blocks.filter((b) => b.id !== id);
    onBlocksChange(next); saveBlocks(next);
    if (activeId === id) blank();
  };

  const test = async () => {
    setRunning(true); setOutput('');
    const res = await runBlockCode(draft.code, sampleInput());
    setOutput(res.ok
      ? `✔ ${res.ms}ms\n${JSON.stringify(res.output, null, 2)}${res.logs.length ? `\n\nlogs:\n${res.logs.join('\n')}` : ''}`
      : `✖ ${res.error}${res.logs.length ? `\n\nlogs:\n${res.logs.join('\n')}` : ''}`);
    setRunning(false);
  };

  const autopilot = async (mode: 'write' | 'fix' | 'optimize' | 'explain', msg?: string) => {
    setAiBusy(true); setAiReply('');
    try {
      const { data, error } = await supabase.functions.invoke('code-autopilot', {
        body: { message: msg ?? prompt, code: draft.code, mode, blockName: draft.name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiReply(data?.reply ?? '');
      if (data?.code) {
        const clean = normalizeBlockCode(data.code);
        setDraft((d) => ({ ...d, code: clean, name: d.name === 'New Block' && data.name ? data.name : d.name }));
      }
    } catch (e: any) {
      setAiReply(`Autopilot unavailable: ${e?.message ?? e}`);
    } finally { setAiBusy(false); }
  };

  return (
    <div className="alien-panel alien-scan relative overflow-hidden p-3 sm:p-4">
      <div className="relative z-10 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Library */}
        <aside className="space-y-2">
          <div className="flex items-center gap-2">
            <Code2 className="h-3.5 w-3.5 text-gold-light" />
            <span className="font-display text-[10px] tracking-[0.24em] text-gold-light">CODE STUDIO</span>
          </div>
          <button onClick={blank} className="alien-chip flex w-full items-center justify-center gap-1.5 px-2 py-1.5 font-mono text-[9px] tracking-[0.18em] text-gold-light hover:text-gold">
            <Plus className="h-3 w-3" /> NEW BLOCK
          </button>
          <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
            {blocks.length === 0 && (
              <p className="font-mono text-[8px] leading-relaxed tracking-wider text-muted-foreground">
                NO CUSTOM BLOCKS YET. WRITE ANY PROGRAM AND SAVE IT — IT BECOMES A DRAGGABLE BOX.
              </p>
            )}
            {blocks.map((b) => (
              <div key={b.id} className={`alien-chip group flex items-center gap-1.5 px-2 py-1.5 ${activeId === b.id ? 'ring-1 ring-gold/50' : ''}`}>
                <button onClick={() => select(b)} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
                  <Box className="h-3 w-3 shrink-0 text-gold-light" />
                  <span className="truncate font-mono text-[9px] tracking-wider text-foreground">{b.name}</span>
                </button>
                <button onClick={() => onAddToBlueprint(b)} title="Add to blueprint" className="text-emerald-400 hover:text-emerald-300">
                  <Plus className="h-3 w-3" />
                </button>
                <button onClick={() => remove(b.id)} title="Delete" className="text-rose-400 hover:text-rose-300">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Editor */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="alien-chip w-40 bg-transparent px-2 py-1.5 font-mono text-[10px] tracking-wider text-gold-light outline-none"
              placeholder="Block name"
            />
            <input
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="alien-chip min-w-[140px] flex-1 bg-transparent px-2 py-1.5 font-mono text-[9px] tracking-wider text-muted-foreground outline-none"
              placeholder="What does this block do?"
            />
            <button onClick={test} disabled={running} className="alien-chip flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[9px] tracking-[0.18em] text-emerald-400 hover:text-emerald-300 disabled:opacity-50">
              {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />} TEST
            </button>
            <button onClick={persist} className="alien-chip flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[9px] tracking-[0.18em] text-gold-light hover:text-gold">
              <Save className="h-3 w-3" /> SAVE AS BOX
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-gold/20">
            <CodeMirror
              value={draft.code}
              height="300px"
              theme={oneDark}
              extensions={[javascript()]}
              onChange={(v) => setDraft((d) => ({ ...d, code: v }))}
              basicSetup={{ lineNumbers: true, foldGutter: true, autocompletion: true, highlightActiveLine: true }}
            />
          </div>

          {/* Autopilot */}
          <div className="alien-chip space-y-2 p-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-gold-light" />
              <span className="font-display text-[9px] tracking-[0.22em] text-gold-light">AUTOPILOT</span>
              <button onClick={() => autopilot('fix')} disabled={aiBusy} className="alien-chip flex items-center gap-1 px-2 py-1 font-mono text-[8px] tracking-[0.16em] text-rose-300 disabled:opacity-50"><Bug className="h-2.5 w-2.5" /> FIX</button>
              <button onClick={() => autopilot('optimize')} disabled={aiBusy} className="alien-chip flex items-center gap-1 px-2 py-1 font-mono text-[8px] tracking-[0.16em] text-emerald-300 disabled:opacity-50"><Gauge className="h-2.5 w-2.5" /> OPTIMIZE</button>
              <button onClick={() => autopilot('explain')} disabled={aiBusy} className="alien-chip flex items-center gap-1 px-2 py-1 font-mono text-[8px] tracking-[0.16em] text-sky-300 disabled:opacity-50"><Wand2 className="h-2.5 w-2.5" /> EXPLAIN</button>
            </div>
            <div className="flex gap-1.5">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && prompt.trim()) autopilot('write'); }}
                placeholder="Describe the program you want — e.g. 'RSI divergence detector that returns bullish when price makes lower low'"
                className="alien-chip flex-1 bg-transparent px-2 py-1.5 font-mono text-[9px] tracking-wider text-foreground outline-none"
              />
              <button onClick={() => autopilot('write')} disabled={aiBusy || !prompt.trim()} className="alien-chip flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[9px] tracking-[0.18em] text-gold-light disabled:opacity-50">
                {aiBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} GENERATE
              </button>
            </div>
            {aiReply && <p className="whitespace-pre-wrap font-mono text-[9px] leading-relaxed text-muted-foreground">{aiReply}</p>}
          </div>

          {output && (
            <pre className="alien-chip max-h-40 overflow-auto p-2 font-mono text-[9px] leading-relaxed text-foreground">{output}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

export { loadBlocks };