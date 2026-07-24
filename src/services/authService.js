import { api } from "./api";

export const login = (payload) => api.post("/api/auth/login", payload);
export const getCurrentUser = () => {
  const user = localStorage.getItem("currentUser");
  return user ? JSON.parse(user) : null;
};
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
};
