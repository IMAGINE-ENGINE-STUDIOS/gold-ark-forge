/**
 * useChartZoom — Mouse wheel + touch pinch zoom through time
 * Controls how many candles are visible. Zooming out = more history visible.
 * Zooming in = fewer candles, closer to real-time.
 */
import { useState, useCallback, useRef, useEffect } from 'react';

interface UseChartZoomOptions {
  totalPoints: number;
  minVisible?: number;
  maxVisible?: number;
}

interface UseChartZoomReturn {
  /** Number of visible data points from the end */
  visibleCount: number;
  /** Attach these to the chart container div */
  containerProps: {
    onWheel: (e: React.WheelEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  /** Slice data to only show visible range */
  sliceData: <T>(data: T[]) => T[];
  /** Zoom level label */
  zoomLabel: string;
  /** Reset zoom to default */
  resetZoom: () => void;
  /** Zoom percentage 0-100 (100 = fully zoomed out) */
  zoomPct: number;
}

export const useChartZoom = ({ totalPoints, minVisible = 10, maxVisible }: UseChartZoomOptions): UseChartZoomReturn => {
  const effectiveMax = maxVisible ?? Math.max(totalPoints, minVisible);
  const [visibleCount, setVisibleCount] = useState(totalPoints);
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartVisibleRef = useRef<number>(totalPoints);

  // Reset visible when total changes significantly (symbol/tf switch)
  useEffect(() => {
    setVisibleCount(totalPoints);
  }, [totalPoints]);

  const clamp = useCallback((val: number) => {
    return Math.max(minVisible, Math.min(effectiveMax, Math.round(val)));
  }, [minVisible, effectiveMax]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Prevent page scroll when zooming
    e.stopPropagation();
    
    const delta = e.deltaY;
    // Scroll up (negative delta) = zoom in (fewer bars)
    // Scroll down (positive delta) = zoom out (more bars)
    const zoomFactor = 0.1;
    setVisibleCount(prev => {
      const change = Math.ceil(prev * zoomFactor);
      if (delta > 0) {
        // Zoom out — show more history
        return clamp(prev + change);
      } else {
        // Zoom in — show less, closer to now
        return clamp(prev - change);
      }
    });
  }, [clamp]);

  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchStartDistRef.current = getTouchDistance(e.touches);
      touchStartVisibleRef.current = visibleCount;
    }
  }, [visibleCount]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      e.preventDefault();
      const currentDist = getTouchDistance(e.touches);
      const startDist = touchStartDistRef.current;
      if (startDist === 0) return;

      // Pinch out (spread) = zoom in (fewer bars), pinch in (squeeze) = zoom out (more bars)
      const ratio = startDist / currentDist;
      const newVisible = Math.round(touchStartVisibleRef.current * ratio);
      setVisibleCount(clamp(newVisible));
    }
  }, [clamp]);

  const handleTouchEnd = useCallback(() => {
    touchStartDistRef.current = null;
  }, []);

  const sliceData = useCallback(<T,>(data: T[]): T[] => {
    if (visibleCount >= data.length) return data;
    return data.slice(data.length - visibleCount);
  }, [visibleCount]);

  const zoomPct = effectiveMax > minVisible
    ? Math.round(((visibleCount - minVisible) / (effectiveMax - minVisible)) * 100)
    : 100;

  const zoomLabel = visibleCount >= totalPoints ? 'FIT' : `${visibleCount} bars`;

  const resetZoom = useCallback(() => {
    setVisibleCount(totalPoints);
  }, [totalPoints]);

  return {
    visibleCount,
    containerProps: {
      onWheel: handleWheel,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    sliceData,
    zoomLabel,
    resetZoom,
    zoomPct,
  };
};
