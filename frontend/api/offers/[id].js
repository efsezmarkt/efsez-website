import {
  ensureSchema,
  isAdmin,
  normalizeOffer,
  parseBody,
  requireFields,
  send,
  sql
} from "../_lib/db.js";

export default async function handler(req, res) {
  try {
    await ensureSchema();

    const id = Number(req.query.id);
    if (!Number.isInteger(id)) return send(res, 400, { error: "Ungueltige Angebots-ID." });
    if (!isAdmin(req)) return send(res, 401, { error: "Zugangscode fehlt oder ist falsch." });

    if (req.method === "PUT") {
      const payload = parseBody(req);
      requireFields(payload, ["title", "description"]);

      const [offer] = await sql`
        UPDATE offers
        SET title = ${payload.title},
          description = ${payload.description},
          price = ${payload.price || ""},
          image = ${payload.image || ""},
          starts_at = ${payload.starts_at || ""},
          ends_at = ${payload.ends_at || ""},
          active = ${payload.active !== false}
        WHERE id = ${id}
        RETURNING *
      `;

      if (!offer) return send(res, 404, { error: "Angebot nicht gefunden." });
      return send(res, 200, normalizeOffer(offer));
    }

    if (req.method === "DELETE") {
      await sql`DELETE FROM offers WHERE id = ${id}`;
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: "Methode nicht erlaubt." });
  } catch (error) {
    return send(res, 400, { error: error.message || "Unbekannter Fehler" });
  }
}
