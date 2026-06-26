import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { api } from "../utils/api";
import "../styles/Dashboardad.css";

const emptyForm = { nombre_prenda: "", idCategoria: "", precio_alquiler: "", talla: "", color: "", descripcion: "" };

function ProductsAdmin() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productForm, setProductForm] = useState(emptyForm);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const [prodRes, catRes] = await Promise.all([api.get('/prendas'), api.get('/categorias')]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      setProducts(prodData.data || []);
      setCategories(catData.data || []);
      if (catData.data?.length > 0) {
        setProductForm(f => ({ ...f, idCategoria: String(catData.data[0].idCategoria) }));
      }
    } catch (err) {
      setError("Error cargando datos.");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (idCategoria) => {
    const cat = categories.find(c => String(c.idCategoria) === String(idCategoria));
    return cat?.nombre || "Sin categoría";
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post('/prendas', {
        nombre_prenda: productForm.nombre_prenda,
        idCategoria: Number(productForm.idCategoria),
        precio_alquiler: Number(productForm.precio_alquiler),
        talla: productForm.talla,
        color: productForm.color,
        descripcion: productForm.descripcion,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProducts(prev => [data.data, ...prev]);
      setProductForm({ ...emptyForm, idCategoria: String(categories[0]?.idCategoria || "") });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.put(`/prendas/${editingProduct.idPrenda}`, {
        nombre_prenda: editingProduct.nombre_prenda,
        idCategoria: Number(editingProduct.idCategoria),
        precio_alquiler: Number(editingProduct.precio_alquiler),
        talla: editingProduct.talla,
        color: editingProduct.color,
        descripcion: editingProduct.descripcion,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProducts(prev => prev.map(p => p.idPrenda === editingProduct.idPrenda ? data.data : p));
      setEditingProduct(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      const res = await api.delete(`/prendas/${id}`);
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setProducts(prev => prev.filter(p => p.idPrenda !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login", { replace: true }); };

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
          <h1>Gestión de Productos</h1>
          <p>Agrega, edita y elimina productos del catálogo.</p>
        </div>

        {error && <p className="field-alert">⚠ {error}</p>}

        <div className="dashboard-card">
          <h2>Agregar Producto</h2>
          <form className="form-container" onSubmit={handleCreate}>
            <input type="text" placeholder="Nombre del producto" value={productForm.nombre_prenda}
              onChange={e => setProductForm({ ...productForm, nombre_prenda: e.target.value })} required />
            <select value={productForm.idCategoria}
              onChange={e => setProductForm({ ...productForm, idCategoria: e.target.value })} className="role-select">
              {categories.map(c => <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>)}
            </select>
            <input type="number" placeholder="Precio alquiler" value={productForm.precio_alquiler}
              onChange={e => setProductForm({ ...productForm, precio_alquiler: e.target.value })} required />
            <input type="text" placeholder="Talla (opcional)" value={productForm.talla}
              onChange={e => setProductForm({ ...productForm, talla: e.target.value })} />
            <input type="text" placeholder="Color (opcional)" value={productForm.color}
              onChange={e => setProductForm({ ...productForm, color: e.target.value })} />
            <input type="text" placeholder="Descripción (opcional)" value={productForm.descripcion}
              onChange={e => setProductForm({ ...productForm, descripcion: e.target.value })} />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Producto"}
            </button>
          </form>
        </div>

        <div className="dashboard-card">
          <h2>Productos registrados</h2>
          <table className="data-table">
            <thead>
              <tr><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Talla</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: "center" }}>No hay productos.</td></tr>
              ) : products.map(p => (
                <tr key={p.idPrenda}>
                  <td>{p.nombre_prenda}</td>
                  <td>{getCategoryName(p.idCategoria)}</td>
                  <td>${Number(p.precio_alquiler).toLocaleString()}</td>
                  <td>{p.talla || "-"}</td>
                  <td style={{ display: "flex", gap: "8px" }}>
                    <button className="btn btn-secondary" onClick={() => setEditingProduct({ ...p })}>Editar</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(p.idPrenda)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editingProduct && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Editar Producto</h2>
              <form className="form-container" onSubmit={handleUpdate}>
                <input type="text" placeholder="Nombre" value={editingProduct.nombre_prenda}
                  onChange={e => setEditingProduct({ ...editingProduct, nombre_prenda: e.target.value })} required />
                <select value={String(editingProduct.idCategoria)}
                  onChange={e => setEditingProduct({ ...editingProduct, idCategoria: e.target.value })} className="role-select">
                  {categories.map(c => <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>)}
                </select>
                <input type="number" placeholder="Precio" value={editingProduct.precio_alquiler}
                  onChange={e => setEditingProduct({ ...editingProduct, precio_alquiler: e.target.value })} required />
                <input type="text" placeholder="Talla" value={editingProduct.talla || ""}
                  onChange={e => setEditingProduct({ ...editingProduct, talla: e.target.value })} />
                <input type="text" placeholder="Color" value={editingProduct.color || ""}
                  onChange={e => setEditingProduct({ ...editingProduct, color: e.target.value })} />
                <input type="text" placeholder="Descripción" value={editingProduct.descripcion || ""}
                  onChange={e => setEditingProduct({ ...editingProduct, descripcion: e.target.value })} />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? "Guardando..." : "Guardar cambios"}
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => setEditingProduct(null)}>Cancelar</button>
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

export default ProductsAdmin;