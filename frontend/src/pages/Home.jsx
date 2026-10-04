import OfferCarousel from "../components/OfferCarousel";
import ProductCard from "../components/ProductCard";
import ProductImage from "../components/ProductImage";
import ContactForm from "../components/ContactForm";
import MarketSection from "../components/MarketSection";
import Icon from "../components/Icon";
import { loadProducts } from "../lib/db";
import { useCached } from "../lib/useAsync";
import { offerPeriod, whatsappLink } from "../lib/format";
import { openState } from "../lib/hours";

const loadFeatured = () => loadProducts({ featured: true, limit: 8 }).then((result) => result.items);

const BRANDS = ["Çaykur", "Ülker", "Torku", "Sera", "Yayla", "Bağdat", "Koska", "Duru"];

const HIGHLIGHTS = [
  {
    icon: "basket",
    title: "Großes Sortiment",
    text: "Internationale Lebensmittel, Gewürze, Süßwaren, Getränke und Produkte für den täglichen Bedarf."
  },
  {
    icon: "tag",
    title: "Preise vorab sehen",
    text: "Der Online-Katalog zeigt unser Sortiment mit Preisen – zum Stöbern und Planen, ohne Online-Bestellung."
  },
  {
    icon: "whatsapp",
    title: "Direkter Kontakt",
    text: "Produktwünsche, Verfügbarkeit oder Bestellungen für Feiern klären Sie schnell per WhatsApp oder Telefon."
  }
];

/** „Mo–Sa 08:00–20:00“ → { days: "Mo–Sa", time: "08:00–20:00" } */
function splitHours(text) {
  const first = String(text || "").split("\n")[0] || "";
  const match = first.match(/^([^\d]+?)\s*(\d.*)$/);
  return match ? { days: match[1].replace(/[:,]$/, "").trim(), time: match[2].trim() } : { days: first, time: "" };
}

