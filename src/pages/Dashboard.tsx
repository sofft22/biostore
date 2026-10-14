import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import {
  store as storeApi,
  products as productsApi,
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
import type { Category, Product } from "../types";

type CatWithImg = Category & { image?: string };

function formatPrice(n: number): string {
  return "₦" + n.toLocaleString("en-NG");
}

export default function Dashboard() {
  const nav = useNavigate();
  const { store: currentStore } = useAuth();
  const toast = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CatWithImg[]>([]);
  const [loading, setLoading] = useState(true);

  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [openCatMenuId, setOpenCatMenuId] = useState<string | null>(null);
  const [openProductMenuId, setOpenProductMenuId] = useState<string | null>(null);

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatImage, setNewCatImage] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [confirmState, setConfirmState] = useState<{
    title: string;
    sub: string;
    actionLabel: string;
    danger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const load = async () => {
    if (!currentStore?.slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await storeApi.public(currentStore.slug);
      setProducts(((data as any).products as Product[]) ?? []);
    } catch {
      setProducts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStore?.slug]);

  useEffect(() => {
    if (!currentStore?.slug) return;
    setCategories(getCategoriesWithImages(currentStore.slug));
  }, [currentStore?.slug]);

  const refreshCategories = () => {
    if (!currentStore?.slug) return;
    setCategories(getCategoriesWithImages(currentStore.slug));
  };

  const productsByCategory = useMemo(() => {
    const map: Record<string, Product[]> = {};
    for (const c of categories) map[c.id] = [];
    const uncategorized: Product[] = [];
    for (const p of products) {
      const cid = (p as any).category_id || (p as any).category;
      if (cid && map[cid]) map[cid].push(p);
      else uncategorized.push(p);
    }
    return { map, uncategorized };
  }, [products, categories]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setOpenCatMenuId(null);
    setOpenProductMenuId(null);
  };

  const handleAddCategory = () => {
    if (!currentStore?.slug) return;
    const result = addCategory(currentStore.slug, newCatName);
    if (!result.ok) {
      toast.show(result.error);
      return;
    }
    if (newCatImage && result.category) {
      setCategoryImage(currentStore.slug, result.category.id, newCatImage);
    }
    setAddingCategory(false);
    setNewCatName("");
    setNewCatImage(null);
    refreshCategories();
    setOpenIds((prev) => new Set(prev).add(result.category.id));
    toast.show("Category added");
  };

  const handleRename = (id: string) => {
    if (!currentStore?.slug) return;
    const result = updateCategory(currentStore.slug, id, renameValue);
    if (!result.ok) {
      toast.show(result.error);
      return;
    }
    setRenamingId(null);
    setRenameValue("");
    refreshCategories();
  };

  const handleDeleteCategory = (cat: CatWithImg) => {
    if (!currentStore?.slug) return;
    const count = productsByCategory.map[cat.id]?.length ?? 0;
    setConfirmState({
      title: `Delete "${cat.label}"?`,
      sub:
        count === 0
          ? "This category is empty. This cannot be undone."
          : `${count} ${count === 1 ? "product" : "products"} in this category will become uncategorized. This cannot be undone.`,
      actionLabel: "Delete",
      danger: true,
      onConfirm: () => {
        removeCategory(currentStore.slug, cat.id);
        refreshCategories();
        toast.show("Category deleted");
      },
    });
  };

  const handleCategoryImage = async (catId: string, file: File) => {
    if (!currentStore?.slug) return;
    try {
      const url = await uploadImage(file);
      setCategoryImage(currentStore.slug, catId, url);
      refreshCategories();
      toast.show("Image saved");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleRemoveCategoryImage = (catId: string) => {
    if (!currentStore?.slug) return;
    removeCategoryImage(currentStore.slug, catId);
    refreshCategories();
    toast.show("Image removed");
  };

  const handleDeleteProduct = (p: Product) => {
    setConfirmState({
      title: `Delete "${p.name}"?`,
      sub: "This cannot be undone.",
      actionLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        try {
          await productsApi.remove(p.id);
          await load();
          toast.show("Product deleted");
        } catch (err) {
          toast.show(err instanceof Error ? err.message : "Could not delete");
        }
      },
    });
  };

  const totalProducts = products.length;

  return (
    <DashboardLayout>
      <section className="dash-head" style={{ padding: 0 }}>
        <p className="dash-head-eyebrow">Catalog</p>
        <h1 className="dash-title">
          Your <em>shelves</em>.
        </h1>
        <p className="dash-head-lead">
          {totalProducts} {totalProducts === 1 ? "product" : "products"} ·{" "}
          {categories.length}{" "}
          {categories.length === 1 ? "category" : "categories"}
        </p>
      </section>

      {loading ? (
        <div className="dash-loading-inline">
          <div className="dash-spinner" />
        </div>
      ) : (
        <>
          {categories.length === 0 && !addingCategory && (
            <div className="cat-welcome">
              <div className="cat-welcome-icon">
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
                  <path d="M3 7l9 4 9-4M12 11v10" />
                </svg>
              </div>
              <h2>Start with a category</h2>
              <p>
                A <b>category</b> is a group of products — like <b>Bags</b>,{" "}
                <b>Shoes</b> or <b>Skincare</b>. Create one below, then add
                products inside it.
              </p>
            </div>
          )}

          {categories.map((cat) => {
            const list = productsByCategory.map[cat.id] ?? [];
            const isOpen = openIds.has(cat.id);
            const isRenaming = renamingId === cat.id;
            const count = list.length;

            return (
              <div key={cat.id} className={`cat ${isOpen ? "open" : ""}`}>
                <div className="cat-head">
                  <button
                    className="cat-open-btn"
                    type="button"
                    onClick={() => toggleOpen(cat.id)}
                    aria-expanded={isOpen}
                  >
                    <label
                      className="cat-thumb"
                      onClick={(e) => e.stopPropagation()}
                      title={cat.image ? "Change photo" : "Add photo"}
                    >
                      {cat.image ? (
                        <img src={cat.image} alt={cat.label} />
                      ) : (
                        <div className="cat-thumb-ph">
                          {cat.label[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="cat-thumb-hint">
                        <span>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
                            <path d="M3 7l9 4 9-4M12 11v10" />
                          </svg>
                          {cat.image ? "Change" : "Add photo"}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCategoryImage(cat.id, file);
                          e.target.value = "";
                        }}
                      />
                    </label>

                    <div className="cat-info">
                      {isRenaming ? (
                        <input
                          className="cat-rename-input"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(cat.id);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <p className="cat-name">{cat.label}</p>
                      )}
                      <p className="cat-meta">
                        {count === 0
                          ? "Empty — open to add your first product"
                          : `${count} ${count === 1 ? "product" : "products"}`}
                      </p>
                    </div>
                  </button>

                  {!isRenaming && (
                    <>
                      <button
                        className="cat-chev"
                        type="button"
                        onClick={() => toggleOpen(cat.id)}
                        aria-label="Toggle category"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </button>

                      <div className="cat-menu-wrap">
                        <button
                          className="cat-menu-btn"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenCatMenuId(
                              openCatMenuId === cat.id ? null : cat.id
                            );
                            setOpenProductMenuId(null);
                          }}
                          aria-label="More options"
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <circle cx="5" cy="12" r="1.6" />
                            <circle cx="12" cy="12" r="1.6" />
                            <circle cx="19" cy="12" r="1.6" />
                          </svg>
                        </button>
                        {openCatMenuId === cat.id && (
                          <div className="cat-menu on">
                            <button
                              className="cat-menu-item"
                              type="button"
                              onClick={() => {
                                setRenamingId(cat.id);
                                setRenameValue(cat.label);
                                setOpenCatMenuId(null);
                              }}
                            >
                              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                              </svg>
                              Rename
                            </button>
                            {cat.image && (
                              <button
                                className="cat-menu-item"
                                type="button"
                                onClick={() => {
                                  handleRemoveCategoryImage(cat.id);
                                  setOpenCatMenuId(null);
                                }}
                              >
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <circle cx="9" cy="9" r="2" />
                                  <path d="M21 15l-5-5L5 21" />
                                </svg>
                                Remove photo
                              </button>
                            )}
                            <button
                              className="cat-menu-item danger"
                              type="button"
                              onClick={() => {
                                handleDeleteCategory(cat);
                                setOpenCatMenuId(null);
                              }}
                            >
                              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              </svg>
                              Delete category
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {isRenaming && (
                    <>
                      <button
                        className="btn-sm save"
                        type="button"
                        onClick={() => handleRename(cat.id)}
                      >
                        Save
                      </button>
                      <button
                        className="btn-sm cancel"
                        type="button"
                        onClick={() => setRenamingId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>

                {isOpen && !isRenaming && (
                  <div className="cat-body">
                    {count === 0 ? (
                      <div className="cat-empty">
                        <p className="cat-empty-title">
                          No products in {cat.label} yet
                        </p>
                        <p className="cat-empty-sub">
                          Add your first one — it takes 30 seconds.
                        </p>
                        <button
                          className="add-first"
                          type="button"
                          onClick={() => nav(`/dashboard/product?category=${cat.id}`)}
                        >
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                          Add first product
                        </button>
                      </div>
                    ) : (
                      <div className="prod-grid">
                        {list.map((p) => (
                          <div key={p.id} className="prod-wrap">
                            <button
                              className="prod"
                              type="button"
                              onClick={() => nav(`/dashboard/product/${p.id}`)}
                            >
                              <div className="prod-img">
                                {p.image_url ? (
                                  <img src={p.image_url} alt={p.name} loading="lazy" decoding="async" />
                                ) : (
                                  <div className="prod-img-ph">
                                    {p.name[0]?.toUpperCase()}
                                  </div>
                                )}
                                <span className={`prod-stock ${p.in_stock ? "" : "out"}`}>
                                  {p.in_stock ? "In stock" : "Sold out"}
                                </span>
                                <div className="prod-hover">Click to edit</div>
                              </div>
                              <div className="prod-body">
                                <p className="prod-name">{p.name}</p>
                                <p className="prod-price">{formatPrice(p.price)}</p>
                              </div>
                            </button>

                            <button
                              className="prod-menu-btn"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenProductMenuId(
                                  openProductMenuId === p.id ? null : p.id
                                );
                                setOpenCatMenuId(null);
                              }}
                              aria-label="More options"
                            >
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                <circle cx="5" cy="12" r="1.6" />
                                <circle cx="12" cy="12" r="1.6" />
                                <circle cx="19" cy="12" r="1.6" />
                              </svg>
                            </button>

                            {openProductMenuId === p.id && (
                              <div className="prod-menu on">
                                <button
                                  className="prod-menu-item"
                                  type="button"
                                  onClick={() => nav(`/dashboard/product/${p.id}`)}
                                >
                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                  </svg>
                                  Edit product
                                </button>
                                <button
                                  className="prod-menu-item danger"
                                  type="button"
                                  onClick={() => {
                                    setOpenProductMenuId(null);
                                    handleDeleteProduct(p);
                                  }}
                                >
                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                        <button
                          className="prod-add"
                          type="button"
                          onClick={() => nav(`/dashboard/product?category=${cat.id}`)}
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                          Add product
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {addingCategory ? (
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
                      reader.onload = () =>
                        setNewCatImage(String(reader.result));
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                <input
                  className="cat-form-input"
                  placeholder="Category name — e.g. Bags"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCategory();
                  }}
                  autoFocus
                />
              </div>
              <div className="cat-form-actions">
                <button
                  className="btn-sm cancel"
                  type="button"
                  onClick={() => {
                    setAddingCategory(false);
                    setNewCatName("");
                    setNewCatImage(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-sm save"
                  type="button"
                  disabled={!newCatName.trim()}
                  onClick={handleAddCategory}
                >
                  Create
                </button>
              </div>
            </div>
          ) : (
            <button
              className="cat-new"
              type="button"
              onClick={() => setAddingCategory(true)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New category
            </button>
          )}
        </>
      )}

      {confirmState && (
        <div
          className="confirm-backdrop on"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmState(null);
          }}
        >
          <div className="confirm">
            <h3 className="confirm-title">{confirmState.title}</h3>
            <p className="confirm-sub">{confirmState.sub}</p>
            <div className="confirm-actions">
              <button
                className="confirm-btn ghost"
                type="button"
                onClick={() => setConfirmState(null)}
              >
                Cancel
              </button>
              <button
                className={`confirm-btn ${confirmState.danger ? "danger" : ""}`}
                type="button"
                onClick={() => {
                  confirmState.onConfirm();
                  setConfirmState(null);
                }}
              >
                {confirmState.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
