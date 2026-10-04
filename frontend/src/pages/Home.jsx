import CategoryGrid from "../components/CategoryGrid";
import FeaturedProducts from "../components/FeaturedProducts";
import ProductCarousel from "../components/ProductCarousel";
import OffersSection from "../components/OffersSection";
import DealCard from "../components/DealCard";
import InfoSection from "../components/InfoSection";
import ContactSection from "../components/ContactSection";
import ContactFormSection from "../components/ContactFormSection";
import BrandSection from "../components/BrandSection";
import StatsSection from "../components/StatsSection";
import "../styles/brands.css";
import "../styles/contact.css";
import "../styles/stats.css";
import "../styles/categories.css";
import "../styles/products.css";
import "../styles/info.css";

function Home({ featured, offers, categories, settings, productTotal }) {
  const scrollToOffers = () => {
    window.setTimeout(() => {
      document.getElementById("offers")?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  // Die ersten zwei Angebotspositionen wandern als Blickfang in den Hero.
  const allDeals = offers.flatMap((offer) => offer.items);
  const heroDeals = [...allDeals.filter((item) => item.offer_price !== null), ...allDeals.filter((item) => item.offer_price === null)].slice(0, 2);
  const categoryImages = Object.fromEntries(categories.map((category) => [category.name, category.image]));

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
            <p className="hero-eyebrow">EFSE&apos;Z Markt Nürnberg</p>
            <h2>
              International frisch.
              <span>Direkt um die Ecke.</span>
            </h2>

            <div className="hero-line">
              <span></span>
              <div></div>
            </div>

            <p>
              Internationale Lebensmittel, frische Thekenprodukte, Backwaren und
              Wochenangebote in einem Markt, der vertraut wirkt und trotzdem
              jeden Einkauf ein bisschen besonderer macht.
            </p>

            <div className="hero-badges" aria-label="Sortimentsbereiche">
              <span>Frische Theke</span>
              <span>Internationale Marken</span>
              <span>Wochenangebote</span>
            </div>

            <div className="hero-buttons">
              <a href="#/products" className="btn-primary">Sortiment ansehen</a>
              {offers.length > 0 && (
                <a href="#/" onClick={scrollToOffers} className="btn-secondary">Wochenangebote</a>
              )}
            </div>
          </div>

          <div className="hero-visual">
            {heroDeals.length > 0 ? (
              <div className="hero-deals">
                <div className="hero-deals-title">
                  <span>Angebot der Woche</span>
                  <a href="#/" onClick={scrollToOffers}>Alle Angebote</a>
                </div>
                {heroDeals.map((item) => (
                  <DealCard key={item.id} item={item} categoryImage={categoryImages[item.category] || ""} compact />
                ))}
              </div>
            ) : (
              <>
                <div className="hero-logo-card">
                  <img src="/assets/images/logo.png" alt="EFSE'Z Markt Logo" />
                </div>
                <div className="hero-assortment-note">
                  <span>Heute im Regal</span>
                  <strong>Tee, Sucuk, Oliven, Baklava</strong>
                </div>
              </>
            )}
          </div>
        </div>

        <ProductCarousel products={featured} />
        <div className="hero-wave"></div>
      </section>

      <OffersSection offers={offers} categories={categories} />
      <StatsSection productTotal={productTotal} settings={settings} />
      <CategoryGrid categories={categories} />
      <FeaturedProducts products={featured} categories={categories} settings={settings} />
      <BrandSection />
      <InfoSection />
      <ContactFormSection />
      <ContactSection settings={settings} />
    </>
  );
}

export default Home;
