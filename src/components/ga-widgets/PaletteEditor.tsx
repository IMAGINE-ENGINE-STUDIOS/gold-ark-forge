import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Dices, RotateCcw, ChevronDown, ChevronRight, Copy, Save, Trash2, Download, Palette, X, Search, Check } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

/* ─── Types ─── */
interface PaletteState {
  accentHue: number;
  accentSat: number;
  accentLit: number;
  bgHue: number;
  bgSat: number;
  bgLit: number;
  textHue: number;
  textSat: number;
  textLit: number;
  bgMode: 'solid' | 'gradient';
  bgGradientDir: string;
  bgOpacity: number;
  fontFamily: string;
  titleSize: number;
  bodySize: number;
  letterSpacing: number;
  lineHeight: number;
  textOpacity: number;
  borderRadius: number;
  borderWidth: number;
  borderOpacity: number;
  padding: number;
  ornateCorners: boolean;
  glowIntensity: number;
  shadow: 'none' | 'sm' | 'md' | 'lg';
  saturationBoost: number;
  contrastBoost: number;
  backdropBlur: number;
  animationSpeed: number;
  disableAnimations: boolean;
  gap: number;
}

const defaults: PaletteState = {
  accentHue: 43, accentSat: 72, accentLit: 50,
  bgHue: 213, bgSat: 32, bgLit: 16,
  textHue: 40, textSat: 25, textLit: 96,
  bgMode: 'solid', bgGradientDir: '135deg', bgOpacity: 100,
  fontFamily: '', titleSize: 14, bodySize: 12,
  letterSpacing: 0.04, lineHeight: 1.5, textOpacity: 70,
  borderRadius: 8, borderWidth: 1, borderOpacity: 20, padding: 6,
  ornateCorners: false, glowIntensity: 30, shadow: 'md',
  saturationBoost: 100, contrastBoost: 100, backdropBlur: 0,
  animationSpeed: 1, disableAnimations: false, gap: 1,
};

