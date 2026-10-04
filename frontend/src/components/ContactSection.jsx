import { branch } from "../data/branches";
import { whatsappLink } from "../lib/site";

function ContactSection({ settings }) {
  const address = settings?.address || branch.address;
  const phone = settings?.phone || branch.phone;
  const [street, ...cityParts] = address.split(",").map((part) => part.trim());
  const city = cityParts.join(", ");
  const hours = String(settings?.opening_hours || "").split("\n").filter(Boolean);

  return (
    <section id="contact" className="contact-section">
      <div className="contact-layout">
        <div className="contact-intro">
          <p className="section-label">Markt</p>
          <h2>Fragen zu Produkten oder Verfügbarkeit?</h2>
          <p>
            Kontaktieren Sie uns direkt oder besuchen Sie EFSE&apos;Z Markt vor
            Ort. Für Produktwünsche, Verfügbarkeit und kurze Rückfragen ist
            WhatsApp der schnellste Weg.
          </p>

          <a className="whatsapp-button" href={whatsappLink(settings)}>
            WhatsApp schreiben
          </a>
        </div>

        <div className="branches-area">
          <h2 className="branches-title">So finden Sie uns</h2>

          <div className="branch-cards">
            <div className="branch-card">
              <span className="branch-pin" aria-hidden="true" />
              <h3>{branch.name}</h3>
              <p>{street}</p>
              {city && <p>{city}</p>}
              {phone && <p>Tel.: <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a></p>}
              {settings?.contact_email && <p><a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a></p>}
            </div>
          </div>

          <div className="opening-card">
            <strong>Öffnungszeiten</strong>
            {hours.map((line) => <span key={line}>{line}</span>)}
          </div>
        </div>
      </div>

      <div className="maps-grid maps-single">
        <div className="map-box">
          <h3>{branch.name}</h3>
          <iframe
            title={branch.name}
            src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
            loading="lazy"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
