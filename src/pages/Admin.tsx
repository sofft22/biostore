import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { naira, formatDate } from "../lib/format";

interface AdminStats {
  sellers: number;
  products: number;
  stores: number;
}

interface AdminSeller {
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

interface AdminProduct {
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

type Tab = "overview" | "sellers" | "products";
type PlanFilter = "all" | "free" | "starter" | "pro";

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { credentials: "include", ...init });
  const d = await r.json().catch(() => null);
  if (!r.ok) throw new Error(d?.error || "Request failed");
  return d as T;
}

/* Plan limit map — used for "x / y" display and "at limit" flag */
const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  starter: 15,
  pro: 50,
  lifetime: 9999,
};

/* Plan pill color class */
function planClass(plan: string): string {
  const p = plan.toLowerCase();
  if (p === "free") return "adm-cell-plan free";
  if (p === "starter") return "adm-cell-plan starter";
  if (p === "pro") return "adm-cell-plan pro";
  return "adm-cell-plan starter";
}

export default function Admin() {
  const nav = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [sellers, setSellers] = useState<AdminSeller[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");

  /* Drawer + confirm state */
  const [openSeller, setOpenSeller] = useState<AdminSeller | null>(null);
  const [drawerNote, setDrawerNote] = useState("");
  const [confirm, setConfirm] = useState<{
    title: string;
    sub: string;
    confirmLabel: string;
    danger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await adminFetch("/api/admin/me");
      } catch {
        setAuthorized(false);
        setLoading(false);
        return;
      }
      try {
        const s = await adminFetch<AdminStats>("/api/admin/stats");
        setStats(s);
        const sl = await adminFetch<AdminSeller[]>("/api/admin/sellers");
        setSellers(sl);
        const pr = await adminFetch<AdminProduct[]>("/api/admin/products");
        setProducts(pr);
      } catch (err) {
        toast.show(err instanceof Error ? err.message : "Could not load");
      }
      setLoading(false);
    })();
  }, [toast]);

  /* ── Delete seller ── */
  const handleDeleteSeller = (s: AdminSeller) => {
    setConfirm({
      title: "Delete store?",
      sub: `"${s.storeName || s.email}" and all its products will be permanently removed. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        try {
          await adminFetch(`/api/admin/sellers/${s.id}`, { method: "DELETE" });
          setSellers((prev) => prev.filter((x) => x.id !== s.id));
          toast.show("Seller deleted");
          setOpenSeller(null);
        } catch (err) {
          toast.show(err instanceof Error ? err.message : "Could not delete");
        }
        setConfirm(null);
      },
    });
  };

  /* ── Change plan ── */
  const handleChangePlan = (s: AdminSeller, next: string) => {
    if (s.plan === next) return;
    const isDowngrade = next === "free";
    setConfirm({
      title: isDowngrade ? "Downgrade to Free?" : `Change to ${next}?`,
      sub: `${s.storeName || s.email} will be on the ${next} plan immediately.`,
      confirmLabel: isDowngrade ? "Downgrade" : "Confirm",
      danger: isDowngrade,
      onConfirm: async () => {
        try {
          await adminFetch(`/api/admin/sellers/${s.id}`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ plan: next }),
          });
          setSellers((prev) =>
            prev.map((x) => (x.id === s.id ? { ...x, plan: next } : x))
          );
          if (openSeller?.id === s.id) {
            setOpenSeller({ ...openSeller, plan: next });
          }
          toast.show(`Changed to ${next}`);
        } catch (err) {
          toast.show(err instanceof Error ? err.message : "Could not update");
        }
        setConfirm(null);
      },
    });
  };

  /* ── Delete product ── */
  const handleDeleteProduct = (p: AdminProduct) => {
    setConfirm({
      title: "Delete product?",
      sub: `"${p.name}" from ${p.storeName} will be permanently removed.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        try {
          await adminFetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
          setProducts((prev) => prev.filter((x) => x.id !== p.id));
          toast.show("Product deleted");
        } catch (err) {
          toast.show(err instanceof Error ? err.message : "Could not delete");
        }
        setConfirm(null);
      },
    });
  };

  /* ── Filters ── */
  const filteredSellers = useMemo(() => {
    let list = sellers;
    if (planFilter !== "all") {
      list = list.filter((s) => s.plan.toLowerCase() === planFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.email.toLowerCase().includes(q) ||
          (s.storeName || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [sellers, planFilter, search]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.storeName.toLowerCase().includes(q) ||
        p.sellerEmail.toLowerCase().includes(q)
    );
  }, [products, search]);

  /* ── Not authorized ── */
  if (!authorized) {
    return (
      <div className="adm-shell">
        <div className="adm-blob" aria-hidden="true" />
        <div className="adm-wrap" style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: "80px 0" }}>
          <div style={{ textAlign: "center", maxWidth: 400 }}>
            <p className="adm-head-eyebrow">Restricted</p>
            <h1 className="adm-title">Not <em>authorized</em>.</h1>
            <p className="adm-head-sub" style={{ margin: "14px auto 28px" }}>
              This area is for admins only.
            </p>
            <Link to="/" className="dash-btn dash-btn-dark">Back to biomart</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="adm-shell" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <div className="dash-spinner" />
      </div>
    );
  }

  const payingCount = sellers.filter((s) => s.plan.toLowerCase() !== "free").length;
  const conversionRate = sellers.length > 0
    ? Math.round((payingCount / sellers.length) * 100)
    : 0;

  return (
    <div className="adm-shell">
      <div className="adm-blob" aria-hidden="true" />

      {/* ═══════════ TOPBAR ═══════════ */}
      <header className="adm-topbar">
        <div className="adm-wrap adm-topbar-inner">
          <div className="adm-brand">
            <span className="adm-brand-mark">
              <svg viewBox="0 0 60 64" width="14" height="16" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
                <path d="M10 20H50L55 54Q55.4 58 51.5 58H8.5Q4.6 58 5 54Z" />
                <path d="M20 26V14A10 10 0 0 1 40 14V26" />
              </svg>
            </span>
            biomart
            <span className="adm-brand-tag">Admin</span>
          </div>
          <div className="adm-topbar-right">
            <span className="adm-topbar-user">Admin</span>
            <Link to="/dashboard" className="adm-logout">My store</Link>
          </div>
        </div>
      </header>

      {/* ═══════════ MAIN ═══════════ */}
      <main className="adm-wrap adm-main">

        <div className="adm-head">
          <p className="adm-head-eyebrow">Admin</p>
          <h1 className="adm-title">Stores on <em>biomart</em>.</h1>
          <p className="adm-head-sub">
            Every seller, plan, and product. Tap a row to manage.
          </p>
        </div>

        {/* ── Stats ── */}
        {stats && (
          <div className="adm-stats">
            <div className="adm-stat">
              <p className="adm-stat-label">Total stores</p>
              <p className="adm-stat-value">{stats.stores}</p>
              <p className="adm-stat-hint">Sellers: {stats.sellers}</p>
            </div>
            <div className="adm-stat">
              <p className="adm-stat-label">Paying stores</p>
              <p className="adm-stat-value">{payingCount}</p>
              <p className="adm-stat-hint">{conversionRate}% conversion</p>
            </div>
            <div className="adm-stat">
              <p className="adm-stat-label">Products live</p>
              <p className="adm-stat-value">{stats.products}</p>
              <p className="adm-stat-hint">Across all stores</p>
            </div>
            <div className="adm-stat">
              <p className="adm-stat-label">Free stores</p>
              <p className="adm-stat-value">{sellers.length - payingCount}</p>
              <p className="adm-stat-hint">Upgrade candidates</p>
            </div>
            <div className="adm-stat">
              <p className="adm-stat-label">MRR</p>
              <p className="adm-stat-value">₦0</p>
              <p className="adm-stat-hint">Add revenue tracking</p>
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="adm-tabs">
          {(["overview", "sellers", "products"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch(""); }}
              className={`adm-tab ${tab === t ? "on" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Overview tab ── */}
        {tab === "overview" && (
          <div className="adm-overview">
            <p className="adm-overview-lead">
              Switch to <strong>Sellers</strong> to upgrade or downgrade plans, or{" "}
              <strong>Products</strong> to review listings across the platform.
            </p>
          </div>
        )}

        {/* ── Sellers tab ── */}
        {tab === "sellers" && (
          <>
            <div className="adm-toolbar">
              <div className="adm-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
                <input
                  type="search"
                  placeholder="Search by store or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="adm-filters">
                {(["all", "free", "starter", "pro"] as PlanFilter[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlanFilter(p)}
                    className={`adm-chip ${planFilter === p ? "on" : ""}`}
                  >
                    {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {filteredSellers.length === 0 ? (
              <div className="adm-empty">
                <p className="adm-empty-title">No sellers found</p>
                <p className="adm-empty-sub">Try a different search or filter.</p>
              </div>
            ) : (
              <div className="adm-table">
                <div className="adm-thead">
                  <div>Store</div>
                  <div>Plan</div>
                  <div>Products</div>
                  <div>Joined</div>
                  <div style={{ textAlign: "right" }}>Actions</div>
                </div>

                {filteredSellers.map((s) => {
                  const limit = PLAN_LIMITS[s.plan.toLowerCase()] ?? 5;
                  const atLimit = s.productCount >= limit;
                  return (
                    <div
                      key={s.id}
                      className="adm-row"
                      onClick={() => {
                        setOpenSeller(s);
                        setDrawerNote("");
                      }}
                    >
                      <div className="adm-store">
                        <div className="adm-store-avatar">
                          {(s.storeName || s.email).charAt(0).toUpperCase()}
                          <span
                            className={`adm-health ${
                              atLimit ? "growing" : "good"
                            }`}
                          />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p className="adm-store-name">
                            {s.storeName || "Untitled store"}
                            {s.isAdmin && <span className="adm-flag hot">Admin</span>}
                            {atLimit && !s.isAdmin && (
                              <span className="adm-flag limit">At limit</span>
                            )}
                          </p>
                          <p className="adm-store-slug">{s.email}</p>
                        </div>
                      </div>

                      <div>
                        <span className={planClass(s.plan)}>{s.plan}</span>
                      </div>

                      <div className="adm-cell">
                        {s.productCount} / {limit === 9999 ? "∞" : limit}
                      </div>

                      <div className="adm-cell">
                        {s.createdAt ? formatDate(s.createdAt) : "—"}
                      </div>

                      <div className="adm-cell-actions" onClick={(e) => e.stopPropagation()}>
                        {s.storeSlug && (
                          <a
                            href={`/store/${s.storeSlug}`}
                            target="_blank"
                            rel="noopener"
                            className="adm-act"
                            aria-label="View store"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteSeller(s)}
                          className="adm-act danger"
                          aria-label="Delete"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Products tab ── */}
        {tab === "products" && (
          <>
            <div className="adm-toolbar">
              <div className="adm-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
                <input
                  type="search"
                  placeholder="Search by product, store, or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="adm-empty">
                <p className="adm-empty-title">No products found</p>
                <p className="adm-empty-sub">Try a different search.</p>
              </div>
            ) : (
              <div className="adm-table">
                <div className="adm-thead" style={{ gridTemplateColumns: "2fr 1.2fr 1fr 0.9fr 90px" }}>
                  <div>Product</div>
                  <div>Store</div>
                  <div>Price</div>
                  <div>Status</div>
                  <div style={{ textAlign: "right" }}>Actions</div>
                </div>

                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="adm-row"
                    style={{ gridTemplateColumns: "2fr 1.2fr 1fr 0.9fr 90px", cursor: "default" }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p className="adm-store-name" style={{ display: "block" }}>{p.name}</p>
                      <p className="adm-store-slug">{p.sellerEmail}</p>
                    </div>

                    <div className="adm-cell">{p.storeName}</div>

                    <div className="adm-cell" style={{ fontWeight: 700, color: "var(--ink)" }}>
                      {naira(p.price)}
                    </div>

                    <div>
                      <span className={`adm-cell-plan ${p.inStock ? "starter" : "free"}`}>
                        {p.inStock ? "In stock" : "Sold out"}
                      </span>
                    </div>

                    <div className="adm-cell-actions">
                      <a
                        href={`/store/${p.storeSlug}`}
                        target="_blank"
                        rel="noopener"
                        className="adm-act"
                        aria-label="View store"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </a>
                      <button
                        onClick={() => handleDeleteProduct(p)}
                        className="adm-act danger"
                        aria-label="Delete"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </main>

      {/* ═══════════ DRAWER ═══════════ */}
      <div
        className={`adm-drawer-backdrop ${openSeller ? "on" : ""}`}
        onClick={() => setOpenSeller(null)}
      />
      <aside className={`adm-drawer ${openSeller ? "on" : ""}`}>
        {openSeller && (
          <>
            <div className="adm-drawer-head">
              <div style={{ minWidth: 0 }}>
                <h2 className="adm-drawer-title">
                  {openSeller.storeName || "Untitled store"}
                </h2>
                <p className="adm-drawer-slug">{openSeller.email}</p>
              </div>
              <button
                className="adm-drawer-close"
                onClick={() => setOpenSeller(null)}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="adm-drawer-body">
              {/* Flags */}
              <div className="adm-flags">
                {openSeller.isAdmin && (
                  <span className="adm-flags-pill good">Admin</span>
                )}
                {openSeller.productCount >= (PLAN_LIMITS[openSeller.plan.toLowerCase()] ?? 5) && (
                  <span className="adm-flags-pill warn">At limit</span>
                )}
                {openSeller.plan.toLowerCase() !== "free" && (
                  <span className="adm-flags-pill good">Paying</span>
                )}
              </div>

              {/* Plan */}
              <p className="adm-sec-title">Plan</p>
              <div className="adm-plan-box">
                <div className="adm-plan-current">
                  <div>
                    <p className="adm-plan-current-name" style={{ textTransform: "capitalize" }}>
                      {openSeller.plan}
                    </p>
                    <p className="adm-plan-current-meta">
                      {openSeller.productCount} of{" "}
                      {PLAN_LIMITS[openSeller.plan.toLowerCase()] === 9999
                        ? "∞"
                        : PLAN_LIMITS[openSeller.plan.toLowerCase()] ?? 5}{" "}
                      products used
                    </p>
                  </div>
                  <span className={planClass(openSeller.plan)}>{openSeller.plan}</span>
                </div>
                <div className="adm-plan-actions">
                  <button
                    className="adm-plan-btn outline"
                    onClick={() => handleChangePlan(openSeller, "starter")}
                    disabled={openSeller.plan.toLowerCase() === "starter"}
                  >
                    {openSeller.plan.toLowerCase() === "starter" ? "On Starter" : "Upgrade to Starter"}
                  </button>
                  <button
                    className="adm-plan-btn primary"
                    onClick={() => handleChangePlan(openSeller, "pro")}
                    disabled={openSeller.plan.toLowerCase() === "pro"}
                  >
                    {openSeller.plan.toLowerCase() === "pro" ? "On Pro" : "Upgrade to Pro"}
                  </button>
                  <button
                    className="adm-plan-btn full danger"
                    onClick={() => handleChangePlan(openSeller, "free")}
                    disabled={openSeller.plan.toLowerCase() === "free"}
                  >
                    {openSeller.plan.toLowerCase() === "free" ? "Already Free" : "Downgrade to Free"}
                  </button>
                </div>
              </div>

              {/* Contact */}
              <p className="adm-sec-title">Contact</p>
              <div className="adm-field">
                <p className="adm-field-label">Email</p>
                <p className="adm-field-value">{openSeller.email}</p>
              </div>
              {openSeller.storeSlug && (
                <div className="adm-field">
                  <p className="adm-field-label">Store link</p>
                  <p className="adm-field-value">/store/{openSeller.storeSlug}</p>
                </div>
              )}
              <div className="adm-field">
                <p className="adm-field-label">Products</p>
                <p className="adm-field-value">{openSeller.productCount}</p>
              </div>
              <div className="adm-field">
                <p className="adm-field-label">Joined</p>
                <p className="adm-field-value">
                  {openSeller.createdAt ? formatDate(openSeller.createdAt) : "—"}
                </p>
              </div>

              {/* Notes */}
              <p className="adm-sec-title" style={{ marginTop: 22 }}>Notes</p>
              <textarea
                className="adm-notes"
                placeholder="Add a note about this store…"
                value={drawerNote}
                onChange={(e) => setDrawerNote(e.target.value)}
                onBlur={() => {
                  if (drawerNote.trim()) toast.show("Note saved");
                }}
              />

              {/* Support */}
              <hr className="adm-divider" />
              <p className="adm-sec-title">Support</p>
              <div className="adm-support">
                {openSeller.storeSlug && (
                  <a
                    href={`/store/${openSeller.storeSlug}`}
                    target="_blank"
                    rel="noopener"
                    className="adm-support-btn"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    View store
                  </a>
                )}
                <button
                  className="adm-support-btn"
                  onClick={() => {
                    if (openSeller.storeSlug) {
                      navigator.clipboard.writeText(
                        location.origin + "/store/" + openSeller.storeSlug
                      );
                      toast.show("Link copied");
                    }
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="11" height="11" rx="2" />
                    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                  </svg>
                  Copy link
                </button>
                <a
                  href={`mailto:${openSeller.email}`}
                  className="adm-support-btn"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                  Email
                </a>
                <button
                  className="adm-support-btn"
                  onClick={() => toast.show("Reset link sent")}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                  Reset password
                </button>
                <button
                  className="adm-support-btn full danger"
                  onClick={() => handleDeleteSeller(openSeller)}
                >
                  Delete store
                </button>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* ═══════════ CONFIRM MODAL ═══════════ */}
      {confirm && (
        <div
          className="adm-modal-backdrop on"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirm(null);
          }}
        >
          <div className="adm-modal">
            <h3 className="adm-modal-title">{confirm.title}</h3>
            <p className="adm-modal-sub">{confirm.sub}</p>
            <div className="adm-modal-actions">
              <button
                className="adm-modal-btn ghost"
                onClick={() => setConfirm(null)}
              >
                Cancel
              </button>
              <button
                className={`adm-modal-btn ${confirm.danger ? "danger" : "confirm"}`}
                onClick={confirm.onConfirm}
              >
                {confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}