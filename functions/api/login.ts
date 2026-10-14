export const onRequestPost: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      return Response.json({ error: "Email and password required." }, { status: 400 });
    }

    const user = await env.DB.prepare(
      "SELECT id, password_hash FROM users WHERE email = ?"
    ).bind(email).first<{ id: string; password_hash: string }>();

    if (!user) {
      return Response.json({ error: "No account found with that email." }, { status: 401 });
    }

    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
    const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    if (hash !== user.password_hash) {
      return Response.json({ error: "Wrong password." }, { status: 401 });
    }

    const sid = crypto.randomUUID();
    const expires = Date.now() + 1000 * 60 * 60 * 24 * 30;
    await env.DB.prepare(
      "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)"
    ).bind(sid, user.id, expires).run();

    return Response.json(
      { ok: true },
      { headers: { "Set-Cookie": `sid=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}` } }
    );
  } catch (e) {
    return Response.json(
      { error: "Server error: " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
};
