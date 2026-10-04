import { useState } from "react";
import { api } from "../api";
import { Field, ImageUploadField, Toggle } from "./shared";
import { confirmAction } from "./utils";

function AdminCategories({ token, categories, onMessage, onChanged }) {
  const [editing, setEditing] = useState(null); // { id?, name, description, image, sort_order, visible }
  const [moveTarget, setMoveTarget] = useState("");

  function openForm(category) {
    setEditing(
      category
        ? { ...category }
        : { name: "", description: "", image: "", sort_order: (categories.at(-1)?.sort_order || 100) + 10, visible: true }
    );
    setMoveTarget("");
  }

  function update(field, value) {
    setEditing((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    try {
      if (editing.id) await api.updateCategory(editing.id, editing, token);
      else await api.createCategory(editing, token);
      onMessage(editing.id ? "Kategorie gespeichert." : "Kategorie angelegt.");
      setEditing(null);
      onChanged?.();
    } catch (error) {
      onMessage(error.message);
    }
  }

  async function remove() {
    const target = moveTarget || "Sonstiges";
    if (!confirmAction(`Kategorie „${editing.name}“ löschen? ${editing.product_count || 0} Produkte wandern nach „${target}“.`)) return;
    try {
      const result = await api.deleteCategory(editing.id, target, token);
      onMessage(`Kategorie gelöscht, ${result.moved} Produkte nach „${result.moved_to}“ verschoben.`);
      setEditing(null);
      onChanged?.();
    } catch (error) {
      onMessage(error.message);
    }
  }

  async function quickToggle(category, visible) {
    try {
      await api.updateCategory(category.id, { ...category, visible }, token);
      onChanged?.();
    } catch (error) {
      onMessage(error.message);
    }
  }

  async function move(category, direction) {
    const index = categories.findIndex((item) => item.id === category.id);
    const neighbour = categories[index + direction];
    if (!neighbour) return;
    try {
      // Sortierwerte tauschen; bei Gleichstand eindeutig machen.
      const a = category.sort_order;
      const b = neighbour.sort_order === a ? a + direction : neighbour.sort_order;
      await api.updateCategory(category.id, { ...category, sort_order: b }, token);
      await api.updateCategory(neighbour.id, { ...neighbour, sort_order: a }, token);
      onChanged?.();
    } catch (error) {
      onMessage(error.message);
    }
  }

  if (editing) {
    return (
      <form className="admin-panel" onSubmit={submit}>
        <div className="admin-panel-head">
          <h3>{editing.id ? "Kategorie bearbeiten" : "Neue Kategorie"}</h3>
          <button type="button" className="ghost-button" onClick={() => setEditing(null)}>Zurück zur Liste</button>
        </div>

        <Field label="Name *" hint={editing.id ? "Beim Umbenennen ziehen alle Produkte automatisch mit." : ""}>
          <input required value={editing.name} onChange={(event) => update("name", event.target.value)} />
        </Field>
        <Field label="Kurzbeschreibung" hint="Erscheint unter dem Namen auf der Startseite, z. B. „Ayran, Tee, Säfte“.">
          <input value={editing.description} onChange={(event) => update("description", event.target.value)} />
        </Field>
        <ImageUploadField
          label="Kategoriebild"
          value={editing.image}
          folder="kategorien"
          token={token}
          onChange={(url) => update("image", url)}
          onMessage={onMessage}
        />
        <p className="admin-hint">Das Kategoriebild wird auch als Platzhalter für Produkte ohne eigenes Bild genutzt.</p>
        <Toggle checked={editing.visible} onChange={(value) => update("visible", value)} label="Auf der Website anzeigen" />

        <div className="admin-actions">
          <button type="submit">{editing.id ? "Speichern" : "Kategorie anlegen"}</button>
        </div>

        {editing.id && (
          <details className="admin-details danger">
            <summary>Kategorie löschen</summary>
            <p>Produkte dieser Kategorie werden verschoben nach:</p>
            <select value={moveTarget} onChange={(event) => setMoveTarget(event.target.value)}>
              <option value="">Sonstiges</option>
              {categories.filter((category) => category.id !== editing.id).map((category) => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
            <button type="button" className="danger-button" onClick={remove}>Kategorie löschen</button>
          </details>
        )}
      </form>
    );
  }

  return (
    <div className="admin-categories">
      <div className="admin-toolbar">
        <p className="admin-hint">Reihenfolge mit den Pfeilen ändern. Produkte ordnest du im Reiter „Produkte“ einer Kategorie zu.</p>
        <button type="button" onClick={() => openForm(null)}>+ Neue Kategorie</button>
      </div>

      <div className="admin-category-list">
        {categories.map((category, index) => (
          <div className={`admin-category-row ${category.visible ? "" : "is-hidden"}`} key={category.id}>
            <div className="admin-category-order">
              <button type="button" disabled={index === 0} onClick={() => move(category, -1)} aria-label="Nach oben">↑</button>
              <button type="button" disabled={index === categories.length - 1} onClick={() => move(category, 1)} aria-label="Nach unten">↓</button>
            </div>
            <button type="button" className="admin-category-main" onClick={() => openForm(category)}>
              <span className="admin-category-thumb">
                {category.image ? <img src={category.image} alt="" /> : <em>{category.name.charAt(0)}</em>}
              </span>
              <span>
                <strong>{category.name}</strong>
                <small>{category.visible_count ?? 0} sichtbar von {category.product_count ?? 0}{category.description ? ` · ${category.description}` : ""}</small>
              </span>
            </button>
            <Toggle checked={category.visible} onChange={(value) => quickToggle(category, value)} label="Sichtbar" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminCategories;
