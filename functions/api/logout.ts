export const onRequestPost: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  const cookie = request.headers.get("Cookie") || "";
  const sid = cookie.match(/sid=([^;]+)/)?.[1];

  if (sid) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sid).run();
  }

  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": "sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" } }
  );
};
