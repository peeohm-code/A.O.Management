import { useEffect } from "react";

/**
 * Mobile Optimization Component
 * - Ensures minimum touch target size (44x44px)
 * - Adds proper spacing for mobile interactions
 * - Improves accessibility for mobile users
 */
export function MobileOptimization() {
  useEffect(() => {
    // Add mobile-specific optimizations
    const optimizeTouchTargets = () => {
      // Find all interactive elements
      const interactiveElements = document.querySelectorAll(
        'button, a, input, select, textarea, [role="button"], [role="link"]'
      );

      interactiveElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        const rect = htmlElement.getBoundingClientRect();

        // Ensure minimum touch target size (44x44px recommended by Apple/Google)
        if (rect.width < 44 || rect.height < 44) {
          // Add padding to meet minimum size
          const currentPadding = parseInt(
            window.getComputedStyle(htmlElement).padding || "0"
          );
          const minPadding = Math.max(
            0,
            Math.ceil((44 - Math.min(rect.width, rect.height)) / 2)
          );

          if (minPadding > currentPadding) {
            htmlElement.style.padding = `${minPadding}px`;
          }
        }
      });
    };

    // Run on mount and when DOM changes
    optimizeTouchTargets();

    // Create observer for dynamic content
    const observer = new MutationObserver(() => {
      optimizeTouchTargets();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}

/**
 * Hook for haptic feedback on mobile devices
 */
export function useHapticFeedback() {
  const vibrate = (pattern: number | number[] = 10) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  return {
    light: () => vibrate(10),
    medium: () => vibrate(20),
    heavy: () => vibrate(30),
    success: () => vibrate([10, 50, 10]),
    error: () => vibrate([20, 100, 20]),
    warning: () => vibrate([15, 75, 15]),
  };
}

/**
 * Hook for detecting mobile device
 */
export function useIsMobile() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;

  return isMobile || (isTouchDevice && isSmallScreen);
}
