import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import "../styles/citas.css"; // Ruta a tu nueva hoja de estilos

function CitasUser() {
const navigate = useNavigate();

  // 1. Estados Globales (Tema y Usuario)
    const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
    });

    const [currentUser] = useState(() => {
    return JSON.parse(localStorage.getItem("currentUser")) || { nombre: "Alejandro", email: "alejo@mail.com" };
    });

  // 2. Estado para la Lista de Citas (Carga inicial desde localStorage)
    const [citas, setCitas] = useState(() => {
    const citasGuardadas = localStorage.getItem(`citas_${currentUser.email}`);
    return citasGuardadas ? JSON.parse(citasGuardadas) : [
        { id: 1, servicio: "Prueba de Vestido", fecha: "2026-07-10", hora: "14:30", notas: "Interesado en el vestido verde jade." }
    ];
    });

  // 3. Estados del Formulario
    const [servicio, setServicio] = useState("Prueba de Vestido");
    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState("");
    const [notas, setNotas] = useState("");

  // 4. Estados para la Notificación Apple
    const [toast, setToast] = useState({ show: false, message: "" });
    const [toastTimeoutId, setToastTimeoutId] = useState(null);

  // Proteger la ruta
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

  // Guardar cita
    const handleAgendarCita = (e) => {
    e.preventDefault();

    if (!fecha || !hora) {
        if (toastTimeoutId) clearTimeout(toastTimeoutId);
        setToast({ show: true, message: "Por favor selecciona fecha y hora." });
        const timeout = setTimeout(() => setToast({ show: false, message: "" }), 3000);
        setToastTimeoutId(timeout);
        return;
    }

    const nuevaCita = {
        id: Date.now(),
        servicio,
        fecha,
        hora,
        notas: notas || "Sin notas adicionales"
    };

    const listaActualizada = [...citas, nuevaCita];
    setCitas(listaActualizada);
    localStorage.setItem(`citas_${currentUser.email}`, JSON.stringify(listaActualizada));

    // Resetear formulario
    setFecha("");
    setHora("");
    setNotas("");

    // Lanzar notificación iOS exitosa
    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    setToast({ show: true, message: "¡Cita agendada correctamente!" });
    const timeout = setTimeout(() => setToast({ show: false, message: "" }), 3000);
    setToastTimeoutId(timeout);
    };

    return (
    <div className={`citas-page ${darkMode ? "dark" : ""}`}>
    
      {/* NOTIFICACIÓN ESTILO APPLE */}
        <div className={`apple-notification-toast ${toast.show ? "show" : ""}`}>
        <div className="apple-toast-blur-bg"></div>
        <div className="apple-toast-inner">
            <div className="apple-toast-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            </div>
            <div className="apple-toast-info">
            <span className="apple-toast-app-name">RentStyle Citas</span>
            <p className="apple-toast-text">{toast.message}</p>
            </div>
        </div>
        </div>

      {/* NAVBAR FIJO BLANCO */}
        <nav className="login-nav">
        <div className="login-nav-inner">
            <h2 className="login-logo">RentStyle</h2>
            <div className="login-nav-links">
            <button className="theme-toggle-nav" onClick={toggleTheme} aria-label="Cambiar tema">
                <div className="theme-icon-nav"></div>
            </button>
            <Link to="/dashboarduser">Catálogo</Link>
            <Link to="/cart">Carrito</Link>
            <Link to="/citas" className="active-link">Citas</Link>
            <Link to="/profile">Perfil</Link>
            <button onClick={() => { localStorage.removeItem("currentUser"); navigate("/login"); }} className="logout-btn-nav">Cerrar sesión</button>
            </div>
        </div>
        </nav>

      {/* CONTENIDO PRINCIPAL */}
        <main className="citas-container">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <section className="citas-card form-section-card">
            <div className="citas-card-header">
            <h2>Agendar Cita</h2>
            <p>Reserva tu espacio para una experiencia personalizada de lujo.</p>
            </div>

            <form onSubmit={handleAgendarCita} className="citas-form">
            <div className="form-group">
            <label htmlFor="servicio">Tipo de Servicio</label>
            <select id="servicio" value={servicio} onChange={(e) => setServicio(e.target.value)}>
                <option value="Prueba de Vestido">Prueba de Vestido (Asesoría de Tallas)</option>
                <option value="Asesoría de Imagen">Asesoría de Imagen Completa</option>
                <option value="Ajustes de Sastrería">Ajustes y Entalles a Medida</option>
                <option value="Devolución / Recogida">Entrega o Devolución de Traje</option>
            </select>
            </div>

            <div className="form-row">
                <div className="form-group">
                <label htmlFor="fecha">Fecha</label>
                <input type="date" id="fecha" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </div>

                <div className="form-group">
                <label htmlFor="hora">Hora</label>
                <input type="time" id="hora" value={hora} onChange={(e) => setHora(e.target.value)} />
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="notas">Notas Especiales (Opcional)</label>
                <textarea id="notas" placeholder="Cuéntanos qué vestidos tienes en mente o detalles específicos..." value={notas} onChange={(e) => setNotas(e.target.value)} rows="3"></textarea>
            </div>

            <button type="submit" className="submit-cita-btn">Confirmar Reserva</button>
            </form>
        </section>

        {/* COLUMNA DERECHA: REVISIÓN DE CITAS */}
        <section className="citas-card list-section-card">
            <div className="citas-card-header">
            <h2>Mis Citas</h2>
            <p>Monitorea y gestiona tus próximas visitas agendadas.</p>
            </div>

            <div className="citas-list">
            {citas.length === 0 ? (
                <div className="empty-citas">
                <p>No tienes citas programadas en este momento.</p>
                </div>
            ) : (
                citas.map((c) => (
                <div key={c.id} className="cita-item-card">
                    <div className="cita-item-badge">{c.servicio}</div>
                    <div className="cita-item-datetime">
                    <span className="cita-date">📅 {c.fecha}</span>
                    <span className="cita-time">⏰ {c.hora}</span>
                    </div>
                    <p className="cita-notes">"{c.notas}"</p>
                </div>
                ))
            )}
            </div>
        </section>

        </main>

      {/* FOOTER FIJO BLANCO */}
        <Footer />
    </div>
    );
}

export default CitasUser;