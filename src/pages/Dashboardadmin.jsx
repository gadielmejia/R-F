import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import "../styles/Dashboardad.css";

function DashboardAdmin() {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);

  // ── Búsqueda ──────────────────────────────────────────────
  const [userSearch, setUserSearch] = useState("");

  // ── Formulario producto ───────────────────────────────────
  const [productForm, setProductForm] = useState({
    title: "",
    category: "",
    price: "",
    stock: "",
  });

  // ── Formulario usuario ────────────────────────────────────
  const [userForm, setUserForm] = useState({ name: "", email: "" });
  const [nameError, setNameError] = useState("");

  // ── Edición de usuario ────────────────────────────────────
  const [editingUser, setEditingUser] = useState(null); // { id, name, email }

  // ── Sidebar historial ─────────────────────────────────────
  const [historialOpen, setHistorialOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const storedProducts =
      JSON.parse(localStorage.getItem("products")) || [
        { id: 1, title: "Vestido Verde Jade", category: "Gala", price: 180000, stock: 4 },
      ];
    const storedUsers =
      JSON.parse(localStorage.getItem("users")) || [
        { id: 1, name: "Alejandra Ramirez", email: "aleja@rentstyle.com" },
      ];
    const storedHistory = JSON.parse(localStorage.getItem("history")) || [];

    setProducts(storedProducts);            
    setUsers(storedUsers);
    setHistory(storedHistory);
  }, []);

  const saveData = (newProducts, newUsers, newHistory) => {
    localStorage.setItem("products", JSON.stringify(newProducts));
    localStorage.setItem("users", JSON.stringify(newUsers));
    localStorage.setItem("history", JSON.stringify(newHistory));
  };

  // ── Productos ─────────────────────────────────────────────
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
    saveData(updatedProducts, users, updatedHistory);
    setProductForm({ title: "", category: "", price: "", stock: "" });
  };

  const deleteProduct = (id) => {
    const target = products.find((p) => p.id === id);
    const updatedProducts = products.filter((p) => p.id !== id);
    const updatedHistory = [
      `Producto eliminado: ${target?.title || "desconocido"}`,
      ...history,
    ];
    setProducts(updatedProducts);
    setHistory(updatedHistory);
    saveData(updatedProducts, users, updatedHistory);
  };

  // ── Usuarios ──────────────────────────────────────────────
  const handleNameChange = (e) => {
    const value = e.target.value;
    // Bloquear números y signos: solo letras, espacios y acentos
    const invalidChar = /[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/;
    if (invalidChar.test(value)) {
      setNameError("El nombre no puede contener números ni signos especiales.");
    } else {
      setNameError("");
    }
    // Igualmente filtramos el valor para no dejar ingresar el carácter
    const cleaned = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, "");
    setUserForm({ ...userForm, name: cleaned });
  };

  const addUser = (e) => {
    e.preventDefault();
    if (nameError) return;
    const newUser = { id: Date.now(), name: userForm.name, email: userForm.email };
    const updatedUsers = [...users, newUser];
    const updatedHistory = [`Usuario agregado: ${newUser.name}`, ...history];
    setUsers(updatedUsers);
    setHistory(updatedHistory);
    saveData(products, updatedUsers, updatedHistory);
    setUserForm({ name: "", email: "" });
  };

  const deleteUser = (id) => {
    const target = users.find((u) => u.id === id);
    const updatedUsers = users.filter((u) => u.id !== id);
    // ✅ Mejora 3: historial con nombre del usuario eliminado
    const updatedHistory = [
      `Usuario eliminado: ${target?.name || "desconocido"} (${target?.email || ""})`,
      ...history,
    ];
    setUsers(updatedUsers);
    setHistory(updatedHistory);
    saveData(products, updatedUsers, updatedHistory);
  };

  // ✅ Mejora 1: guardar cambios de edición
  const saveEditUser = (e) => {
    e.preventDefault();
    const updatedUsers = users.map((u) =>
      u.id === editingUser.id
        ? { ...u, name: editingUser.name, email: editingUser.email }
        : u
    );
    const updatedHistory = [
      `Usuario editado: ${editingUser.name} (${editingUser.email})`,
      ...history,
    ];
    setUsers(updatedUsers);
    setHistory(updatedHistory);
    saveData(products, updatedUsers, updatedHistory);
    setEditingUser(null);
  };

  // ✅ Mejora 2: filtrar usuarios por búsqueda
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const logout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  const goToProfile = () => navigate("/profile");

  return (
    <>
      <nav className="app-nav">
        <div className="nav-inner">
          <Link to="" className="brand">RentStyle</Link>
          <div className="nav-actions">
            <button className="profile-btn" onClick={goToProfile}>Mi Perfil</button>
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard Administrador</h1>
          <p>Bienvenido {localStorage.getItem("name")}</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card"><h3>Productos</h3><p>{products.length}</p></div>
          <div className="stat-card"><h3>Usuarios</h3><p>{users.length}</p></div>
          <div className="stat-card"><h3>Historial</h3><p>{history.length}</p></div>
        </div>

        {/* Agregar Producto */}
        <div className="dashboard-card">
          <h2>Agregar Producto</h2>
          <form className="form-container" onSubmit={addProduct}>
            <input type="text" placeholder="Nombre" value={productForm.title}
              onChange={(e) => setProductForm({ ...productForm, title: e.target.value })} required />
            <input type="text" placeholder="Categoría" value={productForm.category}
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} required />
            <input type="number" placeholder="Precio" value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required />
            <input type="number" placeholder="Stock" value={productForm.stock}
              onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} required />
            <button className="btn btn-primary" type="submit">Guardar Producto</button>
          </form>
        </div>

        {/* Inventario */}
        <div className="dashboard-card">
          <h2>Inventario</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Acciones</th>
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

        {/* Agregar Usuario */}
        <div className="dashboard-card">
          <h2>Agregar Usuario</h2>
          <form className="form-container" onSubmit={addUser}>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="Nombre"
                value={userForm.name}
                onChange={handleNameChange}
                className={nameError ? "input-error" : ""}
                required
              />
              {nameError && (
                <span className="field-alert">⚠ {nameError}</span>
              )}
            </div>
            <input type="email" placeholder="Correo" value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required />
            <button className="btn btn-primary" type="submit">Guardar Usuario</button>
          </form>
        </div>

        {/* Lista de Usuarios */}
        <div className="dashboard-card">
          <h2>Usuarios</h2>

          {/* ✅ Mejora 2: buscador */}
          <input
            className="search-input"
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />

          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th><th>Correo</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="3" style={{ textAlign: "center" }}>No se encontraron usuarios.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td style={{ display: "flex", gap: "8px" }}>
                      {/* ✅ Mejora 1: botón editar */}
                      <button
                        className="btn btn-secondary"
                        onClick={() => setEditingUser({ ...user })}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => deleteUser(user.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ Mejora 1: Modal de edición */}
        {editingUser && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Editar Usuario</h2>
              <form className="form-container" onSubmit={saveEditUser}>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="Correo"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  required
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-primary" type="submit">Guardar cambios</button>
                  <button className="btn btn-secondary" type="button" onClick={() => setEditingUser(null)}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Botón para abrir historial */}
        <div className="dashboard-card history-trigger-card">
          <div className="history-trigger-row">
            <div>
              <h2>Historial</h2>
              <p className="history-count">{history.length} registro{history.length !== 1 ? "s" : ""}</p>
            </div>
            <button className="btn btn-secondary" onClick={() => setHistorialOpen(true)}>
              Ver historial →
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar historial */}
      {historialOpen && (
        <div className="sidebar-overlay" onClick={() => setHistorialOpen(false)}>
          <aside className="history-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-header">
              <h2>Historial</h2>
              <button className="sidebar-close" onClick={() => setHistorialOpen(false)}>✕</button>
            </div>
            <div className="sidebar-body">
              {history.length === 0 ? (
                <p className="sidebar-empty">No hay registros aún.</p>
              ) : (
                history.map((item, index) => (
                  <div className="sidebar-history-item" key={index}>
                    <span className="sidebar-history-index">#{history.length - index}</span>
                    <span>{item}</span>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      )}

      <Footer />
    </>
  );
}

export default DashboardAdmin;
