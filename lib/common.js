// Le Mot Juste — © 2026 SDF Technologie. Outils partagés par les fonctions /api.
const crypto = require("crypto");
const { neon } = require("@neondatabase/serverless");

const sign = (v, secret) => crypto.createHmac("sha256", secret).update(String(v)).digest("base64url");
const safeEq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const send = (res, status, obj, cookie) => {
  res.setHeader("Cache-Control", "no-store");
  if (cookie) res.setHeader("Set-Cookie", cookie);
  res.status(status).json(obj);
};
const cookie = (v, age) => `lmj_admin=${v}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;

function authed(req) {
  const secret = process.env.SESSION_SECRET;
  const m = /(?:^|;\s*)lmj_admin=([^;]+)/.exec(req.headers.cookie || "");
  if (!secret || !m) return false;
  const [exp, sig] = m[1].split(".");
  return !!exp && !!sig && Number(exp) > Date.now() && safeEq(sig, sign(exp, secret));
}

let sqlClient, ready;
function db() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL manquant");
  sqlClient = sqlClient || neon(url);
  const sql = sqlClient;
  ready = ready || (async () => {
    await sql`CREATE TABLE IF NOT EXISTS events(
      id BIGSERIAL PRIMARY KEY, ts BIGINT NOT NULL, day TEXT NOT NULL, sid TEXT NOT NULL,
      type TEXT NOT NULL, game TEXT, score INT, total INT, ok INT, detail TEXT, country TEXT, device TEXT)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_events_type_ts ON events(type, ts)`;
  })().catch(e => { ready = null; throw e; });
  return ready.then(() => sql);
}

module.exports = { sign, safeEq, send, cookie, authed, db };
