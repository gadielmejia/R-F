import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import ThemeToggle from "../components/ThemeToggle";
import { downloadQuarterlyReport } from "../services/reportService";
import "../styles/ReportesAdmin.css";

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const maximumYear = 9998;

async function getDownloadError(error) {
  const blob = error.response?.data;
  if (blob instanceof Blob) {
    try {
      const body = JSON.parse(await blob.text());
      if (body.message) return body.message;
    } catch {
      // Fall back to the HTTP error details below.
    }
  }

  return error.response?.status === 403
    ? "Solo un administrador puede descargar reportes."
    : error.response?.status === 401
      ? "Tu sesión expiró. Inicia sesión nuevamente."
      : error.message || "No fue posible generar el reporte.";
}

function ReportesAdmin() {
  const [year, setYear] = useState(String(currentYear));
  const [quarter, setQuarter] = useState(String(Math.floor(currentDate.getMonth() / 3) + 1));
  const [downloading, setDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const downloadReport = async (event) => {
    event.preventDefault();
    const selectedYear = Number(year);
    const selectedQuarter = Number(quarter);
    if (!Number.isInteger(selectedYear) || selectedYear < 1 || selectedYear > maximumYear) {
      setErrorMessage(`Ingresa un año entre 1 y ${maximumYear}.`);
      return;
    }

    setDownloading(true);
    setErrorMessage("");
    try {
      const response = await downloadQuarterlyReport(selectedYear, selectedQuarter);
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_trimestral_${selectedYear}_T${selectedQuarter}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setErrorMessage(await getDownloadError(error));
    } finally {
      setDownloading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <nav className="app-nav">
        <div className="nav-inner">
          <Link to="/dashboardadmin" className="brand">RentStyle</Link>
          <div className="nav-actions">
            <Link to="/admin/productos" className="nav-link">Productos</Link>
            <Link to="/admin/usuarios" className="nav-link">Usuarios</Link>
            <Link to="/admin/inventario" className="nav-link">Inventario</Link>
            <Link to="/admin/reservas" className="dashboard-button">Gestión de reservas</Link>
            <Link to="/admin/reportes" className="nav-link">Reportes trimestrales</Link>
            <ThemeToggle />
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <main className="dashboard-container">
        <div className="dashboard-header">
          <h1>Reportes trimestrales</h1>
          <p>Selecciona un trimestre calendario para descargar el historial y los registros disponibles.</p>
        </div>

        <section className="report-download-card" aria-labelledby="quarterly-report-title">
          <h2 id="quarterly-report-title">Generar reporte Excel</h2>
          <p>El archivo incluye resumen, historial de cambios y registros actuales asociados al período.</p>
          <form className="report-download-form" onSubmit={downloadReport}>
            <label>
              Año
              <input
                type="number"
                min="1"
                max={maximumYear}
                value={year}
                onChange={(event) => setYear(event.target.value)}
                required
              />
            </label>
            <label>
              Trimestre
              <select value={quarter} onChange={(event) => setQuarter(event.target.value)}>
                <option value="1">T1 · Enero–marzo</option>
                <option value="2">T2 · Abril–junio</option>
                <option value="3">T3 · Julio–septiembre</option>
                <option value="4">T4 · Octubre–diciembre</option>
              </select>
            </label>
            <button className="dashboard-button report-download-button" type="submit" disabled={downloading}>
              {downloading ? "Generando..." : "Descargar Excel"}
            </button>
          </form>
          {errorMessage && <p className="report-error" role="alert">{errorMessage}</p>}
          <p className="report-note">
            El historial detallado se conserva desde que se instaló la auditoría; los datos anteriores se muestran
            según las fechas que ya estaban guardadas.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default ReportesAdmin;
