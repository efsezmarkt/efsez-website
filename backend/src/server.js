import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(join(dataDir, "efsez.sqlite"));
const PORT = Number(process.env.PORT || 4000);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "change-me";

const seedProducts = [
  ["Caykur Rize Tee", "Getranke", "Caykur", "Traditioneller turkischer Schwarztee fur den klassischen Cay-Genuss.", "/src/assets/products/caykur-rize-tee.png", 1, 1, "500 g", "Turkei", "", "Schwarzer Tee. Produktinformationen werden spater aus Etiketten oder Barcode-Daten erganzt.", "", "tee,getranke"],
  ["Efepasa Sucuk", "Fleischwaren", "Efepasa", "Wurzige turkische Knoblauchwurst, ideal zum Braten, Fruhstuck oder Grillen.", "/src/assets/products/efepasa-sucuk.png", 1, 1, "Packung", "Deutschland", "", "Gekuhlt lagern. Details zu Zutaten und Allergenen werden je Produkt gepflegt.", "", "fleisch,sucuk"],
  ["Baklava mit Pistazien", "Susswaren", "Hausgemacht", "Traditionelles Geback mit feinen Pistazien und dunnen Teigschichten.", "/src/assets/products/baklava-pistazie.png", 1, 1, "nach Gewicht", "Hausgemacht", "Nusse, Gluten", "Frisch aus der Theke. Ideal fur Feiern, Besuch und als Geschenk.", "", "baklava,theke"],
  ["Sera Grune Oliven", "Konserven", "Sera", "Eingelegte grune Oliven nach turkischer Art, aromatisch und mild.", "/src/assets/products/sera-gruene-oliven.png", 0, 1, "Glas", "Turkei", "", "Eingelegte Oliven. Weitere Produktdaten konnen im Adminbereich gepflegt werden.", "", "oliven,konserven"],
  ["Bagdat Pul Biber", "Gewurze", "Bagdat", "Turkische Chiliflocken, scharf und aromatisch fur viele Gerichte.", "/src/assets/products/bagdat-pul-biber.png", 1, 1, "Packung", "Turkei", "", "Gewurz fur Suppen, Grillgerichte und Pfannengerichte.", "", "gewurz,scharf"],
  ["Yayla Ayran", "Milchprodukte", "Yayla", "Erfrischendes Joghurtgetrank, passend zu warmen Speisen oder unterwegs.", "/src/assets/products/yayla-ayran.png", 1, 1, "Becher", "Deutschland", "Milch", "Kuhl lagern. Beliebt zu Grillwaren, Brot und warmen Speisen.", "", "ayran,milch"],
  ["Koska Tahin", "Fruhstuck", "Koska", "Fein gemahlene Sesampaste, ideal fur Fruhstuck und Sussspeisen.", "/src/assets/products/koska-tahin.png", 0, 1, "Glas", "Turkei", "Sesam", "Sesampaste fur Fruhstuck, Desserts und traditionelle Rezepte.", "", "fruhstuck,sesam"],
  ["Koska Pekmez", "Fruhstuck", "Koska", "Traditioneller Traubensirup, suss und naturlich im Geschmack.", "/src/assets/products/koska-pekmez.png", 0, 1, "Glas", "Turkei", "", "Traubensirup. Wird haufig zusammen mit Tahin serviert.", "", "fruhstuck,sirup"],
  ["Duru Bulgur", "Nudeln & Reis", "Duru", "Klassischer Bulgur fur turkische Gerichte, Salate und Beilagen.", "/src/assets/products/duru-bulgur.png", 0, 1, "Packung", "Turkei", "Gluten", "Bulgur fur Beilagen, Salate und warme Gerichte.", "", "bulgur,reissortiment"]
];

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    featured INTEGER NOT NULL DEFAULT 0,
    available INTEGER NOT NULL DEFAULT 1,
    unit TEXT,
    origin TEXT,
    allergens TEXT,
    details TEXT,
    barcode TEXT,
    tags TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price TEXT,
    image TEXT,
    starts_at TEXT,
    ends_at TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contact_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    contact TEXT NOT NULL,
    purpose TEXT NOT NULL,
    message TEXT NOT NULL,
    handled INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

