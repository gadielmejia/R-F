import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { api } from "../utils/api";
import "../styles/Dashboardad.css";

const ESTADOS = ["Disponible", "Reservado", "Alquilado", "Reparacion"];

const emptyForm = { idPrenda: "", codigo_interno: "", estado: "Disponible" };

function InventoryAdmin() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [prendas, setPrendas] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, prendasRes] = await Promise.all([
        api.get("/inventario"),
        api.get("/prendas"),
      ]);
      const invData = await invRes.json();
      const prendasData = await prendasRes.json();
      setInventory(invData.data || []);
      setPrendas(prendasData.data || []);
      if (prendasData.data?.length > 0) {
        setForm((f) => ({ ...f, idPrenda: String(prendasData.data[0].idPrenda) }));
      }
    } catch (err) {
      setError("Error cargando inventario.");
    } finally {
      setLoading(false);
    }
  };

  const getPrendaNombre = (idPrenda) => {
    const p = prendas.find((x) => String(x.idPrenda) === String(idPrenda));
    return p?.nombre_prenda || "Sin prenda";
  };

  const getEstadoBadge = (estado) => {
    const colors = {
      Disponible: "#1B5E20",
      Reservado: "#E65100",
      Alquilado: "#1565C0",
      Reparacion: "#B71C1C",
    };
    return (
      <span style={{
        background: colors[estado] || "#757575",
        color: "#fff",
        padding: "2px 10px",
        borderRadius: "12px",
        fontSize: "0.8rem",
        fontWeight: 600,
      }}>
        {estado}
      </span>
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.codigo_interno.trim()) {
      setError("El código interno es obligatorio.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/inventario", {
        idPrenda: Number(form.idPrenda),
        codigo_interno: form.codigo_interno.trim().toUpperCase(),
        estado: form.estado,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setInventory((prev) => [data.data, ...prev]);
      setForm({ ...emptyForm, idPrenda: String(prendas[0]?.idPrenda || "") });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEstado = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.put(`/inventario/${editingItem.idInventario}`, {
        estado: editingItem.estado,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setInventory((prev) =>
        prev.map((i) => (i.idInventario === editingItem.idInventario ? data.data : i))
      );
      setEditingItem(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este item del inventario?")) return;
    try {
      const res = await api.delete(`/inventario/${id}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message);
      }
      setInventory((prev) => prev.filter((i) => i.idInventario !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const filtered = inventory.filter((item) => {
    const nombre = getPrendaNombre(item.idPrenda).toLowerCase();
    const codigo = item.codigo_interno?.toLowerCase() || "";
    const q = search.toLowerCase();
    return nombre.includes(q) || codigo.includes(q);
  });

  const stats = {
    total: inventory.length,
    disponible: inventory.filter((i) => i.estado === "Disponible").length,
    reservado: inventory.filter((i) => i.estado === "Reservado").length,
    alquilado: inventory.filter((i) => i.estado === "Alquilado").length,
    reparacion: inventory.filter((i) => i.estado === "Reparacion").length,
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
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Inventario</h1>
          <p>Gestiona el estado de cada unidad de prenda en el sistema.</p>
        </div>

        {error && <p className="field-alert">⚠ {error}</p>}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card"><h3>Total unidades</h3><p>{stats.total}</p></div>
          <div className="stat-card"><h3>Disponibles</h3><p style={{ color: "#1B5E20" }}>{stats.disponible}</p></div>
          <div className="stat-card"><h3>Reservadas</h3><p style={{ color: "#E65100" }}>{stats.reservado}</p></div>
          <div className="stat-card"><h3>Alquiladas</h3><p style={{ color: "#1565C0" }}>{stats.alquilado}</p></div>
        </div>

        {/* Formulario agregar */}
        <div className="dashboard-card">
          <h2>Agregar unidad al inventario</h2>
          <form className="form-container" onSubmit={handleCreate}>
            <select
              value={form.idPrenda}
              onChange={(e) => setForm({ ...form, idPrenda: e.target.value })}
              className="role-select"
              required
            >
              {prendas.map((p) => (
                <option key={p.idPrenda} value={p.idPrenda}>
                  {p.nombre_prenda} — Talla {p.talla || "U"}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Código interno (ej: INV-008)"
              value={form.codigo_interno}
              onChange={(e) => setForm({ ...form, codigo_interno: e.target.value })}
              required
            />
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
              className="role-select"
            >
              {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Agregar al inventario"}
            </button>
          </form>
        </div>

        {/* Tabla */}
        <div className="dashboard-card">
          <h2>Unidades registradas</h2>
          <input
            type="text"
            placeholder="Buscar por prenda o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: "1rem", padding: "8px 12px", width: "100%",
              borderRadius: "8px", border: "1px solid #ccc", fontSize: "0.95rem" }}
          />
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Prenda</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: "center" }}>
                  {loading ? "Cargando..." : "No hay items en el inventario."}
                </td></tr>
              ) : filtered.map((item) => (
                <tr key={item.idInventario}>
                  <td><code>{item.codigo_interno}</code></td>
                  <td>{getPrendaNombre(item.idPrenda)}</td>
                  <td>{getEstadoBadge(item.estado)}</td>
                  <td style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setEditingItem({ ...item })}
                    >
                      Cambiar estado
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(item.idInventario)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal editar estado */}
        {editingItem && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Cambiar estado</h2>
              <p style={{ marginBottom: "1rem", color: "#555" }}>
                Prenda: <strong>{getPrendaNombre(editingItem.idPrenda)}</strong><br />
                Código: <code>{editingItem.codigo_interno}</code>
              </p>
              <form className="form-container" onSubmit={handleUpdateEstado}>
                <select
                  value={editingItem.estado}
                  onChange={(e) => setEditingItem({ ...editingItem, estado: e.target.value })}
                  className="role-select"
                >
                  {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? "Guardando..." : "Guardar"}
                  </button>
                  <button className="btn btn-secondary" type="button"
                    onClick={() => setEditingItem(null)}>
                    Cancelar
                  </button>
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

export default InventoryAdmin;