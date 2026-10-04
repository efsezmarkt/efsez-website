// Lokaler API-Test: simuliert Vercel req/res gegen die Handler.
process.env.LOCAL_PG = "1";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://claude@localhost:5499/efsez?host=/var/tmp/efsezpg";
process.env.ADMIN_TOKEN = "test-token";
import fs from "node:fs";

const h = {
  products: (await import("../frontend/api/products/index.js")).default,
  product: (await import("../frontend/api/products/[id].js")).default,
  categories: (await import("../frontend/api/categories/index.js")).default,
  category: (await import("../frontend/api/categories/[id].js")).default,
  offers: (await import("../frontend/api/offers/index.js")).default,
  offer: (await import("../frontend/api/offers/[id].js")).default,
  settings: (await import("../frontend/api/settings.js")).default,
  contact: (await import("../frontend/api/contact.js")).default,
  admin: (await import("../frontend/api/admin/[action].js")).default
};

export async function call(name, { method = "GET", query = {}, body, admin = false } = {}) {
  const req = { method, query, body, headers: admin ? { authorization: "Bearer test-token" } : {} };
  let status = 0, payload;
  const res = { status: (s) => ({ json: (p) => { status = s; payload = p; } }) };
  await h[name](req, res);
  return { status, payload };
}

function assert(cond, msg) { if (!cond) { console.error("FAIL:", msg); process.exitCode = 1; } else console.log("ok  ", msg); }

// --- Schema + Seed
let r = await call("products");
assert(r.status === 200 && Array.isArray(r.payload.items), "GET /products liefert items " + JSON.stringify({ total: r.payload.total }));
r = await call("categories");
assert(r.status === 200 && r.payload.length >= 20, `GET /categories: ${r.payload.length} Kategorien`);

// --- Auth
r = await call("admin", { method: "POST", query: { action: "session" } });
assert(r.status === 401, "session ohne Token → 401");
r = await call("admin", { method: "POST", query: { action: "session" }, admin: true });
assert(r.status === 200, "session mit Token → 200");

// --- Produkt anlegen / ändern / Barcode-Dublette
r = await call("products", { method: "POST", admin: true, body: { name: "Testprodukt", category: "Testkategorie", barcode: "TEST-1", price: "2,59" } });
assert(r.status === 201 && r.payload.price === 2.59, "POST /products mit Preis 2,59 → 2.59");
const pid = r.payload.id;
r = await call("products", { method: "POST", admin: true, body: { name: "Dublette", category: "Testkategorie", barcode: "TEST-1" } });
assert(r.status === 400 && /Barcode/.test(r.payload.error), "Barcode-Dublette wird abgelehnt");
r = await call("product", { method: "PATCH", admin: true, query: { id: pid }, body: { visible: false } });
assert(r.status === 200 && r.payload.visible === false, "PATCH visible=false");
r = await call("product", { query: { id: pid } });
assert(r.status === 404, "unsichtbares Produkt öffentlich → 404");
r = await call("product", { query: { id: pid }, admin: true });
assert(r.status === 200, "unsichtbares Produkt für Admin sichtbar");
r = await call("categories", { admin: true, query: { all: "1" } });
assert(r.payload.some((c) => c.name === "Testkategorie"), "Kategorie wurde automatisch angelegt");

// --- Kategorie umbenennen → Produkte ziehen mit
const cat = r.payload.find((c) => c.name === "Testkategorie");
r = await call("category", { method: "PUT", admin: true, query: { id: cat.id }, body: { name: "Testkategorie NEU" } });
assert(r.status === 200, "Kategorie umbenannt");
r = await call("product", { query: { id: pid }, admin: true });
assert(r.payload.category === "Testkategorie NEU", "Produkt folgt Umbenennung");

// --- Import (echte CSV)
const csv = fs.readFileSync("/mnt/user-data/uploads/05bc450f.csv", "utf8").replace(/^﻿/, "");
const lines = csv.split(/\r?\n/).filter(Boolean);
const head = lines[0].split(";");
const idx = Object.fromEntries(head.map((k, i) => [k, i]));
const rows = lines.slice(1).map((l) => { const c = l.split(";"); return {
  kassen_id: c[idx.ID], barcode: c[idx.Barcode], name: c[idx.Bezeichnung], pos_group_id: c[idx.WarengruppenID],
  pos_group: c[idx.Warengruppen], amount: c[idx.Gewicht], unit: c[idx.Einheit], price: c[idx["VK-Preis"]], favorit: c[idx.Favorit] }; });
