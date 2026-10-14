export const onRequestPut: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  const user = await getUser(request, env);
  if (!user) return Response.json({ error: "Not logged in" }, { status: 401 });

  const store = await env.DB.prepare("SELECT id FROM stores WHERE user_id = ?").bind(user.id).first<{ id: string }>();
  if (!store) return Response.json({ error: "No store" }, { status: 404 });

  const body = await request.json() as any;

  await env.DB.prepare(
    "UPDATE stores SET name = ?, bio = ?, whatsapp = ? WHERE id = ?"
  ).bind(
    body.name || "",
    body.bio || "",
    body.whatsapp || "",
    store.id
  ).run();

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
