function OffersSection({ offers }) {
  const activeOffers = offers.filter((offer) => offer.active);

  if (activeOffers.length === 0) return null;

  return (
    <section id="offers" className="offers-section">
      <div className="section-header">
        <h2>Aktuelle Angebote</h2>
        <p>Vom Inhaber gepflegt und direkt auf der Website sichtbar.</p>
      </div>

      <div className="offers-grid">
        {activeOffers.map((offer) => (
          <article className="offer-card" key={offer.id}>
            {offer.image && (
              <div className="offer-image">
                <img src={offer.image} alt={offer.title} />
              </div>
            )}
            <div className="offer-content">
              <p className="offer-label">Angebot</p>
              <h3>{offer.title}</h3>
              <p>{offer.description}</p>
              {offer.price && <strong>{offer.price}</strong>}
              {(offer.starts_at || offer.ends_at) && (
                <span>
                  {offer.starts_at || "ab sofort"}
                  {offer.ends_at ? ` bis ${offer.ends_at}` : ""}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default OffersSection;
