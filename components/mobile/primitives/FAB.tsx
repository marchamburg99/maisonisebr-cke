"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FABAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

interface FABProps {
  icon?: LucideIcon;
  onClick?: () => void;
  actions?: FABAction[];
  badge?: number;
  className?: string;
  position?: "bottom-right" | "bottom-center";
  hideOnScroll?: boolean;
}

export function FAB({
  icon: Icon = Plus,
  onClick,
  actions,
  badge,
  className,
  position = "bottom-right",
  hideOnScroll = false,
}: FABProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);

  // Hide on scroll behavior
  React.useEffect(() => {
    if (!hideOnScroll) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY <= lastScrollY.current || currentScrollY < 50);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hideOnScroll]);

  const handleClick = () => {
    if (actions && actions.length > 0) {
      setIsExpanded(!isExpanded);
      // Haptic feedback
      if ("vibrate" in navigator) {
        navigator.vibrate(10);
      }
    } else {
      onClick?.();
    }
  };

  const handleActionClick = (action: FABAction) => {
    action.onClick();
    setIsExpanded(false);
  };

  const positionClasses = {
    "bottom-right": "right-4 bottom-20 md:bottom-6",
    "bottom-center": "left-1/2 -translate-x-1/2 bottom-20 md:bottom-6",
  };

  return (
    <>
      {/* Backdrop when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          "fixed z-50 flex flex-col-reverse items-center gap-3",
          positionClasses[position],
          className
        )}
      >
        {/* Action buttons */}
        <AnimatePresence>
          {isExpanded &&
            actions?.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleActionClick(action)}
                className={cn(
                  "flex items-center gap-3 pl-4 pr-2 py-2 rounded-full",
                  "bg-white shadow-lg border border-slate-200",
                  "active:scale-95 transition-transform touch-manipulation"
                )}
              >
                <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                  {action.label}
                </span>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <action.icon className="h-5 w-5 text-slate-600" />
                </div>
              </motion.button>
            ))}
        </AnimatePresence>

        {/* Main FAB button */}
        <motion.button
          animate={{
            y: isVisible ? 0 : 100,
            opacity: isVisible ? 1 : 0,
          }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          className={cn(
            "relative w-14 h-14 rounded-full shadow-lg",
            "bg-amber-500 hover:bg-amber-600 active:bg-amber-700",
            "flex items-center justify-center",
            "transition-colors touch-manipulation",
            "md:hidden"
          )}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {isExpanded ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Icon className="h-6 w-6 text-white" />
            )}
          </motion.div>

          {/* Badge */}
          {badge && badge > 0 && !isExpanded && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full",
                "bg-red-500 text-white text-xs font-bold",
                "flex items-center justify-center"
              )}
            >
              {badge > 99 ? "99+" : badge}
            </motion.span>
          )}
        </motion.button>
      </div>
    </>
  );
}

// Preset FAB configurations
export function DocumentScanFAB({ onScan }: { onScan: () => void }) {
  return (
    <FAB
      icon={Plus}
      actions={[
        { icon: Plus, label: "Foto aufnehmen", onClick: onScan },
      ]}
    />
  );
}

export function InventoryFAB({
  onAdd,
  onScan,
}: {
  onAdd: () => void;
  onScan?: () => void;
}) {
  const actions: FABAction[] = [{ icon: Plus, label: "Neues Produkt", onClick: onAdd }];

  if (onScan) {
    actions.push({ icon: Plus, label: "Barcode scannen", onClick: onScan });
  }

  return <FAB icon={Plus} actions={actions} />;
}
