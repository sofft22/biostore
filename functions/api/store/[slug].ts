export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env, params }) => {
  const slug = params.slug as string;

  const store = await env.DB.prepare(
    "SELECT id, slug, name, bio, whatsapp FROM stores WHERE slug = ?"
  ).bind(slug).first();

  if (!store) {
    return Response.json({ error: "Store not found" }, { status: 404 });
  }

  const { results } = await env.DB.prepare(
    "SELECT id, name, price, description, category, in_stock, images FROM products WHERE store_id = ? ORDER BY created_at DESC"
  ).bind((store as { id: string }).id).all();

  return Response.json({
    store,
    products: results.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      description: p.description,
      category: p.category,
      inStock: !!p.in_stock,
      images: JSON.parse(p.images || "[]"),
    })),
  });
};
