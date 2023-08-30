import React from "react";

const Footer = () => {
  return (
    <div className="d-flex flex-wrap justify-content-around bg-fondoOscuro py-3 mt-3 makeColumn w-100">
      <div className="d-flex flex-column align-items-center">
        <div className="fw-bold">
          <p>ATENCIÓN AL CLIENTE:</p>
        </div>
        <div>
          <p className="m-0">351-2861992</p>
          <p className="m-0">dott.computacion@gmail.com</p>
          <p className="m-0">Lunes a Viernes de 8 a 18hs.</p>
        </div>
      </div>
      <div className="d-flex flex-column align-items-center justify-content-around addMarginTop">
        <div className="fw-bold">
          <p>RETIRO DE PEDIDOS:</p>
        </div>
        <div className="d-flex mb-3">
          <p className="me-2 m-0">Córdoba:</p>
          <p className="m-0">Lunes a Viernes de 10 a 18hs.</p>
        </div>
        <div className="">
          <p className=" m-0" style={{ fontSize: "0.8rem" }}>
            Copyright © 2023 - DottPC. Cordoba, Argentina.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Footer;
