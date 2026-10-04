import { useEffect, useState } from "react";
import Icon from "./Icon";
import { whatsappLink } from "../lib/format";

const NAV = [
  { page: "start", href: "#/", label: "Home" },
  { page: "angebote", href: "#/angebote", label: "Angebote" },
  { page: "sortiment", href: "#/sortiment", label: "Sortiment" },
  { page: "kontakt", href: "#/kontakt", label: "Markt & Kontakt" }
];

/**
 * Kopfzeile wie in der ersten Version: auf der Startseite durchsichtig über dem grünen
 * Kopfbereich, beim Scrollen und auf allen Unterseiten in Marktgrün.
 */
function Header({ page, settings }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const wa = whatsappLink(settings, "Hallo EFSE'Z Markt, ");
  const current = page === "produkt" ? "sortiment" : page;

  useEffect(() => {
    // Menü schließen, sobald sich die Seite ändert.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [page]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Jede Seite beginnt mit dem grünen Kopfbereich – oben bleibt die Leiste durchsichtig.
  const overHero = !scrolled && !open;

  return (
    <header className={`site-header ${overHero ? "is-over-hero" : ""} ${open ? "is-open" : ""}`}>
      <a className="skip-link" href="#inhalt">Zum Inhalt</a>
      <div className="site-header-bar">
        <a className="site-logo" href="#/" aria-label="EFSE'Z Markt – Startseite">
          <img src="/assets/images/logo.png" alt="" width="96" height="96" />
        </a>

        <nav className="site-nav" aria-label="Hauptmenü">
          {NAV.map((item) => (
            <a key={item.page} href={item.href} aria-current={current === item.page ? "page" : undefined}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="site-header-actions">
          {wa && (
            <a className="header-whatsapp" href={wa} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" size={18} />
              <span>WhatsApp</span>
            </a>
          )}
          <a className="header-staff" href="#/personal" title="Personalzugang">
            <Icon name="user" size={18} />
            <span>Personal</span>
          </a>
          <button
            type="button"
            className="site-menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Menü schließen" : "Menü öffnen"}
            onClick={() => setOpen((value) => !value)}
          >
            <Icon name={open ? "close" : "menu"} size={22} />
          </button>
        </div>
      </div>

      <nav id="mobile-menu" className="mobile-menu" aria-label="Menü" hidden={!open}>
        {NAV.map((item) => (
          <a key={item.page} href={item.href} aria-current={current === item.page ? "page" : undefined}>
            {item.label}
          </a>
        ))}
        {wa && (
          <a className="btn btn-orange" href={wa} target="_blank" rel="noreferrer">
            <Icon name="whatsapp" /> Per WhatsApp schreiben
          </a>
        )}
        <a className="mobile-menu-staff" href="#/personal">
          <Icon name="user" size={18} /> Personalzugang
        </a>
      </nav>
    </header>
  );
}

export default Header;
