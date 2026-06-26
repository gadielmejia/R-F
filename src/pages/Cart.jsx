import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import "../styles/cart.css";

function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [fechaEvento, setFechaEvento] = useState("");
  const [loading, setLoading] = useState(false);
  const [comprobante, setComprobante] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user) { navigate("/login"); return; }
    const saved = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(saved);
  }, [navigate]);

  const removeFromCart = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const total = cart.reduce((sum, item) => sum + Number(item.price), 0);

  const checkout = async () => {
    if (cart.length === 0) { alert("Tu carrito está vacío."); return; }
    if (!fechaInicio || !fechaFin || !fechaEvento) {
      alert("Debes seleccionar fecha de inicio, fin y evento para continuar."); return;
    }
    if (new Date(fechaFin) <= new Date(fechaInicio)) {
      alert("La fecha de fin debe ser posterior a la fecha de inicio."); return;
    }

    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user) { navigate("/login"); return; }

    setLoading(true);
    try {
      // Buscar un admin (id_administrador requerido por la BD)
      const adminRes = await api.get("/usuarios");
      const adminData = await adminRes.json();
      const admin = (adminData.data || []).find(u => u.rol_nombre === "admin" || u.idRol === 1);
      if (!admin) { alert("No hay administrador disponible en el sistema."); setLoading(false); return; }

      // Crear la reserva
      const reservaRes = await api.post("/reservas", {
        id_cliente: user.idUsuario,
        id_administrador: admin.idUsuario,
        fecha_reserva: new Date().toISOString().split("T")[0],
        fecha_evento: fechaEvento,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        observaciones: cart.map(i => i.title).join(", "),
        estado: "Pendiente",
      });
      const reservaData = await reservaRes.json();
      if (!reservaRes.ok) throw new Error(reservaData.message);

      // Generar comprobante
      const compRes = await api.post("/comprobantes", {
        idReserva: reservaData.data.idReserva,
        monto_total: total,
        tipo_comprobante: "Ticket",
        descripcion: `Reserva de: ${cart.map(i => i.title).join(", ")}`,
      });
      const compData = await compRes.json();

      setComprobante({
        numero: compData.data?.numero_comprobante || "N/A",
        total,
        fechaInicio,
        fechaFin,
        fechaEvento,
        prendas: cart.map(i => i.title),
        cliente: user.nombre,
        idReserva: reservaData.data.idReserva,
      });

      localStorage.removeItem("cart");
      setCart([]);
    } catch (err) {
      alert("Error al procesar la reserva: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

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
    <>
      <nav className="app-nav">
        <div className="nav-inner">
          <Link to="/dashboarduser" className="brand">RentStyle</Link>
          <div className="nav-actions">
            <Link to="/dashboarduser">Catálogo</Link>
            <Link to="/mis-reservas">Mis reservas</Link>
            <Link to="/profile">Perfil</Link>
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <section className="products-section">
        <div className="section-header">
          <h2>Mi Carrito</h2>
          <p>Revisa tus prendas y selecciona las fechas de alquiler.</p>
        </div>

        {cart.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
            <h3>Tu carrito está vacío</h3>
            <p>Agrega prendas desde el catálogo.</p>
            <Link to="/dashboarduser" className="btn btn-primary" style={{ display: "inline-block", marginTop: "1rem" }}>
              Ver catálogo
            </Link>
          </div>
        ) : (
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
      </section>
    </>
  );
}

export default Cart;