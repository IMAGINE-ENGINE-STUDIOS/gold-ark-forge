import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Home, Globe as GlobeIcon } from 'lucide-react';
import GlobeViewer from '@/components/globe/GlobeViewer';
import GlobeInfoPanel from '@/components/globe/GlobeInfoPanel';
import GlobeLegend from '@/components/globe/GlobeLegend';
import GlobeNewsTicker from '@/components/globe/GlobeNewsTicker';
import type { GlobeMarker } from '@/data/globeLocations';
import goldArrowLogo from '@/assets/gold-arrow-logo.png';

const Globe = () => {
  const [selected, setSelected] = useState<GlobeMarker | null>(null);
  const [visible, setVisible] = useState<Set<string>>(new Set(['chokepoint', 'producer', 'exchange', 'venezuela']));

  const toggleCategory = useCallback((key: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleMarkerClick = useCallback((marker: GlobeMarker) => {
    setSelected(marker);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-navy">
      {/* Cesium globe */}
      <GlobeViewer onMarkerClick={handleMarkerClick} visibleCategories={visible} />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-navy/90 to-transparent z-30 flex items-center px-4 gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={goldArrowLogo} alt="Gold Arrow" className="w-8 h-7 object-contain" />
          <span className="font-display text-sm tracking-[0.15em] text-gold group-hover:text-gold-light transition-colors hidden sm:inline">
            GOLD ARROW GLOBE
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-gold/60 hover:text-gold text-xs font-display tracking-wider transition-colors">
            <Home className="w-3.5 h-3.5" /> Home
          </Link>
          <Link to="/intelligence" className="flex items-center gap-1.5 text-gold/60 hover:text-gold text-xs font-display tracking-wider transition-colors">
            <GlobeIcon className="w-3.5 h-3.5" /> Intelligence
          </Link>
        </div>
      </div>

      {/* Legend */}
      <GlobeLegend visible={visible} onToggle={toggleCategory} />

      {/* Info panel */}
      <GlobeInfoPanel marker={selected} onClose={() => setSelected(null)} />

      {/* News ticker */}
      <GlobeNewsTicker />
    </div>
  );
};

export default Globe;
