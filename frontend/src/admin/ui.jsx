import { useState } from "react";
import ProductImage from "../components/ProductImage";
import { uploadImage } from "./client";

export function Field({ label, hint, children, wide = false }) {
  return (
    <label className={`a-field ${wide ? "is-wide" : ""}`}>
      <span className="a-field-label">{label}</span>
      {children}
      {hint && <small className="a-field-hint">{hint}</small>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className={`a-toggle ${checked ? "is-on" : ""}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="a-toggle-track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

export function ImageField({ value, folder, onChange, onMessage, name = "" }) {
  const [busy, setBusy] = useState(false);

  async function handle(file) {
    if (!file) return;
    setBusy(true);
    try {
      const path = await uploadImage(file, folder);
      onChange(path);
      onMessage?.("Bild hochgeladen. Zum Übernehmen speichern.");
    } catch (error) {
      onMessage?.(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="a-image">
      <span className="a-image-preview">
        <ProductImage src={value} name={name || "Bild"} variant="letter" />
      </span>
      <div className="a-image-actions">
        <label className="a-button a-button-soft">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            disabled={busy}
            onChange={(event) => {
              handle(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          {busy ? "Lädt hoch …" : value ? "Foto ersetzen" : "Foto aufnehmen oder wählen"}
        </label>
        {value && (
          <button type="button" className="a-link" onClick={() => onChange("")}>
            Bild entfernen
          </button>
        )}
      </div>
    </div>
  );
}
