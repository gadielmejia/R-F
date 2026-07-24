import { api } from "./api";

export const getUsers = () => api.get("/api/usuarios");
export const getRoles = () => api.get("/api/roles");
export const createUser = (payload) => api.post("/api/usuarios", payload);
export const updateUser = (id, payload) => api.put(`/api/usuarios/${id}`, payload);
export const deleteUser = (id) => api.delete(`/api/usuarios/${id}`);
