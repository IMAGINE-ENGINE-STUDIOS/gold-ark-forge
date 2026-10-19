import { useEffect, useMemo, useRef, useState } from 'react';
import { MessagesSquare, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AGENT_TEMPLATES, templateConfig, type AgentTemplate } from '@/lib/agentTemplates';
import type { RunEvent } from '@/lib/parallelEngine';
import { usePipeline } from '@/components/pipeline/PipelineProvider';

/* ─────────────────────── Swarm chat ───────────────────────────────
   One room for the whole desk:
   • REGISTRY — every agent verdict from the live run lands here as it
     happens (name, verdict, confidence, reason, tick), including the
     committee votes, so the operator can read the swarm's conversation
     with the market in one place.
   • TALK — the operator can question any single specialist, or the
     whole swarm (four desk leads answer in parallel), in character,
     with the live tape as context. The conversation persists locally.
   ──────────────────────────────────────────────────────────────── */

interface ChatEntry {
  id: string;
  at: number;
  from: string;          // 'You' or the agent's name
  text: string;
  verdict?: string;
  confidence?: number;
  mine?: boolean;
}

const CHAT_KEY = 'ga_swarm_chat_v1';
const SWARM_LEADS = ['entry_sniper', 'risk_guardian', 'regime_sentinel', 'defensive_captain'];

