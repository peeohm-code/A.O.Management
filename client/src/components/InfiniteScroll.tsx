import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Infinite Scroll Component
 * ใช้สำหรับโหลดข้อมูลแบบ infinite scroll (mobile-friendly)
 */

export interface InfiniteScrollProps {
  children: React.ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number; // Distance from bottom to trigger load (in pixels)
  loader?: React.ReactNode;
  endMessage?: React.ReactNode;
  error?: string | null;
  onRetry?: () => void;
}

export function InfiniteScroll({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 300,
  loader,
  endMessage,
  error,
  onRetry,
}: InfiniteScrollProps) {
  const observerTarget = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsIntersecting(entry.isIntersecting);
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [threshold]);

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading && !error) {
      onLoadMore();
    }
  }, [isIntersecting, hasMore, isLoading, error, onLoadMore]);

  return (
    <div className="relative">
      {children}

      {/* Observer Target */}
      <div ref={observerTarget} className="h-px" />

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          {loader || (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>กำลังโหลด...</span>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-destructive">{error}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              ลองใหม่
            </Button>
          )}
        </div>
      )}

      {/* End Message */}
      {!hasMore && !isLoading && !error && (
        <div className="flex justify-center py-8">
          {endMessage || (
            <p className="text-sm text-muted-foreground">ไม่มีข้อมูลเพิ่มเติม</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Pull to Refresh Component
 * ใช้สำหรับ pull-to-refresh gesture (mobile)
 */

export interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number; // Pull distance to trigger refresh (in pixels)
  maxPullDistance?: number;
}

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
  maxPullDistance = 150,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    // Only trigger if scrolled to top
    if (container.scrollTop === 0) {
      setTouchStart(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || touchStart === 0) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      setTouchStart(0);
      setPullDistance(0);
      return;
    }

    const currentTouch = e.touches[0].clientY;
    const distance = currentTouch - touchStart;

    if (distance > 0) {
      // Apply resistance for smoother feel
      const resistance = 0.5;
      const adjustedDistance = Math.min(distance * resistance, maxPullDistance);
      setPullDistance(adjustedDistance);

      // Prevent default scroll behavior when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setTouchStart(0);
    setPullDistance(0);
  };

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 ease-out"
          style={{
            height: isRefreshing ? "60px" : `${pullDistance}px`,
            opacity: isRefreshing ? 1 : pullProgress,
          }}
        >
          <div className="flex flex-col items-center gap-1">
            <Loader2
              className={`h-5 w-5 text-primary transition-transform ${
                isRefreshing ? "animate-spin" : ""
              }`}
              style={{
                transform: isRefreshing ? "none" : `rotate(${pullProgress * 360}deg)`,
              }}
            />
            <span className="text-xs text-muted-foreground">
              {isRefreshing
                ? "กำลังรีเฟรช..."
                : shouldTrigger
                ? "ปล่อยเพื่อรีเฟรช"
                : "ดึงลงเพื่อรีเฟรช"}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: isRefreshing
            ? "translateY(60px)"
            : pullDistance > 0
            ? `translateY(${pullDistance}px)`
            : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Load More Button Component
 * ใช้สำหรับแสดงปุ่มโหลดเพิ่มเติม (alternative to infinite scroll)
 */

export interface LoadMoreButtonProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  error?: string | null;
  onRetry?: () => void;
  loadedCount?: number;
  totalCount?: number;
}

export function LoadMoreButton({
  hasMore,
  isLoading,
  onLoadMore,
  error,
  onRetry,
  loadedCount,
  totalCount,
}: LoadMoreButtonProps) {
  if (!hasMore && !error) {
    return (
      <div className="flex justify-center py-6">
        <p className="text-sm text-muted-foreground">
          {loadedCount && totalCount
            ? `แสดงครบทั้งหมด ${totalCount} รายการ`
            : "ไม่มีข้อมูลเพิ่มเติม"}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <p className="text-sm text-destructive">{error}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} disabled={isLoading}>
            ลองใหม่
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 py-6">
      {loadedCount && totalCount && (
        <p className="text-sm text-muted-foreground">
          แสดง {loadedCount} จาก {totalCount} รายการ
        </p>
      )}
      <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            กำลังโหลด...
          </>
        ) : (
          "โหลดเพิ่มเติม"
        )}
      </Button>
    </div>
  );
}
