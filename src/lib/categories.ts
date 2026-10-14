import type { Category } from "../types";

export const CATEGORIES: Category[] = [
  { id: "bags",        label: "Bags",        sort_order: 0 },
  { id: "shoes",       label: "Shoes",       sort_order: 1 },
  { id: "clothing",    label: "Clothing",    sort_order: 2 },
  { id: "skincare",    label: "Skincare",    sort_order: 3 },
  { id: "hair",        label: "Hair",        sort_order: 4 },
  { id: "jewelry",     label: "Jewelry",     sort_order: 5 },
  { id: "accessories", label: "Accessories", sort_order: 6 },
  { id: "food",        label: "Food",        sort_order: 7 },
];

export const SUBCATEGORIES = [
  { id: "dresses",  label: "Dresses" },
  { id: "tops",     label: "Tops" },
  { id: "shorts",   label: "Shorts" },
  { id: "trousers", label: "Trousers" },
  { id: "skirts",   label: "Skirts" },
];

export function getCategoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}