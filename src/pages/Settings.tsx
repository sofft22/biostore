import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import DashboardLayout from "../components/DashboardLayout";
import { store as storeApi, uploadImage } from "../lib/api";
import { CATEGORIES } from "../lib/categories";
import {
  loadMockCategoryImages,
  saveMockCategoryImages,
} from "../lib/mock";

export default function Settings() {
  const { store, refresh } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(store?.name ?? "");
  const [bio, setBio] = useState(store?.bio ?? "");
  const [whatsapp, setWhatsapp] = useState(store?.whatsapp ?? "");
  const [instagram, setInstagram] = useState(store?.instagram ?? "");
  const [tiktok, setTiktok] = useState(store?.tiktok ?? "");
  const [coverUrl, setCoverUrl] = useState(store?.cover_url ?? "");

  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [categoryImages, setCategoryImages] = useState<
    Record<string, string>
  >({});
  const [uploadingCat, setUploadingCat] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement | null>(null);

  /* Load category images (mock) */
  useEffect(() => {
    if (!store?.slug) return;
    setCategoryImages(loadMockCategoryImages(store.slug));
  }, [store?.slug]);

  /* Hydrate form from store */
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

  const handleUploadCategory = async (categoryId: string, file: File) => {
    setUploadingCat(categoryId);
    try {
      const url = await uploadImage(file);
      const next = { ...categoryImages, [categoryId]: url };
      setCategoryImages(next);
      saveMockCategoryImages(store.slug, next);
      toast.show("Category image saved");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Upload failed");
    }
    setUploadingCat(null);
  };

  const removeCategoryImage = (categoryId: string) => {
    const next = { ...categoryImages };
    delete next[categoryId];
    setCategoryImages(next);
    saveMockCategoryImages(store.slug, next);
    toast.show("Category image removed");
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

      {/* Store profile */}
      <section className="st-panel">
        <div className="st-panel-head">
          <h2 className="dash-section-title">Store profile</h2>
        </div>
        <div className="st-panel-body">
          <div className="st-field">
            <label className="st-label">Store name</label>
            <input
              className="st-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
          </div>

          <div className="st-field">
            <label className="st-label">Bio</label>
            <textarea
              className="st-input st-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Bags, shoes and skincare · Lagos"
              rows={2}
            />
          </div>

          <div className="st-field">
            <label className="st-label">WhatsApp number</label>
            <input
              className="st-input"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="08012345678"
              inputMode="tel"
            />
          </div>

          <div className="st-row-2">
            <div className="st-field">
              <label className="st-label">Instagram handle</label>
              <input
                className="st-input"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="adaezescloset"
              />
            </div>
            <div className="st-field">
              <label className="st-label">TikTok handle</label>
              <input
                className="st-input"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="adaezescloset"
              />
            </div>
          </div>

          <button
            onClick={handleSaveStore}
            disabled={saving}
            className="st-save"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </section>

      {/* Banner */}
      <section className="st-panel">
        <div className="st-panel-head">
          <h2 className="dash-section-title">Banner image</h2>
        </div>
        <div className="st-panel-body">
          <p className="st-help">
            Used as the featured image on your storefront. Recommended:
            1600×900.
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
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          ) : (
            <label className="st-banner-add">
              {uploadingCover ? (
                <div className="dash-spinner" />
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
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

      {/* Category images */}
      <section className="st-panel">
        <div className="st-panel-head">
          <h2 className="dash-section-title">Category images</h2>
        </div>
        <div className="st-panel-body">
          <p className="st-help">
            Upload an image for each category you sell in. These appear as
            tiles on your storefront.
          </p>

          <div className="st-cat-grid">
            {CATEGORIES.map((c) => {
              const url = categoryImages[c.id];
              const busy = uploadingCat === c.id;
              return (
                <div key={c.id} className="st-cat-tile">
                  {url ? (
                    <>
                      <img src={url} alt={c.label} />
                      <button
                        type="button"
                        className="st-cat-x"
                        onClick={() => removeCategoryImage(c.id)}
                        aria-label="Remove"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="12"
                          height="12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <label className="st-cat-add">
                      {busy ? (
                        <div className="dash-spinner" />
                      ) : (
                        <>
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            strokeLinecap="round"
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
                        disabled={busy}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadCategory(c.id, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                  <p className="st-cat-label">{c.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Public link */}
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
                  navigator.clipboard.writeText(
                    location.origin + "/store/" + store.slug
                  );
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

      {/* Danger */}
      <section className="st-panel st-panel-danger">
        <div className="st-panel-head">
          <h2 className="dash-section-title">Danger zone</h2>
        </div>
        <div className="st-panel-body">
          <p className="st-help">
            Deleting your store removes every product and cancels your plan.
            This cannot be undone.
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