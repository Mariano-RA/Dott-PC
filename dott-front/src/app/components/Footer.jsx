import React from "react";

const Footer = () => {
  return (
    <footer className="flex flex-nowrap bg-red-950 pt-3 flex-col md:flex-row md:flex-wrap items-center w-full">
      <div className="flex flex-col w-3/6 items-center">
        <p className="text-white font-bold mb-2">ATENCIÓN AL CLIENTE:</p>

        <p className="text-white text-sm">351-2861992</p>
        <p className="text-white text-sm">dott.computacion@gmail.com</p>
        <p className="text-white text-sm">Lunes a Viernes de 8 a 18hs.</p>
      </div>
      <div className="flex flex-col w-3/6 items-center mt-5 md:mt-0">
        <p className="text-white font-bold mb-2">RETIRO DE PEDIDOS:</p>

        <p className="text-white text-sm">Córdoba:</p>
        <p className="text-white text-sm">Lunes a Viernes de 10 a 18hs.</p>
      </div>
      <div className="flex w-full justify-center mb-1 mt-5 md:mt-0">
        <p className="text-white text-xs">
          Copyright © 2023 - DottPC. Cordoba, Argentina.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
