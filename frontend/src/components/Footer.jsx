import { telLink } from "../lib/format";

function Footer({ settings }) {
  const hours = String(settings.opening_hours || "").split("\n").filter(Boolean);

  return (
    <footer className="site-footer">
      <div className="wrap site-footer-grid">
        <div className="site-footer-brand">
          <strong>EFSE&apos;Z Markt</strong>
          <p>Internationale Lebensmittel für jeden Geschmack – in der Nürnberger Südstadt.</p>
        </div>

        <div>
          <h2>Navigation</h2>
          <a href="#/">Startseite</a>
          <a href="#/angebote">Angebote</a>
          <a href="#/sortiment">Sortiment</a>
          <a href="#/kontakt">Markt & Kontakt</a>
        </div>

        <div>
          <h2>Kontakt</h2>
          <p>{settings.address}</p>
          {settings.phone && <a href={telLink(settings.phone)}>{settings.phone}</a>}
          {settings.contact_email && <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>}
        </div>

        <div>
          <h2>Öffnungszeiten</h2>
          {hours.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>

      <div className="wrap site-footer-legal">
        <span>© {new Date().getFullYear()} EFSE&apos;Z Markt. Alle Rechte vorbehalten.</span>
        <nav aria-label="Rechtliches">
          <a href="#/impressum">Impressum</a>
          <a href="#/datenschutz">Datenschutz</a>
          <a href="#/personal">Personalzugang</a>
        </nav>
      </div>

      <div className="wrap site-footer-powered">
        <a href="https://automaticprocess.de" target="_blank" rel="noopener">
          <span>Powered by</span>
          <img src="/assets/images/automaticprocess.png" alt="" width="18" height="18" loading="lazy" />
          <strong>AutomaticProcess</strong>
        </a>
      </div>
    </footer>
  );
}

export default Footer;
