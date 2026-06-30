import { branches } from "../data/branches";

function ContactSection() {
  return (
    <section id="contact" className="contact-section">
      <div className="contact-layout">
        <div className="contact-intro">
          <p className="section-label">Kontakt</p>
          <h2>Fragen zu Produkten oder Verfügbarkeit?</h2>
          <p>
            Kontaktieren Sie uns gerne direkt oder besuchen Sie uns vor Ort im
            EFSE’Z Markt.
          </p>

          <a className="whatsapp-button" href="https://wa.me/490000000000">
            WhatsApp schreiben
          </a>
        </div>

        <div className="branches-area">
          <h2 className="branches-title">Unsere Filialen</h2>

          <div className="branch-cards">
            {branches.map((branch) => (
              <div className="branch-card" key={branch.id}>
                <h3>{branch.name}</h3>
                <p>{branch.street}</p>
                <p>{branch.city}</p>
                <p>Tel.: {branch.phone}</p>
              </div>
            ))}
          </div>

          <div className="opening-card">
            <strong>Öffnungszeiten</strong>
            <span>Montag - Samstag: 08:00 - 20:00 Uhr</span>
            <span>Sonntag: Geschlossen</span>
          </div>
        </div>
      </div>

      <div className="maps-grid">
        {branches.map((branch) => (
          <div className="map-box" key={branch.id}>
            <h3>{branch.name}</h3>
            <iframe
              title={branch.name}
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                branch.mapQuery
              )}&output=embed`}
              loading="lazy"
              allowFullScreen
            ></iframe>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ContactSection;