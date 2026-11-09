import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Nav from "./Nav";
import Footer from "./Footer";
import { getProducts } from "../services/productService";
import { useTheme } from "../context/ThemeContext";
import "../styles/styles.css";

function Inicio() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  // Modal de "requiere iniciar sesión"
  const [authModal, setAuthModal] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await getProducts();
      const data = res.data || res;
      setProducts(data.data || data || []);
    } catch (err) {
      console.error("Error cargando productos de inicio", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const getProductImage = (product) => {
    return product?.images?.[0]?.url || "";
  };

  const getCategoryName = (idCategoria) => {
    // Mapeo simple de categoría por nombre si no se trae el catálogo
    const names = { 1: "Mujer", 2: "Hombre", 3: "Niño", 4: "Accesorios" };
    return names[idCategoria] || "";
  };

  const getTallasDisponibles = (product) => {
    if (!product?.inventory) return [];
    return [
      ...new Set(
        product.inventory
          .filter((inv) => inv.estado === "Disponible")
          .map((inv) => inv.talla)
          .filter(Boolean)
      ),
    ];
  };

  const openAuthModal = () => setAuthModal(true);
  const closeAuthModal = () => setAuthModal(false);

  return (
    <div className={`inicio-page ${theme === "dark" ? "dark" : ""}`}>
      <Nav />
      <section className="hero">
        <div className="hero-card">
          <div className="hero-copy">
            <p className="eyebrow">Elegancia bajo demanda</p>
            <h1>RentStyle</h1>
            <p>
              Alquila atuendos cuidadosamente seleccionados para cada ocasión.
              Diseño fresco, accesible y con estilo para tus eventos más
              especiales.
            </p>
          </div>
          <div className="hero-tag">
            <h3>Tu armario premium </h3>
            <p>
              Explora tus looks de gala, cóctel y eventos especiales con colores
              suaves y detalles cuidadosamente pensados
            </p>
          </div>
        </div>
      </section>

      {/* Catálogo de prendas para usuarios no registrados */}
      <section className="products-section">
        <div className="section-header">
          <h2>Prendas disponibles</h2>
          <p>
            Explora nuestro catálogo. Para alquilar, inicia sesión o regístrate.
          </p>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", padding: "2rem" }}>
            Cargando prendas...
          </p>
        ) : (
          <div className="products-grid">
            {products.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", gridColumn: "1/-1" }}>
                <p style={{ fontSize: "1.1rem", color: "#6b7280" }}>
                  No hay prendas disponibles en este momento.
                </p>
              </div>
            ) : (
              products.map((p) => (
                <article key={p.idPrenda} className="card product-card">
                  <div className="product-card-image">
                    {getProductImage(p) ? (
                      <img src={getProductImage(p)} alt={p.nombre_prenda} />
                    ) : (
                      <div className="product-card-image-empty">👗</div>
                    )}
                  </div>
                  {getCategoryName(p.idCategoria) && (
                    <span style={{
                      background: "#E8F5E9",
                      color: "#1B5E20",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "10px",
                      marginBottom: "0.5rem",
                      display: "inline-block",
                    }}>
                      {getCategoryName(p.idCategoria)}
                    </span>
                  )}
                  <div className="product-card-content">
                    <h3 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1rem" }}>
                      {p.nombre_prenda}
                    </h3>
                    {/* Tallas disponibles (solo nombres, sin disponibilidad) */}
                    {getTallasDisponibles(p).length > 0 && (
                      <div style={{ marginTop: "6px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {getTallasDisponibles(p).map((talla) => (
                          <span
                            key={talla}
                            style={{
                              padding: "5px 8px",
                              borderRadius: 8,
                              fontSize: "0.88rem",
                              display: "inline-flex",
                              alignItems: "center",
                              background: "#f0fdf4",
                              color: "#14532d",
                              border: "1px solid #bbf7d0",
                              fontWeight: 600,
                            }}
                          >
                            Talla {talla}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.descripcion && (
                      <p className="card-description" style={{ fontSize: "0.9rem", color: "#4d634e", marginTop: "8px" }}>
                        {p.descripcion}
                      </p>
                    )}
                    <div className="product-meta-row" style={{ marginTop: "auto" }}>
                      <span className="meta-pill" style={{ fontWeight: 700, color: "#14532d" }}>
                        ${Number(p.precio_alquiler).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
                      <button
                        className="btn btn-primary"
                        onClick={openAuthModal}
                        style={{ flex: 1 }}
                      >
                        Agregar al carrito
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </section>

      <Footer />

      {/* Modal: requiere iniciar sesión o registrarse */}
      {authModal && (
        <div className="auth-modal-overlay" onClick={closeAuthModal}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={closeAuthModal} aria-label="Cerrar">
              ×
            </button>
            <div className="auth-modal-icon">🔐</div>
            <h2 style={{ marginBottom: "0.75rem", textAlign: "center" }}>
              Inicia sesión para continuar
            </h2>
            <p style={{ textAlign: "center", color: "#4d634e", marginBottom: "1.5rem" }}>
              Para agregar prendas al carrito y alquilar, debes iniciar sesión o
              crear una cuenta.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link to="/login">
                <button className="auth-btn auth-btn-login" style={{ width: "100%" }}>
                  Iniciar sesión
                </button>
              </Link>
              <Link to="/registro">
                <button className="auth-btn auth-btn-register" style={{ width: "100%" }}>
                  Registrarse
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inicio;
