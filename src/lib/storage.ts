// LocalStorage management for the Restaurant Inventory System

const STORAGE_KEYS = {
    AUTH: 'wws_auth',
    USERS: 'wws_users',
    SUPPLIERS: 'wws_suppliers',
    PRODUCTS: 'wws_products',
    DOCUMENTS: 'wws_documents',
    ANOMALIES: 'wws_anomalies',
} as const;

export function getStorageItem<T>(key: string): T | null {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch {
        return null;
    }
}

export function setStorageItem<T>(key: string, value: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

export function removeStorageItem(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing from localStorage:', error);
    }
}

export { STORAGE_KEYS };