for (const statement of [
  "ALTER TABLE products ADD COLUMN unit TEXT",
  "ALTER TABLE products ADD COLUMN origin TEXT",
  "ALTER TABLE products ADD COLUMN allergens TEXT",
  "ALTER TABLE products ADD COLUMN details TEXT",
  "ALTER TABLE products ADD COLUMN barcode TEXT",
  "ALTER TABLE products ADD COLUMN tags TEXT"
]) {
  try {
    db.exec(statement);
  } catch {
    // Column already exists in an existing local database.
  }
}

const productCount = db.prepare("SELECT COUNT(*) AS count FROM products").get().count;
if (productCount === 0) {
  const insertProduct = db.prepare(`
    INSERT INTO products (name, category, brand, description, image, featured, available, unit, origin, allergens, details, barcode, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const product of seedProducts) insertProduct.run(...product);
}

const enrichSeedProduct = db.prepare(`
  UPDATE products
  SET unit = COALESCE(NULLIF(unit, ''), ?),
    origin = COALESCE(NULLIF(origin, ''), ?),
    allergens = COALESCE(NULLIF(allergens, ''), ?),
    details = COALESCE(NULLIF(details, ''), ?),
    barcode = COALESCE(NULLIF(barcode, ''), ?),
    tags = COALESCE(NULLIF(tags, ''), ?)
  WHERE name = ?
`);

for (const product of seedProducts) {
  enrichSeedProduct.run(product[7], product[8], product[9], product[10], product[11], product[12], product[0]);
}

const offerCount = db.prepare("SELECT COUNT(*) AS count FROM offers").get().count;
if (offerCount === 0) {
  db.prepare(`
    INSERT INTO offers (title, description, price, image, starts_at, ends_at, active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run("Wochenangebot", "Aktuelle Angebote direkt aus dem Markt. Details im Laden oder per WhatsApp anfragen.", "ab 1,99 EUR", "/src/assets/hero.png", "", "", 1);
}

function send(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Payload zu gross"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Ungueltiges JSON"));
      }
    });
  });
}

function isAdmin(req) {
  return req.headers.authorization === `Bearer ${ADMIN_TOKEN}`;
}

function normalizeProduct(row) {
  return {
    ...row,
    image: publicAssetPath(row.image),
    featured: Boolean(row.featured),
    available: Boolean(row.available)
  };
}

function normalizeOffer(row) {
  return {
    ...row,
    image: publicAssetPath(row.image),
    active: Boolean(row.active)
  };
}