const loadChat = (): ChatEntry[] => {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const verdictColor = (v?: string) =>
  v === 'bullish' ? 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10'
  : v === 'bearish' || v === 'sell' ? 'text-red-300 border-red-400/40 bg-red-400/10'
  : 'text-amber-200 border-amber-300/30 bg-amber-300/10';

export default function SwarmPanel({ events, running }: { events: RunEvent[]; running: boolean }) {
  const { symbols, resolvePriceForTicker, changeForTicker, paper } = usePipeline();
  const [chat, setChat] = useState<ChatEntry[]>(loadChat);
  const [target, setTarget] = useState<string>('swarm');
  const [draft, setDraft] = useState('');
  const [asking, setAsking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(CHAT_KEY, JSON.stringify(chat.slice(-200))); } catch { /* best effort */ }
  }, [chat]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [chat, events.length]);

  /* The registry: agent verdicts + committee votes from the run feed. */
  const registry = useMemo(() => {
    const out: Array<{ id: string; at: number; from: string; text: string; verdict?: string; confidence?: number }> = [];
    for (const e of events) {
      const v = (e as any).data?.verdict as string | undefined;
      if (v && e.stepLabel) {
        out.push({
          id: `ev_${e.ts}_${e.stepId}`,
          at: e.ts,
          from: e.stepLabel.replace(/\s*\(consensus\)\s*/i, ''),
          text: String((e as any).data?.reason ?? e.message),
          verdict: v,
          confidence: Number((e as any).data?.confidence ?? 0),
        });
      } else if (e.message.startsWith('Committee vote')) {
        out.push({ id: `cv_${e.ts}_${e.laneId}`, at: e.ts, from: 'Committee', text: e.message });
      }
    }
    return out.slice(-60);
  }, [events]);

  const liveContext = () => {
    const movers = symbols
      .map((s) => ({ t: s.ticker, price: resolvePriceForTicker(s.ticker), chg: changeForTicker(s.ticker) }))
      .filter((q) => q.price > 0 && typeof q.chg === 'number')
      .sort((a, b) => Math.abs(b.chg ?? 0) - Math.abs(a.chg ?? 0))
      .slice(0, 6)
      .map((q) => `${q.t}: ${q.price} (${(q.chg ?? 0) >= 0 ? '+' : ''}${Number(q.chg).toFixed(2)}%)`);
    const positions = (paper.positions ?? []).map((p: any) => `${p.symbol} x${p.qty} @ ${p.avgPrice}`);
    return {
      source: 'operator question in the swarm chat — answer the operator directly',
      liveMovers: movers,
      openPaperPositions: positions,
      instruction: 'Answer in first person as this specialist, plainly, in 2-4 sentences. Ground the answer in the live context given. End with your verdict.',
    };
  };

  const askOne = async (t: AgentTemplate, question: string) => {
    const cfg = templateConfig(t);
    const { data, error } = await supabase.functions.invoke('pipeline-agent', {
      body: {
        systemPrompt: cfg.systemPrompt,
        taskPrompt: `${cfg.taskPrompt}\n\nOPERATOR QUESTION: ${question}`,
        model: 'llama-3.3-70b-versatile',
        temperature: t.temperature,
        context: liveContext(),
      },
    });
    if (error) throw new Error(error.message ?? 'agent unreachable');
    return {
      from: t.name,
      text: String(data?.reason ?? 'No answer.'),
      verdict: String(data?.verdict ?? 'hold'),
      confidence: Number(data?.confidence ?? 0),
    };
  };

  const send = async () => {
    const q = draft.trim();
    if (!q || asking) return;
    setDraft('');
    setChat((c) => [...c, { id: `me_${Date.now()}`, at: Date.now(), from: 'You', text: q, mine: true }]);
    setAsking(true);
    try {
      if (target === 'swarm') {
        const leads = AGENT_TEMPLATES.filter((t) => SWARM_LEADS.includes(t.id));
        const answers = await Promise.allSettled(leads.map((t) => askOne(t, q)));
        const entries: ChatEntry[] = answers.map((a, i) =>
          a.status === 'fulfilled'
            ? { id: `ag_${Date.now()}_${i}`, at: Date.now(), from: a.value.from, text: a.value.text, verdict: a.value.verdict, confidence: a.value.confidence }
            : { id: `ag_${Date.now()}_${i}`, at: Date.now(), from: leads[i].name, text: 'Could not answer just now (the model service is busy) — ask me again in a moment.' });
        setChat((c) => [...c, ...entries]);
      } else {
        const t = AGENT_TEMPLATES.find((x) => x.id === target) ?? AGENT_TEMPLATES[0];
        const a = await askOne(t, q);
        setChat((c) => [...c, { id: `ag_${Date.now()}`, at: Date.now(), from: a.from, text: a.text, verdict: a.verdict, confidence: a.confidence }]);
      }
    } catch {
      setChat((c) => [...c, { id: `err_${Date.now()}`, at: Date.now(), from: 'Swarm', text: 'The agents could not answer just now — the model service may be rate-limited. Try again shortly.' }]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <MessagesSquare className="h-4 w-4 text-primary" />
        <p className="text-[13px] font-semibold text-foreground">Swarm chat — every agent, one room</p>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {running ? 'Run live — verdicts stream in below' : 'Start a run and every verdict lands here'}
        </span>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {registry.length === 0 && chat.length === 0 && (
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            This room registers the swarm's whole conversation: every specialist verdict during a run,
            every committee vote, and your own questions to the desk. Ask the Entry Sniper what it is
            watching, or put a question to the whole swarm.
          </p>
        )}

        {registry.map((r) => (
          <div key={r.id} className="rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-2">
            <div className="mb-0.5 flex items-center gap-2">
              <span className="text-[12px] font-semibold text-foreground">{r.from}</span>
              {r.verdict && (
                <span className={`rounded-full border px-1.5 py-px text-[10px] font-medium ${verdictColor(r.verdict)}`}>
                  {r.verdict}{typeof r.confidence === 'number' && r.confidence > 0 ? ` · ${Math.round(r.confidence * 100)}%` : ''}
                </span>
              )}
              <span className="ml-auto text-[10px] text-muted-foreground">{new Date(r.at).toLocaleTimeString()}</span>
            </div>
            <p className="text-[12px] leading-relaxed text-muted-foreground">{r.text}</p>
          </div>
        ))}

        {chat.map((m) => (
          <div key={m.id} className={`rounded-md border px-2.5 py-2 ${m.mine ? 'border-primary/30 bg-primary/5' : 'border-white/10 bg-black/30'}`}>
            <div className="mb-0.5 flex items-center gap-2">
              <span className="text-[12px] font-semibold text-foreground">{m.from}</span>
              {m.verdict && (
                <span className={`rounded-full border px-1.5 py-px text-[10px] font-medium ${verdictColor(m.verdict)}`}>
                  {m.verdict}{typeof m.confidence === 'number' && m.confidence > 0 ? ` · ${Math.round(m.confidence * 100)}%` : ''}
                </span>
              )}
              <span className="ml-auto text-[10px] text-muted-foreground">{new Date(m.at).toLocaleTimeString()}</span>
            </div>
            <p className="text-[12px] leading-relaxed text-foreground/90">{m.text}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="h-9 rounded-md border border-border/60 bg-background px-2 text-[12px] text-foreground"
        >
          <option value="swarm">Whole swarm (4 leads)</option>
          {AGENT_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void send(); }}
          placeholder="Ask the desk anything — e.g. what are you watching right now?"
          className="h-9 min-w-0 flex-1 rounded-md border border-border/60 bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground"
        />
        <button
          onClick={() => void send()}
          disabled={asking || !draft.trim()}
          className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground disabled:opacity-50"
        >
          {asking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Ask
        </button>
      </div>
    </div>
  );
}
