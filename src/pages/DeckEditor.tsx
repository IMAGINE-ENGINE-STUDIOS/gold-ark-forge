import { useState, useEffect, useRef, useCallback, MouseEvent as RMouseEvent } from 'react';
import { Plus, Trash2, Copy, Type, Image as ImageIcon, Square, Maximize, Lock, Save, Download, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

import TitleSlide from '@/components/deck/slides/TitleSlide';
import AboutSlide from '@/components/deck/slides/AboutSlide';
import ProblemSlide from '@/components/deck/slides/ProblemSlide';
import SolutionSlide from '@/components/deck/slides/SolutionSlide';
import AssetClassesSlide from '@/components/deck/slides/AssetClassesSlide';
import PlatformSlide from '@/components/deck/slides/PlatformSlide';
import BusinessModelSlide from '@/components/deck/slides/BusinessModelSlide';
import MarketSlide from '@/components/deck/slides/MarketSlide';
import AskSlide from '@/components/deck/slides/AskSlide';
import TeamSlide from '@/components/deck/slides/TeamSlide';
import PartnersAndTractionSlide from '@/components/deck/slides/PartnersAndTractionSlide';
import ThankYouSlide from '@/components/deck/slides/ThankYouSlide';

const BASE_SLIDES: { name: string; node: JSX.Element }[] = [
  { name: '1 · Cover',              node: <TitleSlide /> },
  { name: '2 · About',              node: <AboutSlide /> },
  { name: '3 · Problem',            node: <ProblemSlide /> },
  { name: '4 · Solution',           node: <SolutionSlide /> },
  { name: '5 · Asset Classes',      node: <AssetClassesSlide /> },
  { name: '6 · Platform',           node: <PlatformSlide /> },
  { name: '7 · Business Model',     node: <BusinessModelSlide /> },
  { name: '8 · Market',             node: <MarketSlide /> },
  { name: '9 · Ask',                node: <AskSlide /> },
  { name: '10 · Team',              node: <TeamSlide /> },
  { name: '11 · Partners',          node: <PartnersAndTractionSlide /> },
  { name: '12 · Thank You',         node: <ThankYouSlide /> },
];

const PASSWORD = 'HitTheTarget';
const STORAGE_KEY = 'ga_deck_editor_v2';
const SESSION_KEY = 'ga_deck_editor_unlocked';
const MAX_SLIDES = 1000;

type ElType = 'text' | 'image' | 'rect';
interface DeckEl {
  id: string;
  type: ElType;
  x: number; y: number; w: number; h: number;
  rotation?: number;
  content?: string; // text or image url
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  bg?: string;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  radius?: number;
  opacity?: number;
}
interface DeckSlide {
  id: string;
  background: string;
  elements: DeckEl[];
  baseSlide?: number; // index into BASE_SLIDES; if set, renders the existing pitch deck slide as background
  html?: string;      // editable HTML snapshot of the base slide (text/img inline edits)
}

const uid = () => Math.random().toString(36).slice(2, 10);

const blankSlide = (): DeckSlide => ({
  id: uid(),
  background: 'linear-gradient(145deg, hsl(213,35%,10%) 0%, hsl(213,32%,16%) 60%, hsl(213,28%,20%) 100%)',
  elements: [
    { id: uid(), type: 'text', x: 160, y: 460, w: 1600, h: 160, content: 'New Slide', fontSize: 96, color: '#e8c97c', fontFamily: 'Cinzel, serif', align: 'center', bold: true },
  ],
});

const seededFromDeck = (): DeckSlide[] =>
  BASE_SLIDES.map((_, i) => ({
    id: uid(),
    background: '#000',
    elements: [],
    baseSlide: i,
  }));

const loadSlides = (): DeckSlide[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {}
  return seededFromDeck();
};

const DeckEditor = () => {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [pw, setPw] = useState('');

  const [slides, setSlides] = useState<DeckSlide[]>(() => loadSlides());
  const [current, setCurrent] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPresenting, setIsPresenting] = useState(false);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
    } catch (e: any) {
      toast.error('Storage full — try smaller images or fewer base64 uploads');
    }
  }, [slides]);

  // scale
  useEffect(() => {
    const calc = () => {
      if (!canvasWrapRef.current) return;
      const { clientWidth: w, clientHeight: h } = canvasWrapRef.current;
      setScale(Math.min((w - 40) / 1920, (h - 40) / 1080));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [isPresenting, unlocked]);

  // key handlers
  useEffect(() => {
    if (!unlocked) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const editing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;
      if (isPresenting) {
        if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); setCurrent(c => Math.min(slides.length - 1, c + 1)); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); setCurrent(c => Math.max(0, c - 1)); }
        if (e.key === 'Escape') document.exitFullscreen?.();
        return;
      }
      if (editing) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        deleteElement(selectedId);
      }
      if (e.key === 'ArrowRight') setCurrent(c => Math.min(slides.length - 1, c + 1));
      if (e.key === 'ArrowLeft') setCurrent(c => Math.max(0, c - 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [unlocked, isPresenting, selectedId, slides.length]);

  useEffect(() => {
    const h = () => setIsPresenting(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pw === PASSWORD) {
              sessionStorage.setItem(SESSION_KEY, '1');
              setUnlocked(true);
            } else toast.error('Incorrect password');
          }}
          className="w-full max-w-sm border border-primary/30 rounded-xl p-8 bg-secondary/40 backdrop-blur space-y-4"
        >
          <div className="flex items-center gap-2 text-primary">
            <Lock className="w-5 h-5" />
            <span className="tracking-widest text-sm" style={{ fontFamily: 'Cinzel, serif' }}>GOLD ARROW · DECK EDITOR</span>
          </div>
          <p className="text-xs text-muted-foreground">Password protected. Enter passphrase to edit.</p>
          <Input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Passphrase" autoFocus />
          <Button type="submit" className="w-full">Unlock</Button>
        </form>
      </div>
    );
  }

  const slide = slides[current];
  const selected = slide?.elements.find(e => e.id === selectedId) || null;

  const updateSlide = (patch: Partial<DeckSlide>) => {
    setSlides(s => s.map((sl, i) => i === current ? { ...sl, ...patch } : sl));
  };
  const updateElement = (id: string, patch: Partial<DeckEl>) => {
    setSlides(s => s.map((sl, i) => i === current ? { ...sl, elements: sl.elements.map(el => el.id === id ? { ...el, ...patch } : el) } : sl));
  };
  const deleteElement = (id: string) => {
    setSlides(s => s.map((sl, i) => i === current ? { ...sl, elements: sl.elements.filter(el => el.id !== id) } : sl));
    setSelectedId(null);
  };
  const addElement = (type: ElType) => {
    const base: DeckEl = type === 'text'
      ? { id: uid(), type, x: 760, y: 480, w: 400, h: 120, content: 'Edit me', fontSize: 48, color: '#ffffff', align: 'center' }
      : type === 'rect'
      ? { id: uid(), type, x: 760, y: 460, w: 400, h: 160, bg: 'hsla(43,72%,50%,0.2)', radius: 12, color: 'hsla(43,72%,50%,0.6)' }
      : { id: uid(), type, x: 660, y: 360, w: 600, h: 360, content: '', radius: 8 };
    setSlides(s => s.map((sl, i) => i === current ? { ...sl, elements: [...sl.elements, base] } : sl));
    setSelectedId(base.id);
  };

  const addSlide = () => {
    if (slides.length >= MAX_SLIDES) { toast.error(`Max ${MAX_SLIDES} slides`); return; }
    const ns = blankSlide();
    setSlides(s => [...s.slice(0, current + 1), ns, ...s.slice(current + 1)]);
    setCurrent(c => c + 1);
    setSelectedId(null);
  };

  const resetToDeck = () => {
    if (!confirm('Reset editor to the original pitch deck? Your overlay edits will be lost.')) return;
    setSlides(seededFromDeck());
    setCurrent(0);
    setSelectedId(null);
    toast.success('Reset to original deck');
  };
  const duplicateSlide = () => {
    if (slides.length >= MAX_SLIDES) { toast.error(`Max ${MAX_SLIDES} slides`); return; }
    const copy: DeckSlide = { ...slide, id: uid(), elements: slide.elements.map(el => ({ ...el, id: uid() })) };
    setSlides(s => [...s.slice(0, current + 1), copy, ...s.slice(current + 1)]);
    setCurrent(c => c + 1);
  };
  const deleteSlide = () => {
    if (slides.length === 1) { toast.error('Need at least one slide'); return; }
    setSlides(s => s.filter((_, i) => i !== current));
    setCurrent(c => Math.max(0, c - 1));
    setSelectedId(null);
  };

  // drag/resize
  const startDrag = (e: RMouseEvent, id: string, mode: 'move' | 'resize') => {
    e.stopPropagation();
    e.preventDefault();
    const el = slide.elements.find(x => x.id === id);
    if (!el) return;
    setSelectedId(id);
    const startX = e.clientX, startY = e.clientY;
    const { x, y, w, h } = el;
    const onMove = (ev: globalThis.MouseEvent) => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      if (mode === 'move') updateElement(id, { x: Math.round(x + dx), y: Math.round(y + dy) });
      else updateElement(id, { w: Math.max(20, Math.round(w + dx)), h: Math.max(20, Math.round(h + dy)) });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onUploadImage = (file: File, forId?: string) => {
    if (file.size > 4 * 1024 * 1024) { toast.error('Image too big (max 4MB) — paste a URL instead'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      if (forId) updateElement(forId, { content: url });
      else {
        const el: DeckEl = { id: uid(), type: 'image', x: 660, y: 360, w: 600, h: 360, content: url, radius: 8 };
        setSlides(s => s.map((sl, i) => i === current ? { ...sl, elements: [...sl.elements, el] } : sl));
        setSelectedId(el.id);
      }
    };
    reader.readAsDataURL(file);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(slides, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'gold-arrow-deck.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const importJson = (file: File) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result as string);
        if (Array.isArray(data) && data.length) {
          setSlides(data);
          setCurrent(0);
          toast.success(`Imported ${data.length} slides`);
        }
      } catch { toast.error('Invalid JSON'); }
    };
    r.readAsText(file);
  };

  const enterFullscreen = () => document.documentElement.requestFullscreen?.();

  const renderElement = (el: DeckEl, editable: boolean) => {
    const isSel = el.id === selectedId && editable;
    const baseStyle: React.CSSProperties = {
      position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h,
      transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      opacity: el.opacity ?? 1,
      outline: isSel ? '2px solid hsla(43,72%,50%,0.9)' : undefined,
      cursor: editable ? 'move' : 'default',
    };
    if (el.type === 'text') {
      return (
        <div key={el.id}
          style={{ ...baseStyle, color: el.color, fontSize: el.fontSize, fontFamily: el.fontFamily, fontWeight: el.bold ? 700 : 400, fontStyle: el.italic ? 'italic' : 'normal', textAlign: el.align, display: 'flex', alignItems: 'center', justifyContent: el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start', padding: 8, lineHeight: 1.1 }}
          onMouseDown={editable ? (e) => startDrag(e, el.id, 'move') : undefined}
          onDoubleClick={editable ? (e) => { e.stopPropagation(); const t = prompt('Edit text:', el.content || ''); if (t !== null) updateElement(el.id, { content: t }); } : undefined}
        >
          <span style={{ width: '100%', whiteSpace: 'pre-wrap' }}>{el.content}</span>
          {isSel && <ResizeHandle onDown={(e) => startDrag(e, el.id, 'resize')} />}
        </div>
      );
    }
    if (el.type === 'image') {
      return (
        <div key={el.id} style={baseStyle} onMouseDown={editable ? (e) => startDrag(e, el.id, 'move') : undefined}>
          {el.content ? (
            <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: el.radius, pointerEvents: 'none' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'hsla(43,72%,50%,0.1)', border: '2px dashed hsla(43,72%,50%,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsla(43,72%,50%,0.7)', borderRadius: el.radius }}>
              <ImageIcon className="w-12 h-12" />
            </div>
          )}
          {isSel && <ResizeHandle onDown={(e) => startDrag(e, el.id, 'resize')} />}
        </div>
      );
    }
    return (
      <div key={el.id}
        style={{ ...baseStyle, background: el.bg, border: el.color ? `2px solid ${el.color}` : undefined, borderRadius: el.radius }}
        onMouseDown={editable ? (e) => startDrag(e, el.id, 'move') : undefined}
      >
        {isSel && <ResizeHandle onDown={(e) => startDrag(e, el.id, 'resize')} />}
      </div>
    );
  };

  if (isPresenting) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center" ref={canvasWrapRef} onClick={() => setCurrent(c => Math.min(slides.length - 1, c + 1))}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center', width: 1920, height: 1080, position: 'relative', background: slide.background }}>
          {slide.baseSlide != null && BASE_SLIDES[slide.baseSlide] && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{BASE_SLIDES[slide.baseSlide].node}</div>
          )}
          {slide.elements.map(el => renderElement(el, false))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-border/30 bg-secondary/80 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-primary tracking-widest text-sm" style={{ fontFamily: 'Cinzel, serif' }}>GOLD ARROW</span>
          <span className="text-xs text-muted-foreground">Editor · {slides.length}/{MAX_SLIDES} slides</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => addElement('text')}><Type className="w-3.5 h-3.5 mr-1" />Text</Button>
          <label className="inline-flex">
            <Button size="sm" variant="ghost" asChild><span className="cursor-pointer"><ImageIcon className="w-3.5 h-3.5 mr-1" />Image</span></Button>
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onUploadImage(e.target.files[0])} />
          </label>
          <Button size="sm" variant="ghost" onClick={() => addElement('rect')}><Square className="w-3.5 h-3.5 mr-1" />Shape</Button>
          <div className="w-px h-5 bg-border/40 mx-1" />
          <Button size="sm" variant="ghost" onClick={() => setCurrent(c => Math.max(0, c - 1))}><ChevronLeft className="w-3.5 h-3.5" /></Button>
          <span className="text-xs font-mono w-16 text-center">{current + 1} / {slides.length}</span>
          <Button size="sm" variant="ghost" onClick={() => setCurrent(c => Math.min(slides.length - 1, c + 1))}><ChevronRight className="w-3.5 h-3.5" /></Button>
          <div className="w-px h-5 bg-border/40 mx-1" />
          <Button size="sm" variant="ghost" onClick={exportJson}><Download className="w-3.5 h-3.5 mr-1" />Export</Button>
          <label className="inline-flex">
            <Button size="sm" variant="ghost" asChild><span className="cursor-pointer"><Upload className="w-3.5 h-3.5 mr-1" />Import</span></Button>
            <input type="file" accept="application/json" className="hidden" onChange={e => e.target.files?.[0] && importJson(e.target.files[0])} />
          </label>
          <Button size="sm" variant="ghost" className="text-amber-400" onClick={resetToDeck} title="Reload original pitch deck">Reset to Deck</Button>
          <Button size="sm" variant="ghost" className="text-primary" onClick={enterFullscreen}><Maximize className="w-3.5 h-3.5 mr-1" />Present</Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Slides sidebar */}
        <div className="w-44 border-r border-border/30 bg-secondary/40 flex flex-col">
          <div className="p-2 flex gap-1 border-b border-border/30">
            <Button size="sm" variant="ghost" className="flex-1" onClick={addSlide}><Plus className="w-3 h-3 mr-1" />Add</Button>
            <Button size="sm" variant="ghost" onClick={duplicateSlide} title="Duplicate"><Copy className="w-3 h-3" /></Button>
            <Button size="sm" variant="ghost" onClick={deleteSlide} title="Delete"><Trash2 className="w-3 h-3" /></Button>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {slides.map((s, i) => (
              <button key={s.id} onClick={() => { setCurrent(i); setSelectedId(null); }}
                className={`w-full aspect-video rounded border-2 overflow-hidden relative ${i === current ? 'border-primary' : 'border-border/30 hover:border-primary/40'}`}
                style={{ background: s.background }}
              >
                <div style={{ transform: 'scale(0.08)', transformOrigin: 'top left', width: 1920, height: 1080, position: 'absolute' }}>
                  {s.baseSlide != null && BASE_SLIDES[s.baseSlide] && (
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{BASE_SLIDES[s.baseSlide].node}</div>
                  )}
                  {s.elements.map(el => renderElement(el, false))}
                </div>
                <span className="absolute bottom-0.5 right-1 text-[9px] text-white/70 font-mono">{i + 1}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-secondary/20" ref={canvasWrapRef} onClick={() => setSelectedId(null)}>
          <div
            style={{ transform: `scale(${scale})`, transformOrigin: 'center center', width: 1920, height: 1080, position: 'relative', background: slide.background, boxShadow: '0 0 60px rgba(0,0,0,0.4)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {slide.baseSlide != null && BASE_SLIDES[slide.baseSlide] && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{BASE_SLIDES[slide.baseSlide].node}</div>
            )}
            {slide.elements.map(el => renderElement(el, true))}
          </div>
        </div>

        {/* Properties */}
        <div className="w-64 border-l border-border/30 bg-secondary/40 p-3 overflow-auto space-y-3 text-xs">
          <div className="font-semibold text-primary tracking-wide text-[10px] uppercase">Slide</div>
          <label className="block space-y-1">
            <span className="text-muted-foreground">Pitch deck base</span>
            <select
              className="w-full h-8 bg-background border border-border/40 rounded px-2 text-xs"
              value={slide.baseSlide ?? ''}
              onChange={e => updateSlide({ baseSlide: e.target.value === '' ? undefined : Number(e.target.value) })}
            >
              <option value="">— None (blank) —</option>
              {BASE_SLIDES.map((b, i) => (
                <option key={i} value={i}>{b.name}</option>
              ))}
            </select>
            <span className="text-[10px] text-muted-foreground italic">Renders the real pitch slide as the background. Add text/images/shapes on top to edit.</span>
          </label>
          <label className="block space-y-1">
            <span className="text-muted-foreground">Background (CSS)</span>
            <Input value={slide.background} onChange={e => updateSlide({ background: e.target.value })} className="text-xs h-8" />
          </label>

          {selected ? (
            <>
              <div className="font-semibold text-primary tracking-wide text-[10px] uppercase pt-2 border-t border-border/30">Element · {selected.type}</div>
              <div className="grid grid-cols-2 gap-2">
                <NumField label="X" value={selected.x} onChange={v => updateElement(selected.id, { x: v })} />
                <NumField label="Y" value={selected.y} onChange={v => updateElement(selected.id, { y: v })} />
                <NumField label="W" value={selected.w} onChange={v => updateElement(selected.id, { w: v })} />
                <NumField label="H" value={selected.h} onChange={v => updateElement(selected.id, { h: v })} />
              </div>
              {selected.type === 'text' && (
                <>
                  <label className="block space-y-1">
                    <span className="text-muted-foreground">Text</span>
                    <textarea className="w-full bg-background border border-border/40 rounded p-2 text-xs" rows={3} value={selected.content || ''} onChange={e => updateElement(selected.id, { content: e.target.value })} />
                  </label>
                  <NumField label="Font size" value={selected.fontSize || 48} onChange={v => updateElement(selected.id, { fontSize: v })} />
                  <label className="block space-y-1">
                    <span className="text-muted-foreground">Font family</span>
                    <Input className="h-8 text-xs" value={selected.fontFamily || ''} onChange={e => updateElement(selected.id, { fontFamily: e.target.value })} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-muted-foreground">Color</span>
                    <input type="color" value={selected.color || '#ffffff'} onChange={e => updateElement(selected.id, { color: e.target.value })} className="w-full h-8 rounded bg-transparent" />
                  </label>
                  <div className="flex gap-1">
                    {(['left', 'center', 'right'] as const).map(a => (
                      <Button key={a} size="sm" variant={selected.align === a ? 'default' : 'ghost'} className="flex-1 h-7 text-[10px]" onClick={() => updateElement(selected.id, { align: a })}>{a}</Button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant={selected.bold ? 'default' : 'ghost'} className="flex-1 h-7 text-[10px] font-bold" onClick={() => updateElement(selected.id, { bold: !selected.bold })}>B</Button>
                    <Button size="sm" variant={selected.italic ? 'default' : 'ghost'} className="flex-1 h-7 text-[10px] italic" onClick={() => updateElement(selected.id, { italic: !selected.italic })}>I</Button>
                  </div>
                </>
              )}
              {selected.type === 'image' && (
                <>
                  <label className="block space-y-1">
                    <span className="text-muted-foreground">Image URL</span>
                    <Input className="h-8 text-xs" value={selected.content || ''} onChange={e => updateElement(selected.id, { content: e.target.value })} placeholder="https://… or upload" />
                  </label>
                  <label className="inline-flex w-full">
                    <Button size="sm" variant="outline" asChild className="w-full"><span className="cursor-pointer"><Upload className="w-3 h-3 mr-1" />Upload file</span></Button>
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onUploadImage(e.target.files[0], selected.id)} />
                  </label>
                  <NumField label="Radius" value={selected.radius || 0} onChange={v => updateElement(selected.id, { radius: v })} />
                </>
              )}
              {selected.type === 'rect' && (
                <>
                  <label className="block space-y-1">
                    <span className="text-muted-foreground">Background (CSS)</span>
                    <Input className="h-8 text-xs" value={selected.bg || ''} onChange={e => updateElement(selected.id, { bg: e.target.value })} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-muted-foreground">Border color</span>
                    <Input className="h-8 text-xs" value={selected.color || ''} onChange={e => updateElement(selected.id, { color: e.target.value })} />
                  </label>
                  <NumField label="Radius" value={selected.radius || 0} onChange={v => updateElement(selected.id, { radius: v })} />
                </>
              )}
              <NumField label="Rotation" value={selected.rotation || 0} onChange={v => updateElement(selected.id, { rotation: v })} />
              <NumField label="Opacity ×100" value={Math.round((selected.opacity ?? 1) * 100)} onChange={v => updateElement(selected.id, { opacity: Math.max(0, Math.min(1, v / 100)) })} />
              <Button size="sm" variant="destructive" className="w-full" onClick={() => deleteElement(selected.id)}><Trash2 className="w-3 h-3 mr-1" />Delete element</Button>
            </>
          ) : (
            <p className="text-muted-foreground italic">Click an element to edit. Double-click text to retype. Drag corner to resize. Delete key to remove.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ResizeHandle = ({ onDown }: { onDown: (e: RMouseEvent) => void }) => (
  <div
    onMouseDown={onDown}
    style={{ position: 'absolute', right: -6, bottom: -6, width: 14, height: 14, background: 'hsla(43,72%,50%,0.95)', border: '2px solid #000', cursor: 'nwse-resize', borderRadius: 2 }}
  />
);

const NumField = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <label className="block space-y-1">
    <span className="text-muted-foreground text-[10px]">{label}</span>
    <Input type="number" className="h-7 text-xs" value={value} onChange={e => onChange(Number(e.target.value) || 0)} />
  </label>
);

export default DeckEditor;