"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetFooter,
} from "@/components/mobile/primitives/BottomSheet";
import { cn } from "@/lib/utils";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        className={className}
      >
        <BottomSheetBody>{children}</BottomSheetBody>
      </BottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}

// Composite components for responsive dialog parts
interface ResponsiveDialogHeaderProps {
  title?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ResponsiveDialogHeader({
  title,
  description,
  className,
  children,
}: ResponsiveDialogHeaderProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    // On mobile, header is handled by BottomSheet itself
    return children ? (
      <div className={cn("px-4 pb-2", className)}>{children}</div>
    ) : null;
  }

  return (
    <DialogHeader className={className}>
      {title && <DialogTitle>{title}</DialogTitle>}
      {description && <DialogDescription>{description}</DialogDescription>}
      {children}
    </DialogHeader>
  );
}

interface ResponsiveDialogBodyProps {
  className?: string;
  children: React.ReactNode;
}

export function ResponsiveDialogBody({
  className,
  children,
}: ResponsiveDialogBodyProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <BottomSheetBody className={className}>{children}</BottomSheetBody>;
  }

  return <div className={cn("py-4", className)}>{children}</div>;
}

interface ResponsiveDialogFooterProps {
  className?: string;
  children: React.ReactNode;
}

export function ResponsiveDialogFooter({
  className,
  children,
}: ResponsiveDialogFooterProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <BottomSheetFooter className={className}>{children}</BottomSheetFooter>
    );
  }

  return <DialogFooter className={className}>{children}</DialogFooter>;
}

// Full composition helper
interface ResponsiveDialogComposedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  body: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function ResponsiveDialogComposed({
  open,
  onOpenChange,
  title,
  description,
  body,
  footer,
  className,
}: ResponsiveDialogComposedProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        className={className}
      >
        <BottomSheetBody>{body}</BottomSheetBody>
        {footer && <BottomSheetFooter>{footer}</BottomSheetFooter>}
      </BottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {body}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
