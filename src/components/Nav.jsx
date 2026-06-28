import { Link } from 'react-router-dom';
import Header from "./Header";
import { useTheme } from "../context/ThemeContext";

function NavAdmin() {
  const { toggleTheme } = useTheme();

  return (
    <nav className="app-nav">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <Header />
        </Link>
        <div className="nav-actions">
          <button onClick={toggleTheme}>Tema</button>
          <Link to="/login">Iniciar sesión</Link>
          <Link to="/registro">Registrarse</Link>
        </div>
      </div>
    </nav>
  );
}

export default NavAdmin;