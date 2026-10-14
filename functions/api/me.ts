export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const sid = cookie.match(/sid=([^;]+)/)?.[1];

    if (!sid) {
      return Response.json({ user: null, store: null, products: [] });
    }

    const session = await env.DB.prepare(
      "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?"
    ).bind(sid, Date.now()).first<{ user_id: string }>();

    if (!session) {
      return Response.json({ user: null, store: null, products: [] });
    }

    const user = await env.DB.prepare(
      "SELECT id, email, plan FROM users WHERE id = ?"
    ).bind(session.user_id).first();

    const store = user ? await env.DB.prepare(
      "SELECT id, slug, name, bio, whatsapp FROM stores WHERE user_id = ?"
    ).bind((user as any).id).first() : null;

    let products: unknown[] = [];
    if (store) {
      const { results } = await env.DB.prepare(
        "SELECT id, name, price, description, category, in_stock, images FROM products WHERE store_id = ? ORDER BY created_at DESC"
      ).bind((store as any).id).all();
      products = results.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        description: p.description,
        category: p.category,
        inStock: !!p.in_stock,
        images: JSON.parse(p.images || "[]"),
      }));
    }

    return Response.json({
      user,
      store,
      products,
      limits: {
        planName: (user as any)?.plan || "free",
        products: 5,
        images: 3,
      },
      plans: {
        free: { name: "Free", price: 0, products: 5, images: 1 },
        starter: { name: "Starter", price: 2500, products: 20, images: 3 },
        pro: { name: "Pro", price: 6000, products: 100000, images: 5 },
      },
    });
  } catch (e) {
    return Response.json(
      { error: "Me error: " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
};
