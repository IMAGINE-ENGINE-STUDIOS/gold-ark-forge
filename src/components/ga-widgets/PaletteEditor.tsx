import { useState, useCallback, type ReactNode } from 'react';
import { Dices, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useIsMobile } from '@/hooks/use-mobile';

interface PaletteState {
  accentColor: string;
  secondaryColor: string;
  bgMode: 'solid' | 'gradient';
  bgSolid: string;
  bgGradientFrom: string;
  bgGradientTo: string;
  bgGradientDir: string;
  bgOpacity: number;
  fontFamily: 'display' | 'body' | 'mono';
  titleSize: number;
  bodySize: number;
  textOpacity: number;
  borderRadius: number;
  borderWidth: number;
  borderOpacity: number;
  padding: number;
  ornateCorners: boolean;
  glowIntensity: number;
  shadow: 'none' | 'sm' | 'md' | 'lg';
}

const defaults: PaletteState = {
  accentColor: '#C9973F',
  secondaryColor: '#3A4A5C',
  bgMode: 'solid',
  bgSolid: '#151D2B',
  bgGradientFrom: '#151D2B',
  bgGradientTo: '#1E2A3A',
  bgGradientDir: '135deg',
  bgOpacity: 100,
  fontFamily: 'display',
  titleSize: 14,
  bodySize: 12,
  textOpacity: 70,
  borderRadius: 8,
  borderWidth: 1,
  borderOpacity: 20,
  padding: 6,
  ornateCorners: false,
  glowIntensity: 30,
  shadow: 'md',
};

const accentSwatches = [
  '#C9973F', '#D4A84B', '#E8C547', '#B8860B',
  '#8B7355', '#6B8E8D', '#7B68AE', '#C75B5B',
];

const gradientPresets = [
  { from: '#151D2B', to: '#1E2A3A', label: 'Navy' },
  { from: '#1A1A2E', to: '#16213E', label: 'Deep' },
  { from: '#0D1117', to: '#161B22', label: 'Carbon' },
  { from: '#1B2838', to: '#2A475E', label: 'Steel' },
  { from: '#2D1B4E', to: '#1A1A2E', label: 'Violet' },
  { from: '#1A2332', to: '#0F1923', label: 'Ink' },
];

const dirOptions = ['0deg', '45deg', '90deg', '135deg', '180deg', '225deg', '270deg', '315deg'];

const shadowMap = {
  none: 'none',
  sm: '0 2px 8px -2px hsla(43, 72%, 50%, 0.15)',
  md: '0 4px 16px -4px hsla(43, 72%, 50%, 0.2)',
  lg: '0 8px 32px -6px hsla(43, 72%, 50%, 0.3)',
};

const fontMap = {
  display: "'Cinzel', serif",
  body: "'Source Sans 3', sans-serif",
  mono: "'Courier New', monospace",
};

type Section = 'colors' | 'text' | 'shape' | 'background' | 'effects';

