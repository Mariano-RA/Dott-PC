"use client";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { ContextGlobal } from "../components/utils/global.context";
import { useToken } from "../services/use-token";

const Admin = () => {
  const data = useToken({
    url: `/api/admin`,
    method: "GET",
    headers: {
      "content-type": "application/json",
    },
  });

  const [accToken, setAccToken] = useState("");

  useEffect(() => {
    if (data.accessToken != "") {
      setAccToken(JSON.parse(data?.accessToken));
    }
  }, [data]);

  const [valorDolar, setValorDolar] = useState(0);
  const [proveedor, setProveedor] = useState("");
  const state = useContext(ContextGlobal);

  function handleSelectOption(e) {
    setProveedor(e.target.value);
  }

  function handleValorDolar(e) {
    setValorDolar(e.target.value);
  }

  async function handleActualizarDolar() {
    let config = {
      method: "post",
      url: `${state.state.apiUrl}/api/dolar`,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accToken}`,
      },
      data: {
        precioDolar: valorDolar,
      },
    };
    await axios
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
      url: `${state.state.apiPythonUrl}/procesar_archivo_${proveedor}`,
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${accToken}`,
      },
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
    <div className="flex flex-col w-3/4 m-auto items-center">
      <label
        className="text-dottoscuro text-4xl flex justify-center my-4"
        htmlFor=""
      >
        Datos
      </label>
      <div className="flex flex-col w-3/4">
        <label
          htmlFor="price"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Dolar
        </label>
        <div className="relative mt-2 rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="text"
            name="price"
            id="price"
            value={valorDolar}
            onChange={handleValorDolar}
            className="block w-full rounded-md border-0 py-1.5 pl-7 pr-20 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="0.00"
          />
          <div className="absolute inset-y-0 right-0 flex items-center border-l-2 border-gray-300">
            <label htmlFor="currency" className="sr-only">
              Currency
            </label>
            <button
              className=" hover:bg-red-800 rounded-r-lg px-2 h-full  hover:text-white"
              type="button"
              onClick={handleActualizarDolar}
            >
              Actualizar precio
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col  w-3/4 mt-2">
        <label
          htmlFor="price"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Listados
        </label>
        <div className="flex border w-full rounded-md justify-between">
          <select
            className="rounded-md px-4 min-h-full"
            id="inputGroupSelect04"
            aria-label="Example select with button addon"
            onChange={handleSelectOption}
          >
            <option defaultValue={null}>Proveedor</option>
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
            className="flex-grow-1 w-full border-r-2"
            id="inputGroupFile04"
            aria-describedby="inputGroupFileAddon04"
            aria-label="Upload"
          />
          <button
            className="hover:bg-red-800 rounded-r-lg px-2 min-h-full  hover:text-white"
            type="button"
            id="inputGroupFileAddon04"
            onClick={handleUpdateProvider}
          >
            Cargar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Admin;
