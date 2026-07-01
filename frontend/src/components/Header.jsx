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

      <nav id="main-navigation" className={menuOpen ? "main-nav open" : "main-nav"}>
        <ul className="nav-links">
          <li><a className={isActive("home") ? "active" : ""} href="#/" onClick={closeMenu}>Home</a></li>
          <li><a href="#/" onClick={() => scrollHomeSection("offers")}>Angebote</a></li>
          <li><a className={isActive("products") ? "active" : ""} href="#/products" onClick={closeMenu}>Produkte</a></li>
          <li><a href="#/" onClick={() => scrollHomeSection("contact")}>Filialen</a></li>
          <li><a href="#/" onClick={() => scrollHomeSection("contact")}>Kontakt</a></li>
        </ul>
      </nav>

      <div className="header-actions">
        <a href="https://wa.me/490000000000" className="header-whatsapp" onClick={closeMenu}>
          WhatsApp
        </a>
        <a className={isActive("admin") ? "staff-access active" : "staff-access"} href="#/admin" onClick={closeMenu}>
          Personalzugang
        </a>
      </div>
    </header>
  );
}

export default Header;
