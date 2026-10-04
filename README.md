# EFSE'Z Markt – Website

Produkt- und Angebots-Website für den EFSE'Z Markt Nürnberg (efsez-markt.de).
Keine Online-Bestellung: Produkte werden präsentiert, Anfragen laufen über WhatsApp und Kontaktformular.

## Aufbau

```
frontend/            Vite + React (Hash-Routing: #/, #/products, #/product/:id, #/contact, #/admin)
frontend/api/        Vercel Serverless Functions (Node, ESM) – die einzige API-Implementierung
frontend/api/_lib/   Datenbankschicht (Neon Postgres), Import-Logik, Warengruppen-Zuordnung
backend/             Lokaler Dev-Server, der die Vercel-Funktionen gegen eine lokale Postgres fährt
scripts/             API-Tests gegen eine lokale Postgres
```

Hosting: Vercel (Projekt `efsez-website`). Datenbank: Neon Postgres (über Vercel Storage verbunden).
Bilder: Vercel Blob. Das Schema legt sich beim ersten API-Aufruf selbst an und erweitert sich
bei Updates automatisch (`ALTER TABLE ... IF NOT EXISTS` in `frontend/api/_lib/db.js`).

## Personalbereich (`#/admin`)

Zugang über den Code aus `ADMIN_TOKEN`. Reiter:

- **Angebote** – Wochenangebote mit Produkten, Rabatt in %, Angebotspreis; Vorschau im Prospekt-Stil.
  Erscheinen automatisch im Zeitraum (von/bis) auf der Startseite.
- **Produkte** – Suche, Filter, Sichtbar/Beliebt per Schalter, Massenänderung (Auswahl oder ganze Kategorie),
  Bearbeiten mit Preis, Bild, Beschreibung.
- **Kategorien** – anlegen, umbenennen (Produkte ziehen mit), sortieren, Bild (dient auch als Platzhalter), löschen.
- **Anfragen** – Kontaktanfragen der Website, als erledigt markieren.
- **Kassen-Import** – CSV-Export aus der Kasse (Delta-A / DCO) hochladen. Neue Produkte werden angelegt,
  bestehende (gleicher Barcode) bekommen nur den neuen Preis – Name, Bild, Kategorie, Sichtbarkeit bleiben.
  Kann beliebig oft wiederholt werden. Zuordnung Warengruppe → Kategorie: `frontend/api/_lib/posGroups.js`.
- **Einstellungen** – WhatsApp-Nummer, Telefon, E-Mail, Adresse, Öffnungszeiten, Zieladresse für Anfragen.

## Umgebungsvariablen (Vercel)

| Variable | Pflicht | Zweck |
|---|---|---|
| `DATABASE_URL` | ja | Neon-Verbindung (wird von Vercel Storage gesetzt) |
| `ADMIN_TOKEN` | ja | Zugangscode für den Personalbereich |
| `BLOB_READ_WRITE_TOKEN` | ja | Vercel Blob für Bild-Uploads (von Vercel gesetzt) |
| `RESEND_API_KEY` | nein | Wenn gesetzt, gehen Kontaktanfragen zusätzlich per Mail an die in den Einstellungen gepflegte Adresse |
| `CONTACT_FROM_EMAIL` | nein | Absender für diese Mails, z. B. `EFSE'Z Website <website@efsez-markt.de>` (Domain bei Resend verifizieren) |

## Lokal entwickeln

Voraussetzung: Node 22+, eine lokale Postgres.

```bash
cd frontend && npm install

# API (Terminal 1)
cd backend
DATABASE_URL=postgres://user@localhost:5432/efsez ADMIN_TOKEN=geheim NODE_PATH=../frontend/node_modules npm run dev

# Website (Terminal 2)
cd frontend
VITE_API_URL=http://localhost:4000/api npm run dev
```

Tests gegen die lokale Datenbank (inkl. Import, wenn ein Kassen-Export unter `CSV_PATH` liegt):

```bash
DATABASE_URL=postgres://user@localhost:5432/efsez CSV_PATH=./kasse-export.csv node scripts/api-test.mjs
```

Lint: `npm run lint` (im Repo-Root, nutzt `frontend/node_modules`).

## API-Überblick

| Route | Öffentlich | Admin |
|---|---|---|
| `GET /api/products?page&limit&category&q&featured` | sichtbare Produkte, seitenweise | `all=1` auch unsichtbare |
| `GET/POST /api/products`, `GET/PUT/PATCH/DELETE /api/products/:id` | lesen | schreiben |
| `GET /api/categories` | sichtbare mit Produktzahl | `all=1` |
| `POST /api/categories`, `PUT/DELETE /api/categories/:id` | – | ja |
| `GET /api/offers` | aktive im Zeitraum, mit Positionen | `all=1` |
| `POST /api/offers`, `GET/PUT/PATCH/DELETE /api/offers/:id` | – | ja |
| `GET /api/settings` | öffentliche Einstellungen | alle; `PUT` |
| `POST /api/contact` | Anfrage senden | – |
| `POST /api/admin/session` · `bulk` · `import`, `GET/PATCH/DELETE /api/admin/requests` | – | ja |
| `POST /api/uploads` | – | Bild-Upload (Vercel Blob) |

Vercel Hobby erlaubt nur wenige Serverless-Funktionen – deshalb sind die Admin-Aktionen in `api/admin/[action].js` gebündelt.
