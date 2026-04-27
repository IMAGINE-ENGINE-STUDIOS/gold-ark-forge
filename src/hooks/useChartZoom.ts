/**
 * useChartZoom — Mouse wheel + pinch zoom + click-drag / touch-swipe pan.
 *
 * Two independent dimensions:
 *   • visibleCount → how many candles are shown (zoom)
 *   • endOffset    → how many candles from the right edge are hidden (pan)
 *
 * Sliding/swiping LEFT increases endOffset → reveals older history.
 * Sliding/swiping RIGHT decreases endOffset → moves back toward the live edge.
 * Zooming preserves the current right-edge position (no viewport repositioning).
 */
import { useState, useCallback, useRef, useEffect } from 'react';

interface UseChartZoomOptions {
  totalPoints: number;
  minVisible?: number;
  maxVisible?: number;
  /** Initial / default visible window. Defaults to totalPoints. */
  initialVisible?: number;
}

interface UseChartZoomReturn {
  /** Number of visible data points from the end */
  visibleCount: number;
  /** Offset from the live (right) edge, in candles. 0 = pinned to latest. */
  endOffset: number;
  /** Attach these to the chart container div */
  containerProps: {
    onWheel: (e: React.WheelEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
  };
  /** Slice data to only show visible range */
  sliceData: <T>(data: T[]) => T[];
  /** Zoom level label */
  zoomLabel: string;
  /** Reset zoom & pan to default (live edge, fit) */
  resetZoom: () => void;
  /** Zoom percentage 0-100 (100 = fully zoomed out) */
  zoomPct: number;
  /** True when the user has panned away from the live edge */
  isPanned: boolean;
}

export const useChartZoom = ({ totalPoints, minVisible = 10, maxVisible, initialVisible }: UseChartZoomOptions): UseChartZoomReturn => {
  const effectiveMax = maxVisible ?? Math.max(totalPoints, minVisible);
  const defaultVisible = initialVisible ?? totalPoints;
  const [visibleCount, setVisibleCount] = useState(defaultVisible);
  const [endOffset, setEndOffset] = useState(0);
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartVisibleRef = useRef<number>(defaultVisible);
  // Single-finger swipe pan tracking
  const touchStartXRef = useRef<number | null>(null);
  const touchStartOffsetRef = useRef<number>(0);
  // Mouse-drag pan tracking
  const mouseDownXRef = useRef<number | null>(null);
  const mouseDownOffsetRef = useRef<number>(0);
  // Track whether the user has manually adjusted zoom; if so, don't reset
  // visibleCount when totalPoints grows (e.g. new live candles streaming in).
  const userAdjustedRef = useRef(false);

  // When the underlying buffer length changes:
  //  • If the user hasn't touched zoom, snap to the (new) defaultVisible.
  //  • If they have, keep their visibleCount but re-clamp endOffset.
  useEffect(() => {
    if (!userAdjustedRef.current) {
      setVisibleCount(defaultVisible);
    }
    setEndOffset((prev) => Math.max(0, Math.min(prev, Math.max(0, totalPoints - minVisible))));
  }, [totalPoints, minVisible, defaultVisible]);

  const clamp = useCallback((val: number) => {
    return Math.max(minVisible, Math.min(effectiveMax, Math.round(val)));
  }, [minVisible, effectiveMax]);

  const clampOffset = useCallback((val: number, currentVisible: number) => {
    const maxOffset = Math.max(0, totalPoints - currentVisible);
    return Math.max(0, Math.min(maxOffset, Math.round(val)));
  }, [totalPoints]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Prevent page scroll when zooming
    e.stopPropagation();
    
    const delta = e.deltaY;
    // Shift + wheel = horizontal pan; otherwise zoom
    if (e.shiftKey) {
      // Wheel down → pan right (toward now), wheel up → pan left (history)
      userAdjustedRef.current = true;
      setEndOffset(prev => clampOffset(prev + (delta > 0 ? -10 : 10), visibleCount));
      return;
    }
    // Scroll up = zoom in, down = zoom out. Zoom anchors on the right edge of
    // the current view: we keep endOffset constant so the visible window
    // grows/shrinks toward the LEFT, leaving the user where they were.
    const zoomFactor = 0.1;
    userAdjustedRef.current = true;
    setVisibleCount(prev => {
      const change = Math.ceil(prev * zoomFactor);
      const next = delta > 0 ? clamp(prev + change) : clamp(prev - change);
      // Re-clamp endOffset against new window size on next render
      setEndOffset(o => clampOffset(o, next));
      return next;
    });
  }, [clamp, clampOffset, visibleCount]);

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
      touchStartXRef.current = null;
    } else if (e.touches.length === 1) {
      // Single-finger swipe pan
      touchStartXRef.current = e.touches[0].clientX;
      touchStartOffsetRef.current = endOffset;
      touchStartDistRef.current = null;
    }
  }, [visibleCount, endOffset]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const currentDist = getTouchDistance(e.touches);
      const startDist = touchStartDistRef.current;
      if (startDist === 0) return;

      const ratio = startDist / currentDist;
      const newVisible = Math.round(touchStartVisibleRef.current * ratio);
      const next = clamp(newVisible);
      userAdjustedRef.current = true;
      setVisibleCount(next);
      setEndOffset(o => clampOffset(o, next));
      return;
    }
    if (e.touches.length === 1 && touchStartXRef.current !== null) {
      // Single-finger horizontal pan. Convert pixels → candles using the
      // visible window width as a rough scale (assume container ~ window width).
      const dx = e.touches[0].clientX - touchStartXRef.current;
      const containerW = (e.currentTarget as HTMLElement)?.clientWidth || window.innerWidth;
      const candlesPerPx = visibleCount / Math.max(1, containerW);
      // Drag right (positive dx) → reveal older candles (increase offset)
      const candleDelta = dx * candlesPerPx;
      userAdjustedRef.current = true;
      setEndOffset(clampOffset(touchStartOffsetRef.current + candleDelta, visibleCount));
    }
  }, [clamp, clampOffset, visibleCount]);

  const handleTouchEnd = useCallback(() => {
    touchStartDistRef.current = null;
    touchStartXRef.current = null;
  }, []);

  // ─── Mouse drag-to-pan ──────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only left-button, ignore if a tool requested click capture
    if (e.button !== 0) return;
    mouseDownXRef.current = e.clientX;
    mouseDownOffsetRef.current = endOffset;
  }, [endOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (mouseDownXRef.current === null) return;
    const dx = e.clientX - mouseDownXRef.current;
    if (Math.abs(dx) < 3) return; // dead-zone so clicks still register
    const containerW = (e.currentTarget as HTMLElement)?.clientWidth || window.innerWidth;
    const candlesPerPx = visibleCount / Math.max(1, containerW);
    const candleDelta = dx * candlesPerPx;
    userAdjustedRef.current = true;
    setEndOffset(clampOffset(mouseDownOffsetRef.current + candleDelta, visibleCount));
  }, [clampOffset, visibleCount]);

  const handleMouseUp = useCallback(() => {
    mouseDownXRef.current = null;
  }, []);

  const sliceData = useCallback(<T,>(data: T[]): T[] => {
    const len = data.length;
    const offset = Math.min(endOffset, Math.max(0, len - minVisible));
    const end = len - offset;
    if (visibleCount >= len && offset === 0) return data;
    const start = Math.max(0, end - visibleCount);
    return data.slice(start, end);
  }, [visibleCount, endOffset, minVisible]);

  const zoomPct = effectiveMax > minVisible
    ? Math.round(((visibleCount - minVisible) / (effectiveMax - minVisible)) * 100)
    : 100;

  const isPanned = endOffset > 0;
  const zoomLabel = !isPanned && visibleCount >= totalPoints
    ? 'FIT'
    : isPanned
      ? `${visibleCount} bars · ←${endOffset}`
      : `${visibleCount} bars`;

  const resetZoom = useCallback(() => {
    userAdjustedRef.current = false;
    setVisibleCount(defaultVisible);
    setEndOffset(0);
  }, [defaultVisible]);

  return {
    visibleCount,
    endOffset,
    containerProps: {
      onWheel: handleWheel,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
    },
    sliceData,
    zoomLabel,
    resetZoom,
    zoomPct,
    isPanned,
  };
};
