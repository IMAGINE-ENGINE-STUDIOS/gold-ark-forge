import { Maximize, Grid3X3, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface DeckToolbarProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onPresent: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
}

const DeckToolbar = ({ current, total, onPrev, onNext, onPresent, showGrid, onToggleGrid }: DeckToolbarProps) => (
  <div className="h-12 flex items-center justify-between px-4 border-b border-border/30 bg-secondary/80">
    <div className="flex items-center gap-2">
      <span className="gold-shimmer text-lg tracking-widest" style={{ fontFamily: 'Cinzel, serif' }}>GOLD ARROW</span>
      <span className="text-muted-foreground text-xs ml-2">Investor Deck</span>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={onPrev} disabled={current === 0}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-xs font-mono text-secondary-foreground/70 min-w-[48px] text-center">
        {current + 1} / {total}
      </span>
      <Button variant="ghost" size="icon" onClick={onNext} disabled={current === total - 1}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <div className="w-px h-5 bg-border/30 mx-1" />
      <Button variant="ghost" size="icon" onClick={onToggleGrid} className={showGrid ? 'text-primary' : ''}>
        <Grid3X3 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onPresent} className="gap-1.5 text-primary">
        <Maximize className="h-3.5 w-3.5" /> Present
      </Button>
      <Button asChild variant="outline" size="sm" className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10">
        <Link to="/deck-editor"><Pencil className="h-3.5 w-3.5" /> Edit Deck</Link>
      </Button>
    </div>
  </div>
);

export default DeckToolbar;
