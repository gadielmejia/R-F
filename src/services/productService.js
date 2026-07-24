import { api } from "./api";

export const getProducts = () => api.get("/api/prendas");
export const createProduct = (payload) => api.post("/api/prendas", payload);
export const updateProduct = (id, payload) => api.put(`/api/prendas/${id}`, payload);
export const deleteProduct = (id) => api.delete(`/api/prendas/${id}`);
