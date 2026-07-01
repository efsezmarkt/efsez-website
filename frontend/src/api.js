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

export const api = {
  getProducts: () => request("/products"),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (product, token) => request("/products", { method: "POST", body: product, token }),
  updateProduct: (id, product, token) => request(`/products/${id}`, { method: "PUT", body: product, token }),
  deleteProduct: (id, token) => request(`/products/${id}`, { method: "DELETE", token }),
  getOffers: () => request("/offers"),
  createOffer: (offer, token) => request("/offers", { method: "POST", body: offer, token }),
  updateOffer: (id, offer, token) => request(`/offers/${id}`, { method: "PUT", body: offer, token }),
  deleteOffer: (id, token) => request(`/offers/${id}`, { method: "DELETE", token }),
  submitContactRequest: (payload) => request("/contact", { method: "POST", body: payload }),
  verifyStaffAccess: (token) => request("/admin/session", { method: "POST", body: {}, token })
};