let tot = { inserted: 0, updated: 0, skipped: 0 };
console.time("import");
for (let i = 0; i < rows.length; i += 500) {
  r = await call("admin", { method: "POST", admin: true, query: { action: "import" }, body: { rows: rows.slice(i, i + 500), visibility: "favorites" } });
  if (r.status !== 200) { console.error(r.payload); break; }
  for (const k in tot) tot[k] += r.payload[k];
}
console.timeEnd("import");
console.log("Import 1:", tot);
assert(tot.inserted > 12000, "über 12.000 Produkte importiert");
r = await call("products", { query: { limit: "1" } });
console.log("sichtbar:", r.payload.total);
assert(r.payload.total >= 237 && r.payload.total < 300, "nur Favoriten + Seed sichtbar");
r = await call("products", { query: { q: "erdnüsse", limit: "5" }, admin: true, all: true });
r = await call("products", { query: { q: "erdnüsse", limit: "5", all: "1" }, admin: true });
console.log("Suche erdnüsse:", r.payload.items.map((p) => `${p.name} | ${p.unit} | ${p.price}`).slice(0, 4));
assert(r.payload.items.some((p) => /Erdnüsse/.test(p.name)), "Mac-Roman-Umlaute repariert");

// --- Re-Import: Preise aktualisieren, nichts doppelt
rows[0].price = "9,99"; rows[0].name = "GEÄNDERT IN KASSE";
r = await call("admin", { method: "POST", admin: true, query: { action: "import" }, body: { rows: rows.slice(0, 50), visibility: "all" } });
assert(r.payload.updated === 50 && r.payload.inserted === 0, "Re-Import: 50 aktualisiert, 0 neu " + JSON.stringify(r.payload));
r = await call("products", { query: { q: rows[0].barcode, all: "1" }, admin: true });
assert(r.payload.items[0].price === 9.99 && r.payload.items[0].name !== "GEÄNDERT IN KASSE", "Re-Import: Preis neu, Name bleibt");

// --- Bulk
r = await call("admin", { method: "POST", admin: true, query: { action: "bulk" }, body: { category: "Getränke", set: { visible: true } } });
assert(r.status === 200 && r.payload.affected > 1000, `Bulk: ${r.payload.affected} Getränke sichtbar`);
r = await call("products", { query: { category: "Getränke", limit: "24", page: "2" } });
assert(r.payload.items.length === 24 && r.payload.hasMore === true, "Pagination Seite 2 hat 24 + hasMore");

// --- Angebot mit Positionen
const prods = (await call("products", { query: { category: "Getränke", limit: "3" } })).payload.items;
r = await call("offers", { method: "POST", admin: true, body: { title: "Wochenangebot", starts_at: "", ends_at: "2099-01-01",
  items: prods.map((p) => ({ product_id: p.id, offer_price: (p.price || 2) * 0.8, old_price: p.price || 2 })) } });
assert(r.status === 201 && r.payload.items.length === 3 && r.payload.items[0].discount_percent === 20, "Angebot mit 3 Positionen, 20% Rabatt");
const oid = r.payload.id;
r = await call("offers");
assert(r.payload.some((o) => o.id === oid), "aktives Angebot öffentlich sichtbar");
r = await call("offer", { method: "PUT", admin: true, query: { id: oid }, body: { title: "Abgelaufen", ends_at: "2000-01-01" } });
r = await call("offers");
assert(!r.payload.some((o) => o.id === oid), "abgelaufenes Angebot ausgeblendet");
r = await call("offers", { admin: true, query: { all: "1" } });
assert(r.payload.some((o) => o.id === oid && o.items.length === 3), "Admin sieht es weiter inkl. Positionen");

// --- Settings + Kontakt + Anfragen
r = await call("settings", { method: "PUT", admin: true, body: { whatsapp_number: "+49 911 123", notify_email: "x@y.de", foo: "bar" } });
assert(r.payload.whatsapp_number === "+49 911 123" && r.payload.notify_email === "x@y.de" && !("foo" in r.payload), "Settings gespeichert, unbekannte Keys ignoriert");
r = await call("settings");
assert(!("notify_email" in r.payload), "notify_email nicht öffentlich");
r = await call("contact", { method: "POST", body: { contact: "a@b.de", purpose: "Produktwunsch", message: "Hallo" } });
assert(r.status === 201, "Kontaktanfrage gespeichert");
r = await call("admin", { admin: true, query: { action: "requests" } });
assert(r.payload.length >= 1 && r.payload[0].handled === false, "Anfrage im Admin sichtbar");
r = await call("admin", { method: "PATCH", admin: true, query: { action: "requests" }, body: { id: r.payload[0].id, handled: true } });
assert(r.payload.handled === true, "Anfrage als erledigt markiert");

// --- Kategorie löschen → Produkte nach Sonstiges
r = await call("categories", { admin: true, query: { all: "1" } });
const tk = r.payload.find((c) => c.name === "Testkategorie NEU");
r = await call("category", { method: "DELETE", admin: true, query: { id: tk.id } });
assert(r.payload.moved === 1 && r.payload.moved_to === "Sonstiges", "Kategorie gelöscht, Produkt nach Sonstiges");

console.log("\nKategorien mit Produktzahl:");
r = await call("categories", { admin: true, query: { all: "1" } });
for (const c of r.payload) console.log(`  ${String(c.product_count).padStart(5)}  ${String(c.visible_count).padStart(4)} sichtbar  ${c.name}`);
process.exit(process.exitCode || 0);
