import PageHero from "../components/PageHero";
import ContactForm from "../components/ContactForm";
import MarketSection from "../components/MarketSection";

function Contact({ settings }) {
  return (
    <>
      <PageHero
        kicker="Markt & Kontakt"
        title="So erreichen Sie uns"
        text="Kommen Sie vorbei oder schreiben Sie uns – wir antworten meist noch am selben Tag."
        wave={false}
      />

      <MarketSection settings={settings} />

      <section className="section contact-section">
        <div className="wrap contact-layout">
          <div className="contact-intro">
            <p className="kicker">Nachricht</p>
            <h2>Produktwunsch, Partnerschaft oder kurze Frage?</h2>
            <p>
              Sie suchen ein bestimmtes Produkt, planen eine Feier oder möchten uns beliefern? Schreiben Sie uns –
              wir besorgen gern, was im Regal fehlt.
            </p>
          </div>
          <div className="contact-card">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}

export default Contact;
