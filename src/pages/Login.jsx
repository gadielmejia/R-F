import { useState } from "react";
import Footer from "../components/Footer";
import "../styles/login.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [darkMode, setDarkMode] = useState(false);

    const users = [
    {
        email: "sebasadmin@rentstyle.com",
        password: "sebas1234",
        role: "admin",
        name: "Sebas"
    },
    {
        email: "gadieladmin@rentstyle.com",
        password: "gadiel1234",
        role: "admin",
        name: "Gadiel"
    },
    {
        email: "alejauser@rentstyle.com",
        password: "aleja1234",
        role: "user",
        name: "Aleja"
    },
    {
        email: "stivenuser@rentstyle.com",
        password: "stiven1234",
        role: "user",
        name: "Stiven"
    }
];
const handleSubmit = (e) => {
  e.preventDefault();
  const user = users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password
  );
  if (!user) {
    alert("Correo o contraseña incorrectos");
    return;
  }
  localStorage.setItem(
    "currentUser",
    JSON.stringify(user)
  );
  console.log("Usuario guardado:", user);
  if (user.role === "admin") {
    window.location.href = "/dashboardadmin";
  } else {
    window.location.href = "/dashboarduser";
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