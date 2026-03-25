import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/http";

const AuthContext = createContext(null);

const STORAGE_KEY = "oee.auth.token";

function getStoredToken() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function setStoredToken(token) {
  try {
    if (!token) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // ignore
  }
}

function rank(role) {
  if (role === "manager") return 3;
  if (role === "supervisor") return 2;
  if (role === "operator") return 1;
  return 0;
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides JWT auth + user info to the React tree. */
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    setStoredToken("");
    setToken("");
    setUser(null);
    setError(null);
    setLoading(false);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await apiRequest("/auth/me", { token });
    if (!res.ok) {
      logout();
      setError(new Error(res.json?.error || "Session expired"));
      return;
    }

    setUser(res.json?.user || null);
    setLoading(false);
  }, [logout, token]);

  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    setError(null);

    const res = await apiRequest("/auth/login", { method: "POST", body: { email, password } });
    if (!res.ok) {
      setLoading(false);
      setError(new Error(res.json?.error || "Login failed"));
      return { ok: false, error: res.json?.error || "Login failed" };
    }

    const t = res.json?.token || "";
    setStoredToken(t);
    setToken(t);
    setUser(res.json?.user || null);
    setLoading(false);
    return { ok: true };
  }, []);

  const register = useCallback(async ({ name, email, role, password }) => {
    setLoading(true);
    setError(null);

    const res = await apiRequest("/auth/register", {
      method: "POST",
      body: { name, email, role, password },
    });

    if (!res.ok) {
      setLoading(false);
      setError(new Error(res.json?.error || "Registration failed"));
      return { ok: false, error: res.json?.error || "Registration failed" };
    }

    const t = res.json?.token || "";
    setStoredToken(t);
    setToken(t);
    setUser(res.json?.user || null);
    setLoading(false);
    return { ok: true };
  }, []);

  const hasRole = useCallback(
    (minRole) => {
      const r = user?.role || "";
      return rank(r) >= rank(minRole);
    },
    [user]
  );

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      error,
      login,
      register,
      logout,
      refreshMe,
      hasRole,
    }),
    [token, user, loading, error, login, register, logout, refreshMe, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access auth state and actions. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}
