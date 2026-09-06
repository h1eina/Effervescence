const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });

const hashIp = async (ip) => {
  const data = new TextEncoder().encode(ip || "unknown");
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 20);
};

const cleanText = (value, max) =>
  String(value || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const tooMany = async (env, ipHash, kind, limit, windowMs) => {
  const since = Date.now() - windowMs;
  await env.DB.prepare("DELETE FROM rate_events WHERE created_at < ?")
    .bind(Date.now() - 24 * 60 * 60 * 1000)
    .run();
  const row = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM rate_events WHERE ip_hash = ? AND kind = ? AND created_at > ?"
  )
    .bind(ipHash, kind, since)
    .first();
  if ((row?.n || 0) >= limit) return true;
  await env.DB.prepare(
    "INSERT INTO rate_events (ip_hash, kind, created_at) VALUES (?, ?, ?)"
  )
    .bind(ipHash, kind, Date.now())
    .run();
  return false;
};

const handleApi = async (request, env, url) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const ipHash = await hashIp(ip);

  if (request.method === "GET" && url.pathname === "/api/reflections") {
    const { results } = await env.DB.prepare(
      "SELECT id, name, body, likes, created_at FROM reflections ORDER BY datetime(created_at) DESC, id DESC"
    ).all();
    return json({ reflections: results || [] });
  }

  if (request.method === "POST" && url.pathname === "/api/reflections") {
    let payload = {};
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Please write a reflection first." }, 400);
    }
    if (cleanText(payload.website, 80)) {
      return json({ ok: true });
    }
    if (await tooMany(env, ipHash, "comment", 5, 60 * 60 * 1000)) {
      return json({ error: "Please wait a little before sharing another reflection." }, 429);
    }
    const name = cleanText(payload.name, 60) || "A reader";
    const body = cleanText(payload.body, 800);
    if (body.length < 2) {
      return json({ error: "A reflection needs a few words." }, 400);
    }
    const created = await env.DB.prepare(
      "INSERT INTO reflections (name, body) VALUES (?, ?) RETURNING id, name, body, likes, created_at"
    )
      .bind(name, body)
      .first();
    return json({ reflection: created }, 201);
  }

  const likeMatch = url.pathname.match(/^\/api\/reflections\/(\d+)\/like$/);
  if (request.method === "POST" && likeMatch) {
    const id = Number(likeMatch[1]);
    let unlike = false;
    try {
      const payload = await request.json();
      unlike = payload?.action === "unlike";
    } catch {
      /* empty body is a like */
    }
    if (await tooMany(env, ipHash, "like", 40, 60 * 60 * 1000)) {
      return json({ error: "That’s enough likes for now — thank you." }, 429);
    }
    const row = await env.DB.prepare("SELECT likes FROM reflections WHERE id = ?")
      .bind(id)
      .first();
    if (!row) return json({ error: "That reflection is gone." }, 404);
    const next = unlike ? Math.max(0, (row.likes || 0) - 1) : (row.likes || 0) + 1;
    const updated = await env.DB.prepare(
      "UPDATE reflections SET likes = ? WHERE id = ? RETURNING id, likes"
    )
      .bind(next, id)
      .first();
    return json(updated);
  }

  return json({ error: "Not found." }, 404);
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(request, env, url);
      } catch (err) {
        return json({ error: "Something went quiet. Please try again." }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
