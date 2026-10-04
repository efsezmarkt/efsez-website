import { useCallback, useEffect, useRef, useState } from "react";
import ProductImage from "./ProductImage";
import PriceTag from "./PriceTag";
import Icon from "./Icon";
import { basePrice } from "../lib/format";

/**
 * Angebotsfenster im Kopfbereich. Natives Wischen (scroll-snap) statt Touch-Logik –
 * läuft auf jedem Handy flüssig. Pfeile und Punkte für Maus/Tastatur.
 * Wechselt alle 6 s weiter, solange niemand eingreift.
 */
function OfferCarousel({ deals, period }) {
  const track = useRef(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = deals.length;

  const goTo = useCallback((target) => {
    const el = track.current;
    if (!el) return;
    const next = (target + count) % count;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }, [count]);

  useEffect(() => {
    const el = track.current;
    if (!el) return undefined;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (paused || count < 2) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setTimeout(() => goTo(index + 1), 6000);
    return () => window.clearTimeout(timer);
  }, [index, paused, count, goTo]);

  if (!count) return null;

  return (
    <section
      className="offer-carousel"
      aria-roledescription="Karussell"
      aria-label="Angebote"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onFocus={() => setPaused(true)}
    >
      <header className="offer-carousel-head">
        <h2>Angebote</h2>
        {period && <span>{period}</span>}
      </header>

      <div className="offer-carousel-track" ref={track} tabIndex={-1}>
        {deals.map((deal, i) => {
          const base = basePrice(deal.price, deal.unit);
          return (
            <a
              className="offer-slide"
              href={`#/produkt/${deal.productId}`}
              key={deal.id}
              aria-label={`${i + 1} von ${count}: ${deal.name}`}
              aria-hidden={i !== index}
              tabIndex={i === index ? 0 : -1}
            >
              <span className="offer-slide-media">
                <ProductImage src={deal.image} name={deal.name} eager={i === 0} variant="monogram" />
              </span>
              <span className="offer-slide-info">
                <span className="offer-slide-text">
                  <span className="offer-slide-name">{deal.name}</span>
                  <span className="offer-slide-unit">
                    {[deal.unit, deal.note].filter(Boolean).join(", ")}
                    {base && <span className="offer-slide-base">{base}</span>}
                  </span>
                </span>
                <PriceTag price={deal.price} oldPrice={deal.oldPrice} discount={deal.discount} size="xl" label="Aktion" />
              </span>
            </a>
          );
        })}
      </div>

      {count > 1 && (
        <div className="offer-carousel-controls">
          <button type="button" className="offer-carousel-arrow" onClick={() => goTo(index - 1)} aria-label="Vorheriges Angebot">
            <Icon name="left" />
          </button>
          <div className="offer-carousel-dots">
            {deals.map((deal, i) => (
              <button
                type="button"
                key={deal.id}
                className={i === index ? "active" : ""}
                aria-label={`Angebot ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <button type="button" className="offer-carousel-arrow" onClick={() => goTo(index + 1)} aria-label="Nächstes Angebot">
            <Icon name="right" />
          </button>
        </div>
      )}
    </section>
  );
}

export default OfferCarousel;
