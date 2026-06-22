import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Inicio from './components/Inicio';
import Footer from './components/Footer';
import Nav from './components/Nav';
import Register from './pages/register';
import Login from './pages/Login';
import DashboardAdmin from './pages/Dashboardadmin';
import DashboardUser from './pages/DashboardUser';
import ProductsAdmin from './pages/ProductsAdmin';
import UsersAdmin from './pages/UsersAdmin';
import InventoryAdmin from './pages/InventoryAdmin';
import Cart from './pages/Cart';
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<h1>Admin</h1>} />
        <Route path="/user" element={<h1>User</h1>} />
        <Route path="/dashboardadmin" element={<DashboardAdmin />} />
        <Route path="/admin/productos" element={<ProductsAdmin />} />
        <Route path="/admin/usuarios" element={<UsersAdmin />} />
        <Route path="/admin/inventario" element={<InventoryAdmin />} />
        <Route path="/dashboarduser" element={<DashboardUser />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;