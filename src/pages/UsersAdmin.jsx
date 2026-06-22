import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import "../styles/Dashboardad.css";

function UsersAdmin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [userForm, setUserForm] = useState({ name: "", email: "" });
  const [nameError, setNameError] = useState("");
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }

    const storedUsers = JSON.parse(localStorage.getItem("users")) || [
      { id: 1, name: "Alejandra Ramirez", email: "aleja@rentstyle.com" },
    ];
    const storedHistory = JSON.parse(localStorage.getItem("history")) || [];

    setUsers(storedUsers);
    setHistory(storedHistory);
  }, [navigate]);

  const saveData = (newUsers, newHistory) => {
    localStorage.setItem("users", JSON.stringify(newUsers));
    localStorage.setItem("history", JSON.stringify(newHistory));
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    const invalidChar = /[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/;
    if (invalidChar.test(value)) {
      setNameError("El nombre no puede contener números ni signos especiales.");
    } else {
      setNameError("");
    }
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
    saveData(updatedUsers, updatedHistory);
    setUserForm({ name: "", email: "" });
  };

  const deleteUser = (id) => {
    const target = users.find((u) => u.id === id);
    const updatedUsers = users.filter((u) => u.id !== id);
    const updatedHistory = [`Usuario eliminado: ${target?.name || "desconocido"} (${target?.email || ""})`, ...history];
    setUsers(updatedUsers);
    setHistory(updatedHistory);
    saveData(updatedUsers, updatedHistory);
  };

  const saveEditUser = (e) => {
    e.preventDefault();
    const updatedUsers = users.map((u) =>
      u.id === editingUser.id ? { ...u, name: editingUser.name, email: editingUser.email } : u
    );
    const updatedHistory = [`Usuario editado: ${editingUser.name} (${editingUser.email})`, ...history];
    setUsers(updatedUsers);
    setHistory(updatedHistory);
    saveData(updatedUsers, updatedHistory);
    setEditingUser(null);
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
          <h1>Gestión de Usuarios</h1>
          <p>Registra, edita y elimina usuarios en la plataforma.</p>
        </div>

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
              {nameError && <span className="field-alert">⚠ {nameError}</span>}
            </div>
            <input
              type="email"
              placeholder="Correo"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              required
            />
            <button className="btn btn-primary" type="submit">
              Guardar Usuario
            </button>
          </form>
        </div>

        <div className="dashboard-card">
          <h2>Usuarios</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td style={{ display: "flex", gap: "8px" }}>
                      <button className="btn btn-secondary" onClick={() => setEditingUser({ ...user })}>
                        Editar
                      </button>
                      <button className="btn btn-danger" onClick={() => deleteUser(user.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
                  <button className="btn btn-primary" type="submit">
                    Guardar cambios
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => setEditingUser(null)}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

export default UsersAdmin;
