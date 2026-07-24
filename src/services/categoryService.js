import { api } from "./api";

export const getCategories = () => api.get("/api/categorias");
