import { createContext, useContext, useState, ReactNode } from "react";

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  password: string;
  role: "super" | "admin";
  createdAt: string;
}

const ADMINS_KEY = "pawglobal-admin-accounts";
const SESSION_KEY = "pawglobal-admin-session";

const DEFAULT_ADMIN: AdminAccount = {
  id: "admin-1",
  email: "admin@pawglobal.com",
  name: "Super Admin",
  password: "pawglobal2024",
  role: "super",
  createdAt: new Date().toISOString(),
};

function loadAdmins(): AdminAccount[] {
  try {
    const raw = localStorage.getItem(ADMINS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const defaults = [DEFAULT_ADMIN];
  try { localStorage.setItem(ADMINS_KEY, JSON.stringify(defaults)); } catch {}
  return defaults;
}

function saveAdmins(admins: AdminAccount[]) {
  try { localStorage.setItem(ADMINS_KEY, JSON.stringify(admins)); } catch {}
}

function loadCurrentId(): string | null {
  try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; }
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  currentAdmin: AdminAccount | null;
  admins: AdminAccount[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  createAdmin: (data: Omit<AdminAccount, "id" | "createdAt">) => { success: boolean; error?: string };
  updateAdmin: (id: string, data: Partial<AdminAccount>) => { success: boolean; error?: string };
  deleteAdmin: (id: string) => { success: boolean; error?: string };
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admins, setAdmins] = useState<AdminAccount[]>(loadAdmins);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(loadCurrentId);

  const currentAdmin = admins.find(a => a.id === currentAdminId) ?? null;
  const isAuthenticated = currentAdmin !== null;

  const login = (email: string, password: string): boolean => {
    if (email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase() && password === DEFAULT_ADMIN.password) {
      setCurrentAdminId(DEFAULT_ADMIN.id);
      try { sessionStorage.setItem(SESSION_KEY, DEFAULT_ADMIN.id); } catch {}
      return true;
    }
    
    const found = admins.find(
      a => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    );
    if (found) {
      setCurrentAdminId(found.id);
      try { sessionStorage.setItem(SESSION_KEY, found.id); } catch {}
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentAdminId(null);
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  };

  const createAdmin = (data: Omit<AdminAccount, "id" | "createdAt">) => {
    if (admins.some(a => a.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: "An admin with this email already exists." };
    }
    const newAdmin: AdminAccount = {
      ...data,
      id: `admin-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...admins, newAdmin];
    setAdmins(updated);
    saveAdmins(updated);
    return { success: true };
  };

  const updateAdmin = (id: string, data: Partial<AdminAccount>) => {
    const idx = admins.findIndex(a => a.id === id);
    if (idx === -1) return { success: false, error: "Admin not found." };
    if (data.email) {
      const conflict = admins.find(a => a.email.toLowerCase() === data.email!.toLowerCase() && a.id !== id);
      if (conflict) return { success: false, error: "Email already in use." };
    }
    const updated = admins.map(a => a.id === id ? { ...a, ...data } : a);
    setAdmins(updated);
    saveAdmins(updated);
    return { success: true };
  };

  const deleteAdmin = (id: string) => {
    if (id === currentAdminId) return { success: false, error: "Cannot delete yourself." };
    const superAdmins = admins.filter(a => a.role === "super" && a.id !== id);
    if (superAdmins.length === 0 && admins.find(a => a.id === id)?.role === "super") {
      return { success: false, error: "Cannot delete the last super admin." };
    }
    const updated = admins.filter(a => a.id !== id);
    setAdmins(updated);
    saveAdmins(updated);
    return { success: true };
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, currentAdmin, admins, login, logout, createAdmin, updateAdmin, deleteAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}
