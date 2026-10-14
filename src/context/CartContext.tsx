import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { CartItem, Product } from "../types";

interface CartState {
  items: CartItem[];
  count: number;
  total: number;
  add: (product: Product, qty: number, variant: string | null, unitPrice: number) => void;
  remove: (index: number) => void;
  changeQty: (index: number, delta: number) => void;
  clear: () => void;
}

const Ctx = createContext<CartState | null>(null);

function storageKey(slug: string) {
  return "biostore.cart." + (slug || "default");
}

export function CartProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load from localStorage when slug changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(slug));
      const parsed = raw ? JSON.parse(raw) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
  }, [slug]);

  // Persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey(slug), JSON.stringify(items));
    } catch {}
  }, [items, slug]);

  const add = useCallback(
    (product: Product, qty: number, variant: string | null, unitPrice: number) => {
      setItems((prev) => {
        const key = `${product.id}|${variant || ""}`;
        const existing = prev.find((it) => it.key === key);
        if (existing) {
          return prev.map((it) =>
            it.key === key ? { ...it, qty: it.qty + qty } : it
          );
        }
        return [
          ...prev,
          {
            key,
            id: product.id,
            name: product.name,
            image: product.images?.[0] || "",
            variant: variant || null,
            unitPrice,
            qty,
          },
        ];
      });
    },
    []
  );

  const remove = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const changeQty = useCallback((index: number, delta: number) => {
    setItems((prev) => {
      const next = [...prev];
      const it = next[index];
      if (!it) return prev;
      const qty = it.qty + delta;
      if (qty < 1) return next.filter((_, i) => i !== index);
      next[index] = { ...it, qty };
      return next;
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(
    () => items.reduce((n, it) => n + it.qty, 0),
    [items]
  );

  const total = useMemo(
    () => items.reduce((n, it) => n + it.qty * it.unitPrice, 0),
    [items]
  );

  return (
    <Ctx.Provider value={{ items, count, total, add, remove, changeQty, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart(): CartState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}