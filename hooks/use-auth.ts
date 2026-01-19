"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

export function useAuth() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("session_token");
    setToken(storedToken);
    setIsInitialized(true);
  }, []);

  const user = useQuery(
    api.auth.getSession,
    isInitialized && token ? { token } : "skip"
  );

  const loginMutation = useMutation(api.auth.login);
  const logoutMutation = useMutation(api.auth.logout);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginMutation({ email, password });
      if (result) {
        localStorage.setItem("session_token", result.token);
        setToken(result.token);
        router.push("/");
        return true;
      }
      return false;
    },
    [loginMutation, router]
  );

  const logout = useCallback(async () => {
    if (token) {
      await logoutMutation({ token });
      localStorage.removeItem("session_token");
      setToken(null);
      router.push("/login");
    }
  }, [token, logoutMutation, router]);

  return {
    user: user ?? null,
    isAuthenticated: !!user,
    isLoading: !isInitialized || (token !== null && user === undefined),
    login,
    logout,
  };
}
