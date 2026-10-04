const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000/api" : "/api");

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Die Anfrage ist fehlgeschlagen.");
  return data;
}

function qs(params = {}) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!entries.length) return "";
  return `?${new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString()}`;
}

export const api = {
  // Produkte
  getProducts: (params, token) => request(`/products${qs(params)}`, { token }),
  getProduct: (id, token) => request(`/products/${id}`, { token }),
  createProduct: (product, token) => request("/products", { method: "POST", body: product, token }),
  updateProduct: (id, product, token) => request(`/products/${id}`, { method: "PUT", body: product, token }),
  patchProduct: (id, changes, token) => request(`/products/${id}`, { method: "PATCH", body: changes, token }),
  deleteProduct: (id, token) => request(`/products/${id}`, { method: "DELETE", token }),
  bulkProducts: (payload, token) => request("/admin/bulk", { method: "POST", body: payload, token }),
  importProducts: (rows, visibility, token) => request("/admin/import", { method: "POST", body: { rows, visibility }, token }),

  // Kategorien
  getCategories: (params, token) => request(`/categories${qs(params)}`, { token }),
  createCategory: (category, token) => request("/categories", { method: "POST", body: category, token }),
  updateCategory: (id, category, token) => request(`/categories/${id}`, { method: "PUT", body: category, token }),
  deleteCategory: (id, moveTo, token) => request(`/categories/${id}${qs({ move_to: moveTo })}`, { method: "DELETE", token }),

  // Angebote
  getOffers: (params, token) => request(`/offers${qs(params)}`, { token }),
  createOffer: (offer, token) => request("/offers", { method: "POST", body: offer, token }),
  updateOffer: (id, offer, token) => request(`/offers/${id}`, { method: "PUT", body: offer, token }),
  patchOffer: (id, changes, token) => request(`/offers/${id}`, { method: "PATCH", body: changes, token }),
  deleteOffer: (id, token) => request(`/offers/${id}`, { method: "DELETE", token }),

  // Einstellungen, Kontakt, Anfragen
  getSettings: (token) => request("/settings", { token }),
  updateSettings: (settings, token) => request("/settings", { method: "PUT", body: settings, token }),
  submitContactRequest: (payload) => request("/contact", { method: "POST", body: payload }),
  getRequests: (token) => request("/admin/requests", { token }),
  patchRequest: (id, handled, token) => request("/admin/requests", { method: "PATCH", body: { id, handled }, token }),
  deleteRequest: (id, token) => request("/admin/requests", { method: "DELETE", body: { id }, token }),

  verifyStaffAccess: (token) => request("/admin/session", { method: "POST", body: {}, token })
};
