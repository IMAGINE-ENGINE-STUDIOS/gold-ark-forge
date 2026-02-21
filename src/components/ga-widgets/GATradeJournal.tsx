import { useState, useMemo } from 'react';
import { BookOpen, Plus, Tag, Smile, Meh, Frown, Flame, Trophy, TrendingUp, TrendingDown, X, ChevronDown } from 'lucide-react';
import WidgetShell from './WidgetShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface JournalEntry {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  tags: string[];
  emotion: 'confident' | 'neutral' | 'fearful';
  notes: string;
  createdAt: number;
}

const EMOTION_META = {
  confident: { icon: Smile, color: 'text-emerald-400', bg: 'bg-emerald-500/15', label: 'CONFIDENT' },
  neutral: { icon: Meh, color: 'text-marble/50', bg: 'bg-marble/10', label: 'NEUTRAL' },
  fearful: { icon: Frown, color: 'text-red-400', bg: 'bg-red-500/15', label: 'FEARFUL' },
} as const;

const PRESET_TAGS = ['breakout', 'scalp', 'swing', 'reversal', 'news', 'earnings', 'support', 'resistance', 'FOMO', 'planned'];

const loadJournal = (): JournalEntry[] => {
  try {
    const raw = localStorage.getItem('ga_trade_journal');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveJournal = (entries: JournalEntry[]) => {
  localStorage.setItem('ga_trade_journal', JSON.stringify(entries));
};

const GATradeJournal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>(loadJournal);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<'list' | 'stats'>('list');

  // Form state
  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [qty, setQty] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [emotion, setEmotion] = useState<'confident' | 'neutral' | 'fearful'>('neutral');
  const [notes, setNotes] = useState('');

  const stats = useMemo(() => {
    if (entries.length === 0) return null;
    const wins = entries.filter(e => e.pnl > 0);
    const losses = entries.filter(e => e.pnl < 0);
    const totalPnl = entries.reduce((s, e) => s + e.pnl, 0);
    const avgWin = wins.length > 0 ? wins.reduce((s, e) => s + e.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((s, e) => s + e.pnl, 0) / losses.length : 0;
    
    // Streaks
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let tempStreak = 0;
    let lastWin = true;
    for (const e of entries) {
      const isWin = e.pnl > 0;
      if (isWin === lastWin) { tempStreak++; } else { tempStreak = 1; lastWin = isWin; }
      if (isWin) maxWinStreak = Math.max(maxWinStreak, tempStreak);
      else maxLossStreak = Math.max(maxLossStreak, tempStreak);
    }
    currentStreak = tempStreak * (lastWin ? 1 : -1);

    // By emotion
    const byEmotion = Object.keys(EMOTION_META).map(em => {
      const group = entries.filter(e => e.emotion === em);
      const winRate = group.length > 0 ? (group.filter(e => e.pnl > 0).length / group.length) * 100 : 0;
      return { emotion: em, count: group.length, winRate };
    });

    return {
      totalTrades: entries.length,
      winRate: (wins.length / entries.length) * 100,
      totalPnl,
      avgWin,
      avgLoss,
      bestTrade: entries.reduce((best, e) => e.pnl > best.pnl ? e : best, entries[0]),
      worstTrade: entries.reduce((worst, e) => e.pnl < worst.pnl ? e : worst, entries[0]),
      maxWinStreak,
      maxLossStreak,
      currentStreak,
      byEmotion,
      expectancy: avgWin * (wins.length / entries.length) + avgLoss * (losses.length / entries.length),
    };
  }, [entries]);

  const addEntry = () => {
    const q = parseFloat(qty);
    const ep = parseFloat(entryPrice);
    const xp = parseFloat(exitPrice);
    if (!symbol || !q || !ep || !xp) return;

    const pnl = side === 'buy' ? (xp - ep) * q : (ep - xp) * q;
    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      symbol: symbol.toUpperCase(),
      side, qty: q, entryPrice: ep, exitPrice: xp, pnl,
      tags, emotion, notes,
      createdAt: Date.now(),
    };

    const updated = [entry, ...entries];
    setEntries(updated);
    saveJournal(updated);
    setShowForm(false);
    setSymbol(''); setQty(''); setEntryPrice(''); setExitPrice('');
    setTags([]); setEmotion('neutral'); setNotes('');
  };

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveJournal(updated);
  };

  return (
    <WidgetShell icon={BookOpen} title="TRADE JOURNAL" badge={`${entries.length} ENTRIES`}>
      {/* Top Controls */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1">
          {(['list', 'stats'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-2 py-1 rounded text-[8px] font-display tracking-wider transition-all ${
                view === v ? 'bg-gold/15 text-gold border border-gold/30' : 'text-marble/30 border border-transparent'
              }`}>{v.toUpperCase()}</button>
          ))}
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm"
          className="ml-auto bg-gold/15 text-gold hover:bg-gold/25 text-[9px] font-display tracking-wider h-6 px-2">
          <Plus className="w-3 h-3 mr-1" /> LOG TRADE
        </Button>
      </div>

      {/* New Entry Form */}
      {showForm && (
        <div className="space-y-2 p-3 rounded-lg bg-navy-light/20 border border-gold/10 mb-3">
          <div className="flex gap-2">
            <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="Symbol" className="bg-navy-light border-gold/20 text-marble font-mono text-xs flex-1" />
            <div className="flex gap-1">
              {(['buy', 'sell'] as const).map(s => (
                <button key={s} onClick={() => setSide(s)}
                  className={`px-2 py-1 rounded text-[8px] font-display tracking-wider ${
                    side === s ? (s === 'buy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30') : 'text-marble/30 border border-gold/10'
                  }`}>{s.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qty" className="bg-navy-light border-gold/20 text-marble font-mono text-xs" />
            <Input type="number" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} placeholder="Entry $" className="bg-navy-light border-gold/20 text-marble font-mono text-xs" />
            <Input type="number" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} placeholder="Exit $" className="bg-navy-light border-gold/20 text-marble font-mono text-xs" />
          </div>

          {/* Emotion */}
          <div className="flex gap-1">
            {(Object.keys(EMOTION_META) as Array<keyof typeof EMOTION_META>).map(em => {
              const meta = EMOTION_META[em];
              const Icon = meta.icon;
              return (
                <button key={em} onClick={() => setEmotion(em)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[8px] font-display tracking-wider transition-all ${
                    emotion === em ? `${meta.bg} ${meta.color} border border-current/30` : 'text-marble/25 border border-gold/5'
                  }`}>
                  <Icon className="w-3 h-3" /> {meta.label}
                </button>
              );
            })}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {PRESET_TAGS.map(tag => (
              <button key={tag} onClick={() => setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                className={`px-1.5 py-0.5 rounded text-[7px] font-mono transition-colors ${
                  tags.includes(tag) ? 'bg-gold/20 text-gold border border-gold/30' : 'text-marble/20 border border-gold/5 hover:text-marble/40'
                }`}>{tag}</button>
            ))}
          </div>

          {/* Notes */}
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." rows={2}
            className="w-full bg-navy-light border border-gold/20 text-marble text-xs rounded p-2 font-mono resize-none placeholder:text-marble/20" />

          <Button onClick={addEntry} className="w-full bg-gold text-navy font-display tracking-wider text-xs h-8">SAVE ENTRY</Button>
        </div>
      )}

      {/* Stats View */}
      {view === 'stats' && stats && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'TRADES', value: stats.totalTrades },
              { label: 'WIN RATE', value: `${stats.winRate.toFixed(0)}%` },
              { label: 'TOTAL P&L', value: `$${stats.totalPnl.toFixed(0)}`, color: stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
              { label: 'EXPECTANCY', value: `$${stats.expectancy.toFixed(2)}`, color: stats.expectancy >= 0 ? 'text-emerald-400' : 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-navy-light/30 rounded p-2 text-center border border-gold/5">
                <div className="text-[7px] text-marble/25 font-display tracking-wider">{s.label}</div>
                <div className={`text-xs font-mono ${s.color || 'text-marble'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-navy-light/20 rounded p-2 border border-gold/5">
              <div className="text-[7px] text-marble/25 font-display tracking-wider">AVG WIN</div>
              <div className="text-xs font-mono text-emerald-400">+${stats.avgWin.toFixed(2)}</div>
            </div>
            <div className="bg-navy-light/20 rounded p-2 border border-gold/5">
              <div className="text-[7px] text-marble/25 font-display tracking-wider">AVG LOSS</div>
              <div className="text-xs font-mono text-red-400">${stats.avgLoss.toFixed(2)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[9px] font-mono">
            <span className="text-marble/30">Streaks:</span>
            <span className="text-emerald-400/60">
              <Trophy className="w-3 h-3 inline mr-0.5" />{stats.maxWinStreak} best
            </span>
            <span className="text-red-400/60">
              <Flame className="w-3 h-3 inline mr-0.5" />{stats.maxLossStreak} worst
            </span>
            <span className={stats.currentStreak > 0 ? 'text-emerald-400' : 'text-red-400'}>
              NOW: {Math.abs(stats.currentStreak)} {stats.currentStreak > 0 ? 'W' : 'L'}
            </span>
          </div>

          {/* By Emotion */}
          <div className="space-y-1">
            <div className="text-[8px] font-display tracking-wider text-marble/25">WIN RATE BY EMOTION</div>
            {stats.byEmotion.filter(e => e.count > 0).map(e => {
              const meta = EMOTION_META[e.emotion as keyof typeof EMOTION_META];
              const Icon = meta.icon;
              return (
                <div key={e.emotion} className="flex items-center gap-2 text-[9px] font-mono">
                  <Icon className={`w-3 h-3 ${meta.color}`} />
                  <span className="text-marble/40 w-16">{meta.label}</span>
                  <div className="flex-1 h-1.5 bg-navy-light/30 rounded-full overflow-hidden">
                    <div className="h-full bg-gold/40 rounded-full transition-all" style={{ width: `${e.winRate}%` }} />
                  </div>
                  <span className="text-marble/50 w-10 text-right">{e.winRate.toFixed(0)}%</span>
                  <span className="text-marble/20">({e.count})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-1 max-h-[300px] overflow-y-auto watchlist-scroll">
          {entries.length === 0 && (
            <div className="text-center py-8 text-marble/20 text-[10px] font-display">
              No journal entries yet. Click LOG TRADE to start.
            </div>
          )}
          {entries.map(entry => {
            const em = EMOTION_META[entry.emotion];
            const EmIcon = em.icon;
            return (
              <div key={entry.id} className="p-2 rounded bg-navy-light/20 border border-gold/5 hover:border-gold/15 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-mono px-1 py-0.5 rounded ${
                      entry.side === 'buy' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                    }`}>{entry.side.toUpperCase()}</span>
                    <span className="text-[11px] font-mono text-marble/70">{entry.symbol}</span>
                    <span className="text-[9px] text-marble/25">{entry.qty} @ ${entry.entryPrice.toFixed(2)}→${entry.exitPrice.toFixed(2)}</span>
                    <EmIcon className={`w-3 h-3 ${em.color}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono ${entry.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {entry.pnl >= 0 ? '+' : ''}${entry.pnl.toFixed(2)}
                    </span>
                    <button onClick={() => deleteEntry(entry.id)} className="opacity-0 group-hover:opacity-100 text-marble/20 hover:text-red-400 transition-all">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {entry.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {entry.tags.map(t => (
                      <span key={t} className="text-[7px] font-mono text-gold/40 bg-gold/5 px-1 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                )}
                {entry.notes && <p className="text-[9px] text-marble/30 mt-1 font-mono">{entry.notes}</p>}
                <div className="text-[7px] text-marble/15 font-mono mt-1">
                  {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WidgetShell>
  );
};

export default GATradeJournal;
