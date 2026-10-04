import { ensureSchema, requireAdmin, send } from "../_lib/db.js";
import { bulkHandler } from "../_lib/bulk.js";
import { importHandler } from "../_lib/import.js";
import { requestsHandler } from "../_lib/requests.js";

/**
 * Admin-Sammelroute (Vercel Hobby erlaubt nur wenige Funktionen):
 *   POST /api/admin/session   Zugangscode prüfen
 *   POST /api/admin/bulk      Massenänderung an Produkten
 *   POST /api/admin/import    Kassen-Import
 *   GET|PATCH|DELETE /api/admin/requests   Kontaktanfragen
 */
export default async function handler(req, res) {
  try {
    await ensureSchema();
    if (!requireAdmin(req, res)) return undefined;

    switch (req.query.action) {
      case "session":
        return send(res, 200, { ok: true });
      case "bulk":
        return bulkHandler(req, res);
      case "import":
        return importHandler(req, res);
      case "requests":
        return requestsHandler(req, res);
      default:
        return send(res, 404, { error: "Unbekannte Admin-Aktion." });
    }
  } catch (error) {
    return send(res, 400, { error: error.message || "Unbekannter Fehler" });
  }
}
