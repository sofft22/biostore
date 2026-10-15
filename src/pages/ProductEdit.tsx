import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { products as productsApi, uploadImage, store as storeApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { SUBCATEGORIES } from "../lib/categories";
import { getCategories } from "../lib/storeData";
import { naira } from "../lib/format";
import type { Category, Product } from "../types";

const BADGES = ["Bestseller", "New", "Limited"];

interface Variant {
  label: string;
  priceDelta: number;
}

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { store: currentStore } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(!!id);
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [wasPrice, setWasPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState<string>("");
  const [badge, setBadge] = useState("");
  const [inStock, setInStock] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* Load categories */
  useEffect(() => {
    if (!currentStore?.slug) return;
    const list = getCategories(currentStore.slug);
    setCategories(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStore?.slug]);

  /* Default category to first when creating new product */
  useEffect(() => {
    if (!product && !categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, product, categoryId]);

  /* Load product for edit */
  useEffect(() => {
    if (!id || !currentStore?.slug) {
      setLoadingProduct(false);
      return;
    }
    (async () => {
      setLoadingProduct(true);
      try {
        const data = await storeApi.public(currentStore.slug);
        const found =
          (data.products as Product[] | undefined)?.find((x) => x.id === id) ??
          null;
        setProduct(found);
      } catch {
        setProduct(null);
      }
      setLoadingProduct(false);
    })();
  }, [id, currentStore?.slug]);

  /* Hydrate form from product */
  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setDescription(product.description ?? "");
    setPrice(String(product.price));
    setWasPrice(
      product.compare_at_price && product.compare_at_price > product.price
        ? String(product.compare_at_price)
        : ""
    );
    setCategoryId(product.category_id || (categories[0]?.id ?? ""));
    setSubcategory((product as any).subcategory ?? "");
    setBadge(product.badge ?? "");
    setInStock((product as any).inStock ?? product.in_stock ?? true);
    setImageUrl(product.image_url ?? "");
    setImageUrls(product.image_urls ?? []);
    setVariants(product.variants?.suggested ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const allImages = [imageUrl, ...imageUrls].filter(Boolean);

  const setImages = (list: string[]) => {
    setImageUrl(list[0] ?? "");
    setImageUrls(list.slice(1));
  };

  const handleImageUpload = async (file: File) => {
    if (allImages.length >= 3) {
      setError("Max 3 images per product");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImages([...allImages, url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
  };

  const removeImage = (i: number) =>
    setImages(allImages.filter((_, idx) => idx !== i));

  const moveImage = (i: number, dir: -1 | 1) => {
    const next = [...allImages];
    const t = i + dir;
    if (t < 0 || t >= next.length) return;
    [next[i], next[t]] = [next[t], next[i]];
    setImages(next);
  };

  const addVariant = () =>
    setVariants((v) => [...v, { label: "", priceDelta: 0 }]);

  const updateVariant = (i: number, patch: Partial<Variant>) =>
    setVariants((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v))
    );

  const removeVariant = (i: number) =>
    setVariants((prev) => prev.filter((_, idx) => idx !== i));

  /* Computed values */
  const numericPrice = Number(price) || 0;
  const numericWas = Number(wasPrice) || 0;
  const hasValidWas = numericWas > numericPrice && numericPrice > 0;
  const discountPercent = hasValidWas
    ? Math.round(((numericWas - numericPrice) / numericWas) * 100)
    : 0;

  const handleSave = async () => {
    setError("");
    if (!name.trim()) return setError("Name is required");
    if (!price || Number(price) <= 0) return setError("Valid price is required");
    if (!imageUrl) return setError("Main image is required");
    if (!categoryId) return setError("Pick a category first");
    if (wasPrice && numericWas <= numericPrice) {
      return setError("'Was' price must be higher than current price");
    }

    setSaving(true);

    const payload: any = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      compare_at_price: hasValidWas ? numericWas : null,
      category_id: categoryId,
      subcategory: (categoryId === "clothing" && subcategory
        ? subcategory
        : null) as any,
      badge: badge || null,
      // Send BOTH camelCase and snake_case so backend accepts either
      in_stock: inStock,
      inStock: inStock,
      image_url: imageUrl,
      image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      variants: variants.length > 0 ? { suggested: variants } : undefined,
    };

    try {
      if (product) {
        await productsApi.update(product.id, payload);
      } else {
        await productsApi.create(payload);
      }
      nav("/dashboard/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm(`Delete "${product.name}"?`)) return;
    try {
      await productsApi.remove(product.id);
      nav("/dashboard/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  };

  if (loadingProduct) {
    return (
      <DashboardLayout>
        <div className="dash-loading-inline">
          <div className="dash-spinner" />
        </div>
      </DashboardLayout>
    );
  }

  const canAddMore = allImages.length < 3;
  const isClothing = categoryId === "clothing";

  return (
    <DashboardLayout>
      <button onClick={() => nav("/dashboard/products")} className="pd-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to products
      </button>

      <section className="dash-head" style={{ padding: 0 }}>
        <p className="dash-head-eyebrow">{product ? "Edit" : "New"}</p>
        <h1 className="dash-title">
          {product ? <>Edit <em>product</em>.</> : <>New <em>product</em>.</>}
        </h1>
      </section>

      <div className="pd-form">
        {/* BASICS */}
        <section className="pd-section">
          <h2 className="dash-section-title">Basics</h2>
          <div className="pd-fields">
            <Field label="Name">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mira Tote" className="pd-input" />
            </Field>
            <Field label="Description">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short, evocative description." rows={3} className="pd-input" />
            </Field>
          </div>
        </section>

        {/* PRICING */}
        <section className="pd-section">
          <h2 className="dash-section-title">Pricing</h2>
          <div className="pd-fields">
            <Field label="Price" hint="What customers pay today">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="20000"
                className="pd-input"
              />
            </Field>
            <Field label="Was" hint="Optional. Original price before discount. Leave empty for no sale.">
              <input
                type="number"
                value={wasPrice}
                onChange={(e) => setWasPrice(e.target.value)}
                placeholder="27000"
                className="pd-input"
              />
            </Field>
          </div>

          {hasValidWas && (
            <div className="pd-price-preview">
              <span className="pd-price-preview-was">{naira(numericWas)}</span>
              <span className="pd-price-preview-arrow">→</span>
              <span className="pd-price-preview-now">{naira(numericPrice)}</span>
              <span className="pd-price-preview-badge">{discountPercent}% off</span>
            </div>
          )}
        </section>

        {/* CATEGORIZATION */}
        <section className="pd-section">
          <div className="pd-section-head">
            <div>
              <h2 className="dash-section-title">Categorization</h2>
              <p className="pd-section-sub">Group your product so customers can find it.</p>
            </div>
            <button
              type="button"
              onClick={() => nav("/settings")}
              className="pd-add-variant"
            >
              + Manage
            </button>
          </div>
          <div className="pd-fields">
            <Field label="Category">
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  if (e.target.value !== "clothing") setSubcategory("");
                }}
                className="pd-input"
              >
                {categories.length === 0 && <option value="">No categories yet — add one in Settings</option>}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </Field>

            {isClothing && (
              <Field label="Subcategory">
                <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="pd-input">
                  <option value="">None</option>
                  {SUBCATEGORIES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Badge" hint="Shows as a small tag on the product card">
              <select value={badge} onChange={(e) => setBadge(e.target.value)} className="pd-input">
                <option value="">None</option>
                {BADGES.map((b) => (<option key={b} value={b}>{b}</option>))}
              </select>
            </Field>
          </div>
        </section>

        {/* STOCK */}
        <section className="pd-section">
          <h2 className="dash-section-title">Stock</h2>
          <div className="pd-toggle-row">
            <div>
              <p className="pd-toggle-title">Available for purchase</p>
              <p className="pd-toggle-hint">
                {inStock ? "Customers can buy this product" : "Hidden — shows as sold out on your store"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setInStock(!inStock)}
              className={`pd-toggle ${inStock ? "on" : ""}`}
              aria-label="Toggle stock"
            >
              <span />
            </button>
          </div>
        </section>

        {/* IMAGES */}
        <section className="pd-section">
          <div className="pd-section-head">
            <div>
              <h2 className="dash-section-title">Images</h2>
              <p className="pd-section-sub">First image is the main one. Use arrows to reorder.</p>
            </div>
            <p className="pd-count">{allImages.length} / 3</p>
          </div>

          <div className="pd-images">
            {allImages.map((url, i) => (
              <div key={i} className="pd-image">
                <img src={url} alt="" loading="lazy" decoding="async" />
                <button type="button" onClick={() => removeImage(i)} className="pd-image-x" aria-label="Remove image">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" width="13" height="13"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
                {i === 0 && <span className="pd-image-main">Main</span>}
                {allImages.length > 1 && (
                  <div className="pd-image-move">
                    {i > 0 && (
                      <button type="button" onClick={() => moveImage(i, -1)} aria-label="Move left">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" width="13" height="13"><path d="M15 18l-6-6 6-6" /></svg>
                      </button>
                    )}
                    {i < allImages.length - 1 && (
                      <button type="button" onClick={() => moveImage(i, 1)} aria-label="Move right">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" width="13" height="13"><path d="M9 6l6 6-6 6" /></svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {canAddMore && (
              <label className="pd-image-add">
                {uploading ? (
                  <div className="dash-spinner" />
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" width="18" height="18"><path d="M12 5v14M5 12h14" /></svg>
                    <span>Add</span>
                  </>
                )}
                <input type="file" accept="image/*" hidden disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file); e.target.value = ""; }} />
              </label>
            )}
          </div>
        </section>

        {/* VARIANTS */}
        <section className="pd-section">
          <div className="pd-section-head">
            <div>
              <h2 className="dash-section-title">Variants</h2>
              <p className="pd-section-sub">Optional. Sizes, colors, or pack options.</p>
            </div>
            <button type="button" onClick={addVariant} className="pd-add-variant">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" width="14" height="14"><path d="M12 5v14M5 12h14" /></svg>
              Add
            </button>
          </div>

          {variants.length === 0 ? (
            <div className="pd-variant-empty">
              No variants — customers just pick a quantity.
            </div>
          ) : (
            <div className="pd-variants">
              {variants.map((v, i) => {
                const finalPrice = numericPrice + (v.priceDelta || 0);
                const hasExtra = (v.priceDelta || 0) > 0;
                return (
                  <div key={i} className="pd-variant-card">
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="pd-variant-x"
                      aria-label="Remove variant"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>

                    <div className="pd-variant-row">
                      <div className="pd-variant-field">
                        <label className="pd-field-label">Label</label>
                        <input
                          value={v.label}
                          onChange={(e) => updateVariant(i, { label: e.target.value })}
                          placeholder="e.g. Size M"
                          className="pd-input"
                        />
                      </div>

                      <div className="pd-variant-field">
                        <label className="pd-field-label">Price</label>
                        <div className="pd-variant-price">
                          <button
                            type="button"
                            onClick={() => updateVariant(i, { priceDelta: 0 })}
                            className={`pd-variant-pill ${!hasExtra ? "on" : ""}`}
                          >
                            Same price
                          </button>
                          <button
                            type="button"
                            onClick={() => updateVariant(i, { priceDelta: hasExtra ? v.priceDelta : 1000 })}
                            className={`pd-variant-pill ${hasExtra ? "on" : ""}`}
                          >
                            + Extra
                          </button>
                        </div>
                      </div>
                    </div>

                    {hasExtra && (
                      <div className="pd-variant-extra-row">
                        <label className="pd-field-label">Add to base price</label>
                        <div className="pd-variant-extra-input">
                          <span className="pd-variant-extra-prefix">+ ₦</span>
                          <input
                            type="number"
                            value={v.priceDelta || ""}
                            onChange={(e) => updateVariant(i, { priceDelta: Number(e.target.value) || 0 })}
                            placeholder="1000"
                            className="pd-input"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pd-variant-preview">
                      <span className="pd-variant-preview-label">{v.label.trim() || "Variant"}</span>
                      <span className="pd-variant-preview-dot">·</span>
                      <span className="pd-variant-preview-price">{naira(finalPrice)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {error && <p className="pd-error">{error}</p>}

        <div className="pd-actions">
          {product && (
            <button type="button" onClick={handleDelete} className="pd-delete">Delete product</button>
          )}
          <button type="button" onClick={handleSave} disabled={saving || uploading} className="pd-save">
            {saving ? "Saving…" : product ? "Save changes" : "Create product"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="pd-field">
      <div className="pd-field-label-wrap">
        <label className="pd-field-label">{label}</label>
        {hint && <p className="pd-field-hint">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
