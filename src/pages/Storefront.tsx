import { useState, useMemo, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useStoreContext } from "../context/StoreContext";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import CartDrawer from "../components/CartDrawer";
import { getCategoryLabel } from "../lib/categories";
import { getCategories, getCategoryImages } from "../lib/storeData";
import type { Category, Product } from "../types";

function titleCase(s: string): string {
  return (s || "").replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

function splitBrandName(name: string): { first: string; second: string } {
  const parts = (name || "").trim().split(/\s+/);
  if (parts.length <= 1) return { first: parts[0] || "", second: "" };
  return { first: parts[0], second: parts.slice(1).join(" ") };
}

export default function Storefront() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { loading, store, products, error } = useStoreContext();
  const cart = useCart();

  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [headerHidden, setHeaderHidden] = useState(false);
  const [headerSolid, setHeaderSolid] = useState(false);
  const [categoryTick, setCategoryTick] = useState(0);
  const lastYRef = useRef(0);

  useEffect(() => {
    if (!slug) return;
    setCategories(getCategories(slug));
    setCategoryImages(getCategoryImages(slug));
  }, [slug, categoryTick]);

  useEffect(() => {
    const onFocus = () => setCategoryTick((t) => t + 1);
    const onVisible = () => {
      if (document.visibilityState === "visible") setCategoryTick((t) => t + 1);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const last = lastYRef.current;
      const diff = y - last;
      const atTop = y < 40;

      setHeaderSolid(y > 120);

      if (atTop) setHeaderHidden(false);
      else if (diff > 6 && y > 200) setHeaderHidden(true);
      else if (diff < -6) setHeaderHidden(false);

      lastYRef.current = y;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const usedCategories = useMemo(() => {
    const usedIds = new Set<string>();
    for (const p of products) {
      const cid = (p as any).category_id || (p as any).category;
      if (cid) usedIds.add(cid);
    }
    return categories.filter((c) => usedIds.has(c.id));
  }, [categories, products]);

  const newArrivals = useMemo(() => {
    return [...products]
      .sort(
        (a, b) =>
          new Date((b as any).created_at ?? 0).getTime() -
          new Date((a as any).created_at ?? 0).getTime()
      )
      .slice(0, 4);
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== "all") {
      list = list.filter(
        (p) => ((p as any).category_id || (p as any).category) === activeCategory
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activeCategory, search]);

  const handleOpenProduct = (p: Product) => setOpenProduct(p);

  const handleAddToCart = (
    product: Product,
    qty: number,
    variant: string | null,
    unitPrice: number
  ) => {
    cart.add(product, qty, variant, unitPrice);
    setCartOpen(true);
  };

  const scrollToShop = () =>
    document.getElementById("shop-all")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollToNew = () =>
    document.getElementById("new-arrivals")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollToCategories = () =>
    document.getElementById("categories")?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (loading) {
    return (
      <div className="sf-loading">
        <div className="sf-spinner" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="sf-loading">
        <div style={{ textAlign: "center" }}>
          <h1 className="sf-notfound-title">Store not found</h1>
          <p className="sf-notfound-sub">{error || "The link may be wrong."}</p>
        </div>
      </div>
    );
  }

  const brand = splitBrandName(store.name);
  const tagline = (store as any).tagline || "";
  const address = (store as any).address || "";
  const bannerUrl =
    (store as any).cover_url ||
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=85&auto=format&fit=crop";

  const headerClasses = [
    "sf-head",
    headerSolid ? "sf-head-solid" : "",
    headerHidden ? "sf-head-hidden" : "",
  ].filter(Boolean).join(" ");

  const catCount = Math.min(usedCategories.length, 5);

  return (
    <div className="sf-shell">
      {/* HEADER */}
      <header className={headerClasses}>
        <div className="sf-head-inner">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="sf-wordmark"
            aria-label={store.name}
          >
            {brand.first && <span className="sf-wordmark-1">{titleCase(brand.first)}</span>}
            {brand.second && <span className="sf-wordmark-2">{titleCase(brand.second)}</span>}
            {brand.first && <span className="sf-wordmark-dot">.</span>}
          </button>

          <div className="sf-head-spacer" />

          <nav className="sf-head-links">
            <button onClick={scrollToNew}>New</button>
            <button onClick={scrollToCategories}>Categories</button>
            <button onClick={scrollToShop}>Shop all</button>
          </nav>

          <div className="sf-head-actions">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="sf-icon-btn"
              aria-label="Search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="sf-icon-btn"
              aria-label="Cart"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 8h14l-1 12H6L5 8z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
              {cart.count > 0 && (
                <span className="sf-icon-badge">
                  {cart.count > 99 ? "99+" : cart.count}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="sf-head-search">
            <div className="sf-head-search-inner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                autoFocus
              />
            </div>
          </div>
        )}
      </header>

      {/* BANNER */}
      <section className="sf-banner">
        <img src={bannerUrl} alt="" />
        <div className="sf-banner-overlay" />
        <div className="sf-banner-text">
          {tagline ? (
            <h1 className="sf-banner-tagline">{tagline}</h1>
          ) : (
            <h1 className="sf-banner-tagline">{titleCase(store.name)}</h1>
          )}
          <button onClick={scrollToShop} className="sf-banner-cta">
            Shop now
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section className="sf-section" id="new-arrivals">
          <div className="sf-section-head">
            <div>
              <h2 className="sf-section-title">New arrivals</h2>
            </div>
            <button onClick={scrollToShop} className="sf-section-link">
              See all
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>

          <div className="sf-grid-4">
            {newArrivals.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                priority={i < 4}
                showNew={i < 4}
                showDiscount
                onClick={() => handleOpenProduct(p)}
                onAddToCart={() => handleAddToCart(p, 1, null, p.price)}
              />
            ))}
          </div>
        </section>
      )}

      {/* DIVIDER */}
      {newArrivals.length > 0 && usedCategories.length > 0 && (
        <div className="sf-divider" aria-hidden="true">
          <span className="sf-divider-line" />
          <span className="sf-divider-dot" />
          <span className="sf-divider-line" />
        </div>
      )}

      {/* CATEGORIES */}
      {usedCategories.length > 0 && (
        <section className="sf-section sf-section-wide" id="categories">
          <div className="sf-section-head-center">
            <h2 className="sf-section-title-center">Shop by category</h2>
          </div>

          <div className={`sf-cat-grid sf-cat-count-${catCount}`}>
            {usedCategories.map((c) => {
              const img = categoryImages[c.id];
              const active = activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCategory(active ? "all" : c.id);
                    scrollToShop();
                  }}
                  className={`sf-cat-tile ${active ? "on" : ""}`}
                >
                  {img ? (
                    <img src={img} alt={c.label} loading="lazy" />
                  ) : (
                    <div className="sf-cat-tile-placeholder">
                      {c.label.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="sf-cat-tile-overlay" />
                  <div className="sf-cat-tile-content">
                    <div className="sf-cat-tile-name">{titleCase(c.label)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* DIVIDER */}
      {usedCategories.length > 0 && (
        <div className="sf-divider" aria-hidden="true">
          <span className="sf-divider-line" />
          <span className="sf-divider-dot" />
          <span className="sf-divider-line" />
        </div>
      )}

      {/* SHOP ALL */}
      <section className="sf-section" id="shop-all">
        <div className="sf-section-head">
          <div>
            <h2 className="sf-section-title">
              {activeCategory === "all"
                ? "Shop all"
                : titleCase(getCategoryLabel(categories, activeCategory))}
            </h2>
          </div>

          {activeCategory !== "all" && (
            <button
              onClick={() => setActiveCategory("all")}
              className="sf-section-link"
            >
              Clear filter
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="sf-empty">
            <h3 className="sf-empty-title">Nothing here yet</h3>
            <p className="sf-empty-sub">
              {search.trim() ? `No products match "${search}".` : "Try another category."}
            </p>
          </div>
        ) : (
          <div className="sf-grid-all">
            {filtered.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                priority={i < 4}
                showNew={i < 4}
                showDiscount
                onClick={() => handleOpenProduct(p)}
                onAddToCart={() => handleAddToCart(p, 1, null, p.price)}
              />
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="sf-footer" id="contact">
        <div className="sf-footer-inner">
          <div className="sf-footer-top">
            <div>
              <div className="sf-footer-brand">
                {brand.first && <span className="sf-footer-brand-1">{titleCase(brand.first)}</span>}
                {brand.second && <span className="sf-footer-brand-2">{titleCase(brand.second)}</span>}
                {brand.first && <span className="sf-footer-brand-dot">.</span>}
              </div>
            </div>

            <div className="sf-footer-col">
              <h4 className="sf-footer-h">Shop</h4>
              <ul>
                <li><button onClick={scrollToNew}>New arrivals</button></li>
                <li><button onClick={scrollToCategories}>Categories</button></li>
                <li><button onClick={() => { setActiveCategory("all"); scrollToShop(); }}>Shop all</button></li>
              </ul>
            </div>

            <div className="sf-footer-col">
  <h4 className="sf-footer-h">Contact us</h4>
  <div className="sf-footer-contacts">
    {store.whatsapp && (
      <a
        href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
        target="_blank"
        rel="noopener"
        className="sf-contact"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2m0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.82c0 4.55-3.7 8.25-8.25 8.25-1.47 0-2.92-.4-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.39c0-4.55 3.7-8.24 8.23-8.24M8.53 7.33c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.76 2.68 4.25 3.76.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29-.25-.13-1.47-.72-1.7-.8-.23-.09-.39-.13-.55.13-.17.25-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.41.09-.17.04-.31-.02-.44-.06-.13-.55-1.34-.76-1.83-.2-.48-.4-.41-.55-.42l-.46-.01c-.16 0-.42.06-.64.31" />
        </svg>
        <span>{store.whatsapp}</span>
      </a>
    )}
    {store.instagram && (
      <a
        href={`https://instagram.com/${store.instagram}`}
        target="_blank"
        rel="noopener"
        className="sf-contact"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
        <span>@{store.instagram}</span>
      </a>
    )}
    {store.tiktok && (
      <a
        href={`https://tiktok.com/@${store.tiktok}`}
        target="_blank"
        rel="noopener"
        className="sf-contact"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.66a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.09" />
        </svg>
        <span>@{store.tiktok}</span>
      </a>
    )}
    {address && (
      <a
        href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
        target="_blank"
        rel="noopener"
        className="sf-contact"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span>{address}</span>
      </a>
    )}
  </div>
</div>

          <div className="sf-footer-bot">
            <span className="sf-footer-copyright">© 2026 {titleCase(store.name)}</span>
            <a
              href="https://biomart.com"
              target="_blank"
              rel="noopener"
              className="sf-footer-pow"
            >
              <svg viewBox="0 0 60 64" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
                <path d="M10 20H50L55 54Q55.4 58 51.5 58H8.5Q4.6 58 5 54Z" />
                <path d="M20 26V14A10 10 0 0 1 40 14V26" />
              </svg>
              Powered by biomart
            </a>
          </div>
        </div>
      </footer>

      {openProduct && (
        <ProductModal
          product={openProduct}
          products={products}
          store={store}
          onClose={() => setOpenProduct(null)}
          onAddToCart={(qty, variant, priceDelta) =>
            handleAddToCart(
              openProduct,
              qty,
              variant ?? null,
              openProduct.price + (priceDelta ?? 0)
            )
          }
          onOpenProduct={(p) => handleOpenProduct(p)}
        />
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
