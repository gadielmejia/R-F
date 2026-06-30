import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import Footer from "../components/Footer";
import ThemeToggle from "../components/ThemeToggle";

const ESTADO_COLORS = {
  Pendiente: { bg: "#FFF3E0", color: "#E65100" },
  Confirmada: { bg: "#E8F5E9", color: "#1B5E20" },
  Entregada: { bg: "#E3F2FD", color: "#1565C0" },
  Finalizada: { bg: "#F3E5F5", color: "#6A1B9A" },
  Cancelada: { bg: "#FFEBEE", color: "#B71C1C" },
};

function MisReservas() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user || user.role !== "user") { navigate("/login", { replace: true }); return; }
    loadReservas(user.idUsuario);
  }, [navigate]);

  const loadReservas = async (idUsuario) => {
    try {
      const res = await api.get(`/reservas/cliente/${idUsuario}`);
      const data = await res.json();
      setReservas(res.ok ? (data.data || []) : []);
    } catch {
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const cancelarReserva = async (reserva) => {
    const hoy = new Date();
    const inicio = new Date(reserva.fecha_inicio);
    if (inicio <= hoy) {
      alert("No puedes cancelar una reserva que ya inició o ya pasó.");
      return;
    }
    if (!confirm("¿Estás seguro de que deseas cancelar esta reserva?")) return;

    setCancelando(reserva.idReserva);
    try {
      const res = await api.put(`/reservas/${reserva.idReserva}`, { estado: "Cancelada" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setReservas(prev => prev.map(r =>
        r.idReserva === reserva.idReserva ? { ...r, estado: "Cancelada" } : r
      ));
    } catch (err) {
      alert("Error al cancelar: " + err.message);
    } finally {
      setCancelando(null);
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

  return (
    <>
      <nav className="app-nav">
        <div className="nav-inner">
          <Link to="/dashboarduser" className="brand">RentStyle</Link>
          <div className="nav-actions">
            <Link to="/dashboarduser">Catálogo</Link>
            <Link to="/cart">Carrito</Link>
            <Link to="/agendar-cita">Agendar cita</Link>
            <Link to="/profile">Perfil</Link>
            <ThemeToggle />
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Mis Reservas</h1>
          <p>Historial de tus alquileres y reservas realizadas.</p>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", padding: "2rem" }}>Cargando reservas...</p>
        ) : reservas.length === 0 ? (
          <div className="dashboard-card" style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ fontSize: "1.1rem", color: "#6b7280" }}>No tienes reservas aún.</p>
            <Link to="/dashboarduser" className="btn btn-primary" style={{ display: "inline-block", marginTop: "1rem" }}>
              Ver catálogo
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {reservas.map(r => {
              const estilo = ESTADO_COLORS[r.estado] || { bg: "#f3f4f6", color: "#374151" };
              const puedeCancel = r.estado === "Pendiente" && new Date(r.fecha_inicio) > new Date();
              return (
                <div key={r.idReserva} className="dashboard-card" style={{ padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <h3 style={{ margin: "0 0 0.5rem", color: "#1B5E20" }}>
                        Reserva #{r.idReserva}
                      </h3>
                      <p style={{ margin: "0.2rem 0", color: "#374151" }}>
                        <strong>Evento:</strong> {r.fecha_evento}
                      </p>
                      <p style={{ margin: "0.2rem 0", color: "#374151" }}>
                        <strong>Período:</strong> {r.fecha_inicio} → {r.fecha_fin}
                      </p>
                      {r.observaciones && (
                        <p style={{ margin: "0.2rem 0", color: "#6b7280", fontSize: "0.9rem" }}>
                          <strong>Prendas:</strong> {r.observaciones}
                        </p>
                      )}
                      <p style={{ margin: "0.2rem 0", color: "#6b7280", fontSize: "0.85rem" }}>
                        Registrada: {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                      <span style={{
                        background: estilo.bg, color: estilo.color,
                        padding: "4px 14px", borderRadius: "12px",
                        fontWeight: 700, fontSize: "0.85rem"
                      }}>
                        {r.estado}
                      </span>
                      {puedeCancel && (
                        <button
                          className="btn btn-danger"
                          onClick={() => cancelarReserva(r)}
                          disabled={cancelando === r.idReserva}
                          style={{ fontSize: "0.85rem", padding: "6px 14px" }}
                        >
                          {cancelando === r.idReserva ? "Cancelando..." : "Cancelar reserva"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default MisReservas;