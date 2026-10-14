import type {
  AdminStats,
  AdminSeller,
  AdminProduct,
  Category,
} from "../types";
import { CATEGORIES } from "./categories";

/* ══════════════════════════════════════════════════
   SELLER STATS — used by Overview
   ══════════════════════════════════════════════════ */

export interface SellerStats {
  today: number;
  yesterday: number;
  week: number;
  allTime: number;
  daily: { date: string; count: number }[];
  topProducts: { id: string; name: string; image_url?: string | null; views: number }[];
}

export function mockSellerStats(products: { id: string; name: string; image_url?: string | null }[]): SellerStats {
  const seed = products.length;
  const daily = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => ({
    date: d,
    count: [32, 41, 38, 52, 61, 78, 47][i] + seed * 3,
  }));

  const top = products.slice(0, 5).map((p, i) => ({
    id: p.id,
    name: p.name,
    image_url: p.image_url,
    views: 340 - i * 55 + seed * 4,
  }));

  const week = daily.reduce((a, d) => a + d.count, 0);

  return {
    today: daily[daily.length - 1].count,
    yesterday: daily[daily.length - 2].count,
    week,
    allTime: 1240 + seed * 24,
    daily,
    topProducts: top,
  };
}

/* ══════════════════════════════════════════════════
   ADMIN — platform stats, sellers, products
   ══════════════════════════════════════════════════ */

export const MOCK_ADMIN_STATS: AdminStats = {
  sellers: 312,
  stores: 312,
  products: 1847,
};

export const MOCK_ADMIN_SELLERS: AdminSeller[] = [
  {
    id: "s1",
    email: "adaeze@example.com",
    plan: "starter",
    isAdmin: false,
    createdAt: Date.parse("2026-02-12"),
    storeName: "Adaeze's Closet",
    storeSlug: "adaezes-closet",
    productCount: 12,
  },
  {
    id: "s2",
    email: "tola@example.com",
    plan: "pro",
    isAdmin: false,
    createdAt: Date.parse("2025-11-03"),
    storeName: "Tola Hair",
    storeSlug: "tola-hair",
    productCount: 42,
  },
  {
    id: "s3",
    email: "chioma@example.com",
    plan: "lifetime",
    isAdmin: false,
    createdAt: Date.parse("2025-08-12"),
    storeName: "Chioma Beauty",
    storeSlug: "chioma-beauty",
    productCount: 87,
  },
  {
    id: "s4",
    email: "bola@example.com",
    plan: "free",
    isAdmin: false,
    createdAt: Date.parse("2026-03-02"),
    storeName: "Bola Sneakers",
    storeSlug: "bola-sneakers",
    productCount: 3,
  },
  {
    id: "s5",
    email: "ngozi@example.com",
    plan: "starter",
    isAdmin: false,
    createdAt: Date.parse("2026-01-20"),
    storeName: "Ngozi Skincare",
    storeSlug: "ngozi-skincare",
    productCount: 14,
  },
];

export const MOCK_ADMIN_PRODUCTS: AdminProduct[] = [
  { id: "p1", name: "Ankara tote bag",  price: 18500, storeId: "s1", storeName: "Adaeze's Closet", storeSlug: "adaezes-closet", sellerEmail: "adaeze@example.com", inStock: true,  createdAt: Date.parse("2026-02-14") },
  { id: "p2", name: "White sneakers",   price: 32000, storeId: "s1", storeName: "Adaeze's Closet", storeSlug: "adaezes-closet", sellerEmail: "adaeze@example.com", inStock: true,  createdAt: Date.parse("2026-02-20") },
  { id: "p3", name: "Lace front wig",   price: 45000, storeId: "s2", storeName: "Tola Hair",       storeSlug: "tola-hair",       sellerEmail: "tola@example.com",   inStock: true,  createdAt: Date.parse("2025-11-05") },
  { id: "p4", name: "Vitamin C serum",  price: 12000, storeId: "s3", storeName: "Chioma Beauty",   storeSlug: "chioma-beauty",   sellerEmail: "chioma@example.com", inStock: true,  createdAt: Date.parse("2025-08-20") },
  { id: "p5", name: "Straw sun hat",    price: 9800,  storeId: "s4", storeName: "Bola Sneakers",   storeSlug: "bola-sneakers",   sellerEmail: "bola@example.com",   inStock: false, createdAt: Date.parse("2026-03-05") },
];

/* ══════════════════════════════════════════════════
   CATEGORY IMAGES — per store
   ══════════════════════════════════════════════════ */

const CATEGORY_IMAGE_KEY = "mock_category_images_v1";

export function loadMockCategoryImages(storeSlug: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(`${CATEGORY_IMAGE_KEY}:${storeSlug}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveMockCategoryImages(
  storeSlug: string,
  images: Record<string, string>
) {
  localStorage.setItem(`${CATEGORY_IMAGE_KEY}:${storeSlug}`, JSON.stringify(images));
}

/* ══════════════════════════════════════════════════
   AVAILABLE CATEGORY LIST (fallback shape for the storefront)
   ══════════════════════════════════════════════════ */

export function mockCategories(): Category[] {
  return CATEGORIES;
}