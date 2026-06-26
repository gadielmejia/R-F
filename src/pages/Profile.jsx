import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import "../styles/profile.css"; // Ruta hacia los estilos de perfil

function Profile() {
  const navigate = useNavigate();

  // 1. Estado del Modo Oscuro
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // 2. Cargar datos del usuario logueado en tiempo real
  const [currentUser, setCurrentUser] = useState(() => {
    return JSON.parse(localStorage.getItem("currentUser")) || { nombre: "Alejandro", email: "alejo@mail.com", role: "user" };
  });

  // 3. Estados de los campos del formulario
  const [nombre, setNombre] = useState(currentUser.nombre || "");
  const [correo, setCorreo] = useState(currentUser.email || "");
  const [avatar, setAvatar] = useState(() => {
    return localStorage.getItem(`avatar_${currentUser.email}`) || "";
  });

  // 4. Estados para la Notificación Apple
  const [toast, setToast] = useState({ show: false, message: "" });
  const [toastTimeoutId, setToastTimeoutId] = useState(null);

  // Proteger ruta
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

  // Manejar la subida de foto y transformarla a Base64 para guardarla en LocalStorage
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardar los cambios actualizados
  const handleGuardarCambios = (e) => {
    e.preventDefault();

    // Actualizar objeto en sesión
    const usuarioActualizado = { ...currentUser, nombre, email: correo };
    localStorage.setItem("currentUser", JSON.stringify(usuarioActualizado));
    
    // Guardar imagen por separado amarrada al correo
    if (avatar) {
      localStorage.setItem(`avatar_${correo}`, avatar);
    }

    // Lanzar notificación iOS exitosa
    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    setToast({ show: true, message: "Perfil actualizado con éxito." });
    const timeout = setTimeout(() => setToast({ show: false, message: "" }), 3000);
    setToastTimeoutId(timeout);
  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  return (
    <div className={`profile-page ${darkMode ? "dark" : ""}`}>
      
      {/* NOTIFICACIÓN ESTILO APPLE */}
      <div className={`apple-notification-toast ${toast.show ? "show" : ""}`}>
        <div className="apple-toast-blur-bg"></div>
        <div className="apple-toast-inner">
          <div className="apple-toast-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="apple-toast-info">
            <span className="apple-toast-app-name">RentStyle Perfil</span>
            <p className="apple-toast-text">{toast.message}</p>
          </div>
        </div>
      </div>

      {/* NAVBAR FIJO BLANCO TOTALMENTE HOMOLOGADO */}
      <nav className="login-nav">
        <div className="login-nav-inner">
          <h2 className="login-logo">RentStyle</h2>
          <div className="login-nav-links">
            <button className="theme-toggle-nav" onClick={toggleTheme} aria-label="Cambiar tema">
              <div className="theme-icon-nav"></div>
            </button>
            <Link to="/dashboarduser">Catálogo</Link>
            <Link to="/cart">Carrito</Link>
            <Link to="/citas">Citas</Link>
            <Link to="/profile" className="active-link">Perfil</Link>
            <button onClick={logout} className="logout-btn-nav">Cerrar sesión</button>
          </div>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="profile-container">
        <div className="profile-card">
          
          <form onSubmit={handleGuardarCambios} className="profile-form">
            <h2>Perfil</h2>

            {/* Zona del Avatar estilizada */}
            <div className="avatar-wrapper">
              <div className="avatar-circle">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="avatar-img" />
                ) : (
                  <div className="avatar-placeholder">
                    {/* ICONO SVG DE PERSONITA EN GRIS DE TU EQUIPO */}
                    <svg 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      className="avatar-svg-icon"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>
                )}
                {/* Botón flotante estilizado para subir archivo */}
                <label htmlFor="avatar-upload" className="avatar-upload-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </label>
              </div>
              <input type="file" id="avatar-upload" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              <span className="role-tag">{currentUser.role || "user"}</span>
            </div>

            {/* Campos de Texto */}
            <div className="form-group">
              <label htmlFor="nombre">Nombre</label>
              <input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="correo">Correo</label>
              <input type="email" id="correo" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
            </div>

            <button type="submit" className="save-profile-btn">Guardar Cambios</button>
          </form>

        </div>
      </main>

      {/* FOOTER FIJO BLANCO */}
      <Footer />
    </div>
  );
}

export default Profile;