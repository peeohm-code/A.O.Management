import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Mobile Touch Optimization Hooks
 * ใช้สำหรับจัดการ touch gestures บน mobile devices
 */

// Swipe Direction Type
export type SwipeDirection = "left" | "right" | "up" | "down";

// Swipe Gesture Hook
export interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance to trigger swipe (in pixels)
  preventDefaultTouchMove?: boolean;
}

export function useSwipe(options: UseSwipeOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefaultTouchMove = false,
  } = options;

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (preventDefaultTouchMove) {
        e.preventDefault();
      }
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      });
    },
    [preventDefaultTouchMove]
  );

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;

    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);

    if (isHorizontalSwipe) {
      if (distanceX > threshold && onSwipeLeft) {
        onSwipeLeft();
      } else if (distanceX < -threshold && onSwipeRight) {
        onSwipeRight();
      }
    } else if (isVerticalSwipe) {
      if (distanceY > threshold && onSwipeUp) {
        onSwipeUp();
      } else if (distanceY < -threshold && onSwipeDown) {
        onSwipeDown();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

// Long Press Hook
export interface UseLongPressOptions {
  onLongPress: () => void;
  delay?: number; // Duration to trigger long press (in milliseconds)
  shouldPreventDefault?: boolean;
}

export function useLongPress(options: UseLongPressOptions) {
  const { onLongPress, delay = 500, shouldPreventDefault = true } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const start = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (shouldPreventDefault && "touches" in e) {
        e.preventDefault();
      }

      setIsLongPressing(false);
      timeoutRef.current = setTimeout(() => {
        setIsLongPressing(true);
        onLongPress();
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault]
  );

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLongPressing(false);
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    isLongPressing,
  };
}

// Pinch Zoom Hook
export interface UsePinchZoomOptions {
  onZoomIn?: (scale: number) => void;
  onZoomOut?: (scale: number) => void;
  minScale?: number;
  maxScale?: number;
}

export function usePinchZoom(options: UsePinchZoomOptions) {
  const { onZoomIn, onZoomOut, minScale = 0.5, maxScale = 3 } = options;
  const [scale, setScale] = useState(1);
  const lastDistanceRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      lastDistanceRef.current = distance;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && lastDistanceRef.current) {
        e.preventDefault();

        const distance = getDistance(e.touches[0], e.touches[1]);
        const delta = distance - lastDistanceRef.current;
        const scaleChange = delta * 0.01;

        const newScale = Math.max(minScale, Math.min(maxScale, scale + scaleChange));
        setScale(newScale);

        if (scaleChange > 0 && onZoomIn) {
          onZoomIn(newScale);
        } else if (scaleChange < 0 && onZoomOut) {
          onZoomOut(newScale);
        }

        lastDistanceRef.current = distance;
      }
    },
    [scale, minScale, maxScale, onZoomIn, onZoomOut]
  );

  const handleTouchEnd = useCallback(() => {
    lastDistanceRef.current = null;
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    scale,
    resetZoom,
  };
}

// Helper: Calculate distance between two touch points
function getDistance(touch1: React.Touch, touch2: React.Touch): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Touch Target Size Validator
export function validateTouchTargetSize(element: HTMLElement): boolean {
  const MIN_SIZE = 44; // Minimum 44x44px for touch targets (WCAG guideline)
  const rect = element.getBoundingClientRect();
  return rect.width >= MIN_SIZE && rect.height >= MIN_SIZE;
}

// Haptic Feedback (if supported)
export function triggerHapticFeedback(type: "light" | "medium" | "heavy" = "light") {
  if ("vibrate" in navigator) {
    const duration = type === "light" ? 10 : type === "medium" ? 20 : 30;
    navigator.vibrate(duration);
  }
}

// Detect Mobile Device
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Detect Touch Support
export function isTouchDevice(): boolean {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

// Prevent Zoom on Double Tap (iOS Safari)
export function preventDoubleTapZoom(element: HTMLElement) {
  let lastTap = 0;
  element.addEventListener("touchend", (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
      e.preventDefault();
    }
    lastTap = currentTime;
  });
}
