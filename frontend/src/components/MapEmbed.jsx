import { useState } from "react";
import Icon from "./Icon";
import { mapsLink } from "../lib/format";

/**
 * Google-Maps-Karte mit Zwei-Klick-Lösung: Erst nach „Karte laden“ wird Google kontaktiert
 * (sonst wären IP-Adresse und Cookies schon beim Seitenaufruf bei Google – DSGVO).
 */
function MapEmbed({ address, title = "EFSE'Z Markt" }) {
  const [active, setActive] = useState(false);
  const src = `https://www.google.com/maps?q=${encodeURIComponent(`EFSE'Z Markt, ${address}`)}&z=16&output=embed`;

  return (
    <div className="map-box">
      <div className="map-box-head">
        <strong>{title}</strong>
        <a href={mapsLink(address)} target="_blank" rel="noreferrer">
          Route planen
        </a>
      </div>

      {active ? (
        <iframe title={`Karte: ${title}`} src={src} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
      ) : (
        <div className="map-consent">
          <span className="map-consent-pin" aria-hidden="true">
            <Icon name="pin" size={30} />
          </span>
          <p className="map-consent-address">{address}</p>
          <button type="button" className="btn btn-orange" onClick={() => setActive(true)}>
            Karte laden
          </button>
          <p className="map-consent-note">
            Die Karte kommt von Google Maps. Beim Laden werden Daten wie Ihre IP-Adresse an Google übertragen.{" "}
            <a href="#/datenschutz">Mehr dazu</a>
          </p>
        </div>
      )}
    </div>
  );
}

export default MapEmbed;
