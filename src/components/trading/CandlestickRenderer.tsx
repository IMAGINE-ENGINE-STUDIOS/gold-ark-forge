import { Rectangle } from 'recharts';

export type ChartMode = 'area' | 'candlestick' | 'ohlc';

interface CandlestickProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: {
    open: number;
    close: number;
    high: number;
    low: number;
  };
  yAxis?: { scale: (v: number) => number };
  index?: number;
}

// Custom candlestick shape for Recharts Bar component
export const CandlestickShape = (props: any) => {
  const { x, y, width, payload } = props;
  if (!payload || !payload.open || !payload.close) return null;

  const { open, close, high, low } = payload;
  const isBullish = close >= open;
  const color = isBullish ? 'hsl(145, 70%, 50%)' : 'hsl(0, 70%, 55%)';

  // We need Y scale - calculate from the props
  // In Recharts, the bar is positioned at y with given height
  // We'll use a custom approach with SVG
  const barWidth = Math.max(width * 0.6, 3);
  const wickWidth = 1;
  const centerX = x + width / 2;

  // The y and height represent the close-open range from Recharts
  // But we need to calculate positions ourselves from the data
  // Since we're inside a Recharts Bar shape, the coordinate system is pixel-based
  const bodyTop = y;
  const bodyHeight = Math.max(Math.abs(props.height), 1);

  return (
    <g>
      {/* Wick (high-low line) */}
      <line
        x1={centerX}
        y1={bodyTop - 10}
        x2={centerX}
        y2={bodyTop + bodyHeight + 10}
        stroke={color}
        strokeWidth={wickWidth}
      />
      {/* Body */}
      <rect
        x={centerX - barWidth / 2}
        y={bodyTop}
        width={barWidth}
        height={bodyHeight}
        fill={isBullish ? color : color}
        fillOpacity={isBullish ? 0.3 : 0.8}
        stroke={color}
        strokeWidth={0.5}
      />
    </g>
  );
};

// Render candlestick body as a custom SVG layer
export const CandlestickLayer = ({ data, xScale, yScale, barWidth = 8 }: {
  data: Array<{ open: number; close: number; high: number; low: number; time: string }>;
  xScale: (v: number) => number;
  yScale: (v: number) => number;
  barWidth?: number;
}) => {
  if (!data?.length || !xScale || !yScale) return null;

  return (
    <g className="candlestick-layer">
      {data.map((d, i) => {
        if (!d.open || !d.close) return null;
        const isBullish = d.close >= d.open;
        const color = isBullish ? 'hsl(145, 70%, 50%)' : 'hsl(0, 70%, 55%)';

        const centerX = xScale(i);
        const bodyTop = yScale(Math.max(d.open, d.close));
        const bodyBottom = yScale(Math.min(d.open, d.close));
        const wickTop = yScale(d.high);
        const wickBottom = yScale(d.low);
        const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
        const halfBar = barWidth / 2;

        return (
          <g key={i}>
            {/* Upper wick */}
            <line x1={centerX} y1={wickTop} x2={centerX} y2={bodyTop} stroke={color} strokeWidth={1} />
            {/* Lower wick */}
            <line x1={centerX} y1={bodyBottom} x2={centerX} y2={wickBottom} stroke={color} strokeWidth={1} />
            {/* Body */}
            <rect
              x={centerX - halfBar}
              y={bodyTop}
              width={barWidth}
              height={bodyHeight}
              fill={isBullish ? 'transparent' : color}
              stroke={color}
              strokeWidth={1}
            />
          </g>
        );
      })}
    </g>
  );
};

// OHLC bars (no body, just ticks)
export const OHLCLayer = ({ data, xScale, yScale, barWidth = 8 }: {
  data: Array<{ open: number; close: number; high: number; low: number; time: string }>;
  xScale: (v: number) => number;
  yScale: (v: number) => number;
  barWidth?: number;
}) => {
  if (!data?.length || !xScale || !yScale) return null;

  return (
    <g className="ohlc-layer">
      {data.map((d, i) => {
        if (!d.open || !d.close) return null;
        const isBullish = d.close >= d.open;
        const color = isBullish ? 'hsl(145, 70%, 50%)' : 'hsl(0, 70%, 55%)';
        const centerX = xScale(i);
        const halfBar = barWidth / 2;

        return (
          <g key={i}>
            {/* Vertical line (high-low) */}
            <line x1={centerX} y1={yScale(d.high)} x2={centerX} y2={yScale(d.low)} stroke={color} strokeWidth={1} />
            {/* Open tick (left) */}
            <line x1={centerX - halfBar} y1={yScale(d.open)} x2={centerX} y2={yScale(d.open)} stroke={color} strokeWidth={1.5} />
            {/* Close tick (right) */}
            <line x1={centerX} y1={yScale(d.close)} x2={centerX + halfBar} y2={yScale(d.close)} stroke={color} strokeWidth={1.5} />
          </g>
        );
      })}
    </g>
  );
};
