import type { Category } from "../types";

export function getCategoryLabel(
  categories: Category[],
  id: string
): string {
  return categories.find((c) => c.id === id)?.label ?? id;
}

export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* Default categories every new store starts with — can be deleted */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "bags", label: "Bags", sort_order: 0 },
  { id: "shoes", label: "Shoes", sort_order: 1 },
  { id: "clothing", label: "Clothing", sort_order: 2 },
];

/* Subcategories used only inside the "clothing" category picker */
export const SUBCATEGORIES = [
  { id: "dresses", label: "Dresses" },
  { id: "tops", label: "Tops" },
  { id: "shorts", label: "Shorts" },
  { id: "trousers", label: "Trousers" },
  { id: "skirts", label: "Skirts" },
];
