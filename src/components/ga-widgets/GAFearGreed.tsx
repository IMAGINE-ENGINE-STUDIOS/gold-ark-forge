import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Gauge } from 'lucide-react';

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

const GaugeVisual = ({ value }: { value: number }) => {
  const angle = -90 + (value / 100) * 180;
  const color = getColor(value);
  return (
    <div className="relative w-48 h-28 mx-auto">
      <svg viewBox="0 0 200 110" className="w-full h-full">
        {/* Background arc */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(210,20%,15%)" strokeWidth="12" strokeLinecap="round" />
        {/* Gradient segments */}
        <path d="M 20 100 A 80 80 0 0 1 55 35" fill="none" stroke="hsl(0,70%,40%)" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
        <path d="M 55 35 A 80 80 0 0 1 100 20" fill="none" stroke="hsl(25,80%,45%)" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
        <path d="M 100 20 A 80 80 0 0 1 145 35" fill="none" stroke="hsl(43,72%,50%)" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
        <path d="M 145 35 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(120,50%,40%)" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
        {/* Needle */}
        <line
          x1="100" y1="100"
          x2={100 + 60 * Math.cos((angle * Math.PI) / 180)}
          y2={100 + 60 * Math.sin((angle * Math.PI) / 180)}
          stroke={color} strokeWidth="3" strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="5" fill={color} />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 text-center">
        <span className="font-display text-3xl" style={{ color }}>{value}</span>
      </div>
    </div>
  );
};

const GAFearGreed = () => {
  const [current, setCurrent] = useState<FearGreedData | null>(null);
  const [history, setHistory] = useState<FearGreedData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('https://api.alternative.me/fng/?limit=7');
      const json = await res.json();
      if (json.data) {
        setCurrent(json.data[0]);
        setHistory(json.data);
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

  if (loading) {
    return (
      <div className="rounded-sm border border-gold/20 bg-navy-light/50 p-8 animate-pulse">
        <div className="h-6 w-48 bg-gold/10 rounded mb-4" />
        <div className="h-32 bg-gold/5 rounded" />
      </div>
    );
  }

  const val = parseInt(current?.value ?? '50');

  return (
    <div className="rounded-sm border border-gold/20 bg-navy-light/50 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10 bg-navy-dark/50">
        <div className="flex items-center gap-3">
          <Gauge className="w-5 h-5 text-gold" />
          <span className="font-display text-sm tracking-[0.15em] text-gold-light">FEAR & GREED INDEX</span>
          <span className="text-[10px] text-marble/30 font-mono ml-2">alternative.me</span>
        </div>
        <button onClick={fetchData} className="text-marble/40 hover:text-gold transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6">
        <GaugeVisual value={val} />
        <p className="text-center font-display text-lg tracking-[0.2em] mt-4" style={{ color: getColor(val) }}>
          {current?.value_classification?.toUpperCase()}
        </p>

        {/* 7-day history */}
        <div className="mt-6 grid grid-cols-7 gap-1">
          {history.map((d, i) => {
            const v = parseInt(d.value);
            const date = new Date(parseInt(d.timestamp) * 1000);
            return (
              <div key={i} className="text-center">
                <div
                  className="mx-auto w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono text-navy-dark font-bold"
                  style={{ backgroundColor: getColor(v) }}
                >
                  {v}
                </div>
                <span className="text-[9px] text-marble/30 mt-1 block">
                  {date.toLocaleDateString('en', { weekday: 'short' })}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-center text-[10px] text-marble/20 mt-3">7-DAY SENTIMENT HISTORY</p>
      </div>
    </div>
  );
};

export default GAFearGreed;
