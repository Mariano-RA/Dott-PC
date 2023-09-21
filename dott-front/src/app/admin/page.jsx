"use client";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { ContextGlobal } from "../components/utils/global.context";
import useSWR from "swr";
import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { redirect } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";

const fetcher = async (uri) => {
  const response = await fetch(uri);
  return response.json();
};

export default withPageAuthRequired(function Admin() {
  const { data, error } = useSWR("/api/admin", fetcher);

  const [accToken, setAccToken] = useState("");

  const [valorDolar, setValorDolar] = useState();
  const [proveedor, setProveedor] = useState("");
  const [arrayCuotas, setArrayCuotas] = useState([]);
  const state = useContext(ContextGlobal);

  const [usrRoles, setUsrRoles] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    const roles = user["http://localhost:3000/roles"];
    setUsrRoles(roles);
  }, [user]);

  useEffect(() => {
    if (data != undefined) {
      if (data.token != "") {
        setAccToken(data.token);
        setArrayCuotas(state.state.valorCuotas);
      }
    }
  }, [data]);

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

  const handleCuotaChange = (id, valorTarjeta) => {
    // Actualiza el nombre del usuario con el ID dado
    const nuevasCuotas = state.state.valorCuotas.map((cuota) => {
      if (cuota.id === id) {
        return { ...cuota, valorTarjeta };
      }
      return cuota;
    });

    setArrayCuotas([...nuevasCuotas]);
  };

  async function handleActualizarCuotas() {
    let config = {
      method: "post",
      url: `${state.state.apiUrl}/api/cuota`,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accToken}`,
      },
      data: {
        arrCuotas,
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

  if (error) return <div>oops... {error.message}</div>;
  if (data === undefined)
    return (
      <button type="button" className="bg-indigo-500 ..." disabled>
        <svg className="animate-spin h-5 w-5 mr-3 ..." viewBox="0 0 24 24">
          ...
        </svg>
        Processing...
      </button>
    );

  if (!usrRoles.includes("admin")) {
    redirect("/");
  } else {
    return (
      <div className="flex flex-col w-3/4 m-auto items-center">
        <label
          className="text-red-950 text-4xl flex justify-center my-4"
          htmlFor=""
        >
          Datos
        </label>
        <div className="flex flex-col w-3/4 mt-7">
          <table className="border-collapse border border-slate-500 ...">
            <thead>
              <tr>
                <th
                  className="border border-slate-600 text-red-950"
                  colSpan={12}
                >
                  Valor del dolar
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className=" text-red-950 text-center w-1/2">
                  <input
                    className="w-full text-center p-1"
                    type="text"
                    name="price"
                    id="price"
                    value={valorDolar}
                    onChange={handleValorDolar}
                    placeholder="0"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div className="flex justify-center">
            <button
              className="text-center hover:bg-red-950 hover:text-white p-1 ring-1 ring-red-950 rounded-md my-2"
              type="button"
              id="inputGroupFileAddon04"
              onClick={handleActualizarDolar}
            >
              Actualizar precio
            </button>
          </div>
        </div>
        <div className="flex flex-col w-3/4 mt-7">
          <table className="border-collapse border border-slate-500 ...">
            <thead>
              <tr>
                <th
                  className="border border-slate-600 text-red-950"
                  colSpan={12}
                >
                  Actualizar Listados
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="flex justify-center items-center">
                  <select
                    className="rounded-md px-4 py-1"
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
                </td>
                <td>
                  <input
                    type="file"
                    className="w-full"
                    id="inputGroupFile04"
                    aria-describedby="inputGroupFileAddon04"
                    aria-label="Upload"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div className="flex justify-center">
            <button
              className="text-center hover:bg-red-950 hover:text-white p-1 ring-1 ring-red-950 rounded-md my-2"
              type="button"
              id="inputGroupFileAddon04"
              onClick={handleUpdateProvider}
            >
              Cargar
            </button>
          </div>
        </div>
        <div className="flex flex-col  w-3/4 mt-7">
          <table className="border-collapse border border-slate-500 ...">
            <thead>
              <tr>
                <th colSpan={12} className="text-red-950">
                  Costo de venta por tarjeta
                </th>
              </tr>
              <tr>
                <th className="border border-slate-600 text-red-950 font-normal">
                  Cantidad de cuotas
                </th>
                <th className="border border-slate-600 text-red-950 font-normal">
                  Costo
                </th>
              </tr>
            </thead>
            <tbody>
              {arrayCuotas.map((cuota) => (
                <tr key={cuota.id}>
                  <td className="border border-slate-700 text-red-950 text-center w-1/2">
                    {cuota.id}
                  </td>
                  <td className="border border-slate-700 text-red-950">
                    <input
                      className="text-center w-full"
                      value={cuota.valorTarjeta}
                      onChange={(e) =>
                        handleCuotaChange(cuota.id, e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-center">
            <button
              className="text-center hover:bg-red-950 hover:text-white p-1 ring-1 ring-red-950 rounded-md my-2"
              onClick={() => handleActualizarCuotas}
            >
              Actualizar valor de las cuotas
            </button>
          </div>
        </div>
      </div>
    );
  }
});
