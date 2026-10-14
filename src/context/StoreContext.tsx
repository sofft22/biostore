import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Product, Store, StorefrontResponse } from "../types";

interface StoreState {
  loading: boolean;
  store: Store | null;
  products: Product[];
  error: string | null;
  reload: () => Promise<void>;
}

const Ctx = createContext<StoreState | null>(null);

export function StoreProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/store/${encodeURIComponent(slug)}`, {
        credentials: "include",
      });
      const data = (await r.json()) as StorefrontResponse & { error?: string };
      if (!r.ok) throw new Error(data.error || "Could not load store.");
      setStore(data.store);
      setProducts(data.products || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load store.");
      setStore(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("No store specified.");
      return;
    }
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return (
    <Ctx.Provider value={{ loading, store, products, error, reload }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStoreContext(): StoreState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStoreContext must be used inside StoreProvider");
  return ctx;
}