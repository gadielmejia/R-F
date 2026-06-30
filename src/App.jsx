import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Inicio from './components/Inicio';
import Register from './pages/register';
import Login from './pages/Login';
import DashboardAdmin from './pages/Dashboardadmin';
import DashboardUser from './pages/DashboardUser';
import DashboardEmpleado from './pages/DashboardEmpleado';
import ProductsAdmin from './pages/ProductsAdmin';
import UsersAdmin from './pages/UsersAdmin';
import InventoryAdmin from './pages/InventoryAdmin';
import ReservasAdmin from './pages/ReservasAdmin';
import Cart from './pages/Cart';
import Profile from "./pages/Profile";
import Citas from "./pages/Citas";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboardadmin" element={<DashboardAdmin />} />
        <Route path="/admin/productos" element={<ProductsAdmin />} />
        <Route path="/admin/usuarios" element={<UsersAdmin />} />
        <Route path="/admin/inventario" element={<InventoryAdmin />} />
        <Route path="/admin/reservas" element={<ReservasAdmin />} />
        <Route path="/dashboarduser" element={<DashboardUser />} />
        <Route path="/dashboardempleado" element={<DashboardEmpleado />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/citas" element={<Citas/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
