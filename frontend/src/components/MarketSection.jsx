import Icon from "./Icon";
import MapEmbed from "./MapEmbed";
import { telLink, whatsappLink } from "../lib/format";
import { openState } from "../lib/hours";

/** Dunkelgrüner Block „So finden Sie uns“: Adresse, Öffnungszeiten, Karte. */
function MarketSection({ settings, headingLevel = "h2" }) {
  const Heading = headingLevel;
  const status = openState(settings.opening_hours);
  const hours = String(settings.opening_hours || "").split("\n").filter(Boolean);
  const [street, ...rest] = String(settings.address || "").split(",").map((part) => part.trim());
  const city = rest.join(", ");
  const wa = whatsappLink(settings, "Hallo EFSE'Z Markt, ");

  return (
    <section id="markt" className="market-section">
      <div className="wrap">
        <div className="market-layout">
          <div className="market-intro">
            <p className="kicker kicker-light">Markt</p>
            <Heading>Fragen zu Produkten oder Verfügbarkeit?</Heading>
            <p>
              Besuchen Sie uns in der Nürnberger Südstadt oder melden Sie sich vorab. Für Produktwünsche,
              Verfügbarkeit und Vorbestellungen ist WhatsApp der schnellste Weg.
            </p>
            <div className="market-actions">
              {wa && (
                <a className="btn btn-light" href={wa} target="_blank" rel="noreferrer">
                  <Icon name="whatsapp" /> WhatsApp schreiben
                </a>
              )}
              {settings.phone && (
                <a className="btn btn-outline-light" href={telLink(settings.phone)}>
                  <Icon name="phone" /> {settings.phone}
                </a>
              )}
            </div>
          </div>

          <div className="market-cards">
            <div className="market-card">
              <span className="market-card-pin" aria-hidden="true">
                <Icon name="pin" size={22} />
              </span>
              <h3>EFSE&apos;Z Markt</h3>
              <p>{street}</p>
              {city && <p>{city}</p>}
              {settings.phone && (
                <p>
                  Tel.: <a href={telLink(settings.phone)}>{settings.phone}</a>
                </p>
              )}
              {settings.contact_email && (
                <p>
                  <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
                </p>
              )}
            </div>

            <div className="market-card market-hours">
              <h3>Öffnungszeiten</h3>
              {hours.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {status && (
                <p className={`open-status ${status.open ? "is-open" : ""}`}>
                  <span aria-hidden="true" />
                  {status.text}
                </p>
              )}
            </div>
          </div>
        </div>

        <MapEmbed address={settings.address} />
      </div>
    </section>
  );
}

export default MarketSection;
