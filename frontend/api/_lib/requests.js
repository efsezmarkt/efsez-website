import { parseBody, send, sql } from "./db.js";

/**
 * GET    /api/admin/requests                 Kontaktanfragen, offene zuerst
 * PATCH  /api/admin/requests { id, handled } als erledigt/offen markieren
 * DELETE /api/admin/requests { id }          löschen
 */
export async function requestsHandler(req, res) {
  if (req.method === "GET") {
    const rows = await sql`SELECT * FROM contact_requests ORDER BY handled ASC, created_at DESC LIMIT 300`;
    return send(res, 200, rows);
  }

  const payload = parseBody(req);
  const id = Number(payload.id);
  if (!Number.isInteger(id)) return send(res, 400, { error: "Ungueltige ID." });

  if (req.method === "PATCH") {
    const [row] = await sql`UPDATE contact_requests SET handled = ${Boolean(payload.handled)} WHERE id = ${id} RETURNING *`;
    if (!row) return send(res, 404, { error: "Anfrage nicht gefunden." });
    return send(res, 200, row);
  }

  if (req.method === "DELETE") {
    await sql`DELETE FROM contact_requests WHERE id = ${id}`;
    return send(res, 200, { ok: true });
  }

  return send(res, 405, { error: "Methode nicht erlaubt." });
}
