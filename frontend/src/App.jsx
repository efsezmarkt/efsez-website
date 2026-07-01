import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Admin from "./pages/Admin";
import { products as fallbackProducts } from "./data/products";
import "./styles/header.css";
import "./styles/footer.css";
import "./styles/floatingWhatsApp.css";
import "./styles/offers.css";
import FloatingWhatsApp from "./components/FloatingWhatsApp";

function parseRoute(hash) {
  const cleanHash = hash.replace(/^#\/?/, "");
  const [page = "home", id] = cleanHash.split("/");
  return { page: page || "home", id: id ? Number(id) : null };
}

function App() {
  const [products, setProducts] = useState(fallbackProducts);
  const [offers, setOffers] = useState([]);
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  const [status, setStatus] = useState("");

  async function loadData() {
    try {
      const [apiProducts, apiOffers] = await Promise.all([
        api.getProducts(),
        api.getOffers()
      ]);
      setProducts(apiProducts);
      setOffers(apiOffers);
      setStatus("");
    } catch {
      setStatus("");
    }
  }

  useEffect(() => {
    function handleHashChange() {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    // Initial API sync for storefront, admin area, and later automation-driven data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === route.id),
    [products, route.id]
  );

  return (
    <>
      <Header currentPage={route.page} />

      <main>
        {status && <div className="app-status">{status}</div>}

        {route.page === "products" ? (
          <Products products={products} />
        ) : route.page === "product" ? (
          <ProductDetail product={selectedProduct} products={products} />
        ) : route.page === "admin" ? (
          <Admin products={products} offers={offers} onRefresh={loadData} />
        ) : route.page === "contact" ? (
          <Contact />
        ) : (
          <Home products={products} offers={offers} />
        )}
      </main>

      <Footer />
      <FloatingWhatsApp />
    </>
  );
}

export default App;
