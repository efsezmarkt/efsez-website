import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, check } from "./client";
import { STAFF_EMAIL } from "../lib/config";
import { invalidate } from "../lib/db";
import OffersTab from "./OffersTab";
import ProductsTab from "./ProductsTab";
import CategoriesTab from "./CategoriesTab";
import RequestsTab from "./RequestsTab";
import ImportTab from "./ImportTab";
import SettingsTab from "./SettingsTab";
import "../styles/admin.css";

const TABS = [
  { id: "angebote", label: "Angebote" },
  { id: "produkte", label: "Produkte" },
  { id: "kategorien", label: "Kategorien" },
  { id: "anfragen", label: "Anfragen" },
  { id: "import", label: "Kassen-Import" },
  { id: "einstellungen", label: "Einstellungen" }
];

function Staff() {
  const [session, setSession] = useState(undefined);
  const [isStaff, setIsStaff] = useState(false);
  const [tab, setTab] = useState(() => sessionStorage.getItem("efsez-tab") || "angebote");
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [openRequests, setOpenRequests] = useState(0);
  const timer = useRef(null);

  const notify = useCallback((text) => {
    setMessage(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(""), 5000);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsStaff(false);
      return;
    }
    supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setIsStaff(Boolean(data)));
  }, [session]);

  const refresh = useCallback(async () => {
    invalidate();
    try {
      setCategories(check(await supabase.from("categories_with_counts").select("*").order("sort_order").order("name")));
      const { count } = await supabase.from("contact_requests").select("id", { count: "exact", head: true }).eq("handled", false);
      setOpenRequests(count || 0);
    } catch (error) {
      notify(error.message);
    }
  }, [notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isStaff) refresh();
  }, [isStaff, refresh]);

  useEffect(() => {
    sessionStorage.setItem("efsez-tab", tab);
  }, [tab]);

  if (session === undefined) return <div className="staff-loading">Einen Moment …</div>;
  if (!session) return <Login />;
  if (!isStaff) {
    return (
      <div className="a-login">
        <div className="a-login-card">
          <h1>Kein Personalzugang</h1>
          <p>Dieses Konto ist nicht für den Personalbereich freigeschaltet.</p>
          <button type="button" className="a-button" onClick={() => supabase.auth.signOut()}>Abmelden</button>
        </div>
      </div>
    );
  }

  const shared = { categories, notify, refresh };

  return (
    <div className="a-shell">
      <header className="a-top">
        <a className="a-brand" href="#/">
          <img src="/assets/images/logo.png" alt="" width="36" height="36" />
          <span>Personalbereich</span>
        </a>
        <a className="a-link a-top-site" href="#/" target="_blank" rel="noreferrer">Website ansehen</a>
        <button type="button" className="a-button a-button-soft" onClick={() => supabase.auth.signOut()}>
          Abmelden
        </button>
      </header>

      <nav className="a-tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "is-active" : ""}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            {item.id === "anfragen" && openRequests > 0 && <span className="a-badge">{openRequests}</span>}
          </button>
        ))}
      </nav>

      {message && (
        <div className="a-toast" role="status">
          {message}
        </div>
      )}

      <main className="a-main">
        {tab === "angebote" && <OffersTab {...shared} />}
        {tab === "produkte" && <ProductsTab {...shared} />}
        {tab === "kategorien" && <CategoriesTab {...shared} />}
        {tab === "anfragen" && <RequestsTab {...shared} />}
        {tab === "import" && <ImportTab {...shared} />}
        {tab === "einstellungen" && <SettingsTab {...shared} />}
      </main>
    </div>
  );
}

function Login() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      check(await supabase.auth.signInWithPassword({ email: STAFF_EMAIL, password: code }));
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="a-login">
      <form className="a-login-card" onSubmit={submit}>
        <img src="/assets/images/logo.png" alt="" width="64" height="64" />
        <h1>Personalbereich</h1>
        <p>Angebote, Produkte und Anfragen pflegen.</p>
        <label className="a-field">
          <span className="a-field-label">Zugangscode</span>
          <input
            type="password"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
        </label>
        <button type="submit" className="a-button" disabled={busy}>
          {busy ? "Prüfe …" : "Anmelden"}
        </button>
        {error && <p className="a-error">{error}</p>}
        <a className="a-link" href="#/">Zur Website</a>
      </form>
    </div>
  );
}

export default Staff;
