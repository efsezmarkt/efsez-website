import StoreInfo from "../components/StoreInfo";
import ContactForm from "../components/ContactForm";
import { mapsLink } from "../lib/format";

function Contact({ settings }) {
  return (
    <div className="wrap contact-page">
      <header className="page-head">
        <h1>Markt & Kontakt</h1>
        <p>Kommen Sie vorbei oder schreiben Sie uns – wir antworten meist noch am selben Tag.</p>
      </header>

      <div className="visit-grid">
        <div>
          <StoreInfo settings={settings} />
          <a className="map-card" href={mapsLink(settings.address)} target="_blank" rel="noreferrer">
            <span className="map-card-pin" aria-hidden="true" />
            <strong>{settings.address}</strong>
            <span>In Google Maps öffnen</span>
          </a>
        </div>
        <div>
          <h2>Nachricht senden</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}

export default Contact;
