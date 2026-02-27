import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook for pull-to-refresh gesture.
 * Returns touch handlers and state for the pull UI.
 */
export function usePullToRefresh(onRefresh, { threshold = 80 } = {}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const scrollRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    // Only enable pull when scrolled to top
    if (scrollRef.current && scrollRef.current.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!pulling.current || refreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0) {
      // Dampen the pull distance for a natural feel
      setPullDistance(Math.min(diff * 0.5, threshold * 1.5));
      if (diff > 10) {
        e.preventDefault();
      }
    } else {
      pulling.current = false;
      setPullDistance(0);
    }
  }, [refreshing, threshold]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      setPullDistance(threshold * 0.6);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, refreshing, onRefresh]);

  return {
    scrollRef,
    pullDistance,
    refreshing,
    touchHandlers: { onTouchStart, onTouchMove, onTouchEnd },
    isPulling: pullDistance > 0,
    progress: Math.min(pullDistance / threshold, 1),
  };
}
