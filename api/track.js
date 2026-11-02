// Collecte anonyme (aucune adresse IP stockée).
const { send, db } = require("../lib/common");
const TYPES = new Set(["visit", "start", "end", "q"]);
const int = v => (v !== null && v !== undefined && v !== "" && Number.isFinite(+v)) ? Math.max(-1e6, Math.min(1e6, Math.round(+v))) : null;

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "method" });
  try {
    const o = req.headers.origin;
    if (o && new URL(o).host !== req.headers.host) return send(res, 403, { error: "origin" });
    let b = req.body;
    if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = null; } }
    if (!b || !/^[\w-]{6,64}$/.test(b.sid || "") || !Array.isArray(b.events)) return send(res, 400, { error: "bad" });
    const ua = req.headers["user-agent"] || "";
    const device = /ipad|tablet/i.test(ua) ? "tablette" : /mobi|android|iphone/i.test(ua) ? "mobile" : "ordinateur";
    const country = String(req.headers["x-vercel-ip-country"] || "??").slice(0, 2);
    const now = Date.now(), day = new Date(now).toISOString().slice(0, 10);
    const rows = b.events.slice(0, 20).filter(e => e && TYPES.has(e.t) && /^[a-z]{0,12}$/.test(e.g || ""));
    if (rows.length) {
      const sql = await db();
      await Promise.all(rows.map(e => sql`INSERT INTO events(ts,day,sid,type,game,score,total,ok,detail,country,device)
        VALUES(${now},${day},${b.sid},${e.t},${e.g || ""},${int(e.s)},${int(e.n)},${int(e.w)},${String(e.d || "").slice(0, 120)},${country},${device})`));
    }
    send(res, 200, { ok: 1 });
  } catch (e) { send(res, 500, { error: "server" }); }
};
