import { PostgrestClient } from "@supabase/postgrest-js";
import { SUPABASE_URL, supabaseHeaders, PAGE_SIZE } from "./config";

/**
 * Öffentlicher Lesezugriff auf Supabase (nur der schlanke REST-Client,
 * Login & Bilder-Upload werden erst im Personalbereich nachgeladen).
 */
const rest = new PostgrestClient(`${SUPABASE_URL}/rest/v1`, { headers: supabaseHeaders() });

const PRODUCT_FIELDS =
  "id,name,image,unit,price,featured,available,brand,category_id,variant_count,price_from,price_to,category:categories(name,image)";

function unwrap({ data, error, count }) {
  if (error) throw new Error(error.message || "Daten konnten nicht geladen werden.");
  return count === undefined || count === null ? data : { data, count };
}

/* ---------- Zwischenspeicher: sofort anzeigen, im Hintergrund auffrischen ---------- */

const memory = new Map();
const TTL = 60 * 1000;

function readStored(key) {
  try {
    const raw = sessionStorage.getItem(`efsez:${key}`);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function writeStored(key, value) {
  try {
    sessionStorage.setItem(`efsez:${key}`, JSON.stringify(value));
  } catch {
    /* Speicher voll oder gesperrt – egal */
  }
}

/** Liefert gespeicherte Daten (falls vorhanden) sofort, lädt frisch, wenn älter als TTL. */
export function cached(key, loader) {
  const hit = memory.get(key);
  if (hit && Date.now() - hit.at < TTL) return { initial: hit.value, fresh: Promise.resolve(hit.value) };

  const initial = hit?.value ?? readStored(key);
  const fresh = loader().then((value) => {
    memory.set(key, { value, at: Date.now() });
    writeStored(key, value);
    return value;
  });
  return { initial, fresh };
}

export function invalidate() {
  memory.clear();
  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith("efsez:"))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch {
    /* egal */
  }
}

/* ---------- Abfragen ---------- */

export async function loadSettings() {
  const rows = unwrap(await rest.from("settings").select("key,value"));
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function loadCategories() {
  return unwrap(
    await rest
      .from("categories_with_counts")
      .select("id,name,description,image,sort_order,visible_count")
      .eq("visible", true)
      .gt("visible_count", 0)
      .order("sort_order")
      .order("name")
  );
}

export async function loadOffers() {
  const offers = unwrap(
    await rest
      .from("offers")
      .select(
        "id,title,note,image,starts_on,ends_on,items:offer_items(id,offer_price,old_price,note,sort_order,product:products(id,name,image,unit,brand,price,category:categories(name,image)))"
      )
      .eq("active", true)
      .order("created_at", { ascending: false })
  );
  return offers.map((offer) => ({
    ...offer,
    items: (offer.items || [])
      .filter((item) => item.product)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => toDeal(item))
  }));
}

export function toDeal(item) {
  const product = item.product || {};
  const old = item.old_price ?? product.price ?? null;
  const price = item.offer_price ?? null;
  return {
    id: item.id,
    productId: product.id,
    name: product.name,
    image: product.image || product.category?.image || "",
    unit: product.unit,
    brand: product.brand,
    category: product.category?.name || "",
    note: item.note,
    price: price === null ? null : Number(price),
    oldPrice: old === null || (price !== null && Number(old) <= Number(price)) ? null : Number(old),
    discount:
      price !== null && old !== null && Number(old) > Number(price)
        ? Math.round((1 - Number(price) / Number(old)) * 100)
        : null
  };
}

function sanitizeSearch(term) {
  return String(term || "")
    .replace(/[,()*%\\]/g, " ")
    .trim()
    .slice(0, 60);
}

export async function loadProducts({ page = 0, categoryId = null, search = "", featured = false, limit = PAGE_SIZE } = {}) {
  let query = rest
    .from("products")
    .select(PRODUCT_FIELDS, { count: page === 0 ? "exact" : undefined })
    .eq("visible", true);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (featured) query = query.eq("featured", true);

  const term = sanitizeSearch(search);
  if (term) query = query.or(`search_text.ilike.*${term}*,barcode.ilike.${term}*`);

  const from = page * limit;
  const result = await query
    .order("featured", { ascending: false })
    .order("has_image", { ascending: false })
    .order("name")
    .range(from, from + limit - 1);

  if (result.error) throw new Error(result.error.message);
  return { items: result.data, total: result.count ?? null };
}

export async function loadProduct(id) {
  const product = unwrap(
    await rest
      .from("products")
      .select("*,category:categories(id,name,image)")
      .eq("id", id)
      .eq("visible", true)
      .maybeSingle()
  );
  return product;
}

export async function loadVisibleCount() {
  const result = await rest.from("products").select("id", { count: "exact", head: true }).eq("visible", true);
  if (result.error) throw new Error(result.error.message);
  return result.count;
}

export async function sendContactRequest(payload) {
  const { error } = await rest.from("contact_requests").insert({
    name: String(payload.name || "").slice(0, 120),
    contact: String(payload.contact || "").trim().slice(0, 160),
    purpose: String(payload.purpose || "Allgemeine Anfrage").slice(0, 60),
    message: String(payload.message || "").trim().slice(0, 4000)
  });
  if (error) throw new Error("Die Anfrage konnte nicht gesendet werden. Bitte prüfen Sie Ihre Angaben oder schreiben Sie uns per WhatsApp.");
}
