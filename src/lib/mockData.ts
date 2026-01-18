// Mock data for the Restaurant Inventory System

import type { User, Supplier, Product, UploadedDocument, Anomaly, SpendingData } from '@/types';

export const DEMO_USERS: User[] = [
    {
        id: '1',
        email: 'admin@restaurant.de',
        name: 'Max Mustermann',
        role: 'admin',
        createdAt: '2024-01-01',
    },
    {
        id: '2',
        email: 'manager@restaurant.de',
        name: 'Anna Schmidt',
        role: 'manager',
        createdAt: '2024-02-15',
    },
    {
        id: '3',
        email: 'mitarbeiter@restaurant.de',
        name: 'Thomas Weber',
        role: 'staff',
        createdAt: '2024-03-20',
    },
];

export const DEMO_SUPPLIERS: Supplier[] = [
    {
        id: '1',
        name: 'Metro Cash & Carry',
        contactPerson: 'Herr Müller',
        email: 'bestellung@metro.de',
        phone: '+49 211 12345-0',
        address: 'Metro-Straße 1, 40235 Düsseldorf',
        category: 'Großhandel',
        rating: 4.5,
        createdAt: '2024-01-01',
    },
    {
        id: '2',
        name: 'EDEKA Foodservice',
        contactPerson: 'Frau Schneider',
        email: 'foodservice@edeka.de',
        phone: '+49 40 6377-0',
        address: 'New-York-Ring 6, 22297 Hamburg',
        category: 'Lebensmittel',
        rating: 4.2,
        createdAt: '2024-01-15',
    },
    {
        id: '3',
        name: 'Transgourmet',
        contactPerson: 'Herr Fischer',
        email: 'kontakt@transgourmet.de',
        phone: '+49 6107 7590-0',
        address: 'Max-Planck-Straße 5, 63128 Dietzenbach',
        category: 'Großhandel',
        rating: 4.0,
        createdAt: '2024-02-01',
    },
    {
        id: '4',
        name: 'Frische Paradies',
        contactPerson: 'Herr Becker',
        email: 'info@frischeparadies.de',
        phone: '+49 30 347005-0',
        address: 'Morsestraße 2, 10587 Berlin',
        category: 'Frische Produkte',
        rating: 4.8,
        createdAt: '2024-02-15',
    },
    {
        id: '5',
        name: 'Getränke Hoffmann',
        contactPerson: 'Frau Hoffmann',
        email: 'bestellung@getraenke-hoffmann.de',
        phone: '+49 30 123456-0',
        address: 'Berliner Str. 100, 10713 Berlin',
        category: 'Getränke',
        rating: 4.3,
        createdAt: '2024-03-01',
    },
];

