import { normalizeOffer, sql, toPrice, todayIso } from "./db.js";

/** Angebote inkl. Positionen (Produkt + Angebotspreis) laden. */
export async function loadOffers({ all = false, id = null } = {}) {
  const today = todayIso();
  const offers = id !== null
    ? await sql`SELECT * FROM offers WHERE id = ${id}`
    : all
      ? await sql`SELECT * FROM offers ORDER BY active DESC, created_at DESC`
      : await sql`
          SELECT * FROM offers
          WHERE active
            AND (starts_at = '' OR starts_at <= ${today})
            AND (ends_at = '' OR ends_at >= ${today})
          ORDER BY created_at DESC`;

  if (!offers.length) return [];

  const ids = offers.map((offer) => offer.id);
  const items = await sql`
    SELECT oi.id, oi.offer_id, oi.product_id, oi.offer_price, oi.note, oi.sort_order,
      COALESCE(oi.old_price, p.price) AS old_price,
      p.name, p.image, p.unit, p.brand, p.category, p.visible
    FROM offer_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.offer_id = ANY(${ids}::int[])
    ORDER BY oi.sort_order, oi.id`;

  const byOffer = new Map(offers.map((offer) => [offer.id, []]));
  for (const item of items) byOffer.get(item.offer_id)?.push(item);

  return offers.map((offer) => normalizeOffer({ ...offer, items: byOffer.get(offer.id) || [] }));
}

/** Positionen eines Angebots komplett ersetzen. */
export async function replaceOfferItems(offerId, items) {
  await sql`DELETE FROM offer_items WHERE offer_id = ${offerId}`;
  if (!Array.isArray(items)) return;

  const seen = new Set();
  let order = 0;
  for (const item of items) {
    const productId = Number(item.product_id);
    if (!Number.isInteger(productId) || seen.has(productId)) continue;
    seen.add(productId);
    await sql`
      INSERT INTO offer_items (offer_id, product_id, offer_price, old_price, note, sort_order)
      VALUES (${offerId}, ${productId}, ${toPrice(item.offer_price)}, ${toPrice(item.old_price)},
        ${String(item.note || "").slice(0, 120)}, ${order})`;
    order += 1;
  }
}
