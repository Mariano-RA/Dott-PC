import React from "react";

const imagenes = [
  {
    id: 1,
    url: "/img/promo/imagen1.jpg",
  },
  {
    id: 2,
    url: "/img/promo/imagen2.jpg",
  },
  {
    id: 3,
    url: "/img/promo/imagen3.png",
  },
  {
    id: 4,
    url: "/img/promo/imagen4.jpg",
  },
  {
    id: 5,
    url: "/img/promo/imagen5.jpg",
  },
  {
    id: 6,
    url: "/img/promo/imagen6.jpg",
  },
  {
    id: 7,
    url: "/img/promo/imagen7.jpg",
  },
];

const Home = () => {
  return (
    <div className="d-flex flex-column align-items-center">
      <div className="d-flex flex-column align-items-center my-3 contractContainer">
        <p className="display-1 fw-bold">Dott PC</p>
        <p className="fs-lg-4 fs-sm-6">
          Sumérgete en un mundo de posibilidades infinitas con nuestra exclusiva
          selección de equipos y accesorios gamer. Desde componentes de
          vanguardia hasta periféricos de alto rendimiento, nuestra tienda es el
          epicentro donde tus sueños de juego toman vida. ¡Juega más allá de los
          límites y descubre lo que significa ser un verdadero jugador!
        </p>
      </div>
      <div>
        <div
          id="carouselExampleSlidesOnly"
          className="carousel slide"
          data-bs-ride="carousel"
        >
          <div className="carousel-inner">
            {imagenes.map((imagen) => (
              <div
                className={`carousel-item ${imagen.id == 1 ? "active" : ""}`}
                key={imagen.id}
              >
                <img src={imagen.url} className="d-block w-100" alt="..." />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
