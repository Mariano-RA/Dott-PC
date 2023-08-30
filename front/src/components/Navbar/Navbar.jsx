import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ContextGlobal } from "../utils/global.context";
import LoginButton from "../Login/LoginButton";

import Profile from "../Login/Profile";

const Navbar = () => {
  const [keywords, setKeywords] = useState("");
  const [IsHovered, setIsHovered] = useState(false);
  const [notification, setNotification] = useState(false);
  const { state } = useContext(ContextGlobal);
  const [categorys, setCategorys] = useState([]);

  const handleHover = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  function handleCategorys() {
    setCategorys(state.data);
  }

  function handleCart() {
    if (state.productCart.length > 0) {
      setNotification(true);
    } else {
      setNotification(false);
    }
  }

  useEffect(() => {
    handleCategorys();
    handleCart();
  }, [state]);

  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (keywords.length > 0 && keywords != "") {
      navigate(`/list/keywords/${keywords}`);
    } else {
      navigate(`/list`);
    }
  }

  const handleInputChange = (e) => {
    setKeywords(e.target.value);
  };

  return (
    <nav className="navbar navbar-expand-lg bg-fondoOscuro fixed-top py-3">
      <div className="container-fluid">
        <Link className="navbar-brand text-verdedott" to={"/home"}>
          <img
            className="img-fluid rounded-3"
            src="/logo/dottpc.jpg"
            alt=""
            style={{ maxHeight: "55px" }}
          />
        </Link>
        <div
          className="mostrar flex-fill justify-content-end me-2"
          style={{ display: "none" }}
        >
          <Link
            className="nav-link active text-verdedott position-relative btnCartContainerResponsive"
            aria-current="page"
            to={"/cart"}
          >
            <button
              type="button"
              className="btn btn-outline-verdedottclaro position-relative"
              onMouseEnter={handleHover}
              onMouseLeave={handleMouseLeave}
            >
              <img
                src={
                  IsHovered
                    ? "/icons/shop-cart-hover.png"
                    : "/icons/shop-cart.png"
                }
                style={{ width: "30px" }}
                alt=""
              />
              {notification && (
                <span className="position-absolute top-0 start-100 translate-middle p-2 bg-danger border border-light rounded-circle">
                  <span className="visually-hidden">New alerts</span>
                </span>
              )}
            </button>
          </Link>
        </div>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div
          className="collapse navbar-collapse justify-content-between"
          id="navbarSupportedContent"
        >
          <ul className="navbar-nav mb-2 mb-lg-0">
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle active text-verdedott"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Categorias
              </a>
              <ul
                className="dropdown-menu overflow-y-auto overflow-x-hidden bg-fondoClaro "
                style={{ height: "700px" }}
              >
                {categorys.map((category, index) => {
                  return category !=
                    "No existe una categoria para este producto" ? (
                    <li key={index}>
                      <Link
                        className="dropdown-item text-verdedott"
                        to={`/category/${category}`}
                      >
                        {category}
                      </Link>
                    </li>
                  ) : (
                    ""
                  );
                })}
              </ul>
            </li>
            <li className="nav-item">
              <Link className="nav-link active text-verdedott" to={"/list"}>
                Productos
              </Link>
            </li>
          </ul>

          <form
            className="d-flex separarData justify-content-between"
            role="search"
            onSubmit={handleSubmit}
          >
            <input
              className="custom-input rounded-3 w-100 flex-fill"
              style={{ paddingRight: "45px" }}
              type="text"
              placeholder="Buscar producto"
              aria-label="Buscar producto"
              onChange={handleInputChange}
            />
            {/* <button
              className="btn d-flex align-items-center"
              type="submit"
              style={{ position: "relative", right: "45px" }}
            >
              <img
                src="/icons/lupa.png"
                className="img-fluid"
                alt=""
                width={"25px"}
              />
            </button> */}
          </form>
          <div className="d-flex align-items-center">
            <Link
              className="nav-link active text-verdedott position-relative ocultar me-2"
              aria-current="page"
              to={"/cart"}
            >
              <button
                type="button"
                className="btn btn-outline-verdedottclaro position-relative"
                onMouseEnter={handleHover}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  src={
                    IsHovered
                      ? "/icons/shop-cart-hover.png"
                      : "/icons/shop-cart.png"
                  }
                  style={{ width: "30px" }}
                  alt=""
                />
                {notification && (
                  <span className="position-absolute top-0 start-100 translate-middle p-2 bg-danger border border-light rounded-circle">
                    <span className="visually-hidden">New alerts</span>
                  </span>
                )}
              </button>
            </Link>
            <div className="d-flex justify-content-between align-items-center w-100 pt-lg-0 pt-3">
              <LoginButton />

              <Profile />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
