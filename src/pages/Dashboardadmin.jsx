import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import "../styles/Dashboardad.css";

function DashboardAdmin() {
  const [history, setHistory] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    const role = currentUser?.role || (currentUser?.rol_nombre === "admin" ? "admin" : currentUser?.rol_nombre === "usuario" ? "user" : null);

    if (!currentUser || role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }

    const storedProducts = JSON.parse(localStorage.getItem("products")) || [];
    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
    const storedHistory = JSON.parse(localStorage.getItem("history")) || [];

    setProductCount(Array.isArray(storedProducts) ? storedProducts.length : 0);
    setUserCount(Array.isArray(storedUsers) ? storedUsers.length : 0);
    setHistory(storedHistory);
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    navigate("/login", { replace: true });
  };

  return (
    <>
      <nav className="app-nav">
        <div className="nav-inner">
          <Link to="/dashboardadmin" className="brand">
            RentStyle
          </Link>
          <div className="nav-actions">
            <button onClick={() => navigate("/dashboardadmin")}>Tema</button>
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard Administrador</h1>
          <p>Bienvenido {localStorage.getItem("name")}</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Productos</h3>
            <p>{productCount}</p>
          </div>
          <div className="stat-card">
            <h3>Usuarios</h3>
            <p>{userCount}</p>
          </div>
          <div className="stat-card">
            <h3>Historial</h3>
            <p>{history.length}</p>
          </div>
        </div>

        <div className="dashboard-buttons-row">
          <Link to="/admin/productos" className="dashboard-button">
            Gestión de productos
          </Link>
          <Link to="/admin/usuarios" className="dashboard-button">
            Gestión de usuarios
          </Link>
          <Link to="/admin/inventario" className="dashboard-button">
            Inventario
          </Link>
        </div>

        <div className="dashboard-card history-card">
          <div className="history-header">
            <h2>Historial</h2>
            <p>
              {history.length} registro{history.length !== 1 ? "s" : ""}
            </p>
          </div>

          {history.length === 0 ? (
            <p className="history-empty">No hay registros aún.</p>
          ) : (
            <ul className="history-list">
              {history.map((item, index) => (
                <li key={index} className="history-item">
                  <span className="history-index">#{history.length - index}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}

export default DashboardAdmin;
