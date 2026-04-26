import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product, EuthanasiaListing, dogs as defaultDogs, cats as defaultCats, supplies as defaultSupplies, defaultEuthanasiaListings } from "@/lib/data";

interface AdminDataContextType {
  dogs: Product[];
  cats: Product[];
  supplies: Product[];
  allProducts: Product[];
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  euthanasiaListings: EuthanasiaListing[];
  addEuthanasiaListing: (listing: Omit<EuthanasiaListing, "id" | "addedAt">) => void;
  updateEuthanasiaListing: (id: string, updates: Partial<EuthanasiaListing>) => void;
  deleteEuthanasiaListing: (id: string) => void;
}

const AdminDataContext = createContext<AdminDataContextType | null>(null);

const OLD_KEYS = {
  dogs: "pawglobal-dogs-v3",
  cats: "pawglobal-cats-v3",
  supplies: "pawglobal-supplies-v3",
  euthanasia: "pawglobal-euthanasia-v1",
};
const MIGRATED_FLAG = "pawglobal-db-migrated-v1";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function apiMutate<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

function readLocalStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function migrateFromLocalStorage(): Promise<boolean> {
  if (localStorage.getItem(MIGRATED_FLAG)) return false;

  const oldDogs = readLocalStorage<Product>(OLD_KEYS.dogs);
  const oldCats = readLocalStorage<Product>(OLD_KEYS.cats);
  const oldSupplies = readLocalStorage<Product>(OLD_KEYS.supplies);
  const oldEuthanasia = readLocalStorage<EuthanasiaListing>(OLD_KEYS.euthanasia);

  const hasData = oldDogs.length > 0 || oldCats.length > 0 || oldSupplies.length > 0 || oldEuthanasia.length > 0;
  if (!hasData) return false;

  const allProducts = [...oldDogs, ...oldCats, ...oldSupplies];
  const migrations: Promise<unknown>[] = [];

  for (const p of allProducts) {
    const imagesStr = Array.isArray(p.images) ? p.images.join("\n") : (p.images ?? "");
    migrations.push(
      fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...p,
          id: undefined,
          images: imagesStr,
        }),
      }).catch(() => {})
    );
  }

  for (const l of oldEuthanasia) {
    migrations.push(
      fetch("/api/euthanasia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...l, id: undefined }),
      }).catch(() => {})
    );
  }

  await Promise.allSettled(migrations);
  localStorage.setItem(MIGRATED_FLAG, "1");
  return true;
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [dogs, setDogs] = useState<Product[]>(defaultDogs);
  const [cats, setCats] = useState<Product[]>(defaultCats);
  const [supplies, setSupplies] = useState<Product[]>(defaultSupplies);
  const [euthanasiaListings, setEuthanasiaListings] = useState<EuthanasiaListing[]>(defaultEuthanasiaListings);

  useEffect(() => {
    async function load() {
      try {
        const [productList, listingList] = await Promise.all([
          apiFetch<Product[]>("/api/products"),
          apiFetch<EuthanasiaListing[]>("/api/euthanasia"),
        ]);

        const dbIsEmpty = productList.length === 0 && listingList.length === 0;

        if (dbIsEmpty) {
          const migrated = await migrateFromLocalStorage();
          if (migrated) {
            const [freshProducts, freshListings] = await Promise.all([
              apiFetch<Product[]>("/api/products"),
              apiFetch<EuthanasiaListing[]>("/api/euthanasia"),
            ]);
            const dogsData = freshProducts.filter(p => p.type === "dog");
            const catsData = freshProducts.filter(p => p.type === "cat");
            const suppliesData = freshProducts.filter(p => p.type === "supply");
            setDogs(dogsData.length ? dogsData : defaultDogs);
            setCats(catsData.length ? catsData : defaultCats);
            setSupplies(suppliesData.length ? suppliesData : defaultSupplies);
            setEuthanasiaListings(freshListings.length ? freshListings : defaultEuthanasiaListings);
            return;
          }
        }

        const dogsData = productList.filter(p => p.type === "dog");
        const catsData = productList.filter(p => p.type === "cat");
        const suppliesData = productList.filter(p => p.type === "supply");
        setDogs(dogsData.length ? dogsData : defaultDogs);
        setCats(catsData.length ? catsData : defaultCats);
        setSupplies(suppliesData.length ? suppliesData : defaultSupplies);
        setEuthanasiaListings(listingList.length ? listingList : defaultEuthanasiaListings);
      } catch (err) {
        console.warn("Failed to load from API, using demo defaults:", err);
        setDogs(defaultDogs);
        setCats(defaultCats);
        setSupplies(defaultSupplies);
        setEuthanasiaListings(defaultEuthanasiaListings);
      }
    }
    load();
  }, []);

  const allProducts = [...dogs, ...cats, ...supplies];

  const addProduct = (product: Omit<Product, "id">) => {
    const imagesStr = Array.isArray(product.images) ? product.images.join("\n") : "";
    apiMutate<Product>("POST", "/api/products", { ...product, images: imagesStr })
      .then(created => {
        if (created.type === "dog") setDogs(prev => [...prev, created]);
        else if (created.type === "cat") setCats(prev => [...prev, created]);
        else setSupplies(prev => [...prev, created]);
      })
      .catch(err => console.error("addProduct failed:", err));
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const payload = { ...updates };
    if (Array.isArray(payload.images)) {
      (payload as Record<string, unknown>).images = payload.images.join("\n");
    }
    const localUpdate = (list: Product[]) => list.map(p => p.id === id ? { ...p, ...updates } : p);
    setDogs(localUpdate);
    setCats(localUpdate);
    setSupplies(localUpdate);
    apiMutate("PUT", `/api/products/${id}`, payload)
      .catch(err => console.error("updateProduct failed:", err));
  };

  const deleteProduct = (id: string) => {
    setDogs(prev => prev.filter(p => p.id !== id));
    setCats(prev => prev.filter(p => p.id !== id));
    setSupplies(prev => prev.filter(p => p.id !== id));
    apiMutate("DELETE", `/api/products/${id}`)
      .catch(err => console.error("deleteProduct failed:", err));
  };

  const addEuthanasiaListing = (listing: Omit<EuthanasiaListing, "id" | "addedAt">) => {
    apiMutate<EuthanasiaListing>("POST", "/api/euthanasia", listing)
      .then(created => setEuthanasiaListings(prev => [...prev, created]))
      .catch(err => console.error("addEuthanasiaListing failed:", err));
  };

  const updateEuthanasiaListing = (id: string, updates: Partial<EuthanasiaListing>) => {
    setEuthanasiaListings(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    apiMutate("PUT", `/api/euthanasia/${id}`, updates)
      .catch(err => console.error("updateEuthanasiaListing failed:", err));
  };

  const deleteEuthanasiaListing = (id: string) => {
    setEuthanasiaListings(prev => prev.filter(l => l.id !== id));
    apiMutate("DELETE", `/api/euthanasia/${id}`)
      .catch(err => console.error("deleteEuthanasiaListing failed:", err));
  };

  return (
    <AdminDataContext.Provider value={{
      dogs, cats, supplies, allProducts,
      addProduct, updateProduct, deleteProduct,
      euthanasiaListings, addEuthanasiaListing, updateEuthanasiaListing, deleteEuthanasiaListing,
    }}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used inside AdminDataProvider");
  return ctx;
}
