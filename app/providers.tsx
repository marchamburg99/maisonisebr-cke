"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </ConvexProvider>
  );
}
