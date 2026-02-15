import { useState, useCallback } from 'react';
import { Minus, TrendingUp, Hash, Ruler, Trash2, X } from 'lucide-react';

export type DrawingType = 'hline' | 'trendline' | 'fib' | 'measure';

export interface Drawing {
  id: string;
  type: DrawingType;
  y1: number;
  y2?: number;
  x1?: number;
  x2?: number;
  color: string;
  label?: string;
}

interface ChartDrawingToolsProps {
  activeTool: DrawingType | null;
  onSelectTool: (tool: DrawingType | null) => void;
  drawings: Drawing[];
  onClearAll: () => void;
  onDeleteDrawing?: (id: string) => void;
  drawingCount: number;
  showList?: boolean;
  onToggleList?: () => void;
}

const TOOLS: { key: DrawingType; label: string; desc: string; icon: typeof Minus }[] = [
  { key: 'hline', label: 'H-Line', desc: 'Click chart to place horizontal level', icon: Minus },
  { key: 'trendline', label: 'Trend', desc: 'Click 2 points for trend line', icon: TrendingUp },
  { key: 'fib', label: 'Fib', desc: 'Click 2 points for Fibonacci retracement', icon: Hash },
  { key: 'measure', label: 'Measure', desc: 'Click 2 points to measure price & %', icon: Ruler },
];

const ChartDrawingTools = ({ activeTool, onSelectTool, drawings, onClearAll, onDeleteDrawing, drawingCount, showList, onToggleList }: ChartDrawingToolsProps) => {
  return (
    <div className="flex items-center gap-0.5 relative">
      {TOOLS.map(tool => (
        <button
          key={tool.key}
          onClick={() => onSelectTool(activeTool === tool.key ? null : tool.key)}
          className={`flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono rounded transition-all border ${
            activeTool === tool.key
              ? 'bg-gold/15 text-gold border-gold/30'
              : 'text-marble/25 border-transparent hover:text-marble/50'
          }`}
          title={`${tool.label}: ${tool.desc}`}
        >
          <tool.icon className="w-3 h-3" />
        </button>
      ))}
      {drawingCount > 0 && (
        <>
          <button
            onClick={onToggleList}
            className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono text-gold/40 hover:text-gold transition-colors border border-transparent"
            title="Toggle drawing list"
          >
            <span>{drawingCount}</span>
          </button>
          <button
            onClick={onClearAll}
            className="flex items-center px-1 py-0.5 text-[8px] font-mono text-red-400/50 hover:text-red-400 transition-colors"
            title="Clear all drawings"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </>
      )}

      {/* Drawing list dropdown */}
      {showList && drawingCount > 0 && (
        <div className="absolute top-full right-0 mt-1 z-50 bg-navy-dark border border-gold/20 rounded-lg shadow-xl min-w-[200px] max-h-[200px] overflow-y-auto">
          <div className="px-3 py-1.5 text-[9px] font-display tracking-wider text-marble/30 border-b border-gold/10 sticky top-0 bg-navy-dark">
            DRAWINGS ({drawingCount})
          </div>
          {drawings.map(d => (
            <div key={d.id} className="flex items-center justify-between px-3 py-1.5 hover:bg-gold/5 border-b border-gold/5 last:border-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[9px] font-mono text-marble/60 truncate max-w-[130px]">
                  {d.label || `${d.type} @ $${d.y1.toFixed(2)}`}
                </span>
              </div>
              {onDeleteDrawing && (
                <button
                  onClick={() => onDeleteDrawing(d.id)}
                  className="text-marble/20 hover:text-red-400 transition-colors ml-2"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Hook to manage drawings state
export const useDrawings = () => {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [activeTool, setActiveTool] = useState<DrawingType | null>(null);
  const [showList, setShowList] = useState(false);

  const addDrawing = useCallback((drawing: Omit<Drawing, 'id'>) => {
    setDrawings(prev => [...prev, { ...drawing, id: crypto.randomUUID() }]);
  }, []);

  const deleteDrawing = useCallback((id: string) => {
    setDrawings(prev => prev.filter(d => d.id !== id));
  }, []);

  const clearAll = useCallback(() => { setDrawings([]); setShowList(false); }, []);

  const toggleList = useCallback(() => setShowList(prev => !prev), []);

  return { drawings, activeTool, setActiveTool, addDrawing, deleteDrawing, clearAll, showList, toggleList };
};

// Get reference lines for Recharts from drawings
export const getDrawingReferenceLines = (drawings: Drawing[]) => {
  return drawings
    .filter(d => d.type === 'hline')
    .map(d => ({
      y: d.y1,
      stroke: d.color,
      strokeDasharray: '6 3',
      strokeWidth: 1,
      label: d.label ? { value: d.label, position: 'right' as const, fill: d.color, fontSize: 8 } : undefined,
    }));
};

export default ChartDrawingTools;
