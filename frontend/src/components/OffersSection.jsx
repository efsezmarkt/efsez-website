import { useMemo } from "react";
import DealCard from "./DealCard";
import { formatDate } from "../lib/site";

function offerPeriod(offer) {
  if (offer.starts_at && offer.ends_at) return `${formatDate(offer.starts_at)} – ${formatDate(offer.ends_at)}`;
  if (offer.ends_at) return `gültig bis ${formatDate(offer.ends_at)}`;
  if (offer.starts_at) return `ab ${formatDate(offer.starts_at)}`;
  return "solange der Vorrat reicht";
}

/**
 * Angebote wie im Supermarkt-Prospekt: Produktbild groß, Preisfahne, alter Preis rot durchgestrichen.
 * Angebote ohne zugeordnete Produkte (z. B. ein hochgeladenes Bild) werden weiter als Bildkarte gezeigt.
 */
function OffersSection({ offers, categories = [] }) {
  const categoryImages = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.name, category.image])),
    [categories]
  );

  if (!offers.length) return null;

  return (
    <section id="offers" className="offers-section">
      <div className="section-header">
        <p className="section-kicker">Diese Woche</p>
        <h2>Aktuelle Angebote</h2>
        <p>Nur im Markt. Solange der Vorrat reicht. Preise können sich ändern.</p>
      </div>

      {offers.map((offer) => (
        <div className="offer-block" key={offer.id}>
          <div className="offer-block-head">
            <h3>{offer.title}</h3>
            <span>{offerPeriod(offer)}</span>
          </div>
          {offer.description && <p className="offer-block-copy">{offer.description}</p>}

          {offer.items.length > 0 ? (
            <div className="deal-grid">
              {offer.items.map((item) => (
                <DealCard key={item.id} item={item} categoryImage={categoryImages[item.category] || ""} />
              ))}
            </div>
          ) : (
            <article className="offer-card offer-card-single">
              {offer.image && (
                <div className="offer-image">
                  <img src={offer.image} alt={offer.title} />
                </div>
              )}
              <div className="offer-content">
                {offer.price && <strong>{offer.price}</strong>}
              </div>
            </article>
          )}
        </div>
      ))}
    </section>
  );
}

export default OffersSection;
