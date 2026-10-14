import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import DashboardLayout from "../components/DashboardLayout";
import {
  store as storeApi,
  uploadImage,
  products as productsApi,
} from "../lib/api";
import type { Product } from "../types";

export default function Settings() {
  const { store, refresh } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(store?.name ?? "");
  const [bio, setBio] = useState(store?.bio ?? "");
  const [whatsapp, setWhatsapp] = useState(store?.whatsapp ?? "");
  const [instagram, setInstagram] = useState(store?.instagram ?? "");
  const [tiktok, setTiktok] = useState(store?.tiktok ?? "");
  const [coverUrl, setCoverUrl] = useState(store?.cover_url ?? "");

  const [products, setProducts] = useState<Product[]>([]);
  const [featuredId, setFeaturedId] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const coverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!store?.slug) return;
    (async () => {
      try {
        const data = await storeApi.public(store.slug);
        const list = (data.products as Product[]) ?? [];
        setProducts(list);
        const featured = list.find((p) => p.is_featured);
        setFeaturedId(featured?.id ?? "");
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
    setCoverUrl(store.cover_url ?? "");
  }, [store]);

  if (!store) return null;

  const handleSaveStore = async () => {
    setSaving(true);
    try {
      await storeApi.update({
        name: name.trim(),
        bio: bio.trim() || null,
        whatsapp: whatsapp.trim(),
        instagram: instagram.trim() || null,
        tiktok: tiktok.trim() || null,
        cover_url: coverUrl || null,
      });
      await refresh();
      toast.show("Store saved");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Could not save");
    }
    setSaving(false);
  };

  const handleUploadCover = async (file: File) => {
    setUploadingCover(true);
    try {
      const url = await uploadImage(file);
      setCoverUrl(url);
      await storeApi.update({ cover_url: url });
      await refresh();
      toast.show("Banner updated");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Upload failed");
    }
    setUploadingCover(false);
  };

  const handleSetFeatured = async (productId: string) => {
    try {
      for (const p of products) {
        const shouldBeFeatured = p.id === productId;
        if (!!p.is_featured !== shouldBeFeatured) {
          await productsApi.update(p.id, { is_featured: shouldBeFeatured });
        }
      }
      setFeaturedId(productId);
      toast.show("Banner updated");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Could not update");
    }
  };

  return (
    <DashboardLayout>
      <section className="dash-head">
        <p className="dash-head-eyebrow">Settings</p>
        <h1 className="dash-title">
          Your <em>store</em>.
        </h1>
        <p className="dash-head-lead">
          These appear on your public storefront.
        </p>
      </section>

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

      <section className="st-panel">
        <div className="st-panel-head">
          <h2 className="dash-section-title">Banner image</h2>
        </div>
        <div className="st-panel-body">
          <p className="st-help">
            Shown at the top of your storefront when no featured product is picked below.
          </p>
          {coverUrl ? (
            <div className="st-banner-preview">
              <img src={coverUrl} alt="Banner" />
              <button
                type="button"
                className="st-banner-x"
                onClick={async () => {
                  setCoverUrl("");
                  await storeApi.update({ cover_url: null });
                  await refresh();
                  toast.show("Banner removed");
                }}
                aria-label="Remove banner"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
          ) : (
            <label className="st-banner-add">
              {uploadingCover ? (
                <div className="dash-spinner" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  <span>Upload banner</span>
                </>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                hidden
                disabled={uploadingCover}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadCover(file);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      </section>

      <section className="st-panel">
        <div className="st-panel-head">
          <h2 className="dash-section-title">Featured product</h2>
        </div>
        <div className="st-panel-body">
          <p className="st-help">
            Pick one product to feature in your storefront banner. Only one at a time.
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
                  >
                    <div className="st-featured-thumb">
                      {img ? <img src={img} alt={p.name} /> : null}
                    </div>
                    <div className="st-featured-info">
                      <p className="st-featured-name">{p.name}</p>
                      <p className="st-featured-meta">
                        {p.in_stock ? "In stock" : "Sold out"}
                      </p>
                    </div>
                    {active && (
                      <span className="st-featured-check">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

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
            </div>
          </div>
        </div>
      </section>

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
