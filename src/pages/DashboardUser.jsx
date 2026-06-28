import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { api } from "../utils/api";
import { useTheme } from "../context/ThemeContext"; 
import "../styles/dashboardUser.css";
import vestidoverde from "../assets/vestidoverde.jpg";
import vestidonegro from "../assets/vestidonregro.jpg";
import vestidoazul from "../assets/vestidoazul.png";
import vestidorojo from "../assets/vestidorojo.png";
import vestidodorado from "../assets/vestidodorado.png";

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

  // --- ESTADOS PARA LA NOTIFICACIÓN ESTILO APPLE ---
  const [toast, setToast] = useState({ show: false, message: "" });
  const [toastTimeoutId, setToastTimeoutId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/api/prendas'),
        api.get('/api/categorias'),
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

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const item = {
      id: product.idPrenda,
      title: product.nombre_prenda,
      price: Number(product.precio_alquiler),
      image: getProductImage(product),
    };

    cart.push(item);
    localStorage.setItem("cart", JSON.stringify(cart));
    
    if (toastTimeoutId) clearTimeout(toastTimeoutId);

    setToast({ show: true, message: `"${item.title}" se agregó al carrito.` });
    const newTimeout = setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 3000);
    setToastTimeoutId(newTimeout);
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
      
      {/* NOTIFICACIÓN ESTILO APPLE (Sutil y flotante) */}
      <div className={`apple-notification-toast ${toast.show ? "show" : ""}`}>
        <div className="apple-toast-blur-bg"></div>
        <div className="apple-toast-inner">
          <div className="apple-toast-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
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
                <div style={{
                  width: "100%",
                  minHeight: "160px",
                  borderRadius: "14px",
                  overflow: "hidden",
                  marginBottom: "0.75rem",
                  background: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {getProductImage(p) ? (
                    <img
                      src={getProductImage(p)}
                      alt={p.nombre_prenda}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "160px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2.5rem"
                    }}>
                      👗
                    </div>
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
                <h3 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1rem" }}>
                  {p.nombre_prenda}
                </h3>
                {p.descripcion && (
                  <p style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: "0.5rem" }}>
                    {p.descripcion}
                  </p>
                )}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                  {p.talla && (
                    <span style={{ background: "#e5e7eb", borderRadius: "6px",
                      padding: "2px 8px", fontSize: "0.78rem", fontWeight: 600 }}>
                      Talla {p.talla}
                    </span>
                  )}
                  {p.color && (
                    <span style={{ background: "#e5e7eb", borderRadius: "6px",
                      padding: "2px 8px", fontSize: "0.78rem" }}>
                      {p.color}
                    </span>
                  )}
                </div>
                <strong style={{ fontSize: "1.1rem", color: "#1B5E20", display: "block", marginBottom: "0.75rem" }}>
                  ${Number(p.precio_alquiler).toLocaleString()}
                </strong>
                <button className="btn btn-primary" onClick={() => addToCart(p)}>
                  Agregar al carrito
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

export default DashboardUser;