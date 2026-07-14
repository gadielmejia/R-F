import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { api } from "../utils/api";
import "../styles/Dashboardad.css";

function DashboardEmpleado() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [productCount, setProductCount] = useState(0);
  const [inventoryStats, setInventoryStats] = useState({ total: 0, disponible: 0, reservado: 0, alquilado: 0, reparacion: 0 });

  // Formulario nuevo usuario
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: "", documento: "", telefono: "", correo: "", Contrasena: "", confirmar: ""
  });
  const [savingUser, setSavingUser] = useState(false);

  const user = JSON.parse(localStorage.getItem("currentUser") || "{}");

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    const normalizeRole = (cu) => {
      if (!cu) return "";
      let r = cu.role ?? cu.rol_nombre ?? cu.rol ?? "";
      if (typeof r === "string") return r.toLowerCase();
      if (typeof r === "object") return (r.nombre || r.name || "").toString().toLowerCase();
      return "";
    };
    const rol = normalizeRole(currentUser);
    if (!currentUser || rol !== "empleado") {
      navigate("/login", { replace: true });
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usuariosRes, prendasRes, inventarioRes] = await Promise.all([
        api.get("/api/usuarios"),
        api.get("/api/prendas"),
        api.get("/api/inventario"),
      ]);

      const usuariosData = usuariosRes.data;
      setUsuarios(usuariosData.data || []);

      const prendasData = prendasRes.data;
      setProductCount(prendasData.data?.length || 0);

      const inventarioData = inventarioRes.data;
      const inventario = inventarioData.data || [];
      setInventoryStats({
        total: inventario.length,
        disponible: inventario.filter((item) => item.estado === "Disponible").length,
        reservado: inventario.filter((item) => item.estado === "Reservado").length,
        alquilado: inventario.filter((item) => item.estado === "Alquilado").length,
        reparacion: inventario.filter((item) => item.estado === "Reparacion").length,
      });
    } catch (err) {
      console.error(err);
      setError("Error cargando datos.");
    } finally {
      setLoading(false);
    }
  };

  const getRolBadge = (rolNombre) => {
    const colors = {
      admin: { bg: "#1B5E20", color: "#fff" },
      empleado: { bg: "#1565C0", color: "#fff" },
      usuario: { bg: "#E65100", color: "#fff" },
      cliente: { bg: "#6A1B9A", color: "#fff" },
    };
    const style = colors[rolNombre?.toLowerCase()] || { bg: "#757575", color: "#fff" };
    return (
      <span style={{
        background: style.bg, color: style.color,
        padding: "2px 10px", borderRadius: "12px",
        fontSize: "0.78rem", fontWeight: 600
      }}>
        {rolNombre || "—"}
      </span>
    );
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim() || !form.documento.trim() || !form.correo.trim() || !form.Contrasena) {
      setError("Nombre, documento, correo y contraseña son obligatorios."); return;
    }
    if (form.Contrasena !== form.confirmar) {
      setError("Las contraseñas no coinciden."); return;
    }
    if (form.Contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres."); return;
    }

    setSavingUser(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/api/usuarios",
        {
          nombre: form.nombre.trim(),
          documento: form.documento.trim(),
          telefono: form.telefono.trim() || null,
          correo: form.correo.trim().toLowerCase(),
          Contrasena: form.Contrasena,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const data = res.data;
      setUsuarios(prev => [data.data, ...prev]);
      setForm({ nombre: "", documento: "", telefono: "", correo: "", Contrasena: "", confirmar: "" });
      setShowForm(false);
      setSuccess("✅ Usuario creado exitosamente.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error creando usuario.");
    } finally {
      setSavingUser(false);
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login", { replace: true }); };

  const filtered = usuarios.filter(u => {
    const q = search.toLowerCase();
    return (
      u.nombre?.toLowerCase().includes(q) ||
      u.correo?.toLowerCase().includes(q) ||
      u.documento?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: usuarios.length,
    admins: usuarios.filter(u => (u.rol_nombre || "").toLowerCase() === "admin").length,
    empleados: usuarios.filter(u => (u.rol_nombre || "").toLowerCase() === "empleado").length,
    clientes: usuarios.filter(u => ["usuario", "cliente"].includes(((u.rol_nombre || "").toLowerCase()))).length,
  };

  return (
    <>
      <nav className="app-nav">
        <div className="nav-inner">
          <Link to="/dashboardempleado" className="brand">RentStyle</Link>
          <div className="nav-actions">
            <Link to="/admin/productos" className="nav-link">Prendas</Link>
            <Link to="/admin/inventario" className="nav-link">Inventario</Link>
            <Link to="/admin/usuarios" className="nav-link">Usuarios</Link>
            <Link to="/admin/reservas" className="nav-link">Reservas</Link>
            <span style={{ color: "#fff", fontSize: "0.85rem" }}>
              👤 {user.nombre}
            </span>
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Panel Empleado</h1>
          <p>Consulta y gestión de usuarios del sistema.</p>
        </div>

        {error && (
          <div style={{ background: "#FFEBEE", color: "#B71C1C", padding: "12px 16px",
            borderRadius: "8px", marginBottom: "1rem", fontWeight: 600 }}>
            ⚠ {error}
          </div>
        )}
        {success && (
          <div style={{ background: "#E8F5E9", color: "#1B5E20", padding: "12px 16px",
            borderRadius: "8px", marginBottom: "1rem", fontWeight: 600 }}>
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card"><h3>Total usuarios</h3><p>{stats.total}</p></div>
          <div className="stat-card"><h3>Administradores</h3><p style={{ color: "#1B5E20" }}>{stats.admins}</p></div>
          <div className="stat-card"><h3>Empleados</h3><p style={{ color: "#1565C0" }}>{stats.empleados}</p></div>
          <div className="stat-card"><h3>Clientes</h3><p style={{ color: "#E65100" }}>{stats.clientes}</p></div>
          <div className="stat-card"><h3>Prendas</h3><p>{productCount}</p></div>
          <div className="stat-card"><h3>Inventario</h3><p>{inventoryStats.total}</p></div>
        </div>

        <div className="dashboard-buttons-row">
          <Link to="/admin/productos" className="dashboard-button">Gestionar prendas</Link>
          <Link to="/admin/inventario" className="dashboard-button">Gestionar inventario</Link>
        </div>

        {/* Botón agregar usuario */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <button
            className="btn btn-primary"
            onClick={() => { setShowForm(!showForm); setError(""); }}
          >
            {showForm ? "✕ Cancelar" : "+ Agregar usuario"}
          </button>
        </div>

        {/* Formulario agregar usuario */}
        {showForm && (
          <div className="dashboard-card">
            <h2>Nuevo usuario</h2>
            <p style={{ color: "#6b7280", marginBottom: "1rem", fontSize: "0.9rem" }}>
              El usuario será registrado con rol <strong>Usuario</strong> por defecto.
            </p>
            <form className="form-container" onSubmit={handleCreateUser}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    Nombre completo *
                  </label>
                  <input type="text" placeholder="Nombre del usuario"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    Documento *
                  </label>
                  <input type="text" placeholder="Número de documento"
                    value={form.documento}
                    onChange={e => setForm({ ...form, documento: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    Correo electrónico *
                  </label>
                  <input type="email" placeholder="correo@ejemplo.com"
                    value={form.correo}
                    onChange={e => setForm({ ...form, correo: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    Teléfono
                  </label>
                  <input type="tel" placeholder="Número de teléfono (opcional)"
                    value={form.telefono}
                    onChange={e => setForm({ ...form, telefono: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    Contraseña *
                  </label>
                  <input type="password" placeholder="Mínimo 8 caracteres"
                    value={form.Contrasena}
                    onChange={e => setForm({ ...form, Contrasena: e.target.value })}
                    required minLength={8}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    Confirmar contraseña *
                  </label>
                  <input type="password" placeholder="Repite la contraseña"
                    value={form.confirmar}
                    onChange={e => setForm({ ...form, confirmar: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                  />
                </div>
              </div>
              <div style={{ marginTop: "0.75rem" }}>
                <div style={{ background: LIGHT_GREEN, padding: "10px 14px", borderRadius: "8px",
                  color: "#1B5E20", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                  ℹ El rol asignado será <strong>Usuario</strong> automáticamente.
                </div>
                <button className="btn btn-primary" type="submit" disabled={savingUser}>
                  {savingUser ? "Guardando..." : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de usuarios */}
        <div className="dashboard-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h2 style={{ margin: 0 }}>Usuarios registrados ({filtered.length})</h2>
            <input
              type="text"
              placeholder="Buscar por nombre, correo o documento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #d1d5db",
                width: "280px", fontSize: "0.9rem" }}
            />
          </div>

          {loading ? (
            <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>
              Cargando usuarios...
            </p>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6b7280" }}>
              {search ? "No hay usuarios que coincidan con la búsqueda." : "No hay usuarios registrados."}
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => (
                  <tr key={u.idUsuario}>
                    <td style={{ color: "#9ca3af", fontSize: "0.82rem" }}>{idx + 1}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                          width: "32px", height: "32px", borderRadius: "50%",
                          background: "#1B5E20", color: "#fff", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          fontSize: "0.85rem", fontWeight: 700, flexShrink: 0
                        }}>
                          {u.nombre?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u.nombre}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: "0.88rem", color: "#6b7280" }}>{u.documento || "—"}</td>
                    <td style={{ fontSize: "0.88rem" }}>{u.correo}</td>
                    <td style={{ fontSize: "0.88rem", color: "#6b7280" }}>{u.telefono || "—"}</td>
                    <td>{getRolBadge(u.rol_nombre)}</td>
                    <td style={{ fontSize: "0.82rem", color: "#9ca3af" }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

const LIGHT_GREEN = "#E8F5E9";

export default DashboardEmpleado;