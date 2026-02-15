import { useState, useCallback } from 'react';
import { Minus, TrendingUp, Hash, Ruler, Trash2 } from 'lucide-react';

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
  drawingCount: number;
}

const TOOLS: { key: DrawingType; label: string; icon: typeof Minus }[] = [
  { key: 'hline', label: 'H-Line', icon: Minus },
  { key: 'trendline', label: 'Trend', icon: TrendingUp },
  { key: 'fib', label: 'Fib', icon: Hash },
  { key: 'measure', label: 'Measure', icon: Ruler },
];

const ChartDrawingTools = ({ activeTool, onSelectTool, drawings, onClearAll, drawingCount }: ChartDrawingToolsProps) => {
  return (
    <div className="flex items-center gap-0.5">
      {TOOLS.map(tool => (
        <button
          key={tool.key}
          onClick={() => onSelectTool(activeTool === tool.key ? null : tool.key)}
          className={`flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono rounded transition-all border ${
            activeTool === tool.key
              ? 'bg-gold/15 text-gold border-gold/30'
              : 'text-marble/25 border-transparent hover:text-marble/50'
          }`}
          title={tool.label}
        >
          <tool.icon className="w-3 h-3" />
        </button>
      ))}
      {drawingCount > 0 && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono text-red-400/50 hover:text-red-400 transition-colors"
          title="Clear all drawings"
        >
          <Trash2 className="w-3 h-3" />
          <span>{drawingCount}</span>
        </button>
      )}
    </div>
  );
};

// Hook to manage drawings state
export const useDrawings = () => {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [activeTool, setActiveTool] = useState<DrawingType | null>(null);

  const addDrawing = useCallback((drawing: Omit<Drawing, 'id'>) => {
    setDrawings(prev => [...prev, { ...drawing, id: crypto.randomUUID() }]);
  }, []);

  const clearAll = useCallback(() => setDrawings([]), []);

  return { drawings, activeTool, setActiveTool, addDrawing, clearAll };
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
