import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import "../styles/Dashboardad.css";

const emptyForm = (roleId = "") => ({
  nombre: "",
  documento: "",
  correo: "",
  telefono: "",
  Contrasena: "",
  idRol: roleId,
});

function UsersAdmin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [userForm, setUserForm] = useState(emptyForm());
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    const role = currentUser?.role || (currentUser?.rol_nombre === "admin" ? "admin" : currentUser?.rol_nombre === "usuario" ? "user" : null);

    if (!currentUser || role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [rolesResponse, usersResponse] = await Promise.all([
          fetch("/api/roles"),
          fetch("/api/usuarios"),
        ]);

        const rolesData = await rolesResponse.json();
        const usersData = await usersResponse.json();

        if (rolesResponse.ok) {
          const roleList = rolesData.data || [];
          setRoles(roleList);
          setUserForm((prev) => ({ ...prev, idRol: prev.idRol || String(roleList[0]?.idRol || "") }));
        }

        if (usersResponse.ok) {
          setUsers(usersData.data || []);
        }
      } catch (error) {
        console.error(error);
        setFormError("No se pudieron cargar los usuarios.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.nombre.trim() || !userForm.correo.trim() || !userForm.Contrasena) {
      setFormError("Completa nombre, correo y contraseña.");
      return;
    }

    try {
      setLoading(true);
      setFormError("");
      const payload = {
        nombre: userForm.nombre.trim(),
        correo: userForm.correo.trim().toLowerCase(),
        Contrasena: userForm.Contrasena,
        telefono: userForm.telefono.trim(),
        idRol: userForm.idRol ? Number(userForm.idRol) : undefined,
      };

      if (userForm.documento.trim()) {
        payload.documento = userForm.documento.trim();
      }

      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudo crear el usuario.");
      }

      setUsers((prev) => [data.data, ...prev]);
      setUserForm(emptyForm(roles[0]?.idRol?.toString() || ""));
    } catch (error) {
      setFormError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "No se pudo eliminar el usuario.");
      }
      setUsers((prev) => prev.filter((user) => user.idUsuario !== id));
    } catch (error) {
      setFormError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser?.nombre?.trim() || !editingUser?.correo?.trim()) {
      setFormError("Completa nombre y correo antes de guardar.");
      return;
    }

    try {
      setLoading(true);
      setFormError("");
      const payload = {
        nombre: editingUser.nombre.trim(),
        correo: editingUser.correo.trim().toLowerCase(),
        telefono: editingUser.telefono?.trim() || "",
        idRol: Number(editingUser.idRol),
      };

      if (editingUser.documento?.trim()) {
        payload.documento = editingUser.documento.trim();
      }

      if (editingUser.Contrasena) {
        payload.Contrasena = editingUser.Contrasena;
      }

      const response = await fetch(`/api/usuarios/${editingUser.idUsuario}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar el usuario.");
      }

      setUsers((prev) => prev.map((user) => (user.idUsuario === editingUser.idUsuario ? data.data : user)));
      setEditingUser(null);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setLoading(false);
    }
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
          <form className="form-container" onSubmit={handleCreateUser}>
            {formError && <p className="field-alert">⚠ {formError}</p>}
            <input
              type="text"
              placeholder="Nombre"
              value={userForm.nombre}
              onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Documento (opcional)"
              value={userForm.documento}
              onChange={(e) => setUserForm({ ...userForm, documento: e.target.value })}
            />
            <input
              type="email"
              placeholder="Correo"
              value={userForm.correo}
              onChange={(e) => setUserForm({ ...userForm, correo: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Teléfono (opcional)"
              value={userForm.telefono}
              onChange={(e) => setUserForm({ ...userForm, telefono: e.target.value })}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={userForm.Contrasena}
              onChange={(e) => setUserForm({ ...userForm, Contrasena: e.target.value })}
              required
            />
            <select
              value={userForm.idRol}
              onChange={(e) => setUserForm({ ...userForm, idRol: e.target.value })}
              className="role-select"
            >
              {roles.map((role) => (
                <option key={role.idRol} value={role.idRol}>
                  {role.nombre}
                </option>
              ))}
            </select>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Usuario"}
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
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.idUsuario}>
                    <td>{user.nombre}</td>
                    <td>{user.correo}</td>
                    <td>{roles.find((role) => role.idRol === user.idRol)?.nombre || user.rol_nombre || "Sin rol"}</td>
                    <td style={{ display: "flex", gap: "8px" }}>
                      <button className="btn btn-secondary" onClick={() => setEditingUser({ ...user, idRol: String(user.idRol || "") })}>
                        Editar
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDeleteUser(user.idUsuario)}>
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
              <form className="form-container" onSubmit={handleUpdateUser}>
                {formError && <p className="field-alert">⚠ {formError}</p>}
                <input
                  type="text"
                  placeholder="Nombre"
                  value={editingUser.nombre || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, nombre: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Documento (opcional)"
                  value={editingUser.documento || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, documento: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="Correo"
                  value={editingUser.correo || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, correo: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Teléfono (opcional)"
                  value={editingUser.telefono || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, telefono: e.target.value })}
                />
                <input
                  type="password"
                  placeholder="Nueva contraseña (opcional)"
                  value={editingUser.Contrasena || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, Contrasena: e.target.value })}
                />
                <select
                  value={editingUser.idRol || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, idRol: e.target.value })}
                  className="role-select"
                >
                  {roles.map((role) => (
                    <option key={role.idRol} value={role.idRol}>
                      {role.nombre}
                    </option>
                  ))}
                </select>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? "Guardando..." : "Guardar cambios"}
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
