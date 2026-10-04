import OffersSection from "../components/OffersSection";

/** Alle aktuellen Angebote als Prospekt-Übersicht. */
function Offers({ offers, categories }) {
  return (
    <div className="offers-page">
      {offers.length > 0 ? (
        <OffersSection offers={offers} categories={categories} />
      ) : (
        <section className="offers-section">
          <div className="section-header">
            <p className="section-kicker">Diese Woche</p>
            <h2>Aktuell keine Angebote</h2>
            <p>Schauen Sie bald wieder vorbei oder fragen Sie direkt im Markt.</p>
          </div>
        </section>
      )}
    </div>
  );
}

export default Offers;
