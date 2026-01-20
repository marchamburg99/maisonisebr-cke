"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { LucideIcon, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeAction {
  icon: LucideIcon;
  label: string;
  color: string;
  bgColor: string;
}

interface SwipeableCardProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

const DEFAULT_LEFT_ACTION: SwipeAction = {
  icon: Trash2,
  label: "Löschen",
  color: "text-white",
  bgColor: "bg-red-500",
};

const DEFAULT_RIGHT_ACTION: SwipeAction = {
  icon: Edit,
  label: "Bearbeiten",
  color: "text-white",
  bgColor: "bg-amber-500",
};

export function SwipeableCard({
  onSwipeLeft,
  onSwipeRight,
  leftAction = DEFAULT_LEFT_ACTION,
  rightAction = DEFAULT_RIGHT_ACTION,
  children,
  className,
  threshold = 100,
  disabled = false,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = React.useState(false);

  // Transform for left action (swipe right reveals left action)
  const leftActionOpacity = useTransform(x, [0, threshold], [0, 1]);
  const leftActionScale = useTransform(x, [0, threshold], [0.8, 1]);

  // Transform for right action (swipe left reveals right action)
  const rightActionOpacity = useTransform(x, [-threshold, 0], [1, 0]);
  const rightActionScale = useTransform(x, [-threshold, 0], [1, 0.8]);

  // Background color based on direction
  const backgroundColor = useTransform(
    x,
    [-threshold, 0, threshold],
    [
      leftAction.bgColor.replace("bg-", "var(--"),
      "transparent",
      rightAction.bgColor.replace("bg-", "var(--"),
    ]
  );

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Trigger haptic feedback if available
    if (Math.abs(offset) >= threshold && "vibrate" in navigator) {
      navigator.vibrate(10);
    }

    // Check if threshold is met (considering velocity for quick swipes)
    if (offset > threshold || velocity > 500) {
      onSwipeRight?.();
    } else if (offset < -threshold || velocity < -500) {
      onSwipeLeft?.();
    }
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      {/* Left Action Background (revealed when swiping right) */}
      {onSwipeRight && (
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0 flex items-center justify-start px-6",
            rightAction.bgColor
          )}
          style={{ opacity: leftActionOpacity }}
        >
          <motion.div
            className="flex items-center gap-2"
            style={{ scale: leftActionScale }}
          >
            <rightAction.icon className={cn("h-6 w-6", rightAction.color)} />
            <span className={cn("font-medium", rightAction.color)}>
              {rightAction.label}
            </span>
          </motion.div>
        </motion.div>
      )}

      {/* Right Action Background (revealed when swiping left) */}
      {onSwipeLeft && (
        <motion.div
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-end px-6",
            leftAction.bgColor
          )}
          style={{ opacity: rightActionOpacity }}
        >
          <motion.div
            className="flex items-center gap-2"
            style={{ scale: rightActionScale }}
          >
            <span className={cn("font-medium", leftAction.color)}>
              {leftAction.label}
            </span>
            <leftAction.icon className={cn("h-6 w-6", leftAction.color)} />
          </motion.div>
        </motion.div>
      )}

      {/* Swipeable Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cn(
          "relative bg-white touch-pan-y",
          isDragging && "cursor-grabbing"
        )}
        whileTap={{ cursor: "grabbing" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Hook for checking if device supports touch
export function useSupportsTouch() {
  const [supportsTouch, setSupportsTouch] = React.useState(false);

  React.useEffect(() => {
    setSupportsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  return supportsTouch;
}
