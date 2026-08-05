import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { getProducts } from "../services/productService";
import { getCategories } from "../services/categoryService";
import { useTheme } from "../context/ThemeContext"; 
import "../styles/dashboardUser.css";


function DashboardUser() {
  const navigate = useNavigate();
  
  const { theme, toggleTheme } = useTheme();

  const [userName] = useState(() => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    return user ? (user.nombre || "Alejandro") : "Alejandro";
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterTalla, setFilterTalla] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [filterPrecioMax, setFilterPrecioMax] = useState("");
  const [sortBy, setSortBy] = useState("nombre");
  const [loading, setLoading] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Modal para seleccionar talla y cantidad
  const [modalProduct, setModalProduct] = useState(null);
  const [selectedTalla, setSelectedTalla] = useState("");
  const [selectedCantidad, setSelectedCantidad] = useState(1);

  // --- ESTADOS PARA LA NOTIFICACIÓN ESTILO APPLE ---
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [toastTimeoutId, setToastTimeoutId] = useState(null);
  const [duplicateConfirm, setDuplicateConfirm] = useState(false);
  const [pendingAddItems, setPendingAddItems] = useState([]);
  const [pendingDuplicateMessage, setPendingDuplicateMessage] = useState("");
  const [carouselIndexById, setCarouselIndexById] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);
      const prodData = prodRes.data || prodRes;
      const catData = catRes.data || catRes;
      setProducts(prodData.data || prodData || []);
      setCategories(catData.data || catData || []);
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGreeting(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user || user.role !== "user") {
      navigate("/login");
      return;
    }
    loadData();
  }, [navigate]);

  const handleToggleTheme = () => {
    toggleTheme();
  };

  const getCategoryName = (idCategoria) => {
    const cat = categories.find((c) => String(c.idCategoria) === String(idCategoria));
    return cat?.nombre || "";
  };

  const getProductImage = (product) => {
    return product?.images?.[0]?.url || "";
  };

  const getAvailabilityLabel = (product) => {
    const availableCount = product?.inventory?.filter(inv => inv.estado === 'Disponible').length || 0;
    if (availableCount === 1) return "Prenda única";
    if (availableCount > 1) return `${availableCount} unidades disponibles`;
    return "Sin unidades";
  };

  const openProductModal = (product) => setSelectedProduct(product);
  const closeProductModal = () => setSelectedProduct(null);

  const openSizeModal = (product) => {
    setModalProduct(product);
    setSelectedTalla("");
    setSelectedCantidad(1);
  };

  const closeSizeModal = () => {
    setModalProduct(null);
    setSelectedTalla("");
    setSelectedCantidad(1);
  };

  const getProductImageIndex = (product) => {
    const total = product?.images?.length || 0;
    if (!total) return 0;
    return carouselIndexById[product.idPrenda] || 0;
  };

  const setProductImageIndex = (productId, index) => {
    setCarouselIndexById((prev) => ({
      ...prev,
      [productId]: index,
    }));
  };

  const prevProductImage = (product) => {
    const total = product?.images?.length || 0;
    if (!total) return;
    const nextIndex = (getProductImageIndex(product) - 1 + total) % total;
    setProductImageIndex(product.idPrenda, nextIndex);
  };

  const nextProductImage = (product) => {
    const total = product?.images?.length || 0;
    if (!total) return;
    const nextIndex = (getProductImageIndex(product) + 1) % total;
    setProductImageIndex(product.idPrenda, nextIndex);
  };

  const getProductImageForDisplay = (product) => {
    const images = product?.images || [];
    const index = getProductImageIndex(product);
    return images[index]?.url || "";
  };

  const getTallasDisponibles = (product) => {
    if (!product?.inventory) return [];
    return [...new Set(product.inventory.filter(inv => inv.estado === 'Disponible').map((inv) => inv.talla).filter(Boolean))];
  };

  const getTallasWithStatus = (product) => {
    if (!product?.inventory) return [];
    const tallas = [...new Set(product.inventory.map(inv => inv.talla).filter(Boolean))];
    return tallas.map(talla => {
      const invs = product.inventory.filter(inv => inv.talla === talla);
      const available = invs.some(i => i.estado === 'Disponible');
      let estado = 'Sin disponibilidad';
      if (invs.some(i => i.estado === 'Alquilado')) estado = 'Alquilado';
      else if (invs.some(i => i.estado === 'Reservado')) estado = 'Reservado';
      else if (available) estado = 'Disponible';
      return { talla, available, estado };
    });
  };

  // Muestra la notificación estilo Apple (éxito o error) y la oculta sola a los 3s
  const showToast = (message, type = "success") => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    setToast({ show: true, message, type });
    const newTimeout = setTimeout(() => {
      setToast({ show: false, message: "", type });
    }, 3000);
    setToastTimeoutId(newTimeout);
  };

  const addItemsToCart = (itemsToAdd) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push(...itemsToAdd);
    localStorage.setItem("cart", JSON.stringify(cart));

    const addedTitle = itemsToAdd[0]?.title || modalProduct.nombre_prenda;
    const addedTalla = itemsToAdd[0]?.talla || selectedTalla;
    const addedCantidad = itemsToAdd.length;
    showToast(`"${addedTitle}" (Talla ${addedTalla}, Cantidad ${addedCantidad}) se agregó al carrito.`, "success");

    setDuplicateConfirm(false);
    setPendingAddItems([]);
    setPendingDuplicateMessage("");
    closeSizeModal();
  };

  const confirmarAgregarCarrito = () => {
    if (!selectedTalla) {
      showToast("Por favor selecciona una talla.", "error");
      return;
    }
    if (selectedCantidad < 1) {
      showToast("La cantidad debe ser al menos 1.", "error");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const alreadyInCartCount = cart.filter(
      (item) => item.id === modalProduct.idPrenda && item.talla === selectedTalla
    ).length;

    const availableItems = modalProduct.inventory?.filter(
      (inv) =>
        inv.talla === selectedTalla &&
        inv.estado === "Disponible" &&
        !cart.some((item) => item.idInventario === inv.idInventario)
    ) || [];

    if (availableItems.length < selectedCantidad) {
      if (alreadyInCartCount > 0) {
        showToast(`Ya tienes ${alreadyInCartCount} unidad(es) de esta prenda en talla ${selectedTalla} en el carrito. Solo hay ${availableItems.length} unidad(es) adicionales disponibles.`, "error");
      } else {
        showToast(`No hay suficientes unidades disponibles en talla ${selectedTalla}. Disponibles: ${availableItems.length}`, "error");
      }
      return;
    }

    const itemsToAdd = availableItems.slice(0, selectedCantidad).map((inv) => ({
      id: modalProduct.idPrenda,
      idInventario: inv.idInventario,
      title: modalProduct.nombre_prenda,
      price: Number(modalProduct.precio_alquiler),
      image: getProductImage(modalProduct),
      talla: selectedTalla,
      cantidad: 1,
    }));

    const alreadyAdded = alreadyInCartCount > 0;
    if (alreadyAdded) {
      setPendingAddItems(itemsToAdd);
      setPendingDuplicateMessage(`Ya tienes esta prenda en talla ${selectedTalla} en el carrito. ¿Deseas agregarla de nuevo?`);
      setDuplicateConfirm(true);
      return;
    }

    addItemsToCart(itemsToAdd);
  };

  const handleConfirmDuplicateAdd = () => {
    if (pendingAddItems.length === 0) {
      setDuplicateConfirm(false);
      setPendingDuplicateMessage("");
      return;
    }
    setDuplicateConfirm(false);
    setPendingDuplicateMessage("");
    addItemsToCart(pendingAddItems);
  };

  const handleCancelDuplicateAdd = () => {
    setDuplicateConfirm(false);
    setPendingAddItems([]);
    setPendingDuplicateMessage("");
  };

  const addToCart = (product) => {
    openSizeModal(product);
  };

  // Tallas y colores únicos para los filtros
  const tallas = useMemo(() =>
    [...new Set(products.map((p) => p.talla).filter(Boolean))], [products]);
  const colores = useMemo(() =>
    [...new Set(products.map((p) => p.color).filter(Boolean))], [products]);

  // Aplicar filtros
  const filtered = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.nombre_prenda?.toLowerCase().includes(q) ||
        p.descripcion?.toLowerCase().includes(q)
      );
    }
    if (filterCategoria) {
      result = result.filter((p) => String(p.idCategoria) === filterCategoria);
    }
    if (filterTalla) {
      result = result.filter((p) => p.talla === filterTalla);
    }
    if (filterColor) {
      result = result.filter((p) => p.color?.toLowerCase() === filterColor.toLowerCase());
    }
    if (filterPrecioMax) {
      result = result.filter((p) => Number(p.precio_alquiler) <= Number(filterPrecioMax));
    }

    // Ordenar
    result.sort((a, b) => {
      if (sortBy === "precio_asc") return Number(a.precio_alquiler) - Number(b.precio_alquiler);
      if (sortBy === "precio_desc") return Number(b.precio_alquiler) - Number(a.precio_alquiler);
      return a.nombre_prenda?.localeCompare(b.nombre_prenda);
    });

    return result;
  }, [products, search, filterCategoria, filterTalla, filterColor, filterPrecioMax, sortBy]);

  const clearFilters = () => {
    setSearch("");
    setFilterCategoria("");
    setFilterTalla("");
    setFilterColor("");
    setFilterPrecioMax("");
    setSortBy("nombre");
  };

  const hayFiltros = search || filterCategoria || filterTalla || filterColor || filterPrecioMax;

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className={`dashboard-page ${theme === "dark" ? "dark" : ""}`}>
      
      {/* NOTIFICACIÓN ESTILO APPLE (Sutil y flotante) — verde en éxito, roja en error */}
      <div className={`apple-notification-toast ${toast.show ? "show" : ""} ${toast.type === "error" ? "toast-error" : ""}`}>
        <div className="apple-toast-blur-bg"></div>
        <div className="apple-toast-inner">
          <div className="apple-toast-icon-wrapper">
            {toast.type === "error" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            )}
          </div>
          <div className="apple-toast-info">
            <span className="apple-toast-app-name">RentStyle</span>
            <p className="apple-toast-text">{toast.message || "Producto añadido"}</p>
          </div>
        </div>
      </div>

      {/* Menú de navegación fijo en blanco */}
      <nav className="login-nav">
        <div className="login-nav-inner">
          <h2 className="login-logo">RentStyle</h2>
          <div className="login-nav-links">
            <button className="theme-toggle-nav" onClick={handleToggleTheme} aria-label="Cambiar tema">
              <div className="theme-icon-nav"></div>
            </button>
            <Link to="/cart">Carrito</Link>
            <Link to="/Citas">Citas</Link>
            <Link to="/profile">Perfil</Link>
            <button onClick={logout} className="logout-btn-nav">Cerrar sesión</button>
          </div>
        </div>
      </nav>

      {/* Catálogo de Productos */}
      <section className="products-section">
        <div className={`greeting-wrapper ${!showGreeting ? "hidden" : ""}`}>
          <div className="section-header animated-header">
            <h2 className="greeting-title">
              ¡Hola, <span className="gradient-name">{userName}</span>!
              <svg className="greeting-svg" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L14.8 8.4L21.2 11.2L14.8 14L12 20.4L9.2 14L2.8 11.2L9.2 8.4L12 2Z" />
                <path d="M19 3L19.8 4.8L21.6 5.6L19.8 6.4L19 8.2L18.2 6.4L16.4 5.6L18.2 4.8L19 3Z" opacity="0.6" />
              </svg>
            </h2>
            <p>Descubre nuestros productos disponibles para ti</p>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="filters-bar">
          <div className="filter-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Buscar prendas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar prendas"
            />
          </div>

          <select
            className="filter-select"
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.idCategoria} value={c.idCategoria}>
                {c.nombre}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filterTalla}
            onChange={(e) => setFilterTalla(e.target.value)}
            aria-label="Filtrar por talla"
          >
            <option value="">Todas las tallas</option>
            {tallas.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filterColor}
            onChange={(e) => setFilterColor(e.target.value)}
            aria-label="Filtrar por color"
          >
            <option value="">Todos los colores</option>
            {colores.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="number"
            className="filter-number"
            placeholder="Precio máx."
            value={filterPrecioMax}
            onChange={(e) => setFilterPrecioMax(e.target.value)}
            min="0"
            aria-label="Precio máximo"
          />

          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Ordenar por"
          >
            <option value="nombre">Nombre A-Z</option>
            <option value="precio_asc">Precio: menor a mayor</option>
            <option value="precio_desc">Precio: mayor a menor</option>
          </select>

          {hayFiltros && (
            <button type="button" className="filter-clear-btn" onClick={clearFilters}>
              Limpiar filtros ✕
            </button>
          )}
        </div>

        {/* Resultados */}
        <p style={{ marginBottom: "1rem", color: "#6b7280", fontSize: "0.9rem" }}>
          {filtered.length} prenda{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
          {hayFiltros && " con los filtros aplicados"}
        </p>

        {loading ? (
          <p style={{ textAlign: "center", padding: "2rem" }}>Cargando prendas...</p>
        ) : (
          <div className="products-grid">
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", gridColumn: "1/-1" }}>
                <p style={{ fontSize: "1.1rem", color: "#6b7280" }}>
                  No hay prendas que coincidan con los filtros.
                </p>
                <button onClick={clearFilters}
                  style={{ marginTop: "1rem", padding: "8px 20px", borderRadius: "8px",
                    border: "none", background: "#1B5E20", color: "#fff",
                    cursor: "pointer", fontWeight: 600 }}>
                  Ver todas las prendas
                </button>
              </div>
            ) : filtered.map((p) => (
              <article key={p.idPrenda} className="product-card card">
                <div className="product-card-image">
                  {getProductImage(p) ? (
                    <img
                      src={getProductImage(p)}
                      alt={p.nombre_prenda}
                    />
                  ) : (
                    <div className="product-card-image-empty">👗</div>
                  )}
                </div>
                <span style={{
                  background: "#E8F5E9", color: "#1B5E20",
                  fontSize: "0.75rem", fontWeight: 600,
                  padding: "2px 8px", borderRadius: "10px", marginBottom: "0.5rem",
                  display: "inline-block"
                }}>
                  {getCategoryName(p.idCategoria)}
                </span>
                <div className="product-card-content">
                  <h3 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1rem" }}>
                    {p.nombre_prenda}
                  </h3>
                  <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {getTallasWithStatus(p).map(s => (
                      <span
                        key={s.talla}
                        className={`size-pill ${s.available ? '' : 'unavailable'}`}
                        style={{
                          margin: '5px',
                          padding: '5px 8px',
                          borderRadius: 8,
                          fontSize: '0.88rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 36,
                          background: s.available ? undefined : '#fff1f2',
                          color: s.available ? undefined : '#7f1d1d'
                        }}
                      >
                        {s.talla}{!s.available ? ` • ${s.estado}` : ''}
                      </span>
                    ))}
                  </div>
                  {p.descripcion && (
                    <p className="card-description">{p.descripcion}</p>
                  )}
                  <div className="product-meta-row">
                    {p.talla && (
                      <span className="meta-pill">Talla {p.talla}</span>
                    )}
                    {p.color && (
                      <span className="meta-pill">{p.color}</span>
                    )}
                    <span className={`meta-pill ${p.inventory?.length === 1 ? 'unique' : ''}`}>
                      {getAvailabilityLabel(p)}
                    </span>
                  </div>
                  <strong style={{ fontSize: "1.1rem", color: "#1B5E20", display: "block", marginBottom: "0.75rem" }}>
                    ${Number(p.precio_alquiler).toLocaleString()}
                  </strong>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary card-detail-btn" onClick={() => openProductModal(p)}>
                      Ver más
                    </button>
                    <button className="btn btn-primary" onClick={() => addToCart(p)}>
                      Agregar al carrito
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedProduct && (
        <div className="modal-overlay" onClick={closeProductModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeProductModal} aria-label="Cerrar detalle">×</button>
            <div className="detail-grid">
              <div className="detail-image">
                {getProductImageForDisplay(selectedProduct) ? (
                  <img src={getProductImageForDisplay(selectedProduct)} alt={selectedProduct.nombre_prenda} />
                ) : (
                  <div className="detail-image-empty">👗</div>
                )}

                {selectedProduct.images?.length > 1 && (
                  <>
                    <div className="carousel-counter">
                      {getProductImageIndex(selectedProduct) + 1}/{selectedProduct.images.length}
                    </div>
                    <button
                      className="carousel-button prev"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        prevProductImage(selectedProduct);
                      }}
                      aria-label="Imagen anterior"
                    >
                      ‹
                    </button>
                    <button
                      className="carousel-button next"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        nextProductImage(selectedProduct);
                      }}
                      aria-label="Siguiente imagen"
                    >
                      ›
                    </button>
                    <div className="carousel-indicators">
                      {selectedProduct.images.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`carousel-indicator ${getProductImageIndex(selectedProduct) === index ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductImageIndex(selectedProduct.idPrenda, index);
                          }}
                          aria-label={`Ver imagen ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="detail-info">
                <span className="category">
                  {getCategoryName(selectedProduct.idCategoria)}
                </span>
                <h2>{selectedProduct.nombre_prenda}</h2>
                <p className="detail-meta">
                  {selectedProduct.talla ? `Talla ${selectedProduct.talla}` : ''}
                  {selectedProduct.color ? ` · ${selectedProduct.color}` : ''}
                </p>
                <div style={{ marginTop: '8px' }}>
                  {getTallasWithStatus(selectedProduct).map(s => (
                    <span
                      key={s.talla}
                      className={`detail-size-pill ${s.available ? 'available' : 'unavailable'}`}
                      style={{
                        marginRight: '8px',
                        marginBottom: '6px',
                        padding: '5px 8px',
                        borderRadius: 8,
                        display: 'inline-flex'
                      }}
                    >
                      {s.available ? `Talla ${s.talla}` : `Talla ${s.talla} (${s.estado})`}
                    </span>
                  ))}
                </div>
                <p className="detail-availability">{getAvailabilityLabel(selectedProduct)}</p>
                <p className="detail-description">{selectedProduct.descripcion}</p>
                <strong className="detail-price">
                  ${Number(selectedProduct.precio_alquiler).toLocaleString()}
                </strong>
                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => { addToCart(selectedProduct); }}>
                    Agregar al carrito
                  </button>
                  <button className="btn btn-secondary" onClick={closeProductModal}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de selección de talla y cantidad */}
      {modalProduct && (
        <div className="modal-overlay" onClick={closeSizeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <button className="modal-close" onClick={closeSizeModal} aria-label="Cerrar">×</button>
            <h2 style={{ marginBottom: "1.5rem", textAlign: "center" }}>Selecciona Talla y Cantidad</h2>
            
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "0.75rem" }}>
                Talla:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(60px, 1fr))", gap: "0.5rem" }}>
                {getTallasDisponibles(modalProduct).map((talla) => (
                  <button
                    key={talla}
                    onClick={() => setSelectedTalla(talla)}
                    style={{
                      padding: "0.75rem",
                      border: selectedTalla === talla ? "2px solid #1B5E20" : "1px solid #d1d5db",
                      background: selectedTalla === talla ? "#E8F5E9" : "#fff",
                      color: selectedTalla === talla ? "#1B5E20" : "#374151",
                      borderRadius: "8px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {talla}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "0.75rem" }}>
                Cantidad:
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button
                  onClick={() => setSelectedCantidad(Math.max(1, selectedCantidad - 1))}
                  style={{
                    padding: "0.5rem 0.75rem",
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  value={selectedCantidad}
                  onChange={(e) => setSelectedCantidad(Math.max(1, Number(e.target.value)))}
                  style={{
                    flex: 1,
                    padding: "0.5rem 0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    textAlign: "center",
                    fontSize: "1rem",
                    fontWeight: "600"
                  }}
                  min="1"
                />
                <button
                  onClick={() => setSelectedCantidad(selectedCantidad + 1)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn btn-primary" onClick={confirmarAgregarCarrito} style={{ flex: 1 }}>
                Agregar al carrito
              </button>
              <button className="btn btn-secondary" onClick={closeSizeModal} style={{ flex: 1 }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {duplicateConfirm && (
        <div className="modal-overlay" onClick={handleCancelDuplicateAdd}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <button className="modal-close" onClick={handleCancelDuplicateAdd} aria-label="Cerrar">×</button>
            <h2 style={{ marginBottom: "1rem", textAlign: "center" }}>Confirmar acción</h2>
            <p style={{ marginBottom: "1.5rem", color: "#334155", lineHeight: 1.6 }}>
              {pendingDuplicateMessage}
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn btn-primary" onClick={handleConfirmDuplicateAdd} style={{ flex: 1 }}>
                Sí, agregar de nuevo
              </button>
              <button className="btn btn-secondary" onClick={handleCancelDuplicateAdd} style={{ flex: 1 }}>
                No, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default DashboardUser;