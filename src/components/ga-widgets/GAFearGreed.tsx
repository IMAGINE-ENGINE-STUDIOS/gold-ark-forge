import { useEffect, useState, useCallback } from 'react';
import { Gauge } from 'lucide-react';
import WidgetShell from './WidgetShell';

interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
}

const getColor = (val: number) => {
  if (val <= 25) return 'hsl(0,70%,50%)';
  if (val <= 45) return 'hsl(25,80%,50%)';
  if (val <= 55) return 'hsl(43,72%,50%)';
  if (val <= 75) return 'hsl(80,60%,45%)';
  return 'hsl(120,50%,40%)';
};

const GaugeVisual = ({ value, animated }: { value: number; animated: boolean }) => {
  const angle = -90 + (value / 100) * 180;
  const color = getColor(value);

  return (
    <div className="relative w-52 h-32 mx-auto">
      <svg viewBox="0 0 200 115" className="w-full h-full">
        {/* Background arc */}
        <path d="M 20 105 A 80 80 0 0 1 180 105" fill="none" stroke="hsl(210,20%,15%)" strokeWidth="14" strokeLinecap="round" />
        {/* Color segments */}
        {[
          { d: "M 20 105 A 80 80 0 0 1 55 38", color: 'hsl(0,70%,40%)', opacity: 0.4 },
          { d: "M 55 38 A 80 80 0 0 1 100 22", color: 'hsl(25,80%,45%)', opacity: 0.35 },
          { d: "M 100 22 A 80 80 0 0 1 145 38", color: 'hsl(43,72%,50%)', opacity: 0.35 },
          { d: "M 145 38 A 80 80 0 0 1 180 105", color: 'hsl(120,50%,40%)', opacity: 0.4 },
        ].map((seg, i) => (
          <path key={i} d={seg.d} fill="none" stroke={seg.color} strokeWidth="14" strokeLinecap="round" opacity={seg.opacity} />
        ))}
        {/* Active glow on needle position */}
        <circle
          cx={100 + 65 * Math.cos((angle * Math.PI) / 180)}
          cy={105 + 65 * Math.sin((angle * Math.PI) / 180)}
          r="8"
          fill={color}
          opacity="0.2"
          className={animated ? 'animate-pulse' : ''}
        />
        {/* Needle */}
        <line
          x1="100" y1="105"
          x2={100 + 62 * Math.cos((angle * Math.PI) / 180)}
          y2={105 + 62 * Math.sin((angle * Math.PI) / 180)}
          stroke={color} strokeWidth="3" strokeLinecap="round"
          style={{ transition: 'all 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <circle cx="100" cy="105" r="6" fill={color} />
        <circle cx="100" cy="105" r="3" fill="hsl(213,32%,16%)" />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 text-center">
        <span className="font-display text-3xl font-semibold" style={{ color, transition: 'color 0.6s' }}>{value}</span>
      </div>
    </div>
  );
};

const GAFearGreed = () => {
  const [current, setCurrent] = useState<FearGreedData | null>(null);
  const [history, setHistory] = useState<FearGreedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [animated, setAnimated] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('https://api.alternative.me/fng/?limit=7');
      const json = await res.json();
      if (json.data) {
        setCurrent(json.data[0]);
        setHistory(json.data);
        setTimeout(() => setAnimated(true), 300);
      }
    } catch (e) {
      console.error('Fear & Greed fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const val = parseInt(current?.value ?? '50');

  return (
    <WidgetShell icon={Gauge} title="FEAR & GREED INDEX" source="alternative.me" onRefresh={fetchData}>
      {loading ? (
        <div className="space-y-4">
          <div className="h-32 bg-navy-light/30 rounded skeleton-shimmer" />
          <div className="h-12 bg-navy-light/20 rounded skeleton-shimmer" style={{ animationDelay: '0.2s' }} />
        </div>
      ) : (
        <div className="space-y-6">
          <GaugeVisual value={val} animated={animated} />
          <p className="text-center font-display text-lg tracking-[0.2em]" style={{ color: getColor(val), transition: 'color 0.6s' }}>
            {current?.value_classification?.toUpperCase()}
          </p>

          {/* 7-day history with bar chart */}
          <div className="space-y-3">
            <div className="grid grid-cols-7 gap-1.5">
              {history.map((d, i) => {
                const v = parseInt(d.value);
                const date = new Date(parseInt(d.timestamp) * 1000);
                const barHeight = Math.max(20, (v / 100) * 60);
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col items-center justify-end" style={{ height: 60 }}>
                      <div
                        className="w-full max-w-[24px] rounded-t transition-all duration-700 ease-out"
                        style={{
                          height: animated ? barHeight : 0,
                          backgroundColor: getColor(v),
                          opacity: 0.7,
                          transitionDelay: `${i * 80}ms`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold" style={{ color: getColor(v) }}>{v}</span>
                    <span className="text-[9px] text-marble/25">
                      {date.toLocaleDateString('en', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-[10px] text-marble/20 tracking-[0.2em]">7-DAY SENTIMENT HISTORY</p>
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

export default GAFearGreed;
