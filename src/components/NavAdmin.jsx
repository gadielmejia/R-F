import { Link } from 'react-router-dom';
import Header from "./Header";

function NavAdmin() {
  return (
    <nav className="app-nav">
        <div className="nav-inner">
          <Link to="" className="brand">RentStyle</Link>
        
        <div className="nav-actions">
          <button onClick={() => {}}>Temaaaaaaaaaaa</button>
          <button onClick={() => {}}>Gestion de productos</button>
          <button onClick={() => {}}>Gestion de usuarios</button>
          <button onClick={() => {}}>Inventario</button>
          <button onClick={logout}>Cerrar sesióoooooooon</button>


        </div>
      </div>
    </nav>
  );
}

export default NavAdmin;