export const DEMO_PRODUCTS: Product[] = [
    // Fleisch
    { id: '1', name: 'Rinderfilet', category: 'fleisch', unit: 'kg', currentStock: 15, minStock: 10, avgPrice: 42.50, supplierId: '1' },
    { id: '2', name: 'Schweinebauch', category: 'fleisch', unit: 'kg', currentStock: 8, minStock: 5, avgPrice: 12.80, supplierId: '1' },
    { id: '3', name: 'Hähnchenbrust', category: 'fleisch', unit: 'kg', currentStock: 3, minStock: 8, avgPrice: 8.90, supplierId: '2' },
    // Fisch
    { id: '4', name: 'Lachs frisch', category: 'fisch', unit: 'kg', currentStock: 5, minStock: 3, avgPrice: 28.00, supplierId: '4' },
    { id: '5', name: 'Dorade', category: 'fisch', unit: 'kg', currentStock: 2, minStock: 2, avgPrice: 18.50, supplierId: '4' },
    // Gemüse
    { id: '6', name: 'Tomaten', category: 'gemuese', unit: 'kg', currentStock: 20, minStock: 10, avgPrice: 3.50, supplierId: '2' },
    { id: '7', name: 'Zwiebeln', category: 'gemuese', unit: 'kg', currentStock: 25, minStock: 15, avgPrice: 1.80, supplierId: '2' },
    { id: '8', name: 'Paprika mix', category: 'gemuese', unit: 'kg', currentStock: 4, minStock: 8, avgPrice: 4.20, supplierId: '2' },
    { id: '9', name: 'Salat Kopf', category: 'gemuese', unit: 'Stück', currentStock: 30, minStock: 20, avgPrice: 1.50, supplierId: '2' },
    // Milchprodukte
    { id: '10', name: 'Butter', category: 'milchprodukte', unit: 'kg', currentStock: 10, minStock: 5, avgPrice: 8.50, supplierId: '3' },
    { id: '11', name: 'Sahne 30%', category: 'milchprodukte', unit: 'Liter', currentStock: 15, minStock: 10, avgPrice: 3.20, supplierId: '3' },
    { id: '12', name: 'Parmesan', category: 'milchprodukte', unit: 'kg', currentStock: 3, minStock: 2, avgPrice: 22.00, supplierId: '4' },
    // Getränke
    { id: '13', name: 'Mineralwasser', category: 'getraenke', unit: 'Kiste', currentStock: 50, minStock: 30, avgPrice: 8.50, supplierId: '5' },
    { id: '14', name: 'Cola 0.33l', category: 'getraenke', unit: 'Kiste', currentStock: 20, minStock: 15, avgPrice: 18.00, supplierId: '5' },
    { id: '15', name: 'Weißwein Haus', category: 'getraenke', unit: 'Flasche', currentStock: 24, minStock: 12, avgPrice: 6.50, supplierId: '5' },
    // Gewürze
    { id: '16', name: 'Olivenöl Extra', category: 'gewuerze', unit: 'Liter', currentStock: 8, minStock: 5, avgPrice: 12.00, supplierId: '4' },
    { id: '17', name: 'Salz grob', category: 'gewuerze', unit: 'kg', currentStock: 5, minStock: 3, avgPrice: 2.50, supplierId: '3' },
    { id: '18', name: 'Pfeffer schwarz', category: 'gewuerze', unit: 'kg', currentStock: 2, minStock: 1, avgPrice: 18.00, supplierId: '3' },
    // Backwaren
    { id: '19', name: 'Baguette', category: 'backwaren', unit: 'Stück', currentStock: 10, minStock: 8, avgPrice: 1.20, supplierId: '2' },
    { id: '20', name: 'Ciabatta', category: 'backwaren', unit: 'Stück', currentStock: 6, minStock: 5, avgPrice: 1.80, supplierId: '2' },
];

export const DEMO_DOCUMENTS: UploadedDocument[] = [
    {
        id: '1',
        type: 'invoice',
        fileName: 'Rechnung_Metro_2024-01-15.pdf',
        uploadDate: '2024-01-15',
        supplierName: 'Metro Cash & Carry',
        documentDate: '2024-01-15',
        totalAmount: 1250.80,
        status: 'approved',
        items: [
            { name: 'Rinderfilet', quantity: 10, unit: 'kg', unitPrice: 45.00, totalPrice: 450.00 },
            { name: 'Schweinebauch', quantity: 15, unit: 'kg', unitPrice: 12.80, totalPrice: 192.00 },
            { name: 'Hähnchenbrust', quantity: 20, unit: 'kg', unitPrice: 8.90, totalPrice: 178.00 },
        ],
        anomalies: [],
    },
    {
        id: '2',
        type: 'invoice',
        fileName: 'Rechnung_Metro_2024-01-22.pdf',
        uploadDate: '2024-01-22',
        supplierName: 'Metro Cash & Carry',
        documentDate: '2024-01-22',
        totalAmount: 980.50,
        status: 'analyzed',
        items: [
            { name: 'Rinderfilet', quantity: 8, unit: 'kg', unitPrice: 52.00, totalPrice: 416.00 },
            { name: 'Lachs frisch', quantity: 10, unit: 'kg', unitPrice: 28.00, totalPrice: 280.00 },
        ],
        anomalies: [
            {
                id: 'a1',
                type: 'price_increase',
                severity: 'high',
                title: 'Rinderfilet: +15.5% Preiserhöhung',
                description: 'Der Preis für Rinderfilet ist von €45.00 auf €52.00 pro kg gestiegen.',
                documentId: '2',
                productId: '1',
                detectedAt: '2024-01-22',
                resolved: false,
            },
        ],
    },
    {
        id: '3',
        type: 'delivery_note',
        fileName: 'Lieferschein_EDEKA_2024-01-18.pdf',
        uploadDate: '2024-01-18',
        supplierName: 'EDEKA Foodservice',
        documentDate: '2024-01-18',
        totalAmount: 0,
        status: 'approved',
        items: [
            { name: 'Tomaten', quantity: 30, unit: 'kg', unitPrice: 0, totalPrice: 0 },
            { name: 'Zwiebeln', quantity: 25, unit: 'kg', unitPrice: 0, totalPrice: 0 },
            { name: 'Paprika mix', quantity: 15, unit: 'kg', unitPrice: 0, totalPrice: 0 },
        ],
        anomalies: [],
    },
    {
        id: '4',
        type: 'invoice',
        fileName: 'Rechnung_Transgourmet_2024-01-20.pdf',
        uploadDate: '2024-01-20',
        supplierName: 'Transgourmet',
        documentDate: '2024-01-20',
        totalAmount: 456.30,
        status: 'pending',
        items: [
            { name: 'Butter', quantity: 20, unit: 'kg', unitPrice: 8.50, totalPrice: 170.00 },
            { name: 'Sahne 30%', quantity: 40, unit: 'Liter', unitPrice: 3.20, totalPrice: 128.00 },
        ],
        anomalies: [
            {
                id: 'a5',
                type: 'missing_delivery_note',
                severity: 'medium',
                title: 'Lieferschein fehlt',
                description: 'Zu dieser Rechnung wurde systemseitig noch kein passender Lieferschein gefunden.',
                documentId: '4',
                supplierId: '3',
                detectedAt: '2024-01-20',
                resolved: false,
            }
        ],
    },
];