/* ─── 80 Google Fonts ─── */
interface FontEntry { name: string; category: string; }
const FONTS: FontEntry[] = [
  // Serif (20)
  { name: 'Cinzel', category: 'Serif' }, { name: 'Playfair Display', category: 'Serif' },
  { name: 'Cormorant Garamond', category: 'Serif' }, { name: 'Merriweather', category: 'Serif' },
  { name: 'Lora', category: 'Serif' }, { name: 'EB Garamond', category: 'Serif' },
  { name: 'Crimson Pro', category: 'Serif' }, { name: 'Spectral', category: 'Serif' },
  { name: 'Libre Baskerville', category: 'Serif' }, { name: 'Old Standard TT', category: 'Serif' },
  { name: 'Cardo', category: 'Serif' }, { name: 'Sorts Mill Goudy', category: 'Serif' },
  { name: 'Vollkorn', category: 'Serif' }, { name: 'Domine', category: 'Serif' },
  { name: 'Noto Serif', category: 'Serif' }, { name: 'PT Serif', category: 'Serif' },
  { name: 'Bitter', category: 'Serif' }, { name: 'Source Serif 4', category: 'Serif' },
  { name: 'Alegreya', category: 'Serif' }, { name: 'Unna', category: 'Serif' },
  // Sans-Serif (30)
  { name: 'Source Sans 3', category: 'Sans' }, { name: 'Inter', category: 'Sans' },
  { name: 'Roboto', category: 'Sans' }, { name: 'Open Sans', category: 'Sans' },
  { name: 'Lato', category: 'Sans' }, { name: 'Poppins', category: 'Sans' },
  { name: 'Montserrat', category: 'Sans' }, { name: 'Nunito', category: 'Sans' },
  { name: 'Raleway', category: 'Sans' }, { name: 'Work Sans', category: 'Sans' },
  { name: 'DM Sans', category: 'Sans' }, { name: 'Manrope', category: 'Sans' },
  { name: 'Outfit', category: 'Sans' }, { name: 'Sora', category: 'Sans' },
  { name: 'Space Grotesk', category: 'Sans' }, { name: 'Plus Jakarta Sans', category: 'Sans' },
  { name: 'Urbanist', category: 'Sans' }, { name: 'Figtree', category: 'Sans' },
  { name: 'Archivo', category: 'Sans' }, { name: 'Barlow', category: 'Sans' },
  { name: 'IBM Plex Sans', category: 'Sans' }, { name: 'Karla', category: 'Sans' },
  { name: 'Mulish', category: 'Sans' }, { name: 'Overpass', category: 'Sans' },
  { name: 'Red Hat Display', category: 'Sans' }, { name: 'Rubik', category: 'Sans' },
  { name: 'Lexend', category: 'Sans' }, { name: 'Cabin', category: 'Sans' },
  { name: 'Quicksand', category: 'Sans' }, { name: 'Geist', category: 'Sans' },
  // Display (15)
  { name: 'Cinzel Decorative', category: 'Display' }, { name: 'Berkshire Swash', category: 'Display' },
  { name: 'Poiret One', category: 'Display' }, { name: 'Forum', category: 'Display' },
  { name: 'Tenor Sans', category: 'Display' }, { name: 'Marcellus', category: 'Display' },
  { name: 'Josefin Sans', category: 'Display' }, { name: 'Italiana', category: 'Display' },
  { name: 'Megrim', category: 'Display' }, { name: 'Bodoni Moda', category: 'Display' },
  { name: 'Yeseva One', category: 'Display' }, { name: 'Oranienbaum', category: 'Display' },
  { name: 'Cormorant SC', category: 'Display' }, { name: 'Abril Fatface', category: 'Display' },
  { name: 'Baskervville', category: 'Display' },
  // Monospace (15)
  { name: 'JetBrains Mono', category: 'Mono' }, { name: 'Fira Code', category: 'Mono' },
  { name: 'Source Code Pro', category: 'Mono' }, { name: 'IBM Plex Mono', category: 'Mono' },
  { name: 'Space Mono', category: 'Mono' }, { name: 'Roboto Mono', category: 'Mono' },
  { name: 'Inconsolata', category: 'Mono' }, { name: 'Ubuntu Mono', category: 'Mono' },
  { name: 'Courier Prime', category: 'Mono' }, { name: 'Anonymous Pro', category: 'Mono' },
  { name: 'Noto Sans Mono', category: 'Mono' }, { name: 'Red Hat Mono', category: 'Mono' },
  { name: 'Azeret Mono', category: 'Mono' }, { name: 'Martian Mono', category: 'Mono' },
  { name: 'Geist Mono', category: 'Mono' },
];

const loadedFonts = new Set<string>();
function loadFont(name: string) {
  if (!name || loadedFonts.has(name)) return;
  loadedFonts.add(name);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

/* ─── Presets ─── */
const accentPresets = [
  { h: 43, s: 72, l: 50 }, { h: 48, s: 80, l: 55 }, { h: 35, s: 65, l: 42 }, { h: 30, s: 60, l: 35 },
  { h: 0, s: 65, l: 50 }, { h: 200, s: 50, l: 50 }, { h: 270, s: 45, l: 55 }, { h: 140, s: 40, l: 45 },
  { h: 15, s: 70, l: 50 }, { h: 180, s: 55, l: 40 }, { h: 320, s: 50, l: 50 }, { h: 60, s: 60, l: 48 },
];

const gradientPresets = [
  { dir: '135deg', label: 'Navy' }, { dir: '180deg', label: 'Vertical' },
  { dir: '90deg', label: 'Horizontal' }, { dir: '45deg', label: 'Diagonal' },
  { dir: '225deg', label: 'Reverse' }, { dir: '0deg', label: 'Up' },
];

const dirOptions = ['0deg', '45deg', '90deg', '135deg', '180deg', '225deg', '270deg', '315deg'];

/* ─── Helpers ─── */
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const hslStr = (h: number, s: number, l: number) => `${h} ${s}% ${l}%`;

type Section = 'colors' | 'background' | 'typography' | 'shape' | 'effects' | 'animation' | 'spacing' | 'presets';
const SECTIONS: { key: Section; label: string }[] = [
  { key: 'colors', label: 'COLORS' },
  { key: 'background', label: 'BACKGROUND' },
  { key: 'typography', label: 'TYPOGRAPHY' },
  { key: 'shape', label: 'SHAPE' },
  { key: 'effects', label: 'EFFECTS' },
  { key: 'animation', label: 'ANIMATION' },
  { key: 'spacing', label: 'SPACING' },
  { key: 'presets', label: 'PRESETS' },
];

/* ─── Sub-components ─── */
const SectionHeader = ({ label, open, onClick }: { label: string; open: boolean; onClick: () => void }) => (
  <button onClick={onClick} className="flex items-center justify-between w-full py-2 text-[10px] font-display tracking-[0.25em] text-marble/60 hover:text-gold/80 transition-colors">
    {label}
    {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
  </button>
);

const SliderRow = ({ label, value, min, max, step, onChange, suffix = '' }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; suffix?: string }) => (
  <div>
    <label className="text-[9px] text-marble/40 font-display tracking-wider">{label} — {typeof value === 'number' ? (step < 1 ? value.toFixed(2) : value) : value}{suffix}</label>
    <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)}
      className="mt-1 [&_[data-slot=track]]:h-1 [&_[data-slot=track]]:bg-gold/10 [&_[data-slot=range]]:bg-gold/50 [&_[data-slot=thumb]]:w-3 [&_[data-slot=thumb]]:h-3 [&_[data-slot=thumb]]:border-gold/60" />
  </div>
);

