import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Play, Pause } from 'lucide-react';

interface TutorialHotspot {
  label: string;
  description: string;
  x: number;
  y: number;
}

interface TutorialOverlayProps {
  children: ReactNode;
  hotspots: TutorialHotspot[];
}

const TutorialOverlay = ({ children, hotspots }: TutorialOverlayProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const stepCount = hotspots.length;
  const STEP_DURATION = 4000; // 4 seconds per step
  const TICK = 50;

  const advance = useCallback(() => {
    setActiveStep((prev) => (prev + 1) % stepCount);
    setProgress(0);
  }, [stepCount]);

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

  const jumpTo = (index: number) => {
    setActiveStep(index);
    setProgress(0);
  };

  if (stepCount === 0) return <>{children}</>;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-[2px] bg-gold/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold/60 transition-all duration-75 ease-linear"
            style={{ width: `${((activeStep * 100) / stepCount) + (progress / stepCount)}%` }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-display tracking-[0.15em] text-marble/40">
            {activeStep + 1} / {stepCount}
          </span>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-6 h-6 flex items-center justify-center rounded border border-gold/20 text-gold/60 hover:text-gold hover:border-gold/40 transition-all"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Widget with hotspot overlay */}
      <div className="relative">
        {children}

        {/* Overlay layer - pointer-events-none so widget stays interactive */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {hotspots.map((spot, i) => {
            const isActive = i === activeStep;
            return (
              <div
                key={i}
                className="absolute transition-all duration-300"
                style={{
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Pulse ring */}
                <div
                  className={`absolute inset-0 rounded-full ${
                    isActive ? 'animate-[tutorial-pulse_2s_ease-out_infinite]' : ''
                  }`}
                  style={{
                    width: isActive ? 32 : 24,
                    height: isActive ? 32 : 24,
                    marginLeft: isActive ? -16 : -12,
                    marginTop: isActive ? -16 : -12,
                    boxShadow: isActive
                      ? '0 0 0 6px hsla(43, 72%, 50%, 0.4), 0 0 20px hsla(43, 72%, 50%, 0.2)'
                      : '0 0 0 3px hsla(43, 72%, 50%, 0.2)',
                  }}
                />

                {/* Badge */}
                <div
                  className={`relative flex items-center justify-center rounded-full font-display text-[10px] font-bold transition-all duration-300 ${
                    isActive
                      ? 'w-7 h-7 -ml-3.5 -mt-3.5 bg-gold text-navy-dark shadow-[0_0_12px_hsla(43,72%,50%,0.5)]'
                      : 'w-6 h-6 -ml-3 -mt-3 bg-gold/70 text-navy-dark/80'
                  }`}
                >
                  {i + 1}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend panel */}
      <div className="rounded-lg border border-gold/10 bg-gradient-to-br from-navy-light/80 via-navy to-navy-dark overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-display text-[9px] tracking-[0.3em] text-gold/40">INTERACTIVE GUIDE</span>
          </div>

          <div className="space-y-1">
            {hotspots.map((spot, i) => {
              const isActive = i === activeStep;
              return (
                <button
                  key={i}
                  onClick={() => jumpTo(i)}
                  className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded transition-all duration-200 ${
                    isActive
                      ? 'bg-gold/5 border-l-[3px] border-gold/60'
                      : 'border-l-[3px] border-transparent hover:bg-gold/[0.02] hover:border-gold/20'
                  }`}
                  style={{
                    animationDelay: `${i * 100}ms`,
                  }}
                >
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-display font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-gold text-navy-dark'
                        : 'bg-gold/15 text-gold/50'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <span
                      className={`text-xs font-display tracking-[0.1em] block transition-colors duration-200 ${
                        isActive ? 'text-gold' : 'text-marble/50'
                      }`}
                    >
                      {spot.label}
                    </span>
                    <span
                      className={`text-[11px] font-body leading-relaxed block mt-0.5 transition-colors duration-200 ${
                        isActive ? 'text-marble/60' : 'text-marble/30'
                      }`}
                    >
                      {spot.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
