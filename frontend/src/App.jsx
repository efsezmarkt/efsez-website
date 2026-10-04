import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Admin from "./pages/Admin";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import { DEFAULT_SETTINGS } from "./lib/site";
import "./styles/header.css";
import "./styles/footer.css";
import "./styles/floatingWhatsApp.css";
import "./styles/offers.css";

function parseRoute(hash) {
  const cleanHash = hash.replace(/^#\/?/, "");
  const [pagePart = "home", id] = cleanHash.split("/");
  const [page, search] = pagePart.split("?");
  return {
    page: page || "home",
    id: id ? Number(id) : null,
    params: new URLSearchParams(search || "")
  };
}

function App() {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [productTotal, setProductTotal] = useState(null);

  const loadSite = useCallback(async () => {
    const results = await Promise.allSettled([
      api.getSettings(),
      api.getCategories(),
      api.getOffers(),
      api.getProducts({ featured: 1, limit: 12 })
    ]);
    const [settingsResult, categoriesResult, offersResult, featuredResult] = results;
    if (settingsResult.status === "fulfilled") setSettings({ ...DEFAULT_SETTINGS, ...settingsResult.value });
    if (categoriesResult.status === "fulfilled") setCategories(categoriesResult.value);
    if (offersResult.status === "fulfilled") setOffers(offersResult.value);
    if (featuredResult.status === "fulfilled") {
      setFeatured(featuredResult.value.items);
    }
    try {
      const all = await api.getProducts({ limit: 1 });
      setProductTotal(all.total);
    } catch {
      setProductTotal(null);
    }
  }, []);

  useEffect(() => {
    function handleHashChange() {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSite();
  }, [loadSite]);

  return (
    <>
      <Header currentPage={route.page} settings={settings} />

      <main>
        {route.page === "products" ? (
          <Products categories={categories} settings={settings} initialCategory={route.params.get("kategorie") || "Alle"} />
        ) : route.page === "product" ? (
          <ProductDetail id={route.id} settings={settings} />
        ) : route.page === "admin" ? (
          <Admin onRefresh={loadSite} />
        ) : route.page === "contact" ? (
          <Contact settings={settings} />
        ) : (
          <Home
            featured={featured}
            offers={offers}
            categories={categories}
            settings={settings}
            productTotal={productTotal}
          />
        )}
      </main>

      <Footer settings={settings} />
      <FloatingWhatsApp settings={settings} />
    </>
  );
}

export default App;
