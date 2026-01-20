"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapPoints?: number[];
  children: React.ReactNode;
  title?: string;
  description?: string;
  showHandle?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  snapPoints,
  children,
  title,
  description,
  showHandle = true,
  showCloseButton = true,
  className,
}: BottomSheetProps) {
  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      shouldScaleBackground
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[96vh] flex-col rounded-t-2xl bg-white",
            "pb-safe",
            className
          )}
        >
          {showHandle && (
            <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-slate-300" />
          )}

          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div className="flex-1">
                {title && (
                  <DrawerPrimitive.Title className="text-lg font-semibold text-slate-900">
                    {title}
                  </DrawerPrimitive.Title>
                )}
                {description && (
                  <DrawerPrimitive.Description className="text-sm text-slate-500 mt-0.5">
                    {description}
                  </DrawerPrimitive.Description>
                )}
              </div>
              {showCloseButton && (
                <DrawerPrimitive.Close className="rounded-full p-2 -mr-2 hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation">
                  <X className="h-5 w-5 text-slate-500" />
                  <span className="sr-only">Schließen</span>
                </DrawerPrimitive.Close>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}

// Sub-components for easier composition
export function BottomSheetHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-4 pb-4 border-b border-slate-100", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function BottomSheetBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-4 py-4", className)} {...props}>
      {children}
    </div>
  );
}

export function BottomSheetFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-4 py-4 border-t border-slate-100 bg-white mt-auto",
        "pb-safe",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
