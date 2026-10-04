import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import AdminOffers from "../admin/AdminOffers";
import AdminProducts from "../admin/AdminProducts";
import AdminCategories from "../admin/AdminCategories";
import AdminImport from "../admin/AdminImport";
import AdminRequests from "../admin/AdminRequests";
import AdminSettings from "../admin/AdminSettings";
import "../styles/admin.css";

const TABS = [
  { id: "offers", label: "Angebote" },
  { id: "products", label: "Produkte" },
  { id: "categories", label: "Kategorien" },
  { id: "requests", label: "Anfragen" },
  { id: "import", label: "Kassen-Import" },
  { id: "settings", label: "Einstellungen" }
];

function Admin({ onRefresh }) {
  const [token, setToken] = useState(localStorage.getItem("efsez-admin-token") || "");
  const [accessCode, setAccessCode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(
    sessionStorage.getItem("efsez-staff-access") === "true" && Boolean(localStorage.getItem("efsez-admin-token"))
  );
  const [tab, setTab] = useState(sessionStorage.getItem("efsez-admin-tab") || "offers");
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]);

  const messageTimer = useRef(null);
  const showMessage = useCallback((text) => {
    setMessage(text);
    window.clearTimeout(messageTimer.current);
    messageTimer.current = window.setTimeout(() => setMessage(""), 6000);
  }, []);

  const loadCategories = useCallback(async () => {
    if (!token) return;
    try {
      setCategories(await api.getCategories({ all: 1 }, token));
    } catch (error) {
      showMessage(error.message);
    }
  }, [token, showMessage]);

  useEffect(() => {
    // Kategorien einmal nach dem Login laden (Datenabruf, kein synchroner State).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isUnlocked) loadCategories();
  }, [isUnlocked, loadCategories]);

  useEffect(() => {
    sessionStorage.setItem("efsez-admin-tab", tab);
  }, [tab]);

  async function submitAccess(event) {
    event.preventDefault();
    setMessage("");
    try {
      await api.verifyStaffAccess(accessCode);
      localStorage.setItem("efsez-admin-token", accessCode);
      sessionStorage.setItem("efsez-staff-access", "true");
      setToken(accessCode);
      setIsUnlocked(true);
      setAccessCode("");
    } catch (error) {
      sessionStorage.removeItem("efsez-staff-access");
      setIsUnlocked(false);
      setMessage(error.message);
    }
  }

  function lockAccess() {
    sessionStorage.removeItem("efsez-staff-access");
    localStorage.removeItem("efsez-admin-token");
    setToken("");
    setIsUnlocked(false);
    setMessage("");
  }

  async function changed() {
    await Promise.all([loadCategories(), onRefresh?.()]);
  }

  if (!isUnlocked) {
    return (
      <section id="admin" className="admin-section access-section">
        <form className="access-panel" onSubmit={submitAccess}>
          <p className="admin-kicker">Personalzugang</p>
          <h2>Zugangscode erforderlich</h2>
          <p>Dieser Bereich ist nur für Mitarbeitende. Nach der Anmeldung können Angebote, Produkte, Kategorien und Anfragen gepflegt werden.</p>

          <label>
            Zugangscode
            <input
              type="password"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              placeholder="Code eingeben"
              autoComplete="current-password"
              autoFocus
              required
            />
          </label>

          <button type="submit">Einloggen</button>
          {message && <div className="admin-message access-message">{message}</div>}
        </form>
      </section>
    );
  }

  const shared = { token, categories, onMessage: showMessage, onChanged: changed };

  return (
    <section id="admin" className="admin-section">
      <div className="admin-header">
        <div>
          <p className="admin-kicker">Personalbereich</p>
          <h2>Website pflegen</h2>
        </div>
        <button type="button" className="lock-button" onClick={lockAccess}>Abmelden</button>
      </div>

      <nav className="admin-tabs" role="tablist" aria-label="Bereiche">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "active" : ""}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {message && <div className="admin-message" role="status">{message}</div>}

      <div className="admin-content">
        {tab === "offers" && <AdminOffers {...shared} />}
        {tab === "products" && <AdminProducts {...shared} />}
        {tab === "categories" && <AdminCategories {...shared} />}
        {tab === "requests" && <AdminRequests {...shared} />}
        {tab === "import" && <AdminImport {...shared} />}
        {tab === "settings" && <AdminSettings {...shared} />}
      </div>
    </section>
  );
}

export default Admin;
