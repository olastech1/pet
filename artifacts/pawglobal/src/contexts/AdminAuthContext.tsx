import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  password: string;
  role: "super" | "admin";
  createdAt: string;
}

const SESSION_KEY = "pawglobal-admin-session";

const DEFAULT_ADMIN: AdminAccount = {
  id: "admin-1",
  email: "admin@pawglobal.com",
  name: "Super Admin",
  password: "pawglobal2024",
  role: "super",
  createdAt: new Date().toISOString(),
};

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
  const [admins, setAdmins] = useState<AdminAccount[]>([DEFAULT_ADMIN]);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(loadCurrentId);

  useEffect(() => {
    fetch("/api/admins")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAdmins(data);
        }
      })
      .catch(err => console.error("Failed to load admins:", err));
  }, []);

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
    const tempId = `admin-temp-${Date.now()}`;
    const newAdmin: AdminAccount = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
    };
    
    setAdmins(prev => [...prev, newAdmin]);
    
    fetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(r => r.json())
      .then(saved => {
        if (saved.error) {
          setAdmins(prev => prev.filter(a => a.id !== tempId));
        } else {
          setAdmins(prev => prev.map(a => a.id === tempId ? saved : a));
          if (currentAdminId === tempId) {
            setCurrentAdminId(saved.id);
            try { sessionStorage.setItem(SESSION_KEY, saved.id); } catch {}
          }
        }
      })
      .catch(() => {
        setAdmins(prev => prev.filter(a => a.id !== tempId));
      });

    return { success: true };
  };

  const updateAdmin = (id: string, data: Partial<AdminAccount>) => {
    const idx = admins.findIndex(a => a.id === id);
    if (idx === -1) return { success: false, error: "Admin not found." };
    if (data.email) {
      const conflict = admins.find(a => a.email.toLowerCase() === data.email!.toLowerCase() && a.id !== id);
      if (conflict) return { success: false, error: "Email already in use." };
    }
    
    setAdmins(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    
    fetch(`/api/admins/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).catch(console.error);

    return { success: true };
  };

  const deleteAdmin = (id: string) => {
    if (id === currentAdminId) return { success: false, error: "Cannot delete yourself." };
    const superAdmins = admins.filter(a => a.role === "super" && a.id !== id);
    if (superAdmins.length === 0 && admins.find(a => a.id === id)?.role === "super") {
      return { success: false, error: "Cannot delete the last super admin." };
    }
    
    setAdmins(prev => prev.filter(a => a.id !== id));
    
    fetch(`/api/admins/${id}`, { method: "DELETE" }).catch(console.error);
    
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
