import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import DashboardLayout from "../components/DashboardLayout";
import {
  store as storeApi,
  uploadImage,
} from "../lib/api";
import {
  getCategoriesWithImages,
  addCategory,
  updateCategory,
  removeCategory,
  setCategoryImage,
  removeCategoryImage,
} from "../lib/storeData";
import type { Category } from "../types";

type CatWithImg = Category & { image?: string };

function titleCase(s: string): string {
  return (s || "").replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

export default function Settings() {
  const { store, refresh } = useAuth();
  const toast = useToast();

  /* Store profile */
  const [name, setName] = useState(store?.name ?? "");
  const [tagline, setTagline] = useState((store as any)?.tagline ?? "");
  const [address, setAddress] = useState((store as any)?.address ?? "");
  const [whatsapp, setWhatsapp] = useState(store?.whatsapp ?? "");
  const [instagram, setInstagram] = useState(store?.instagram ?? "");
  const [tiktok, setTiktok] = useState(store?.tiktok ?? "");
  const [saving, setSaving] = useState(false);

  /* Banner */
  const [bannerUrl, setBannerUrl] = useState<string>((store as any)?.cover_url ?? "");
  const [uploadingBanner, setUploadingBanner] = useState(false);

  /* Categories */
  const [categories, setCategories] = useState<CatWithImg[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatImage, setNewCatImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; label: string } | null>(null);

  const refreshCategories = () => {
    if (!store?.slug) return;
    setCategories(getCategoriesWithImages(store.slug));
  };

  useEffect(() => {
    refreshCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.slug]);

  useEffect(() => {
    if (!store) return;
    setName(store.name ?? "");
    setTagline((store as any).tagline ?? "");
    setAddress((store as any).address ?? "");
    setWhatsapp(store.whatsapp ?? "");
    setInstagram(store.instagram ?? "");
    setTiktok(store.tiktok ?? "");
    setBannerUrl((store as any).cover_url ?? "");
  }, [store]);

  if (!store) return null;

  /* ── Save store profile ── */
  const handleSaveStore = async () => {
    if (!name.trim()) return toast.show("Store name is required");
    setSaving(true);
    try {
      await storeApi.update({
        name: name.trim(),
        tagline: tagline.trim() || null,
        address: address.trim() || null,
        whatsapp: whatsapp.trim(),
        instagram: instagram.trim() || null,
        tiktok: tiktok.trim() || null,
      } as any);
      await refresh();
      toast.show("Store saved");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Could not save");
    }
    setSaving(false);
  };

  /* ── Banner ── */
  const handleUploadBanner = async (file: File) => {
    setUploadingBanner(true);
    try {
      const url = await uploadImage(file);
      setBannerUrl(url);
      await storeApi.update({ cover_url: url } as any);
      await refresh();
      toast.show("Banner updated");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Upload failed");
    }
    setUploadingBanner(false);
  };

  const handleRemoveBanner = async () => {
    setBannerUrl("");
    try {
      await storeApi.update({ cover_url: null } as any);
      await refresh();
      toast.show("Banner removed");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Could not remove");
    }
  };

  /* ── Categories ── */
  const handleAddCategory = async () => {
    const result = addCategory(store.slug, newCatName);
    if (!result.ok) return toast.show(result.error);
    if (newCatImage && result.category) {
      try {
        const url = await uploadImage(dataUrlToBlob(newCatImage));
        setCategoryImage(store.slug, result.category.id, url);
      } catch {}
    }
    setNewCatName("");
    setNewCatImage(null);
    refreshCategories();
    toast.show("Category added");
  };

  const handleRename = (id: string) => {
    const result = updateCategory(store.slug, id, editingName);
    if (!result.ok) return toast.show(result.error);
    setEditingId(null);
    setEditingName("");
    refreshCategories();
    toast.show("Renamed");
  };

  const handleDeleteCategory = () => {
    if (!confirmDelete) return;
    removeCategory(store.slug, confirmDelete.id);
    refreshCategories();
    setConfirmDelete(null);
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

  const copyLink = () => {
    navigator.clipboard.writeText(location.origin + "/store/" + store.slug);
    toast.show("Link copied");
  };

  return (
    <DashboardLayout>
      <section className="dash-head" style={{ padding: 0 }}>
        <p className="dash-head-eyebrow">Settings</p>
        <h1 className="dash-title">
          Your <em>store</em>.
        </h1>
        <p className="dash-head-lead">Everything here shows on your public storefront.</p>
      </section>

      {/* ═══════════ STORE LINK ═══════════ */}
      <section className="st-link-banner">
        <div className="st-link-info">
          <span className="st-link-dot" />
          <div>
            <p className="st-link-label">Your store is live</p>
            <p className="st-link-url">{location.host}/store/<b>{store.slug}</b></p>
          </div>
        </div>
        <div className="st-link-actions">
          <button type="button" onClick={copyLink} className="dash-btn dash-btn-line">
            Copy link
          </button>
          <Link
            to={`/store/${store.slug}`}
            target="_blank"
            rel="noopener"
            className="dash-btn dash-btn-dark"
          >
            Visit store
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 4h6v6" />
              <path d="M20 4l-9 9" />
              <path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ═══════════ BANNER ═══════════ */}
      <section className="st-panel">
        <div className="st-panel-head">
          <div>
            <h2 className="dash-section-title">Storefront banner</h2>
            <p className="st-panel-sub">The hero image at the top of your store.</p>
          </div>
        </div>
        <div className="st-panel-body">
          {bannerUrl ? (
            <div className="st-banner-preview">
              <img src={bannerUrl} alt="Banner" />
              <div className="st-banner-actions">
                <label className="st-banner-action-btn">
                  {uploadingBanner ? (
                    <div className="dash-spinner dash-spinner-sm" />
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                      Change
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={uploadingBanner}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadBanner(f);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button type="button" onClick={handleRemoveBanner} className="st-banner-action-btn danger">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <label className="st-banner-add">
              {uploadingBanner ? (
                <div className="dash-spinner" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span>Upload banner</span>
                  <small>Wide landscape works best</small>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={uploadingBanner}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadBanner(f);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      </section>

      {/* ═══════════ STORE PROFILE ═══════════ */}
      <section className="st-panel">
        <div className="st-panel-head">
          <div>
            <h2 className="dash-section-title">Store profile</h2>
            <p className="st-panel-sub">Your brand name and description.</p>
          </div>
        </div>
        <div className="st-panel-body">
          <div className="st-field">
            <label className="st-label">Store name</label>
            <input
              className="st-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adaeze's Closet"
              maxLength={60}
            />
            <p className="st-help">Shown in the header, footer, and browser tab.</p>
          </div>

          <div className="st-field">
            <label className="st-label">Tagline</label>
            <input
              className="st-input"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Where Lagos style meets everyday luxury"
              maxLength={100}
            />
            <p className="st-help">One sentence over your banner. Keep it short.</p>
          </div>

          <div className="st-field">
            <label className="st-label">Address</label>
            <input
              className="st-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="12 Admiralty Way, Lekki, Lagos"
            />
            <p className="st-help">Shown in the footer with a map icon.</p>
          </div>
        </div>
      </section>

      {/* ═══════════ CONTACT ═══════════ */}
      <section className="st-panel">
        <div className="st-panel-head">
          <div>
            <h2 className="dash-section-title">Contact</h2>
            <p className="st-panel-sub">How customers reach you.</p>
          </div>
        </div>
        <div className="st-panel-body">
          <div className="st-field">
            <label className="st-label">WhatsApp number</label>
            <input
              className="st-input"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="08012345678"
              inputMode="tel"
            />
            <p className="st-help">Orders go straight here.</p>
          </div>

          <div className="st-row-2">
            <div className="st-field">
              <label className="st-label">Instagram</label>
              <div className="st-input-prefixed">
                <span className="st-prefix">@</span>
                <input
                  className="st-input"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
                  placeholder="adaezescloset"
                />
              </div>
            </div>
            <div className="st-field">
              <label className="st-label">TikTok</label>
              <div className="st-input-prefixed">
                <span className="st-prefix">@</span>
                <input
                  className="st-input"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value.replace(/^@/, ""))}
                  placeholder="adaezescloset"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="st-panel-footer">
          <button onClick={handleSaveStore} disabled={saving} className="st-save">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </section>

      {/* ═══════════ CATEGORIES ═══════════ */}
      <section className="st-panel">
        <div className="st-panel-head">
          <div>
            <h2 className="dash-section-title">Categories</h2>
            <p className="st-panel-sub">
              {categories.length === 0
                ? "Group your products so customers find them faster."
                : `${categories.length} ${categories.length === 1 ? "category" : "categories"}`}
            </p>
          </div>
        </div>
        <div className="st-panel-body">
          {/* Add new */}
          <div className="st-cat-add">
            <label className="st-cat-add-photo" title="Add photo">
              {newCatImage ? (
                <img src={newCatImage} alt="" />
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = () => setNewCatImage(String(r.result));
                  r.readAsDataURL(f);
                  e.target.value = "";
                }}
              />
            </label>
            <input
              className="st-cat-add-input"
              placeholder="New category name — e.g. Wigs, Bags, Skincare"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCategory();
              }}
              maxLength={30}
            />
            <button
              className="st-cat-add-btn"
              type="button"
              disabled={!newCatName.trim()}
              onClick={handleAddCategory}
            >
              Add
            </button>
          </div>

          {/* List */}
          {categories.length === 0 ? (
            <div className="st-empty">
              <div className="st-empty-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </div>
              <p className="st-empty-title">No categories yet</p>
              <p className="st-empty-sub">Add your first one above to start grouping products.</p>
            </div>
          ) : (
            <ul className="st-cat-list">
              {categories.map((c) => {
                const isEditing = editingId === c.id;
                const busy = uploadingId === c.id;
                return (
                  <li key={c.id} className="st-cat-row">
                    <div className="st-cat-row-img">
                      {c.image ? (
                        <>
                          <img src={c.image} alt={c.label} />
                          <button
                            type="button"
                            className="st-cat-row-img-x"
                            onClick={() => handleRemoveCategoryImage(c.id)}
                            aria-label="Remove image"
                          >
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M6 6l12 12M18 6L6 18" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <label className="st-cat-row-img-add">
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
                              const f = e.target.files?.[0];
                              if (f) handleCategoryImage(c.id, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>

                    <div className="st-cat-row-name">
                      {isEditing ? (
                        <input
                          className="st-cat-row-input"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(c.id);
                            if (e.key === "Escape") {
                              setEditingId(null);
                              setEditingName("");
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="st-cat-row-label">{titleCase(c.label)}</span>
                      )}
                    </div>

                    <div className="st-cat-row-actions">
                      {isEditing ? (
                        <>
                          <button className="st-cat-act primary" onClick={() => handleRename(c.id)}>
                            Save
                          </button>
                          <button
                            className="st-cat-act"
                            onClick={() => {
                              setEditingId(null);
                              setEditingName("");
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="st-cat-act"
                            onClick={() => {
                              setEditingId(c.id);
                              setEditingName(c.label);
                            }}
                          >
                            Rename
                          </button>
                          <button
                            className="st-cat-act danger"
                            onClick={() => setConfirmDelete({ id: c.id, label: c.label })}
                          >
                            Delete
                          </button>
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

      {/* ═══════════ DANGER ZONE ═══════════ */}
      <section className="st-panel st-panel-danger">
        <div className="st-panel-head">
          <div>
            <h2 className="dash-section-title">Danger zone</h2>
            <p className="st-panel-sub">Careful — actions here can't be undone.</p>
          </div>
        </div>
        <div className="st-panel-body">
          <div className="st-danger-row">
            <div>
              <p className="st-danger-title">Delete store</p>
              <p className="st-danger-sub">Removes every product and cancels your plan. Cannot be undone.</p>
            </div>
            <button
              type="button"
              className="st-danger-btn"
              onClick={() => toast.show("Contact support to delete your store")}
            >
              Delete
            </button>
          </div>
        </div>
      </section>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div
          className="st-confirm-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDelete(null);
          }}
        >
          <div className="st-confirm">
            <h3 className="st-confirm-title">Delete "{titleCase(confirmDelete.label)}"?</h3>
            <p className="st-confirm-sub">
              Products in this category won't be deleted — they'll just become uncategorized.
            </p>
            <div className="st-confirm-actions">
              <button
                className="st-confirm-btn ghost"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className="st-confirm-btn danger"
                onClick={handleDeleteCategory}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(meta)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
