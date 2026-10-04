import ProductImage from "../components/ProductImage";
import PriceTag from "../components/PriceTag";
import { basePrice, offerPeriod } from "../lib/format";
import { imageUrl } from "../lib/config";
import PageHero from "../components/PageHero";

function Offers({ offers, loading }) {
  const withContent = offers.filter((offer) => offer.items.length || offer.image);

  return (
    <>
      <PageHero
        kicker="Wochenangebote"
        title="Unsere Angebote"
        text="Nur im Markt erhältlich, solange der Vorrat reicht."
      />
      <div className="wrap offers-page">
        {loading && !withContent.length && (
          <div className="deal-grid">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="deal-skeleton skeleton" />
            ))}
          </div>
        )}

        {!loading && !withContent.length && (
          <div className="empty-state">
            <h2>Gerade keine Angebote</h2>
            <p>Neue Angebote gibt es meist zum Wochenanfang. Schauen Sie bald wieder vorbei.</p>
            <a className="btn btn-green" href="#/sortiment">
              Zum Sortiment
            </a>
          </div>
        )}

        {withContent.map((offer) => (
          <section className="offer-group" key={offer.id}>
            <header className="offer-group-head">
              <h2>{offer.title}</h2>
              <span>{offerPeriod(offer)}</span>
            </header>
            {offer.note && <p className="offer-group-note">{offer.note}</p>}

            {offer.items.length > 0 ? (
              <div className="deal-grid">
                {offer.items.map((deal) => {
                  const base = basePrice(deal.price, deal.unit);
                  return (
                    <a className="deal" key={deal.id} href={`#/produkt/${deal.productId}`}>
                      <span className="deal-media">
                        <ProductImage src={deal.image} name={deal.name} variant="monogram" />
                      </span>
                      <span className="deal-body">
                        <span className="deal-name">{deal.name}</span>
                        <span className="deal-unit">
                          {[deal.unit, deal.note].filter(Boolean).join(", ")}
                          {base && <span> ({base})</span>}
                        </span>
                      </span>
                      <span className="deal-price">
                        <PriceTag
                          price={deal.price}
                          oldPrice={deal.oldPrice}
                          discount={deal.discount}
                          size="m"
                          label="Aktion"
                        />
                      </span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <img className="offer-group-image" src={imageUrl(offer.image)} alt={offer.title} loading="lazy" />
            )}
          </section>
        ))}
      </div>
    </>
  );
}

export default Offers;
