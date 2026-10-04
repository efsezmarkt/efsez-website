import { formatPrice, splitPrice } from "../lib/format";

/**
 * Das Preisschild: schmale, große Ziffern, Cent hochgestellt, alter Preis darüber.
 * size: "xl" (Startseite), "m" (Kacheln), "s" (Listen)
 */
function PriceTag({ price, oldPrice = null, discount = null, size = "m", label = "" }) {
  if (price === null || price === undefined) {
    return label ? (
      <span className={`price-tag price-tag-${size} price-tag-text`}>
        <span className="price-tag-label">{label}</span>
      </span>
    ) : null;
  }

  const { euros, cents } = splitPrice(price);

  return (
    <span className={`price-tag price-tag-${size}`} aria-label={`Preis ${formatPrice(price)}${oldPrice ? `, statt ${formatPrice(oldPrice)}` : ""}`}>
      {discount ? <span className="price-tag-discount">−{discount}%</span> : null}
      {oldPrice ? <s className="price-tag-old">{formatPrice(oldPrice)}</s> : null}
      <span className="price-tag-amount" aria-hidden="true">
        <span className="price-tag-euros">{euros}</span>
        <span className="price-tag-cents">{cents}</span>
      </span>
    </span>
  );
}

export default PriceTag;
