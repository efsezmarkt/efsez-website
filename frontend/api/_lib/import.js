import { parseBody, send, sql, toPrice } from "./db.js";
import { categoryForPosGroup, formatUnit } from "./posGroups.js";

const MAX_ROWS = 1000;

/**
 * POST /api/admin/import  (nur Admin)
 * Nimmt Zeilen aus dem Kassen-Export (CSV wird im Browser gelesen) und legt sie an
 * bzw. aktualisiert sie anhand des Barcodes.
 *
 * body: {
 *   rows: [{ kassen_id, barcode, name, pos_group_id, pos_group, amount, unit, price, favorit }],
 *   visibility: "favorites" | "all" | "none"   // nur für NEUE Produkte
 * }
 * Bei bereits vorhandenen Produkten (gleicher Barcode) werden nur Preis, Kassen-ID,
 * Warengruppe und (falls leer) Einheit aktualisiert. Name, Kategorie, Bild, Sichtbarkeit
 * bleiben, wie sie auf der Website gepflegt wurden.
 */
export async function importHandler(req, res) {
  try {
    if (req.method !== "POST") return send(res, 405, { error: "Methode nicht erlaubt." });

    const payload = parseBody(req);
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    if (!rows.length) throw new Error("Keine Zeilen übergeben.");
    if (rows.length > MAX_ROWS) throw new Error(`Maximal ${MAX_ROWS} Zeilen pro Durchgang.`);
    const visibility = ["favorites", "all", "none"].includes(payload.visibility) ? payload.visibility : "favorites";

    const prepared = [];
    const seen = new Set();
    const categories = new Set();
    let skipped = 0;

    for (const row of rows) {
      const barcode = String(row.barcode ?? "").trim();
      const name = cleanName(row.name);
      const category = categoryForPosGroup(row.pos_group_id);
      if (!barcode || !name || category === null || seen.has(barcode)) {
        skipped += 1;
        continue;
      }
      seen.add(barcode);
      const favorit = row.favorit === true || row.favorit === "J" || row.favorit === "true";
      categories.add(category);
      prepared.push({
        barcode,
        name,
        category,
        unit: formatUnit(row.amount, row.unit),
        price: toPrice(row.price),
        kassen_id: Number.isInteger(Number(row.kassen_id)) ? Number(row.kassen_id) : null,
        pos_group: String(row.pos_group ?? "").trim(),
        featured: favorit,
        visible: visibility === "all" ? true : visibility === "none" ? false : favorit
      });
    }

    for (const category of categories) {
      await sql`INSERT INTO categories (name, sort_order) VALUES (${category}, 500) ON CONFLICT (name) DO NOTHING`;
    }

    if (!prepared.length) return send(res, 200, { inserted: 0, updated: 0, skipped });

    const column = (key) => prepared.map((row) => row[key]);
    const result = await sql.query(
      `
      INSERT INTO products (
        barcode, name, category, unit, price, kassen_id, pos_group, featured, visible,
        brand, description, image, source
      )
      SELECT * FROM UNNEST(
        $1::text[], $2::text[], $3::text[], $4::text[], $5::numeric[], $6::int[], $7::text[], $8::boolean[], $9::boolean[],
        $10::text[], $11::text[], $12::text[], $13::text[]
      )
      ON CONFLICT (barcode) WHERE barcode <> '' DO UPDATE SET
        price = EXCLUDED.price,
        kassen_id = EXCLUDED.kassen_id,
        pos_group = EXCLUDED.pos_group,
        unit = CASE WHEN products.unit = '' THEN EXCLUDED.unit ELSE products.unit END,
        updated_at = NOW()
      RETURNING (xmax = 0) AS inserted
      `,
      [
        column("barcode"),
        column("name"),
        column("category"),
        column("unit"),
        column("price").map((value) => (value === null ? null : String(value))),
        column("kassen_id"),
        column("pos_group"),
        column("featured"),
        column("visible"),
        prepared.map(() => ""),
        prepared.map(() => ""),
        prepared.map(() => ""),
        prepared.map(() => "kasse")
      ]
    );

    const inserted = result.filter((row) => row.inserted).length;
    return send(res, 200, { inserted, updated: result.length - inserted, skipped });
  } catch (error) {
    return send(res, 400, { error: error.message || "Import fehlgeschlagen." });
  }
}

// Die Kasse speichert Umlaute teils im Mac-Roman-Zeichensatz (erscheint als Steuerzeichen 0x80–0x9F).
const MAC_ROMAN = "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü";

/** Kassen-Namen sind oft abgekürzt – nur Zeichensatz reparieren und Leerzeichen glätten. */
export function cleanName(value) {
  return String(value ?? "")
    .replace(/[\u0080-\u009f]/g, (ch) => MAC_ROMAN[ch.charCodeAt(0) - 0x80] || "")
    .replace(/\s+/g, " ")
    .trim();
}
