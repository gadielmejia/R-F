import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import "../styles/login.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [darkMode, setDarkMode] = useState(false);
    const navigate = useNavigate();

    const normalizeUser = (user) => {
        const role = user?.rol_nombre === "admin" || user?.role === "admin"
            ? "admin"
            : "user";

        return {
            ...user,
            role,
            name: user?.nombre || user?.name || user?.correo || user?.email || "",
            email: user?.correo || user?.email || "",
            rol_nombre: user?.rol_nombre || (role === "admin" ? "admin" : "usuario"),
        };
    };

const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const encoded = new TextEncoder().encode(password);
        const hashBuf = await crypto.subtle.digest('SHA-256', encoded);
        const passwordHash = Array.from(new Uint8Array(hashBuf))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: email, Contrasena: passwordHash }),
        });
        const json = await res.json();
        if (!res.ok) {
            alert(json.message || 'Credenciales incorrectas');
            return;
        }

        // Guardar token y datos de usuario
        const { token, usuario } = json.data;
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify({
            ...usuario,
            role: usuario.rol_nombre === 'admin' ? 'admin' : 'user',
        }));

        if (usuario.rol_nombre === 'admin') {
            navigate('/dashboardadmin', { replace: true });
        } else {
            navigate('/dashboarduser', { replace: true });
        }
    } catch (err) {
        alert('Error de conexión con el servidor');
    }
};
    return (
        <>
            <nav className="login-nav">
                <div className="login-nav-inner">

                <h2 className="login-logo">RentStyle</h2>

                <div className="login-nav-links">
                    <button className="theme-toggle-nav"onClick={() => setDarkMode(!darkMode)}>
                    <div className="theme-icon-nav"></div>
                        </button>
                        <a href="/">Inicio</a>
                        <a href="/registro">Registrarse</a>
                    </div>
                </div>
            </nav>
            <div className={`login-page ${darkMode ? "dark" : ""}`}>
                <div className="login-left">
                        <span className="welcome-text">BIENVENIDO A</span>
                        <h1>RentStyle</h1>
                        <p>
                        Alquila lo que necesitas, cuando lo necesitas.
                        </p>
                        <ul>
                        <li>✦ Catálogo actualizado</li>
                        <li>✦ Alquiler flexible</li>
                        <li>✦ Cancelación sin cargos</li>
                        </ul>
                    </div>
                <div className="login-right">
                    <div className="form-container">
                        <h2>Iniciar sesión</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Correo electrónico</label>
                                    <input
                                     type="email"
                                     placeholder="ejemplo@correo.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                <label>Contraseña</label>
                                <input
                                    type="password"
                                    placeholder="Ingresa tu contraseña"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    />
                            </div>
                            <button className="login-btn"type="submit">Ingresar</button>
                        </form>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default Login;