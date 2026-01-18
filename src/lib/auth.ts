// Authentication utilities

import type { User, AuthState } from '@/types';
import { getStorageItem, setStorageItem, removeStorageItem, STORAGE_KEYS } from './storage';
import { DEMO_USERS, DEMO_CREDENTIALS } from './mockData';

export function initializeAuth(): void {
    // Initialize demo users if not present
    const users = getStorageItem<User[]>(STORAGE_KEYS.USERS);
    if (!users) {
        setStorageItem(STORAGE_KEYS.USERS, DEMO_USERS);
    }
}

export function login(email: string, password: string): User | null {
    // Check demo credentials
    const demoEntry = Object.values(DEMO_CREDENTIALS).find(
        (cred) => cred.email === email && cred.password === password
    );

    if (!demoEntry) {
        return null;
    }

    const users = getStorageItem<User[]>(STORAGE_KEYS.USERS) || DEMO_USERS;
    const user = users.find((u) => u.email === email);

    if (user) {
        const authState: AuthState = {
            user,
            isAuthenticated: true,
        };
        setStorageItem(STORAGE_KEYS.AUTH, authState);
        return user;
    }

    return null;
}

export function logout(): void {
    removeStorageItem(STORAGE_KEYS.AUTH);
}

export function getCurrentUser(): User | null {
    const authState = getStorageItem<AuthState>(STORAGE_KEYS.AUTH);
    return authState?.isAuthenticated ? authState.user : null;
}

export function isAuthenticated(): boolean {
    const authState = getStorageItem<AuthState>(STORAGE_KEYS.AUTH);
    return authState?.isAuthenticated ?? false;
}

export function hasRole(requiredRole: User['role'] | User['role'][]): boolean {
    const user = getCurrentUser();
    if (!user) return false;

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    // Admin has access to everything
    if (user.role === 'admin') return true;

    return roles.includes(user.role);
}

export function getRoleLabel(role: User['role']): string {
    const labels: Record<User['role'], string> = {
        admin: 'Administrator',
        manager: 'Manager',
        staff: 'Mitarbeiter',
    };
    return labels[role];
}
