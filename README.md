# EFSE'Z Markt – Website

Produkt- und Angebots-Website für den EFSE'Z Markt Nürnberg (efsez-markt.de).
Keine Online-Bestellung: Produkte werden präsentiert, Anfragen laufen über WhatsApp und Kontaktformular.

## Aufbau

```
frontend/                 Vite + React 19 (Hash-Routing: #/, #/sortiment, #/produkt/:id, #/angebote, #/kontakt, #/personal)
frontend/src/lib/         Datenzugriff (Supabase REST), Formatierung, Öffnungszeiten
frontend/src/admin/       Personalbereich – wird erst beim Aufruf von #/personal nachgeladen
supabase/migrations/      Datenbank-Schema, Zugriffsregeln (RLS), Bilder-Speicher, Startdaten
```

Hosting: Vercel (Projekt `efsez-website`, Root `frontend`). Datenbank, Login und Bilder: Supabase
(Projekt „Efsez“, Region EU/Irland). Es gibt keinen eigenen Server: Die Website liest direkt über die
Supabase-API. Was Besucher sehen und was nur das Personal ändern darf, regeln die RLS-Richtlinien in
`supabase/migrations/`.

## Personalbereich (`#/personal`)

Anmeldung nur mit Zugangscode (intern: Supabase-Login mit fester Adresse `personal@efsez-markt.de`).
Neuen Code setzen: im Supabase-Dashboard unter Authentication → Users beim Nutzer das Passwort ändern.

- **Angebote** – Wochenangebote mit Produkten, Rabatt in %, Angebotspreis; Vorschau im Prospekt-Stil.
  Erscheinen automatisch im Zeitraum (von/bis) oben auf der Startseite.
- **Produkte** – Suche, Filter, Sichtbar/Beliebt per Schalter, Massenänderung, Bearbeiten mit Preis, Foto, Beschreibung.
- **Kategorien** – anlegen, umbenennen, sortieren, Bild, löschen (Produkte wandern in eine andere Kategorie).
- **Anfragen** – Kontaktanfragen der Website.
- **Kassen-Import** – CSV-Export aus der Kasse hochladen. Neue Produkte werden angelegt, bestehende
  (gleicher Barcode) bekommen nur Preis, Kassen-ID und Warengruppe – Name, Bild, Kategorie und Sichtbarkeit
  bleiben. Beliebig oft wiederholbar. Zuordnung Warengruppe → Kategorie: `frontend/src/admin/csv.js`.
- **Einstellungen** – WhatsApp, Telefon, E-Mail, Adresse, Öffnungszeiten, Impressum, Datenschutz.

## Umgebungsvariablen (Vercel)

| Variable | Zweck |
|---|---|
| `VITE_SUPABASE_URL` | `https://<projekt>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | öffentlicher Schlüssel (`sb_publishable_…`) – darf im Browser stehen, Rechte regelt RLS |
| `VITE_STAFF_EMAIL` | optional, Standard `personal@efsez-markt.de` |

## Lokal entwickeln

```bash
cd frontend && npm install
VITE_SUPABASE_URL=… VITE_SUPABASE_ANON_KEY=… npm run dev
```

Datenbank neu aufsetzen: die Dateien in `supabase/migrations/` der Reihe nach ausführen
(Supabase SQL-Editor oder `supabase db push`).
