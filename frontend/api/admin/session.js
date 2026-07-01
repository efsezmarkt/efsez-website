import { isAdmin, send } from "../_lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Methode nicht erlaubt." });

  if (!isAdmin(req)) {
    return send(res, 401, { error: "Zugangscode ist falsch." });
  }

  return send(res, 200, { ok: true });
}
