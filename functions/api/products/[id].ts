export const onRequestPut: PagesFunction<{ DB: D1Database }> = async ({ env, request, params }) => {
  const user = await getUser(request, env);
  if (!user) return Response.json({ error: "Not logged in" }, { status: 401 });

  const store = await env.DB.prepare("SELECT id FROM stores WHERE user_id = ?").bind(user.id).first<{ id: string }>();
  if (!store) return Response.json({ error: "No store" }, { status: 404 });

  const id = params.id as string;
  const body = await request.json() as any;

  await env.DB.prepare(
    "UPDATE products SET name = ?, price = ?, description = ?, category = ?, in_stock = ?, images = ? WHERE id = ? AND store_id = ?"
  ).bind(
    body.name || "",
    body.price || 0,
    body.description || "",
    body.category || "",
    body.inStock === false ? 0 : 1,
    JSON.stringify(body.images || []),
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
