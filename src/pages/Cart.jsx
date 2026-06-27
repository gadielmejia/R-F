import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import "../styles/cart.css"; // Ruta hacia tus estilos del carrito

function Cart() {
  const navigate = useNavigate();

  // 1. Estado del Modo Oscuro
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // 2. Estado para los productos del carrito
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Proteger la ruta por si no hay usuario
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) {
      navigate("/login");
    }
  }, [navigate]);

  const toggleTheme = () => {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);
    localStorage.setItem("theme", nextTheme ? "dark" : "light");
  };

  // Eliminar un producto específico del carrito
  const removeItem = (indexToRemove) => {
    const updatedCart = cartItems.filter((_, index) => index !== indexToRemove);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // Calcular el total de la orden
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    navigate("/login");
    localStorage.clear(); 
    navigate("/login");
  };

  // Pantalla de comprobante
  if (comprobante) {
    return (
      <>
        <nav className="app-nav">
          <div className="nav-inner">
            <Link to="/dashboarduser" className="brand">RentStyle</Link>
          </div>
        </nav>
        <section className="products-section">
          <div style={{
            maxWidth: "520px", margin: "3rem auto", background: "#fff",
            borderRadius: "16px", padding: "2.5rem", boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            border: "2px solid #1B5E20"
          }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "3rem" }}>✅</span>
              <h2 style={{ color: "#1B5E20", margin: "0.5rem 0" }}>¡Reserva confirmada!</h2>
              <p style={{ color: "#555" }}>Tu comprobante ha sido generado exitosamente.</p>
            </div>
            <div style={{ background: "#f9fafb", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: "0 0 1rem", color: "#1B5E20", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.5rem" }}>
                Comprobante #{comprobante.numero}
              </h3>
              <p><strong>Cliente:</strong> {comprobante.cliente}</p>
              <p><strong>Reserva #:</strong> {comprobante.idReserva}</p>
              <p><strong>Fecha evento:</strong> {comprobante.fechaEvento}</p>
              <p><strong>Período alquiler:</strong> {comprobante.fechaInicio} → {comprobante.fechaFin}</p>
              <p><strong>Prendas:</strong></p>
              <ul style={{ margin: "0.25rem 0 0.75rem 1rem" }}>
                {comprobante.prendas.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
              <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1B5E20", marginTop: "0.75rem" }}>
                Total: ${comprobante.total.toLocaleString()}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/mis-reservas")}
                style={{ flex: 1 }}
              >
                Ver mis reservas
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/agendar-cita")}
                style={{ flex: 1 }}
              >
                Agendar cita de medición
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <div className={`cart-page ${darkMode ? "dark" : ""}`}>
      
      {/* NAVBAR FIJO BLANCO (Idéntico a los anteriores) */}
      <nav className="login-nav">
        <div className="login-nav-inner">
          <h2 className="login-logo">RentStyle</h2>
          <div className="login-nav-links">
            <button className="theme-toggle-nav" onClick={toggleTheme} aria-label="Cambiar tema">
              <div className="theme-icon-nav"></div>
            </button>
            <Link to="/dashboarduser">Catálogo</Link>
            <Link to="/cart" className="active-link">Carrito</Link>
            <Link to="/citas">Citas</Link>
            <Link to="/profile">Perfil</Link>
            <button onClick={logout} className="logout-btn-nav">Cerrar sesión</button>
          </div>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="cart-container">
        <div className="cart-header">
          <h2>Mi Carrito</h2>
          <p>Revisa tus prendas seleccionadas antes de finalizar el pedido.</p>
        </div>

        {cartItems.length === 0 ? (
          /* ESTADO VACÍO (Tal cual se ve en tu imagen image_245e5f.png) */
          <div className="empty-cart-card">
            <h3>Tu carrito está vacío</h3>
            <p>Agrega prendas desde el catálogo.</p>
            <Link to="/dashboarduser" className="back-catalog-btn">Ir al Catálogo</Link>
          </div>
        ) : (
          /* ESTADO CON PRODUCTOS */
          <div className="cart-content-grid">
            
            {/* Lista de productos */}
            <div className="cart-items-list">
              {cartItems.map((item, index) => (
                <div key={index} className="cart-item-row">
                  <img src={item.image} alt={item.title} className="cart-item-img" />
                  <div className="cart-item-details">
                    <h4>{item.title}</h4>
                    <span className="cart-item-price">${item.price.toLocaleString("es-CO")}</span>
                  </div>
                  <button className="remove-item-btn" onClick={() => removeItem(index)} aria-label="Eliminar producto">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Resumen de pago */}
            <div className="cart-summary-card">
              <h3>Resumen del Pedido</h3>
              <hr className="summary-divider" />
              <div className="summary-row">
                <span>Productos ({cartItems.length})</span>
                <span>${calculateTotal().toLocaleString("es-CO")}</span>
              </div>
              <div className="summary-row">
                <span>Envío / Seguro</span>
                <span className="free-badge">Gratis</span>
              </div>
              <hr className="summary-divider" />
              <div className="summary-row total-row">
                <span>Total</span>
                <strong>${calculateTotal().toLocaleString("es-CO")}</strong>
              </div>
              <button className="checkout-btn" onClick={() => alert("¡Procediendo al pago seguro!")}>
                Finalizar Alquiler
              </button>
            </div>

          </div>
        ) 
        (
          <>
            <div className="products-grid">
              {cart.map((item, index) => (
                <article key={index} className="product-card card">
                  <div style={{ fontSize: "3rem", textAlign: "center", marginBottom: "0.5rem" }}>👗</div>
                  <h3>{item.title}</h3>
                  <strong style={{ color: "#1B5E20" }}>${Number(item.price).toLocaleString()}</strong>
                  <button onClick={() => removeFromCart(index)} className="btn btn-danger" style={{ marginTop: "0.75rem" }}>
                    Eliminar
                  </button>
                </article>
              ))}
            </div>

            {/* Fechas de alquiler */}
            <div className="card" style={{ maxWidth: "520px", margin: "2rem auto", padding: "1.5rem" }}>
              <h3 style={{ marginBottom: "1rem", color: "#1B5E20" }}>Selecciona las fechas</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    Fecha del evento
                  </label>
                  <input type="date" value={fechaEvento}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setFechaEvento(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }} />
                </div>
                <div>
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    Fecha de inicio del alquiler
                  </label>
                  <input type="date" value={fechaInicio}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setFechaInicio(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }} />
                </div>
                <div>
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    Fecha de fin del alquiler
                  </label>
                  <input type="date" value={fechaFin}
                    min={fechaInicio || new Date().toISOString().split("T")[0]}
                    onChange={e => setFechaFin(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db" }} />
                </div>
              </div>

              <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
                <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1B5E20" }}>
                  Total: ${total.toLocaleString()}
                </p>
                <button
                  className="btn btn-primary"
                  onClick={checkout}
                  disabled={loading}
                  style={{ width: "100%", marginTop: "0.75rem", padding: "12px" }}
                >
                  {loading ? "Procesando reserva..." : "Confirmar reserva"}
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* FOOTER FIJO BLANCO */}
      <Footer />
    </div>
  );
}

export default Cart;