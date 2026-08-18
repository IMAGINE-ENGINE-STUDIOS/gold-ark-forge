import { useEffect, useRef, useState } from 'react';
import { Brain, Send, Loader2, Sparkles, Play, Square, Stethoscope, Code2, Radar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export type GeniusV2Action = {
  op:
    | 'add_asset' | 'add_screen' | 'add_analysis' | 'add_node' | 'add_code'
    | 'update_node' | 'remove_node' | 'replace_all' | 'clear'
    | 'create_code_block' | 'run' | 'stop' | 'select_node';
  index?: number;
  ticker?: string;
  label?: string;
  classId?: string;
  programId?: string;
  kind?: string;
  blockName?: string;
  description?: string;
  code?: string;
  config?: Record<string, any>;
  nodes?: Array<{ kind: string; label?: string; config?: Record<string, any> }>;
};

export interface GeniusV2AssistantProps {
  /** Full snapshot of everything on the page, rebuilt on each send. */
  buildPageContext: () => Record<string, any>;
  onActions: (actions: GeniusV2Action[]) => string[];
  running: boolean;
  nodeCount: number;
  issueCount: number;
}

type Msg = { role: 'user' | 'assistant'; content: string };

const QUICK = [
  { label: 'ANALYZE PAGE', icon: Radar, prompt: 'Read the whole workspace — live screens, blueprint graph, issues and last trace — and brief me on what it does and what is weak.' },
  { label: 'BUILD FOR ME', icon: Sparkles, prompt: 'Build the strongest blueprint you can from the live screens on this page, wiring screens, analysis and risk before any trade node. Explain the logic.' },
  { label: 'WRITE CODE BOX', icon: Code2, prompt: 'Write a custom code box that adds an edge my current analysis programs do not cover, save it and wire it into the blueprint.' },
  { label: 'DEBUG', icon: Stethoscope, prompt: 'Debug this workspace: fix every validation issue and every error in the last execution trace, then explain each fix.' },
  { label: 'RUN', icon: Play, prompt: 'Run the blueprint now if it compiles, otherwise tell me exactly what to fix first.' },
  { label: 'STOP', icon: Square, prompt: 'Stop the running blueprint immediately.' },
];

export default function GeniusV2Assistant({ buildPageContext, onActions, running, nodeCount, issueCount }: GeniusV2AssistantProps) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', content: 'GENIUS V2 ONLINE. I can see every screen, node, code box, issue and trace on this page — ask me to build, rewire, write code, debug, run or stop anything.' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' }));
  }, [msgs]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput('');
    const history = msgs.slice(-8).map((m) => ({ role: m.role, content: m.content }));
    setMsgs((prev) => [...prev, { role: 'user', content: message }]);
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('pipeline-v2-genius', {
        body: { message, page: buildPageContext(), history },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const reply: string = data?.reply ?? 'No response.';
      const actions: GeniusV2Action[] = Array.isArray(data?.actions) ? data.actions : [];
      const notes = actions.length ? onActions(actions) : [];
      setMsgs((prev) => [
        ...prev,
        { role: 'assistant', content: notes.length ? `${reply}\n\n${notes.map((n) => `› ${n}`).join('\n')}` : reply },
      ]);
    } catch (e: any) {
      setMsgs((prev) => [...prev, { role: 'assistant', content: `LINK ERROR — ${e?.message ?? String(e)}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="alien-panel alien-scan relative flex h-full min-h-[420px] flex-col overflow-hidden p-2.5">
      <header className="relative z-10 mb-2 flex flex-wrap items-center gap-1.5">
        <Brain className="h-3.5 w-3.5 text-gold-light" />
        <span className="font-display text-[10px] tracking-[0.22em] text-gold-light">GENIUS V2 ENGINEER</span>
        <span className="alien-chip px-2 py-0.5 font-mono text-[7px] tracking-widest text-muted-foreground">{nodeCount} NODES</span>
        <span className={`alien-chip px-2 py-0.5 font-mono text-[7px] tracking-widest ${issueCount ? 'text-amber-400' : 'text-emerald-400'}`}>
          {issueCount ? `${issueCount} ISSUES` : 'CLEAN'}
        </span>
        <span className={`alien-chip ml-auto px-2 py-0.5 font-mono text-[7px] tracking-widest ${running ? 'text-emerald-400' : 'text-muted-foreground'}`}>
          {running ? 'RUNNING' : 'STANDBY'}
        </span>
      </header>

      <div className="relative z-10 mb-2 flex flex-wrap gap-1">
        {QUICK.map((q) => (
          <button
            key={q.label}
            onClick={() => send(q.prompt)}
            disabled={busy}
            className="alien-chip flex items-center gap-1 px-2 py-1 font-mono text-[7px] tracking-[0.16em] text-gold-light transition hover:text-gold disabled:opacity-40"
          >
            <q.icon className="h-2.5 w-2.5" /> {q.label}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="relative z-10 max-h-[46vh] flex-1 space-y-1.5 overflow-y-auto pr-0.5">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap rounded-lg border px-2 py-1.5 font-mono text-[9px] leading-relaxed ${
              m.role === 'user'
                ? 'ml-6 border-gold/30 bg-gold/10 text-gold-light'
                : 'mr-2 border-border/40 bg-background/50 text-foreground/85 backdrop-blur-sm'
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin text-gold" /> GENIUS ENGINEERING…
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="relative z-10 mt-2 flex items-center gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ASK GENIUS TO BUILD, CODE, DEBUG OR RUN ANYTHING…"
          className="w-full rounded-full border border-gold/25 bg-background/70 px-3 py-1.5 font-mono text-[9px] tracking-widest text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-gold/60"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="alien-chip shrink-0 p-2 text-gold-light transition hover:text-gold disabled:opacity-40"
        >
          <Send className="h-3 w-3" />
        </button>
      </form>
    </div>
  );
}
