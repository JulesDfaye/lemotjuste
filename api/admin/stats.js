const { send, authed, db } = require("../../lib/common");

module.exports = async (req, res) => {
  if (!authed(req)) return send(res, 401, { error: "auth" });
  try {
    const sql = await db();
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
    const since = Date.now() - days * 864e5, recent5 = Date.now() - 3e5;
    const [visits, daily, games, hard, devices, countries, refs, recent, online, total] = await Promise.all([
      sql`SELECT COUNT(*)::int v, COUNT(DISTINCT sid)::int u FROM events WHERE type='visit' AND ts>=${since}`,
      sql`SELECT day, COUNT(*)::int v, COUNT(DISTINCT sid)::int u FROM events WHERE type='visit' AND ts>=${since} GROUP BY day ORDER BY day`,
      sql`SELECT game, SUM((type='start')::int)::int starts, SUM((type='end')::int)::int ends,
          AVG(CASE WHEN type='end' THEN score END)::float8 avg,
          SUM(CASE WHEN type='end' THEN COALESCE(ok,0) ELSE 0 END)::int wins
          FROM events WHERE type IN ('start','end') AND ts>=${since} GROUP BY game`,
      sql`SELECT game, detail, COUNT(*)::int n, SUM(COALESCE(ok,0))::int good FROM events
          WHERE type='q' AND ts>=${since} GROUP BY game, detail HAVING COUNT(*)>=3
          ORDER BY SUM(COALESCE(ok,0))::float8/COUNT(*) ASC, COUNT(*) DESC LIMIT 10`,
      sql`SELECT device k, COUNT(*)::int n FROM events WHERE type='visit' AND ts>=${since} GROUP BY device ORDER BY n DESC`,
      sql`SELECT country k, COUNT(*)::int n FROM events WHERE type='visit' AND ts>=${since} GROUP BY country ORDER BY n DESC LIMIT 8`,
      sql`SELECT COALESCE(NULLIF(detail,''),'direct') k, COUNT(*)::int n FROM events WHERE type='visit' AND ts>=${since} GROUP BY 1 ORDER BY n DESC LIMIT 8`,
      sql`SELECT ts::float8 AS ts, game, score, total, ok, country, device FROM events WHERE type='end' ORDER BY events.ts DESC LIMIT 15`,
      sql`SELECT COUNT(DISTINCT sid)::int n FROM events WHERE ts>=${recent5}`,
      sql`SELECT COUNT(*)::int n FROM events`,
    ]);
    send(res, 200, { days, visits: visits[0], daily, games, hard, devices, countries, refs, recent, online: online[0].n, total: total[0].n });
  } catch (e) { send(res, 500, { error: "server" }); }
};
