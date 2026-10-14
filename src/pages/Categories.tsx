import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { uploadImage } from "../lib/api";
import {
  getCategories,
  addCategory,
  updateCategory,
  removeCategory,
  reorderCategories,
  getCategoryImages,
  setCategoryImage,
  removeCategoryImage,
} from "../lib/storeData";
import type { Category } from "../types";

export default function Categories() {
  const { store } = useAuth();
  const toast = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const refresh = () => {
    if (!store?.slug) return;
    setCategories(getCategories(store.slug));
    setImages(getCategoryImages(store.slug));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.slug]);

  if (!store) return null;

  const handleAdd = () => {
    const result = addCategory(store.slug, newName);
    if (!result.ok) { toast.show(result.error); return; }
    setNewName("");
    refresh();
    toast.show("Category added");
  };

  const handleRename = (id: string) => {
    const result = updateCategory(store.slug, id, editingName);
    if (!result.ok) { toast.show(result.error); return; }
    setEditingId(null);
    setEditingName("");
    refresh();
    toast.show("Renamed");
  };

  const handleDelete = (id: string, label: string) => {
    if (!confirm(`Delete "${label}"? Products in it won't be deleted.`)) return;
    removeCategory(store.slug, id);
    refresh();
    toast.show("Category deleted");
  };

  const handleUploadImage = async (id: string, file: File) => {
    setUploadingId(id);
    try {
      const url = await uploadImage(file);
      setCategoryImage(store.slug, id, url);
      refresh();
      toast.show("Image saved");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Upload failed");
    }
    setUploadingId(null);
  };

  const handleRemoveImage = (id: string) => {
    removeCategoryImage(store.slug, id);
    refresh();
    toast.show("Image removed");
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = categories.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[idx], next[target]] = [next[target], next[idx]];
    reorderCategories(store.slug, next);
    refresh();
  };

  return (
    <DashboardLayout>
      <section className="dash-head">
        <p className="dash-head-eyebrow">Categories</p>
        <h1 className="dash-title">
          Your <em>shelves</em>.
        </h1>
        <p className="dash-head-lead">
          Group your products so customers find what they want. Add an image to make a category stand out on your storefront.
        </p>
      </section>

      <section className="cat-add">
        <input
          className="cat-add-input"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          placeholder="New category name (e.g. Wigs)"
          maxLength={30}
        />
        <button onClick={handleAdd} className="cat-add-btn">Add</button>
      </section>

      {categories.length === 0 ? (
        <div className="dash-empty">
          <div className="dash-empty-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 5h16v14H4z" /><path d="M4 10h16" />
            </svg>
          </div>
          <p className="dash-empty-title">No categories yet</p>
          <p className="dash-empty-sub">Add your first one above.</p>
        </div>
      ) : (
        <ul className="cat-list">
          {categories.map((c, i) => {
            const img = images[c.id];
            const isEditing = editingId === c.id;
            const busy = uploadingId === c.id;
            return (
              <li key={c.id} className="cat-row">
                <div className="cat-row-img">
                  {img ? (
                    <>
                      <img src={img} alt={c.label} />
                      <button type="button" className="cat-row-img-x" onClick={() => handleRemoveImage(c.id)} aria-label="Remove image">
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                      </button>
                    </>
                  ) : (
                    <label className="cat-row-img-add">
                      {busy ? (
                        <div className="dash-spinner" />
                      ) : (
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        disabled={busy}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadImage(c.id, file);
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
                      <button className="cat-action" onClick={() => move(c.id, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                      <button className="cat-action" onClick={() => move(c.id, 1)} disabled={i === categories.length - 1} aria-label="Move down">↓</button>
                      <button className="cat-action" onClick={() => { setEditingId(c.id); setEditingName(c.label); }}>Rename</button>
                      <button className="cat-action danger" onClick={() => handleDelete(c.id, c.label)}>Delete</button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="cat-help">
        Categories you add here appear in the product editor and on your storefront.
      </p>
    </DashboardLayout>
  );
}
