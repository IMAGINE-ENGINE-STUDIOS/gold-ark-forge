import React from 'react';

interface DeckSidebarProps {
  slides: React.ReactNode[];
  currentIndex: number;
  onSelect: (i: number) => void;
}

const DeckSidebar = ({ slides, currentIndex, onSelect }: DeckSidebarProps) => (
  <div className="w-[200px] min-w-[200px] h-full overflow-y-auto border-r border-border/30 bg-secondary/60 py-3 px-2 flex flex-col gap-2">
    {slides.map((slide, i) => (
      <button
        key={i}
        onClick={() => onSelect(i)}
        className={`relative rounded overflow-hidden border-2 transition-all ${
          i === currentIndex ? 'border-primary shadow-[0_0_12px_hsl(43,72%,50%,0.4)]' : 'border-transparent hover:border-primary/30'
        }`}
      >
        <div className="w-full aspect-video overflow-hidden pointer-events-none">
          <div style={{ transform: 'scale(0.0911)', transformOrigin: 'top left', width: 1920, height: 1080 }}>
            {slide}
          </div>
        </div>
        <span className="absolute bottom-1 right-1.5 text-[10px] font-mono text-primary/70">{i + 1}</span>
      </button>
    ))}
  </div>
);

export default DeckSidebar;
