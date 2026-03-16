import { useState, useEffect, useCallback, useRef } from 'react';
import DeckToolbar from '@/components/deck/DeckToolbar';
import DeckSidebar from '@/components/deck/DeckSidebar';

import TitleSlide from '@/components/deck/slides/TitleSlide';
import ProblemSlide from '@/components/deck/slides/ProblemSlide';
import SolutionSlide from '@/components/deck/slides/SolutionSlide';
import MarketSlide from '@/components/deck/slides/MarketSlide';
import ProductSlide from '@/components/deck/slides/ProductSlide';
import HowItWorksSlide from '@/components/deck/slides/HowItWorksSlide';
import BusinessModelSlide from '@/components/deck/slides/BusinessModelSlide';
import TractionSlide from '@/components/deck/slides/TractionSlide';
import TechnologySlide from '@/components/deck/slides/TechnologySlide';
import TeamSlide from '@/components/deck/slides/TeamSlide';
import RoadmapSlide from '@/components/deck/slides/RoadmapSlide';
import AskSlide from '@/components/deck/slides/AskSlide';

const slideComponents = [
  <TitleSlide />,
  <ProblemSlide />,
  <SolutionSlide />,
  <MarketSlide />,
  <ProductSlide />,
  <HowItWorksSlide />,
  <BusinessModelSlide />,
  <TractionSlide />,
  <TechnologySlide />,
  <TeamSlide />,
  <RoadmapSlide />,
  <AskSlide />,
];

const Deck = () => {
  const [current, setCurrent] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent(c => Math.min(slideComponents.length - 1, c + 1)), []);

  // Scale calculation
  useEffect(() => {
    const calc = () => {
      if (!canvasRef.current) return;
      const { clientWidth: w, clientHeight: h } = canvasRef.current;
      setScale(Math.min(w / 1920, h / 1080));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [isFullscreen, showGrid]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Escape' && isFullscreen) document.exitFullscreen?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, isFullscreen]);

  // Fullscreen
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const enterFullscreen = () => document.documentElement.requestFullscreen?.();

  if (showGrid) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DeckToolbar current={current} total={slideComponents.length} onPrev={prev} onNext={next} onPresent={enterFullscreen} showGrid={showGrid} onToggleGrid={() => setShowGrid(false)} />
        <div className="flex-1 overflow-auto p-8 grid grid-cols-3 xl:grid-cols-4 gap-6">
          {slideComponents.map((slide, i) => (
            <button key={i} onClick={() => { setCurrent(i); setShowGrid(false); }} className={`rounded-lg overflow-hidden border-2 transition-all ${i === current ? 'border-primary shadow-[0_0_16px_hsl(43,72%,50%,0.3)]' : 'border-border/30 hover:border-primary/40'}`}>
              <div className="aspect-video overflow-hidden pointer-events-none">
                <div style={{ transform: 'scale(0.2)', transformOrigin: 'top left', width: 1920, height: 1080 }}>{slide}</div>
              </div>
              <div className="py-1.5 text-center text-xs text-muted-foreground">{i + 1}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center" ref={canvasRef}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center', width: 1920, height: 1080 }}>
          {slideComponents[current]}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <DeckToolbar current={current} total={slideComponents.length} onPrev={prev} onNext={next} onPresent={enterFullscreen} showGrid={showGrid} onToggleGrid={() => setShowGrid(true)} />
      <div className="flex flex-1 overflow-hidden">
        <DeckSidebar slides={slideComponents} currentIndex={current} onSelect={setCurrent} />
        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-secondary/20" ref={canvasRef}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center', width: 1920, height: 1080 }}>
            {slideComponents[current]}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deck;
