import { useState } from "react";
import logo from "../assets/images/logo.png";

function Header({ currentPage }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (page) => currentPage === page || (page === "products" && currentPage === "product");

  const scrollHomeSection = (sectionId) => {
    window.location.hash = "/";
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    }, 40);
    setMenuOpen(false);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className={`header ${currentPage === "home" ? "" : "header-solid"} ${menuOpen ? "menu-open" : ""}`}>
      <a href="#/" className="logo-area">
        <img src={logo} alt="EFSE'Z Markt Logo" />
      </a>

      <button
        type="button"
        className="menu-toggle"
        aria-label={menuOpen ? "Menu schliessen" : "Menu offnen"}
        aria-expanded={menuOpen}
        aria-controls="main-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      <div id="main-navigation" className={menuOpen ? "header-menu open" : "header-menu"}>
        <nav className="main-nav">
          <ul className="nav-links">
            <li><a className={isActive("home") ? "active" : ""} href="#/" onClick={closeMenu}>Home</a></li>
            <li><a href="#/" onClick={() => scrollHomeSection("offers")}>Angebote</a></li>
            <li><a className={isActive("products") ? "active" : ""} href="#/products" onClick={closeMenu}>Produkte</a></li>
            <li><a href="#/" onClick={() => scrollHomeSection("contact")}>Filialen</a></li>
            <li><a className={isActive("contact") ? "active" : ""} href="#/contact" onClick={closeMenu}>Kontakt</a></li>
          </ul>
        </nav>

        <div className="header-actions">
          <a href="https://wa.me/490000000000" className="header-whatsapp" onClick={closeMenu}>
            WhatsApp
          </a>
          <a
            className={isActive("admin") ? "staff-access active" : "staff-access"}
            href="#/admin"
            onClick={closeMenu}
            aria-label="Personalzugang"
            title="Personalzugang"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.4 11.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Z" />
              <path d="M3.2 18.8c.35-2.75 2.5-4.7 5.2-4.7 1.45 0 2.7.55 3.62 1.48" />
              <path d="M17.2 13.4v-1.25a2.2 2.2 0 0 0-4.4 0v1.25" />
              <path d="M12 13.4h6.4v5.8H12z" />
            </svg>
            <span>Personalzugang</span>
          </a>
        </div>
      </div>
    </header>
  );
}

export default Header;
