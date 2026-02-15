import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Dices, RotateCcw, ChevronDown, ChevronRight, Copy, Save, Trash2, Download, Palette, X, Search, Check, Globe, Pipette } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

/* ─── Types ─── */
interface PaletteState {
  accentHue: number; accentSat: number; accentLit: number;
  bgHue: number; bgSat: number; bgLit: number;
  textHue: number; textSat: number; textLit: number;
  bgMode: 'solid' | 'gradient'; bgGradientDir: string; bgOpacity: number;
  fontFamily: string; titleSize: number; bodySize: number;
  letterSpacing: number; lineHeight: number; textOpacity: number;
  borderRadius: number; borderWidth: number; borderOpacity: number; padding: number;
  ornateCorners: boolean; glowIntensity: number; shadow: 'none' | 'sm' | 'md' | 'lg';
  saturationBoost: number; contrastBoost: number; backdropBlur: number;
  animationSpeed: number; disableAnimations: boolean; gap: number;
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

/* ─── Color conversion utils ─── */
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const hslStr = (h: number, s: number, l: number) => `${h} ${s}% ${l}%`;
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randF = (min: number, max: number, decimals = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = hex.replace('#', '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return null;
  let r = parseInt(m[1], 16) / 255, g = parseInt(m[2], 16) / 255, b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)));
  };
  return { r: f(0), g: f(8), b: f(4) };
}

