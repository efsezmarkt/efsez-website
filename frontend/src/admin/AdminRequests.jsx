import { useEffect, useState } from "react";
import { api } from "../api";
import { confirmAction } from "./utils";

function formatTimestamp(value) {
  try {
    return new Date(value).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return value;
  }
}

function AdminRequests({ token, onMessage }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setRequests(await api.getRequests(token));
    } catch (error) {
      onMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Datenabruf beim Öffnen des Reiters.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function setHandled(request, handled) {
    try {
      const updated = await api.patchRequest(request.id, handled, token);
      setRequests((existing) => existing.map((item) => (item.id === request.id ? updated : item)));
    } catch (error) {
      onMessage(error.message);
    }
  }

  async function remove(request) {
    if (!confirmAction("Anfrage wirklich löschen?")) return;
    try {
      await api.deleteRequest(request.id, token);
      setRequests((existing) => existing.filter((item) => item.id !== request.id));
    } catch (error) {
      onMessage(error.message);
    }
  }

  const open = requests.filter((request) => !request.handled);
  const done = requests.filter((request) => request.handled);

  return (
    <div className="admin-requests">
      <p className="admin-hint">
        Anfragen aus dem Kontaktformular der Website. Offene zuerst. {open.length} offen, {done.length} erledigt.
      </p>
      {loading && <p className="admin-empty">Wird geladen…</p>}
      {!loading && requests.length === 0 && <p className="admin-empty">Noch keine Anfragen.</p>}

      {[...open, ...done].map((request) => (
        <article className={`request-card ${request.handled ? "is-done" : ""}`} key={request.id}>
          <header>
            <span className="request-purpose">{request.purpose}</span>
            <time>{formatTimestamp(request.created_at)}</time>
          </header>
          <p className="request-from">
            {request.name ? <strong>{request.name}</strong> : <strong>Ohne Namen</strong>}
            {" · "}
            {/\S+@\S+\.\S+/.test(request.contact) ? (
              <a href={`mailto:${request.contact}`}>{request.contact}</a>
            ) : /^[\d\s+/()-]{6,}$/.test(request.contact) ? (
              <a href={`tel:${request.contact.replace(/[^\d+]/g, "")}`}>{request.contact}</a>
            ) : (
              request.contact
            )}
          </p>
          <p className="request-message">{request.message}</p>
          <footer>
            <button type="button" onClick={() => setHandled(request, !request.handled)}>
              {request.handled ? "Wieder öffnen" : "Als erledigt markieren"}
            </button>
            <button type="button" className="ghost-button" onClick={() => remove(request)}>Löschen</button>
          </footer>
        </article>
      ))}
    </div>
  );
}

export default AdminRequests;
