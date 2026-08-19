import { useEffect, useRef, useState } from 'react';
import { Brain, Send, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface GeniusAction {
  op: 'replace_all' | 'add_lane' | 'add_step' | 'update_step' | 'remove_step' | 'remove_lane'
    | 'set_risk' | 'clear' | 'run' | 'stop' | 'create_code_block';
  laneIndex?: number;
  stepIndex?: number;
  laneName?: string;
  consensus?: boolean;
  agree?: { mode: 'all' | 'any' | 'majority' | 'count'; count?: number; expects?: string };
  kind?: string;
  label?: string;
  config?: Record<string, any>;
  risk?: { maxDrawdownPct?: number; maxTotalInvestmentUsd?: number };
  blockName?: string;
  code?: string;
  description?: string;
  lanes?: Array<{ name: string; consensus?: boolean; agree?: any; steps: Array<{ kind: string; label?: string; config?: Record<string, any> }> }>;
}

export interface GeniusMemory { objective: string; budget: number | null; notes: string }

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_KEY = 'ga_pipeline_v4_chat';
const MEM_KEY = 'ga_pipeline_v4_memory';

const HELLO: Msg = {
  role: 'assistant',
  content:
    'Tell me the result you want — for example "make 10% in a week with $5,000" — and I will build the parallel lanes, test them on the paper account and tell you plainly what happened.',
};

const QUICK = [
  'Build a strategy for my goal',
  'Run it and show me the result',
  'Make it safer',
  'Fix the problems',
];

export default function GeniusPanel({
  buildContext, onActions, running, laneCount, issueCount, registerReporter,
}: {
  buildContext: (memory: GeniusMemory) => Record<string, any>;
  onActions: (actions: GeniusAction[]) => string[];
  running: boolean;
  laneCount: number;
  issueCount: number;
  /** Lets the page hand back the REAL trace once a run finishes. */
  registerReporter?: (fn: (trace: string) => void) => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem(CHAT_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) return parsed as Msg[];
    } catch { /* ignore */ }
    return [HELLO];
  });
  const [memory, setMemory] = useState<GeniusMemory>(() => {
    try {
      const raw = localStorage.getItem(MEM_KEY);
      if (raw) return JSON.parse(raw) as GeniusMemory;
    } catch { /* ignore */ }
    return { objective: '', budget: null, notes: '' };
  });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [choices, setChoices] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<(t: string) => void>(() => {});

  useEffect(() => {
    try { localStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-40))); } catch { /* ignore */ }
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' }));
  }, [msgs]);

  useEffect(() => {
    try { localStorage.setItem(MEM_KEY, JSON.stringify(memory)); } catch { /* ignore */ }
  }, [memory]);

  const send = async (text: string, hidden = false) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput('');
    const history = msgs.slice(-14).map((m) => ({ role: m.role, content: m.content }));
    if (!hidden) setMsgs((prev) => [...prev, { role: 'user', content: message }]);
    setChoices([]);
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('pipeline-v4-genius', {
        body: { message, page: buildContext(memory), history },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.details ?? data.error);

      if (data?.memory) {
        setMemory((prev) => ({
          objective: data.memory.objective || prev.objective,
          budget: typeof data.memory.budget === 'number' ? data.memory.budget : prev.budget,
          notes: data.memory.notes || prev.notes,
        }));
      }

      const parts: string[] = [];
      if (data?.objective) parts.push(`Goal: ${data.objective}`);
      if (data?.feasibility) parts.push(`Honest read: ${data.feasibility}`);
      if (data?.reply) parts.push(data.reply);
      const notes = Array.isArray(data?.actions) && data.actions.length ? onActions(data.actions) : [];
      if (notes.length) parts.push(notes.map((n) => `· ${n}`).join('\n'));
      setChoices(Array.isArray(data?.choices) ? data.choices.slice(0, 4) : []);
      setMsgs((prev) => [...prev, { role: 'assistant', content: parts.join('\n\n') || 'No response.' }]);
    } catch (e: any) {
      setMsgs((prev) => [...prev, { role: 'assistant', content: `Genius could not reach the service: ${e?.message ?? e}` }]);
    } finally {
      setBusy(false);
    }
  };

  sendRef.current = (trace: string) => {
    void send(
      `The run you asked for has now finished. This is the real trace from the paper account:\n${trace}\n\nReport exactly what happened in plain words. If anything failed or did nothing, fix it and run it again now.`,
      true,
    );
  };

  useEffect(() => {
    registerReporter?.((trace: string) => sendRef.current(trace));
  }, [registerReporter]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <span className="text-[14px] font-semibold tracking-tight text-foreground">Genius</span>
        <span className="rounded-full border border-border/60 px-2 py-0.5 text-[12px] text-muted-foreground">
          {laneCount} lane{laneCount === 1 ? '' : 's'}
        </span>
        <span className={`rounded-full border px-2 py-0.5 text-[12px] ${issueCount ? 'border-amber-500/50 text-amber-400' : 'border-emerald-500/40 text-emerald-400'}`}>
          {issueCount ? `${issueCount} to fix` : 'Ready'}
        </span>
        <span className={`ml-auto text-[12px] ${running ? 'text-emerald-400' : 'text-muted-foreground'}`}>
          {running ? 'Running' : 'Idle'}
        </span>
        <button
          onClick={() => { setMsgs([HELLO]); setChoices([]); }}
          title="Clear conversation"
          className="rounded border border-border/60 p-1 text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </header>

      {(memory.objective || memory.budget) && (
        <div className="mb-2 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-[12px] text-foreground/85">
          Remembering: {memory.objective || 'no goal set'}{memory.budget ? ` · budget $${memory.budget.toLocaleString()}` : ''}
        </div>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap rounded-lg border px-2.5 py-2 text-[14px] leading-relaxed ${
              m.role === 'user'
                ? 'ml-6 border-primary/30 bg-primary/10 text-foreground'
                : 'mr-2 border-border/50 bg-background/50 text-foreground/90'
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Building and testing…
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {(choices.length ? choices : QUICK).map((c) => (
          <button
            key={c}
            onClick={() => send(c)}
            disabled={busy}
            className="rounded-full border border-border/60 px-2.5 py-1 text-[13px] text-foreground/85 transition hover:border-primary/60 hover:text-primary disabled:opacity-40"
          >
            {c}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-2 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What result do you want?"
          className="w-full rounded-full border border-border/60 bg-background/70 px-3 py-2 text-[14px] text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary/60"
        />
        <button type="submit" disabled={busy || !input.trim()} className="shrink-0 rounded-full border border-primary/50 p-2 text-primary disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}