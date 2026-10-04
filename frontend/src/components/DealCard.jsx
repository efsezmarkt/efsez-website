import ProductImage from "./ProductImage";
import { formatPrice } from "../lib/site";

/** Eine Angebotskachel im Prospekt-Stil: großes Produktbild, Preisfahne, alter Preis durchgestrichen. */
function DealCard({ item, categoryImage = "", compact = false }) {
  const product = { id: item.product_id, name: item.name, image: item.image, category: item.category };
  const hasOld = item.old_price !== null && item.offer_price !== null && item.old_price > item.offer_price;

  return (
    <a className={compact ? "deal deal-compact" : "deal"} href={`#/product/${item.product_id}`}>
      <div className="deal-media">
        <ProductImage product={product} categoryImage={categoryImage} />
        {item.discount_percent ? <span className="deal-badge">-{item.discount_percent}%</span> : null}
        {item.offer_price !== null && (
          <span className="deal-flag">
            {hasOld && <s>{formatPrice(item.old_price)}</s>}
            <strong>{formatPrice(item.offer_price)}</strong>
          </span>
        )}
      </div>
      <div className="deal-body">
        <h3>{item.name}</h3>
        <small>{[item.unit, item.brand].filter(Boolean).join(" · ") || item.category}</small>
        {item.note && <em>{item.note}</em>}
      </div>
    </a>
  );
}

export default DealCard;
