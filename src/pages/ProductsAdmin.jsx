import { Fragment, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import ThemeToggle from "../components/ThemeToggle";
import { api } from "../utils/api";
import { useTheme } from "../context/ThemeContext";
import "../styles/Dashboardad.css";

const emptyForm = { nombre_prenda: "", idCategoria: "", precio_alquiler: "", nombre_lote: "", color: "", descripcion: "" };

function ProductsAdmin() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productForm, setProductForm] = useState(emptyForm);
  const [productFiles, setProductFiles] = useState([]);
  const [batchCode, setBatchCode] = useState("");
  const [batchItems, setBatchItems] = useState([]);
  const [batchTalla, setBatchTalla] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [editBatchCode, setEditBatchCode] = useState("");
  const [editBatchTalla, setEditBatchTalla] = useState("");
  const [expandedInventoryRows, setExpandedInventoryRows] = useState([]);
  const [expandedTallasRows, setExpandedTallasRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showLoteSuggestionsAdd, setShowLoteSuggestionsAdd] = useState(false);
  const [showLoteSuggestionsEdit, setShowLoteSuggestionsEdit] = useState(false);
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

  const addEditInventoryCode = () => {
    const code = editBatchCode.trim().toUpperCase();
    const talla = editBatchTalla.trim().toUpperCase();
    if (!code) {
      setError('El código del lote no puede estar vacío.');
      return;
    }
    if (!editingProduct) return;
    const currentCodes = [
      ...(editingProduct.inventory || []).filter(inv => !(editingProduct.removeInventoryIds || []).includes(inv.idInventario)).map(inv => inv.codigo_interno),
      ...((editingProduct.newInventoryCodes || []).map(i => (typeof i === 'string' ? i : (i.code || i.codigo || i.codigo_interno))))
    ];
    if (currentCodes.includes(code)) {
      setError('Ya agregaste ese código al lote.');
      return;
    }
    setEditingProduct(prev => ({
      ...prev,
      newInventoryCodes: [...(prev.newInventoryCodes || []), { codigo: code, talla }]
    }));
    setEditBatchCode("");
    setEditBatchTalla("");
    setError("");
  };

  const removeExistingInventoryCode = (idInventario) => {
    if (!editingProduct) return;
    setEditingProduct(prev => ({
      ...prev,
      removeInventoryIds: Array.from(new Set([...(prev.removeInventoryIds || []), idInventario]))
    }));
  };

  const removeNewInventoryCode = (code) => {
    if (!editingProduct) return;
    setEditingProduct(prev => ({
      ...prev,
      newInventoryCodes: (prev.newInventoryCodes || []).filter(c => {
        const candidate = typeof c === 'string' ? c : (c.codigo || c.code || c.codigo_interno);
        return candidate !== code;
      })
    }));
  };

  const toggleInventoryRow = (idPrenda) => {
    setExpandedInventoryRows(prev => prev.includes(idPrenda) ? prev.filter(item => item !== idPrenda) : [...prev, idPrenda]);
  };

  const toggleTallasRow = (idPrenda) => {
    setExpandedTallasRows(prev => prev.includes(idPrenda) ? prev.filter(item => item !== idPrenda) : [...prev, idPrenda]);
  };

  const getCategoryName = (idCategoria) => {
    const cat = categories.find(c => String(c.idCategoria) === String(idCategoria));
    return cat?.nombre || "Sin categoría";
  };

  const getProductThumbnail = (product) => {
    return product.images?.[0]?.url || '';
  };

  const getProductLoteNames = (product) => {
    const firstLote = product.lotes?.[0]?.nombre_lote;
    return firstLote ? [firstLote] : [];
  };

  const availableLoteNames = Array.from(new Set(products.flatMap(p => p.lotes?.map(lote => lote.nombre_lote) || [])));

  const normalizeInventory = (inventory) => {
    if (!inventory) return [];
    if (Array.isArray(inventory)) {
      return inventory.map(item => typeof item === 'string' || typeof item === 'number'
        ? { codigo_interno: String(item) }
        : item || { codigo_interno: '' }
      );
    }
    try {
      const parsed = JSON.parse(inventory);
      if (Array.isArray(parsed)) {
        return parsed.map(item => typeof item === 'string' || typeof item === 'number'
          ? { codigo_interno: String(item) }
          : item || { codigo_interno: '' }
        );
      }
      if (parsed && typeof parsed === 'object') {
        return [parsed];
      }
    } catch {
      // ignore parse errors
    }
    return [{ codigo_interno: String(inventory) }];
  };

  const sanitizeAlpha = (value) => {
    return String(value || "").toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ\s]+/gi, '');
  };

  const formatInventoryLabel = (inv) => {
    const code = inv?.codigo_interno || inv?.codigo || inv?.code || '';
    const talla = inv?.talla || '';
    if (!code) return '-';
    return talla ? `Código: ${code}   Talla: ${talla}` : `Código: ${code}`;
  };

  const filteredProducts = products.filter(product => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      String(product.idPrenda || '').toLowerCase().includes(term) ||
      product.nombre_prenda?.toLowerCase().includes(term) ||
      getCategoryName(product.idCategoria).toLowerCase().includes(term) ||
      String(product.precio_alquiler || '').toLowerCase().includes(term) ||
      (product.color || '').toLowerCase().includes(term)
    );
  });

  const addBatchItem = () => {
    const code = batchCode.trim().toUpperCase();
    const talla = batchTalla.trim().toUpperCase();
    if (!code) {
      setError('El código del lote no puede estar vacío.');
      return;
    }
    if (batchItems.some(item => item.code === code)) {
      setError('Ya agregaste ese código al lote.');
      return;
    }
    setBatchItems(prev => [...prev, { code, talla }]);
    setBatchCode("");
    setBatchTalla("");
    setError("");
  };

  const removeBatchItem = (code) => {
    setBatchItems(prev => prev.filter(item => item.code !== code));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (batchItems.length < 1) {
      setError('El producto debe tener al menos 1 prenda en el lote.');
      return;
    }
    setLoading(true);
    try {
      // enviar multipart/form-data si hay imágenes
      let res;
      if (productFiles && productFiles.length > 0) {
        const form = new FormData();
        form.append('nombre_prenda', productForm.nombre_prenda);
        form.append('idCategoria', productForm.idCategoria);
        form.append('precio_alquiler', productForm.precio_alquiler);
        form.append('color', productForm.color);
        form.append('descripcion', productForm.descripcion);
        if (productForm.nombre_lote) {
          form.append('lote_data', JSON.stringify({ nombre_lote: productForm.nombre_lote }));
        }
        if (batchItems.length > 0) {
          form.append('inventory_codes', JSON.stringify(batchItems.map(item => ({ codigo: item.code, talla: item.talla }))));
        }
        productFiles.slice(0,10).forEach(f => form.append('images', f));
        res = await api.post('/api/prendas', form);
        const data = res.data;
        setProducts(prev => [data.data, ...prev]);
        setProductForm({ ...emptyForm, idCategoria: String(categories[0]?.idCategoria || "") });
        setProductFiles([]);
        setBatchItems([]);
        setBatchCode("");
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
    if (!editingProduct) return;
    const existingCount = (editingProduct.inventory || []).filter(inv => !(editingProduct.removeInventoryIds || []).includes(inv.idInventario)).length;
    const newCount = (editingProduct.newInventoryCodes || []).length;
    if (existingCount + newCount < 1) {
      setError('El producto debe tener al menos 1 prenda en el lote.');
      return;
    }
    setLoading(true);
    try {
      // preparar formData para enviar cambios y archivos nuevos / eliminar imágenes
      const form = new FormData();
      form.append('nombre_prenda', editingProduct.nombre_prenda);
      form.append('idCategoria', editingProduct.idCategoria);
      form.append('precio_alquiler', editingProduct.precio_alquiler);
      form.append('color', editingProduct.color || '');
      form.append('descripcion', editingProduct.descripcion || '');
      if (editingProduct.removeLote) {
        form.append('remove_lote', '1');
      } else if (editingProduct.nombre_lote) {
        form.append('lote_data', JSON.stringify({ nombre_lote: editingProduct.nombre_lote }));
      }

      // imágenes a eliminar (marcadas en editingProduct.removeImageIds)
      if (editingProduct.removeImageIds && editingProduct.removeImageIds.length > 0) {
        form.append('remove_image_ids', JSON.stringify(editingProduct.removeImageIds));
      }

      // nuevas imágenes a subir
      if (editingProduct.newFiles && editingProduct.newFiles.length > 0) {
        editingProduct.newFiles.slice(0,10).forEach(f => form.append('images', f));
      }

      if (editingProduct.removeInventoryIds && editingProduct.removeInventoryIds.length > 0) {
        form.append('remove_inventory_ids', JSON.stringify(editingProduct.removeInventoryIds));
      }
      if (editingProduct.newInventoryCodes && editingProduct.newInventoryCodes.length > 0) {
        form.append('inventory_codes', JSON.stringify(editingProduct.newInventoryCodes));
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

      <div className="dashboard-container" style={{ maxWidth: 'none', width: '100%' }}>
        <div className="dashboard-header">
          <h1>Gestión de Productos</h1>
          <p>Agrega, edita y elimina productos del catálogo.</p>
        </div>

        {error && (
          <div className="toast-error" role="alert" aria-live="assertive">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div className="dashboard-card centered-card">
          <h2>Agregar Producto</h2>
          <form className="form-container" onSubmit={handleCreate}>
            <input type="text" placeholder="Nombre del producto" value={productForm.nombre_prenda}
              onChange={e => setProductForm({ ...productForm, nombre_prenda: e.target.value })} required />
            <select value={productForm.idCategoria}
              onChange={e => setProductForm({ ...productForm, idCategoria: e.target.value })} className="role-select">
              {categories.map(c => <option key={c.idCategoria} value={String(c.idCategoria)}>{c.nombre}</option>)}
            </select>
            <input type="number" placeholder="Precio alquiler" value={productForm.precio_alquiler}
              onChange={e => setProductForm({ ...productForm, precio_alquiler: e.target.value })} required />
            <div className="batch-suggest-wrapper">
              <label style={{ fontWeight: 600 }}>Lote disponible</label>
              <input
                type="text"
                placeholder="Selecciona o escribe un lote"
                value={productForm.nombre_lote}
                onChange={e => {
                  setProductForm({ ...productForm, nombre_lote: e.target.value });
                  setShowLoteSuggestionsAdd(true);
                }}
                onFocus={() => setShowLoteSuggestionsAdd(true)}
                onBlur={() => setTimeout(() => setShowLoteSuggestionsAdd(false), 120)}
                autoComplete="off"
              />
              {showLoteSuggestionsAdd && availableLoteNames.length > 0 && (
                <div className="batch-suggestions-dropdown">
                  {availableLoteNames
                    .filter(nombre => nombre.toLowerCase().includes(productForm.nombre_lote.toLowerCase()))
                    .slice(0, 10)
                    .map((nombre, index) => (
                      <button
                        key={index}
                        type="button"
                        onMouseDown={() => {
                          setProductForm({ ...productForm, nombre_lote: nombre });
                          setShowLoteSuggestionsAdd(false);
                        }}
                      >
                        {nombre}
                      </button>
                    ))}
                </div>
              )}
            </div>
            <input type="text" placeholder="Color" value={productForm.color}
              onChange={e => setProductForm({ ...productForm, color: sanitizeAlpha(e.target.value) })} required />
            <div className="batch-code-section">
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Prendas en inventario / códigos de lote <span style={{ color: '#dc2626' }}>*</span>
              </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Ej: INV-010"
                    value={batchCode}
                    onChange={e => setBatchCode(e.target.value)}
                    style={{ flex: 1, minWidth: 140 }}
                  />
                  <input
                    type="text"
                    placeholder="Talla (ej: S, M)"
                    value={batchTalla}
                    onChange={e => setBatchTalla(sanitizeAlpha(e.target.value))}
                    style={{ width: 120 }}
                  />
                  <button type="button" className="btn btn-secondary" onClick={addBatchItem}>
                    Agregar al lote
                  </button>
                </div>
              {batchItems.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ marginBottom: 6, fontSize: 14, color: '#555' }}>
                    Códigos agregados al lote ({batchItems.length}):
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {batchItems.map(item => (
                      <div key={item.code} className="batch-item-chip">
                        <span>{item.code}{item.talla ? ` — ${item.talla}` : ''}</span>
                        <button type="button" onClick={() => removeBatchItem(item.code)}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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

        <div style={{ width: '100%' }}>
          <h2>Productos registrados</h2>
          <div className="product-search-box">
            <input
              type="text"
              className="product-search-input"
              placeholder="Buscar por nombre, categoría o código"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <table className="data-table" style={{ width: '100%', minWidth: 1100, tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th>Miniatura</th>                
                <th>Nombre producto</th>
                <th>Categoría</th>
                <th>Precio alquiler</th>
                <th>Color</th>
                <th>Lotes</th>
                <th>Inventario</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
                {filteredProducts.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: "center" }}>{searchTerm ? "No hay productos que coincidan con la búsqueda." : "No hay productos."}</td></tr>
                ) : filteredProducts.map(product => {
                  const loteNames = getProductLoteNames(product);
                  const inventoryItems = normalizeInventory(product.inventory || []);
                  const tallas = Array.from(new Set(inventoryItems.map(item => item.talla).filter(Boolean)));
                  return (
                    <Fragment key={product.idPrenda}>
                      <tr>
                        <td data-label="Miniatura" style={{ padding: 0 }}>
                          {getProductThumbnail(product) ? (
                            <img
                              src={getProductThumbnail(product)}
                              alt={product.nombre_prenda}
                              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10 }}
                            />
                          ) : (
                            <div style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f2f2', color: '#666', borderRadius: 10, fontSize: 12 }}>
                              sin imagen
                            </div>
                          )}
                        </td>
                        <td data-label="Nombre producto" style={{ overflowWrap: 'break-word' }}>{product.nombre_prenda}</td>
                        <td data-label="Categoría">{getCategoryName(product.idCategoria)}</td>
                        <td data-label="Precio alquiler">{product.precio_alquiler}</td>
                        <td data-label="Color">{product.color || '-'}</td>
                        <td data-label="Lote" style={{ overflowWrap: 'break-word' }}>
                          {loteNames.length > 0 ? loteNames.join(', ') : '-'}
                        </td>
                        <td data-label="Inventario">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ marginBottom: 6, width: '100%' }}
                            onClick={() => toggleInventoryRow(product.idPrenda)}
                          >
                            Códigos
                          </button>
                          <button type="button" className="btn btn-secondary"
                            style={{ width: '100%' }}
                            onClick={() => toggleTallasRow(product.idPrenda) }>
                            Solo tallas
                          </button>
                        </td>
                        <td data-label="Acciones">
                          <div className="actions-cell">
                            <button type="button" className="btn btn-secondary" onClick={() => setEditingProduct({ ...product, nombre_lote: product.lotes?.[0]?.nombre_lote || '', removeLote: false })}>
                              Editar
                            </button>
                            <button type="button" className="btn btn-danger" onClick={() => handleDelete(product.idPrenda)}>
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedInventoryRows.includes(product.idPrenda) && (
                        <tr className="inventory-list-row">
                          <td colSpan="8" style={{ padding: 12 }}>
                            <strong>Códigos con talla:</strong>
                            <div className="inventory-list" style={{ marginTop: 8 }}>
                              {inventoryItems.length > 0 ? inventoryItems.map((item, index) => (
                                <span key={`code-${index}`} className="inventory-code-chip">
                                  {item.codigo_interno || item.codigo || item.code || '-'}{item.talla ? ` — ${item.talla}` : ''}
                                </span>
                              )) : <span>No hay códigos disponibles.</span>}
                            </div>
                          </td>
                        </tr>
                      )}
                      {expandedTallasRows.includes(product.idPrenda) && (
                        <tr className="tallas-list-row">
                          <td colSpan="8" style={{ padding: 12 }}>
                            <strong>Tallas:</strong>
                            <div className="inventory-list" style={{ marginTop: 8 }}>
                              {tallas.length > 0 ? tallas.map((talla, index) => (
                                <span key={`talla-${index}`} className="inventory-code-chip">
                                  {talla}
                                </span>
                              )) : <span>No hay tallas registradas.</span>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
        </div>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', overflow: 'visible' }}>
                  <label style={{ fontWeight: 600 }}>Lote disponible</label>
                  <input
                    type="text"
                    placeholder="Selecciona o escribe un lote"
                    value={editingProduct.nombre_lote || ''}
                    onChange={e => {
                      setEditingProduct({ ...editingProduct, nombre_lote: e.target.value, removeLote: false });
                      setShowLoteSuggestionsEdit(true);
                    }}
                    onFocus={() => setShowLoteSuggestionsEdit(true)}
                    onBlur={() => setTimeout(() => setShowLoteSuggestionsEdit(false), 120)}
                    autoComplete="off"
                  />
                  {showLoteSuggestionsEdit && availableLoteNames.length > 0 && (
                    <div className="batch-suggestions-dropdown">
                      {availableLoteNames
                        .filter(nombre => nombre.toLowerCase().includes((editingProduct.nombre_lote || '').toLowerCase()))
                        .slice(0, 10)
                        .map((nombre, index) => (
                          <button
                            key={index}
                            type="button"
                            onMouseDown={() => {
                              setEditingProduct({ ...editingProduct, nombre_lote: nombre });
                              setShowLoteSuggestionsEdit(false);
                            }}
                          >
                            {nombre}
                          </button>
                        ))}
                    </div>
                  )}
                  {editingProduct.lotes?.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ marginTop: 10, width: '100%' }}
                      onClick={() => setEditingProduct(prev => ({ ...prev, nombre_lote: '', removeLote: true, lotes: [] }))}
                    >
                      Eliminar lote
                    </button>
                  )}
                </div>
                <input type="text" placeholder="Color" value={editingProduct.color || ""}
                  onChange={e => setEditingProduct({ ...editingProduct, color: sanitizeAlpha(e.target.value) })} required />
                <textarea rows={10} placeholder="Descripción" value={editingProduct.descripcion || ""}
                  onChange={e => setEditingProduct({ ...editingProduct, descripcion: e.target.value })} required style={{resize:'vertical', overflowY:'auto'}} />

                <div style={{gridColumn:'1/-1'}}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Códigos de prenda</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Ej: INV-010"
                      value={editBatchCode}
                      onChange={e => setEditBatchCode(e.target.value)}
                      style={{ flex: 1, minWidth: 140 }}
                    />
                    <input
                      type="text"
                      placeholder="Talla (ej: S, M)"
                      value={editBatchTalla}
                      onChange={e => setEditBatchTalla(sanitizeAlpha(e.target.value))}
                      style={{ width: 120 }}
                    />
                    <button type="button" className="btn btn-secondary" onClick={addEditInventoryCode}>
                      Agregar al lote
                    </button>
                  </div>
                  <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                    {(editingProduct.inventory || []).filter(inv => !(editingProduct.removeInventoryIds || []).includes(inv.idInventario)).length > 0 && (
                      <div>
                        <div style={{ marginBottom: 6, fontSize: 14, color: '#555' }}>Códigos existentes:</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {(editingProduct.inventory || []).filter(inv => !(editingProduct.removeInventoryIds || []).includes(inv.idInventario)).map(inv => (
                            <div key={inv.idInventario} className="batch-item-chip">
                              <span>{inv.codigo_interno}{inv.talla ? ` — ${inv.talla}` : ''}</span>
                              <button type="button" onClick={() => removeExistingInventoryCode(inv.idInventario)}>✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(editingProduct.newInventoryCodes || []).length > 0 && (
                      <div>
                        <div style={{ marginBottom: 6, fontSize: 14, color: '#555' }}>Códigos nuevos:</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {(editingProduct.newInventoryCodes || []).map(item => {
                            const codeStr = typeof item === 'string' ? item : (item.codigo || item.code || item.codigo_interno);
                            const tallaStr = typeof item === 'string' ? '' : (item.talla || '');
                            return (
                              <div key={codeStr} className="batch-item-chip">
                                <span>{codeStr}{tallaStr ? ` — ${tallaStr}` : ''}</span>
                                <button type="button" onClick={() => removeNewInventoryCode(codeStr)}>✕</button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

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
      <Footer />
    </>
  );
}

export default ProductsAdmin;