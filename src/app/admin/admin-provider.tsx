"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AdminContextType {
  isAdmin: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  token: string | null;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("electrobase_admin_token");
    if (saved) {
      setToken(saved);
    }
  }, []);

  const login = async (password: string) => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        localStorage.setItem("electrobase_admin_token", password);
        setToken(password);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem("electrobase_admin_token");
    setToken(null);
    router.push("/admin");
  };

  // Guard routing redirect
  useEffect(() => {
    if (!mounted) return;
    const isLoginPage = pathname === "/admin";
    if (pathname.startsWith("/admin") && !isLoginPage && !token) {
      router.push("/admin");
    }
  }, [pathname, token, mounted, router]);

  return (
    <AdminContext.Provider value={{ isAdmin: !!token, login, logout, token }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}
