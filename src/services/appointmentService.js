import { api } from "./api";

export const getAppointments = (config) => api.get("/api/citas", config);
export const getAppointmentsByClient = (idUsuario) => api.get(`/api/citas/cliente/${idUsuario}`);
export const createAppointment = (payload) => api.post("/api/citas", payload);
export const updateAppointmentState = (idCita, estado) => api.put(`/api/citas/${idCita}`, { estado });
