import { useEffect, useState } from "react";
import Icon from "./Icon";
import { whatsappLink } from "../lib/format";

const NAV = [
  { page: "angebote", label: "Angebote" },
  { page: "sortiment", label: "Sortiment" },
  { page: "kontakt", label: "Markt & Kontakt" }
];

function Header({ page, settings }) {
  const [open, setOpen] = useState(false);
  const wa = whatsappLink(settings, "Hallo EFSE'Z Markt, ");

  useEffect(() => {
    // Menü schließen, sobald sich die Seite ändert.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [page]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`site-header ${open ? "is-open" : ""}`}>
      <a className="skip-link" href="#inhalt">Zum Inhalt</a>
      <div className="site-header-bar wrap">
        <a className="site-logo" href="#/" aria-label="EFSE'Z Markt – Startseite">
          <img src="/assets/images/logo.png" alt="" width="48" height="48" />
          <span>
            <strong>EFSE'Z Markt</strong>
            <small>Nürnberg</small>
          </span>
        </a>

        <nav className="site-nav" aria-label="Hauptmenü">
          {NAV.map((item) => (
            <a key={item.page} href={`#/${item.page}`} aria-current={page === item.page ? "page" : undefined}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="site-header-actions">
          <a className="icon-button" href="#/sortiment?suche=1" aria-label="Sortiment durchsuchen">
            <Icon name="search" />
          </a>
          {wa && (
            <a className="btn btn-whatsapp site-header-wa" href={wa} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" />
              <span>WhatsApp</span>
            </a>
          )}
          <button
            type="button"
            className="icon-button site-menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Menü schließen" : "Menü öffnen"}
            onClick={() => setOpen((value) => !value)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>

      <nav id="mobile-menu" className="mobile-menu" aria-label="Menü" hidden={!open}>
        {NAV.map((item) => (
          <a key={item.page} href={`#/${item.page}`} aria-current={page === item.page ? "page" : undefined}>
            {item.label}
          </a>
        ))}
        {wa && (
          <a className="btn btn-whatsapp" href={wa} target="_blank" rel="noreferrer">
            <Icon name="whatsapp" /> Per WhatsApp schreiben
          </a>
        )}
      </nav>
    </header>
  );
}

export default Header;
