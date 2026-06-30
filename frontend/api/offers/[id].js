import { ensureSchema, isAdmin, send, sql } from "../_lib/db.js";

export default async function handler(req, res) {
  try {
    await ensureSchema();

    const id = Number(req.query.id);
    if (!Number.isInteger(id)) return send(res, 400, { error: "Ungueltige Angebots-ID." });
    if (!isAdmin(req)) return send(res, 401, { error: "Admin-Token fehlt oder ist falsch." });

    if (req.method === "DELETE") {
      await sql`DELETE FROM offers WHERE id = ${id}`;
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: "Methode nicht erlaubt." });
  } catch (error) {
    return send(res, 400, { error: error.message || "Unbekannter Fehler" });
  }
}
