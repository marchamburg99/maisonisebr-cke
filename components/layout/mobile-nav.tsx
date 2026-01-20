"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Package,
  Truck,
  Settings,
  LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  badgeKey?: "lowStock" | "pendingDocs" | "anomalies";
}

const navItems: NavItem[] = [
  { label: "Home", icon: LayoutDashboard, href: "/" },
  { label: "Dokumente", icon: FileText, href: "/documents", badgeKey: "pendingDocs" },
  { label: "Bestand", icon: Package, href: "/inventory", badgeKey: "lowStock" },
  { label: "Lieferanten", icon: Truck, href: "/suppliers" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

// Haptic feedback utility
function triggerHaptic(type: "light" | "medium" | "heavy" = "light") {
  if ("vibrate" in navigator) {
    const patterns = {
      light: 5,
      medium: 10,
      heavy: 20,
    };
    navigator.vibrate(patterns[type]);
  }
}

interface NavBadgeProps {
  count: number;
}

function NavBadge({ count }: NavBadgeProps) {
  if (count <= 0) return null;

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className={cn(
        "absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full",
        "bg-red-500 text-white text-[9px] font-bold",
        "flex items-center justify-center"
      )}
    >
      {count > 99 ? "99+" : count}
    </motion.span>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  // Fetch badge counts from Convex
  const products = useQuery(api.products.list);
  const documents = useQuery(api.documents.list);

  // Calculate badge counts
  const badgeCounts = React.useMemo(() => {
    const lowStock = products?.filter(
      (p) => p.currentStock < p.minStock
    ).length ?? 0;

    const pendingDocs = documents?.filter(
      (d) => d.status === "pending"
    ).length ?? 0;

    return {
      lowStock,
      pendingDocs,
      anomalies: 0,
    };
  }, [products, documents]);

  const handleNavClick = (href: string) => {
    // Only trigger haptic if navigating to a different page
    if (pathname !== href) {
      triggerHaptic("light");
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-slate-200 md:hidden pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full relative touch-manipulation",
                "transition-colors duration-200",
                "active:scale-95"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-2 top-1 h-1 bg-amber-500 rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div
                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="relative"
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 mb-0.5",
                    isActive ? "text-amber-500" : "text-slate-400"
                  )}
                />
                <AnimatePresence>
                  {badgeCount > 0 && <NavBadge count={badgeCount} />}
                </AnimatePresence>
              </motion.div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-amber-500" : "text-slate-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Export haptic utility for use in other components
export { triggerHaptic };
