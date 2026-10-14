import type {
  MeResponse,
  Product,
  Store,
  StorefrontResponse,
  Category,
} from "../types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
  rawType?: string
): Promise<T> {
  const opt: RequestInit = {
    method,
    credentials: "include",
    headers: {},
  };

  if (body !== undefined) {
    if (rawType) {
      (opt.headers as Record<string, string>)["content-type"] = rawType;
      opt.body = body as BodyInit;
    } else {
      (opt.headers as Record<string, string>)["content-type"] = "application/json";
      opt.body = JSON.stringify(body);
    }
  }

  const res = await fetch(url, opt);
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (res.status === 401) {
    throw new ApiError("Please log in again.", 401);
  }

  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : "Something went wrong.";
    throw new ApiError(msg, res.status);
  }

  return data as T;
}

/* ══════════════════════════════════════════════════
   AUTH
   ══════════════════════════════════════════════════ */
export const auth = {
  me: () => request<MeResponse>("GET", "/api/me"),
  login: (email: string, password: string) =>
    request<{ ok: true }>("POST", "/api/login", { email, password }),
  signup: (payload: {
    storeName: string;
    whatsapp: string;
    email: string;
    password: string;
  }) => request<{ ok: true }>("POST", "/api/signup", payload),
  logout: () => request<{ ok: true }>("POST", "/api/logout", {}),
};

/* ══════════════════════════════════════════════════
   STORE
   ══════════════════════════════════════════════════ */
export const store = {
  update: (payload: Partial<Store>) =>
    request<{ ok: true }>("PUT", "/api/store", payload),
  public: (slug: string) =>
    request<StorefrontResponse>(
      "GET",
      `/api/store/${encodeURIComponent(slug)}`
    ),
};

/* ══════════════════════════════════════════════════
   PRODUCTS
   ══════════════════════════════════════════════════ */
export const products = {
  create: (payload: Partial<Product>) =>
    request<Product>("POST", "/api/products", payload),
  update: (id: string, payload: Partial<Product>) =>
    request<Product>("PUT", `/api/products/${id}`, payload),
  remove: (id: string) =>
    request<{ ok: true }>("DELETE", `/api/products/${id}`),
};

/* ══════════════════════════════════════════════════
   CATEGORIES (global list + per-store images)
   ══════════════════════════════════════════════════ */
export const categories = {
  list: () =>
    request<{ categories: Category[] }>("GET", "/api/categories"),
  create: (name: string) =>
    request<Category>("POST", "/api/categories", { name }),
  update: (id: string, name: string) =>
    request<Category>("PUT", `/api/categories/${id}`, { name }),
  remove: (id: string) =>
    request<{ ok: true }>("DELETE", `/api/categories/${id}`),
};

export const categoryImages = {
  list: (slug: string) =>
    request<Record<string, string>>(
      "GET",
      `/api/store/${encodeURIComponent(slug)}/categories`
    ),
  save: (categoryId: string, imageUrl: string) =>
    request<{ ok: true }>(
      "PUT",
      `/api/store/categories/${categoryId}`,
      { image_url: imageUrl }
    ),
  remove: (categoryId: string) =>
    request<{ ok: true }>("DELETE", `/api/store/categories/${categoryId}`),
};

/* ══════════════════════════════════════════════════
   IMAGE UPLOAD — sends multipart/form-data to /api/upload
   ══════════════════════════════════════════════════ */
export async function uploadImage(file: File | Blob): Promise<string> {
  const form = new FormData();
  form.append("image", file, (file as File).name || "upload.jpg");

  const res = await fetch("/api/upload", {
    method: "POST",
    credentials: "include",
    body: form,
    // ⚠️ Do NOT set content-type — browser sets multipart boundary itself
  });

  const data = (await res.json().catch(() => null)) as
    | { url?: string; error?: string }
    | null;

  if (!res.ok || !data || !data.url) {
    throw new ApiError(data?.error || "Upload failed", res.status);
  }
  return data.url;
}
