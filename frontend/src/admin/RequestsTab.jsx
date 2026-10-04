import { useCallback, useEffect, useState } from "react";
import { supabase, check } from "./client";
import { confirmAction } from "./util";

function when(value) {
  return new Date(value).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin" });
}

function contactLink(contact) {
  if (/\S+@\S+\.\S+/.test(contact)) return `mailto:${contact}`;
  const digits = contact.replace(/[^\d+]/g, "");
  return digits.length >= 6 ? `tel:${digits}` : "";
}

function RequestsTab({ notify, refresh }) {
  const [rows, setRows] = useState(null);

  const load = useCallback(async () => {
    try {
      setRows(check(await supabase.from("contact_requests").select("*").order("handled").order("created_at", { ascending: false }).limit(300)));
    } catch (error) {
      notify(error.message);
    }
  }, [notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function setHandled(row, handled) {
    try {
      check(await supabase.from("contact_requests").update({ handled }).eq("id", row.id));
      await load();
      refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  async function remove(row) {
    if (!confirmAction("Anfrage löschen?")) return;
    try {
      check(await supabase.from("contact_requests").delete().eq("id", row.id));
      await load();
      refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  if (!rows) return <p className="a-empty">Wird geladen …</p>;
  if (!rows.length) return <p className="a-empty">Noch keine Anfragen über das Kontaktformular.</p>;

  return (
    <ul className="a-requests">
      {rows.map((row) => {
        const link = contactLink(row.contact);
        return (
          <li key={row.id} className={`a-request ${row.handled ? "is-done" : ""}`}>
            <header>
              <span className="a-request-purpose">{row.purpose}</span>
              <time>{when(row.created_at)}</time>
            </header>
            <p className="a-request-from">
              <strong>{row.name || "Ohne Namen"}</strong>{" "}
              {link ? <a href={link}>{row.contact}</a> : row.contact}
            </p>
            <p className="a-request-text">{row.message}</p>
            <footer>
              <button type="button" className="a-button a-button-soft" onClick={() => setHandled(row, !row.handled)}>
                {row.handled ? "Wieder öffnen" : "Erledigt"}
              </button>
              <button type="button" className="a-link" onClick={() => remove(row)}>Löschen</button>
            </footer>
          </li>
        );
      })}
    </ul>
  );
}

export default RequestsTab;
