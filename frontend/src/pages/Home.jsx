import OfferCarousel from "../components/OfferCarousel";
import ProductCard from "../components/ProductCard";
import StoreInfo from "../components/StoreInfo";
import ContactForm from "../components/ContactForm";
import Icon from "../components/Icon";
import { loadProducts } from "../lib/db";
import { useCached } from "../lib/useAsync";
import { offerPeriod, whatsappLink } from "../lib/format";

const loadFeatured = () => loadProducts({ featured: true, limit: 8 }).then((result) => result.items);

function Home({ settings, categories, offers }) {
  const featured = useCached("featured", loadFeatured, []);
  const deals = offers.data.flatMap((offer) => offer.items);
  const firstOffer = offers.data.find((offer) => offer.items.length);
  const wa = whatsappLink(settings, "Hallo EFSE'Z Markt, ");

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-offers">
            {deals.length > 0 ? (
              <OfferCarousel deals={deals} period={offerPeriod(firstOffer)} />
            ) : offers.loading ? (
              <div className="offer-carousel offer-carousel-loading skeleton" aria-hidden="true" />
            ) : (
              <div className="hero-logo">
                <img src="/assets/images/logo.png" alt="EFSE'Z Markt – Ihr Markt für jeden Geschmack" width="320" height="320" />
              </div>
            )}
          </div>

          <div className="hero-copy">
            <h1>Ihr Markt für jeden Geschmack.</h1>
            <p className="hero-lead">
              Internationale Lebensmittel, frische Theke und Küche in Nürnberg.
              Stöbern Sie im Sortiment und fragen Sie einfach per WhatsApp nach.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#/sortiment">Sortiment ansehen</a>
              {wa ? (
                <a className="btn btn-ghost" href={wa} target="_blank" rel="noreferrer">
                  <Icon name="whatsapp" /> WhatsApp
                </a>
              ) : (
                <a className="btn btn-ghost" href="#/kontakt">Anfahrt & Kontakt</a>
              )}
            </div>
            <StoreInfo settings={settings} compact />
          </div>
        </div>
      </section>

      {categories.data.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <h2>Sortiment</h2>
              <a href="#/sortiment">Alle Produkte</a>
            </div>
            <ul className="aisle-list">
              {categories.data.map((category) => (
                <li key={category.id}>
                  <a className="aisle" href={`#/sortiment?kategorie=${category.id}`}>
                    <span className="aisle-text">
                      <span className="aisle-name">{category.name}</span>
                      <span className="aisle-count">{category.visible_count} Artikel</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {featured.data.length > 0 && (
        <section className="section section-mist">
          <div className="wrap">
            <div className="section-head">
              <h2>Beliebt bei unseren Kunden</h2>
              <a href="#/sortiment">Mehr entdecken</a>
            </div>
            <div className="product-grid">
              {featured.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section" id="markt">
        <div className="wrap visit-grid">
          <div>
            <h2>So finden Sie uns</h2>
            <StoreInfo settings={settings} />
          </div>
          <div>
            <h2>Schreiben Sie uns</h2>
            <p className="section-lead">Sie suchen ein bestimmtes Produkt oder planen eine Feier? Wir besorgen gern, was im Regal fehlt.</p>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
