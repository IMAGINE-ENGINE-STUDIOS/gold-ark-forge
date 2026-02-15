import { useState, type ReactNode } from 'react';
import { BookOpen, Monitor, Database, Clock, ChevronRight, GraduationCap, Palette } from 'lucide-react';
import { widgetDocContent, type WidgetDocEntry } from './widgetDocContent';
import TutorialOverlay from './TutorialOverlay';
import PaletteEditor from './PaletteEditor';

interface WidgetDocWrapperProps {
  children: ReactNode;
  widgetId: string;
}

const tierColors: Record<string, string> = {
  'MARKET DATA': 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  'BLOCKCHAIN': 'text-orange-400 border-orange-400/30 bg-orange-400/5',
  'DeFi': 'text-purple-400 border-purple-400/30 bg-purple-400/5',
  'COMPOSITE': 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
  'PROPRIETARY': 'text-gold border-gold/30 bg-gold/5',
  'ENERGY': 'text-amber-400 border-amber-400/30 bg-amber-400/5',
};

const ThesisPanel = ({ doc }: { doc: WidgetDocEntry }) => (
  <div className="relative rounded-lg border border-gold/10 bg-gradient-to-br from-navy-light/80 via-navy to-navy-dark overflow-hidden">
    {/* Tier badge */}
    <div className="absolute top-4 right-4">
      <span className={`text-[9px] font-display tracking-[0.25em] px-3 py-1 rounded border ${tierColors[doc.tier] || 'text-gold border-gold/30 bg-gold/5'}`}>
        {doc.tier}
      </span>
    </div>

    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="pr-24">
        <h3 className="font-display text-xl md:text-2xl tracking-[0.08em] text-marble">{doc.name}</h3>
        <p className="text-marble/50 text-sm mt-1 font-body">{doc.purpose}</p>
      </div>

      {/* Source badges */}
      <div className="flex flex-wrap gap-2">
        {doc.sources.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5 text-[10px] font-display tracking-[0.15em] text-gold/70 border border-gold/20 rounded-full px-3 py-1 bg-gold/5">
            <Database className="w-3 h-3" />
            {s}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-[10px] font-display tracking-[0.15em] text-marble/40 border border-marble/10 rounded-full px-3 py-1">
          <Clock className="w-3 h-3" />
          {doc.refreshInterval}
        </span>
      </div>

      {/* Thesis body */}
      <div className="text-marble/60 text-sm font-body leading-relaxed whitespace-pre-line">
        {doc.thesis}
      </div>

      {/* Ornate divider */}
      <div className="divider-ornate">
        <span className="font-display text-[9px] tracking-[0.3em] text-gold/40">KEY METRICS</span>
      </div>

      {/* Metrics */}
      <ul className="space-y-2">
        {doc.metrics.map((m, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-marble/55 font-body">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold/60 shrink-0" />
            {m}
          </li>
        ))}
      </ul>

      {/* Ornate divider */}
      <div className="divider-ornate">
        <span className="font-display text-[9px] tracking-[0.3em] text-gold/40">INSTRUCTIONS</span>
      </div>

      {/* Instructions */}
      <ol className="space-y-3">
        {doc.instructions.map((step, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-marble/55 font-body">
            <span className="font-display text-gold/80 text-xs mt-0.5 shrink-0 w-5 text-right">{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  </div>
);

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded border text-[10px] font-display tracking-[0.25em] transition-all ${
      active
        ? 'border-gold/60 text-gold bg-gold/10'
        : 'border-gold/15 text-marble/40 hover:text-gold/70 hover:border-gold/30'
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </button>
);

const WidgetDocWrapper = ({ children, widgetId }: WidgetDocWrapperProps) => {
  const [tab, setTab] = useState<'widget' | 'thesis' | 'tutorial' | 'palette'>('widget');
  const doc = widgetDocContent[widgetId];

  if (!doc) return <>{children}</>;

  const hasTutorial = doc.tutorial && doc.tutorial.length > 0;

  const handleTutorialExit = () => setTab('widget');

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <TabButton active={tab === 'widget'} onClick={() => setTab('widget')} icon={Monitor} label="WIDGET" />
        <TabButton active={tab === 'thesis'} onClick={() => setTab('thesis')} icon={BookOpen} label="THESIS & GUIDE" />
        {hasTutorial && (
          <TabButton active={tab === 'tutorial'} onClick={() => setTab('tutorial')} icon={GraduationCap} label="TUTORIAL" />
        )}
        <TabButton active={tab === 'palette'} onClick={() => setTab('palette')} icon={Palette} label="PALETTE" />
      </div>

      {/* Content */}
      {tab === 'widget' && children}
      {tab === 'thesis' && <ThesisPanel doc={doc} />}
      {tab === 'tutorial' && hasTutorial && (
        <TutorialOverlay hotspots={doc.tutorial!} onExit={handleTutorialExit}>{children}</TutorialOverlay>
      )}
      {tab === 'palette' && (
        <PaletteEditor widgetId={widgetId}>{children}</PaletteEditor>
      )}
    </div>
  );
};

export default WidgetDocWrapper;
