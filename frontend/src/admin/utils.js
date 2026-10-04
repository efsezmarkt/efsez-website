export function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");
}

export function priceInput(value) {
  return value === null || value === undefined ? "" : String(value).replace(".", ",");
}

export function confirmAction(text) {
  return window.confirm(text);
}
