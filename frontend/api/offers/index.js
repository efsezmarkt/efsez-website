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

    if (req.method === "GET") {
      const offers = await sql`
        SELECT * FROM offers
        ORDER BY active DESC, created_at DESC
      `;
      return send(res, 200, offers.map(normalizeOffer));
    }

    if (req.method === "POST") {
      if (!isAdmin(req)) return send(res, 401, { error: "Admin-Token fehlt oder ist falsch." });

      const payload = parseBody(req);
      requireFields(payload, ["title", "description"]);

      const [offer] = await sql`
        INSERT INTO offers (title, description, price, image, starts_at, ends_at, active)
        VALUES (
          ${payload.title}, ${payload.description}, ${payload.price || ""},
          ${payload.image || ""}, ${payload.starts_at || ""}, ${payload.ends_at || ""},
          ${payload.active !== false}
        )
        RETURNING *
      `;

      return send(res, 201, normalizeOffer(offer));
    }

    return send(res, 405, { error: "Methode nicht erlaubt." });
  } catch (error) {
    return send(res, 400, { error: error.message || "Unbekannter Fehler" });
  }
}