/* ─── Main Component ─── */
interface PaletteEditorProps { children: ReactNode; widgetId: string; }

const PaletteEditor = ({ children, widgetId }: PaletteEditorProps) => {
  const [state, setState] = useState<PaletteState>(() => {
    try {
      const saved = localStorage.getItem(`palette-active:${widgetId}`);
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch {}
    return { ...defaults };
  });
  const [openSection, setOpenSection] = useState<Section | null>('colors');
  const [collapsed, setCollapsed] = useState(false);
  const [fontSearch, setFontSearch] = useState('');
  const [presetName, setPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(`palette-presets:${widgetId}`) || '[]'); } catch { return []; }
  });
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const set = useCallback(<K extends keyof PaletteState>(key: K, val: PaletteState[K]) => {
    setState(prev => ({ ...prev, [key]: val }));
  }, []);

  // Auto-save active state
  useEffect(() => {
    localStorage.setItem(`palette-active:${widgetId}`, JSON.stringify(state));
  }, [state, widgetId]);

  // Load font when changed
  useEffect(() => { if (state.fontFamily) loadFont(state.fontFamily); }, [state.fontFamily]);

  const randomize = useCallback(() => {
    const hue = Math.floor(Math.random() * 360);
    setState(prev => ({
      ...prev,
      accentHue: hue, accentSat: 50 + Math.floor(Math.random() * 30), accentLit: 40 + Math.floor(Math.random() * 20),
      bgHue: 200 + Math.floor(Math.random() * 30), bgSat: 25 + Math.floor(Math.random() * 15), bgLit: 8 + Math.floor(Math.random() * 12),
      textHue: 30 + Math.floor(Math.random() * 20), textSat: 15 + Math.floor(Math.random() * 20), textLit: 88 + Math.floor(Math.random() * 10),
      borderRadius: Math.floor(Math.random() * 16), borderWidth: Math.floor(Math.random() * 3),
      glowIntensity: Math.floor(Math.random() * 80), shadow: (['none', 'sm', 'md', 'lg'] as const)[Math.floor(Math.random() * 4)],
      fontFamily: FONTS[Math.floor(Math.random() * FONTS.length)].name,
    }));
  }, []);

  const reset = useCallback(() => { setState({ ...defaults }); toast.success('Palette reset'); }, []);

  const toggleSection = useCallback((s: Section) => setOpenSection(prev => prev === s ? null : s), []);

  // Save/Export
  const copyCSS = useCallback(() => {
    const s = state;
    const css = `:root {\n  --gold: ${hslStr(s.accentHue, s.accentSat, s.accentLit)};\n  --gold-light: ${hslStr(s.accentHue, s.accentSat + 4, s.accentLit + 12)};\n  --gold-dark: ${hslStr(s.accentHue - 3, s.accentSat - 4, s.accentLit - 12)};\n  --gold-shine: ${hslStr(s.accentHue + 2, 85, s.accentLit + 22)};\n  --navy: ${hslStr(s.bgHue, s.bgSat, s.bgLit)};\n  --navy-light: ${hslStr(s.bgHue, s.bgSat - 4, s.bgLit + 8)};\n  --navy-dark: ${hslStr(s.bgHue, s.bgSat + 3, s.bgLit - 6)};\n  --marble: ${hslStr(s.textHue, s.textSat, s.textLit)};\n}`;
    navigator.clipboard.writeText(css); toast.success('CSS copied to clipboard');
  }, [state]);

  const copyJSON = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(state, null, 2)); toast.success('JSON copied to clipboard');
  }, [state]);

  const savePreset = useCallback(() => {
    const name = presetName.trim() || `Preset ${savedPresets.length + 1}`;
    localStorage.setItem(`palette-preset:${widgetId}:${name}`, JSON.stringify(state));
    const updated = [...new Set([...savedPresets, name])];
    setSavedPresets(updated);
    localStorage.setItem(`palette-presets:${widgetId}`, JSON.stringify(updated));
    setPresetName('');
    toast.success(`Saved "${name}"`);
  }, [state, presetName, savedPresets, widgetId]);

  const loadPreset = useCallback((name: string) => {
    try {
      const data = JSON.parse(localStorage.getItem(`palette-preset:${widgetId}:${name}`) || '{}');
      setState(prev => ({ ...prev, ...data }));
      toast.success(`Loaded "${name}"`);
    } catch {}
  }, [widgetId]);

  const deletePreset = useCallback((name: string) => {
    localStorage.removeItem(`palette-preset:${widgetId}:${name}`);
    const updated = savedPresets.filter(n => n !== name);
    setSavedPresets(updated);
    localStorage.setItem(`palette-presets:${widgetId}`, JSON.stringify(updated));
    toast.success(`Deleted "${name}"`);
  }, [savedPresets, widgetId]);

  // Build CSS variable overrides for wrapper
  const wrapperStyle: React.CSSProperties & Record<string, string> = {
    '--gold': hslStr(state.accentHue, state.accentSat, state.accentLit),
    '--gold-light': hslStr(state.accentHue, clamp(state.accentSat + 4, 0, 100), clamp(state.accentLit + 12, 0, 100)),
    '--gold-dark': hslStr(clamp(state.accentHue - 3, 0, 360), clamp(state.accentSat - 4, 0, 100), clamp(state.accentLit - 12, 0, 100)),
    '--gold-shine': hslStr(clamp(state.accentHue + 2, 0, 360), 85, clamp(state.accentLit + 22, 0, 100)),
    '--navy': hslStr(state.bgHue, state.bgSat, state.bgLit),
    '--navy-light': hslStr(state.bgHue, clamp(state.bgSat - 4, 0, 100), clamp(state.bgLit + 8, 0, 100)),
    '--navy-dark': hslStr(state.bgHue, clamp(state.bgSat + 3, 0, 100), clamp(state.bgLit - 6, 0, 100)),
    '--marble': hslStr(state.textHue, state.textSat, state.textLit),
    '--marble-warm': hslStr(clamp(state.textHue - 2, 0, 360), clamp(state.textSat + 5, 0, 100), clamp(state.textLit - 4, 0, 100)),
    fontSize: `${state.bodySize}px`,
    letterSpacing: `${state.letterSpacing}em`,
    lineHeight: `${state.lineHeight}`,
    borderRadius: `${state.borderRadius}px`,
    borderWidth: `${state.borderWidth}px`,
    borderColor: `hsl(${state.accentHue} ${state.accentSat}% ${state.accentLit}% / ${state.borderOpacity / 100})`,
    borderStyle: state.borderWidth > 0 ? 'solid' : 'none',
    padding: `${state.padding * 4}px`,
    filter: `saturate(${state.saturationBoost}%) contrast(${state.contrastBoost}%)`,
    backdropFilter: state.backdropBlur > 0 ? `blur(${state.backdropBlur}px)` : undefined,
    gap: `${state.gap}rem`,
    position: 'relative' as const,
    overflow: 'hidden',
  };

  if (state.fontFamily) {
    wrapperStyle.fontFamily = `'${state.fontFamily}', sans-serif`;
  }

  // Shadow
  const shadowMap: Record<string, string> = {
    none: 'none',
    sm: `0 2px 8px -2px hsl(${state.accentHue} ${state.accentSat}% ${state.accentLit}% / 0.15)`,
    md: `0 4px 16px -4px hsl(${state.accentHue} ${state.accentSat}% ${state.accentLit}% / 0.2)`,
    lg: `0 8px 32px -6px hsl(${state.accentHue} ${state.accentSat}% ${state.accentLit}% / 0.3)`,
  };
  const glow = state.glowIntensity > 0 ? `, 0 0 ${state.glowIntensity}px -10px hsl(${state.accentHue} ${state.accentSat}% ${state.accentLit}% / 0.4)` : '';
  wrapperStyle.boxShadow = `${shadowMap[state.shadow]}${glow}`;

  if (state.disableAnimations) {
    wrapperStyle.animation = 'none';
    wrapperStyle.transition = 'none';
  } else if (state.animationSpeed !== 1) {
    wrapperStyle.animationDuration = `${state.animationSpeed}s`;
  }

  // Filtered fonts
  const filteredFonts = fontSearch
    ? FONTS.filter(f => f.name.toLowerCase().includes(fontSearch.toLowerCase()))
    : FONTS;
  const fontsByCategory = filteredFonts.reduce<Record<string, FontEntry[]>>((acc, f) => {
    (acc[f.category] ??= []).push(f);
    return acc;
  }, {});

  /* ─── Control Panel ─── */
  const controlPanel = (
    <div className="space-y-0.5 divide-y divide-gold/5">
      {SECTIONS.map(({ key, label }) => (
        <div key={key}>
          <SectionHeader label={label} open={openSection === key} onClick={() => toggleSection(key)} />
          {openSection === key && (
            <div className="pb-3 space-y-2.5 animate-fade-in">
              {key === 'colors' && (
                <>
                  <SliderRow label="ACCENT HUE" value={state.accentHue} min={0} max={360} step={1} onChange={v => set('accentHue', v)} suffix="°" />
                  <SliderRow label="ACCENT SAT" value={state.accentSat} min={0} max={100} step={1} onChange={v => set('accentSat', v)} suffix="%" />
                  <SliderRow label="ACCENT LIT" value={state.accentLit} min={0} max={100} step={1} onChange={v => set('accentLit', v)} suffix="%" />
                  <div>
                    <label className="text-[9px] text-marble/40 font-display tracking-wider">PRESETS</label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {accentPresets.map((p, i) => (
                        <button key={i} onClick={() => { set('accentHue', p.h); set('accentSat', p.s); set('accentLit', p.l); }}
                          className={`w-6 h-6 rounded-full border-2 transition-all shrink-0 ${state.accentHue === p.h && state.accentSat === p.s ? 'border-marble scale-110' : 'border-transparent hover:border-marble/30'}`}
                          style={{ backgroundColor: `hsl(${p.h}, ${p.s}%, ${p.l}%)` }} />
                      ))}
                    </div>
                  </div>
                  <div className="divider-ornate"><span className="text-[8px] text-gold/30 font-display tracking-[0.3em]">TEXT</span></div>
                  <SliderRow label="TEXT HUE" value={state.textHue} min={0} max={360} step={1} onChange={v => set('textHue', v)} suffix="°" />
                  <SliderRow label="TEXT SAT" value={state.textSat} min={0} max={100} step={1} onChange={v => set('textSat', v)} suffix="%" />
                  <SliderRow label="TEXT LIT" value={state.textLit} min={0} max={100} step={1} onChange={v => set('textLit', v)} suffix="%" />
                </>
              )}
              {key === 'background' && (
                <>
                  <SliderRow label="BG HUE" value={state.bgHue} min={0} max={360} step={1} onChange={v => set('bgHue', v)} suffix="°" />
                  <SliderRow label="BG SAT" value={state.bgSat} min={0} max={100} step={1} onChange={v => set('bgSat', v)} suffix="%" />
                  <SliderRow label="BG LIT" value={state.bgLit} min={0} max={100} step={1} onChange={v => set('bgLit', v)} suffix="%" />
                  <div className="flex items-center gap-2">
                    <label className="text-[9px] text-marble/40 font-display tracking-wider">GRADIENT</label>
                    <Switch checked={state.bgMode === 'gradient'} onCheckedChange={v => set('bgMode', v ? 'gradient' : 'solid')} className="scale-75 origin-left" />
                  </div>
                  {state.bgMode === 'gradient' && (
                    <div>
                      <label className="text-[9px] text-marble/40 font-display tracking-wider">DIRECTION</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {dirOptions.map(d => (
                          <button key={d} onClick={() => set('bgGradientDir', d)}
                            className={`w-6 h-6 rounded border text-[8px] font-mono transition-all flex items-center justify-center ${state.bgGradientDir === d ? 'border-gold/50 text-gold bg-gold/10' : 'border-gold/10 text-marble/25 hover:border-gold/25'}`}>
                            <div className="w-3 h-0.5 bg-current" style={{ transform: `rotate(${d})` }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <SliderRow label="OPACITY" value={state.bgOpacity} min={50} max={100} step={5} onChange={v => set('bgOpacity', v)} suffix="%" />
                  <SliderRow label="BACKDROP BLUR" value={state.backdropBlur} min={0} max={20} step={1} onChange={v => set('backdropBlur', v)} suffix="px" />
                </>
              )}
              {key === 'typography' && (
                <>
                  <div>
                    <label className="text-[9px] text-marble/40 font-display tracking-wider">FONT FAMILY</label>
                    <div className="relative mt-1">
                      <Search className="absolute left-2 top-1.5 w-3 h-3 text-marble/30" />
                      <input value={fontSearch} onChange={e => setFontSearch(e.target.value)} placeholder="Search 80 fonts…"
                        className="w-full pl-6 pr-2 py-1 text-[10px] bg-navy-light/50 border border-gold/10 rounded text-marble/60 placeholder:text-marble/25 focus:outline-none focus:border-gold/30" />
                    </div>
                    <div className="mt-1.5 max-h-40 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gold/20">
                      {Object.entries(fontsByCategory).map(([cat, fonts]) => (
                        <div key={cat}>
                          <div className="text-[8px] text-gold/40 font-display tracking-[0.3em] py-0.5 sticky top-0 bg-navy-dark/95 z-10">{cat.toUpperCase()}</div>
                          {fonts.map(f => (
                            <button key={f.name} onClick={() => { loadFont(f.name); set('fontFamily', f.name); }}
                              className={`w-full text-left px-2 py-1 text-[10px] rounded transition-all flex items-center justify-between ${state.fontFamily === f.name ? 'bg-gold/10 text-gold border border-gold/20' : 'text-marble/50 hover:bg-gold/5 hover:text-marble/70 border border-transparent'}`}>
                              <span style={{ fontFamily: `'${f.name}', sans-serif` }}>Aa — {f.name}</span>
                              {state.fontFamily === f.name && <Check className="w-3 h-3 text-gold" />}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <SliderRow label="TITLE SIZE" value={state.titleSize} min={10} max={28} step={1} onChange={v => set('titleSize', v)} suffix="px" />
                  <SliderRow label="BODY SIZE" value={state.bodySize} min={8} max={18} step={1} onChange={v => set('bodySize', v)} suffix="px" />
                  <SliderRow label="LETTER SPACING" value={state.letterSpacing} min={0} max={0.3} step={0.01} onChange={v => set('letterSpacing', v)} suffix="em" />
                  <SliderRow label="LINE HEIGHT" value={state.lineHeight} min={1} max={2} step={0.05} onChange={v => set('lineHeight', v)} />
                  <SliderRow label="TEXT OPACITY" value={state.textOpacity} min={30} max={100} step={5} onChange={v => set('textOpacity', v)} suffix="%" />
                </>
              )}
              {key === 'shape' && (
                <>
                  <SliderRow label="BORDER RADIUS" value={state.borderRadius} min={0} max={24} step={1} onChange={v => set('borderRadius', v)} suffix="px" />
                  <SliderRow label="BORDER WIDTH" value={state.borderWidth} min={0} max={4} step={1} onChange={v => set('borderWidth', v)} suffix="px" />
                  <SliderRow label="BORDER OPACITY" value={state.borderOpacity} min={0} max={100} step={5} onChange={v => set('borderOpacity', v)} suffix="%" />
                  <SliderRow label="PADDING" value={state.padding} min={0} max={16} step={1} onChange={v => set('padding', v)} />
                  <div className="flex items-center gap-2">
                    <label className="text-[9px] text-marble/40 font-display tracking-wider">ORNATE CORNERS</label>
                    <Switch checked={state.ornateCorners} onCheckedChange={v => set('ornateCorners', v)} className="scale-75 origin-left" />
                  </div>
                </>
              )}
              {key === 'effects' && (
                <>
                  <SliderRow label="GLOW INTENSITY" value={state.glowIntensity} min={0} max={100} step={5} onChange={v => set('glowIntensity', v)} />
                  <div>
                    <label className="text-[9px] text-marble/40 font-display tracking-wider">SHADOW DEPTH</label>
                    <div className="flex gap-1.5 mt-1">
                      {(['none', 'sm', 'md', 'lg'] as const).map(s => (
                        <button key={s} onClick={() => set('shadow', s)}
                          className={`px-2 py-1 rounded border text-[9px] font-display tracking-wider transition-all ${state.shadow === s ? 'border-gold/50 text-gold bg-gold/10' : 'border-gold/10 text-marble/30 hover:border-gold/25'}`}>
                          {s.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <SliderRow label="SATURATION BOOST" value={state.saturationBoost} min={50} max={150} step={5} onChange={v => set('saturationBoost', v)} suffix="%" />
                  <SliderRow label="CONTRAST BOOST" value={state.contrastBoost} min={80} max={150} step={5} onChange={v => set('contrastBoost', v)} suffix="%" />
                </>
              )}
              {key === 'animation' && (
                <>
                  <SliderRow label="SPEED MULTIPLIER" value={state.animationSpeed} min={0} max={3} step={0.1} onChange={v => set('animationSpeed', v)} suffix="x" />
                  <div className="flex items-center gap-2">
                    <label className="text-[9px] text-marble/40 font-display tracking-wider">DISABLE ANIMATIONS</label>
                    <Switch checked={state.disableAnimations} onCheckedChange={v => set('disableAnimations', v)} className="scale-75 origin-left" />
                  </div>
                </>
              )}
              {key === 'spacing' && (
                <>
                  <SliderRow label="GAP MULTIPLIER" value={state.gap} min={0.25} max={3} step={0.25} onChange={v => set('gap', v)} suffix="x" />
                  <SliderRow label="PADDING SCALE" value={state.padding} min={0} max={16} step={1} onChange={v => set('padding', v)} />
                </>
              )}
              {key === 'presets' && (
                <>
                  <div className="flex gap-1.5">
                    <input value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="Preset name…"
                      className="flex-1 px-2 py-1 text-[10px] bg-navy-light/50 border border-gold/10 rounded text-marble/60 placeholder:text-marble/25 focus:outline-none focus:border-gold/30" />
                    <button onClick={savePreset} className="flex items-center gap-1 px-2 py-1 rounded border border-gold/20 text-[9px] text-gold/60 hover:text-gold hover:border-gold/40 transition-all">
                      <Save className="w-3 h-3" /> SAVE
                    </button>
                  </div>
                  {savedPresets.length > 0 && (
                    <div className="space-y-1 mt-1">
                      {savedPresets.map(name => (
                        <div key={name} className="flex items-center justify-between px-2 py-1 rounded border border-gold/10 bg-gold/5">
                          <button onClick={() => loadPreset(name)} className="text-[10px] text-marble/60 hover:text-gold transition-colors">{name}</button>
                          <button onClick={() => deletePreset(name)} className="text-marble/30 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="divider-ornate mt-2"><span className="text-[8px] text-gold/30 font-display tracking-[0.3em]">EXPORT</span></div>
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={copyCSS} className="flex items-center gap-1 px-2 py-1 rounded border border-gold/20 text-[9px] text-gold/60 hover:text-gold hover:border-gold/40 transition-all">
                      <Copy className="w-3 h-3" /> CSS
                    </button>
                    <button onClick={copyJSON} className="flex items-center gap-1 px-2 py-1 rounded border border-gold/20 text-[9px] text-gold/60 hover:text-gold hover:border-gold/40 transition-all">
                      <Download className="w-3 h-3" /> JSON
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  /* ─── Render ─── */
  return (
    <div className="relative">
      {/* Widget with CSS variable overrides */}
      <div style={wrapperStyle as React.CSSProperties}>
        {state.ornateCorners && (
          <>
            <span className="ornate-corner ornate-corner-tl" /><span className="ornate-corner ornate-corner-tr" />
            <span className="ornate-corner ornate-corner-bl" /><span className="ornate-corner ornate-corner-br" />
          </>
        )}
        {children}
      </div>

      {/* Desktop: Floating sticky overlay panel */}
      {!isMobile && (
        <>
          {collapsed ? (
            <button onClick={() => setCollapsed(false)}
              className="fixed right-4 top-24 z-50 w-10 h-10 rounded-full bg-navy-dark/95 border border-gold/20 flex items-center justify-center text-gold/60 hover:text-gold hover:border-gold/40 transition-all shadow-lg backdrop-blur-sm">
              <Palette className="w-4 h-4" />
            </button>
          ) : (
            <div className="fixed right-4 top-24 z-50 w-72 max-h-[calc(100vh-120px)] bg-navy-dark/95 border border-gold/15 rounded-lg overflow-hidden backdrop-blur-md shadow-2xl flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-gold/10 shrink-0">
                <span className="text-[10px] font-display tracking-[0.25em] text-gold/70">PALETTE</span>
                <div className="flex gap-1.5">
                  <button onClick={randomize} className="flex items-center gap-1 px-2 py-1 rounded border border-gold/20 text-[9px] font-display tracking-[0.15em] text-gold/60 hover:text-gold hover:border-gold/40 transition-all">
                    <Dices className="w-3 h-3" /> SHUFFLE
                  </button>
                  <button onClick={reset} className="flex items-center gap-1 px-2 py-1 rounded border border-marble/10 text-[9px] font-display tracking-[0.15em] text-marble/40 hover:text-marble/70 transition-all">
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <button onClick={() => setCollapsed(true)} className="text-marble/30 hover:text-marble/60 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {/* Scrollable controls */}
              <div className="overflow-y-auto flex-1 p-3 scrollbar-thin scrollbar-thumb-gold/20">
                {controlPanel}
              </div>
              {/* Live preview swatch */}
              <div className="p-2 border-t border-gold/10 shrink-0 flex gap-2 items-center">
                <div className="w-5 h-5 rounded-full" style={{ background: `hsl(${state.accentHue}, ${state.accentSat}%, ${state.accentLit}%)` }} />
                <div className="w-5 h-5 rounded" style={{ background: `hsl(${state.bgHue}, ${state.bgSat}%, ${state.bgLit}%)` }} />
                <div className="w-5 h-5 rounded" style={{ background: `hsl(${state.textHue}, ${state.textSat}%, ${state.textLit}%)` }} />
                <span className="text-[8px] text-marble/30 ml-auto font-mono">{state.fontFamily || 'Default'}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Mobile: Fixed bottom sheet */}
      {isMobile && (
        <>
          {/* Toggle button */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-navy-dark/95 border border-gold/30 flex items-center justify-center text-gold shadow-lg backdrop-blur-sm">
            <Palette className="w-5 h-5" />
          </button>

          {mobileOpen && (
            <div className="fixed inset-x-0 bottom-0 z-50 h-[45vh] bg-navy-dark/98 border-t border-gold/20 rounded-t-2xl backdrop-blur-md flex flex-col animate-slide-in-up">
              {/* Drag handle */}
              <div className="flex justify-center pt-2 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-gold/30" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gold/10 shrink-0">
                <span className="text-[10px] font-display tracking-[0.25em] text-gold/70">PALETTE</span>
                <div className="flex gap-1.5">
                  <button onClick={randomize} className="flex items-center gap-1 px-2 py-1 rounded border border-gold/20 text-[9px] text-gold/60 hover:text-gold transition-all">
                    <Dices className="w-3 h-3" /> SHUFFLE
                  </button>
                  <button onClick={reset} className="px-2 py-1 rounded border border-marble/10 text-[9px] text-marble/40 hover:text-marble/70 transition-all">
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <button onClick={() => setMobileOpen(false)} className="text-marble/30 hover:text-marble/60">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Controls */}
              <div className="overflow-y-auto flex-1 px-4 py-2">
                {controlPanel}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaletteEditor;
