export const onRequestPut: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  const user = await getUser(request, env);
  if (!user) return Response.json({ error: "Not logged in" }, { status: 401 });

  const store = await env.DB.prepare("SELECT id FROM stores WHERE user_id = ?")
    .bind(user.id)
    .first<{ id: string }>();
  if (!store) return Response.json({ error: "No store" }, { status: 404 });

  const body = (await request.json()) as any;

  const updates: string[] = [];
  const values: any[] = [];

  if ("name" in body) { updates.push("name = ?"); values.push((body.name ?? "").trim()); }
  if ("bio" in body) { updates.push("bio = ?"); values.push(body.bio ?? null); }
  if ("tagline" in body) { updates.push("tagline = ?"); values.push(body.tagline ?? null); }
  if ("address" in body) { updates.push("address = ?"); values.push(body.address ?? null); }
  if ("whatsapp" in body) { updates.push("whatsapp = ?"); values.push((body.whatsapp ?? "").trim()); }
  if ("instagram" in body) { updates.push("instagram = ?"); values.push(body.instagram ?? null); }
  if ("tiktok" in body) { updates.push("tiktok = ?"); values.push(body.tiktok ?? null); }
  if ("cover_url" in body) { updates.push("cover_url = ?"); values.push(body.cover_url ?? null); }

  if (updates.length === 0) return Response.json({ ok: true, skipped: true });

  values.push(store.id);

  await env.DB.prepare(`UPDATE stores SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

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
  return await env.DB.prepare("SELECT id, email, plan FROM users WHERE id = ?")
    .bind(session.user_id)
    .first<{ id: string; email: string; plan: string }>();
}