export const DEMO_ANOMALIES: Anomaly[] = [
    {
        id: 'a1',
        type: 'price_increase',
        severity: 'high',
        title: 'Rinderfilet: +15.5% Preiserhöhung',
        description: 'Der Preis für Rinderfilet ist von €45.00 auf €52.00 pro kg gestiegen.',
        documentId: '2',
        productId: '1',
        supplierId: '1',
        detectedAt: '2024-01-22',
        resolved: false,
    },
    {
        id: 'a5',
        type: 'missing_delivery_note',
        severity: 'medium',
        title: 'Transgourmet: Lieferschein fehlt',
        description: 'Rechnung vom 20.01.2024 ohne zugehörigen Lieferschein.',
        documentId: '4',
        supplierId: '3',
        detectedAt: '2024-01-20',
        resolved: false,
    },
    {
        id: 'a2',
        type: 'low_stock',
        severity: 'medium',
        title: 'Hähnchenbrust: Niedriger Bestand',
        description: 'Aktueller Bestand (3 kg) liegt unter dem Mindestbestand (8 kg).',
        productId: '3',
        detectedAt: '2024-01-23',
        resolved: false,
    },
    {
        id: 'a3',
        type: 'low_stock',
        severity: 'medium',
        title: 'Paprika mix: Niedriger Bestand',
        description: 'Aktueller Bestand (4 kg) liegt unter dem Mindestbestand (8 kg).',
        productId: '8',
        detectedAt: '2024-01-23',
        resolved: false,
    },
    {
        id: 'a4',
        type: 'unusual_quantity',
        severity: 'low',
        title: 'Tomaten: Ungewöhnliche Bestellmenge',
        description: 'Die letzte Lieferung (30 kg) ist 50% höher als der Durchschnitt.',
        documentId: '3',
        productId: '6',
        detectedAt: '2024-01-18',
        resolved: true,
    },
];

export const DEMO_SPENDING_DATA: SpendingData[] = [
    { month: 'Aug', amount: 12500 },
    { month: 'Sep', amount: 14200 },
    { month: 'Okt', amount: 13800 },
    { month: 'Nov', amount: 15600 },
    { month: 'Dez', amount: 18200 },
    { month: 'Jan', amount: 14800 },
];

// Demo credentials
export const DEMO_CREDENTIALS = {
    admin: { email: 'admin@restaurant.de', password: 'admin123' },
    manager: { email: 'manager@restaurant.de', password: 'manager123' },
    staff: { email: 'mitarbeiter@restaurant.de', password: 'staff123' },
};
