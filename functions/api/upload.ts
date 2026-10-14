export const onRequestPost: PagesFunction<{ IMGBB_KEY: string }> = async ({ env, request }) => {
  try {
    const form = await request.formData();
    const file = form.get("image") as File | null;
    if (!file) return Response.json({ error: "No image" }, { status: 400 });

    if (file.size > 32 * 1024 * 1024) {
      return Response.json({ error: "Image too large (max 32MB)" }, { status: 400 });
    }

    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const b64 = btoa(binary);

    const body = new FormData();
    body.append("image", b64);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${env.IMGBB_KEY}`, {
      method: "POST",
      body,
    });

    const json = await res.json() as any;

    if (!json?.success) {
      const imgbbMsg =
        json?.error?.message ||
        json?.status_txt ||
        "Upload failed";
      return Response.json(
        { error: imgbbMsg, detail: json },
        { status: 502 }
      );
    }

    return Response.json({
      url: json.data.url,
      thumb: json.data.thumb?.url,
      delete_url: json.data.delete_url,
    });
  } catch (err: any) {
    return Response.json({ error: err.message || "Upload error" }, { status: 500 });
  }
};
