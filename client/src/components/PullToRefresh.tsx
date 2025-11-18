import React, { useRef, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  maxPullDistance?: number;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  maxPullDistance = 120,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [canPull, setCanPull] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        setCanPull(true);
        setTouchStart(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canPull || isRefreshing) return;

      const touchY = e.touches[0].clientY;
      const distance = touchY - touchStart;

      if (distance > 0 && container.scrollTop === 0) {
        e.preventDefault();
        const resistance = 0.5;
        const adjustedDistance = Math.min(distance * resistance, maxPullDistance);
        setPullDistance(adjustedDistance);
      }
    };

    const handleTouchEnd = async () => {
      if (!canPull || isRefreshing) return;
      setCanPull(false);

      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh failed:', error);
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canPull, isRefreshing, pullDistance, threshold, maxPullDistance, touchStart, onRefresh]);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const spinnerOpacity = pullProgress;
  const spinnerRotation = pullProgress * 360;

  return (
    <div 
      ref={containerRef}
      className="relative h-full overflow-y-auto"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50"
        style={{
          height: `${pullDistance}px`,
          transition: isRefreshing || pullDistance === 0 ? 'height 0.3s ease-out' : 'none',
        }}
      >
        <div
          style={{
            opacity: isRefreshing ? 1 : spinnerOpacity,
            transform: isRefreshing ? 'none' : `rotate(${spinnerRotation}deg)`,
            transition: isRefreshing ? 'opacity 0.2s' : 'none',
          }}
        >
          {isRefreshing ? (
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          ) : (
            <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
        </div>
      </div>
      <div
        style={{
          transform: `translateY(${isRefreshing ? threshold : pullDistance}px)`,
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
