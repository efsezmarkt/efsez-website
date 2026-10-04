import { useEffect, useState } from "react";
import { supabase, check } from "./client";
import { Field } from "./ui";
import { imprintTemplate, privacyTemplate } from "./legalTemplates";

const FIELDS = [
  { key: "whatsapp_number", label: "WhatsApp-Nummer", hint: "Mit Vorwahl, z. B. 0176 1234567. Ohne Nummer werden die WhatsApp-Knöpfe ausgeblendet.", type: "tel" },
  { key: "phone", label: "Telefon", hint: "So, wie es auf der Website stehen soll.", type: "tel" },
  { key: "contact_email", label: "E-Mail-Adresse", type: "email" },
  { key: "address", label: "Adresse", hint: "Straße, PLZ Ort – wird auch für „Route planen“ genutzt." },
  { key: "opening_hours", label: "Öffnungszeiten", hint: "Eine Zeile pro Eintrag, z. B. „Mo–Sa 08:00–20:00“ und „So geschlossen“. Daraus entsteht „Jetzt geöffnet“.", multiline: 3 },
  { key: "instagram", label: "Instagram-Link", hint: "Optional." }
];

const PRIVATE = new Set(["notify_email"]);

function SettingsTab({ notify, refresh }) {
  const [values, setValues] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from("settings")
      .select("key,value")
      .then(({ data, error }) => {
        if (error) notify(error.message);
        else setValues(Object.fromEntries(data.map((row) => [row.key, row.value])));
      });
  }, [notify]);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const rows = Object.entries(values).map(([key, value]) => ({ key, value: String(value ?? "").trim(), is_public: !PRIVATE.has(key) }));
      check(await supabase.from("settings").upsert(rows));
      notify("Einstellungen gespeichert.");
      refresh();
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (!values) return <p className="a-empty">Wird geladen …</p>;
  const set = (key) => (event) => setValues({ ...values, [key]: event.target.value });

  return (
    <form className="a-panel" onSubmit={save}>
      <h2>Markt & Kontakt</h2>
      <div className="a-grid">
        {FIELDS.map((field) => (
          <Field key={field.key} label={field.label} hint={field.hint} wide={Boolean(field.multiline) || field.key === "address"}>
            {field.multiline ? (
              <textarea rows={field.multiline} value={values[field.key] || ""} onChange={set(field.key)} />
            ) : (
              <input type={field.type || "text"} value={values[field.key] || ""} onChange={set(field.key)} />
            )}
          </Field>
        ))}
      </div>

      <h2>Impressum & Datenschutz</h2>
      <p className="a-hint">
        Die Vorlagen sind ein Entwurf. Ergänzen Sie die Angaben in eckigen Klammern und lassen Sie die Texte vor der
        Veröffentlichung prüfen.
      </p>
      <Field label="Impressum" wide>
        <textarea rows={10} value={values.imprint_text || ""} onChange={set("imprint_text")} />
      </Field>
      {!values.imprint_text && (
        <button type="button" className="a-button a-button-soft" onClick={() => setValues({ ...values, imprint_text: imprintTemplate(values) })}>
          Vorlage für Impressum einfügen
        </button>
      )}
      <Field label="Datenschutzerklärung" wide>
        <textarea rows={14} value={values.privacy_text || ""} onChange={set("privacy_text")} />
      </Field>
      {!values.privacy_text && (
        <button type="button" className="a-button a-button-soft" onClick={() => setValues({ ...values, privacy_text: privacyTemplate(values) })}>
          Vorlage für Datenschutz einfügen
        </button>
      )}

      <div className="a-actions a-actions-sticky">
        <button type="submit" className="a-button" disabled={busy}>{busy ? "Speichert …" : "Speichern"}</button>
      </div>
    </form>
  );
}

export default SettingsTab;
