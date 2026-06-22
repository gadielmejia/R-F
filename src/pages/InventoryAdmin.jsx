import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import "../styles/Dashboardad.css";

function InventoryAdmin() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }

    const storedProducts = JSON.parse(localStorage.getItem("products")) || [
      { id: 1, title: "Vestido Verde Jade", category: "Gala", price: 180000, stock: 4 },
    ];
    setProducts(storedProducts);
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
            <Link to="/admin/productos" className="nav-link">
              Gestión de productos
            </Link>
            <Link to="/admin/usuarios" className="nav-link">
              Gestión de usuarios
            </Link>
            <Link to="/admin/inventario" className="nav-link">
              Inventario
            </Link>
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Inventario</h1>
          <p>Revisa el stock actual de los productos registrados.</p>
        </div>

        <div className="dashboard-card">
          <h2>Productos en inventario</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.title}</td>
                  <td>{product.category}</td>
                  <td>${product.price.toLocaleString()}</td>
                  <td>{product.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default InventoryAdmin;
