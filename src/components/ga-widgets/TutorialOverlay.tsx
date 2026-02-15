import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, X } from 'lucide-react';

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

  if (stepCount === 0) return <>{children}</>;

  const spot = hotspots[activeStep];
  const sw = spot.spotlightW ?? 22;
  const sh = spot.spotlightH ?? 16;
  const side = getTooltipSide(spot);

  // Spotlight rect (in %)
  const sleft = spot.x - sw / 2;
  const stop = spot.y - sh / 2;

  // Tooltip positioning
  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    maxWidth: 280,
    zIndex: 30,
    transition: 'opacity 150ms ease, transform 300ms ease',
    opacity: tooltipVisible ? 1 : 0,
    transform: tooltipVisible ? 'scale(1)' : 'scale(0.95)',
  };

  const GAP = 2; // % gap between spotlight edge and tooltip
  if (side === 'bottom') {
    tooltipStyle.left = `${spot.x}%`;
    tooltipStyle.top = `${spot.y + sh / 2 + GAP}%`;
    tooltipStyle.transform = `translateX(-50%) ${tooltipVisible ? '' : 'translateY(8px)'}`;
  } else if (side === 'top') {
    tooltipStyle.left = `${spot.x}%`;
    tooltipStyle.bottom = `${100 - spot.y + sh / 2 + GAP}%`;
    tooltipStyle.transform = `translateX(-50%) ${tooltipVisible ? '' : 'translateY(-8px)'}`;
  } else if (side === 'right') {
    tooltipStyle.left = `${spot.x + sw / 2 + GAP}%`;
    tooltipStyle.top = `${spot.y}%`;
    tooltipStyle.transform = `translateY(-50%) ${tooltipVisible ? '' : 'translateX(8px)'}`;
  } else {
    tooltipStyle.right = `${100 - spot.x + sw / 2 + GAP}%`;
    tooltipStyle.top = `${spot.y}%`;
    tooltipStyle.transform = `translateY(-50%) ${tooltipVisible ? '' : 'translateX(-8px)'}`;
  }

  return (
    <div className="space-y-0">
      {/* Top bar: dots + controls */}
      <div className="flex items-center justify-between gap-3 mb-3 px-1">
        <div className="flex items-center gap-1.5">
          {hotspots.map((_, i) => (
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
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-display tracking-[0.15em] text-marble/40">
            {activeStep + 1}/{stepCount}
          </span>
          <button
            onClick={goBack}
            className="w-6 h-6 flex items-center justify-center rounded border border-gold/20 text-gold/40 hover:text-gold hover:border-gold/40 transition-all"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-6 h-6 flex items-center justify-center rounded border border-gold/20 text-gold/60 hover:text-gold hover:border-gold/40 transition-all"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
          <button
            onClick={advance}
            className="w-6 h-6 flex items-center justify-center rounded border border-gold/20 text-gold/40 hover:text-gold hover:border-gold/40 transition-all"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className="w-6 h-6 flex items-center justify-center rounded border border-gold/20 text-marble/30 hover:text-marble hover:border-gold/40 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Widget with spotlight overlay */}
      <div ref={containerRef} className="relative overflow-hidden rounded-lg">
        {children}

        {/* Dimming overlay with SVG cutout */}
        <div className="absolute inset-0 z-20" style={{ pointerEvents: 'none' }}>
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <mask id={`spotlight-mask-${activeStep}`}>
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={`${sleft}%`}
                  y={`${stop}%`}
                  width={`${sw}%`}
                  height={`${sh}%`}
                  rx="8"
                  fill="black"
                  style={{ transition: 'all 300ms ease' }}
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="hsla(220, 40%, 8%, 0.75)"
              mask={`url(#spotlight-mask-${activeStep})`}
            />
          </svg>

          {/* Gold glow around spotlight */}
          <div
            className="absolute rounded-lg transition-all duration-300 ease-out"
            style={{
              left: `${sleft}%`,
              top: `${stop}%`,
              width: `${sw}%`,
              height: `${sh}%`,
              boxShadow: '0 0 0 2px hsla(43, 72%, 50%, 0.35), 0 0 24px hsla(43, 72%, 50%, 0.12)',
            }}
          />

          {/* Inactive hotspot badges */}
          {hotspots.map((h, i) => {
            if (i === activeStep) return null;
            return (
              <div
                key={i}
                className="absolute w-5 h-5 rounded-full bg-gold/30 flex items-center justify-center text-[9px] font-display font-bold text-navy-dark/60 transition-all duration-300"
                style={{
                  left: `${h.x}%`,
                  top: `${h.y}%`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                }}
                onClick={() => goTo(i)}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

        {/* Interactive pass-through for spotlight region */}
        <div
          className="absolute z-10 transition-all duration-300 ease-out"
          style={{
            left: `${sleft}%`,
            top: `${stop}%`,
            width: `${sw}%`,
            height: `${sh}%`,
            pointerEvents: 'auto',
          }}
        />

        {/* Click-outside exit zone */}
        {onExit && (
          <div
            className="absolute inset-0 z-[15]"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              // Only exit if clicking the dimmed area (not spotlight, not tooltip)
              const rect = containerRef.current?.getBoundingClientRect();
              if (!rect) return;
              const px = ((e.clientX - rect.left) / rect.width) * 100;
              const py = ((e.clientY - rect.top) / rect.height) * 100;
              const inSpotlight = px >= sleft && px <= sleft + sw && py >= stop && py <= stop + sh;
              if (!inSpotlight) onExit();
            }}
          />
        )}

        {/* Floating tooltip card */}
        <div style={{ ...tooltipStyle, pointerEvents: 'auto' }} className="z-30">
          <div className="bg-navy-dark/95 border border-gold/30 backdrop-blur-sm rounded-lg shadow-2xl p-4 relative">
            {/* Auto-advance progress bar */}
            {isPlaying && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold/10 rounded-b-lg overflow-hidden">
                <div
                  className="h-full bg-gold/50 transition-all duration-75 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Tooltip arrow */}
            <div
              className="absolute w-3 h-3 bg-navy-dark/95 border-gold/30 rotate-45"
              style={{
                ...(side === 'bottom' && { top: -6, left: '50%', marginLeft: -6, borderTop: '1px solid', borderLeft: '1px solid' }),
                ...(side === 'top' && { bottom: -6, left: '50%', marginLeft: -6, borderBottom: '1px solid', borderRight: '1px solid' }),
                ...(side === 'right' && { left: -6, top: '50%', marginTop: -6, borderBottom: '1px solid', borderLeft: '1px solid' }),
                ...(side === 'left' && { right: -6, top: '50%', marginTop: -6, borderTop: '1px solid', borderRight: '1px solid' }),
              }}
            />

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold flex items-center justify-center text-[10px] font-display font-bold text-navy-dark shadow-[0_0_10px_hsla(43,72%,50%,0.4)]">
                {activeStep + 1}
              </span>
              <div className="min-w-0">
                <span className="text-xs font-display tracking-[0.1em] text-gold block">{spot.label}</span>
                <span className="text-[11px] font-body leading-relaxed text-marble/65 block mt-1">{spot.description}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
