import { useState } from "react";
import { supabase, check } from "./client";
import ProductImage from "../components/ProductImage";
import { Field, ImageField, Toggle } from "./ui";
import { confirmAction } from "./util";

function CategoriesTab({ categories, notify, refresh }) {
  const [form, setForm] = useState(null);
  const [moveTo, setMoveTo] = useState("");

  function open(category) {
    setMoveTo("");
    setForm(
      category
        ? { ...category }
        : { name: "", description: "", image: "", visible: true, sort_order: (categories.at(-1)?.sort_order || 100) + 10 }
    );
  }

  async function save(event) {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image,
      visible: form.visible,
      sort_order: Number(form.sort_order) || 500
    };
    try {
      if (form.id) check(await supabase.from("categories").update(payload).eq("id", form.id));
      else check(await supabase.from("categories").insert(payload));
      notify(form.id ? "Kategorie gespeichert." : "Kategorie angelegt.");
      setForm(null);
      refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  async function remove() {
    const target = categories.find((category) => String(category.id) === moveTo);
    if (!confirmAction(`„${form.name}“ löschen? ${form.total_count || 0} Produkte wandern ${target ? `nach „${target.name}“` : "in „Ohne Kategorie“"}.`)) return;
    try {
      if (target) check(await supabase.from("products").update({ category_id: target.id }).eq("category_id", form.id));
      check(await supabase.from("categories").delete().eq("id", form.id));
      notify("Kategorie gelöscht.");
      setForm(null);
      refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  async function move(index, step) {
    const a = categories[index];
    const b = categories[index + step];
    if (!a || !b) return;
    try {
      const orderA = a.sort_order === b.sort_order ? a.sort_order + step : b.sort_order;
      check(await supabase.from("categories").update({ sort_order: orderA }).eq("id", a.id));
      check(await supabase.from("categories").update({ sort_order: a.sort_order }).eq("id", b.id));
      refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  async function toggle(category, visible) {
    try {
      check(await supabase.from("categories").update({ visible }).eq("id", category.id));
      refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  if (form) {
    return (
      <form className="a-panel" onSubmit={save}>
        <div className="a-panel-head">
          <h2>{form.id ? "Kategorie bearbeiten" : "Neue Kategorie"}</h2>
          <button type="button" className="a-link" onClick={() => setForm(null)}>Zurück zur Liste</button>
        </div>
        <ImageField value={form.image} folder="kategorien" name={form.name} onChange={(path) => setForm({ ...form, image: path })} onMessage={notify} />
        <p className="a-hint">Das Kategoriebild erscheint auch bei Produkten ohne eigenes Foto.</p>
        <div className="a-grid">
          <Field label="Name" wide hint={form.id ? "Beim Umbenennen ziehen alle Produkte automatisch mit." : ""}>
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label="Kurzbeschreibung" wide hint="Wird im Personalbereich angezeigt, z. B. „Ayran, Joghurt, Käse“">
            <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </Field>
        </div>
        <Toggle checked={form.visible} onChange={(value) => setForm({ ...form, visible: value })} label="Auf der Website zeigen" />
        <div className="a-actions">
          <button type="submit" className="a-button">{form.id ? "Speichern" : "Kategorie anlegen"}</button>
        </div>

        {form.id && (
          <details className="a-details is-danger">
            <summary>Kategorie löschen</summary>
            <Field label="Produkte verschieben nach">
              <select value={moveTo} onChange={(event) => setMoveTo(event.target.value)}>
                <option value="">Ohne Kategorie</option>
                {categories.filter((category) => category.id !== form.id).map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </Field>
            <button type="button" className="a-button a-button-danger" onClick={remove}>Kategorie löschen</button>
          </details>
        )}
      </form>
    );
  }

  return (
    <div className="a-stack">
      <div className="a-intro">
        <p>Reihenfolge mit den Pfeilen ändern. Produkte ordnen Sie unter „Produkte“ einer Kategorie zu – auch viele auf einmal.</p>
        <button type="button" className="a-button" onClick={() => open(null)}>Neue Kategorie</button>
      </div>
      <ul className="a-list">
        {categories.map((category, index) => (
          <li key={category.id} className={`a-row a-row-category ${category.visible ? "" : "is-muted"}`}>
            <div className="a-order">
              <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Nach oben">↑</button>
              <button type="button" disabled={index === categories.length - 1} onClick={() => move(index, 1)} aria-label="Nach unten">↓</button>
            </div>
            <button type="button" className="a-row-main" onClick={() => open(category)}>
              <span className="a-thumb">
                <ProductImage src={category.image} name={category.name} variant="letter" />
              </span>
              <span className="a-row-text">
                <strong>{category.name}</strong>
                <small>
                  {category.visible_count} von {category.total_count} auf der Website
                </small>
              </span>
            </button>
            <div className="a-row-toggles">
              <Toggle checked={category.visible} onChange={(value) => toggle(category, value)} label="Website" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CategoriesTab;
