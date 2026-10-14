export function naira(n: number): string {
  return "₦" + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function escapeHtml(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[c];
  });
}

export function formatDate(ms: number | string | null | undefined): string {
  if (ms == null) return "";
  const d = new Date(ms);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function initials(name: string): string {
  return (name || "?").trim().charAt(0).toUpperCase();
}