/* ─── 80 Google Fonts ─── */
interface FontEntry { name: string; category: string; }
const FONTS: FontEntry[] = [
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
  { name: 'Cinzel Decorative', category: 'Display' }, { name: 'Berkshire Swash', category: 'Display' },
  { name: 'Poiret One', category: 'Display' }, { name: 'Forum', category: 'Display' },
  { name: 'Tenor Sans', category: 'Display' }, { name: 'Marcellus', category: 'Display' },
  { name: 'Josefin Sans', category: 'Display' }, { name: 'Italiana', category: 'Display' },
  { name: 'Megrim', category: 'Display' }, { name: 'Bodoni Moda', category: 'Display' },
  { name: 'Yeseva One', category: 'Display' }, { name: 'Oranienbaum', category: 'Display' },
  { name: 'Cormorant SC', category: 'Display' }, { name: 'Abril Fatface', category: 'Display' },
  { name: 'Baskervville', category: 'Display' },
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

function loadFontBatch(fonts: FontEntry[]) {
  const toLoad = fonts.filter(f => !loadedFonts.has(f.name));
  if (toLoad.length === 0) return;
  // Batch into a single request for efficiency
  const families = toLoad.map(f => f.name.replace(/ /g, '+') + ':wght@400;600').join('&family=');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
  document.head.appendChild(link);
  toLoad.forEach(f => loadedFonts.add(f.name));
}

/* ─── Pre-Built Themes (12 total) ─── */
interface ThemePreset {
  name: string;
  accent: { h: number; s: number; l: number };
  bg: { h: number; s: number; l: number };
  text: { h: number; s: number; l: number };
  font: string;
}

const THEMES: ThemePreset[] = [
  { name: 'Hellenic Gold', accent: { h: 43, s: 72, l: 50 }, bg: { h: 213, s: 32, l: 16 }, text: { h: 40, s: 25, l: 96 }, font: 'Cinzel' },
  { name: 'Ocean Depths', accent: { h: 168, s: 64, l: 60 }, bg: { h: 222, s: 47, l: 11 }, text: { h: 215, s: 20, l: 88 }, font: 'Inter' },
  { name: 'Ruby Vault', accent: { h: 0, s: 72, l: 51 }, bg: { h: 20, s: 14, l: 10 }, text: { h: 0, s: 86, l: 97 }, font: 'Playfair Display' },
  { name: 'Forest Reserve', accent: { h: 160, s: 91, l: 31 }, bg: { h: 162, s: 88, l: 9 }, text: { h: 152, s: 68, l: 90 }, font: 'Cormorant Garamond' },
  { name: 'Midnight Chrome', accent: { h: 215, s: 14, l: 64 }, bg: { h: 229, s: 84, l: 5 }, text: { h: 215, s: 20, l: 88 }, font: 'Space Grotesk' },
  { name: 'Desert Sand', accent: { h: 38, s: 92, l: 50 }, bg: { h: 20, s: 6, l: 15 }, text: { h: 45, s: 95, l: 89 }, font: 'Lora' },
  { name: 'Arctic Frost', accent: { h: 199, s: 89, l: 60 }, bg: { h: 214, s: 50, l: 11 }, text: { h: 204, s: 100, l: 97 }, font: 'DM Sans' },
  { name: 'Royal Purple', accent: { h: 263, s: 90, l: 66 }, bg: { h: 268, s: 52, l: 13 }, text: { h: 250, s: 90, l: 95 }, font: 'Bodoni Moda' },
  { name: 'Copper Forge', accent: { h: 25, s: 75, l: 48 }, bg: { h: 15, s: 18, l: 12 }, text: { h: 30, s: 40, l: 92 }, font: 'Bitter' },
  { name: 'Obsidian', accent: { h: 0, s: 0, l: 85 }, bg: { h: 0, s: 0, l: 6 }, text: { h: 0, s: 0, l: 95 }, font: 'Outfit' },
  { name: 'Emerald Trading', accent: { h: 145, s: 65, l: 42 }, bg: { h: 160, s: 30, l: 10 }, text: { h: 140, s: 15, l: 90 }, font: 'Manrope' },
  { name: 'Champagne', accent: { h: 42, s: 55, l: 65 }, bg: { h: 35, s: 15, l: 14 }, text: { h: 40, s: 50, l: 94 }, font: 'Cormorant Garamond' },
];

/* ─── Mood profiles for coherent shuffle ─── */
type Mood = 'warm' | 'cool' | 'dark' | 'light' | 'vivid' | 'muted';
const MOODS: Mood[] = ['warm', 'cool', 'dark', 'light', 'vivid', 'muted'];

function getMoodColors(mood: Mood) {
  switch (mood) {
    case 'warm': return { accentHue: rand(20, 55), accentSat: rand(60, 85), accentLit: rand(45, 60), bgHue: rand(15, 35), bgSat: rand(10, 25), bgLit: rand(8, 16), textHue: rand(30, 50), textSat: rand(15, 35), textLit: rand(88, 97) };
    case 'cool': return { accentHue: rand(170, 230), accentSat: rand(50, 80), accentLit: rand(50, 65), bgHue: rand(200, 230), bgSat: rand(30, 55), bgLit: rand(8, 14), textHue: rand(200, 220), textSat: rand(10, 30), textLit: rand(85, 96) };
    case 'dark': return { accentHue: rand(0, 360), accentSat: rand(15, 40), accentLit: rand(55, 72), bgHue: rand(0, 360), bgSat: rand(5, 15), bgLit: rand(4, 10), textHue: rand(0, 40), textSat: rand(5, 15), textLit: rand(80, 92) };
    case 'light': return { accentHue: rand(0, 360), accentSat: rand(50, 75), accentLit: rand(40, 55), bgHue: rand(200, 230), bgSat: rand(20, 40), bgLit: rand(14, 22), textHue: rand(30, 50), textSat: rand(20, 40), textLit: rand(92, 98) };
    case 'vivid': return { accentHue: rand(0, 360), accentSat: rand(80, 100), accentLit: rand(50, 65), bgHue: rand(0, 360), bgSat: rand(40, 70), bgLit: rand(6, 14), textHue: rand(0, 360), textSat: rand(50, 80), textLit: rand(90, 98) };
    case 'muted': return { accentHue: rand(0, 360), accentSat: rand(20, 45), accentLit: rand(50, 65), bgHue: rand(200, 230), bgSat: rand(8, 20), bgLit: rand(12, 20), textHue: rand(30, 50), textSat: rand(10, 25), textLit: rand(85, 94) };
  }
}

/* ─── Accent presets ─── */
const accentPresets = [
  { h: 43, s: 72, l: 50 }, { h: 48, s: 80, l: 55 }, { h: 35, s: 65, l: 42 }, { h: 30, s: 60, l: 35 },
  { h: 0, s: 65, l: 50 }, { h: 200, s: 50, l: 50 }, { h: 270, s: 45, l: 55 }, { h: 140, s: 40, l: 45 },
  { h: 15, s: 70, l: 50 }, { h: 180, s: 55, l: 40 }, { h: 320, s: 50, l: 50 }, { h: 60, s: 60, l: 48 },
];

const dirOptions = ['0deg', '45deg', '90deg', '135deg', '180deg', '225deg', '270deg', '315deg'];

/* ─── Background Theme Presets ─── */
interface BgPreset {
  name: string;
  bgMode: 'solid' | 'gradient';
  bgGradientDir: string;
  bgOpacity: number;
  backdropBlur: number;
  bgHue: number; bgSat: number; bgLit: number;
}

const BG_PRESETS: BgPreset[] = [
  { name: 'Deep Space', bgMode: 'solid', bgGradientDir: '180deg', bgOpacity: 100, backdropBlur: 0, bgHue: 230, bgSat: 25, bgLit: 6 },
  { name: 'Midnight Navy', bgMode: 'solid', bgGradientDir: '180deg', bgOpacity: 95, backdropBlur: 2, bgHue: 213, bgSat: 32, bgLit: 16 },
  { name: 'Charcoal Mist', bgMode: 'solid', bgGradientDir: '180deg', bgOpacity: 88, backdropBlur: 6, bgHue: 220, bgSat: 8, bgLit: 12 },
  { name: 'Obsidian Glass', bgMode: 'solid', bgGradientDir: '180deg', bgOpacity: 78, backdropBlur: 12, bgHue: 0, bgSat: 0, bgLit: 5 },
  { name: 'Aurora Gradient', bgMode: 'gradient', bgGradientDir: '135deg', bgOpacity: 92, backdropBlur: 4, bgHue: 180, bgSat: 40, bgLit: 10 },
  { name: 'Sunset Drift', bgMode: 'gradient', bgGradientDir: '225deg', bgOpacity: 90, backdropBlur: 3, bgHue: 15, bgSat: 35, bgLit: 12 },
  { name: 'Emerald Depth', bgMode: 'gradient', bgGradientDir: '180deg', bgOpacity: 95, backdropBlur: 2, bgHue: 155, bgSat: 30, bgLit: 9 },
  { name: 'Frosted Panel', bgMode: 'solid', bgGradientDir: '180deg', bgOpacity: 65, backdropBlur: 16, bgHue: 215, bgSat: 20, bgLit: 18 },
  { name: 'Royal Velvet', bgMode: 'gradient', bgGradientDir: '315deg', bgOpacity: 98, backdropBlur: 0, bgHue: 268, bgSat: 35, bgLit: 10 },
  { name: 'Warm Smoke', bgMode: 'solid', bgGradientDir: '180deg', bgOpacity: 85, backdropBlur: 8, bgHue: 30, bgSat: 12, bgLit: 11 },
  { name: 'Ice Crystal', bgMode: 'gradient', bgGradientDir: '45deg', bgOpacity: 75, backdropBlur: 14, bgHue: 200, bgSat: 45, bgLit: 14 },
  { name: 'Dark Amber', bgMode: 'gradient', bgGradientDir: '180deg', bgOpacity: 96, backdropBlur: 1, bgHue: 35, bgSat: 28, bgLit: 8 },
];

type Section = 'colors' | 'background' | 'typography' | 'shape' | 'effects' | 'animation' | 'spacing' | 'presets';
const SECTIONS: { key: Section; label: string }[] = [
  { key: 'colors', label: 'COLORS' }, { key: 'background', label: 'BACKGROUND' },
  { key: 'typography', label: 'TYPOGRAPHY' }, { key: 'shape', label: 'SHAPE' },
  { key: 'effects', label: 'EFFECTS' }, { key: 'animation', label: 'ANIMATION' },
  { key: 'spacing', label: 'SPACING' }, { key: 'presets', label: 'PRESETS' },
];

/* ─── Sub-components ─── */
const SectionHeader = ({ label, open, onClick }: { label: string; open: boolean; onClick: () => void }) => (
  <button onClick={onClick} className="flex items-center justify-between w-full py-2 text-[10px] font-display tracking-[0.25em] text-marble/60 hover:text-gold/80 transition-colors bg-white/[0.02] -mx-1 px-1 rounded">
    {label}
    {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
  </button>
);

const SliderRow = ({ label, value, min, max, step, onChange, suffix = '' }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; suffix?: string }) => (
  <div>
    <label className="text-[9px] text-marble/40 font-display tracking-wider">{label} — {step < 1 ? value.toFixed(2) : value}{suffix}</label>
    <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)}
      className="mt-1 [&_[data-slot=track]]:h-1 [&_[data-slot=track]]:bg-gold/10 [&_[data-slot=range]]:bg-gold/50 [&_[data-slot=thumb]]:w-3 [&_[data-slot=thumb]]:h-3 [&_[data-slot=thumb]]:border-gold/60" />
  </div>
);

