import { useRef, useState } from 'react';
import { Brain, Send, Loader2, Sparkles, Play, Square, Stethoscope, BellRing } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export type GeniusAction = {
  op: 'add_node' | 'update_node' | 'remove_node' | 'clear' | 'replace_all' | 'run' | 'stop';
  index?: number;
  kind?: string;
  label?: string;
  config?: Record<string, any>;
  nodes?: Array<{ kind: string; label?: string; config?: Record<string, any> }>;
};

export interface GeniusAssistantProps {
  workflow: Array<{ kind: string; label: string; config: Record<string, any> }>;
  issues: Array<{ step: number; level: string; message: string }>;
  log: Array<{ step: number; kind: string; status: string; message: string }>;
  account?: { equity: number; totalPnl: number } | null;
  running: boolean;
  onActions: (actions: GeniusAction[]) => void;
}

type Msg = { role: 'user' | 'assistant'; content: string };

const QUICK = [
  { label: 'ANALYZE', icon: Sparkles, prompt: 'Analyze my current pipeline: logic gaps, ordering, risk exposure and what it will actually do when run.' },
  { label: 'TROUBLESHOOT', icon: Stethoscope, prompt: 'Troubleshoot the validation issues and the last execution log, then fix the pipeline.' },
  { label: 'ADD ALERTS', icon: BellRing, prompt: 'Add sensible price alerts (up and down) around the current context symbols in my pipeline.' },
  { label: 'RUN', icon: Play, prompt: 'Run the pipeline now if it is valid; otherwise tell me exactly what to fix first.' },
  { label: 'STOP', icon: Square, prompt: 'Stop the running pipeline immediately.' },
];

export default function GeniusAssistant({ workflow, issues, log, account, running, onActions }: GeniusAssistantProps) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', content: 'GENIUS ONLINE. Describe the pipeline you want — I can build it, rewire it, analyze the logic, run or stop it, and debug failures.' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput('');
    const history = msgs.slice(-8).map(m => ({ role: m.role, content: m.content }));
    setMsgs(prev => [...prev, { role: 'user', content: message }]);
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('pipeline-genius', {
        body: { message, workflow, issues, log, account, history },
      });
      if (error) throw error;
      const reply: string = data?.reply ?? 'No response.';
      const actions: GeniusAction[] = Array.isArray(data?.actions) ? data.actions : [];
      setMsgs(prev => [...prev, { role: 'assistant', content: reply }]);
      if (actions.length) onActions(actions);
    } catch (e: any) {
      setMsgs(prev => [...prev, { role: 'assistant', content: `LINK ERROR — ${e?.message ?? String(e)}` }]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' }));
    }
  };

  return (
    <div className="alien-panel alien-scan relative flex h-full min-h-[420px] flex-col overflow-hidden p-2.5">
      <header className="relative z-10 mb-2 flex items-center gap-2">
        <Brain className="h-3.5 w-3.5 text-gold-light" />
        <span className="font-display text-[10px] tracking-[0.22em] text-gold-light">GENIUS COPILOT</span>
        <span className={`alien-chip ml-auto px-2 py-0.5 font-mono text-[7px] tracking-widest ${running ? 'text-emerald-400' : 'text-muted-foreground'}`}>
          {running ? 'PIPELINE RUNNING' : 'STANDBY'}
        </span>
      </header>

      <div className="relative z-10 mb-2 flex flex-wrap gap-1">
        {QUICK.map(q => (
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

      <div ref={scrollRef} className="relative z-10 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg border px-2 py-1.5 font-mono text-[9px] leading-relaxed whitespace-pre-wrap ${
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
            <Loader2 className="h-3 w-3 animate-spin text-gold" /> GENIUS THINKING…
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="relative z-10 mt-2 flex items-center gap-1.5"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="BUILD A DCA PIPELINE ON XAU/USD…"
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
