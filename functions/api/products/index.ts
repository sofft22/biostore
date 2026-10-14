export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  const user = await getUser(request, env);
  if (!user) return Response.json({ error: "Not logged in" }, { status: 401 });

  const store = await env.DB.prepare("SELECT id FROM stores WHERE user_id = ?").bind(user.id).first<{ id: string }>();
  if (!store) return Response.json({ error: "No store" }, { status: 404 });

  const { results } = await env.DB.prepare(
    "SELECT id, name, price, description, category, in_stock, images, created_at FROM products WHERE store_id = ? ORDER BY created_at DESC"
  ).bind(store.id).all();

  return Response.json(results.map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    description: p.description,
    category: p.category,
    inStock: !!p.in_stock,
    images: JSON.parse(p.images || "[]"),
    createdAt: p.created_at,
  })));
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  const user = await getUser(request, env);
  if (!user) return Response.json({ error: "Not logged in" }, { status: 401 });

  const store = await env.DB.prepare("SELECT id FROM stores WHERE user_id = ?").bind(user.id).first<{ id: string }>();
  if (!store) return Response.json({ error: "No store" }, { status: 404 });

  const body = await request.json() as any;
  const id = crypto.randomUUID();
  const images = JSON.stringify(body.images || []);

  await env.DB.prepare(
    "INSERT INTO products (id, store_id, name, price, description, category, in_stock, images, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    id,
    store.id,
    body.name || "",
    body.price || 0,
    body.description || "",
    body.category || "",
    body.inStock === false ? 0 : 1,
    images,
    Date.now()
  ).run();

  return Response.json({ id, ...body });
};

async function getUser(request: Request, env: { DB: D1Database }) {
  const cookie = request.headers.get("Cookie") || "";
  const sid = cookie.match(/sid=([^;]+)/)?.[1];
  if (!sid) return null;
  const session = await env.DB.prepare(
    "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?"
  ).bind(sid, Date.now()).first<{ user_id: string }>();
  if (!session) return null;
  const user = await env.DB.prepare("SELECT id, email, plan FROM users WHERE id = ?").bind(session.user_id).first<{ id: string; email: string; plan: string }>();
  return user;
}
