import { useEffect, useState } from "react";
import { api } from "../api";
import { Field } from "./shared";

const FIELDS = [
  { key: "whatsapp_number", label: "WhatsApp-Nummer", hint: "Mit Vorwahl, z. B. +49 911 1234567. Wird für alle WhatsApp-Buttons genutzt.", inputMode: "tel" },
  { key: "phone", label: "Telefon (Anzeige)", hint: "So wie es auf der Website stehen soll.", inputMode: "tel" },
  { key: "contact_email", label: "E-Mail-Adresse (Anzeige)", hint: "Erscheint im Kontaktbereich und Footer.", type: "email" },
  { key: "notify_email", label: "Anfragen per E-Mail an", hint: "Jede neue Kontaktanfrage wird zusätzlich an diese Adresse geschickt (nur intern sichtbar).", type: "email" },
  { key: "address", label: "Adresse", hint: "Straße, PLZ Ort – wird auch für die Karte genutzt." },
  { key: "opening_hours", label: "Öffnungszeiten", hint: "Eine Zeile pro Eintrag.", multiline: true },
  { key: "instagram", label: "Instagram (Link)", hint: "Optional." },
  { key: "product_count_label", label: "Produktzahl auf der Startseite", hint: "Leer lassen = wird automatisch aus dem Katalog berechnet. Oder z. B. „4.000+“." }
];

function AdminSettings({ token, onMessage, onChanged }) {
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings(token).then(setValues).catch((error) => onMessage(error.message));
  }, [token, onMessage]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      setValues(await api.updateSettings(values, token));
      onMessage("Einstellungen gespeichert.");
      onChanged?.();
    } catch (error) {
      onMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (!values) return <p className="admin-empty">Wird geladen…</p>;

  return (
    <form className="admin-panel" onSubmit={submit}>
      <h3>Markt & Kontakt</h3>
      {FIELDS.map((field) => (
        <Field key={field.key} label={field.label} hint={field.hint}>
          {field.multiline ? (
            <textarea rows={3} value={values[field.key] || ""} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} />
          ) : (
            <input
              type={field.type || "text"}
              inputMode={field.inputMode}
              value={values[field.key] || ""}
              onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
            />
          )}
        </Field>
      ))}
      <div className="admin-actions">
        <button type="submit" disabled={saving}>{saving ? "Speichert…" : "Speichern"}</button>
      </div>
    </form>
  );
}

export default AdminSettings;
