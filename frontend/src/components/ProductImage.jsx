/**
 * Produktbild mit Platzhalter: hat das Produkt kein eigenes Bild, wird das Bild der
 * Kategorie gezeigt – und wenn auch das fehlt, eine ruhige Kachel mit Anfangsbuchstaben.
 */
function ProductImage({ product, categoryImage = "", className = "" }) {
  const src = product.image || categoryImage;

  if (src) {
    return <img className={className} src={src} alt={product.name} loading="lazy" />;
  }

  const initial = (product.name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className={`product-placeholder ${className}`} aria-label={product.name} role="img">
      <span>{initial}</span>
      <small>{product.category || "Produkt"}</small>
    </div>
  );
}

export default ProductImage;
