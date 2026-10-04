import { useState } from "react";
import { imageUrl } from "../lib/config";

/**
 * Produktbild. Ohne Foto erscheint ein Regaletikett mit dem Produktnamen
 * (variant="label", optional mit Kategorie als caption), in Karten ein Monogramm (variant="monogram") bzw. in kleinen Vorschaubildern nur der Anfangsbuchstabe (variant="letter").
 */
function ProductImage({ src, name, caption = "", eager = false, variant = "label", className = "" }) {
  const [failed, setFailed] = useState(false);
  const url = imageUrl(src);

  if (!url || failed) {
    if (variant === "monogram") {
      return (
        <span className={`product-monogram ${className}`} role="img" aria-label={name}>
          {(name || "?").trim().charAt(0).toUpperCase()}
        </span>
      );
    }
    return variant === "letter" ? (
      <span className={`product-placeholder ${className}`} role="img" aria-label={name}>
        {(name || "?").trim().charAt(0).toUpperCase()}
      </span>
    ) : (
      <span className={`shelf-label ${caption ? "has-caption" : ""} ${className}`} role="img" aria-label={name}>
        <span className="shelf-label-initial" aria-hidden="true">{(name || "?").trim().charAt(0).toUpperCase()}</span>
        <span className="shelf-label-text">{caption || name}</span>
      </span>
    );
  }

  return (
    <img
      className={className}
      src={url}
      alt={name}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      onError={() => setFailed(true)}
    />
  );
}

export default ProductImage;