/* ─── Gradient Color Picker ─── */
const GradientColorPicker = ({ hue, sat, lit, onHueChange, onSatChange, onLitChange, label }: {
  hue: number; sat: number; lit: number;
  onHueChange: (v: number) => void; onSatChange: (v: number) => void; onLitChange: (v: number) => void;
  label: string;
}) => {
  const [hexInput, setHexInput] = useState('');
  const satLitRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const [draggingSL, setDraggingSL] = useState(false);
  const [draggingHue, setDraggingHue] = useState(false);

  const currentHex = hslToHex(hue, sat, lit);
  const rgb = hslToRgb(hue, sat, lit);

  useEffect(() => {
    if (!document.activeElement?.closest('[data-hex-input]')) {
      setHexInput(currentHex);
    }
  }, [currentHex]);

  const handleHexChange = (val: string) => {
    setHexInput(val);
    if (/^#[a-f\d]{6}$/i.test(val)) {
      const hsl = hexToHsl(val);
      if (hsl) { onHueChange(hsl.h); onSatChange(hsl.s); onLitChange(hsl.l); }
    }
  };

  const handleSLInteraction = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!satLitRef.current) return;
    const rect = satLitRef.current.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
    onSatChange(Math.round(x * 100));
    onLitChange(Math.round((1 - y) * 100));
  }, [onSatChange, onLitChange]);

  const handleHueInteraction = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    onHueChange(Math.round(x * 360));
  }, [onHueChange]);

  useEffect(() => {
    if (!draggingSL && !draggingHue) return;
    const handler = (e: MouseEvent) => {
      if (draggingSL) handleSLInteraction(e);
      if (draggingHue) handleHueInteraction(e);
    };
    const up = () => { setDraggingSL(false); setDraggingHue(false); };
    window.addEventListener('mousemove', handler);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', handler); window.removeEventListener('mouseup', up); };
  }, [draggingSL, draggingHue, handleSLInteraction, handleHueInteraction]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <div className="space-y-2">
      <label className="text-[9px] text-marble/40 font-display tracking-wider">{label}</label>
      <div
        ref={satLitRef}
        className="relative w-full h-28 rounded cursor-crosshair border border-gold/10 select-none"
        style={{
          background: `
            linear-gradient(to top, #000, transparent),
            linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))
          `
        }}
        onMouseDown={(e) => { setDraggingSL(true); handleSLInteraction(e); }}
      >
        <div
          className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${sat}%`, top: `${100 - lit}%`, backgroundColor: `hsl(${hue}, ${sat}%, ${lit}%)` }}
        />
      </div>
      <div
        ref={hueRef}
        className="relative w-full h-4 rounded cursor-pointer border border-gold/10 select-none"
        style={{ background: 'linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))' }}
        onMouseDown={(e) => { setDraggingHue(true); handleHueInteraction(e); }}
      >
        <div
          className="absolute top-0 w-1.5 h-full rounded-sm border border-white shadow-sm pointer-events-none -translate-x-1/2"
          style={{ left: `${(hue / 360) * 100}%`, backgroundColor: `hsl(${hue}, 100%, 50%)` }}
        />
      </div>
      <div className="flex items-center gap-2" data-hex-input>
        <div className="w-6 h-6 rounded border border-gold/20 shrink-0" style={{ backgroundColor: currentHex }} />
        <input
          value={hexInput}
          onChange={e => handleHexChange(e.target.value)}
          placeholder="#C9973F"
          className="flex-1 px-2 py-1 text-[10px] bg-navy-light/50 border border-gold/10 rounded text-marble/60 placeholder:text-marble/25 focus:outline-none focus:border-gold/30 font-mono"
        />
      </div>
      <div className="space-y-0.5">
        <button onClick={() => copyToClipboard(currentHex, 'HEX')} className="flex items-center gap-2 w-full text-left px-1.5 py-0.5 rounded hover:bg-gold/5 transition-colors group">
          <span className="text-[8px] font-display tracking-wider text-marble/30 w-7">HEX</span>
          <span className="text-[9px] font-mono text-marble/50">{currentHex}</span>
          <Copy className="w-2.5 h-2.5 text-marble/20 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button onClick={() => copyToClipboard(`hsl(${hue}, ${sat}%, ${lit}%)`, 'HSL')} className="flex items-center gap-2 w-full text-left px-1.5 py-0.5 rounded hover:bg-gold/5 transition-colors group">
          <span className="text-[8px] font-display tracking-wider text-marble/30 w-7">HSL</span>
          <span className="text-[9px] font-mono text-marble/50">{hue}, {sat}%, {lit}%</span>
          <Copy className="w-2.5 h-2.5 text-marble/20 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'RGB')} className="flex items-center gap-2 w-full text-left px-1.5 py-0.5 rounded hover:bg-gold/5 transition-colors group">
          <span className="text-[8px] font-display tracking-wider text-marble/30 w-7">RGB</span>
          <span className="text-[9px] font-mono text-marble/50">{rgb.r}, {rgb.g}, {rgb.b}</span>
          <Copy className="w-2.5 h-2.5 text-marble/20 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </div>
  );
};

/* ─── Theme Preview Card ─── */
const ThemeCard = ({ theme, onClick, onApplyGlobal, isActive }: { theme: ThemePreset; onClick: () => void; onApplyGlobal: () => void; isActive: boolean }) => (
  <div className={`flex flex-col gap-1.5 p-2 rounded-lg border transition-all ${
    isActive ? 'border-gold/50 bg-gold/10 ring-1 ring-gold/30' : 'border-gold/10 hover:border-gold/25 bg-white/[0.03]'
  }`}>
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 hover:scale-105 transition-transform">
      <div className="flex gap-0.5 w-full h-6 rounded overflow-hidden">
        <div className="flex-1" style={{ backgroundColor: `hsl(${theme.bg.h}, ${theme.bg.s}%, ${theme.bg.l}%)` }} />
        <div className="flex-1" style={{ backgroundColor: `hsl(${theme.accent.h}, ${theme.accent.s}%, ${theme.accent.l}%)` }} />
        <div className="flex-1" style={{ backgroundColor: `hsl(${theme.text.h}, ${theme.text.s}%, ${theme.text.l}%)` }} />
      </div>
      <span className="text-[8px] font-display tracking-wider text-marble/50 leading-none text-center">{theme.name}</span>
    </button>
    <button onClick={onApplyGlobal}
      className="text-[7px] font-display tracking-[0.15em] text-gold/40 hover:text-gold hover:bg-gold/10 rounded px-1 py-0.5 border border-gold/10 hover:border-gold/30 transition-all">
      APPLY GLOBALLY
    </button>
  </div>
);

/* ─── CSS variables builder ─── */
function buildCSSVars(state: PaletteState): Record<string, string> {
  return {
    '--gold': hslStr(state.accentHue, state.accentSat, state.accentLit),
    '--gold-light': hslStr(state.accentHue, clamp(state.accentSat + 4, 0, 100), clamp(state.accentLit + 12, 0, 100)),
    '--gold-dark': hslStr(clamp(state.accentHue - 3, 0, 360), clamp(state.accentSat - 4, 0, 100), clamp(state.accentLit - 12, 0, 100)),
    '--gold-shine': hslStr(clamp(state.accentHue + 2, 0, 360), 85, clamp(state.accentLit + 22, 0, 100)),
    '--navy': hslStr(state.bgHue, state.bgSat, state.bgLit),
    '--navy-light': hslStr(state.bgHue, clamp(state.bgSat - 4, 0, 100), clamp(state.bgLit + 8, 0, 100)),
    '--navy-dark': hslStr(state.bgHue, clamp(state.bgSat + 3, 0, 100), clamp(state.bgLit - 6, 0, 100)),
    '--marble': hslStr(state.textHue, state.textSat, state.textLit),
    '--marble-warm': hslStr(clamp(state.textHue - 2, 0, 360), clamp(state.textSat + 5, 0, 100), clamp(state.textLit - 4, 0, 100)),
  };
}

const CSS_VAR_KEYS = ['--gold', '--gold-light', '--gold-dark', '--gold-shine', '--navy', '--navy-light', '--navy-dark', '--marble', '--marble-warm'];

/* ─── Main Component ─── */
interface PaletteEditorProps { children: ReactNode; widgetId: string; }

const PaletteEditor = ({ children, widgetId }: PaletteEditorProps) => {
  const [universal, setUniversal] = useState(() => {
    try { return localStorage.getItem('palette-universal-active') === 'true'; } catch { return false; }
  });

  const [state, setState] = useState<PaletteState>(() => {
    try {
      const key = universal ? 'palette-universal' : `palette-active:${widgetId}`;
      const saved = localStorage.getItem(key);
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
  const [mobileOpen, setMobileOpen] = useState(true);
  const [fontsPreloaded, setFontsPreloaded] = useState(false);

  const set = useCallback(<K extends keyof PaletteState>(key: K, val: PaletteState[K]) => {
    setState(prev => ({ ...prev, [key]: val }));
  }, []);

  // Preload fonts when TYPOGRAPHY section opens
  useEffect(() => {
    if (openSection === 'typography' && !fontsPreloaded) {
      // Load first batch (Serif) immediately
      const serifFonts = FONTS.filter(f => f.category === 'Serif');
      loadFontBatch(serifFonts);
      // Load remaining categories after a short delay
      const timer1 = setTimeout(() => loadFontBatch(FONTS.filter(f => f.category === 'Sans')), 300);
      const timer2 = setTimeout(() => loadFontBatch(FONTS.filter(f => f.category === 'Display')), 600);
      const timer3 = setTimeout(() => loadFontBatch(FONTS.filter(f => f.category === 'Mono')), 900);
      setFontsPreloaded(true);
      return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
    }
  }, [openSection, fontsPreloaded]);

  // Persist state
  useEffect(() => {
    const storageKey = universal ? 'palette-universal' : `palette-active:${widgetId}`;
    localStorage.setItem(storageKey, JSON.stringify(state));
    localStorage.setItem('palette-universal-active', String(universal));
  }, [state, widgetId, universal]);

  // Universal mode: apply/remove CSS vars on :root
  useEffect(() => {
    if (!universal) {
      CSS_VAR_KEYS.forEach(k => document.documentElement.style.removeProperty(k));
      if (state.fontFamily) document.documentElement.style.removeProperty('font-family');
      return;
    }
    const vars = buildCSSVars(state);
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    if (state.fontFamily) {
      loadFont(state.fontFamily);
      document.documentElement.style.setProperty('font-family', `'${state.fontFamily}', sans-serif`);
    }
    return () => {
      CSS_VAR_KEYS.forEach(k => document.documentElement.style.removeProperty(k));
      document.documentElement.style.removeProperty('font-family');
    };
  }, [universal, state]);

  useEffect(() => { if (state.fontFamily) loadFont(state.fontFamily); }, [state.fontFamily]);

  const toggleUniversal = useCallback((val: boolean) => {
    if (!val) {
      CSS_VAR_KEYS.forEach(k => document.documentElement.style.removeProperty(k));
      document.documentElement.style.removeProperty('font-family');
    }
    setUniversal(val);
  }, []);

  const applyTheme = useCallback((theme: ThemePreset) => {
    loadFont(theme.font);
    setState(prev => ({
      ...prev,
      accentHue: theme.accent.h, accentSat: theme.accent.s, accentLit: theme.accent.l,
      bgHue: theme.bg.h, bgSat: theme.bg.s, bgLit: theme.bg.l,
      textHue: theme.text.h, textSat: theme.text.s, textLit: theme.text.l,
      fontFamily: theme.font,
    }));
    toast.success(`Applied "${theme.name}"`);
  }, []);

  const applyThemeGlobally = useCallback((theme: ThemePreset) => {
    loadFont(theme.font);
    const newState: PaletteState = {
      ...state,
      accentHue: theme.accent.h, accentSat: theme.accent.s, accentLit: theme.accent.l,
      bgHue: theme.bg.h, bgSat: theme.bg.s, bgLit: theme.bg.l,
      textHue: theme.text.h, textSat: theme.text.s, textLit: theme.text.l,
      fontFamily: theme.font,
    };
    setState(newState);
    setUniversal(true);
    // Apply to :root immediately
    const vars = buildCSSVars(newState);
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    document.documentElement.style.setProperty('font-family', `'${theme.font}', sans-serif`);
    localStorage.setItem('palette-universal', JSON.stringify(newState));
    localStorage.setItem('palette-universal-active', 'true');
    toast.success(`"${theme.name}" applied globally to all widgets`);
  }, [state]);

  const applyCurrentGlobally = useCallback(() => {
    setUniversal(true);
    const vars = buildCSSVars(state);
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    if (state.fontFamily) {
      document.documentElement.style.setProperty('font-family', `'${state.fontFamily}', sans-serif`);
    }
    localStorage.setItem('palette-universal', JSON.stringify(state));
    localStorage.setItem('palette-universal-active', 'true');
    toast.success('Current palette applied to all widgets');
  }, [state]);

  // Comprehensive shuffle using mood profiles
  const randomize = useCallback(() => {
    const mood = MOODS[Math.floor(Math.random() * MOODS.length)];
    const colors = getMoodColors(mood);
    const font = FONTS[Math.floor(Math.random() * FONTS.length)];
    loadFont(font.name);

    setState(prev => ({
      ...prev,
      ...colors,
      bgMode: Math.random() > 0.6 ? 'gradient' : 'solid',
      bgGradientDir: dirOptions[Math.floor(Math.random() * dirOptions.length)],
      bgOpacity: rand(75, 100),
      fontFamily: font.name,
      titleSize: rand(12, 22),
      bodySize: rand(10, 15),
      letterSpacing: randF(0.01, 0.12),
      lineHeight: randF(1.2, 1.8),
      textOpacity: rand(60, 100),
      borderRadius: rand(0, 16),
      borderWidth: rand(0, 3),
      borderOpacity: rand(10, 50),
      padding: rand(3, 10),
      ornateCorners: Math.random() > 0.5,
      glowIntensity: rand(0, 60),
      shadow: (['none', 'sm', 'md', 'lg'] as const)[Math.floor(Math.random() * 4)],
      saturationBoost: rand(80, 130),
      contrastBoost: rand(85, 120),
      backdropBlur: rand(0, 8),
      animationSpeed: randF(0.5, 2),
      disableAnimations: false,
      gap: randF(0.5, 2),
    }));
    toast.success(`Shuffled — ${mood} mood`);
  }, []);

  const reset = useCallback(() => { setState({ ...defaults }); toast.success('Palette reset'); }, []);
  const toggleSection = useCallback((s: Section) => setOpenSection(prev => prev === s ? null : s), []);

  const copyCSS = useCallback(() => {
    const vars = buildCSSVars(state);
    const css = `:root {\n${Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`;
    navigator.clipboard.writeText(css); toast.success('CSS copied');
  }, [state]);

  const copyJSON = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(state, null, 2)); toast.success('JSON copied');
  }, [state]);

  const savePreset = useCallback(() => {
    const name = presetName.trim() || `Preset ${savedPresets.length + 1}`;
    localStorage.setItem(`palette-preset:${widgetId}:${name}`, JSON.stringify(state));
    const updated = [...new Set([...savedPresets, name])];
    setSavedPresets(updated);
    localStorage.setItem(`palette-presets:${widgetId}`, JSON.stringify(updated));
    setPresetName(''); toast.success(`Saved "${name}"`);
  }, [state, presetName, savedPresets, widgetId]);

  const loadPreset = useCallback((name: string) => {
    try {
      const data = JSON.parse(localStorage.getItem(`palette-preset:${widgetId}:${name}`) || '{}');
      setState(prev => ({ ...prev, ...data })); toast.success(`Loaded "${name}"`);
    } catch {}
  }, [widgetId]);

  const deletePreset = useCallback((name: string) => {
    localStorage.removeItem(`palette-preset:${widgetId}:${name}`);
    const updated = savedPresets.filter(n => n !== name);
    setSavedPresets(updated);
    localStorage.setItem(`palette-presets:${widgetId}`, JSON.stringify(updated));
    toast.success(`Deleted "${name}"`);
  }, [savedPresets, widgetId]);

  // Build wrapper CSS overrides
  const cssVars = buildCSSVars(state);
  const wrapperStyle: React.CSSProperties & Record<string, string> = universal ? {} : { ...cssVars };
  Object.assign(wrapperStyle, {
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
  });
  if (state.fontFamily && !universal) wrapperStyle.fontFamily = `'${state.fontFamily}', sans-serif`;

  const shadowMap: Record<string, string> = {
    none: 'none',
    sm: `0 2px 8px -2px hsl(${state.accentHue} ${state.accentSat}% ${state.accentLit}% / 0.15)`,
    md: `0 4px 16px -4px hsl(${state.accentHue} ${state.accentSat}% ${state.accentLit}% / 0.2)`,
    lg: `0 8px 32px -6px hsl(${state.accentHue} ${state.accentSat}% ${state.accentLit}% / 0.3)`,
  };
  const glow = state.glowIntensity > 0 ? `, 0 0 ${state.glowIntensity}px -10px hsl(${state.accentHue} ${state.accentSat}% ${state.accentLit}% / 0.4)` : '';
  wrapperStyle.boxShadow = `${shadowMap[state.shadow]}${glow}`;
  if (state.disableAnimations) { wrapperStyle.animation = 'none'; wrapperStyle.transition = 'none'; }
  else if (state.animationSpeed !== 1) { wrapperStyle.animationDuration = `${state.animationSpeed}s`; }

  // Filtered fonts
  const filteredFonts = fontSearch ? FONTS.filter(f => f.name.toLowerCase().includes(fontSearch.toLowerCase())) : FONTS;
  const fontsByCategory = filteredFonts.reduce<Record<string, FontEntry[]>>((acc, f) => { (acc[f.category] ??= []).push(f); return acc; }, {});

  // Check if current state matches a theme
  const activeTheme = THEMES.find(t =>
    t.accent.h === state.accentHue && t.accent.s === state.accentSat && t.accent.l === state.accentLit &&
    t.bg.h === state.bgHue && t.bg.s === state.bgSat && t.bg.l === state.bgLit && t.font === state.fontFamily
  );

  /* ─── Control Panel ─── */
  const controlPanel = (
    <div className="space-y-0.5 divide-y divide-gold/5">
      {/* Universal toggle */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-gold/60" />
          <span className="text-[9px] font-display tracking-[0.2em] text-marble/50">UNIVERSAL MODE</span>
        </div>
        <Switch checked={universal} onCheckedChange={toggleUniversal} className="scale-75 origin-right" />
      </div>
      {universal && (
        <div className="py-1.5 px-2 rounded bg-gold/5 border border-gold/15 mb-1">
          <span className="text-[8px] font-display tracking-wider text-gold/60">⚡ Changes affect every widget on the page</span>
        </div>
      )}

      {/* Apply to All Widgets button */}
      <div className="py-2">
        <button onClick={applyCurrentGlobally}
          className="w-full py-2 rounded border border-gold/30 bg-gold/10 hover:bg-gold/20 text-[9px] font-display tracking-[0.2em] text-gold hover:text-gold-light transition-all flex items-center justify-center gap-2">
          <Globe className="w-3.5 h-3.5" />
          APPLY TO ALL WIDGETS
        </button>
      </div>

      {/* Pre-Built Themes */}
      <div>
        <SectionHeader label="GLOBAL PRESETS" open={openSection === 'presets'} onClick={() => toggleSection('presets')} />
        {openSection === 'presets' && (
          <div className="pb-3 space-y-2.5 animate-fade-in">
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map(theme => (
                <ThemeCard key={theme.name} theme={theme} onClick={() => applyTheme(theme)} onApplyGlobal={() => applyThemeGlobally(theme)} isActive={activeTheme?.name === theme.name} />
              ))}
            </div>
            <div className="divider-ornate"><span className="text-[8px] text-gold/30 font-display tracking-[0.3em]">SAVE / EXPORT</span></div>
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
                  <div key={name} className="flex items-center justify-between px-2 py-1 rounded border border-gold/10 bg-white/[0.03]">
                    <button onClick={() => loadPreset(name)} className="text-[10px] text-marble/60 hover:text-gold transition-colors">{name}</button>
                    <button onClick={() => deletePreset(name)} className="text-marble/30 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={copyCSS} className="flex items-center gap-1 px-2 py-1 rounded border border-gold/20 text-[9px] text-gold/60 hover:text-gold hover:border-gold/40 transition-all">
                <Copy className="w-3 h-3" /> CSS
              </button>
              <button onClick={copyJSON} className="flex items-center gap-1 px-2 py-1 rounded border border-gold/20 text-[9px] text-gold/60 hover:text-gold hover:border-gold/40 transition-all">
                <Download className="w-3 h-3" /> JSON
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Remaining sections */}
      {SECTIONS.filter(s => s.key !== 'presets').map(({ key, label }) => (
        <div key={key}>
          <SectionHeader label={label} open={openSection === key} onClick={() => toggleSection(key)} />
          {openSection === key && (
            <div className="pb-3 space-y-2.5 animate-fade-in">
              {key === 'colors' && (
                <>
                  <GradientColorPicker label="ACCENT COLOR" hue={state.accentHue} sat={state.accentSat} lit={state.accentLit}
                    onHueChange={v => set('accentHue', v)} onSatChange={v => set('accentSat', v)} onLitChange={v => set('accentLit', v)} />
                  <div>
                    <label className="text-[9px] text-marble/40 font-display tracking-wider">QUICK SWATCHES</label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {accentPresets.map((p, i) => (
                        <div key={i} className="relative group">
                          <button onClick={() => { set('accentHue', p.h); set('accentSat', p.s); set('accentLit', p.l); }}
                            className={`w-6 h-6 rounded-full border-2 transition-all shrink-0 ${state.accentHue === p.h && state.accentSat === p.s ? 'border-marble scale-110' : 'border-transparent hover:border-marble/30'}`}
                            style={{ backgroundColor: `hsl(${p.h}, ${p.s}%, ${p.l}%)` }} />
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] font-mono text-marble/50 bg-navy-dark/90 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            {hslToHex(p.h, p.s, p.l)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="divider-ornate"><span className="text-[8px] text-gold/30 font-display tracking-[0.3em]">TEXT COLOR</span></div>
                  <GradientColorPicker label="TEXT / MARBLE" hue={state.textHue} sat={state.textSat} lit={state.textLit}
                    onHueChange={v => set('textHue', v)} onSatChange={v => set('textSat', v)} onLitChange={v => set('textLit', v)} />
                </>
              )}
              {key === 'background' && (
                <>
                  <GradientColorPicker label="BACKGROUND" hue={state.bgHue} sat={state.bgSat} lit={state.bgLit}
                    onHueChange={v => set('bgHue', v)} onSatChange={v => set('bgSat', v)} onLitChange={v => set('bgLit', v)} />
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
                    <div className="mt-1.5 max-h-48 overflow-y-auto space-y-1 watchlist-scroll">
                      {Object.entries(fontsByCategory).map(([cat, fonts]) => (
                        <div key={cat}>
                          <div className="text-[8px] text-gold/40 font-display tracking-[0.3em] py-0.5 sticky top-0 bg-navy-dark/95 z-10 backdrop-blur-sm">{cat.toUpperCase()}</div>
                          {fonts.map(f => (
                            <button key={f.name} onClick={() => { loadFont(f.name); set('fontFamily', f.name); }}
                              className={`w-full text-left px-2 py-1.5 text-[11px] rounded transition-all flex items-center justify-between ${state.fontFamily === f.name ? 'bg-gold/10 text-gold border border-gold/20' : 'text-marble/50 hover:bg-gold/5 hover:text-marble/70 border border-transparent'}`}>
                              <span style={{ fontFamily: `'${f.name}', sans-serif` }} className="truncate">Aa — {f.name}</span>
                              {state.fontFamily === f.name && <Check className="w-3 h-3 text-gold shrink-0" />}
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
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative">
      <div style={wrapperStyle as React.CSSProperties}>
        {state.ornateCorners && (
          <>
            <span className="ornate-corner ornate-corner-tl" /><span className="ornate-corner ornate-corner-tr" />
            <span className="ornate-corner ornate-corner-bl" /><span className="ornate-corner ornate-corner-br" />
          </>
        )}
        {children}
      </div>

      {/* Desktop: Floating panel */}
      {!isMobile && (
        <>
          {collapsed ? (
            <button onClick={() => setCollapsed(false)}
              className="fixed right-4 top-24 z-50 w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gold/60 hover:text-gold hover:border-gold/40 transition-all shadow-lg">
              <Palette className="w-4 h-4" />
              {universal && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gold border border-navy-dark" />}
            </button>
          ) : (
            <div className="fixed right-4 top-24 z-50 w-72 max-h-[calc(100vh-120px)] glass-panel overflow-hidden shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-gold/10 shrink-0 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-display tracking-[0.25em] text-gold/70">PALETTE</span>
                  {universal && <span className="text-[7px] font-display tracking-wider px-1.5 py-0.5 rounded bg-gold/20 text-gold border border-gold/30">UNIVERSAL</span>}
                </div>
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
              <div className="overflow-y-auto flex-1 p-3 watchlist-scroll">
                {controlPanel}
              </div>
              <div className="p-2 border-t border-gold/10 shrink-0 flex gap-2 items-center bg-white/[0.02]">
                <div className="w-5 h-5 rounded-full" style={{ background: `hsl(${state.accentHue}, ${state.accentSat}%, ${state.accentLit}%)` }} />
                <div className="w-5 h-5 rounded" style={{ background: `hsl(${state.bgHue}, ${state.bgSat}%, ${state.bgLit}%)` }} />
                <div className="w-5 h-5 rounded" style={{ background: `hsl(${state.textHue}, ${state.textSat}%, ${state.textLit}%)` }} />
                <span className="text-[8px] text-marble/30 ml-auto font-mono truncate max-w-[80px]">{state.fontFamily || 'Default'}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Mobile: Fixed bottom sheet */}
      {isMobile && (
        <>
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full glass-panel border-gold/30 flex items-center justify-center text-gold shadow-lg">
            <Palette className="w-5 h-5" />
            {universal && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gold border-2 border-navy-dark" />}
          </button>
          {mobileOpen && (
            <div className="fixed inset-x-0 bottom-0 z-50 h-[50vh] glass-panel border-t border-gold/20 rounded-t-2xl flex flex-col animate-slide-in-up">
              <div className="flex justify-center pt-2 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-gold/30" />
              </div>
              <div className="flex items-center justify-between px-4 py-2 border-b border-gold/10 shrink-0 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-display tracking-[0.25em] text-gold/70">PALETTE</span>
                  {universal && <span className="text-[7px] font-display tracking-wider px-1.5 py-0.5 rounded bg-gold/20 text-gold border border-gold/30">UNI</span>}
                </div>
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
              <div className="overflow-y-auto flex-1 px-4 py-2 watchlist-scroll">
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
