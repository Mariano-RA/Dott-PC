import React, { useState } from "react";
import axios from "axios";

const Admin = () => {
  const [valorDolar, setValorDolar] = useState(0);
  const [proveedor, setProveedor] = useState("");
  const state = JSON.parse(localStorage.getItem("appState"));

  function handleSelectOption(e) {
    setProveedor(e.target.value);
  }

  function handleValorDolar(e) {
    setValorDolar(e.target.value);
  }

  function handleActualizarDolar() {
    let config = {
      method: "post",
      url: `${state.apiUrl}/api/dolar`,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${state.userToken}`,
      },
      data: {
        precioDolar: valorDolar,
      },
    };
    axios
      .request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function handleUpdateProvider() {
    const fileInput = document.querySelector('input[type="file"]');
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    let config = {
      method: "post",
      url: `${state.apiPythonUrl}/procesar_archivo_${proveedor}`,
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${state.userToken}`,
      },
      referrerPolicy: "strict-origin-when-cross-origin", // Set the Referrer Policy
    };
    config.data = formData;
    axios
      .request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
      })
      .catch((error) => {
        console.log(error);
      });
  }

  return (
    <div className="d-flex flex-column w-75 align-items-center">
      <label
        className="text-verdedott display-4 d-flex justify-content-center my-4"
        htmlFor=""
      >
        Datos
      </label>
      <div className="input-group mb-3">
        <span className="input-group-text">$</span>
        <input
          type="number"
          className="form-control"
          aria-label="Amount (to the nearest dollar)"
          value={valorDolar}
          onChange={handleValorDolar}
        />
        <button
          className="btn btn-outline-verdedott"
          type="button"
          onClick={handleActualizarDolar}
        >
          Actualizar precio
        </button>
      </div>
      <div className="input-group">
        <select
          class="form-select"
          id="inputGroupSelect04"
          aria-label="Example select with button addon"
          onChange={handleSelectOption}
        >
          <option selected>Proveedor</option>
          <option value="air">Air</option>
          <option value="eikon">Eikon</option>
          <option value="elit">Elit</option>
          <option value="mega">Mega</option>
          <option value="hdc">Hdc</option>
          <option value="invid">Invid</option>
          <option value="nb">Nb</option>
        </select>
        <input
          type="file"
          className="form-control w-50"
          id="inputGroupFile04"
          aria-describedby="inputGroupFileAddon04"
          aria-label="Upload"
        />
        <button
          className="btn btn-outline-verdedott"
          type="button"
          id="inputGroupFileAddon04"
          onClick={handleUpdateProvider}
        >
          Button
        </button>
      </div>
    </div>
  );
};

export default Admin;
