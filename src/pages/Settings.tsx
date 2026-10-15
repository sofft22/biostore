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

export default function Settings() {
  const { store, refresh } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(store?.name ?? "");
  const [bio, setBio] = useState(store?.bio ?? "");
  const [tagline, setTagline] = useState((store as any)?.tagline ?? "");
  const [address, setAddress] = useState((store as any)?.address ?? "");
  const [whatsapp, setWhatsapp] = useState(store?.whatsapp ?? "");
  const [instagram, setInstagram] = useState(store?.instagram ?? "");
  const [tiktok, setTiktok] = useState(store?.tiktok ?? "");
  const [saving, setSaving] = useState(false);

  const [bannerUrl, setBannerUrl] = useState<string>((store as any)?.cover_url ?? "");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const [categories, setCategories] = useState<CatWithImg[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatImage, setNewCatImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);

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
    setBio(store.bio ?? "");
    setTagline((store as any).tagline ?? "");
    setAddress((store as any).address ?? "");
    setWhatsapp(store.whatsapp ?? "");
    setInstagram(store.instagram ?? "");
    setTiktok(store.tiktok ?? "");
    setBannerUrl((store as any).cover_url ?? "");
  }, [store]);

  if (!store) return null;

  const handleSaveStore = async () => {
    setSaving(true);
    try {
      await storeApi.update({
        name: name.trim(),
        bio: bio.trim() || null,
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

  const handleAddCategory = async () => {
    const result = addCategory(store.slug, newCatName);
    if (!result.ok) { toast.show(result.error); return; }
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

  return (
    <DashboardLayout>
      <section className="dash-head" style={{ padding: 0 }}>
        <p className="dash-head-eyebrow">Settings</p>
        <h1 className="dash-title">Your <em>store</em>.</h1>
        <p className="dash-head-lead">These appear on your public storefront.</p>
      </section>

      {/* STORE PROFILE */}
      <section className="st-panel">
        <div className="st-panel-head">
          <h2 className="dash-section-title">Store profile</h2>
        </div>
        <div className="st-panel-body">
          <div className="st-field">
            <label className="st-label">Store name</label>
            <input className="st-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Adaeze's Closet" />
          </div>
          <div className="st-field">
            <label className="st-label">Tagline</label>
            <input className="st-input" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Where Lagos style meets everyday luxury" maxLength={100} />
            <p className="st-help">Short sentence shown on the banner.</p>
          </div>
          <div className="st-field">
            <label className="st-label">Bio</label>
            <textarea className="st-input st-textarea" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bags, shoes and skincare · Lagos" rows={2} />
          </div>
          <div className="st-field">
            <label className="st-label">Address</label>
            <input className="st-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="12 Admiralty Way, Lekki, Lagos" />
            <p className="st-help">Shown in the footer Contact section.</p>
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

      {/* BANNER */}
      <section className="st-panel">
        <div className="st-panel-head">
          <h2 className="dash-section-title">Banner image</h2>
        </div>
        <div className="st-panel-body">
          <p className="st-help">Shown at the top of your storefront. Wide landscape works best.</p>
          {bannerUrl ? (
            <div className="st-banner-preview">
              <img src={bannerUrl} alt="Banner" />
              <button type="button" className="st-banner-x" onClick={handleRemoveBanner} aria-label="Remove banner">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
          ) : (
            <label className="st-banner-add">
              {uploadingBanner ? (
                <div className="dash-spinner" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  <span>Upload banner</span>
                </>
              )}
              <input ref={bannerInputRef} type="file" accept="image/*" hidden disabled={uploadingBanner}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadBanner(f); e.target.value = ""; }} />
            </label>
          )}
          {bannerUrl && (
            <label className="btn-sm save" style={{ display: "inline-flex", cursor: "pointer", alignItems: "center", gap: 8 }}>
              {uploadingBanner ? "Uploading…" : "Change banner"}
              <input type="file" accept="image/*" hidden disabled={uploadingBanner}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadBanner(f); e.target.value = ""; }} />
            </label>
          )}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="st-panel">
        <div className="st-panel-head">
          <h2 className="dash-section-title">Categories</h2>
        </div>
        <div className="st-panel-body">
          <p className="st-help">Group your products so customers can find them faster.</p>
          <div className="cat-form">
            <div className="cat-form-row">
              <label className="cat-form-photo" title="Add photo">
                {newCatImage ? <img src={newCatImage} alt="" /> : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                )}
                <input type="file" accept="image/*" hidden onChange={(e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  const r = new FileReader();
                  r.onload = () => setNewCatImage(String(r.result));
                  r.readAsDataURL(f);
                  e.target.value = "";
                }} />
              </label>
              <input className="cat-form-input" placeholder="New category name (e.g. Wigs)" value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); }} maxLength={30} />
              <button className="btn-sm save" type="button" disabled={!newCatName.trim()} onClick={handleAddCategory}>Add</button>
            </div>
          </div>

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
                          <button type="button" className="cat-row-img-x" onClick={() => handleRemoveCategoryImage(c.id)} aria-label="Remove image">
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                          </button>
                        </>
                      ) : (
                        <label className="cat-row-img-add">
                          {busy ? <div className="dash-spinner" /> : (
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                          )}
                          <input type="file" accept="image/*" hidden disabled={busy}
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCategoryImage(c.id, f); e.target.value = ""; }} />
                        </label>
                      )}
                    </div>
                    <div className="cat-row-name">
                      {isEditing ? (
                        <input className="cat-row-input" value={editingName} onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleRename(c.id); if (e.key === "Escape") { setEditingId(null); setEditingName(""); } }} autoFocus />
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

      {/* PUBLIC LINK */}
      <section className="st-panel">
        <div className="st-panel-head">
          <h2 className="dash-section-title">Public link</h2>
        </div>
        <div className="st-panel-body">
          <div className="dash-link-card" style={{ margin: 0 }}>
            <div>
              <p className="dash-link-label">Your store link</p>
              <p className="dash-link-url">{location.host}/store/<b>{store.slug}</b></p>
            </div>
            <div className="dash-link-actions">
              <button type="button" onClick={() => { navigator.clipboard.writeText(location.origin + "/store/" + store.slug); toast.show("Link copied"); }} className="dash-btn dash-btn-line">Copy</button>
              <Link to={`/store/${store.slug}`} target="_blank" rel="noopener" className="dash-btn dash-btn-dark">View store</Link>
            </div>
          </div>
        </div>
      </section>

      {/* DANGER */}
      <section className="st-panel st-panel-danger">
        <div className="st-panel-head">
          <h2 className="dash-section-title">Danger zone</h2>
        </div>
        <div className="st-panel-body">
          <p className="st-help">Deleting your store removes every product and cancels your plan. This cannot be undone.</p>
          <button type="button" className="st-danger-btn" onClick={() => toast.show("Contact support to delete your store")}>Delete store</button>
        </div>
      </section>
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
