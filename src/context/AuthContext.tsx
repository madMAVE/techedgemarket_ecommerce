"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, setAuthToken, getAuthToken, clearAuthToken } from "@/lib/interceptor";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string | null;
  phone: string | null;
  gstin: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, company?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    const token = getAuthToken();
    if (!token) { setLoading(false); return; }
    try {
      const res = await api.get<any>("/api/auth/me");
      const userData = res.data?.data ?? res.data;
      setUser(userData);
    } catch {
      clearAuthToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const res = await api.post<any>("/api/auth/login", { email, password });
    const data = res.data?.data ?? res.data;
    setAuthToken(data.accessToken);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string, company?: string) => {
    const res = await api.post<any>("/api/auth/register", { name, email, password, company });
    const data = res.data?.data ?? res.data;
    setAuthToken(data.accessToken);
    setUser(data.user);
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