const SectionHeader = ({ label, section, open, toggle }: { label: string; section: Section; open: Section | null; toggle: (s: Section) => void }) => (
  <button
    onClick={() => toggle(section)}
    className="flex items-center justify-between w-full py-2.5 text-[10px] font-display tracking-[0.25em] text-marble/60 hover:text-gold/80 transition-colors"
  >
    {label}
    {open === section ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
  </button>
);

const ColorSwatch = ({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-6 h-6 rounded-full border-2 transition-all shrink-0 ${selected ? 'border-gold scale-110 shadow-[0_0_8px_hsla(43,72%,50%,0.4)]' : 'border-transparent hover:border-gold/30'}`}
    style={{ backgroundColor: color }}
  />
);

interface PaletteEditorProps {
  children: ReactNode;
  widgetId: string;
}

const PaletteEditor = ({ children, widgetId }: PaletteEditorProps) => {
  const [state, setState] = useState<PaletteState>({ ...defaults });
  const [openSection, setOpenSection] = useState<Section | null>('colors');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const isMobile = useIsMobile();

  const set = useCallback(<K extends keyof PaletteState>(key: K, val: PaletteState[K]) => {
    setState(prev => ({ ...prev, [key]: val }));
  }, []);

  const randomize = useCallback(() => {
    const hue = 30 + Math.random() * 25;
    const accent = `hsl(${hue}, ${60 + Math.random() * 20}%, ${45 + Math.random() * 15}%)`;
    setState({
      accentColor: accent,
      secondaryColor: `hsl(${200 + Math.random() * 30}, ${20 + Math.random() * 15}%, ${20 + Math.random() * 15}%)`,
      bgMode: Math.random() > 0.5 ? 'gradient' : 'solid',
      bgSolid: `hsl(${210 + Math.random() * 10}, ${25 + Math.random() * 15}%, ${8 + Math.random() * 10}%)`,
      bgGradientFrom: `hsl(${210 + Math.random() * 10}, ${25 + Math.random() * 15}%, ${8 + Math.random() * 8}%)`,
      bgGradientTo: `hsl(${210 + Math.random() * 10}, ${20 + Math.random() * 15}%, ${12 + Math.random() * 10}%)`,
      bgGradientDir: dirOptions[Math.floor(Math.random() * dirOptions.length)],
      bgOpacity: 80 + Math.random() * 20,
      fontFamily: (['display', 'body', 'mono'] as const)[Math.floor(Math.random() * 3)],
      titleSize: 12 + Math.floor(Math.random() * 8),
      bodySize: 10 + Math.floor(Math.random() * 5),
      textOpacity: 50 + Math.floor(Math.random() * 40),
      borderRadius: Math.floor(Math.random() * 16),
      borderWidth: Math.floor(Math.random() * 3),
      borderOpacity: 10 + Math.floor(Math.random() * 40),
      padding: 4 + Math.floor(Math.random() * 8),
      ornateCorners: Math.random() > 0.6,
      glowIntensity: Math.floor(Math.random() * 80),
      shadow: (['none', 'sm', 'md', 'lg'] as const)[Math.floor(Math.random() * 4)],
    });
  }, []);

  const reset = useCallback(() => setState({ ...defaults }), []);

  const toggle = useCallback((s: Section) => {
    setOpenSection(prev => prev === s ? null : s);
  }, []);

  // Build wrapper CSS
  const wrapperStyle: React.CSSProperties = {
    '--palette-accent': state.accentColor,
    '--palette-secondary': state.secondaryColor,
    fontFamily: fontMap[state.fontFamily],
    fontSize: `${state.bodySize}px`,
    borderRadius: `${state.borderRadius}px`,
    borderWidth: `${state.borderWidth}px`,
    borderColor: `${state.accentColor}${Math.round(state.borderOpacity * 2.55).toString(16).padStart(2, '0')}`,
    borderStyle: 'solid',
    padding: `${state.padding * 4}px`,
    boxShadow: `${shadowMap[state.shadow]}${state.glowIntensity > 0 ? `, 0 0 ${state.glowIntensity}px -10px ${state.accentColor}40` : ''}`,
    background: state.bgMode === 'solid'
      ? state.bgSolid
      : `linear-gradient(${state.bgGradientDir}, ${state.bgGradientFrom}, ${state.bgGradientTo})`,
    opacity: state.bgOpacity / 100,
    color: `rgba(240, 237, 230, ${state.textOpacity / 100})`,
    position: 'relative',
    overflow: 'hidden',
  } as React.CSSProperties;

  const controlPanel = (
    <div className={`${isMobile ? 'w-full' : 'w-64 shrink-0'} bg-navy-dark/95 border border-gold/10 rounded-lg overflow-y-auto max-h-[500px] backdrop-blur-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gold/10">
        <span className="text-[10px] font-display tracking-[0.25em] text-gold/70">PALETTE</span>
        <div className="flex gap-1.5">
          <button onClick={randomize} className="flex items-center gap-1 px-2 py-1 rounded border border-gold/20 text-[9px] font-display tracking-[0.15em] text-gold/60 hover:text-gold hover:border-gold/40 transition-all hover:shadow-[0_0_12px_hsla(43,72%,50%,0.15)]">
            <Dices className="w-3 h-3" /> SHUFFLE
          </button>
          <button onClick={reset} className="flex items-center gap-1 px-2 py-1 rounded border border-marble/10 text-[9px] font-display tracking-[0.15em] text-marble/40 hover:text-marble/70 hover:border-marble/20 transition-all">
            <RotateCcw className="w-3 h-3" /> RESET
          </button>
        </div>
      </div>

      <div className="p-3 space-y-1 divide-y divide-gold/5">
        {/* COLORS */}
        <div>
          <SectionHeader label="COLORS" section="colors" open={openSection} toggle={toggle} />
          {openSection === 'colors' && (
            <div className="pb-3 space-y-3">
              <div>
                <label className="text-[9px] text-marble/40 font-display tracking-wider">ACCENT</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {accentSwatches.map(c => (
                    <ColorSwatch key={c} color={c} selected={state.accentColor === c} onClick={() => set('accentColor', c)} />
                  ))}
                  <input
                    type="color"
                    value={state.accentColor}
                    onChange={e => set('accentColor', e.target.value)}
                    className="w-6 h-6 rounded-full border-0 cursor-pointer bg-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-marble/40 font-display tracking-wider">SECONDARY</label>
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type="color"
                    value={state.secondaryColor}
                    onChange={e => set('secondaryColor', e.target.value)}
                    className="w-6 h-6 rounded-full border-0 cursor-pointer bg-transparent"
                  />
                  <span className="text-[9px] text-marble/30 font-mono">{state.secondaryColor}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TEXT */}
        <div>
          <SectionHeader label="TYPOGRAPHY" section="text" open={openSection} toggle={toggle} />
          {openSection === 'text' && (
            <div className="pb-3 space-y-3">
              <div>
                <label className="text-[9px] text-marble/40 font-display tracking-wider">FONT FAMILY</label>
                <div className="flex gap-1.5 mt-1.5">
                  {(['display', 'body', 'mono'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => set('fontFamily', f)}
                      className={`px-2.5 py-1.5 rounded border text-[10px] transition-all ${
                        state.fontFamily === f
                          ? 'border-gold/50 text-gold bg-gold/10'
                          : 'border-gold/10 text-marble/35 hover:border-gold/25'
                      }`}
                      style={{ fontFamily: fontMap[f] }}
                    >
                      Aa
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] text-marble/40 font-display tracking-wider">TITLE SIZE — {state.titleSize}px</label>
                <Slider min={12} max={24} step={1} value={[state.titleSize]} onValueChange={([v]) => set('titleSize', v)} className="mt-1.5 [&_[data-slot=track]]:h-1 [&_[data-slot=track]]:bg-gold/10 [&_[data-slot=range]]:bg-gold/50 [&_[data-slot=thumb]]:w-3.5 [&_[data-slot=thumb]]:h-3.5 [&_[data-slot=thumb]]:border-gold/60" />
              </div>
              <div>
                <label className="text-[9px] text-marble/40 font-display tracking-wider">BODY SIZE — {state.bodySize}px</label>
                <Slider min={10} max={16} step={1} value={[state.bodySize]} onValueChange={([v]) => set('bodySize', v)} className="mt-1.5 [&_[data-slot=track]]:h-1 [&_[data-slot=track]]:bg-gold/10 [&_[data-slot=range]]:bg-gold/50 [&_[data-slot=thumb]]:w-3.5 [&_[data-slot=thumb]]:h-3.5 [&_[data-slot=thumb]]:border-gold/60" />
              </div>
              <div>
                <label className="text-[9px] text-marble/40 font-display tracking-wider">TEXT OPACITY — {state.textOpacity}%</label>
                <Slider min={30} max={100} step={5} value={[state.textOpacity]} onValueChange={([v]) => set('textOpacity', v)} className="mt-1.5 [&_[data-slot=track]]:h-1 [&_[data-slot=track]]:bg-gold/10 [&_[data-slot=range]]:bg-gold/50 [&_[data-slot=thumb]]:w-3.5 [&_[data-slot=thumb]]:h-3.5 [&_[data-slot=thumb]]:border-gold/60" />
              </div>
            </div>
          )}
        </div>

        {/* SHAPE */}
        <div>
          <SectionHeader label="SHAPE" section="shape" open={openSection} toggle={toggle} />
          {openSection === 'shape' && (
            <div className="pb-3 space-y-3">
              <div>
                <label className="text-[9px] text-marble/40 font-display tracking-wider">BORDER RADIUS — {state.borderRadius}px</label>
                <Slider min={0} max={16} step={1} value={[state.borderRadius]} onValueChange={([v]) => set('borderRadius', v)} className="mt-1.5 [&_[data-slot=track]]:h-1 [&_[data-slot=track]]:bg-gold/10 [&_[data-slot=range]]:bg-gold/50 [&_[data-slot=thumb]]:w-3.5 [&_[data-slot=thumb]]:h-3.5 [&_[data-slot=thumb]]:border-gold/60" />
              </div>
              <div>
                <label className="text-[9px] text-marble/40 font-display tracking-wider">BORDER WIDTH — {state.borderWidth}px</label>
                <Slider min={0} max={3} step={1} value={[state.borderWidth]} onValueChange={([v]) => set('borderWidth', v)} className="mt-1.5 [&_[data-slot=track]]:h-1 [&_[data-slot=track]]:bg-gold/10 [&_[data-slot=range]]:bg-gold/50 [&_[data-slot=thumb]]:w-3.5 [&_[data-slot=thumb]]:h-3.5 [&_[data-slot=thumb]]:border-gold/60" />
              </div>
              <div>
                <label className="text-[9px] text-marble/40 font-display tracking-wider">BORDER OPACITY — {state.borderOpacity}%</label>
                <Slider min={0} max={100} step={5} value={[state.borderOpacity]} onValueChange={([v]) => set('borderOpacity', v)} className="mt-1.5 [&_[data-slot=track]]:h-1 [&_[data-slot=track]]:bg-gold/10 [&_[data-slot=range]]:bg-gold/50 [&_[data-slot=thumb]]:w-3.5 [&_[data-slot=thumb]]:h-3.5 [&_[data-slot=thumb]]:border-gold/60" />
              </div>
              <div>
                <label className="text-[9px] text-marble/40 font-display tracking-wider">PADDING — {state.padding}</label>
                <Slider min={2} max={12} step={1} value={[state.padding]} onValueChange={([v]) => set('padding', v)} className="mt-1.5 [&_[data-slot=track]]:h-1 [&_[data-slot=track]]:bg-gold/10 [&_[data-slot=range]]:bg-gold/50 [&_[data-slot=thumb]]:w-3.5 [&_[data-slot=thumb]]:h-3.5 [&_[data-slot=thumb]]:border-gold/60" />
              </div>
            </div>
          )}
        </div>

        {/* BACKGROUND */}
        <div>
          <SectionHeader label="BACKGROUND" section="background" open={openSection} toggle={toggle} />
          {openSection === 'background' && (
            <div className="pb-3 space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-[9px] text-marble/40 font-display tracking-wider">GRADIENT</label>
                <Switch
                  checked={state.bgMode === 'gradient'}
                  onCheckedChange={v => set('bgMode', v ? 'gradient' : 'solid')}
                  className="scale-75 origin-left"
                />
              </div>
              {state.bgMode === 'solid' ? (
                <div className="flex items-center gap-2">
                  <input type="color" value={state.bgSolid} onChange={e => set('bgSolid', e.target.value)} className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent" />
                  <span className="text-[9px] text-marble/30 font-mono">{state.bgSolid}</span>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {gradientPresets.map(g => (
                      <button
                        key={g.label}
                        onClick={() => { set('bgGradientFrom', g.from); set('bgGradientTo', g.to); }}
                        className={`w-10 h-6 rounded border transition-all ${
                          state.bgGradientFrom === g.from && state.bgGradientTo === g.to
                            ? 'border-gold/50 ring-1 ring-gold/30'
                            : 'border-gold/10 hover:border-gold/25'
                        }`}
                        style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                        title={g.label}
                      />
                    ))}
                  </div>
                  <div>
                    <label className="text-[9px] text-marble/40 font-display tracking-wider">DIRECTION</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dirOptions.map(d => (
                        <button
                          key={d}
                          onClick={() => set('bgGradientDir', d)}
                          className={`w-6 h-6 rounded border text-[8px] font-mono transition-all flex items-center justify-center ${
                            state.bgGradientDir === d
                              ? 'border-gold/50 text-gold bg-gold/10'
                              : 'border-gold/10 text-marble/25 hover:border-gold/25'
                          }`}
                        >
                          <div className="w-3 h-0.5 bg-current" style={{ transform: `rotate(${d})` }} />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="text-[9px] text-marble/40 font-display tracking-wider">OPACITY — {Math.round(state.bgOpacity)}%</label>
                <Slider min={50} max={100} step={5} value={[state.bgOpacity]} onValueChange={([v]) => set('bgOpacity', v)} className="mt-1.5 [&_[data-slot=track]]:h-1 [&_[data-slot=track]]:bg-gold/10 [&_[data-slot=range]]:bg-gold/50 [&_[data-slot=thumb]]:w-3.5 [&_[data-slot=thumb]]:h-3.5 [&_[data-slot=thumb]]:border-gold/60" />
              </div>
            </div>
          )}
        </div>

        {/* EFFECTS */}
        <div>
          <SectionHeader label="EFFECTS" section="effects" open={openSection} toggle={toggle} />
          {openSection === 'effects' && (
            <div className="pb-3 space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-[9px] text-marble/40 font-display tracking-wider">ORNATE CORNERS</label>
                <Switch
                  checked={state.ornateCorners}
                  onCheckedChange={v => set('ornateCorners', v)}
                  className="scale-75 origin-left"
                />
              </div>
              <div>
                <label className="text-[9px] text-marble/40 font-display tracking-wider">GLOW — {state.glowIntensity}%</label>
                <Slider min={0} max={100} step={5} value={[state.glowIntensity]} onValueChange={([v]) => set('glowIntensity', v)} className="mt-1.5 [&_[data-slot=track]]:h-1 [&_[data-slot=track]]:bg-gold/10 [&_[data-slot=range]]:bg-gold/50 [&_[data-slot=thumb]]:w-3.5 [&_[data-slot=thumb]]:h-3.5 [&_[data-slot=thumb]]:border-gold/60" />
              </div>
              <div>
                <label className="text-[9px] text-marble/40 font-display tracking-wider">SHADOW</label>
                <div className="flex gap-1.5 mt-1.5">
                  {(['none', 'sm', 'md', 'lg'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => set('shadow', s)}
                      className={`px-2 py-1 rounded border text-[9px] font-display tracking-wider transition-all ${
                        state.shadow === s
                          ? 'border-gold/50 text-gold bg-gold/10'
                          : 'border-gold/10 text-marble/30 hover:border-gold/25'
                      }`}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4`}>
      {/* Live widget preview */}
      <div className="flex-1 min-w-0">
        <div style={wrapperStyle} className="transition-all duration-200">
          {state.ornateCorners && (
            <>
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 rounded-tl pointer-events-none" style={{ borderColor: `${state.accentColor}60` }} />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-tr pointer-events-none" style={{ borderColor: `${state.accentColor}60` }} />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-bl pointer-events-none" style={{ borderColor: `${state.accentColor}60` }} />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 rounded-br pointer-events-none" style={{ borderColor: `${state.accentColor}60` }} />
            </>
          )}
          {children}
        </div>
      </div>

      {/* Control panel */}
      {isMobile ? (
        <div>
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded border border-gold/15 text-[10px] font-display tracking-[0.2em] text-gold/50 hover:text-gold/80 transition-all mb-2"
          >
            {drawerOpen ? 'HIDE CONTROLS' : 'SHOW CONTROLS'}
            <ChevronDown className={`w-3 h-3 transition-transform ${drawerOpen ? 'rotate-180' : ''}`} />
          </button>
          {drawerOpen && controlPanel}
        </div>
      ) : (
        controlPanel
      )}
    </div>
  );
};

export default PaletteEditor;
