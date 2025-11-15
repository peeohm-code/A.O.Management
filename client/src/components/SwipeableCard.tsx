import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, Trash2, Edit } from 'lucide-react';

interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  onComplete?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
  disabled?: boolean;
}

export function SwipeableCard({
  children,
  onComplete,
  onEdit,
  onDelete,
  className,
  disabled = false,
}: SwipeableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

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
    // จำกัดการ swipe ไม่เกิน 150px ทั้งซ้ายและขวา
    const maxSwipe = 150;
    const limitedOffset = Math.max(-maxSwipe, Math.min(maxSwipe, offset));
    setSwipeOffset(limitedOffset);
  };

  const handleTouchEnd = () => {
    if (disabled || !isSwiping) return;
    setIsSwiping(false);

    const swipeDistance = touchEnd - touchStart;
    const threshold = 80; // ระยะขั้นต่ำในการ trigger action

    // Swipe ขวา (Complete)
    if (swipeDistance > threshold && onComplete) {
      onComplete();
      setSwipeOffset(0);
    }
    // Swipe ซ้าย (Delete)
    else if (swipeDistance < -threshold && onDelete) {
      onDelete();
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
        {/* Left Action - Complete */}
        {onComplete && (
          <div 
            className={cn(
              "flex items-center justify-start pl-4 bg-green-500 text-white transition-opacity",
              swipeOffset > 0 ? "opacity-100" : "opacity-0"
            )}
            style={{ width: `${Math.max(0, swipeOffset)}px` }}
          >
            <Check className="w-6 h-6" />
          </div>
        )}
        
        {/* Right Action - Delete */}
        {onDelete && (
          <div 
            className={cn(
              "flex items-center justify-end pr-4 bg-red-500 text-white ml-auto transition-opacity",
              swipeOffset < 0 ? "opacity-100" : "opacity-0"
            )}
            style={{ width: `${Math.abs(Math.min(0, swipeOffset))}px` }}
          >
            <Trash2 className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Card Content */}
      <div
        ref={cardRef}
        className={cn(
          "relative bg-background transition-transform touch-pan-y",
          isSwiping ? "duration-0" : "duration-300",
          className
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
