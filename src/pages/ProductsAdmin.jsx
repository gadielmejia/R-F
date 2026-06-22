import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import "../styles/Dashboardad.css";

function ProductsAdmin() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [productForm, setProductForm] = useState({ title: "", category: "", price: "", stock: "" });

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }

    const storedProducts = JSON.parse(localStorage.getItem("products")) || [
      { id: 1, title: "Vestido Verde Jade", category: "Gala", price: 180000, stock: 4 },
    ];
    const storedHistory = JSON.parse(localStorage.getItem("history")) || [];

    setProducts(storedProducts);
    setHistory(storedHistory);
  }, [navigate]);

  const saveData = (newProducts, newHistory) => {
    localStorage.setItem("products", JSON.stringify(newProducts));
    localStorage.setItem("history", JSON.stringify(newHistory));
  };

  const addProduct = (e) => {
    e.preventDefault();
    const newProduct = {
      id: Date.now(),
      title: productForm.title,
      category: productForm.category,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
    };
    const updatedProducts = [...products, newProduct];
    const updatedHistory = [`Producto agregado: ${newProduct.title}`, ...history];
    setProducts(updatedProducts);
    setHistory(updatedHistory);
    saveData(updatedProducts, updatedHistory);
    setProductForm({ title: "", category: "", price: "", stock: "" });
  };

  const deleteProduct = (id) => {
    const target = products.find((p) => p.id === id);
    const updatedProducts = products.filter((p) => p.id !== id);
    const updatedHistory = [`Producto eliminado: ${target?.title || "desconocido"}`, ...history];
    setProducts(updatedProducts);
    setHistory(updatedHistory);
    saveData(updatedProducts, updatedHistory);
  };

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
          <h1>Gestión de Productos</h1>
          <p>Agrega artículos nuevos y administra tu catálogo de producto.</p>
        </div>

        <div className="dashboard-card">
          <h2>Agregar Producto</h2>
          <form className="form-container" onSubmit={addProduct}>
            <input
              type="text"
              placeholder="Nombre"
              value={productForm.title}
              onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Categoría"
              value={productForm.category}
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Precio"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Stock"
              value={productForm.stock}
              onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
              required
            />
            <button className="btn btn-primary" type="submit">
              Guardar Producto
            </button>
          </form>
        </div>

        <div className="dashboard-card">
          <h2>Productos registrados</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.title}</td>
                  <td>{product.category}</td>
                  <td>${product.price.toLocaleString()}</td>
                  <td>{product.stock}</td>
                  <td>
                    <button className="btn btn-danger" onClick={() => deleteProduct(product.id)}>
                      Eliminar
                    </button>
                  </td>
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

export default ProductsAdmin;
