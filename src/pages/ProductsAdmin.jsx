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
  const [productFiles, setProductFiles] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser || !["admin", "empleado"].includes(currentUser.role)) {
      navigate("/login", { replace: true });
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([api.get('/api/prendas'), api.get('/api/categorias')]);
      const prodData = prodRes.data;
      const catData = catRes.data;
      setProducts(prodData.data || []);
      setCategories(catData.data || []);
      if (catData.data?.length > 0) {
        setProductForm(f => ({ ...f, idCategoria: String(catData.data[0].idCategoria) }));
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      const message = err.response?.data?.message || err.message || 'Error cargando datos.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    // limitar a 10
    if (files.length > 10) {
      setError('Máximo 10 imágenes permitidas.');
      return;
    }
    setProductFiles(files);
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
      // enviar multipart/form-data si hay imágenes
      let res;
      if (productFiles && productFiles.length > 0) {
        const form = new FormData();
        form.append('nombre_prenda', productForm.nombre_prenda);
        form.append('idCategoria', productForm.idCategoria);
        form.append('precio_alquiler', productForm.precio_alquiler);
        form.append('talla', productForm.talla);
        form.append('color', productForm.color);
        form.append('descripcion', productForm.descripcion);
        productFiles.slice(0,10).forEach(f => form.append('images', f));
        res = await api.post('/api/prendas', form);
        const data = res.data;
        setProducts(prev => [data.data, ...prev]);
        setProductForm({ ...emptyForm, idCategoria: String(categories[0]?.idCategoria || "") });
        setProductFiles([]);
      } else {
        setError('Debe subir al menos una imagen para el producto.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear producto');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // preparar formData para enviar cambios y archivos nuevos / eliminar imágenes
      const form = new FormData();
      form.append('nombre_prenda', editingProduct.nombre_prenda);
      form.append('idCategoria', editingProduct.idCategoria);
      form.append('precio_alquiler', editingProduct.precio_alquiler);
      form.append('talla', editingProduct.talla || '');
      form.append('color', editingProduct.color || '');
      form.append('descripcion', editingProduct.descripcion || '');

      // imágenes a eliminar (marcadas en editingProduct.removeImageIds)
      if (editingProduct.removeImageIds && editingProduct.removeImageIds.length > 0) {
        form.append('remove_image_ids', JSON.stringify(editingProduct.removeImageIds));
      }

      // nuevas imágenes a subir
      if (editingProduct.newFiles && editingProduct.newFiles.length > 0) {
        editingProduct.newFiles.slice(0,10).forEach(f => form.append('images', f));
      }

      const res = await api.put(`/api/prendas/${editingProduct.idPrenda}`, form);
      const data = res.data;
      setProducts(prev => prev.map(p => p.idPrenda === editingProduct.idPrenda ? data.data : p));
      setEditingProduct(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error actualizando producto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      const res = await api.delete(`/api/prendas/${id}`);
      const data = res.data;
      setProducts(prev => prev.filter(p => p.idPrenda !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login", { replace: true }); };

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
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

        <div className="dashboard-card product-form-card">
          <h2>Agregar Producto</h2>
          <form className="form-container centered-card" onSubmit={handleCreate}>
            <input type="text" placeholder="Nombre del producto" value={productForm.nombre_prenda}
              onChange={e => setProductForm({ ...productForm, nombre_prenda: e.target.value })} required />
            <select value={productForm.idCategoria}
              onChange={e => setProductForm({ ...productForm, idCategoria: e.target.value })} className="role-select">
              {categories.map(c => <option key={c.idCategoria} value={String(c.idCategoria)}>{c.nombre}</option>)}
            </select>
            <input type="number" placeholder="Precio alquiler" value={productForm.precio_alquiler}
              onChange={e => setProductForm({ ...productForm, precio_alquiler: e.target.value })} required />
            <input type="text" placeholder="Talla" value={productForm.talla}
              onChange={e => setProductForm({ ...productForm, talla: e.target.value })} required />
            <input type="text" placeholder="Color" value={productForm.color}
              onChange={e => setProductForm({ ...productForm, color: e.target.value })} required />
            <textarea rows={10} placeholder="Descripción" value={productForm.descripcion}
              onChange={e => setProductForm({ ...productForm, descripcion: e.target.value })} required style={{resize:'vertical', overflowY:'auto'}} />
            <div className="file-upload-group">
              <label>Imágenes (1-10):</label>
              <input type="file" accept="image/*" multiple onChange={handleFilesChange} />
              {productFiles.length > 0 && (
                <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap', justifyContent:'center'}}>
                  {productFiles.map((f,i)=> <img key={i} src={URL.createObjectURL(f)} alt={f.name} style={{width:80,height:80,objectFit:'cover',borderRadius:8}}/>) }
                </div>
              )}
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Producto"}
            </button>
          </form>
        </div>

        <div className="dashboard-card">
          <h2>Productos registrados</h2>
          <table className="data-table">
            <thead>
              <tr><th>Nombre</th><th>Categoría</th><th>Imagen</th><th>Precio</th><th>Talla</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: "center" }}>No hay productos.</td></tr>
              ) : products.map(p => (
                <tr key={p.idPrenda}>
                  <td>{p.nombre_prenda}</td>
                  <td>{getCategoryName(p.idCategoria)}</td>
                  <td>
                    {p.images && p.images[0] ? (
                      <img src={p.images[0].url} alt="thumb" style={{width:80,height:80,objectFit:'cover',borderRadius:8}} />
                    ) : <div style={{width:80,height:80,background:'#f0f0f0',borderRadius:8}}/>}
                  </td>
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
                  onChange={e => setEditingProduct({ ...editingProduct, talla: e.target.value })} required />
                <input type="text" placeholder="Color" value={editingProduct.color || ""}
                  onChange={e => setEditingProduct({ ...editingProduct, color: e.target.value })} required />
                <textarea rows={10} placeholder="Descripción" value={editingProduct.descripcion || ""}
                  onChange={e => setEditingProduct({ ...editingProduct, descripcion: e.target.value })} required style={{resize:'vertical', overflowY:'auto'}} />

                <div style={{gridColumn:'1/-1'}}>
                  <label style={{display:'block',marginBottom:8}}>Imágenes actuales (marcar para eliminar):</label>
                  <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                    {(editingProduct.images || []).map(img => (
                      <div key={img.idImagen} style={{position:'relative'}}>
                        <img src={img.url} alt="img" style={{width:90,height:90,objectFit:'cover',borderRadius:8}} />
                        <label style={{display:'block',textAlign:'center'}}>
                          <input type="checkbox" onChange={e => {
                            const remove = editingProduct.removeImageIds ? [...editingProduct.removeImageIds] : [];
                            if (e.target.checked) remove.push(img.idImagen); else {
                              const idx = remove.indexOf(img.idImagen); if (idx>=0) remove.splice(idx,1);
                            }
                            setEditingProduct({ ...editingProduct, removeImageIds: remove });
                          }} /> Eliminar
                        </label>
                      </div>
                    ))}
                  </div>

                  <label style={{display:'block', marginTop:12, marginBottom:8}}>Agregar nuevas imágenes (máx 10 totales):</label>
                  <input type="file" accept="image/*" multiple onChange={e => {
                    const files = Array.from(e.target.files || []);
                    const currentCount = (editingProduct.images || []).length - (editingProduct.removeImageIds?.length || 0);
                    if (currentCount + files.length > 10) { setError('Máximo 10 imágenes en total.'); return; }
                    setEditingProduct({ ...editingProduct, newFiles: files });
                  }} />
                  {editingProduct.newFiles && editingProduct.newFiles.length > 0 && (
                    <div style={{display:'flex',gap:8,marginTop:8}}>
                      {editingProduct.newFiles.map((f,i)=> <img key={i} src={URL.createObjectURL(f)} alt={f.name} style={{width:80,height:80,objectFit:'cover',borderRadius:8}}/>) }
                    </div>
                  )}
                </div>

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