function publicAssetPath(path) {
  if (!path) return "";
  return path.replace(/^\/src\/assets\//, "/assets/");
}

function requireFields(payload, fields) {
  const missing = fields.filter((field) => !String(payload[field] ?? "").trim());
  if (missing.length) throw new Error(`Fehlende Felder: ${missing.join(", ")}`);
}

async function handleContact(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Methode nicht erlaubt." });

  const payload = await readJson(req);
  requireFields(payload, ["contact", "purpose", "message"]);

  const allowedPurposes = new Set([
    "Produktwunsch",
    "Produktverfuegbarkeit",
    "Partneranfrage",
    "Lieferant / Zusammenarbeit",
    "Allgemeine Anfrage"
  ]);
  const purpose = allowedPurposes.has(payload.purpose) ? payload.purpose : "Allgemeine Anfrage";

  const result = db.prepare(`
    INSERT INTO contact_requests (name, contact, purpose, message)
    VALUES (?, ?, ?, ?)
  `).run(payload.name || "", payload.contact, purpose, payload.message);

  return send(res, 201, { ok: true, id: result.lastInsertRowid });
}

async function handleProducts(req, res, id) {
  if (req.method === "GET" && !id) {
    const rows = db.prepare("SELECT * FROM products ORDER BY featured DESC, name ASC").all();
    return send(res, 200, rows.map(normalizeProduct));
  }

  if (req.method === "GET" && id) {
    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!row) return send(res, 404, { error: "Produkt nicht gefunden." });
    return send(res, 200, normalizeProduct(row));
  }

  if (!isAdmin(req)) return send(res, 401, { error: "Zugangscode fehlt oder ist falsch." });

  if (req.method === "POST" && !id) {
    const payload = await readJson(req);
    requireFields(payload, ["name", "category", "brand", "description", "image"]);
    const result = db.prepare(`
      INSERT INTO products (name, category, brand, description, image, featured, available, unit, origin, allergens, details, barcode, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      payload.name,
      payload.category,
      payload.brand,
      payload.description,
      payload.image,
      payload.featured ? 1 : 0,
      payload.available === false ? 0 : 1,
      payload.unit || "",
      payload.origin || "",
      payload.allergens || "",
      payload.details || "",
      payload.barcode || "",
      payload.tags || ""
    );
    return send(res, 201, normalizeProduct(db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid)));
  }

  if (req.method === "PUT" && id) {
    const payload = await readJson(req);
    requireFields(payload, ["name", "category", "brand", "description", "image"]);
    db.prepare(`
      UPDATE products
      SET name = ?, category = ?, brand = ?, description = ?, image = ?, featured = ?, available = ?,
        unit = ?, origin = ?, allergens = ?, details = ?, barcode = ?, tags = ?
      WHERE id = ?
    `).run(
      payload.name,
      payload.category,
      payload.brand,
      payload.description,
      payload.image,
      payload.featured ? 1 : 0,
      payload.available === false ? 0 : 1,
      payload.unit || "",
      payload.origin || "",
      payload.allergens || "",
      payload.details || "",
      payload.barcode || "",
      payload.tags || "",
      id
    );
    const updatedProduct = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!updatedProduct) return send(res, 404, { error: "Produkt nicht gefunden." });
    return send(res, 200, normalizeProduct(updatedProduct));
  }

  if (req.method === "DELETE" && id) {
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: "Route nicht gefunden." });
}

async function handleOffers(req, res, id) {
  if (req.method === "GET" && !id) {
    const rows = db.prepare("SELECT * FROM offers ORDER BY active DESC, created_at DESC").all();
    return send(res, 200, rows.map(normalizeOffer));
  }

  if (!isAdmin(req)) return send(res, 401, { error: "Zugangscode fehlt oder ist falsch." });

  if (req.method === "POST" && !id) {
    const payload = await readJson(req);
    requireFields(payload, ["title", "description"]);
    const result = db.prepare(`
      INSERT INTO offers (title, description, price, image, starts_at, ends_at, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(payload.title, payload.description, payload.price || "", payload.image || "", payload.starts_at || "", payload.ends_at || "", payload.active === false ? 0 : 1);
    return send(res, 201, normalizeOffer(db.prepare("SELECT * FROM offers WHERE id = ?").get(result.lastInsertRowid)));
  }

  if (req.method === "PUT" && id) {
    const payload = await readJson(req);
    requireFields(payload, ["title", "description"]);
    db.prepare(`
      UPDATE offers
      SET title = ?, description = ?, price = ?, image = ?, starts_at = ?, ends_at = ?, active = ?
      WHERE id = ?
    `).run(
      payload.title,
      payload.description,
      payload.price || "",
      payload.image || "",
      payload.starts_at || "",
      payload.ends_at || "",
      payload.active === false ? 0 : 1,
      id
    );

    const updatedOffer = db.prepare("SELECT * FROM offers WHERE id = ?").get(id);
    if (!updatedOffer) return send(res, 404, { error: "Angebot nicht gefunden." });
    return send(res, 200, normalizeOffer(updatedOffer));
  }

  if (req.method === "DELETE" && id) {
    db.prepare("DELETE FROM offers WHERE id = ?").run(id);
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: "Route nicht gefunden." });
}

function handleAdminSession(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Methode nicht erlaubt." });
  if (!isAdmin(req)) return send(res, 401, { error: "Zugangscode ist falsch." });
  return send(res, 200, { ok: true });
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 200, { ok: true });

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const productMatch = url.pathname.match(/^\/api\/products\/?(\d+)?$/);
    const offerMatch = url.pathname.match(/^\/api\/offers\/?(\d+)?$/);

    if (url.pathname === "/api/health") return send(res, 200, { ok: true });
    if (url.pathname === "/api/admin/session") return handleAdminSession(req, res);
    if (url.pathname === "/api/contact") return handleContact(req, res);
    if (productMatch) return handleProducts(req, res, productMatch[1] ? Number(productMatch[1]) : null);
    if (offerMatch) return handleOffers(req, res, offerMatch[1] ? Number(offerMatch[1]) : null);

    return send(res, 404, { error: "Route nicht gefunden." });
  } catch (error) {
    return send(res, 400, { error: error.message || "Unbekannter Fehler" });
  }
});

server.listen(PORT, () => {
  console.log(`EFSEZ API lauft auf http://localhost:${PORT}`);
  console.log(`Admin-Token: ${ADMIN_TOKEN}`);
});
