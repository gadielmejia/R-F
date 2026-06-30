import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { api } from "../utils/api";
import { useTheme } from "../context/ThemeContext";
import "../styles/citas.css";

function CitasUser() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [currentUser, setCurrentUser] = useState(null);
  const [citas, setCitas] = useState([]);
  const [adminId, setAdminId] = useState(null);
  const [servicio, setServicio] = useState("Prueba de Vestido");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [notas, setNotas] = useState("");
  const [toast, setToast] = useState({ show: false, message: "" });
  const [toastTimeoutId, setToastTimeoutId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user) {
      navigate("/login");
      return;
    }
    setCurrentUser(user);
    loadCitas(user);
  }, [navigate]);

  const loadCitas = async (user) => {
    setLoadingData(true);
    try {
      const [citasRes, usuariosRes] = await Promise.all([
        api.get(`/api/citas/cliente/${user.idUsuario}`),
        api.get(`/api/usuarios`),
      ]);

      setCitas(citasRes.data?.data || []);

      const admins = (usuariosRes.data?.data || []).filter(
        (u) => u.idRol === 1 || u.rol_nombre?.toLowerCase() === "admin" || u.role?.toLowerCase() === "admin"
      );
      if (admins.length > 0) {
        setAdminId(admins[0].idUsuario);
      } else {
        setError("No se encontró un administrador disponible para agendar la cita.");
      }
    } catch (err) {
      console.error(err);
      setError("Error cargando citas.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleToggleTheme = () => {
    toggleTheme();
  };

  const showToast = (message) => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    setToast({ show: true, message });
    const timeout = setTimeout(() => setToast({ show: false, message: "" }), 3000);
    setToastTimeoutId(timeout);
  };

  const handleAgendarCita = async (e) => {
    e.preventDefault();
    setError("");

    if (!fecha || !hora) {
      setError("Por favor selecciona fecha y hora.");
      return;
    }
    if (!adminId) {
      setError("No hay administrador disponible para agendar la cita.");
      return;
    }

    setLoading(true);
    try {
      const fecha_cita = `${fecha}T${hora}:00`;
      const motivo = `${servicio}${notas ? ` - ${notas}` : ""}`;
      const response = await api.post("/api/citas", {
        id_cliente: currentUser.idUsuario,
        id_administrador: adminId,
        id_reserva: null,
        fecha_cita,
        motivo,
      });
      const nuevaCita = response.data?.data;
      if (nuevaCita) {
        setCitas((prev) => [nuevaCita, ...prev]);
      }
      setFecha("");
      setHora("");
      setNotas("");
      showToast("¡Cita agendada correctamente!");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al agendar la cita.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  const formatCitaDate = (valor) => {
    if (!valor) return "";
    const fechaObj = new Date(valor);
    return Number.isNaN(fechaObj.getTime()) ? valor : fechaObj.toLocaleDateString();
  };

  const formatCitaTime = (valor) => {
    if (!valor) return "";
    const fechaObj = new Date(valor);
    return Number.isNaN(fechaObj.getTime()) ? valor : fechaObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getEstadoStyle = (estado) => {
    const estilos = {
      Pendiente: { bg: "#FFF3E0", color: "#E65100", border: "1px solid #FFB74D" },
      Atendida: { bg: "#E8F5E9", color: "#1B5E20", border: "1px solid #81C784" },
      Cancelada: { bg: "#FFEBEE", color: "#B71C1C", border: "1px solid #EF5350" },
    };
    return estilos[estado] || { bg: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" };
  };

  return (
    <div className={`citas-page ${theme === "dark" ? "dark" : ""}`}>
      <div className={`apple-notification-toast ${toast.show ? "show" : ""}`}>
        <div className="apple-toast-blur-bg"></div>
        <div className="apple-toast-inner">
          <div className="apple-toast-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div className="apple-toast-info">
            <span className="apple-toast-app-name">RentStyle Citas</span>
            <p className="apple-toast-text">{toast.message}</p>
          </div>
        </div>
      </div>

      <nav className="login-nav">
        <div className="login-nav-inner">
          <h2 className="login-logo">RentStyle</h2>
          <div className="login-nav-links">
            <button className="theme-toggle-nav" onClick={handleToggleTheme} aria-label="Cambiar tema">
              <div className="theme-icon-nav"></div>
            </button>
            <Link to="/dashboarduser">Catálogo</Link>
            <Link to="/cart">Carrito</Link>
            <Link to="/citas" className="active-link">Citas</Link>
            <Link to="/profile">Perfil</Link>
            <button onClick={logout} className="logout-btn-nav">Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <main className="citas-container">
        <section className="citas-card form-section-card">
          <div className="citas-card-header">
            <h2>Agendar Cita</h2>
            <p>Reserva tu espacio para una experiencia personalizada de lujo.</p>
          </div>

          <form onSubmit={handleAgendarCita} className="citas-form">
            <div className="form-group">
              <label htmlFor="servicio">Tipo de Servicio</label>
              <select id="servicio" value={servicio} onChange={(e) => setServicio(e.target.value)}>
                <option value="Prueba de Vestido">Prueba de Vestido (Asesoría de Tallas)</option>
                <option value="Asesoría de Imagen">Asesoría de Imagen Completa</option>
                <option value="Ajustes de Sastrería">Ajustes y Entalles a Medida</option>
                <option value="Devolución / Recogida">Entrega o Devolución de Traje</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fecha">Fecha</label>
                <input type="date" id="fecha" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>

              <div className="form-group">
                <label htmlFor="hora">Hora</label>
                <input type="time" id="hora" value={hora} onChange={(e) => setHora(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notas">Notas Especiales (Opcional)</label>
              <textarea id="notas" placeholder="Cuéntanos qué vestidos tienes en mente o detalles específicos..." value={notas} onChange={(e) => setNotas(e.target.value)} rows="3" />
            </div>

            {error && <p className="field-alert">⚠ {error}</p>}

            <button type="submit" className="submit-cita-btn" disabled={loading}>
              {loading ? "Agendando..." : "Confirmar Reserva"}
            </button>
          </form>
        </section>

        <section className="citas-card list-section-card">
          <div className="citas-card-header">
            <h2>Mis Citas</h2>
            <p>Monitorea y gestiona tus próximas visitas agendadas.</p>
          </div>

          <div className="citas-list">
            {loadingData ? (
              <div className="empty-citas"><p>Cargando citas...</p></div>
            ) : citas.length === 0 ? (
              <div className="empty-citas"><p>No tienes citas programadas en este momento.</p></div>
            ) : (
              citas.map((c) => {
                const estadoStyle = getEstadoStyle(c.estado || "Pendiente");
                return (
                  <div key={c.idCita || c.id} className="cita-item-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div className="cita-item-badge">{c.motivo ? c.motivo.split(" - ")[0] : "Cita"}</div>
                      <span style={{
                        background: estadoStyle.bg,
                        color: estadoStyle.color,
                        border: estadoStyle.border,
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontWeight: "600",
                        fontSize: "0.82rem"
                      }}>
                        {c.estado || "Pendiente"}
                      </span>
                    </div>
                    <div className="cita-item-datetime">
                      <span className="cita-date">📅 {formatCitaDate(c.fecha_cita)}</span>
                      <span className="cita-time">⏰ {formatCitaTime(c.fecha_cita)}</span>
                    </div>
                    <p className="cita-notes">"{c.motivo || "Sin detalles adicionales"}"</p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default CitasUser;
