import type { Category } from "../types";
import { DEFAULT_CATEGORIES, slugifyCategory } from "./categories";

const CATEGORIES_KEY = (slug: string) => `biomart:categories:${slug}`;
const CATEGORY_IMAGES_KEY = (slug: string) => `biomart:category-images:${slug}`;

/* ── CATEGORIES ── */

export function getCategories(storeSlug: string): Category[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY(storeSlug));
    if (!raw) {
      localStorage.setItem(
        CATEGORIES_KEY(storeSlug),
        JSON.stringify(DEFAULT_CATEGORIES)
      );
      return DEFAULT_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_CATEGORIES;
    return parsed;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(storeSlug: string, list: Category[]): void {
  try {
    localStorage.setItem(CATEGORIES_KEY(storeSlug), JSON.stringify(list));
  } catch {
    /* ignore quota */
  }
}

export function addCategory(
  storeSlug: string,
  label: string
): { ok: true; category: Category } | { ok: false; error: string } {
  const trimmed = label.trim();
  if (!trimmed) return { ok: false, error: "Name is required" };
  if (trimmed.length > 30)
    return { ok: false, error: "Name is too long (30 max)" };

  const id = slugifyCategory(trimmed);
  if (!id) return { ok: false, error: "Invalid name" };

  const current = getCategories(storeSlug);
  if (current.some((c) => c.id === id)) {
    return { ok: false, error: "That category already exists" };
  }

  const category: Category = {
    id,
    label: trimmed,
    sort_order: current.length,
  };
  const next = [...current, category];
  saveCategories(storeSlug, next);
  return { ok: true, category };
}

export function updateCategory(
  storeSlug: string,
  id: string,
  label: string
): { ok: true } | { ok: false; error: string } {
  const trimmed = label.trim();
  if (!trimmed) return { ok: false, error: "Name is required" };
  const current = getCategories(storeSlug);
  const next = current.map((c) =>
    c.id === id ? { ...c, label: trimmed } : c
  );
  saveCategories(storeSlug, next);
  return { ok: true };
}

export function removeCategory(storeSlug: string, id: string): void {
  const current = getCategories(storeSlug);
  const next = current.filter((c) => c.id !== id);
  saveCategories(storeSlug, next);
  const images = getCategoryImages(storeSlug);
  if (images[id]) {
    const nextImages = { ...images };
    delete nextImages[id];
    saveCategoryImages(storeSlug, nextImages);
  }
}

export function reorderCategories(storeSlug: string, list: Category[]): void {
  const reindexed = list.map((c, i) => ({ ...c, sort_order: i }));
  saveCategories(storeSlug, reindexed);
}

/* ── CATEGORY IMAGES ── */

export function getCategoryImages(storeSlug: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(CATEGORY_IMAGES_KEY(storeSlug));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCategoryImages(
  storeSlug: string,
  images: Record<string, string>
): void {
  try {
    localStorage.setItem(
      CATEGORY_IMAGES_KEY(storeSlug),
      JSON.stringify(images)
    );
  } catch {
    /* ignore */
  }
}

export function setCategoryImage(
  storeSlug: string,
  categoryId: string,
  imageUrl: string
): void {
  const images = getCategoryImages(storeSlug);
  images[categoryId] = imageUrl;
  saveCategoryImages(storeSlug, images);
}

export function removeCategoryImage(
  storeSlug: string,
  categoryId: string
): void {
  const images = getCategoryImages(storeSlug);
  delete images[categoryId];
  saveCategoryImages(storeSlug, images);
}

/* ── COMBINED (new) ── */

export function getCategoriesWithImages(
  storeSlug: string
): Array<Category & { image?: string }> {
  const cats = getCategories(storeSlug);
  const images = getCategoryImages(storeSlug);
  return cats.map((c) => ({ ...c, image: images[c.id] }));
}
