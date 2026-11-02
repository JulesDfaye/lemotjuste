const { sign, safeEq, send, cookie } = require("../../lib/common");
const norm = v => String(v || "").trim().toLowerCase();

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "method" });
  const { ADMIN_EMAIL, ADMIN_PASSWORD, SESSION_SECRET } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !SESSION_SECRET) return send(res, 503, { error: "not_configured" });
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};
  const okMail = safeEq(sign(norm(b.email), "cmp"), sign(norm(ADMIN_EMAIL), "cmp"));
  const okPass = safeEq(sign(String(b.password || ""), "cmp"), sign(ADMIN_PASSWORD, "cmp"));
  if (!(okMail && okPass)) { await new Promise(r => setTimeout(r, 800)); return send(res, 401, { error: "bad_credentials" }); }
  const exp = String(Date.now() + 8 * 3600e3);
  send(res, 200, { ok: 1 }, cookie(exp + "." + sign(exp, SESSION_SECRET), 8 * 3600));
};
