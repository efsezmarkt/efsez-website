import Icon from "./Icon";
import { mapsLink, telLink, whatsappLink } from "../lib/format";
import { openState } from "../lib/hours";

/** Adresse, Öffnungszeiten, Telefon, WhatsApp – an einer Stelle. */
function StoreInfo({ settings, compact = false }) {
  const status = openState(settings.opening_hours);
  const hours = String(settings.opening_hours || "").split("\n").filter(Boolean);
  const wa = whatsappLink(settings, "Hallo EFSE'Z Markt, ");

  return (
    <div className={`store-info ${compact ? "store-info-compact" : ""}`}>
      {status && (
        <p className={`store-status ${status.open ? "is-open" : ""}`}>
          <span aria-hidden="true" />
          {status.text}
        </p>
      )}

      <dl className="store-facts">
        <div>
          <dt><Icon name="pin" /> Adresse</dt>
          <dd>
            {settings.address}
            <a href={mapsLink(settings.address)} target="_blank" rel="noreferrer">Route planen</a>
          </dd>
        </div>
        <div>
          <dt><Icon name="clock" /> Öffnungszeiten</dt>
          <dd>
            {hours.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </dd>
        </div>
        {settings.phone && (
          <div>
            <dt><Icon name="phone" /> Telefon</dt>
            <dd>
              <a href={telLink(settings.phone)}>{settings.phone}</a>
            </dd>
          </div>
        )}
      </dl>

      {!compact && wa && (
        <a className="btn btn-whatsapp" href={wa} target="_blank" rel="noreferrer">
          <Icon name="whatsapp" /> Per WhatsApp fragen
        </a>
      )}
    </div>
  );
}

export default StoreInfo;
