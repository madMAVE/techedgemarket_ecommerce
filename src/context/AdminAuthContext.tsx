"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, setAuthToken, getAuthToken, clearAuthToken } from "@/lib/interceptor";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AdminAuthContextValue {
  user: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = getAuthToken();
        if (token) {
          const res = await api.get<any>("/api/admin/me");
          setUser(res.data);
        }
      } catch {
        clearAuthToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post<any>("/api/admin/login", { username, password });
    const payload = res.data?.data ?? res.data;
    if (payload?.token) {
      setAuthToken(payload.token);
    }
    setUser(payload.user || payload);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/admin/logout", {});
    } catch {
      // Ignore logout errors
    }
    clearAuthToken();
    setUser(null);
  }, []);

  const checkAuth = useCallback(async () => {
    if (user) return true;
    try {
      const res = await api.get<any>("/api/admin/me");
      setUser(res.data);
      return true;
    } catch {
      clearAuthToken();
      setUser(null);
      return false;
    }
  }, [user]);

  const isAuthenticated = !!user;

  return (
    <AdminAuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, checkAuth }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  return ctx;
}
