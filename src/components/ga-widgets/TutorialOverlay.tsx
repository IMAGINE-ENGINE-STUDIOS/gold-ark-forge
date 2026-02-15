import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export interface TutorialHotspot {
  label: string;
  description: string;
  x: number;
  y: number;
  spotlightW?: number;
  spotlightH?: number;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialOverlayProps {
  children: ReactNode;
  hotspots: TutorialHotspot[];
  onExit?: () => void;
}

const TutorialOverlay = ({ children, hotspots, onExit }: TutorialOverlayProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [cardVisible, setCardVisible] = useState(true);
  const touchStartRef = useRef<number | null>(null);
  const isMobile = useIsMobile();

  const stepCount = hotspots.length;
  const STEP_DURATION = 5000;
  const TICK = 50;

  const goTo = useCallback((index: number) => {
    setCardVisible(false);
    setTimeout(() => {
      setActiveStep(index);
      setProgress(0);
      setCardVisible(true);
    }, 150);
  }, []);

  const advance = useCallback(() => goTo((activeStep + 1) % stepCount), [activeStep, stepCount, goTo]);
  const goBack = useCallback(() => goTo((activeStep - 1 + stepCount) % stepCount), [activeStep, stepCount, goTo]);

  // Auto-advance timer
  useEffect(() => {
    if (!isPlaying || stepCount === 0) return;
    const id = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (TICK / STEP_DURATION) * 100;
        if (next >= 100) {
          advance();
          return 0;
        }
        return next;
      });
    }, TICK);
    return () => clearInterval(id);
  }, [isPlaying, stepCount, advance]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') advance();
      else if (e.key === 'ArrowLeft') goBack();
      else if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
      else if (e.key === 'Escape' && onExit) onExit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance, goBack, onExit]);

  // Touch swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartRef.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) advance();
      else goBack();
    }
    touchStartRef.current = null;
  }, [advance, goBack]);

  if (stepCount === 0) return <>{children}</>;

  const spot = hotspots[activeStep];

  // Compact dot navigation for mobile
  const renderDots = () => {
    if (!isMobile || stepCount <= 5) {
      return hotspots.map((_, i) => (
        <button
          key={i}
          onClick={() => goTo(i)}
          className={`rounded-full transition-all duration-300 ${
            i === activeStep
              ? 'w-2.5 h-2.5 bg-gold shadow-[0_0_6px_hsla(43,72%,50%,0.5)]'
              : i < activeStep
              ? 'w-1.5 h-1.5 bg-gold/60'
              : 'w-1.5 h-1.5 bg-gold/20'
          }`}
        />
      ));
    }
    const dots: React.ReactNode[] = [];
    const start = Math.max(0, activeStep - 1);
    const end = Math.min(stepCount - 1, activeStep + 1);
    if (start > 0) dots.push(<span key="el-s" className="text-[8px] text-gold/30">…</span>);
    for (let i = start; i <= end; i++) {
      dots.push(
        <button
          key={i}
          onClick={() => goTo(i)}
          className={`rounded-full transition-all duration-300 ${
            i === activeStep
              ? 'w-2.5 h-2.5 bg-gold shadow-[0_0_6px_hsla(43,72%,50%,0.5)]'
              : i < activeStep
              ? 'w-1.5 h-1.5 bg-gold/60'
              : 'w-1.5 h-1.5 bg-gold/20'
          }`}
        />
      );
    }
    if (end < stepCount - 1) dots.push(<span key="el-e" className="text-[8px] text-gold/30">…</span>);
    return dots;
  };

  return (
    <div className="space-y-0" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 mb-3 px-1">
        <div className="flex items-center gap-1.5">
          {renderDots()}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-display tracking-[0.15em] text-marble/40">
            {activeStep + 1}/{stepCount}
          </span>
          <button onClick={goBack} className="w-6 h-6 flex items-center justify-center rounded border border-gold/20 text-gold/40 hover:text-gold hover:border-gold/40 transition-all">
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button onClick={() => setIsPlaying(!isPlaying)} className="w-6 h-6 flex items-center justify-center rounded border border-gold/20 text-gold/60 hover:text-gold hover:border-gold/40 transition-all">
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
          <button onClick={advance} className="w-6 h-6 flex items-center justify-center rounded border border-gold/20 text-gold/40 hover:text-gold hover:border-gold/40 transition-all">
            <ChevronRight className="w-3 h-3" />
          </button>
          {onExit && (
            <button onClick={onExit} className="w-6 h-6 flex items-center justify-center rounded border border-gold/20 text-marble/30 hover:text-marble hover:border-gold/40 transition-all">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Widget with dimmed overlay + annotation card */}
      <div className="relative overflow-hidden rounded-lg">
        {/* The widget content */}
        {children}

        {/* Semi-transparent overlay (no cutout) */}
        <div className="absolute inset-0 z-20 bg-navy-dark/60 pointer-events-none" />

        {/* Click overlay to exit */}
        {onExit && (
          <div className="absolute inset-0 z-25" style={{ pointerEvents: 'auto' }} onClick={onExit} />
        )}

        {/* Annotation card at the bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 z-30"
          style={{
            pointerEvents: 'auto',
            opacity: cardVisible ? 1 : 0,
            transform: cardVisible ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 150ms ease, transform 300ms ease',
          }}
        >
          <div className="bg-navy-dark/95 border-t border-gold/30 backdrop-blur-sm p-3 sm:p-4 relative">
            {/* Progress bar */}
            {isPlaying && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gold/10 overflow-hidden">
                <div className="h-full bg-gold/50 transition-all duration-75 ease-linear" style={{ width: `${progress}%` }} />
              </div>
            )}

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gold flex items-center justify-center text-[11px] font-display font-bold text-navy-dark shadow-[0_0_10px_hsla(43,72%,50%,0.4)]">
                {activeStep + 1}
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-display tracking-[0.1em] text-gold block">{spot.label}</span>
                <span className="text-[11px] font-body leading-relaxed text-marble/65 block mt-1">{spot.description}</span>
              </div>
              {/* Step indicators */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                {hotspots.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); goTo(i); }}
                    className={`rounded-full transition-all duration-200 ${
                      i === activeStep ? 'w-2 h-2 bg-gold' : 'w-1.5 h-1.5 bg-gold/25 hover:bg-gold/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
