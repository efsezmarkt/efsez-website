import { useEffect, useRef, useState } from "react";
import ProductImage from "./ProductImage";
import { formatPrice } from "../lib/site";

/**
 * Angebotsfenster im Hero: ein Angebot auf einmal, Pfeile links/rechts, Punkte,
 * auf dem Handy wischbar. Orientiert an der Angebotskarte von werk.am.
 */
function OfferSlider({ items, categoryImages = {}, offerLabel = "" }) {
  const [index, setIndex] = useState(0);
  const touch = useRef({ x: 0, y: 0, active: false });
  const count = items.length;

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (!count) return null;

  const go = (step) => setIndex((current) => (current + step + count) % count);
  const item = items[index];
  const product = { id: item.product_id, name: item.name, image: item.image, category: item.category };
  const hasOld = item.old_price !== null && item.offer_price !== null && item.old_price > item.offer_price;

  function onTouchStart(event) {
    const point = event.touches[0];
    touch.current = { x: point.clientX, y: point.clientY, active: true };
  }

  function onTouchEnd(event) {
    if (!touch.current.active) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - touch.current.x;
    const dy = point.clientY - touch.current.y;
    touch.current.active = false;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  }

  return (
    <div className="offer-slider" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} aria-roledescription="Karussell">
      <div className="offer-slider-head">
        <span className="offer-slider-label">Angebote</span>
        {offerLabel && <span className="offer-slider-period">{offerLabel}</span>}
      </div>

      <a className="offer-slide" href={`#/product/${item.product_id}`} key={item.id}>
        <div className="offer-slide-media">
          <ProductImage product={product} categoryImage={categoryImages[item.category] || ""} />
          {item.discount_percent ? <span className="offer-slide-badge">Aktion -{item.discount_percent} %</span> : null}
        </div>
        <div className="offer-slide-body">
          <strong className="offer-slide-name">{item.name}</strong>
          <small className="offer-slide-meta">
            {[item.unit, item.brand].filter(Boolean).join(" · ") || item.category}
            {item.note ? ` · ${item.note}` : ""}
          </small>
          <div className="offer-slide-prices">
            {item.offer_price !== null ? (
              <>
                <span className="offer-slide-price">{formatPrice(item.offer_price)}</span>
                {hasOld && <s className="offer-slide-old">{formatPrice(item.old_price)}</s>}
              </>
            ) : (
              <span className="offer-slide-price offer-slide-price-text">Im Angebot</span>
            )}
            <span className="offer-slide-link">Ansehen →</span>
          </div>
        </div>
      </a>

      {count > 1 && (
        <>
          <button type="button" className="offer-slider-arrow prev" onClick={() => go(-1)} aria-label="Vorheriges Angebot">
            ‹
          </button>
          <button type="button" className="offer-slider-arrow next" onClick={() => go(1)} aria-label="Nächstes Angebot">
            ›
          </button>
          <div className="offer-slider-dots" role="tablist">
            {items.map((entry, i) => (
              <button
                type="button"
                role="tab"
                key={entry.id}
                aria-selected={i === index}
                aria-label={`Angebot ${i + 1} von ${count}`}
                className={i === index ? "active" : ""}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default OfferSlider;
