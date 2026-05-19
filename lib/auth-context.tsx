"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/api";
import type {
  AuthRegisterContract,
  AuthResendVerificationContract,
  AuthUserContract,
} from "@/lib/contracts";

export type AuthUser = AuthUserContract;

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  /** True after localStorage has been read */
  bootstrapped: boolean;
  /** True while validating JWT via /api/auth/me */
  loading: boolean;
  /** bootstrapped && !loading */
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<AuthRegisterContract>;
  verifyRegistration: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<AuthResendVerificationContract>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const JWT_KEY = "optionsaji_jwt";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [loading, setLoading] = useState(true);

  const persistToken = useCallback((value: string | null) => {
    setTokenState(value);
    try {
      if (value) window.localStorage.setItem(JWT_KEY, value);
      else window.localStorage.removeItem(JWT_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(JWT_KEY);
      setTokenState(stored);
    } catch {
      setTokenState(null);
    } finally {
      setBootstrapped(true);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    const t = token;
    if (!t) {
      setUser(null);
      return;
    }
    try {
      const data = await api.auth.me(t);
      setUser(data);
    } catch {
      persistToken(null);
      setUser(null);
    }
  }, [token, persistToken]);

  useEffect(() => {
    if (!bootstrapped) return;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    refreshMe().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [bootstrapped, token, refreshMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api.auth.login({ email, password });
      persistToken(data.access_token);
      setUser(data.user);
      setLoading(false);
    },
    [persistToken],
  );

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      return api.auth.register({
        email,
        password,
        display_name: displayName?.trim() || null,
      });
    },
    [],
  );

  const verifyRegistration = useCallback(
    async (email: string, code: string) => {
      const data = await api.auth.verifyRegister({
        email,
        code,
      });
      persistToken(data.access_token);
      setUser(data.user);
      setLoading(false);
    },
    [persistToken],
  );

  const resendVerification = useCallback(async (email: string) => {
    return api.auth.resendVerification(email.trim());
  }, []);

  const logout = useCallback(async () => {
    const t = token;
    if (t) {
      try {
        await api.auth.logout(t);
      } catch {
        /* ignore */
      }
    }
    persistToken(null);
    setUser(null);
    setLoading(false);
  }, [token, persistToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      bootstrapped,
      loading,
      ready: bootstrapped && !loading,
      login,
      register,
      verifyRegistration,
      resendVerification,
      logout,
      refreshMe,
      isAdmin: user?.role === "admin",
    }),
    [
      token,
      user,
      bootstrapped,
      loading,
      login,
      register,
      verifyRegistration,
      resendVerification,
      logout,
      refreshMe,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
