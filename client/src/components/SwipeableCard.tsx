import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, Trash2, Edit } from 'lucide-react';

interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  onAction: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onComplete?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
  disabled?: boolean;
}

export function SwipeableCard({
  children,
  leftActions,
  rightActions,
  onComplete,
  onEdit,
  onDelete,
  className,
  disabled = false,
}: SwipeableCardProps) {
  // Use new actions if provided, otherwise fall back to legacy callbacks
  const hasLeftActions = leftActions && leftActions.length > 0;
  const hasRightActions = rightActions && rightActions.length > 0;
  const hasLegacyComplete = !hasLeftActions && onComplete;
  const hasLegacyDelete = !hasRightActions && onDelete;
  const cardRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [activeActionIndex, setActiveActionIndex] = useState<number>(-1);

  // Reset swipe on mount/unmount
  useEffect(() => {
    return () => setSwipeOffset(0);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setTouchStart(e.touches[0].clientX);
    setTouchEnd(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !isSwiping) return;
    const currentTouch = e.touches[0].clientX;
    setTouchEnd(currentTouch);
    
    const offset = currentTouch - touchStart;
    // คำนวณ maxSwipe ตามจำนวน actions
    const leftActionsCount = hasLeftActions ? leftActions.length : (hasLegacyComplete ? 1 : 0);
    const rightActionsCount = hasRightActions ? rightActions.length : (hasLegacyDelete ? 1 : 0);
    const maxSwipeLeft = leftActionsCount * 80;
    const maxSwipeRight = rightActionsCount * 80;
    
    let limitedOffset = offset;
    if (offset > 0) {
      limitedOffset = Math.min(maxSwipeLeft, offset);
      // คำนวณ active action index
      const actionIdx = Math.min(
        Math.floor(limitedOffset / 80),
        leftActionsCount - 1
      );
      setActiveActionIndex(actionIdx);
    } else {
      limitedOffset = Math.max(-maxSwipeRight, offset);
      const actionIdx = Math.min(
        Math.floor(Math.abs(limitedOffset) / 80),
        rightActionsCount - 1
      );
      setActiveActionIndex(actionIdx);
    }
    setSwipeOffset(limitedOffset);
  };

  const handleTouchEnd = () => {
    if (disabled || !isSwiping) return;
    setIsSwiping(false);
    setActiveActionIndex(-1);

    const swipeDistance = touchEnd - touchStart;
    const threshold = 60;

    // Swipe ขวา (Left actions)
    if (swipeDistance > threshold) {
      const actionIndex = Math.min(
        Math.floor(swipeDistance / 80),
        hasLeftActions ? leftActions.length - 1 : 0
      );
      
      if (hasLeftActions && leftActions[actionIndex]) {
        leftActions[actionIndex].onAction();
      } else if (hasLegacyComplete) {
        onComplete!();
      }
      setSwipeOffset(0);
    }
    // Swipe ซ้าย (Right actions)
    else if (swipeDistance < -threshold) {
      const actionIndex = Math.min(
        Math.floor(Math.abs(swipeDistance) / 80),
        hasRightActions ? rightActions.length - 1 : 0
      );
      
      if (hasRightActions && rightActions[actionIndex]) {
        rightActions[actionIndex].onAction();
      } else if (hasLegacyDelete) {
        onDelete!();
      }
      setSwipeOffset(0);
    }
    // Reset ถ้า swipe ไม่ถึง threshold
    else {
      setSwipeOffset(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background Actions */}
      <div className="absolute inset-0 flex">
        {/* Left Actions */}
        {(hasLeftActions || hasLegacyComplete) && (
          <div 
            className={cn(
              "flex items-center gap-0 transition-opacity",
              swipeOffset > 0 ? "opacity-100" : "opacity-0"
            )}
            style={{ width: `${Math.max(0, swipeOffset)}px` }}
          >
            {hasLeftActions ? (
              leftActions.map((action, idx: any) => (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col items-center justify-center text-white h-full transition-transform",
                    action.color,
                    activeActionIndex === idx && swipeOffset > 0 ? "scale-110" : "scale-100"
                  )}
                  style={{ width: '80px', minWidth: '80px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onAction();
                    setSwipeOffset(0);
                  }}
                >
                  {action.icon}
                  <span className="text-xs mt-1">{action.label}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center bg-green-500 text-white h-full" style={{ width: '80px' }}>
                <Check className="w-6 h-6" />
              </div>
            )}
          </div>
        )}
        
        {/* Right Actions */}
        {(hasRightActions || hasLegacyDelete) && (
          <div 
            className={cn(
              "flex items-center gap-0 ml-auto transition-opacity",
              swipeOffset < 0 ? "opacity-100" : "opacity-0"
            )}
            style={{ width: `${Math.abs(Math.min(0, swipeOffset))}px` }}
          >
            {hasRightActions ? (
              rightActions.map((action, idx: any) => (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col items-center justify-center text-white h-full transition-transform",
                    action.color,
                    activeActionIndex === idx && swipeOffset < 0 ? "scale-110" : "scale-100"
                  )}
                  style={{ width: '80px', minWidth: '80px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onAction();
                    setSwipeOffset(0);
                  }}
                >
                  {action.icon}
                  <span className="text-xs mt-1">{action.label}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center bg-red-500 text-white h-full" style={{ width: '80px' }}>
                <Trash2 className="w-6 h-6" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div
        ref={cardRef}
        className={cn(
          "relative bg-background transition-all touch-pan-y",
          isSwiping ? "duration-0" : "duration-300 ease-out",
          className
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          boxShadow: Math.abs(swipeOffset) > 0 ? '0 4px 12px rgba(0,0,0,0.15)' : undefined,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
        
        {/* Swipe Hint - แสดงเมื่อไม่ได้ swipe */}
        {!disabled && swipeOffset === 0 && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-4 opacity-20">
            {(hasLeftActions || hasLegacyComplete) && (
              <div className="text-xs text-gray-400">→</div>
            )}
            {(hasRightActions || hasLegacyDelete) && (
              <div className="text-xs text-gray-400">←</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
