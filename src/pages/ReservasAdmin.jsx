import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import Footer from "../components/Footer";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/Dashboardad.css";

const ESTADOS = ["Pendiente", "Confirmada", "Entregada", "Finalizada", "Cancelada"];
const ESTADO_COLORS = {
  Pendiente: { bg: "#FFF3E0", color: "#E65100" },
  Confirmada: { bg: "#E8F5E9", color: "#1B5E20" },
  Entregada: { bg: "#E3F2FD", color: "#1565C0" },
  Finalizada: { bg: "#F3E5F5", color: "#6A1B9A" },
  Cancelada: { bg: "#FFEBEE", color: "#B71C1C" },
};

function ReservasAdmin() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReserva, setEditingReserva] = useState(null);
  const [filterEstado, setFilterEstado] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("reservas");
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user || user.role !== "admin") { navigate("/login", { replace: true }); return; }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [resRes, citasRes] = await Promise.all([
        api.get("/api/reservas"),
        api.get("/api/citas"),
      ]);
      setReservas(resRes.data?.data || []);
      setCitas(citasRes.data?.data || []);
    } catch (err) {
      console.error(err);
      setError("Error cargando datos.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEstado = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await api.put(`/api/reservas/${editingReserva.idReserva}`, {
        estado: editingReserva.estado,
        observaciones: editingReserva.observaciones,
        fecha_devolucion: editingReserva.fecha_devolucion || null,
      });
      const updatedReserva = response.data?.data;
      setReservas(prev => prev.map(r =>
        r.idReserva === editingReserva.idReserva ? updatedReserva : r
      ));
      setEditingReserva(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error actualizando reserva.");
    }
  };

  const handleUpdateCita = async (idCita, nuevoEstado) => {
    try {
      const response = await api.put(`/api/citas/${idCita}`, { estado: nuevoEstado });
      const updatedCita = response.data?.data;
      setCitas(prev => prev.map(c => c.idCita === idCita ? updatedCita : c));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error actualizando cita.");
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login", { replace: true }); };

  const filteredReservas = reservas.filter(r => {
    const matchEstado = filterEstado ? r.estado === filterEstado : true;
    const matchSearch = search
      ? String(r.idReserva).includes(search) || r.observaciones?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchEstado && matchSearch;
  });

  const stats = {
    total: reservas.length,
    pendientes: reservas.filter(r => r.estado === "Pendiente").length,
    confirmadas: reservas.filter(r => r.estado === "Confirmada").length,
    finalizadas: reservas.filter(r => r.estado === "Finalizada").length,
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
            <ThemeToggle />
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Gestión de Reservas</h1>
          <p>Supervisa, aprueba y gestiona todas las reservas del sistema.</p>
        </div>

        {error && <p className="field-alert">⚠ {error}</p>}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card"><h3>Total</h3><p>{stats.total}</p></div>
          <div className="stat-card"><h3>Pendientes</h3><p style={{ color: "#E65100" }}>{stats.pendientes}</p></div>
          <div className="stat-card"><h3>Confirmadas</h3><p style={{ color: "#1B5E20" }}>{stats.confirmadas}</p></div>
          <div className="stat-card"><h3>Finalizadas</h3><p style={{ color: "#6A1B9A" }}>{stats.finalizadas}</p></div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          {["reservas", "citas"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 20px", borderRadius: "8px", border: "none",
                background: activeTab === tab ? "#1B5E20" : "#e5e7eb",
                color: activeTab === tab ? "#fff" : "#374151",
                fontWeight: 600, cursor: "pointer"
              }}>
              {tab === "reservas" ? "Reservas" : "Citas"}
            </button>
          ))}
        </div>

        {activeTab === "reservas" && (
          <div className="dashboard-card">
            <h2>Reservas</h2>
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <input type="text" placeholder="Buscar por # o prendas..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ flex: "1 1 200px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }} />
              <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#fff" }}>
                <option value="">Todos los estados</option>
                {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {loading ? <p>Cargando...</p> : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cliente ID</th>
                    <th>Evento</th>
                    <th>Período</th>
                    <th>Prendas</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservas.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: "center" }}>No hay reservas.</td></tr>
                  ) : filteredReservas.map(r => {
                    const estilo = ESTADO_COLORS[r.estado] || { bg: "#f3f4f6", color: "#374151" };
                    return (
                      <tr key={r.idReserva}>
                        <td><strong>#{r.idReserva}</strong></td>
                        <td>Usuario #{r.id_cliente}</td>
                        <td>{r.fecha_evento}</td>
                        <td style={{ fontSize: "0.82rem" }}>{r.fecha_inicio}<br/>→ {r.fecha_fin}</td>
                        <td style={{ fontSize: "0.82rem", maxWidth: "150px" }}>{r.observaciones || "—"}</td>
                        <td>
                          <span style={{ background: estilo.bg, color: estilo.color,
                            padding: "2px 10px", borderRadius: "10px", fontWeight: 600, fontSize: "0.82rem" }}>
                            {r.estado}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-secondary"
                            onClick={() => setEditingReserva({ ...r })}
                            style={{ fontSize: "0.82rem", padding: "4px 10px" }}>
                            Gestionar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "citas" && (
          <div className="dashboard-card">
            <h2>Citas agendadas</h2>
            {loading ? <p>Cargando...</p> : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cliente ID</th>
                    <th>Fecha y hora</th>
                    <th>Motivo</th>
                    <th>Reserva</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {citas.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: "center" }}>No hay citas.</td></tr>
                  ) : citas.map(c => {
                    const estilo = ESTADO_COLORS[c.estado] || { bg: "#f3f4f6", color: "#374151" };
                    return (
                      <tr key={c.idCita}>
                        <td>#{c.idCita}</td>
                        <td>Usuario #{c.id_cliente}</td>
                        <td style={{ fontSize: "0.82rem" }}>{new Date(c.fecha_cita).toLocaleString()}</td>
                        <td>{c.motivo || "—"}</td>
                        <td>{c.id_reserva ? `#${c.id_reserva}` : "—"}</td>
                        <td>
                          <span style={{ background: estilo.bg, color: estilo.color,
                            padding: "2px 10px", borderRadius: "10px", fontWeight: 600, fontSize: "0.82rem" }}>
                            {c.estado}
                          </span>
                        </td>
                        <td style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {c.estado === "Pendiente" && (
                            <>
                              <button className="btn btn-primary"
                                onClick={() => handleUpdateCita(c.idCita, "Atendida")}
                                style={{ fontSize: "0.78rem", padding: "3px 8px" }}>
                                Atendida
                              </button>
                              <button className="btn btn-danger"
                                onClick={() => handleUpdateCita(c.idCita, "Cancelada")}
                                style={{ fontSize: "0.78rem", padding: "3px 8px" }}>
                                Cancelar
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Modal gestionar reserva */}
        {editingReserva && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Gestionar Reserva #{editingReserva.idReserva}</h2>
              <form className="form-container" onSubmit={handleUpdateEstado}>
                <div>
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>Estado</label>
                  <select value={editingReserva.estado}
                    onChange={e => setEditingReserva({ ...editingReserva, estado: e.target.value })}
                    className="role-select">
                    {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {editingReserva.estado === "Finalizada" && (
                  <div>
                    <label style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
                      Fecha de devolución
                    </label>
                    <input type="date"
                      value={editingReserva.fecha_devolucion || ""}
                      onChange={e => setEditingReserva({ ...editingReserva, fecha_devolucion: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }} />
                  </div>
                )}
                <div>
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>Observaciones</label>
                  <textarea value={editingReserva.observaciones || ""}
                    onChange={e => setEditingReserva({ ...editingReserva, observaciones: e.target.value })}
                    rows={3}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", resize: "vertical" }} />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-primary" type="submit">Guardar cambios</button>
                  <button className="btn btn-secondary" type="button" onClick={() => setEditingReserva(null)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default ReservasAdmin;