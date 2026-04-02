import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Home, Globe as GlobeIcon, TrendingUp, Database, Map } from 'lucide-react';
import GlobeViewer from '@/components/globe/GlobeViewer';
import GlobeInfoPanel from '@/components/globe/GlobeInfoPanel';
import GlobeLegend from '@/components/globe/GlobeLegend';
import GlobeNewsTicker from '@/components/globe/GlobeNewsTicker';
import GlobeTradingPanel from '@/components/globe/GlobeTradingPanel';
import GlobeDataFeed from '@/components/globe/GlobeDataFeed';
import type { GlobeMarker } from '@/data/globeLocations';
import goldArrowLogo from '@/assets/gold-arrow-logo.png';

const Globe = () => {
  const [selected, setSelected] = useState<GlobeMarker | null>(null);
  const [visible, setVisible] = useState<Set<string>>(new Set(['chokepoint', 'producer', 'exchange', 'venezuela', 'organization']));
  const [showTrading, setShowTrading] = useState(false);
  const [showDataFeed, setShowDataFeed] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const toggleCategory = useCallback((key: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const handleMarkerClick = useCallback((marker: GlobeMarker) => {
    setSelected(marker);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-navy">
      {/* Cesium globe */}
      <GlobeViewer onMarkerClick={handleMarkerClick} visibleCategories={visible} showHeatmap={showHeatmap} />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-navy/90 to-transparent z-30 flex items-center px-4 gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={goldArrowLogo} alt="Gold Arrow" className="w-8 h-7 object-contain" />
          <span className="font-display text-sm tracking-[0.15em] text-gold group-hover:text-gold-light transition-colors hidden sm:inline">
            GOLD ARROW GLOBE
          </span>
        </Link>

        {/* Tool toggles */}
        <div className="flex items-center gap-2 ml-4">
          <ToolButton icon={<TrendingUp className="w-3.5 h-3.5" />} label="Trade" active={showTrading} onClick={() => { setShowTrading(!showTrading); if (!showTrading) setShowDataFeed(false); }} />
          <ToolButton icon={<Database className="w-3.5 h-3.5" />} label="Data" active={showDataFeed} onClick={() => { setShowDataFeed(!showDataFeed); if (!showDataFeed) setShowTrading(false); }} />
          <ToolButton icon={<Map className="w-3.5 h-3.5" />} label="Heatmap" active={showHeatmap} onClick={() => setShowHeatmap(!showHeatmap)} />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-gold/60 hover:text-gold text-xs font-display tracking-wider transition-colors">
            <Home className="w-3.5 h-3.5" /> Home
          </Link>
          <Link to="/intelligence" className="flex items-center gap-1.5 text-gold/60 hover:text-gold text-xs font-display tracking-wider transition-colors">
            <GlobeIcon className="w-3.5 h-3.5" /> Intelligence
          </Link>
        </div>
      </div>

      {/* Trading panel */}
      {showTrading && <GlobeTradingPanel marker={selected} onClose={() => setShowTrading(false)} />}

      {/* Data feed */}
      {showDataFeed && <GlobeDataFeed onClose={() => setShowDataFeed(false)} />}

      {/* Legend */}
      <GlobeLegend visible={visible} onToggle={toggleCategory} showHeatmap={showHeatmap} onToggleHeatmap={() => setShowHeatmap(!showHeatmap)} />

      {/* Info panel */}
      <GlobeInfoPanel marker={selected} onClose={() => setSelected(null)} />

      {/* News ticker */}
      <GlobeNewsTicker />
    </div>
  );
};

const ToolButton = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-display tracking-wider transition-all ${
      active
        ? 'bg-gold/15 border border-gold/30 text-gold'
        : 'bg-navy/50 border border-gold/10 text-marble/40 hover:text-marble/60'
    }`}
  >
    {icon} {label}
  </button>
);

export default Globe;
