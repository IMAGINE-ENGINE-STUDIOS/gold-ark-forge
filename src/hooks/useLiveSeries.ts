import { useEffect, useRef, useState } from 'react';

/**
 * Rolling live-price recorder. Samples the shared price substrate on an interval
 * and keeps a bounded series per ticker so analysis programs and custom code
 * blocks always compute on REAL observed prints (never synthetic history).
 */
export function useLiveSeries(
  tickers: string[],
  getPrice: (t: string) => number,
  { intervalMs = 5000, maxPoints = 240 }: { intervalMs?: number; maxPoints?: number } = {},
) {
  const store = useRef<Map<string, number[]>>(new Map());
  const [version, setVersion] = useState(0);
  const tickerRef = useRef<string[]>(tickers);
  tickerRef.current = tickers;
  const getRef = useRef(getPrice);
  getRef.current = getPrice;

  useEffect(() => {
    const tick = () => {
      let changed = false;
      tickerRef.current.forEach((t) => {
        const p = getRef.current(t);
        if (!(p > 0)) return;
        const arr = store.current.get(t) ?? [];
        // Record EVERY sample, even when the price is unchanged: the series is
        // time-sampled (one print per interval), and analysis windows count
        // samples. Dropping unchanged prices starved quiet assets — a flat
        // Sunday-night metal could sit at "2 prints" for a whole run.
        arr.push(p);
        if (arr.length > maxPoints) arr.splice(0, arr.length - maxPoints);
        store.current.set(t, arr);
        changed = true;
      });
      if (changed) setVersion((v) => v + 1);
    };
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, maxPoints]);

  const getSeries = (t: string) => store.current.get(t) ?? [];
  return { getSeries, version, points: store.current };
}

export default useLiveSeries;