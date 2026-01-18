// Authentication hook

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';
import { login as authLogin, logout as authLogout, getCurrentUser, initializeAuth } from '@/lib/auth';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        initializeAuth();
        const currentUser = getCurrentUser();
        setUser(currentUser);
        setIsLoading(false);
    }, []);

    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        const loggedInUser = authLogin(email, password);
        if (loggedInUser) {
            setUser(loggedInUser);
            return true;
        }
        return false;
    }, []);

    const logout = useCallback(() => {
        authLogout();
        setUser(null);
    }, []);

    return {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
    };
}
