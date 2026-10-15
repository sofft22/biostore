import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import DashboardLayout from "../components/DashboardLayout";
import {
  store as storeApi,
  uploadImage,
  products as productsApi,
} from "../lib/api";
import {
  getCategoriesWithImages,
  addCategory,
  updateCategory,
  removeCategory,
  setCategoryImage,
  removeCategoryImage,
} from "../lib/storeData";
import type { Category, Product } from "../types";

type CatWithImg = Category & { image?: string };

function formatPrice(n: number): string {
  return "₦" + n.toLocaleString("en-NG");
}

export default function Settings() {
  const { store, refresh } = useAuth();
  const toast = useToast();

  /* ── store fields ── */
  const [name, setName] = useState(store?.name ?? "");
  const [bio, setBio] = useState(store?.bio ?? "");
  const [whatsapp, setWhatsapp] = useState(store?.whatsapp ?? "");
  const [instagram, setInstagram] = useState(store?.instagram ?? "");
  const [tiktok, setTiktok] = useState(store?.tiktok ?? "");
  const [saving, setSaving] = useState(false);

  /* ── categories ── */
  const [categories, setCategories] = useState<CatWithImg[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatImage, setNewCatImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  /* ── featured ── */
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredId, setFeaturedId] = useState<string>("");
  const [settingFeatured, setSettingFeatured] = useState(false);

  const refreshCategories = () => {
    if (!store?.slug) return;
    setCategories(getCategoriesWithImages(store.slug));
  };

  useEffect(() => {
    refreshCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.slug]);

  useEffect(() => {
    if (!store?.slug) return;
    (async () => {
      try {
        const data = await storeApi.public(store.slug);
        const list = (data.products as Product[]) ?? [];
        setProducts(list);

        // Featured: the one marked is_featured, else the oldest (first added)
        const marked = list.find((p) => p.is_featured);
        if (marked) {
          setFeaturedId(marked.id);
        } else if (list.length > 0) {
          const oldest = [...list].sort(
            (a, b) =>
              new Date((a as any).created_at ?? 0).getTime() -
              new Date((b as any).created_at ?? 0).getTime()
          )[0];
          setFeaturedId(oldest.id);
        }
      } catch {
        setProducts([]);
      }
    })();
  }, [store?.slug]);

  useEffect(() => {
    if (!store) return;
    setName(store.name);
    setBio(store.bio ?? "");
    setWhatsapp(store.whatsapp);
    setInstagram(store.instagram ?? "");
    setTiktok(store.tiktok ?? "");
  }, [store]);

  if (!store) return null;

  /* ── store save ── */
  const handleSaveStore = async () => {
    setSaving(true);
    try {
      await storeApi.update({
        name: name.trim(),
        bio: bio.trim() || null,
        whatsapp: whatsapp.trim(),
        instagram: instagram.trim() || null,
        tiktok: tiktok.trim() || null,
      });
      await refresh();
      toast.show("Store saved");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Could not save");
    }
    setSaving(false);
  };

  /* ── category handlers ── */
  const handleAddCategory = async () => {
    const result = addCategory(store.slug, newCatName);
    if (!result.ok) { toast.show(result.error); return; }
    if (newCatImage && result.category) {
      try {
        const url = await uploadImage(dataUrlToBlob(newCatImage));
        setCategoryImage(store.slug, result.category.id, url);
      } catch {
        /* non-fatal */
      }
    }
    setNewCatName("");
    setNewCatImage(null);
    refreshCategories();
    toast.show("Category added");
  };

  const handleRename = (id: string) => {
    const result = updateCategory(store.slug, id, editingName);
    if (!result.ok) { toast.show(result.error); return; }
    setEditingId(null);
    setEditingName("");
    refreshCategories();
    toast.show("Renamed");
  };

  const handleDeleteCategory = (id: string, label: string) => {
    if (!confirm(`Delete "${label}"? Products in it won't be deleted.`)) return;
    removeCategory(store.slug, id);
    refreshCategories();
    toast.show("Category deleted");
  };

  const handleCategoryImage = async (id: string, file: File) => {
    setUploadingId(id);
    try {
      const url = await uploadImage(file);
      setCategoryImage(store.slug, id, url);
      refreshCategories();
      toast.show("Image saved");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Upload failed");
    }
    setUploadingId(null);
  };

  const handleRemoveCategoryImage = (id: string) => {
    removeCategoryImage(store.slug, id);
    refreshCategories();
    toast.show("Image removed");
  };

  /* ── featured handler ── */
  const handleSetFeatured = async (productId: string) => {
    setSettingFeatured(true);
    try {
      for (const p of products) {
        const shouldBeFeatured = p.id === productId;
        if (!!p.is_featured !== shouldBeFeatured) {
          await productsApi.update(p.id, { is_featured: shouldBeFeatured });
        }
      }
      setFeaturedId(productId);
      toast.show("Featured product updated");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Could not update");
    }
    setSettingFeatured(false);
  };

  return (
    <DashboardLayout>
      <section className="dash-head" style={{ padding: 0 }}>
        <p className="dash-head-eyebrow">Settings</p>
        <h1 className="dash-title">
          Your <em>store</em>.
        </h1>
        <p className="dash-head-lead">These appear on your public storefront.</p>
      </section>

      {/* ── STORE PROFILE ── */}
      <section className="st-panel">
        <div className="st-panel-head">
          <h2 className="dash-section-title">Store profile</h2>
        </div>
        <div className="st-panel-body">
          <div className="st-field">
            <label className="st-label">Store name</label>
            <input className="st-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          </div>
          <div className="st-field">
            <label className="st-label">Bio</label>
            <textarea className="st-input st-textarea" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bags, shoes and skincare · Lagos" rows={2} />
          </div>
          <div className="st-field">
            <label className="st-label">WhatsApp number</label>
            <input className="st-input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="08012345678" inputMode="tel" />
          </div>
          <div className="st-row-2">
            <div className="st-field">
              <label className="st-label">Instagram handle</label>
              <input className="st-input" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="adaezescloset" />
            </div>
            <div className="st-field">
              <label className="st-label">TikTok handle</label>
              <input className="st-input" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="adaezescloset" />
            </div>
          </div>
          <button onClick={handleSaveStore} disabled={saving} className="st-save">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="st-panel">
        <div className="st-panel-head">
          <h2 className="dash-section-title">Categories</h2>
        </div>
        <div className="st-panel-body">
          <p className="st-help">
            Group your products so customers find what they want. Add an image to make a category stand out.
          </p>

          {/* Add new */}
          <div className="cat-form">
            <div className="cat-form-row">
              <label className="cat-form-photo" title="Add photo">
                {newCatImage ? (
                  <img src={newCatImage} alt="" />
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setNewCatImage(String(reader.result));
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }}
                />
              </label>
              <input
                className="cat-form-input"
                placeholder="New category name (e.g. Wigs)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); }}
                maxLength={30}
              />
              <button
                className="btn-sm save"
                type="button"
                disabled={!newCatName.trim()}
                onClick={handleAddCategory}
              >
                Add
              </button>
            </div>
          </div>

          {/* List */}
          {categories.length === 0 ? (
            <p className="st-help" style={{ opacity: 0.6 }}>No categories yet.</p>
          ) : (
            <ul className="cat-list">
              {categories.map((c) => {
                const isEditing = editingId === c.id;
                const busy = uploadingId === c.id;
                return (
                  <li key={c.id} className="cat-row">
                    <div className="cat-row-img">
                      {c.image ? (
                        <>
                          <img src={c.image} alt={c.label} />
                          <button
                            type="button"
                            className="cat-row-img-x"
                            onClick={() => handleRemoveCategoryImage(c.id)}
                            aria-label="Remove image"
                          >
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M6 6l12 12M18 6L6 18" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <label className="cat-row-img-add">
                          {busy ? (
                            <div className="dash-spinner" />
                          ) : (
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            disabled={busy}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCategoryImage(c.id, file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>

                    <div className="cat-row-name">
                      {isEditing ? (
                        <input
                          className="cat-row-input"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(c.id);
                            if (e.key === "Escape") { setEditingId(null); setEditingName(""); }
                          }}
                          autoFocus
                        />
                      ) : (
                        <p className="cat-row-label">{c.label}</p>
                      )}
                    </div>

                    <div className="cat-row-actions">
                      {isEditing ? (
                        <>
                          <button className="cat-action primary" onClick={() => handleRename(c.id)}>Save</button>
                          <button className="cat-action" onClick={() => { setEditingId(null); setEditingName(""); }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="cat-action" onClick={() => { setEditingId(c.id); setEditingName(c.label); }}>Rename</button>
                          <button className="cat-action danger" onClick={() => handleDeleteCategory(c.id, c.label)}>Delete</button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ── FEATURED PRODUCT ── */}
      <section className="st-panel">
        <div className="st-panel-head">
          <h2 className="dash-section-title">Featured product</h2>
        </div>
        <div className="st-panel-body">
          <p className="st-help">
            Shown at the top of your storefront. Defaults to your first-added product — pick a different one below.
          </p>
          {products.length === 0 ? (
            <p className="st-help" style={{ opacity: 0.6 }}>No products yet.</p>
          ) : (
            <div className="st-featured-list">
              {products.map((p) => {
                const active = featuredId === p.id;
                const img = (p.images && p.images[0]) || p.image_url;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSetFeatured(p.id)}
                    className={`st-featured-item ${active ? "on" : ""}`}
                    disabled={settingFeatured}
                  >
                    <div className="st-featured-thumb">
                      {img ? <img src={img} alt={p.name} /> : null}
                    </div>
                    <div className="st-featured-info">
                      <p className="st-featured-name">{p.name}</p>
                      <p className="st-featured-meta">{formatPrice(p.price)}</p>
                    </div>
                    {active && (
                      <span className="st-featured-check">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── PUBLIC LINK ── */}
      <section className="st-panel">
        <div className="st-panel-head">
          <h2 className="dash-section-title">Public link</h2>
        </div>
        <div className="st-panel-body">
          <div className="dash-link-card" style={{ margin: 0 }}>
            <div>
              <p className="dash-link-label">Your store link</p>
              <p className="dash-link-url">
                {location.host}/store/<b>{store.slug}</b>
              </p>
            </div>
            <div className="dash-link-actions">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(location.origin + "/store/" + store.slug);
                  toast.show("Link copied");
                }}
                className="dash-btn dash-btn-line"
              >
                Copy
              </button>
              <Link
                to={`/store/${store.slug}`}
                target="_blank"
                rel="noopener"
                className="dash-btn dash-btn-dark"
              >
                View store
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── DANGER ── */}
      <section className="st-panel st-panel-danger">
        <div className="st-panel-head">
          <h2 className="dash-section-title">Danger zone</h2>
        </div>
        <div className="st-panel-body">
          <p className="st-help">
            Deleting your store removes every product and cancels your plan. This cannot be undone.
          </p>
          <button
            type="button"
            className="st-danger-btn"
            onClick={() => toast.show("Contact support to delete your store")}
          >
            Delete store
          </button>
        </div>
      </section>
    </DashboardLayout>
  );
}

/* helper: convert a data URL back to a Blob for upload */
function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(meta)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
