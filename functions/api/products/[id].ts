export const onRequestPut: PagesFunction<{ DB: D1Database }> = async ({ env, request, params }) => {
  const user = await getUser(request, env);
  if (!user) return Response.json({ error: "Not logged in" }, { status: 401 });

  const store = await env.DB.prepare("SELECT id FROM stores WHERE user_id = ?").bind(user.id).first<{ id: string }>();
  if (!store) return Response.json({ error: "No store" }, { status: 404 });

  const id = params.id as string;
  const body = await request.json() as any;

  // Normalize stock — accept both inStock and in_stock
  const inStock = body.inStock ?? body.in_stock ?? true;

  // Normalize images — accept image_url + image_urls OR images array
  let images: string[] = [];
  if (Array.isArray(body.images)) images = body.images;
  if (body.image_url) images = [body.image_url, ...(body.image_urls ?? [])];
  else if (Array.isArray(body.image_urls)) images = body.image_urls;

  const imageUrl = images[0] ?? null;
  const imageUrls = images.slice(1);

  // Normalize variants
  const variants = body.variants ?? null;

  await env.DB.prepare(
    `UPDATE products SET
      name = ?,
      price = ?,
      compare_at_price = ?,
      description = ?,
      category = ?,
      subcategory = ?,
      badge = ?,
      in_stock = ?,
      images = ?,
      image_url = ?,
      image_urls = ?,
      variants = ?
    WHERE id = ? AND store_id = ?`
  ).bind(
    body.name || "",
    body.price || 0,
    body.compare_at_price ?? null,
    body.description || "",
    body.category_id || body.category || "",
    body.subcategory ?? null,
    body.badge ?? null,
    inStock === false ? 0 : 1,
    JSON.stringify(images),
    imageUrl,
    JSON.stringify(imageUrls),
    variants ? JSON.stringify(variants) : null,
    id,
    store.id
  ).run();

  return Response.json({ ok: true });
};

export const onRequestDelete: PagesFunction<{ DB: D1Database }> = async ({ env, request, params }) => {
  const user = await getUser(request, env);
  if (!user) return Response.json({ error: "Not logged in" }, { status: 401 });

  const store = await env.DB.prepare("SELECT id FROM stores WHERE user_id = ?").bind(user.id).first<{ id: string }>();
  if (!store) return Response.json({ error: "No store" }, { status: 404 });

  await env.DB.prepare("DELETE FROM products WHERE id = ? AND store_id = ?").bind(params.id as string, store.id).run();
  return Response.json({ ok: true });
};

async function getUser(request: Request, env: { DB: D1Database }) {
  const cookie = request.headers.get("Cookie") || "";
  const sid = cookie.match(/sid=([^;]+)/)?.[1];
  if (!sid) return null;
  const session = await env.DB.prepare(
    "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?"
  ).bind(sid, Date.now()).first<{ user_id: string }>();
  if (!session) return null;
  return await env.DB.prepare("SELECT id, email, plan FROM users WHERE id = ?").bind(session.user_id).first<{ id: string; email: string; plan: string }>();
}
