import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { api } from "../utils/api";
import { useTheme } from "../context/ThemeContext";
import "../styles/cart.css"; // Ruta hacia tus estilos del carrito

function Cart() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleToggleTheme = () => {
    toggleTheme();
  };

  // 2. Estado para los productos del carrito
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Estados para el modal de cita
  const [showCitaModal, setShowCitaModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [servicio, setServicio] = useState("Entrega de Prenda Alquilada");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) {
      navigate("/login");
      return;
    }
    setCurrentUser(user);
    loadAdmin();
    
    // Validar y limpiar carrito: filtrar items sin idInventario
    const validItems = cartItems.filter(item => item.idInventario);
    if (validItems.length !== cartItems.length) {
      console.warn("Se removieron items sin idInventario del carrito");
      setCartItems(validItems);
      localStorage.setItem("cart", JSON.stringify(validItems));
    }
  }, [navigate]);

  const loadAdmin = async () => {
    try {
      const response = await api.get("/api/usuarios");
      const users = response.data?.data || [];
      const admin = users.find(
        (u) => u.idRol === 1 || u.rol_nombre?.toLowerCase() === "admin" || u.role?.toLowerCase() === "admin"
      );
      if (admin) {
        setAdminId(admin.idUsuario);
      } else {
        console.warn("No se encontró admin");
      }
    } catch (err) {
      console.error("Error cargando admin:", err);
    } finally {
      setAdminLoading(false);
    }
  };

  // Eliminar un producto específico del carrito
  const removeItem = (indexToRemove) => {
    const updatedCart = cartItems.filter((_, index) => index !== indexToRemove);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + Number(item.price || 0) * (item.cantidad || 1), 0);
  };

  const openCitaModal = () => {
    if (!cartItems.length) {
      alert('Tu carrito está vacío. Agrega prendas para continuar.');
      return;
    }
    if (adminLoading) {
      alert('Cargando información del administrador. Por favor intenta de nuevo en un momento.');
      return;
    }
    if (!adminId) {
      alert('No hay administrador disponible para agendar la cita. Por favor contacta con soporte.');
      return;
    }
    setShowCitaModal(true);
    setError("");
  };

  const closeCitaModal = () => {
    setShowCitaModal(false);
    setFecha("");
    setHora("");
    setNotas("");
    setError("");
  };

  const updatePrendasEstado = async () => {
    try {
      // Validar que todos los items tengan idInventario
      const itemsSinInventario = cartItems.filter(item => !item.idInventario);
      if (itemsSinInventario.length > 0) {
        throw new Error("Error: algunos productos del carrito no tienen inventario asignado. Por favor, recarga la página y vuelve a agregar los productos.");
      }

      if (!currentUser?.idUsuario) {
        throw new Error("Usuario no identificado correctamente");
      }

      if (!adminId) {
        throw new Error("Administrador no disponible");
      }

      // Preparar detalles de la reserva
      const detalles = cartItems.map((item) => ({
        idInventario: item.idInventario,
        cantidad: item.cantidad || 1,
        subtotal: (item.price || 0) * (item.cantidad || 1),
      }));

      console.log("Datos a enviar:", {
        id_cliente: currentUser.idUsuario,
        id_administrador: adminId,
        detalles: detalles,
      });

      // Obtener fechas
      const today = new Date();
      const fecha_reserva = today.toISOString().split("T")[0];
      
      // Crear la reserva con detalles e inventarios
      const reservaResponse = await api.post("/api/reservas/crear-con-detalles", {
        id_cliente: currentUser.idUsuario,
        id_administrador: adminId,
        fecha_reserva: fecha_reserva,
        fecha_evento: fecha, // la fecha seleccionada por el usuario
        fecha_inicio: fecha,
        fecha_fin: fecha,
        observaciones: notas || "",
        detalles: detalles,
      });

      console.log("Respuesta:", reservaResponse.data);

      // Con axios, los datos ya están en .data
      return reservaResponse.data.data.idReserva;
    } catch (err) {
      console.error("Error completo:", err);
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw err;
    }
  };

  const handleConfirmarCita = async (e) => {
    e.preventDefault();
    setError("");

    if (!fecha || !hora) {
      setError("Por favor selecciona fecha y hora.");
      return;
    }

    if (!adminId) {
      setError("No hay administrador disponible.");
      return;
    }

    setLoading(true);
    try {
      const fecha_cita = `${fecha}T${hora}:00`;
      const motivo = `${servicio}${notas ? ` - ${notas}` : ""}`;
      
      // Crear reserva con detalles y actualizar inventarios
      const idReserva = await updatePrendasEstado();
      
      // Crear cita asociada a la reserva
      const citaResponse = await api.post("/api/citas", {
        id_cliente: currentUser.idUsuario,
        id_administrador: adminId,
        id_reserva: idReserva,
        fecha_cita,
        motivo,
      });

      // Limpiar carrito
      setCartItems([]);
      localStorage.setItem("cart", JSON.stringify([]));

      // Cerrar modal y mostrar confirmación
      closeCitaModal();
      alert("¡Cita agendada exitosamente! Las prendas han sido marcadas como reservadas.");
      
      navigate("/citas");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al agendar la cita.");
    } finally {
      setLoading(false);
    }
  };

  const checkout = () => {
    openCitaModal();
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className={`cart-page ${theme === "dark" ? "dark" : ""}`}>
      
      {/* NAVBAR FIJO BLANCO (Idéntico a los anteriores) */}
      <nav className="login-nav">
        <div className="login-nav-inner">
          <h2 className="login-logo">RentStyle</h2>
          <div className="login-nav-links">
            <button className="theme-toggle-nav" onClick={handleToggleTheme} aria-label="Cambiar tema">
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
                    {item.talla && (
                      <span style={{ fontSize: "0.85rem", color: "#666", marginRight: "0.5rem" }}>
                        Talla {item.talla}
                      </span>
                    )}
                    {item.cantidad && (
                      <span style={{ fontSize: "0.85rem", color: "#666" }}>
                        · Cantidad: {item.cantidad}
                      </span>
                    )}
                    <span className="cart-item-price" style={{ display: "block", marginTop: "0.25rem" }}>
                      ${Number((item.price || 0) * (item.cantidad || 1)).toLocaleString("es-CO")}
                    </span>
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

      {/* Modal para agendar cita */}
      {showCitaModal && (
        <div className="modal-overlay" onClick={closeCitaModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <button className="modal-close" onClick={closeCitaModal} aria-label="Cerrar">×</button>
            <h2 style={{ marginBottom: "1.5rem", textAlign: "center" }}>Agendar Cita de Entrega</h2>
            
            <form onSubmit={handleConfirmarCita}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>
                  Tipo de Servicio
                </label>
                <select
                  value={servicio}
                  onChange={(e) => setServicio(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "1rem"
                  }}
                >
                  <option value="Entrega de Prenda Alquilada">Entrega de Prenda Alquilada</option>
                  <option value="Recogida de Prenda">Recogida de Prenda</option>
                  <option value="Prueba de Talla">Prueba de Talla</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "1rem"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>
                    Hora
                  </label>
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "1rem"
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>
                  Notas Adicionales (Opcional)
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Instrucciones especiales, dirección, etc."
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontFamily: "inherit",
                    resize: "vertical"
                  }}
                />
              </div>

              {error && (
                <div style={{
                  background: "#FFEBEE",
                  color: "#B71C1C",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  fontSize: "0.95rem"
                }}>
                  ⚠ {error}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {loading ? "Procesando..." : "Confirmar Cita y Reservar"}
                </button>
                <button
                  type="button"
                  onClick={closeCitaModal}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Cart;
