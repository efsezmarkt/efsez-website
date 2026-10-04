import { Suspense, lazy, useEffect, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import WhatsAppFab from "./components/WhatsAppFab";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Product from "./pages/Product";
import Offers from "./pages/Offers";
import Contact from "./pages/Contact";
import Legal from "./pages/Legal";
import { loadCategories, loadOffers, loadSettings } from "./lib/db";
import { useCached } from "./lib/useAsync";
import { DEFAULT_SETTINGS } from "./lib/format";
import { SUPABASE_URL } from "./lib/config";

// Der Personalbereich (inkl. Login & Bild-Upload) wird nur geladen, wenn man ihn öffnet.
const Staff = lazy(() => import("./admin/Staff"));

const ALIASES = { products: "sortiment", product: "produkt", offers: "angebote", contact: "kontakt", admin: "personal" };

function parseRoute() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [path, search = ""] = raw.split("?");
  const [first = "", second] = path.split("/");
  const page = ALIASES[first] || first || "start";
  return { page, id: second ? Number(second) : null, params: new URLSearchParams(search) };
}

function App() {
  const [route, setRoute] = useState(parseRoute);
  const settings = useCached("settings", loadSettings, {});
  const categories = useCached("categories", loadCategories, []);
  const offers = useCached("offers", loadOffers, []);
  const site = { ...DEFAULT_SETTINGS, ...settings.data };

  useEffect(() => {
    const onChange = () => {
      const next = parseRoute();
      setRoute((current) => {
        if (current.page !== next.page || current.id !== next.id) window.scrollTo(0, 0);
        return next;
      });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  useEffect(() => {
    const titles = {
      start: "EFSE'Z Markt Nürnberg – Internationale Lebensmittel",
      sortiment: "Sortiment – EFSE'Z Markt Nürnberg",
      angebote: "Angebote – EFSE'Z Markt Nürnberg",
      kontakt: "Kontakt & Anfahrt – EFSE'Z Markt Nürnberg",
      impressum: "Impressum – EFSE'Z Markt",
      datenschutz: "Datenschutz – EFSE'Z Markt",
      personal: "Personalbereich – EFSE'Z Markt"
    };
    if (titles[route.page]) document.title = titles[route.page];
  }, [route.page]);

  if (!SUPABASE_URL) {
    return <p style={{ padding: 24 }}>Die Verbindung zur Datenbank ist noch nicht eingerichtet (VITE_SUPABASE_URL fehlt).</p>;
  }

  if (route.page === "personal") {
    return (
      <Suspense fallback={<div className="staff-loading">Personalbereich wird geladen…</div>}>
        <Staff />
      </Suspense>
    );
  }

  let page;
  switch (route.page) {
    case "sortiment":
      page = <Catalog categories={categories.data} categoryId={Number(route.params.get("kategorie")) || null} />;
      break;
    case "produkt":
      page = <Product id={route.id} settings={site} />;
      break;
    case "angebote":
      page = <Offers offers={offers.data} loading={offers.loading} />;
      break;
    case "kontakt":
      page = <Contact settings={site} />;
      break;
    case "impressum":
    case "datenschutz":
      page = <Legal kind={route.page} settings={site} />;
      break;
    default:
      page = <Home settings={site} categories={categories} offers={offers} />;
  }

  return (
    <>
      <Header page={route.page} settings={site} />
      <main id="inhalt">{page}</main>
      <Footer settings={site} />
      <WhatsAppFab settings={site} />
    </>
  );
}

export default App;
