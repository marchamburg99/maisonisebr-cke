// Types for the Restaurant Inventory Management System

export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar?: string;
    createdAt: string;
}

export interface Supplier {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    category: string;
    rating: number;
    createdAt: string;
}

export interface Product {
    id: string;
    name: string;
    category: ProductCategory;
    unit: string;
    currentStock: number;
    minStock: number;
    avgPrice: number;
    supplierId: string;
    lastOrderDate?: string;
}

export type ProductCategory =
    | 'fleisch'
    | 'fisch'
    | 'gemuese'
    | 'obst'
    | 'milchprodukte'
    | 'getraenke'
    | 'gewuerze'
    | 'backwaren'
    | 'sonstiges';

export const PRODUCT_CATEGORIES: Record<ProductCategory, string> = {
    fleisch: 'Fleisch & Wurst',
    fisch: 'Fisch & Meeresfrüchte',
    gemuese: 'Gemüse',
    obst: 'Obst',
    milchprodukte: 'Milchprodukte',
    getraenke: 'Getränke',
    gewuerze: 'Gewürze & Kräuter',
    backwaren: 'Backwaren',
    sonstiges: 'Sonstiges',
};

export type DocumentType = 'invoice' | 'delivery_note';

export interface DocumentItem {
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
}

export interface UploadedDocument {
    id: string;
    type: DocumentType;
    fileName: string;
    uploadDate: string;
    supplierName: string;
    documentDate: string;
    totalAmount: number;
    items: DocumentItem[];
    status: 'pending' | 'analyzed' | 'approved' | 'rejected';
    anomalies: Anomaly[];
}

export type AnomalyType =
    | 'price_increase'
    | 'price_decrease'
    | 'unusual_quantity'
    | 'missing_delivery'
    | 'missing_delivery_note'
    | 'duplicate_invoice'
    | 'new_supplier'
    | 'low_stock';

export interface Anomaly {
    id: string;
    type: AnomalyType;
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    documentId?: string;
    productId?: string;
    supplierId?: string;
    detectedAt: string;
    resolved: boolean;
}

export const ANOMALY_LABELS: Record<AnomalyType, string> = {
    price_increase: 'Preiserhöhung',
    price_decrease: 'Preissenkung',
    unusual_quantity: 'Ungewöhnliche Menge',
    missing_delivery: 'Fehlende Lieferung',
    missing_delivery_note: 'Fehlender Lieferschein',
    duplicate_invoice: 'Doppelte Rechnung',
    new_supplier: 'Neuer Lieferant',
    low_stock: 'Niedriger Bestand',
};

export interface DashboardStats {
    totalSpendingThisMonth: number;
    spendingChange: number;
    documentsPending: number;
    lowStockItems: number;
    activeSuppliers: number;
    openAnomalies: number;
}

export interface SpendingData {
    month: string;
    amount: number;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
}
