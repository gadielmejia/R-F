import { api } from "./api";

export const getReservations = () => api.get("/api/reservas");
export const getReservationsByClient = (idUsuario) => api.get(`/api/reservas/cliente/${idUsuario}`);
export const createReservation = (payload) => api.post("/api/reservas/crear-con-detalles", payload);
export const updateReservation = (id, payload) => api.put(`/api/reservas/${id}`, payload);
