import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { api } from "../utils/api";

function DashboardUser() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterTalla, setFilterTalla] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [filterPrecioMax, setFilterPrecioMax] = useState("");
  const [sortBy, setSortBy] = useState("nombre");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user || user.role !== "user") {
      navigate("/login", { replace: true });
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get("/prendas"),
        api.get("/categorias"),
      ]);
      const prodData = prodRes.data;
      const catData = catRes.data;
      setProducts(prodData.data || []);
      setCategories(catData.data || []);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const yaExiste = cart.find((i) => i.id === product.idPrenda);
    if (yaExiste) {
      alert("Esta prenda ya está en tu carrito.");
      return;
    }
    cart.push({
      id: product.idPrenda,
      title: product.nombre_prenda,
      price: Number(product.precio_alquiler),
    });
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("✅ Prenda agregada al carrito.");
  };

  const getCategoryName = (idCategoria) => {
    const cat = categories.find((c) => String(c.idCategoria) === String(idCategoria));
    return cat?.nombre || "";
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

  const user = JSON.parse(localStorage.getItem("currentUser") || "{}");

  return (
    <>
      <nav className="app-nav">
        <div className="nav-inner">
          <Link to="/dashboarduser" className="brand">RentStyle</Link>
          <div className="nav-actions">
            <Link to="/cart">Carrito</Link>
            <Link to="/profile">Perfil</Link>
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <section className="products-section">
        <div className="section-header">
          <h2>Bienvenido, {user.nombre}</h2>
          <p>Descubre nuestras prendas disponibles para alquiler</p>
        </div>

        {/* Buscador y filtros */}
        <div style={{
          background: "#f9fafb", border: "1px solid #e5e7eb",
          borderRadius: "12px", padding: "1.25rem",
          marginBottom: "1.5rem", display: "flex",
          flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end"
        }}>
          {/* Buscador */}
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px", color: "#374151" }}>
              Buscar
            </label>
            <input
              type="text"
              placeholder="Nombre o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px",
                border: "1px solid #d1d5db", fontSize: "0.9rem" }}
            />
          </div>

          {/* Categoría */}
          <div style={{ flex: "1 1 150px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px", color: "#374151" }}>
              Categoría
            </label>
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px",
                border: "1px solid #d1d5db", fontSize: "0.9rem", background: "#fff" }}
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.idCategoria} value={String(c.idCategoria)}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Talla */}
          <div style={{ flex: "1 1 120px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px", color: "#374151" }}>
              Talla
            </label>
            <select
              value={filterTalla}
              onChange={(e) => setFilterTalla(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px",
                border: "1px solid #d1d5db", fontSize: "0.9rem", background: "#fff" }}
            >
              <option value="">Todas</option>
              {tallas.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Color */}
          <div style={{ flex: "1 1 120px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px", color: "#374151" }}>
              Color
            </label>
            <select
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px",
                border: "1px solid #d1d5db", fontSize: "0.9rem", background: "#fff" }}
            >
              <option value="">Todos</option>
              {colores.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Precio máximo */}
          <div style={{ flex: "1 1 140px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px", color: "#374151" }}>
              Precio máximo
            </label>
            <input
              type="number"
              placeholder="Ej: 200000"
              value={filterPrecioMax}
              onChange={(e) => setFilterPrecioMax(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px",
                border: "1px solid #d1d5db", fontSize: "0.9rem" }}
            />
          </div>

          {/* Ordenar */}
          <div style={{ flex: "1 1 160px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px", color: "#374151" }}>
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px",
                border: "1px solid #d1d5db", fontSize: "0.9rem", background: "#fff" }}
            >
              <option value="nombre">Nombre A-Z</option>
              <option value="precio_asc">Precio: menor a mayor</option>
              <option value="precio_desc">Precio: mayor a menor</option>
            </select>
          </div>

          {/* Limpiar filtros */}
          {hayFiltros && (
            <button
              onClick={clearFilters}
              style={{ padding: "8px 16px", borderRadius: "8px", border: "none",
                background: "#ef4444", color: "#fff", fontWeight: 600,
                cursor: "pointer", fontSize: "0.9rem", alignSelf: "flex-end" }}
            >
              Limpiar filtros
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
                <div style={{
                  background: "#f3f4f6", borderRadius: "8px",
                  height: "140px", display: "flex", alignItems: "center",
                  justifyContent: "center", marginBottom: "0.75rem",
                  fontSize: "2.5rem"
                }}>
                  👗
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
    </>
  );
}

export default DashboardUser;