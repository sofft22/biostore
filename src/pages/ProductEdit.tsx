import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { products as productsApi, uploadImage, store as storeApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { CATEGORIES, SUBCATEGORIES } from "../lib/categories";
import type { Product } from "../types";

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

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [categoryId, setCategoryId] = useState(CATEGORIES[0]?.id ?? "bags");
  const [subcategory, setSubcategory] = useState<string>("");
  const [badge, setBadge] = useState("");
  const [inStock, setInStock] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* Load existing product */
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

  /* Hydrate form */
  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setDescription(product.description ?? "");
    setPrice(String(product.price));
    setCompareAtPrice(
      product.compare_at_price ? String(product.compare_at_price) : ""
    );
    setCategoryId(product.category_id);
    setSubcategory((product as any).subcategory ?? "");
    setBadge(product.badge ?? "");
    setInStock(product.in_stock);
    setIsFeatured(!!product.is_featured);
    setSortOrder(
      (product as any).sort_order != null
        ? String((product as any).sort_order)
        : ""
    );
    setImageUrl(product.image_url ?? "");
    setImageUrls(product.image_urls ?? []);
    setVariants(product.variants?.suggested ?? []);
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

  const handleSave = async () => {
    setError("");
    if (!name.trim()) return setError("Name is required");
    if (!price || Number(price) <= 0) return setError("Valid price is required");
    if (!imageUrl) return setError("Main image is required");

    setSaving(true);
    const payload: Partial<Product> = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
      category_id: categoryId,
      subcategory: (categoryId === "clothing" && subcategory
        ? subcategory
        : null) as any,
      badge: badge || null,
      in_stock: inStock,
      is_featured: isFeatured,
      image_url: imageUrl,
      image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      variants: variants.length > 0 ? { suggested: variants } : undefined,
      sort_order: sortOrder !== "" ? Number(sortOrder) : (null as any),
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
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="14"
          height="14"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to products
      </button>

      <section className="dash-head">
        <p className="dash-head-eyebrow">{product ? "Edit" : "New"}</p>
        <h1 className="dash-title">
          {product ? (
            <>
              Edit <em>product</em>.
            </>
          ) : (
            <>
              New <em>product</em>.
            </>
          )}
        </h1>
      </section>

      <div className="pd-form">
        {/* Basics */}
        <section className="pd-section">
          <h2 className="dash-section-title">Basics</h2>
          <div className="pd-fields">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mira Tote"
                className="pd-input"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short, evocative description."
                rows={3}
                className="pd-input"
              />
            </Field>
            <Field label="Price (₦)">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="32000"
                className="pd-input"
              />
            </Field>
            <Field
              label="Compare at (₦)"
              hint="Shows original price slashed next to current"
            >
              <input
                type="number"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="40000"
                className="pd-input"
              />
            </Field>
          </div>
        </section>

        {/* Categorization */}
        <section className="pd-section">
          <h2 className="dash-section-title">Categorization</h2>
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
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            {isClothing && (
              <Field label="Subcategory">
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="pd-input"
                >
                  <option value="">None</option>
                  {SUBCATEGORIES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Badge">
              <select
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="pd-input"
              >
                <option value="">None</option>
                {BADGES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        {/* Featured */}
        <section className="pd-section">
          <h2 className="dash-section-title">Banner</h2>
          <div className="pd-toggle-row">
            <div>
              <p className="pd-toggle-title">Featured in banner</p>
              <p className="pd-toggle-hint">
                {isFeatured
                  ? "Shows at the top of your storefront"
                  : "Only one product can be featured"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFeatured(!isFeatured)}
              className={`pd-toggle ${isFeatured ? "on" : ""}`}
              aria-label="Toggle featured"
            >
              <span />
            </button>
          </div>
        </section>

        {/* Stock */}
        <section className="pd-section">
          <h2 className="dash-section-title">Stock</h2>
          <div className="pd-toggle-row">
            <div>
              <p className="pd-toggle-title">In stock</p>
              <p className="pd-toggle-hint">
                {inStock ? "Available for purchase" : "Hidden from sale"}
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

        {/* Display order */}
        <section className="pd-section">
          <h2 className="dash-section-title">Display order</h2>
          <div className="pd-fields">
            <Field
              label="Sort order"
              hint="Lower = earlier. Leave empty to use newest."
            >
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="e.g. 1, 2, 3…"
                className="pd-input"
              />
            </Field>
          </div>
        </section>

        {/* Images */}
        <section className="pd-section">
          <div className="pd-section-head">
            <div>
              <h2 className="dash-section-title">Images</h2>
              <p className="pd-section-sub">
                First image is main. Use arrows to reorder.
              </p>
            </div>
            <p className="pd-count">{allImages.length} / 3</p>
          </div>

          <div className="pd-images">
            {allImages.map((url, i) => (
              <div key={i} className="pd-image">
                <img src={url} alt="" loading="lazy" decoding="async" />

                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="pd-image-x"
                  aria-label="Remove image"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    width="13"
                    height="13"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>

                {i === 0 && <span className="pd-image-main">Main</span>}

                {allImages.length > 1 && (
                  <div className="pd-image-move">
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(i, -1)}
                        aria-label="Move left"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          width="13"
                          height="13"
                        >
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                    )}
                    {i < allImages.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(i, 1)}
                        aria-label="Move right"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          width="13"
                          height="13"
                        >
                          <path d="M9 6l6 6-6 6" />
                        </svg>
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
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      width="18"
                      height="18"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span>Add</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        </section>

        {/* Variants */}
        <section className="pd-section">
          <div className="pd-section-head">
            <div>
              <h2 className="dash-section-title">Variants</h2>
              <p className="pd-section-sub">
                Optional. Sizes, shades, or pack options.
              </p>
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="pd-add-variant"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                width="14"
                height="14"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add
            </button>
          </div>

          {variants.length === 0 ? (
            <div className="pd-variant-empty">
              No variants — single price.
            </div>
          ) : (
            <div className="pd-variants">
              {variants.map((v, i) => (
                <div key={i} className="pd-variant">
                  <div className="pd-variant-grid">
                    <Field label="Label">
                      <input
                        value={v.label}
                        onChange={(e) =>
                          updateVariant(i, { label: e.target.value })
                        }
                        placeholder="e.g. Size M"
                        className="pd-input"
                      />
                    </Field>
                    <Field label="+ Price (₦)">
                      <input
                        type="number"
                        value={v.priceDelta}
                        onChange={(e) =>
                          updateVariant(i, {
                            priceDelta: Number(e.target.value),
                          })
                        }
                        placeholder="0"
                        className="pd-input"
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="pd-remove-variant"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && <p className="pd-error">{error}</p>}

        {/* Actions */}
        <div className="pd-actions">
          {product && (
            <button
              type="button"
              onClick={handleDelete}
              className="pd-delete"
            >
              Delete product
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploading}
            className="pd-save"
          >
            {saving
              ? "Saving…"
              : product
              ? "Save changes"
              : "Create product"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* Field wrapper */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
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