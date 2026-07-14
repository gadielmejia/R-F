import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import ThemeToggle from "../components/ThemeToggle";
import { api } from "../utils/api";
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
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const isAdmin = ((currentUser?.role || currentUser?.rol_nombre || "").toString().toLowerCase() === "admin");

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    const currentRol = (currentUser?.rol_nombre || currentUser?.role || "").toString().toLowerCase();
    const role = currentUser?.role || (currentRol === "admin" ? "admin" : currentRol === "usuario" ? "user" : currentRol);

    if (!currentUser || !["admin", "empleado"].includes(role)) {
      navigate("/login", { replace: true });
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [rolesRes, usersRes] = await Promise.all([
          api.get("/api/roles", { headers }),
          api.get("/api/usuarios", { headers }),
        ]);

        const roleList = rolesRes.data?.data || [];
        const usersList = usersRes.data?.data || [];
        setRoles(roleList);
        setUsers(usersList);
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
    if (!userForm.nombre.trim() || !userForm.correo.trim() || !userForm.Contrasena || (isAdmin && !userForm.idRol)) {
      setFormError(isAdmin ? "Completa nombre, correo, contraseña y selecciona un rol." : "Completa nombre, correo y contraseña.");
      return;
    }

      try {
        setLoading(true);
        setFormError("");
        const token = localStorage.getItem("token");
        const payload = {
          nombre: userForm.nombre.trim(),
          correo: userForm.correo.trim().toLowerCase(),
          Contrasena: userForm.Contrasena,
          telefono: userForm.telefono.trim(),
          idRol: Number(userForm.idRol),
        };

        if (userForm.documento.trim()) payload.documento = userForm.documento.trim();

        const res = await api.post("/api/usuarios", payload, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const data = res.data;
        setUsers((prev) => [data.data, ...prev]);
        setUserForm(emptyForm());
      } catch (error) {
        setFormError(error.response?.data?.message || error.message || "Error creando usuario.");
      } finally {
        setLoading(false);
      }
  };

  const isCurrentAccount = (user) => {
    if (!currentUser) return false;

    const currentId = currentUser?.idUsuario ?? currentUser?.id;
    const targetId = user?.idUsuario ?? user?.id;

    if (currentId && targetId && Number(currentId) === Number(targetId)) {
      return true;
    }

    const currentEmail = (currentUser?.correo || currentUser?.email || "").toLowerCase();
    const targetEmail = (user?.correo || user?.email || "").toLowerCase();

    return Boolean(currentEmail && targetEmail && currentEmail === targetEmail);
  };

  const getRoleName = (user) => {
    const role = roles.find((roleItem) => String(roleItem.idRol) === String(user?.idRol));
    return role?.nombre || user?.rol_nombre || "Sin rol";
  };

  const handleDeleteUser = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await api.delete(`/api/usuarios/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
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

      const token = localStorage.getItem("token");
      const res = await api.put(`/api/usuarios/${editingUser.idUsuario}`, payload, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = res.data;
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
            <Link to="/admin/productos" className="nav-link">Productos</Link>
            <Link to="/admin/usuarios" className="nav-link">Usuarios</Link>
            <Link to="/admin/inventario" className="nav-link">Inventario</Link>
            <Link to="/admin/reservas" className="dashboard-button">Gestión de reservas</Link>
            <ThemeToggle />
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
          <form className="form-container" autoComplete="off" onSubmit={handleCreateUser}>
            <input type="text" name="prevent_autofill_username" autoComplete="off" style={{ opacity: 0, height: 0, position: 'absolute', pointerEvents: 'none' }} />
            <input type="password" name="prevent_autofill_password" autoComplete="new-password" style={{ opacity: 0, height: 0, position: 'absolute', pointerEvents: 'none' }} />
            {formError && <p className="field-alert">⚠ {formError}</p>}
            <input
              name="nombre"
              type="text"
              autoComplete="name"
              placeholder="Nombre"
              value={userForm.nombre}
              onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })}
              required
            />
            <input
              name="documento"
              type="text"
              placeholder="Documento"
              value={userForm.documento}
              onChange={(e) => setUserForm({ ...userForm, documento: e.target.value })}
            />
            <input
              name="correo"
              type="email"
              autoComplete="email"
              placeholder="Correo"
              value={userForm.correo}
              onChange={(e) => setUserForm({ ...userForm, correo: e.target.value })}
              required
            />
            <input
              name="telefono"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="tel"
              placeholder="Teléfono (opcional)"
              value={userForm.telefono}
              onChange={(e) => setUserForm({ ...userForm, telefono: e.target.value.replace(/\D/g, '') })}
            />
            <input
              name="Contrasena"
              type="password"
              autoComplete="new-password"
              placeholder="Contraseña"
              value={userForm.Contrasena}
              onChange={(e) => setUserForm({ ...userForm, Contrasena: e.target.value })}
              required
            />
            <select
              value={userForm.idRol}
              onChange={(e) => setUserForm({ ...userForm, idRol: e.target.value })}
              className="role-select"
              required={isAdmin}
              disabled={!isAdmin}
            >
              <option value="" disabled>
                {isAdmin ? 'Selecciona un rol' : 'El rol será asignado automáticamente'}
              </option>
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
                users.map((user) => {
                  const selfAccount = isCurrentAccount(user);
                  return (
                    <tr key={user.idUsuario}>
                      <td>
                        <div className="user-name-cell">
                          <span>{user.nombre}</span>
                          {selfAccount && <span className="self-account-badge">Tu cuenta</span>}
                        </div>
                      </td>
                      <td>{user.correo}</td>
                      <td>{getRoleName(user)}</td>
                      <td style={{ display: "flex", gap: "8px" }}>
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => {
                                    const matchingRole = roles.find((roleItem) => String(roleItem.idRol) === String(user?.idRol));
                                    setEditingUser({
                                      ...user,
                                      Contrasena: "",
                                      idRol: matchingRole ? String(matchingRole.idRol) : String(user?.idRol || ""),
                                    });
                                  }}
                                  disabled={!((currentUser?.role || currentUser?.rol_nombre || "").toString().toLowerCase() === "admin")}
                                  title={!((currentUser?.role || currentUser?.rol_nombre || "").toString().toLowerCase() === "admin") ? "Solo administradores pueden editar usuarios" : "Editar"}
                                >
                                  Editar
                                </button>
                        <button
                                  className="btn btn-danger"
                                  onClick={() => !selfAccount && handleDeleteUser(user.idUsuario)}
                                  disabled={selfAccount || !((currentUser?.role || currentUser?.rol_nombre || "").toString().toLowerCase() === "admin")}
                                  title={selfAccount ? "No puedes eliminar tu propia cuenta" : (!((currentUser?.role || currentUser?.rol_nombre || "").toString().toLowerCase() === "admin") ? "Solo administradores pueden eliminar usuarios" : "Eliminar usuario")}
                                >
                                  {selfAccount ? "No eliminar" : "Eliminar"}
                                </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {editingUser && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Editar Usuario</h2>
              <form className="form-container" autoComplete="off" onSubmit={handleUpdateUser}>
                <input type="text" name="prevent_autofill_username" autoComplete="off" style={{ opacity: 0, height: 0, position: 'absolute', pointerEvents: 'none' }} />
                <input type="password" name="prevent_autofill_password" autoComplete="new-password" style={{ opacity: 0, height: 0, position: 'absolute', pointerEvents: 'none' }} />
                {formError && <p className="field-alert">⚠ {formError}</p>}
                <input
                  name="nombre"
                  type="text"
                  autoComplete="name"
                  placeholder="Nombre"
                  value={editingUser.nombre || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, nombre: e.target.value })}
                  required
                  disabled={!((currentUser?.role || currentUser?.rol_nombre || "").toString().toLowerCase() === "admin")}
                />
                <input
                  name="documento"
                  type="text"
                  autoComplete="off"
                  placeholder="Documento (opcional)"
                  value={editingUser.documento || ""}
                  disabled
                />
                <input
                  name="correo"
                  type="email"
                  autoComplete="email"
                  placeholder="Correo"
                  value={editingUser.correo || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, correo: e.target.value })}
                  required
                  disabled={!((currentUser?.role || currentUser?.rol_nombre || "").toString().toLowerCase() === "admin")}
                />
                <input
                  name="telefono"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="tel"
                  placeholder="Teléfono (opcional)"
                  value={editingUser.telefono || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, telefono: e.target.value.replace(/\D/g, '') })}
                  disabled={!((currentUser?.role || currentUser?.rol_nombre || "").toString().toLowerCase() === "admin")}
                />
                <input
                  name="Contrasena"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Nueva contraseña (dejar vacío para no cambiar)"
                  value={editingUser.Contrasena || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, Contrasena: e.target.value })}
                  disabled={!((currentUser?.role || currentUser?.rol_nombre || "").toString().toLowerCase() === "admin")}
                />
                <div style={{ fontSize: "0.95rem", color: "#4b5563" }}>
                  Rol actual: <strong>{getRoleName(editingUser)}</strong>
                </div>
                <select
                  value={editingUser.idRol ? String(editingUser.idRol) : ""}
                  disabled={!((currentUser?.role || currentUser?.rol_nombre || "").toString().toLowerCase() === "admin")}
                  className="role-select"
                >
                  {roles.map((role) => (
                    <option key={role.idRol} value={String(role.idRol)}>
                      {role.nombre}
                    </option>
                  ))}
                </select>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-primary" type="submit" disabled={loading || !isAdmin}>
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
