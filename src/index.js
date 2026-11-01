// Le Mot Juste — © 2026 SDF Technologie. Collecte anonyme (aucune adresse IP stockée) + API d'administration.
const enc = new TextEncoder();
const json = (o, s = 200, h = {}) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store", ...h } });
const cookie = (v, age) => `lmj_admin=${v}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;

async function sign(v, secret) {
  const k = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(v)));
  return btoa(String.fromCharCode(...s)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}
const safeEq = (a, b) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };

async function authed(req, env) {
  if (!env.SESSION_SECRET) return false;
  const m = /(?:^|;\s*)lmj_admin=([^;]+)/.exec(req.headers.get("cookie") || "");
  if (!m) return false;
  const [exp, sig] = m[1].split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEq(sig, await sign(exp, env.SESSION_SECRET));
}

async function login(req, env) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET || !env.ADMIN_EMAIL) return json({ error: "not_configured" }, 503);
  const b = await req.json().catch(() => ({}));
  const okP = safeEq(await sign(String(b.password || ""), "cmp"), await sign(env.ADMIN_PASSWORD, "cmp"));
  const okE = safeEq(await sign(String(b.email || "").trim().toLowerCase(), "cmp"), await sign(env.ADMIN_EMAIL.trim().toLowerCase(), "cmp"));
  const ok = okP && okE;
  if (!ok) { await new Promise(r => setTimeout(r, 800)); return json({ error: "bad_password" }, 401); }
  const exp = String(Date.now() + 8 * 3600e3);
  return json({ ok: 1 }, 200, { "set-cookie": cookie(exp + "." + await sign(exp, env.SESSION_SECRET), 8 * 3600) });
}

const TYPES = new Set(["visit", "start", "end", "q"]);
const int = v => (Number.isFinite(+v) && v !== null && v !== undefined && v !== "") ? Math.max(-1e6, Math.min(1e6, Math.round(+v))) : null;

async function track(req, env, u) {
  const o = req.headers.get("origin");
  if (o && o !== u.origin) return json({ error: "origin" }, 403);
  const raw = await req.text();
  if (raw.length > 8000) return json({ error: "too_big" }, 413);
  let b; try { b = JSON.parse(raw); } catch { return json({ error: "json" }, 400); }
  if (!/^[\w-]{6,64}$/.test(b.sid || "") || !Array.isArray(b.events)) return json({ error: "bad" }, 400);
  const ua = req.headers.get("user-agent") || "";
  const device = /ipad|tablet/i.test(ua) ? "tablette" : /mobi|android|iphone/i.test(ua) ? "mobile" : "ordinateur";
  const country = req.cf?.country || req.headers.get("cf-ipcountry") || "??";
  const now = Date.now(), day = new Date(now).toISOString().slice(0, 10);
  const st = env.DB.prepare("INSERT INTO events(ts,day,sid,type,game,score,total,ok,detail,country,device) VALUES(?,?,?,?,?,?,?,?,?,?,?)");
  const rows = b.events.slice(0, 20).filter(e => e && TYPES.has(e.t) && /^[a-z]{0,12}$/.test(e.g || ""))
    .map(e => st.bind(now, day, b.sid, e.t, e.g || "", int(e.s), int(e.n), int(e.w), String(e.d || "").slice(0, 120), country, device));
  if (rows.length) await env.DB.batch(rows);
  return json({ ok: 1 });
}

async function stats(env, u) {
  const days = Math.min(Math.max(+u.searchParams.get("days") || 30, 1), 365);
  const since = Date.now() - days * 864e5;
  const q = (s, ...a) => env.DB.prepare(s).bind(...a);
  const r = await env.DB.batch([
    q("SELECT COUNT(*) v, COUNT(DISTINCT sid) u FROM events WHERE type='visit' AND ts>=?", since),
    q("SELECT day, COUNT(*) v, COUNT(DISTINCT sid) u FROM events WHERE type='visit' AND ts>=? GROUP BY day ORDER BY day", since),
    q("SELECT game, SUM(type='start') starts, SUM(type='end') ends, AVG(CASE WHEN type='end' THEN score END) avg, SUM(CASE WHEN type='end' THEN ok ELSE 0 END) wins FROM events WHERE type IN('start','end') AND ts>=? GROUP BY game", since),
    q("SELECT game, detail, COUNT(*) n, SUM(ok) good FROM events WHERE type='q' AND ts>=? GROUP BY game, detail HAVING n>=3 ORDER BY good*1.0/n ASC, n DESC LIMIT 10", since),
    q("SELECT device k, COUNT(*) n FROM events WHERE type='visit' AND ts>=? GROUP BY device ORDER BY n DESC", since),
    q("SELECT country k, COUNT(*) n FROM events WHERE type='visit' AND ts>=? GROUP BY country ORDER BY n DESC LIMIT 8", since),
    q("SELECT COALESCE(NULLIF(detail,''),'direct') k, COUNT(*) n FROM events WHERE type='visit' AND ts>=? GROUP BY k ORDER BY n DESC LIMIT 8", since),
    q("SELECT ts, game, score, total, ok, country, device FROM events WHERE type='end' ORDER BY ts DESC LIMIT 15"),
    q("SELECT COUNT(DISTINCT sid) n FROM events WHERE ts>=?", Date.now() - 3e5),
    q("SELECT COUNT(*) n FROM events"),
  ]);
  const x = r.map(a => a.results);
  return json({ days, visits: x[0][0], daily: x[1], games: x[2], hard: x[3], devices: x[4], countries: x[5], refs: x[6], recent: x[7], online: x[8][0].n, total: x[9][0].n });
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url), p = u.pathname;
    try {
      if (p === "/api/track" && req.method === "POST") return await track(req, env, u);
      if (p === "/api/admin/login" && req.method === "POST") return await login(req, env);
      if (p === "/api/admin/logout") return json({ ok: 1 }, 200, { "set-cookie": cookie("", 0) });
      if (p === "/api/admin/stats" && req.method === "GET") return (await authed(req, env)) ? await stats(env, u) : json({ error: "auth" }, 401);
      if (p.startsWith("/api/")) return json({ error: "not_found" }, 404);
    } catch (e) { return json({ error: "server" }, 500); }
    return env.ASSETS.fetch(req);
  },
};
