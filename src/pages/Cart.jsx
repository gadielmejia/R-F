import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { useTheme } from "../context/ThemeContext";
import "../styles/cart.css";

function Cart() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) {
      navigate("/login");
    }
  }, [navigate]);

  const removeItem = (indexToRemove) => {
    const updatedCart = cartItems.filter((_, index) => index !== indexToRemove);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + Number(item.price || 0), 0);
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const checkout = () => {
    if (cartItems.length === 0) {
      alert("No hay prendas en el carrito.");
      return;
    }
    alert("¡Procediendo al pago seguro!");
  };

  return (
    <div className={`cart-page ${theme === "dark" ? "dark" : ""}`}>
      <nav className="login-nav">
        <div className="login-nav-inner">
          <h2 className="login-logo">RentStyle</h2>
          <div className="login-nav-links">
            <button className="theme-toggle-nav" onClick={toggleTheme} aria-label="Cambiar tema">
              <div className="theme-icon-nav" />
            </button>
            <Link to="/dashboarduser">Catálogo</Link>
            <Link to="/cart" className="active-link">Carrito</Link>
            <Link to="/citas">Citas</Link>
            <Link to="/profile">Perfil</Link>
            <button onClick={logout} className="logout-btn-nav">Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <main className="cart-container">
        <div className="cart-header">
          <h2>Mi Carrito</h2>
          <p>Revisa tus prendas seleccionadas antes de finalizar el pedido.</p>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart-card">
            <h3>Tu carrito está vacío</h3>
            <p>Agrega prendas desde el catálogo.</p>
            <Link to="/dashboarduser" className="back-catalog-btn">Ir al Catálogo</Link>
          </div>
        ) : (
          <div className="cart-content-grid">
            <div className="cart-items-list">
              {cartItems.map((item, index) => (
                <div key={index} className="cart-item-row">
                  <img src={item.image} alt={item.title} className="cart-item-img" />
                  <div className="cart-item-details">
                    <h4>{item.title}</h4>
                    <span className="cart-item-price">${Number(item.price || 0).toLocaleString("es-CO")}</span>
                  </div>
                  <button className="remove-item-btn" onClick={() => removeItem(index)} aria-label="Eliminar producto">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

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
              <button className="checkout-btn" onClick={checkout}>
                Finalizar Alquiler
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default Cart;
