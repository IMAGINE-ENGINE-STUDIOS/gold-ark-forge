import { Eye, EyeOff } from 'lucide-react';

const CATEGORIES = [
  { key: 'chokepoint', label: 'Chokepoints', color: '#f97316' },
  { key: 'producer', label: 'Producers', color: '#3b82f6' },
  { key: 'exchange', label: 'Exchanges', color: '#eab308' },
  { key: 'venezuela', label: 'Venezuela', color: '#a855f7' },
] as const;

interface Props {
  visible: Set<string>;
  onToggle: (key: string) => void;
}

const GlobeLegend = ({ visible, onToggle }: Props) => (
  <div className="absolute bottom-16 left-4 z-30 bg-navy/90 backdrop-blur-md border border-gold/20 rounded p-3 space-y-2">
    <p className="text-[9px] font-display tracking-[0.25em] text-gold/60">LAYERS</p>
    {CATEGORIES.map((c) => {
      const on = visible.has(c.key);
      return (
        <button
          key={c.key}
          onClick={() => onToggle(c.key)}
          className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded text-xs font-display tracking-wider transition-all ${on ? 'text-marble' : 'text-marble/30'}`}
        >
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: on ? c.color : '#4a5568' }} />
          {c.label}
          {on ? <Eye className="w-3 h-3 ml-auto text-gold/50" /> : <EyeOff className="w-3 h-3 ml-auto text-marble/20" />}
        </button>
      );
    })}
  </div>
);

export default GlobeLegend;
