import { telLink } from "../lib/format";

function Footer({ settings }) {
  const hours = String(settings.opening_hours || "").split("\n").filter(Boolean);

  return (
    <footer className="site-footer">
      <div className="wrap site-footer-grid">
        <div className="site-footer-brand">
          <img src="/assets/images/logo.png" alt="EFSE'Z Markt" width="72" height="72" loading="lazy" />
          <p>Ihr Markt für jeden Geschmack.</p>
        </div>

        <div>
          <h2>Besuchen Sie uns</h2>
          <p>{settings.address}</p>
          {settings.phone && (
            <p>
              <a href={telLink(settings.phone)}>{settings.phone}</a>
            </p>
          )}
          {settings.contact_email && (
            <p>
              <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
            </p>
          )}
        </div>

        <div>
          <h2>Öffnungszeiten</h2>
          {hours.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div>
          <h2>Seiten</h2>
          <p><a href="#/angebote">Angebote</a></p>
          <p><a href="#/sortiment">Sortiment</a></p>
          <p><a href="#/kontakt">Markt & Kontakt</a></p>
        </div>
      </div>

      <div className="wrap site-footer-legal">
        <span>© {new Date().getFullYear()} EFSE'Z Markt</span>
        <a href="#/impressum">Impressum</a>
        <a href="#/datenschutz">Datenschutz</a>
        <a href="#/personal" className="site-footer-staff">Personal</a>
      </div>
    </footer>
  );
}

export default Footer;
