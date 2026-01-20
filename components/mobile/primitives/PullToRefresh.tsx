"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Loader2, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

type RefreshState = "idle" | "pulling" | "ready" | "refreshing";

export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const [state, setState] = React.useState<RefreshState>("idle");
  const y = useMotionValue(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Transform for indicator
  const indicatorY = useTransform(y, [0, threshold], [-40, 20]);
  const indicatorOpacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);
  const indicatorRotate = useTransform(y, [0, threshold], [0, 180]);
  const indicatorScale = useTransform(y, [0, threshold], [0.5, 1]);

  const handleDragStart = () => {
    if (disabled || state === "refreshing") return;

    // Only allow pull if at the top of scroll
    const container = containerRef.current;
    if (container && container.scrollTop > 0) return;

    setState("pulling");
  };

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || state === "refreshing") return;

    // Only track downward movement
    if (info.offset.y > 0) {
      // Check if we've hit the threshold
      if (info.offset.y >= threshold && state === "pulling") {
        setState("ready");
        // Haptic feedback
        if ("vibrate" in navigator) {
          navigator.vibrate(10);
        }
      } else if (info.offset.y < threshold && state === "ready") {
        setState("pulling");
      }
    }
  };

  const handleDragEnd = async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || state === "refreshing") {
      y.set(0);
      return;
    }

    if (info.offset.y >= threshold) {
      setState("refreshing");
      try {
        await onRefresh();
      } finally {
        setState("idle");
      }
    } else {
      setState("idle");
    }
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative overflow-hidden", className)} ref={containerRef}>
      {/* Pull Indicator */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center"
        style={{
          y: indicatorY,
          opacity: indicatorOpacity,
          scale: indicatorScale,
        }}
      >
        <div className="w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center">
          {state === "refreshing" ? (
            <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
          ) : (
            <motion.div style={{ rotate: indicatorRotate }}>
              <ArrowDown className="h-5 w-5 text-slate-600" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag={state !== "refreshing" ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.5, bottom: 0 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y: state === "refreshing" ? threshold / 2 : y }}
        animate={state === "refreshing" ? { y: threshold / 2 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="touch-pan-x"
      >
        {children}
      </motion.div>
    </div>
  );
}

// Hook for manual refresh trigger
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh]);

  return { isRefreshing, refresh };
}
