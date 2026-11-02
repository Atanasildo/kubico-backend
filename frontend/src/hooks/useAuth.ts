"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { authApi, tokenStorage } from "@/lib/api";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AuthContext = createContext<AuthState>(null as any);

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (token) {
      refresh().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    tokenStorage.set(data.access_token, data.refresh_token);
    const me = await authApi.me();
    setUser(me.data);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  return { user, loading, login, logout, refresh };
}

// Provider component (used in app/layout.tsx via a client wrapper)
import React from "react";
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthProvider();
  return React.createElement(AuthContext.Provider, { value: auth }, children);
}
