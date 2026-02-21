import { Rectangle } from 'recharts';

export type ChartMode = 'area' | 'candlestick' | 'ohlc' | 'heikinashi' | 'renko';

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

  const barWidth = Math.max(width * 0.6, 3);
  const wickWidth = 1;
  const centerX = x + width / 2;

  const bodyTop = y;
  const bodyHeight = Math.max(Math.abs(props.height), 1);

  return (
    <g>
      <line x1={centerX} y1={bodyTop - 10} x2={centerX} y2={bodyTop + bodyHeight + 10} stroke={color} strokeWidth={wickWidth} />
      <rect x={centerX - barWidth / 2} y={bodyTop} width={barWidth} height={bodyHeight} fill={isBullish ? color : color} fillOpacity={isBullish ? 0.3 : 0.8} stroke={color} strokeWidth={0.5} />
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
            <line x1={centerX} y1={wickTop} x2={centerX} y2={bodyTop} stroke={color} strokeWidth={1} />
            <line x1={centerX} y1={bodyBottom} x2={centerX} y2={wickBottom} stroke={color} strokeWidth={1} />
            <rect x={centerX - halfBar} y={bodyTop} width={barWidth} height={bodyHeight} fill={isBullish ? 'transparent' : color} stroke={color} strokeWidth={1} />
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
            <line x1={centerX} y1={yScale(d.high)} x2={centerX} y2={yScale(d.low)} stroke={color} strokeWidth={1} />
            <line x1={centerX - halfBar} y1={yScale(d.open)} x2={centerX} y2={yScale(d.open)} stroke={color} strokeWidth={1.5} />
            <line x1={centerX} y1={yScale(d.close)} x2={centerX + halfBar} y2={yScale(d.close)} stroke={color} strokeWidth={1.5} />
          </g>
        );
      })}
    </g>
  );
};

// ═══════════════════════════════════════════════════════════
// HEIKIN-ASHI LAYER
// Transforms raw OHLC data into smoothed Heikin-Ashi candles
// ═══════════════════════════════════════════════════════════
interface HAData { open: number; close: number; high: number; low: number; }

const computeHeikinAshi = (data: Array<{ open: number; close: number; high: number; low: number }>): HAData[] => {
  const ha: HAData[] = [];
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const haClose = (d.open + d.high + d.low + d.close) / 4;
    const haOpen = i === 0
      ? (d.open + d.close) / 2
      : (ha[i - 1].open + ha[i - 1].close) / 2;
    const haHigh = Math.max(d.high, haOpen, haClose);
    const haLow = Math.min(d.low, haOpen, haClose);
    ha.push({ open: haOpen, close: haClose, high: haHigh, low: haLow });
  }
  return ha;
};

export const HeikinAshiLayer = ({ data, xScale, yScale, barWidth = 8 }: {
  data: Array<{ open: number; close: number; high: number; low: number; time: string }>;
  xScale: (v: number) => number;
  yScale: (v: number) => number;
  barWidth?: number;
}) => {
  if (!data?.length || !xScale || !yScale) return null;

  const haData = computeHeikinAshi(data);

  return (
    <g className="heikinashi-layer">
      {haData.map((d, i) => {
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
            <line x1={centerX} y1={wickTop} x2={centerX} y2={bodyTop} stroke={color} strokeWidth={1} />
            <line x1={centerX} y1={bodyBottom} x2={centerX} y2={wickBottom} stroke={color} strokeWidth={1} />
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

// ═══════════════════════════════════════════════════════════
// RENKO LAYER
// Price-only bricks — ignores time, shows fixed-height blocks
// ═══════════════════════════════════════════════════════════
interface RenkoBrick { y: number; direction: 'up' | 'down'; }

const computeRenkoBricks = (data: Array<{ close: number; high: number; low: number }>, brickSize: number): RenkoBrick[] => {
  if (!data.length || brickSize <= 0) return [];
  const bricks: RenkoBrick[] = [];
  let lastBrickPrice = data[0].close;

  for (let i = 1; i < data.length; i++) {
    const price = data[i].close;
    const diff = price - lastBrickPrice;

    if (Math.abs(diff) >= brickSize) {
      const direction = diff > 0 ? 'up' : 'down';
      const numBricks = Math.floor(Math.abs(diff) / brickSize);
      for (let b = 0; b < numBricks; b++) {
        const brickBottom = direction === 'up'
          ? lastBrickPrice + b * brickSize
          : lastBrickPrice - (b + 1) * brickSize;
        bricks.push({ y: brickBottom, direction });
      }
      lastBrickPrice += (direction === 'up' ? 1 : -1) * numBricks * brickSize;
    }
  }
  return bricks;
};

const computeATR14 = (data: Array<{ high: number; low: number; close: number }>): number => {
  if (data.length < 2) return 0;
  let atrSum = 0;
  const period = Math.min(14, data.length - 1);
  for (let i = data.length - period; i < data.length; i++) {
    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    );
    atrSum += tr;
  }
  return atrSum / period;
};

export const RenkoLayer = ({ data, xScale, yScale, barWidth = 8 }: {
  data: Array<{ open: number; close: number; high: number; low: number; time: string }>;
  xScale: (v: number) => number;
  yScale: (v: number) => number;
  barWidth?: number;
}) => {
  if (!data?.length || !xScale || !yScale) return null;

  // Compute brick size from ATR(14) or fallback to 0.5% of avg price
  const atr = computeATR14(data);
  const avgPrice = data.reduce((s, d) => s + d.close, 0) / data.length;
  const brickSize = atr > 0 ? atr : avgPrice * 0.005;

  const bricks = computeRenkoBricks(data, brickSize);
  if (bricks.length === 0) return null;

  // Distribute bricks evenly across the chart width
  const totalBricks = bricks.length;
  // Use xScale positions from the original data to determine chart bounds
  const firstX = xScale(0);
  const lastX = xScale(data.length - 1);
  const chartWidth = lastX - firstX;
  const brickW = Math.max(Math.min(chartWidth / totalBricks * 0.8, barWidth * 1.5), 3);
  const gap = chartWidth / Math.max(totalBricks, 1);

  return (
    <g className="renko-layer">
      {bricks.map((brick, i) => {
        const color = brick.direction === 'up' ? 'hsl(145, 70%, 50%)' : 'hsl(0, 70%, 55%)';
        const brickTop = yScale(brick.y + brickSize);
        const brickBottom = yScale(brick.y);
        const height = Math.max(brickBottom - brickTop, 1);
        const cx = firstX + i * gap;

        return (
          <rect
            key={i}
            x={cx - brickW / 2}
            y={brickTop}
            width={brickW}
            height={height}
            fill={brick.direction === 'up' ? 'hsl(145, 70%, 50%)' : 'hsl(0, 70%, 55%)'}
            fillOpacity={0.7}
            stroke={color}
            strokeWidth={0.5}
            rx={1}
          />
        );
      })}
    </g>
  );
};
