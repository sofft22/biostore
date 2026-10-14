export const onRequestPost: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    const body = await request.json() as {
      storeName?: string;
      whatsapp?: string;
      email?: string;
      password?: string;
    };

    const storeName = (body.storeName || "").trim();
    const whatsapp = (body.whatsapp || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!storeName || !whatsapp || !email || password.length < 8) {
      return Response.json({ error: "All fields required. Password must be 8+ characters." }, { status: 400 });
    }

    const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existing) {
      return Response.json({ error: "Email already registered." }, { status: 409 });
    }

    const userId = crypto.randomUUID();
    const storeId = crypto.randomUUID();
    const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || userId.slice(0, 8);

    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
    const passwordHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    await env.DB.prepare(
      "INSERT INTO users (id, email, password_hash, plan, created_at) VALUES (?, ?, ?, 'free', ?)"
    ).bind(userId, email, passwordHash, Date.now()).run();

    await env.DB.prepare(
      "INSERT INTO stores (id, user_id, name, slug, whatsapp, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(storeId, userId, storeName, slug, whatsapp, Date.now()).run();

    const sid = crypto.randomUUID();
    const expires = Date.now() + 1000 * 60 * 60 * 24 * 30;
    await env.DB.prepare(
      "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)"
    ).bind(sid, userId, expires).run();

    return Response.json(
      { ok: true },
      { headers: { "Set-Cookie": `sid=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}` } }
    );
  } catch (e) {
    return Response.json(
      { error: "Signup error: " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
};
