"use client";

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

export default function Inicio() {
  return (
    <div className="flex flex-col items-center justify-between h-full">
      <div className="flex flex-col items-center my-20 px-20">
        <p className="font-bold text-transparent text-6xl sm:text-8xl bg-clip-text bg-gradient-to-r from-red-950 to-orange-500">
          Dott PC
        </p>
        <p className="text-md text-center mt-14 text-red-950">
          Sumérgete en un mundo de posibilidades infinitas con nuestra exclusiva
          selección de equipos y accesorios gamer. Desde componentes de
          vanguardia hasta periféricos de alto rendimiento, nuestra tienda es el
          epicentro donde tus sueños de juego toman vida. ¡Juega más allá de los
          límites y descubre lo que significa ser un verdadero jugador!
        </p>
      </div>

      <img src="/img/promo/imagen1.jpg" className="px-20 mb-20" />
    </div>
  );
}
