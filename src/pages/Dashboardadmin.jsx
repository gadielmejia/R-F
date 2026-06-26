import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { api } from "../utils/api";
import "../styles/Dashboardad.css";

function DashboardAdmin() {
  const [productCount, setProductCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [reservaCount, setReservaCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }

    const loadStats = async () => {
      try {
        const [usersRes, prendasRes, reservasRes] = await Promise.all([
          api.get('/usuarios'),
          api.get('/prendas'),
          api.get('/reservas'),
        ]);

        const usersData = await usersRes.json();
        const prendasData = await prendasRes.json();
        const reservasData = await reservasRes.json();

        setUserCount(usersData.data?.length || 0);
        setProductCount(prendasData.data?.length || 0);
        setReservaCount(reservasData.data?.length || 0);
      } catch (err) {
        console.error("Error cargando estadísticas:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [navigate]);

  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <nav className="app-nav">
        <div className="nav-inner">
          <Link to="/dashboardadmin" className="brand">RentStyle</Link>
          <div className="nav-actions">
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard Administrador</h1>
          <p>Bienvenido, {JSON.parse(localStorage.getItem("currentUser") || '{}')?.nombre}</p>
        </div>

        {loading ? (
          <p style={{ textAlign: "center" }}>Cargando estadísticas...</p>
        ) : (
          <div className="stats-grid">
            <div className="stat-card"><h3>Productos</h3><p>{productCount}</p></div>
            <div className="stat-card"><h3>Usuarios</h3><p>{userCount}</p></div>
            <div className="stat-card"><h3>Reservas</h3><p>{reservaCount}</p></div>
          </div>
        )}

        <div className="dashboard-buttons-row">
          <Link to="/admin/productos" className="dashboard-button">Gestión de productos</Link>
          <Link to="/admin/usuarios" className="dashboard-button">Gestión de usuarios</Link>
          <Link to="/admin/inventario" className="dashboard-button">Inventario</Link>
          <Link to="/admin/reservas" className="dashboard-button">Gestión de reservas</Link>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default DashboardAdmin;