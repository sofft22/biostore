import type { CartItem, Product, Store } from "../types";
import { naira } from "./format";

export function normalizeNigerianPhone(input: string): string {
  const digits = String(input || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0") && digits.length === 11) return "234" + digits.slice(1);
  return digits;
}

export function buildProductOrderLink(
  store: Store,
  product: Product,
  qty: number,
  variant: string | null,
  unitPrice: number
): string {
  const line = variant ? `${product.name} (${variant})` : product.name;
  const total = unitPrice * qty;
  const msg = [
    `Hi ${store.name},`,
    "",
    "I want to order:",
    "",
    `${line}`,
    `Qty: ${qty}`,
    `Price: ${naira(unitPrice)}`,
    `Total: ${naira(total)}`,
    "",
    "Is this available?",
  ].join("\n");
  return `https://wa.me/${normalizeNigerianPhone(store.whatsapp)}?text=${encodeURIComponent(msg)}`;
}

export function buildCartOrderLink(store: Store, items: CartItem[]): string {
  const lines: string[] = [`Hi ${store.name},`, "", "I want to order:", ""];
  let total = 0;
  for (const it of items) {
    const line = it.variant ? `${it.name} (${it.variant})` : it.name;
    const sub = it.unitPrice * it.qty;
    total += sub;
    lines.push(`${line} x ${it.qty} = ${naira(sub)}`);
  }
  lines.push("");
  lines.push(`Total: ${naira(total)}`);
  lines.push("");
  lines.push("Is this available?");
  const msg = lines.join("\n");
  return `https://wa.me/${normalizeNigerianPhone(store.whatsapp)}?text=${encodeURIComponent(msg)}`;
}

export function buildQuestionLink(store: Store, productName: string): string {
  const msg = [
    `Hi ${store.name},`,
    "",
    `I have a question about: ${productName}`,
    "",
    "____",
  ].join("\n");
  return `https://wa.me/${normalizeNigerianPhone(store.whatsapp)}?text=${encodeURIComponent(msg)}`;
}

export function buildShareLink(product: Product, url: string): string {
  const text = `Check out ${product.name} - ${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}