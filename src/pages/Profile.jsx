import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import "../styles/profile.css";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ nombre: "", correo: "", telefono: "", documento: "" });
  const [form, setForm] = useState({ nombre: "", telefono: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser) { navigate("/login"); return; }
    setUser(currentUser);
    setForm({ nombre: currentUser.nombre || "", telefono: currentUser.telefono || "" });
  }, [navigate]);

  const saveProfile = async () => {
    if (!form.nombre.trim()) { setError("El nombre no puede estar vacío."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await api.put(`/usuarios/${user.idUsuario}`, {
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim() || null,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const updated = { ...user, nombre: data.data.nombre, telefono: data.data.telefono };
      localStorage.setItem("currentUser", JSON.stringify(updated));
      setUser(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };
  const isUser = user.role === "user";

  return (
    <>
      <nav className="app-nav">
        <div className="nav-inner">
          <Link to={isUser ? "/dashboarduser" : "/dashboardadmin"} className="brand">RentStyle</Link>
          <div className="nav-actions">
            {isUser && <Link to="/dashboarduser">Catálogo</Link>}
            {isUser && <Link to="/mis-reservas">Mis reservas</Link>}
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <section className="profile-page">
        <div className="profile-card">
          <div className="profile">Mi Perfil</div>
          <br />
          <div className="profile-image-container">
            <div style={{
              width: "80px", height: "80px", borderRadius: "50%",
              background: "#1B5E20", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "2rem", color: "#fff", margin: "0 auto"
            }}>
              {user.nombre?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>

          <h2 style={{ textAlign: "center", margin: "0.75rem 0 0.25rem" }}>{user.nombre}</h2>
          <p style={{ textAlign: "center", color: "#6b7280", margin: "0 0 0.25rem" }}>{user.correo}</p>
          <p style={{ textAlign: "center", color: "#1B5E20", fontWeight: 600, margin: "0 0 1.5rem" }}>
            {user.rol_nombre || user.role}
          </p>

          {success && (
            <div style={{ background: "#E8F5E9", color: "#1B5E20", padding: "10px 14px",
              borderRadius: "8px", marginBottom: "1rem", fontWeight: 600 }}>
              ✅ Perfil actualizado correctamente.
            </div>
          )}
          {error && (
            <div style={{ background: "#FFEBEE", color: "#B71C1C", padding: "10px 14px",
              borderRadius: "8px", marginBottom: "1rem" }}>
              ⚠ {error}
            </div>
          )}

          <div className="profile-form">
            <label>Nombre completo</label>
            <input type="text" value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })} />

            <label>Correo electrónico</label>
            <input type="email" value={user.correo} disabled
              style={{ background: "#f3f4f6", color: "#9ca3af", cursor: "not-allowed" }} />

            <label>Documento</label>
            <input type="text" value={user.documento || ""} disabled
              style={{ background: "#f3f4f6", color: "#9ca3af", cursor: "not-allowed" }} />

            <label>Teléfono</label>
            <input type="tel" value={form.telefono}
              onChange={e => setForm({ ...form, telefono: e.target.value })}
              placeholder="Número de teléfono" />

            <button onClick={saveProfile} disabled={loading}
              style={{ marginTop: "0.5rem", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>

          {isUser && (
            <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <Link to="/mis-reservas" style={{
                display: "block", textAlign: "center", padding: "10px",
                background: "#E8F5E9", color: "#1B5E20", borderRadius: "8px",
                textDecoration: "none", fontWeight: 600
              }}>
                Ver mis reservas
              </Link>
              <Link to="/agendar-cita" style={{
                display: "block", textAlign: "center", padding: "10px",
                background: "#E3F2FD", color: "#1565C0", borderRadius: "8px",
                textDecoration: "none", fontWeight: 600
              }}>
                Agendar cita
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Profile;