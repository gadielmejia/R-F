import { api } from "./api";

export const getInventory = () => api.get("/api/inventario");
export const getInventorySummary = () => api.get("/api/inventario/summary");
export const getInventoryByState = (estado) => api.get(`/api/inventario/estado/${encodeURIComponent(estado)}`);
export const createInventory = (payload) => api.post("/api/inventario", payload);
export const updateInventory = (id, payload) => api.put(`/api/inventario/${id}`, payload);
export const deleteInventory = (id) => api.delete(`/api/inventario/${id}`);
