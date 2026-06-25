import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import vestidoverde from "../assets/vestidoverde.jpg";
import vestidonegro from "../assets/vestidonregro.jpg";

function DashboardUser() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    const role = user?.role || (user?.rol_nombre === "admin" ? "admin" : user?.rol_nombre === "usuario" ? "user" : null);

    if (!user || role !== "user") {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const toggleTheme = () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
  };

  const addToCart = (id, title, price, image) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart.push({
      id,
      title,
      price,
      image,
    });

    localStorage.setItem("cart", JSON.stringify(cart));

    alert("Producto agregado al carrito");
  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  useEffect(() => {
    const theme = localStorage.getItem("theme");

    if (theme === "dark") {
      document.body.classList.add("dark");
    }
  }, []);

  return (
    <>
      <nav className="app-nav">
        <div className="nav-inner">
          <Link to="" className="brand">
            RentStyle
          </Link>

          <div className="nav-actions">
            <button onClick={toggleTheme}>
              Tema
            </button>

            <Link to="/cart">
              Carrito
            </Link>

            <Link to="/profile">
              Perfil
            </Link>

            <button onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <section className="products-section">
        <div className="section-header">
          <h2>Dashboard Usuario</h2>

          <p>Descubre nuestros productos disponibles</p>
        </div>

        <div className="products-grid">
          <article className="product-card card">
            <img
              src={vestidoverde}
              alt="Vestido Verde"
            />

            <h3>Vestido de Gala Verde Jade</h3>

            <p>Gala</p>

            <p>Talla M · Stock 4</p>

            <strong>$180.000</strong>

            <button className="btn btn-primary" onClick={() =>
                addToCart(1, "Vestido de Gala Verde Jade", 180000, vestidoverde)}>
              Agregar al carrito
            </button>
          </article>

          <article className="product-card card">
            <img
              src={vestidonegro}
              alt="Vestido Negro"
            />

            <h3>Vestido Elegante Negro</h3>

            <p>Cóctel</p>

            <p>Talla S · Stock 3</p>

            <strong>$150.000</strong>

            <button
                  className="btn btn-primary"
              onClick={() =>
                addToCart(
                  2,
                  "Vestido Elegante Negro",
                  150000,
                  vestidonegro
                )
              }
            >
              Agregar al carrito
            </button>
          </article>
        </div>
      </section>
      <Footer/>
    </>
  );
}

export default DashboardUser;