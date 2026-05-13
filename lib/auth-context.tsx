"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AuthUser = {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string | null;
  email_verified: boolean;
};

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
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const JWT_KEY = "optionsaji_jwt";

function parseErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "请求失败";
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (
    detail &&
    typeof detail === "object" &&
    "message" in detail &&
    typeof (detail as { message: unknown }).message === "string"
  ) {
    return (detail as { message: string }).message;
  }
  return "请求失败";
}

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
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) {
      persistToken(null);
      setUser(null);
      return;
    }
    const data = (await res.json()) as AuthUser;
    setUser(data);
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const raw = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseErrorMessage(raw));
      const data = raw as { access_token: string; user: AuthUser };
      persistToken(data.access_token);
      setUser(data.user);
      setLoading(false);
    },
    [persistToken],
  );

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email,
          password,
          display_name: displayName?.trim() || null,
        }),
      });
      const raw = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseErrorMessage(raw));
      const data = raw as { access_token: string; user: AuthUser };
      persistToken(data.access_token);
      setUser(data.user);
      setLoading(false);
    },
    [persistToken],
  );

  const logout = useCallback(async () => {
    const t = token;
    if (t) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${t}` },
        });
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
      logout,
      refreshMe,
      isAdmin: user?.role === "admin",
    }),
    [token, user, bootstrapped, loading, login, register, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
