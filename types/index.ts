// Types for the Restaurant Inventory Management System

export type UserRole = "admin" | "manager" | "staff";

export type ProductCategory =
  | "fleisch"
  | "fisch"
  | "gemuese"
  | "obst"
  | "milchprodukte"
  | "getraenke"
  | "gewuerze"
  | "backwaren"
  | "sonstiges";

export const PRODUCT_CATEGORIES: Record<ProductCategory, string> = {
  fleisch: "Fleisch & Wurst",
  fisch: "Fisch & Meeresfrüchte",
  gemuese: "Gemüse",
  obst: "Obst",
  milchprodukte: "Milchprodukte",
  getraenke: "Getränke",
  gewuerze: "Gewürze & Kräuter",
  backwaren: "Backwaren",
  sonstiges: "Sonstiges",
};

export type DocumentType = "invoice" | "delivery_note";

export type DocumentStatus = "pending" | "analyzed" | "approved" | "rejected";

export type AnomalyType =
  | "price_increase"
  | "price_decrease"
  | "unusual_quantity"
  | "missing_delivery"
  | "missing_delivery_note"
  | "duplicate_invoice"
  | "new_supplier"
  | "low_stock";

export type SeverityType = "low" | "medium" | "high";

export const ANOMALY_LABELS: Record<AnomalyType, string> = {
  price_increase: "Preiserhöhung",
  price_decrease: "Preissenkung",
  unusual_quantity: "Ungewöhnliche Menge",
  missing_delivery: "Fehlende Lieferung",
  missing_delivery_note: "Fehlender Lieferschein",
  duplicate_invoice: "Doppelte Rechnung",
  new_supplier: "Neuer Lieferant",
  low_stock: "Niedriger Bestand",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  manager: "Manager",
  staff: "Mitarbeiter",
};

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

// Demo credentials for login page display
export const DEMO_CREDENTIALS = {
  admin: { email: "admin@restaurant.de", password: "admin123" },
  manager: { email: "manager@restaurant.de", password: "manager123" },
  staff: { email: "mitarbeiter@restaurant.de", password: "staff123" },
};
