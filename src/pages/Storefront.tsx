import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useStoreContext } from "../context/StoreContext";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import CartDrawer from "../components/CartDrawer";
import { getCategoryLabel } from "../lib/categories";
import { getCategories, getCategoryImages } from "../lib/storeData";
import type { Category, Product } from "../types";

function pickFeatured(products: Product[]): Product | null {
  if (products.length === 0) return null;
  const explicit = products.find((p) => p.is_featured && p.in_stock);
  if (explicit) return explicit;
  const discounted = products.find(
    (p) => p.in_stock && p.compare_at_price && p.compare_at_price > p.price
  );
  if (discounted) return discounted;
  return products.find((p) => p.in_stock) ?? products[0];
}

export default function Storefront() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { loading, store, products, error } = useStoreContext();
  const cart = useCart();

  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!slug) return;
    setCategories(getCategories(slug));
    setCategoryImages(getCategoryImages(slug));
  }, [slug]);

  const featured = useMemo(() => pickFeatured(products), [products]);

  /* Only categories that have at least one product */
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

  const handleOpenProduct = (p: Product) => {
    console.log("[track]", p.id);
    setOpenProduct(p);
  };

  const handleAddToCart = (
    product: Product,
    qty: number,
    variant: string | null,
    unitPrice: number
  ) => {
    cart.add(product, qty, variant, unitPrice);
    setCartOpen(true);
  };

  const scrollToGrid = () => {
    const el = document.getElementById("shop-grid");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const currency = (n: number) => "₦" + n.toLocaleString("en-NG");

  return (
    <div className="sf-shell">
      <header className="sf-head">
        <div className="sf-head-inner">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="sf-wordmark">
            {store.name}
          </button>

          <div className="sf-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
            </svg>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" />
          </div>

          <button onClick={() => setCartOpen(true)} className="sf-cart" aria-label="Cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            {cart.count > 0 && (
              <span className="sf-cart-badge">{cart.count > 99 ? "99+" : cart.count}</span>
            )}
          </button>
        </div>
      </header>

      {featured && (
        <section className="sf-banner">
          <div className="sf-banner-inner">
            <div className="sf-banner-media">
              <img
                src={
                  (featured.images && featured.images[0]) ||
                  featured.image_url ||
                  "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=1600&q=85&auto=format&fit=crop"
                }
                alt={featured.name}
              />
            </div>
            <div className="sf-banner-text">
              <span className="sf-banner-tag">Featured</span>
              <h2 className="sf-banner-name">{featured.name}</h2>
              {featured.description && (
                <p className="sf-banner-desc">{featured.description}</p>
              )}
              <div className="sf-banner-price">
                <b>{currency(featured.price)}</b>
                {featured.compare_at_price && featured.compare_at_price > featured.price && (
                  <s>{currency(featured.compare_at_price)}</s>
                )}
              </div>
              <button onClick={() => handleOpenProduct(featured)} className="sf-banner-cta">
                Shop this
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      )}

      <main className="sf-main" id="shop-grid">
        {usedCategories.length > 1 && (
          <section className="sf-cats">
            <div className="sf-cats-head">
              <h2 className="sf-cats-title">Shop by category</h2>
            </div>
            <div className="sf-cat-grid">
              {usedCategories.map((c) => {
                const img = categoryImages[c.id];
                const active = activeCategory === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => { setActiveCategory(active ? "all" : c.id); scrollToGrid(); }}
                    className={`sf-cat-tile-img ${active ? "on" : ""}`}
                  >
                    {img ? (
                      <img src={img} alt={c.label} loading="lazy" />
                    ) : (
                      <div className="sf-cat-tile-placeholder">{c.label.charAt(0)}</div>
                    )}
                    <div className="sf-cat-tile-overlay" />
                    <div className="sf-cat-tile-content">
                      <p className="sf-cat-tile-name">{c.label}</p>
                      <p className="sf-cat-tile-count">
                        {categoryCounts[c.id]} {categoryCounts[c.id] === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="sf-products-head">
          <div>
            <h2 className="sf-products-title">
              {activeCategory === "all" ? "All products" : getCategoryLabel(categories, activeCategory)}
            </h2>
            <p className="sf-products-sub">
              {filtered.length} {filtered.length === 1 ? "item" : "items"}
            </p>
          </div>
        </section>

        <div className="sf-chips-wrap">
          <div className="sf-chips">
            <button onClick={() => setActiveCategory("all")} className={`sf-chip ${activeCategory === "all" ? "on" : ""}`}>
              All
              <span className="sf-chip-count">{products.length}</span>
            </button>
            {usedCategories.map((c) => (
              <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`sf-chip ${activeCategory === c.id ? "on" : ""}`}>
                {c.label}
                <span className="sf-chip-count">{categoryCounts[c.id]}</span>
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="sf-empty">
            <p className="sf-empty-title">Nothing here yet</p>
            <p className="sf-empty-sub">
              {search.trim() ? `No products match "${search}".` : "Try another category."}
            </p>
          </div>
        ) : (
          <div className="sf-grid">
            {filtered.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                priority={i < 4}
                showDiscount
                onClick={() => handleOpenProduct(p)}
                onChat={() => {}}
                onAddToCart={() => handleAddToCart(p, 1, null, p.price)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="sf-footer">
        <div className="sf-footer-inner">
          <div className="sf-footer-grid">
            <div className="sf-footer-brand-col">
              <div className="sf-footer-brand">
                <svg viewBox="0 0 60 64" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
                  <path d="M10 20H50L55 54Q55.4 58 51.5 58H8.5Q4.6 58 5 54Z" />
                  <path d="M20 26V14A10 10 0 0 1 40 14V26" />
                </svg>
                {store.name}
              </div>
              {store.bio && <p className="sf-footer-tag">{store.bio}</p>}
            </div>

            <div className="sf-footer-col">
              <h4 className="sf-footer-h">Shop</h4>
              <ul>
                <li><button onClick={() => setActiveCategory("all")}>All products</button></li>
                {usedCategories.slice(0, 3).map((c) => (
                  <li key={c.id}><button onClick={() => setActiveCategory(c.id)}>{c.label}</button></li>
                ))}
              </ul>
            </div>

            <div className="sf-footer-col">
              <h4 className="sf-footer-h">Contact</h4>
              <div className="sf-footer-socials">
                {store.whatsapp && (
                  <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="sf-footer-social">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.48 3.106" /></svg>
                    WhatsApp
                  </a>
                )}
                {store.instagram && (
                  <a href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noopener" className="sf-footer-social">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
                    </svg>
                    Instagram
                  </a>
                )}
                {store.tiktok && (
                  <a href={`https://tiktok.com/@${store.tiktok}`} target="_blank" rel="noopener" className="sf-footer-social">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 8.5a5.6 5.6 0 0 1-3.6-1.3v6.9a5.9 5.9 0 1 1-5.9-5.9c.3 0 .6 0 .9.1v3a2.9 2.9 0 1 0 2 2.8V2h3a5.6 5.6 0 0 0 3.6 5.5v1z" /></svg>
                    TikTok
                  </a>
                )}
              </div>
            </div>

            <div className="sf-footer-col">
              <h4 className="sf-footer-h">Help</h4>
              <ul>
                {store.whatsapp && (
                  <li><a href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener">Chat on WhatsApp</a></li>
                )}
                <li><a href="#">Shipping</a></li>
                <li><a href="#">Returns</a></li>
              </ul>
            </div>
          </div>

          <div className="sf-footer-bottom">
            <span>© {new Date().getFullYear()} {store.name}</span>
            <span className="sf-footer-pow">
              <svg viewBox="0 0 60 64" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
                <path d="M10 20H50L55 54Q55.4 58 51.5 58H8.5Q4.6 58 5 54Z" />
                <path d="M20 26V14A10 10 0 0 1 40 14V26" />
              </svg>
              Store powered by biomart
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
            handleAddToCart(openProduct, qty, variant ?? null, openProduct.price + (priceDelta ?? 0))
          }
          onOpenProduct={(p) => handleOpenProduct(p)}
        />
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
