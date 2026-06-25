import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import "../styles/dashboardUser.css";


import vestidoverde from "../assets/vestidoverde.jpg";
import vestidonegro from "../assets/vestidonregro.jpg";
import vestidoazul from "../assets/vestidoazul.png";
import vestidorojo from "../assets/vestidorojo.png";
import vestidodorado from "../assets/vestidodorado.png";

function DashboardUser() {
  const navigate = useNavigate();
  
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const [userName] = useState(() => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    return user ? (user.nombre || "Alejandro") : "Alejandro";
  });
  
  const [showGreeting, setShowGreeting] = useState(true);

  // --- ESTADOS PARA LA NOTIFICACIÓN ESTILO APPLE ---
  const [toast, setToast] = useState({ show: false, message: "" });
  const [toastTimeoutId, setToastTimeoutId] = useState(null);

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
    }
  }, [navigate]);

  const toggleTheme = () => {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);
    localStorage.setItem("theme", nextTheme ? "dark" : "light");
  };

  // --- FUNCIÓN DE AGREGAR AL CARRITO CONFIGURADA CON TOAST ---
  const addToCart = (id, title, price, image) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push({ id, title, price, image });
    localStorage.setItem("cart", JSON.stringify(cart));
    
    // Si ya había una notificación activa, limpiamos su temporizador para que no se corte antes
    if (toastTimeoutId) clearTimeout(toastTimeoutId);

    // Activamos la notificación iOS
    setToast({ show: true, message: `"${title}" se agregó al carrito.` });

    // Se oculta automáticamente tras 3 segundos
    const newTimeout = setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 3000);
    
    setToastTimeoutId(newTimeout);
  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  return (
    <div className={`dashboard-page ${darkMode ? "dark" : ""}`}>
      
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
            <button className="theme-toggle-nav" onClick={toggleTheme} aria-label="Cambiar tema">
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

        <div className="products-grid">
          <article className="product-card card animated-card" style={{ animationDelay: "0.1s" }}>
            <img src={vestidoverde} alt="Vestido Verde" />
            <div className="product-card-content">
              <h3>Vestido de Gala Verde Jade</h3>
              <p className="category">Gala</p>
              <p className="details">Talla M · Stock 4</p>
              <strong className="price">$180.000</strong>
              <button onClick={() => addToCart(1, "Vestido de Gala Verde Jade", 180000, vestidoverde)}>
                Agregar al carrito
              </button>
            </div>
          </article>

          <article className="product-card card animated-card" style={{ animationDelay: "0.2s" }}>
            <img src={vestidonegro} alt="Vestido Negro" />
            <div className="product-card-content">
              <h3>Vestido Elegante Negro</h3>
              <p className="category">Cóctel</p>
              <p className="details">Talla S · Stock 3</p>
              <strong className="price">$150.000</strong>
              <button onClick={() => addToCart(2, "Vestido Elegante Negro", 150000, vestidonegro)}>
                Agregar al carrito
              </button>
            </div>
          </article>

          <article className="product-card card animated-card" style={{ animationDelay: "0.3s" }}>
            <img src={vestidoazul} alt="Vestido Azul Marino" />
            <div className="product-card-content">
              <h3>Vestido de Noche Azul Imperial</h3>
              <p className="category">Gala / Grados</p>
              <p className="details">Talla L · Stock 2</p>
              <strong className="price">$195.000</strong>
              <button onClick={() => addToCart(3, "Vestido de Noche Azul Imperial", 195000, vestidoazul)}>
                Agregar al carrito
              </button>
            </div>
          </article>

          <article className="product-card card animated-card" style={{ animationDelay: "0.4s" }}>
            <img src={vestidorojo} alt="Vestido Rojo" />
            <div className="product-card-content">
              <h3>Vestido Cóctel Rojo Pasión</h3>
              <p className="category">Fiesta / Cóctel</p>
              <p className="details">Talla XS · Stock 2</p>
              <strong className="price">$160.000</strong>
              <button onClick={() => addToCart(4, "Vestido Cóctel Rojo Pasión", 160000, vestidorojo)}>
                Agregar al carrito
              </button>
            </div>
          </article>

          <article className="product-card card animated-card" style={{ animationDelay: "0.5s" }}>
            <img src={vestidodorado} alt="Vestido Dorado" />
            <div className="product-card-content">
              <h3>Vestido de Noche Dorado Glam</h3>
              <p className="category">Gala / Quinceañero</p>
              <p className="details">Talla M · Stock 3</p>
              <strong className="price">$185.000</strong>
              <button onClick={() => addToCart(5, "Vestido de Noche Dorado Glam", 185000, vestidodorado)}>
                Agregar al carrito
              </button>
            </div>
          </article>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default DashboardUser;