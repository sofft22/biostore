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

/** Split "Adaeze's Closet" into { first, second } — first word bold, rest thin */
function splitBrandName(name: string): { first: string; second: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], second: "" };
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
  const lastYRef = useRef(0);

  useEffect(() => {
    if (!slug) return;
    setCategories(getCategories(slug));
    setCategoryImages(getCategoryImages(slug));
  }, [slug]);

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
      if (p.category_id) usedIds.add(p.category_id);
    }
    return categories.filter((c) => usedIds.has(c.id));
  }, [categories, products]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      if (p.category_id) {
        map[p.category_id] = (map[p.category_id] ?? 0) + 1;
      }
    }
    return map;
  }, [products]);

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
      list = list.filter((p) => p.category_id === activeCategory);
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

  const scrollToShop = () => {
    document.getElementById("shop-all")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const scrollToNew = () => {
    document.getElementById("new-arrivals")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const scrollToCategories = () => {
    document.getElementById("categories")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
  const headerClasses = [
    "sf-head",
    headerSolid ? "sf-head-solid" : "",
    headerHidden ? "sf-head-hidden" : "",
  ].filter(Boolean).join(" ");

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
            <span className="sf-wordmark-1">{brand.first}</span>
            {brand.second && (
              <span className="sf-wordmark-2">{brand.second}</span>
            )}
            <span className="sf-wordmark-dot">.</span>
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
        <img
          src={
            (store as any).cover_url ||
            "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=85&auto=format&fit=crop"
          }
          alt=""
        />
        <div className="sf-banner-overlay" />
        <div className="sf-banner-text">
          <h1 className="sf-banner-tagline">
            {store.bio || "Where Lagos style meets everyday luxury."}
          </h1>
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
              <p className="sf-section-sub">Fresh in this week.</p>
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
                onChat={() => {}}
                onAddToCart={() => handleAddToCart(p, 1, null, p.price)}
              />
            ))}
          </div>
        </section>
      )}

      {/* CATEGORIES — always show when there's at least 1 */}
      {usedCategories.length > 0 && (
        <section className="sf-section sf-section-wide" id="categories">
          <div className="sf-section-head-center">
            <h2 className="sf-section-title-center">Shop by category</h2>
          </div>

          <div className="sf-cat-grid">
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
                    <div className="sf-cat-tile-name">{c.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* SHOP ALL */}
      <section className="sf-section" id="shop-all">
        <div className="sf-section-head">
          <div>
            <h2 className="sf-section-title">
              {activeCategory === "all"
                ? "Shop all"
                : getCategoryLabel(categories, activeCategory)}
            </h2>
            <p className="sf-section-sub">
              {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
              {search.trim() && ` matching "${search}"`}
            </p>
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
              {search.trim()
                ? `No products match "${search}".`
                : "Try another category."}
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
                onChat={() => {}}
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
                <span className="sf-footer-brand-1">{brand.first}</span>
                {brand.second && (
                  <span className="sf-footer-brand-2">{brand.second}</span>
                )}
                <span className="sf-footer-brand-dot">.</span>
              </div>
              {store.bio && <p className="sf-footer-tag">{store.bio}</p>}
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
              <div className="sf-footer-socials">
                {store.whatsapp && (
                  <a
                    href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener"
                    className="sf-social wa"
                    aria-label="WhatsApp"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.5 14.4c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.66.15-.2.3-.77.96-.94 1.16-.18.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.18-.3-.02-.46.13-.6.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.9-2.18-.24-.57-.48-.5-.66-.5h-.55c-.2 0-.5.07-.77.37-.27.3-1.02.99-1.02 2.42s1.04 2.81 1.19 3c.15.2 2.05 3.13 4.96 4.39.7.3 1.24.48 1.66.61.7.22 1.33.19 1.83.12.56-.08 1.75-.72 1.99-1.4.25-.7.25-1.29.18-1.41-.07-.13-.27-.2-.56-.35z M12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.43 1.28 4.87L2 22l5.28-1.38c1.4.78 3 .22 4.72 1.22 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
                    </svg>
                  </a>
                )}
                {store.instagram && (
                  <a
                    href={`https://instagram.com/${store.instagram}`}
                    target="_blank"
                    rel="noopener"
                    className="sf-social ig"
                    aria-label="Instagram"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                    </svg>
                  </a>
                )}
                {store.tiktok && (
                  <a
                    href={`https://tiktok.com/@${store.tiktok}`}
                    target="_blank"
                    rel="noopener"
                    className="sf-social tt"
                    aria-label="TikTok"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.5 6.5a4.5 4.5 0 0 1-3.5-1.6v7.4a5.8 5.8 0 1 1-5.8-5.8c.2 0 .4 0 .6.05v2.95a2.85 2.85 0 1 0 2.2 2.78V2h3a4.5 4.5 0 0 0 3.5 4.5z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="sf-footer-bot">
            <span>
              <span className="sf-footer-brand-1">{brand.first}</span>
              {brand.second && (
                <span className="sf-footer-brand-2">{brand.second}</span>
              )}
              <span className="sf-footer-brand-dot">.</span>
              {" "}
              <span style={{ opacity: 0.7, marginLeft: 6, fontSize: "0.85em" }}>· Lagos</span>
            </span>
            <span className="sf-footer-pow">
              <svg viewBox="0 0 60 64" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
                <path d="M10 20H50L55 54Q55.4 58 51.5 58H8.5Q4.6 58 5 54Z" />
                <path d="M20 26V14A10 10 0 0 1 40 14V26" />
              </svg>
              Powered by biomart
            </span>
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