function Home({ settings, categories, offers }) {
  const featured = useCached("featured", loadFeatured, []);
  const deals = offers.data.flatMap((offer) => offer.items);
  const firstOffer = offers.data.find((offer) => offer.items.length);
  const wa = whatsappLink(settings, "Hallo EFSE'Z Markt, ");
  const status = openState(settings.opening_hours);
  const hours = splitHours(settings.opening_hours);
  const productCount = categories.data.reduce((sum, category) => sum + (category.visible_count || 0), 0);
  const [street] = String(settings.address || "").split(",");

  const facts = [
    productCount > 0 && { value: productCount.toLocaleString("de-DE"), label: "Artikel", note: "im Online-Sortiment" },
    hours.days && { value: hours.days, label: hours.time ? `${hours.time} Uhr` : "geöffnet", note: "für Sie da" },
    wa
      ? { value: "WhatsApp", label: "Fragen & vorbestellen", note: "Antwort meist am selben Tag" }
      : settings.phone && { value: "Telefon", label: settings.phone, note: "Fragen & vorbestellen" },
    { value: "Südstadt", label: street, note: "Nürnberg" }
  ].filter(Boolean);

  return (
    <>
      <section className="hero">
        <div className="hero-leaf leaf-1" aria-hidden="true" />
        <div className="hero-leaf leaf-2" aria-hidden="true" />
        <div className="hero-leaf leaf-3" aria-hidden="true" />
        <div className="hero-leaf leaf-4" aria-hidden="true" />
        <div className="hero-leaf leaf-5" aria-hidden="true" />
        <div className="hero-leaf leaf-6" aria-hidden="true" />
        <div className="hero-dots" aria-hidden="true" />
        <div className="hero-plant-lines" aria-hidden="true" />

        <div className="wrap hero-inner">
          <div className="hero-text">
            <p className="kicker">EFSE&apos;Z Markt Nürnberg</p>
            <h1>
              International frisch.
              <span>Direkt um die Ecke.</span>
            </h1>
            <div className="hero-line" aria-hidden="true">
              <span />
              <i />
            </div>
            <p className="hero-lead">
              Internationale Lebensmittel, frische Theke, Backwaren und Wochenangebote – in einem Markt, der vertraut
              wirkt und jeden Einkauf ein bisschen besonderer macht.
            </p>
            <ul className="hero-badges" aria-label="Sortimentsbereiche">
              <li>Frische Theke</li>
              <li>Internationale Marken</li>
              <li>Wochenangebote</li>
            </ul>
            <div className="hero-buttons">
              <a className="btn btn-orange btn-lg" href="#/sortiment">
                Sortiment ansehen
              </a>
              {deals.length > 0 ? (
                <a className="btn btn-glass btn-lg" href="#/angebote">
                  Alle Angebote
                </a>
              ) : (
                <a className="btn btn-glass btn-lg" href="#/kontakt">
                  Anfahrt & Kontakt
                </a>
              )}
            </div>
            {status && (
              <p className={`hero-status open-status ${status.open ? "is-open" : ""}`}>
                <span aria-hidden="true" />
                {status.text}
              </p>
            )}
          </div>

          <div className={`hero-visual ${deals.length ? "has-offers" : ""}`}>
            {deals.length > 0 ? (
              <OfferCarousel deals={deals} period={offerPeriod(firstOffer)} />
            ) : offers.loading ? (
              <div className="offer-carousel offer-carousel-loading" aria-hidden="true">
                <div className="skeleton" />
              </div>
            ) : (
              <div className="hero-logo-card">
                <img src="/assets/images/logo.png" alt="EFSE'Z Markt – Ihr Markt für jeden Geschmack" width="360" height="360" />
              </div>
            )}
          </div>
        </div>

        <div className="hero-wave" aria-hidden="true" />
      </section>

      {facts.length > 0 && (
        <section className="facts" aria-label="Auf einen Blick">
          <div className="wrap facts-grid">
            {facts.map((fact) => (
              <div className="fact-card" key={fact.value}>
                <strong>{fact.value}</strong>
                <span>{fact.label}</span>
                <small>{fact.note}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {categories.data.length > 0 && (
        <section className="section">
          <div className="wrap">
            <header className="section-header">
              <p className="kicker">Sortiment</p>
              <h2>Unsere Kategorien</h2>
              <p>Alles auf einen Blick, so sortiert wie im Markt.</p>
            </header>
            <ul className="category-grid">
              {categories.data.map((category) => (
                <li key={category.id}>
                  <a className="category-tile" href={`#/sortiment?kategorie=${category.id}`}>
                    <span className="category-tile-media">
                      <ProductImage src={category.image} name={category.name} variant="monogram" />
                    </span>
                    <span className="category-tile-body">
                      <span className="category-tile-name">{category.name}</span>
                      <span className="category-tile-count">{category.visible_count} Artikel</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {featured.data.length > 0 && (
        <section className="section section-warm">
          <div className="wrap">
            <header className="section-header">
              <p className="kicker">Auswahl aus dem Regal</p>
              <h2>Beliebte Produkte</h2>
              <p>Was bei unseren Kundinnen und Kunden regelmäßig im Korb landet.</p>
            </header>
            <div className="product-grid">
              {featured.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="section-cta">
              <a className="btn btn-green" href="#/sortiment">
                Ganzes Sortiment ansehen
              </a>
            </div>
          </div>
        </section>
      )}

      <section className="section brand-section">
        <div className="wrap">
          <header className="section-header">
            <p className="kicker">Regalmarken</p>
            <h2>Beliebte Marken</h2>
            <p>Bekannte Marken aus unserem Sortiment, von Tee bis Frühstück.</p>
          </header>
          <ul className="brand-strip">
            {BRANDS.map((brand) => (
              <li key={brand}>
                <a href={`#/sortiment?suche=${encodeURIComponent(brand)}`}>{brand}</a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section info-section">
        <div className="wrap">
          <p className="kicker">EFSE&apos;Z Markt</p>
          <h2>Ihr internationaler Markt mit großer Auswahl.</h2>
          <p className="info-lead">
            Bei EFSE&apos;Z finden Sie internationale Lebensmittel, frische Thekenprodukte, Getränke, Süßwaren und
            Produkte des täglichen Bedarfs – nahbar, gut sortiert und einfach zu erreichen.
          </p>
          <div className="info-boxes">
            {HIGHLIGHTS.map((item) => (
              <div className="info-box" key={item.title}>
                <span className="info-icon" aria-hidden="true">
                  <Icon name={item.icon} size={22} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section contact-section" id="kontakt">
        <div className="wrap contact-layout">
          <div className="contact-intro">
            <p className="kicker">Kontakt</p>
            <h2>Produktwunsch, Partnerschaft oder kurze Frage?</h2>
            <p>
              Für Produktanfragen, Bestellungen für Feiern, Lieferanten oder allgemeine Anliegen erreichen Sie uns
              direkt über dieses Formular. Wir melden uns so schnell wie möglich.
            </p>
          </div>
          <div className="contact-card">
            <ContactForm />
          </div>
        </div>
      </section>

      <MarketSection settings={settings} />
    </>
  );
}

export default Home;
