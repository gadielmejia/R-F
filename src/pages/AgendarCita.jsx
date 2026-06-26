import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import Footer from "../components/Footer";

function AgendarCita() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [citas, setCitas] = useState([]);
  const [form, setForm] = useState({ id_reserva: "", fecha_cita: "", hora_cita: "", motivo: "" });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("currentUser") || "null");

  useEffect(() => {
    if (!user || user.role !== "user") { navigate("/login", { replace: true }); return; }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [resRes, citasRes, admRes] = await Promise.all([
        api.get(`/reservas/cliente/${user.idUsuario}`),
        api.get(`/citas/cliente/${user.idUsuario}`),
        api.get("/usuarios"),
      ]);
      const resData = await resRes.json();
      const citasData = await citasRes.json();
      const admData = await admRes.json();

      const activas = (resData.data || []).filter(r =>
        ["Pendiente", "Confirmada"].includes(r.estado)
      );
      setReservas(activas);
      setCitas(citasData.data || []);

      const admin = (admData.data || []).find(u => u.idRol === 1 || u.rol_nombre === "admin");
      if (admin) {
        setForm(f => ({ ...f, id_administrador: admin.idUsuario }));
      }
    } catch (err) {
      setError("Error cargando datos.");
    } finally {
      setLoadingData(false);
    }
  };

  const cancelarCita = async (idCita) => {
    if (!confirm("¿Cancelar esta cita?")) return;
    try {
      const res = await api.put(`/citas/${idCita}`, { estado: "Cancelada" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setCitas(prev => prev.map(c => c.idCita === idCita ? { ...c, estado: "Cancelada" } : c));
    } catch (err) {
      alert("Error al cancelar: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.fecha_cita || !form.hora_cita) {
      setError("Debes seleccionar fecha y hora para la cita."); return;
    }
    setLoading(true);
    try {
      const fechaHora = `${form.fecha_cita}T${form.hora_cita}:00`;
      const res = await api.post("/citas", {
        id_cliente: user.idUsuario,
        id_administrador: form.id_administrador,
        id_reserva: form.id_reserva ? Number(form.id_reserva) : null,
        fecha_cita: fechaHora,
        motivo: form.motivo || "Medición de prenda",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCitas(prev => [data.data, ...prev]);
      setForm(f => ({ ...f, id_reserva: "", fecha_cita: "", hora_cita: "", motivo: "" }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

  const ESTADO_COLORS = {
    Pendiente: { bg: "#FFF3E0", color: "#E65100" },
    Atendida: { bg: "#E8F5E9", color: "#1B5E20" },
    Cancelada: { bg: "#FFEBEE", color: "#B71C1C" },
  };

  return (
    <>
      <nav className="app-nav">
        <div className="nav-inner">
          <Link to="/dashboarduser" className="brand">RentStyle</Link>
          <div className="nav-actions">
            <Link to="/dashboarduser">Catálogo</Link>
            <Link to="/mis-reservas">Mis reservas</Link>
            <Link to="/profile">Perfil</Link>
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Agendar Cita</h1>
          <p>Programa una cita para la medición o prueba de tu prenda.</p>
        </div>

        {/* Formulario */}
        <div className="dashboard-card">
          <h2>Nueva cita</h2>
          {success && (
            <div style={{ background: "#E8F5E9", color: "#1B5E20", padding: "12px 16px",
              borderRadius: "8px", marginBottom: "1rem", fontWeight: 600 }}>
              ✅ ¡Cita agendada exitosamente!
            </div>
          )}
          {error && <p className="field-alert">⚠ {error}</p>}

          <form className="form-container" onSubmit={handleSubmit}>
            <div>
              <label style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
                Reserva asociada <span style={{ color: "#9ca3af", fontWeight: 400 }}>(opcional)</span>
              </label>
              <select
                value={form.id_reserva}
                onChange={e => setForm({ ...form, id_reserva: e.target.value })}
                className="role-select"
              >
                <option value="">Sin reserva asociada</option>
                {reservas.map(r => (
                  <option key={r.idReserva} value={r.idReserva}>
                    Reserva #{r.idReserva} — {r.fecha_evento} ({r.estado})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
                Fecha de la cita
              </label>
              <input
                type="date"
                value={form.fecha_cita}
                min={new Date().toISOString().split("T")[0]}
                onChange={e => setForm({ ...form, fecha_cita: e.target.value })}
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
                Hora de la cita
              </label>
              <select
                value={form.hora_cita}
                onChange={e => setForm({ ...form, hora_cita: e.target.value })}
                className="role-select"
                required
              >
                <option value="">Selecciona una hora</option>
                {["09:00","10:00","11:00","14:00","15:00","16:00","17:00"].map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
                Motivo <span style={{ color: "#9ca3af", fontWeight: 400 }}>(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Medición de vestido de gala"
                value={form.motivo}
                onChange={e => setForm({ ...form, motivo: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Agendando..." : "Agendar cita"}
            </button>
          </form>
        </div>

        {/* Mis citas */}
        <div className="dashboard-card">
          <h2>Mis citas</h2>
          {loadingData ? (
            <p>Cargando...</p>
          ) : citas.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No tienes citas agendadas.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Motivo</th>
                  <th>Reserva</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {citas.map(c => {
                  const estilo = ESTADO_COLORS[c.estado] || { bg: "#f3f4f6", color: "#374151" };
                  return (
                    <tr key={c.idCita}>
                      <td>{new Date(c.fecha_cita).toLocaleString()}</td>
                      <td>{c.motivo || "—"}</td>
                      <td>{c.id_reserva ? `#${c.id_reserva}` : "—"}</td>
                      <td>
                        <span style={{ background: estilo.bg, color: estilo.color,
                          padding: "2px 10px", borderRadius: "10px", fontWeight: 600, fontSize: "0.82rem" }}>
                          {c.estado}
                        </span>
                      </td>
                      <td>
                        {c.estado === "Pendiente" && (
                          <button className="btn btn-danger"
                            onClick={() => cancelarCita(c.idCita)}
                            style={{ fontSize: "0.82rem", padding: "4px 10px" }}>
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AgendarCita;