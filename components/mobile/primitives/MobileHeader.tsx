"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileHeaderAction {
  icon: LucideIcon;
  onClick: () => void;
  label: string;
}

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: MobileHeaderAction[];
  largeTitle?: boolean;
  className?: string;
}

export function MobileHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  actions,
  largeTitle = false,
  className,
}: MobileHeaderProps) {
  const router = useRouter();
  const { scrollY } = useScroll();

  // Large title transforms
  const largeTitleOpacity = useTransform(scrollY, [0, 50], [1, 0]);
  const largeTitleY = useTransform(scrollY, [0, 50], [0, -20]);
  const smallTitleOpacity = useTransform(scrollY, [30, 60], [0, 1]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  if (!largeTitle) {
    // Simple header without large title mode
    return (
      <header
        className={cn(
          "sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-100",
          "px-4 h-14 flex items-center gap-3 md:hidden",
          "safe-area-pt",
          className
        )}
      >
        {showBack && (
          <button
            onClick={handleBack}
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
            <span className="sr-only">Zurück</span>
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-slate-900 truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-500 truncate">{subtitle}</p>
          )}
        </div>

        {actions && actions.length > 0 && (
          <div className="flex items-center gap-1 -mr-2">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
              >
                <action.icon className="h-5 w-5 text-slate-700" />
                <span className="sr-only">{action.label}</span>
              </button>
            ))}
          </div>
        )}
      </header>
    );
  }

  // Large title mode (iOS-style)
  return (
    <div className={cn("md:hidden", className)}>
      {/* Compact header (visible when scrolled) */}
      <motion.header
        className={cn(
          "sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-100",
          "px-4 h-14 flex items-center gap-3",
          "safe-area-pt"
        )}
        style={{ opacity: smallTitleOpacity }}
      >
        {showBack && (
          <button
            onClick={handleBack}
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
            <span className="sr-only">Zurück</span>
          </button>
        )}

        <h1 className="flex-1 font-semibold text-slate-900 truncate text-center">
          {title}
        </h1>

        {actions && actions.length > 0 && (
          <div className="flex items-center gap-1 -mr-2">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
              >
                <action.icon className="h-5 w-5 text-slate-700" />
                <span className="sr-only">{action.label}</span>
              </button>
            ))}
          </div>
        )}
      </motion.header>

      {/* Large title section */}
      <motion.div
        className="px-4 pb-2 pt-2 bg-white"
        style={{ opacity: largeTitleOpacity, y: largeTitleY }}
      >
        {showBack && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-amber-600 mb-2 -ml-1 touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Zurück</span>
          </button>
        )}
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </motion.div>
    </div>
  );
}

// Context for managing header state across nested components
interface MobileHeaderContextValue {
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string | undefined) => void;
  setShowBack: (show: boolean) => void;
  setActions: (actions: MobileHeaderAction[]) => void;
}

const MobileHeaderContext = React.createContext<MobileHeaderContextValue | null>(null);

export function MobileHeaderProvider({
  children,
  initialTitle = "",
}: {
  children: React.ReactNode;
  initialTitle?: string;
}) {
  const [title, setTitle] = React.useState(initialTitle);
  const [subtitle, setSubtitle] = React.useState<string | undefined>();
  const [showBack, setShowBack] = React.useState(false);
  const [actions, setActions] = React.useState<MobileHeaderAction[]>([]);

  return (
    <MobileHeaderContext.Provider
      value={{ setTitle, setSubtitle, setShowBack, setActions }}
    >
      <MobileHeader
        title={title}
        subtitle={subtitle}
        showBack={showBack}
        actions={actions}
      />
      {children}
    </MobileHeaderContext.Provider>
  );
}

export function useMobileHeader() {
  const context = React.useContext(MobileHeaderContext);
  if (!context) {
    throw new Error("useMobileHeader must be used within MobileHeaderProvider");
  }
  return context;
}
