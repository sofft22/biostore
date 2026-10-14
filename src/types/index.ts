/* ══════════════════════════════════════════════════
   Shared types for biomart
   ══════════════════════════════════════════════════ */

export interface Product {
  id: string;
  store_id?: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id: string;
  subcategory?: string | null;
  badge: string | null;
  in_stock: boolean;
  is_featured?: boolean;
  sort_order?: number | null;
  image_url: string | null;
  image_urls?: string[];
  images?: string[];
  variants?: { suggested: { label: string; priceDelta: number }[] };
  created_at?: number;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  whatsapp: string;
  cover_url?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  plan?: string;
  created_at?: number;
}

export interface Category {
  id: string;
  label: string;
  sort_order?: number;
}

export interface StoreCategoryImage {
  store_id: string;
  category_id: string;
  image_url: string;
}

export interface User {
  id: string;
  email: string;
  is_admin?: boolean;
}

export interface MeResponse {
  user: User | null;
  store: Store | null;
  products?: Product[];
  limits?: { planName: string; products: number } | null;
}

export interface StorefrontResponse {
  store: Store;
  products: Product[];
  categoryImages?: Record<string, string>;
}

export interface AdminStats {
  sellers: number;
  products: number;
  stores: number;
}

export interface AdminSeller {
  id: string;
  email: string;
  plan: string;
  planExpiresAt?: number | null;
  isAdmin: boolean;
  createdAt: number;
  storeName?: string;
  storeSlug?: string;
  productCount: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  price: number;
  storeId: string;
  storeName: string;
  storeSlug: string;
  sellerEmail: string;
  inStock: boolean;
  createdAt: number;
}