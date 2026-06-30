import logo from "../assets/images/logo.png";

function Header({ currentPage }) {
  const isActive = (page) => currentPage === page || (page === "products" && currentPage === "product");
  const scrollHomeSection = (sectionId) => {
    window.location.hash = "/";
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    }, 40);
  };

  return (
    <header className={`header ${currentPage === "home" ? "" : "header-solid"}`}>
      <a href="#/" className="logo-area">
        <img src={logo} alt="EFSE'Z Markt Logo" />
      </a>

      <nav>
        <ul className="nav-links">
          <li><a className={isActive("home") ? "active" : ""} href="#/">Home</a></li>
          <li><a href="#/" onClick={() => scrollHomeSection("offers")}>Angebote</a></li>
          <li><a className={isActive("products") ? "active" : ""} href="#/products">Produkte</a></li>
          <li><a href="#/" onClick={() => scrollHomeSection("contact")}>Filialen</a></li>
          <li><a href="#/" onClick={() => scrollHomeSection("contact")}>Kontakt</a></li>
          <li><a className={isActive("admin") ? "active" : ""} href="#/admin">Admin</a></li>
        </ul>
      </nav>

      <a href="https://wa.me/490000000000" className="header-whatsapp">
        WhatsApp
      </a>
    </header>
  );
}

export default Header;
