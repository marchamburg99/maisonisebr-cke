"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { LucideIcon, Package, FileText, Users, Truck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4"
      >
        <Icon className="h-8 w-8 text-slate-400" />
      </motion.div>

      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>

      {description && (
        <p className="text-sm text-slate-500 max-w-[240px] mb-4">{description}</p>
      )}

      {action && (
        <Button
          onClick={action.onClick}
          className="bg-amber-500 hover:bg-amber-600"
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

// Preset empty states
export function EmptyProductsState({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Package}
      title="Keine Produkte"
      description="Fügen Sie Ihr erstes Produkt hinzu, um den Bestand zu verwalten."
      action={onAdd ? { label: "Produkt hinzufügen", onClick: onAdd } : undefined}
    />
  );
}

export function EmptyDocumentsState({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="Keine Dokumente"
      description="Laden Sie Ihr erstes Dokument hoch, um es zu analysieren."
      action={onUpload ? { label: "Dokument hochladen", onClick: onUpload } : undefined}
    />
  );
}

export function EmptySuppliersState({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Truck}
      title="Keine Lieferanten"
      description="Fügen Sie Ihren ersten Lieferanten hinzu."
      action={onAdd ? { label: "Lieferant hinzufügen", onClick: onAdd } : undefined}
    />
  );
}

export function EmptyUsersState({ onInvite }: { onInvite?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="Keine Benutzer"
      description="Laden Sie Teammitglieder ein, um zusammenzuarbeiten."
      action={onInvite ? { label: "Benutzer einladen", onClick: onInvite } : undefined}
    />
  );
}

export function EmptySearchState({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={Search}
      title="Keine Ergebnisse"
      description={
        query
          ? `Keine Ergebnisse für "${query}" gefunden.`
          : "Versuchen Sie eine andere Suchanfrage."
      }
    />
  );
}
