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

const getTooltipSide = (spot: TutorialHotspot): 'top' | 'bottom' | 'left' | 'right' => {
  if (spot.tooltipSide) return spot.tooltipSide;
  if (spot.y < 30) return 'bottom';
  if (spot.y > 70) return 'top';
  if (spot.x < 30) return 'right';
  if (spot.x > 70) return 'left';
  return 'bottom';
};

const TutorialOverlay = ({ children, hotspots, onExit }: TutorialOverlayProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [tooltipVisible, setTooltipVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const isMobile = useIsMobile();

  const stepCount = hotspots.length;
  const STEP_DURATION = 5000;
  const TICK = 50;

  const goTo = useCallback((index: number) => {
    setTooltipVisible(false);
    setTimeout(() => {
      setActiveStep(index);
      setProgress(0);
      setTooltipVisible(true);
    }, 150);
  }, []);

  const advance = useCallback(() => goTo((activeStep + 1) % stepCount), [activeStep, stepCount, goTo]);
  const goBack = useCallback(() => goTo((activeStep - 1 + stepCount) % stepCount), [activeStep, stepCount, goTo]);

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
  // Clamp spotlight dimensions on mobile
  const sw = isMobile ? Math.min(spot.spotlightW ?? 22, 55) : (spot.spotlightW ?? 22);
  const sh = isMobile ? Math.min(spot.spotlightH ?? 16, 35) : (spot.spotlightH ?? 16);
  const side = getTooltipSide(spot);

  const sleft = spot.x - sw / 2;
  const stop = spot.y - sh / 2;

  // Tooltip positioning
  const tooltipMaxW = isMobile ? 'min(260px, calc(100vw - 32px))' : '280px';
  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    maxWidth: tooltipMaxW,
    zIndex: 30,
    transition: 'opacity 150ms ease, transform 300ms ease',
    opacity: tooltipVisible ? 1 : 0,
    transform: tooltipVisible ? 'scale(1)' : 'scale(0.95)',
  };

  const GAP = 2;
  if (side === 'bottom') {
    tooltipStyle.left = isMobile ? 'clamp(8px, calc(' + spot.x + '% - 130px), calc(100% - 268px))' : `${spot.x}%`;
    tooltipStyle.top = `${spot.y + sh / 2 + GAP}%`;
    if (!isMobile) tooltipStyle.transform = `translateX(-50%) ${tooltipVisible ? '' : 'translateY(8px)'}`;
  } else if (side === 'top') {
    tooltipStyle.left = isMobile ? 'clamp(8px, calc(' + spot.x + '% - 130px), calc(100% - 268px))' : `${spot.x}%`;
    tooltipStyle.bottom = `${100 - spot.y + sh / 2 + GAP}%`;
    if (!isMobile) tooltipStyle.transform = `translateX(-50%) ${tooltipVisible ? '' : 'translateY(-8px)'}`;
  } else if (side === 'right') {
    tooltipStyle.left = `${spot.x + sw / 2 + GAP}%`;
    tooltipStyle.top = `${spot.y}%`;
    tooltipStyle.transform = `translateY(-50%) ${tooltipVisible ? '' : 'translateX(8px)'}`;
  } else {
    tooltipStyle.right = `${100 - spot.x + sw / 2 + GAP}%`;
    tooltipStyle.top = `${spot.y}%`;
    tooltipStyle.transform = `translateY(-50%) ${tooltipVisible ? '' : 'translateX(-8px)'}`;
  }

  // Compact dot navigation for mobile: show max 5 dots around active
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
    // Show ellipsis pattern on mobile
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

      {/* Widget with spotlight */}
      <div ref={containerRef} className="relative overflow-hidden rounded-lg">
        {children}

        {/* SVG mask overlay */}
        <div className="absolute inset-0 z-20" style={{ pointerEvents: 'none' }}>
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <mask id={`spotlight-mask-${activeStep}`}>
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={`${sleft}%`} y={`${stop}%`}
                  width={`${sw}%`} height={`${sh}%`}
                  rx="8" fill="black"
                  style={{ transition: 'all 300ms ease' }}
                />
              </mask>
            </defs>
            <rect
              width="100%" height="100%"
              fill="hsla(220, 40%, 8%, 0.75)"
              mask={`url(#spotlight-mask-${activeStep})`}
            />
          </svg>

          {/* Gold glow */}
          <div
            className="absolute rounded-lg transition-all duration-300 ease-out"
            style={{
              left: `${sleft}%`, top: `${stop}%`,
              width: `${sw}%`, height: `${sh}%`,
              boxShadow: '0 0 0 2px hsla(43, 72%, 50%, 0.35), 0 0 24px hsla(43, 72%, 50%, 0.12)',
            }}
          />

          {/* Inactive badges */}
          {hotspots.map((h, i) => {
            if (i === activeStep) return null;
            return (
              <div
                key={i}
                className="absolute w-5 h-5 rounded-full bg-gold/30 flex items-center justify-center text-[9px] font-display font-bold text-navy-dark/60 transition-all duration-300"
                style={{
                  left: `${h.x}%`, top: `${h.y}%`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'auto', cursor: 'pointer',
                }}
                onClick={() => goTo(i)}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

        {/* Interactive spotlight pass-through */}
        <div
          className="absolute z-10 transition-all duration-300 ease-out"
          style={{
            left: `${sleft}%`, top: `${stop}%`,
            width: `${sw}%`, height: `${sh}%`,
            pointerEvents: 'auto',
          }}
        />

        {/* Click-outside exit */}
        {onExit && (
          <div
            className="absolute inset-0 z-[15]"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              const rect = containerRef.current?.getBoundingClientRect();
              if (!rect) return;
              const px = ((e.clientX - rect.left) / rect.width) * 100;
              const py = ((e.clientY - rect.top) / rect.height) * 100;
              const inSpotlight = px >= sleft && px <= sleft + sw && py >= stop && py <= stop + sh;
              if (!inSpotlight) onExit();
            }}
          />
        )}

        {/* Tooltip card */}
        <div style={{ ...tooltipStyle, pointerEvents: 'auto' }} className="z-30">
          <div className="bg-navy-dark/95 border border-gold/30 backdrop-blur-sm rounded-lg shadow-2xl p-3 sm:p-4 relative">
            {isPlaying && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold/10 rounded-b-lg overflow-hidden">
                <div className="h-full bg-gold/50 transition-all duration-75 ease-linear" style={{ width: `${progress}%` }} />
              </div>
            )}

            {/* Arrow */}
            <div
              className="absolute w-3 h-3 bg-navy-dark/95 border-gold/30 rotate-45"
              style={{
                ...(side === 'bottom' && { top: -6, left: '50%', marginLeft: -6, borderTop: '1px solid', borderLeft: '1px solid' }),
                ...(side === 'top' && { bottom: -6, left: '50%', marginLeft: -6, borderBottom: '1px solid', borderRight: '1px solid' }),
                ...(side === 'right' && { left: -6, top: '50%', marginTop: -6, borderBottom: '1px solid', borderLeft: '1px solid' }),
                ...(side === 'left' && { right: -6, top: '50%', marginTop: -6, borderTop: '1px solid', borderRight: '1px solid' }),
              }}
            />

            <div className="flex items-start gap-2.5 sm:gap-3">
              <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gold flex items-center justify-center text-[9px] sm:text-[10px] font-display font-bold text-navy-dark shadow-[0_0_10px_hsla(43,72%,50%,0.4)]">
                {activeStep + 1}
              </span>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-display tracking-[0.1em] text-gold block">{spot.label}</span>
                <span className="text-[10px] sm:text-[11px] font-body leading-relaxed text-marble/65 block mt-0.5 sm:mt-1">{spot.description}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
