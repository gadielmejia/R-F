import { api } from "./api";

export const downloadQuarterlyReport = (year, quarter) =>
  api.get("/api/reportes/trimestral/excel", {
    params: { year, quarter },
    responseType: "blob",
  });
