import CategoryGrid from "../components/CategoryGrid";
import FeaturedProducts from "../components/FeaturedProducts";
import ProductCarousel from "../components/ProductCarousel";
import OffersSection from "../components/OffersSection";
import InfoSection from "../components/InfoSection";
import ContactSection from "../components/ContactSection";
import BrandSection from "../components/BrandSection";
import StatsSection from "../components/StatsSection";
import "../styles/brands.css";
import "../styles/contact.css";
import "../styles/stats.css";
import "../styles/categories.css";
import "../styles/products.css";
import "../styles/info.css";

function Home({ products, offers }) {
  const scrollToOffers = () => {
    window.setTimeout(() => {
      document.getElementById("offers")?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  return (
    <>
      <section id="home" className="hero">
        <div className="hero-bg-leaf leaf-1"></div>
        <div className="hero-bg-leaf leaf-2"></div>
        <div className="hero-bg-leaf leaf-3"></div>
        <div className="hero-bg-leaf leaf-4"></div>
        <div className="hero-bg-leaf leaf-5"></div>
        <div className="hero-bg-leaf leaf-6"></div>

        <div className="hero-dots"></div>
        <div className="hero-plant-lines"></div>

        <div className="hero-inner">
          <div className="hero-text">
            <p className="hero-label">EFSE'Z Markt Nurnberg</p>

            <h2>
              International. Frisch.
              <br />
              Direkt um die Ecke.
            </h2>

            <div className="hero-line">
              <span></span>
              <div></div>
            </div>

            <p>
              Lebensmittel, Fleischtheke, Backwaren, Spezialitaten und Wochenangebote:
              alles sichtbar, schnell auffindbar und spater direkt mit Bestand und
              Automationen verbunden.
            </p>

            <div className="hero-buttons">
              <a href="#/products" className="btn-primary">Sortiment ansehen</a>
              <a href="#/" onClick={scrollToOffers} className="btn-secondary">Wochenangebote</a>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-logo-card">
              <img src="/src/assets/images/logo.png" alt="EFSE'Z Markt Logo" />
            </div>
          </div>
        </div>

        <ProductCarousel products={products} />
        <div className="hero-wave"></div>
      </section>

      <OffersSection offers={offers} />
      <StatsSection />
      <CategoryGrid />
      <FeaturedProducts products={products} />
      <BrandSection />
      <InfoSection />
      <ContactSection />
    </>
  );
}

export default Home;
