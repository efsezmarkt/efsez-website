import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

import { sanitizeFileName } from "./utils";

/** Bild-Upload nach Vercel Blob mit lokaler Vorschau. Gibt die fertige URL per onChange zurück. */
export function ImageUploadField({ label, value, folder, token, onChange, onMessage }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const previewUrl = useRef("");

  async function handleFile(file) {
    if (!file) return;
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = URL.createObjectURL(file);
    setPreview(previewUrl.current);

    setUploading(true);
    try {
      const pathname = `efsez/${folder}/${Date.now()}-${sanitizeFileName(file.name)}`;
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/uploads",
        headers: { Authorization: `Bearer ${token}` }
      });
      onChange(blob.url);
      onMessage?.("Bild hochgeladen. Jetzt noch speichern.");
    } catch (error) {
      onMessage?.(error.message || "Bild konnte nicht hochgeladen werden.");
    } finally {
      setUploading(false);
    }
  }

  const shown = preview || value;

  return (
    <div className="upload-field">
      <label className={uploading ? "upload-dropzone is-uploading" : "upload-dropzone"}>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={uploading}
          onChange={(event) => {
            handleFile(event.target.files?.[0] || null);
            event.target.value = "";
          }}
        />
        {shown ? <img className="upload-thumb" src={shown} alt="" /> : <span className="upload-icon" aria-hidden="true">+</span>}
        <span className="upload-copy">
          <strong>{uploading ? "Wird hochgeladen..." : label}</strong>
          <small>{shown ? "Tippen zum Austauschen" : "JPG, PNG, WebP oder GIF bis 8 MB"}</small>
        </span>
      </label>
      {value && (
        <button type="button" className="link-button" onClick={() => { onChange(""); setPreview(""); }}>
          Bild entfernen
        </button>
      )}
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <label className={`admin-toggle ${checked ? "on" : ""}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className="admin-toggle-track" aria-hidden="true"><span /></span>
      {label && <span className="admin-toggle-label">{label}</span>}
    </label>
  );
}
