import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import ThemeToggle from "../components/ThemeToggle";
import { api } from "../utils/api";
import { useTheme } from "../context/ThemeContext";
import "../styles/Dashboardad.css";

const ESTADOS = ["Disponible", "Reservado", "Alquilado", "Reparacion"];

const emptyForm = { idPrenda: "", codigo_interno: "", estado: "Disponible" };
const emptyLotForm = { idPrenda: "", nombre_lote: "", descripcion_lote: "", codigoInput: "", items: [] };

function InventoryAdmin() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [inventory, setInventory] = useState([]);
  const [prendas, setPrendas] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [lotForm, setLotForm] = useState(emptyLotForm);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, disponible: 0, reservado: 0, alquilado: 0, reparacion: 0 });
  const [selectedEstado, setSelectedEstado] = useState(null);
  const [stateItems, setStateItems] = useState([]);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser || !["admin", "empleado"].includes(currentUser.role)) {
      navigate("/login", { replace: true });
      return;
    }
    loadData();
    loadSummary();
  }, [navigate]);

  const loadSummary = async () => {
    try {
      const res = await api.get('/api/inventario/summary');
      const data = res.data?.data || {};
      setStats({
        total: data.total || 0,
        disponible: data.by_estado?.Disponible || 0,
        reservado: data.by_estado?.Reservado || 0,
        alquilado: data.by_estado?.Alquilado || 0,
        reparacion: data.by_estado?.Reparacion || 0,
      });
    } catch (err) {
      // ignore
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, prendasRes] = await Promise.all([
        api.get("/api/inventario"),
        api.get("/api/prendas"),
      ]);
      const invData = invRes.data;
      const prendasData = prendasRes.data;
      setInventory(invData.data || []);
      setPrendas(prendasData.data || []);
      if (prendasData.data?.length > 0) {
        const firstId = String(prendasData.data[0].idPrenda);
        setForm((f) => ({ ...f, idPrenda: firstId }));
        setLotForm((f) => ({ ...f, idPrenda: firstId }));
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
      const res = await api.post("/api/inventario", {
        idPrenda: Number(form.idPrenda),
        codigo_interno: form.codigo_interno.trim().toUpperCase(),
        estado: form.estado,
      });
      const data = res.data;
      setInventory((prev) => [data.data, ...prev]);
      setForm({ ...emptyForm, idPrenda: String(prendas[0]?.idPrenda || "") });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error creando inventario.');
    } finally {
      setLoading(false);
    }
  };

  const addLotItem = () => {
    const code = lotForm.codigoInput.trim().toUpperCase();
    if (!code) {
      setError("El código del lote es obligatorio.");
      return;
    }
    setLotForm((prev) => ({
      ...prev,
      items: [...prev.items, { codigo_interno: code }],
      codigoInput: "",
    }));
    setError("");
  };

  const removeLotItem = (code) => {
    setLotForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.codigo_interno !== code),
    }));
  };

  const handleCreateLote = async (e) => {
    e.preventDefault();
    setError("");
    if (!lotForm.nombre_lote.trim()) {
      setError("El nombre del lote es obligatorio.");
      return;
    }
    if (lotForm.items.length === 0) {
      setError("Agrega al menos un código para crear el lote.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/inventario', {
        idPrenda: Number(lotForm.idPrenda),
        lote_data: {
          nombre_lote: lotForm.nombre_lote.trim(),
          descripcion_lote: lotForm.descripcion_lote.trim(),
          cantidad_prendas: lotForm.items.length,
          detalles_prenda: lotForm.items,
        },
      });
      const data = res.data;
      const createdItems = data.data?.inventory || [];
      setInventory((prev) => [...createdItems, ...prev]);
      setLotForm({ ...emptyLotForm, idPrenda: String(prendas[0]?.idPrenda || "") });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error creando lote.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEstado = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.put(`/api/inventario/${editingItem.idInventario}`, {
        estado: editingItem.estado,
      });
      const data = res.data;
      setInventory((prev) =>
        prev.map((i) => (i.idInventario === editingItem.idInventario ? data.data : i))
      );
      setEditingItem(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error actualizando estado.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este item del inventario?")) return;
    try {
      const res = await api.delete(`/api/inventario/${id}`);
      const data = res.data;
      setInventory((prev) => prev.filter((i) => i.idInventario !== id));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error eliminando item.');
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

  const statsToShow = stats;

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  const displayedItems = selectedEstado ? stateItems.filter((item) => {
    const q = search.toLowerCase();
    const nombre = (item.prenda?.nombre_prenda || '').toLowerCase();
    const codigo = (item.codigo_interno || '').toLowerCase();
    return nombre.includes(q) || codigo.includes(q);
  }) : filtered;

  async function handleStatClick(estado) {
    setSelectedEstado(estado);
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/inventario/estado/${encodeURIComponent(estado)}`);
      const data = res.data?.data || [];
      setStateItems(data);
    } catch (err) {
      setError('Error cargando items por estado.');
    } finally {
      setLoading(false);
    }
  }
  const dashboardLink = currentUser?.role === 'empleado' ? '/dashboardempleado' : '/dashboardadmin';
  const usersLink = currentUser?.role === 'empleado' ? '/dashboardempleado' : '/admin/usuarios';

  return (
    <>
      <nav className="app-nav">
        <div className="nav-inner">
          <Link to={dashboardLink} className="brand">RentStyle</Link>
          <div className="nav-actions">
            <Link to="/admin/productos" className="nav-link">Productos</Link>
            <Link to={usersLink} className="nav-link">Usuarios</Link>
            <Link to="/admin/inventario" className="nav-link">Inventario</Link>
            <Link to="/admin/reservas" className="dashboard-button">Gestión de reservas</Link>
            <ThemeToggle />
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <div className={`dashboard-container ${theme === "dark" ? "dark" : ""}`}>
        <div className="dashboard-header">
          <h1>Inventario</h1>
          <p>Gestiona el estado de cada unidad de prenda en el sistema.</p>
        </div>

        {error && <p className="field-alert">⚠ {error}</p>}

        {/* Stats */}
        <div className="stats-grid">
          <div className={`stat-card ${selectedEstado === null ? 'active' : ''}`} onClick={async () => { setSelectedEstado(null); setStateItems([]); await loadData(); await loadSummary(); }} style={{ cursor: 'pointer' }}>
            <h3>Total unidades</h3>
            <p>{stats.total}</p>
          </div>
          <div className={`stat-card ${selectedEstado === 'Disponible' ? 'active' : ''}`} onClick={() => handleStatClick('Disponible')} style={{ cursor: 'pointer' }}>
            <h3>Disponibles</h3>
            <p style={{ color: "#1B5E20" }}>{stats.disponible}</p>
          </div>
          <div className={`stat-card ${selectedEstado === 'Reservado' ? 'active' : ''}`} onClick={() => handleStatClick('Reservado')} style={{ cursor: 'pointer' }}>
            <h3>Reservadas</h3>
            <p style={{ color: "#E65100" }}>{stats.reservado}</p>
          </div>
          <div className={`stat-card ${selectedEstado === 'Alquilado' ? 'active' : ''}`} onClick={() => handleStatClick('Alquilado')} style={{ cursor: 'pointer' }}>
            <h3>Alquiladas</h3>
            <p style={{ color: "#1565C0" }}>{stats.alquilado}</p>
          </div>
          <div className={`stat-card ${selectedEstado === 'Reparacion' ? 'active' : ''}`} onClick={() => handleStatClick('Reparacion')} style={{ cursor: 'pointer' }}>
            <h3>Reparación</h3>
            <p style={{ color: "#B71C1C" }}>{stats.reparacion}</p>
          </div>
        </div>

        {/* Formulario agregar */}
        <div className="dashboard-card">
          <h2>Agregar unidad al inventario</h2>
          <div className="form-container" style={{ justifyContent: 'center' }}>
            <Link to="/admin/productos" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
              Ir a productos para agregar
            </Link>
          </div>
        </div>

        {/* Formulario crear lote */}
        <div className="dashboard-card">
          <h2>Crear lote</h2>
          <form className="form-container" onSubmit={handleCreateLote}>
            <input
              type="text"
              placeholder="Nombre del lote"
              value={lotForm.nombre_lote}
              onChange={(e) => setLotForm({ ...lotForm, nombre_lote: e.target.value })}
              required
            />
            <textarea
              rows={3}
              placeholder="Descripción del lote"
              value={lotForm.descripcion_lote}
              onChange={(e) => setLotForm({ ...lotForm, descripcion_lote: e.target.value })}
              style={{ resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Código del lote"
                value={lotForm.codigoInput}
                onChange={(e) => setLotForm({ ...lotForm, codigoInput: e.target.value })}
                style={{ flex: 1, minWidth: 180 }}
              />
              <button type="button" className="btn btn-secondary" onClick={addLotItem}>
                Agregar código
              </button>
            </div>
            {lotForm.items.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {lotForm.items.map((item) => (
                  <div key={item.codigo_interno} className="batch-item-chip">
                    <span>{item.codigo_interno}{item.talla ? ` — ${item.talla}` : ""}</span>
                    <button type="button" onClick={() => removeLotItem(item.codigo_interno)}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Crear lote"}
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
                <th>Talla</th>
                <th>Prenda</th>
                <th>Estado</th>
                <th>Acciones</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayedItems.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: "center" }}>
                  {loading ? "Cargando..." : "No hay items en el inventario."}
                </td></tr>
              ) : displayedItems.map((item) => (
                <tr key={item.idInventario}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.prenda?.thumbnail_url ? (
                      <img src={item.prenda.thumbnail_url} alt="thumb" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                    ) : null}
                    <code>{item.codigo_interno}</code>
                  </td>
                  <td>{item.talla || item.prenda?.talla || "No especificada"}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.prenda?.nombre_prenda || getPrendaNombre(item.idPrenda)}</div>
                    {item.prenda?.color ? <div style={{ fontSize: '0.9rem', color: '#666' }}>{item.prenda.color}</div> : null}
                  </td>
                  <td>{getEstadoBadge(item.estado)}</td>
                  <td style={{ display: "flex", gap: "8px" }}>
                    <button className="btn btn-secondary" onClick={() => setEditingItem({ ...item })}>
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