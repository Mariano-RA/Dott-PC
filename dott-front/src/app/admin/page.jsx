"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { redirect } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import Alert from "../components/Alert";

const fetcher = async (uri) => {
  const response = await fetch(uri);
  return response.json();
};

function fileToBase64Async(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function () {
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };

    reader.onerror = function (error) {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
}

export default withPageAuthRequired(function Admin() {
  const { data, error } = useSWR("/api/admin", fetcher);
  const [accToken, setAccToken] = useState("");
  const [arrayDolar, setArrayDolar] = useState([
    {proveedor:"air", precioDolar: 0},
    {proveedor:"eikon", precioDolar: 0},
    {proveedor:"elit", precioDolar: 0},
    {proveedor:"mega", precioDolar: 0},
    {proveedor:"hdc", precioDolar: 0},
    {proveedor:"invid", precioDolar: 0},
    {proveedor:"nb", precioDolar: 0},
  ]);
  const [arrayCuotas, setArrayCuotas] = useState([
    {id:3, valorTarjeta: 0},
    {id:6, valorTarjeta: 0},
    {id:12, valorTarjeta: 0},
    {id:18, valorTarjeta: 0},
  ]);
  const [proveedor, setProveedor] = useState("");
  const [deleteProveedor, setDeleteProveedor] = useState("");
  const [usrRoles, setUsrRoles] = useState([]);
  const { user } = useUser();
  const [alert, setAlert] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const roles = user["http://localhost:3000/roles"];
    setUsrRoles(roles);
  }, [user]);

  useEffect(() => {
    const getCuotas = async () => {
      const resVal = await fetch("/api/nest/quote");
      const { cuotas } = await resVal.json();
      const nuevoArrayCuotas = arrayCuotas.map((valorAnterior) => {
        const elementoCorrespondiente = cuotas.find(
          (elemento) => elemento.id === valorAnterior.id
        );
        if (elementoCorrespondiente && elementoCorrespondiente.valorTarjeta > 0) {
          return { ...valorAnterior, valorTarjeta: elementoCorrespondiente.valorTarjeta };
        }
        return valorAnterior;
      });
      setArrayCuotas(nuevoArrayCuotas);
    };
    getCuotas();
  }, []);

  useEffect(() => {
    const getValorDolar = async () => {
      const resVal = await fetch("/api/nest/dolar");
      const { dolar } = await resVal.json();
      const nuevoArrayDolar = arrayDolar.map((valorAnterior) => {
        const elementoCorrespondiente = dolar.find(
          (elemento) => elemento.proveedor === valorAnterior.proveedor
        );
        if (elementoCorrespondiente && elementoCorrespondiente.precioDolar > 0) {
          return { ...valorAnterior, precioDolar: elementoCorrespondiente.precioDolar };
        }
        return valorAnterior;
      });
      setArrayDolar(nuevoArrayDolar)
    };
    getValorDolar();
  }, []);

  useEffect(() => {
    if (data != undefined) {
      if (data.token != "") {
        setAccToken(data.token);
      }
    }
  }, [data]);

  function handleSelectOption(e) {
    setProveedor(e.target.value);
  }

  function handleSelectDeleteOption(e) {
    setDeleteProveedor(e.target.value);
  }

  async function handleBorrarListado() {
    if (deleteProveedor != "") {
      const resVal = await fetch(`/api/nest/products/list`, {
        method: "delete",
        body: JSON.stringify({
          proveedor: deleteProveedor,
        }),
      })
      const responseData = await resVal.json();
      if(responseData){
        console.log(responseData);
        setAlert(responseData.response);
        setShow(true);
      }     
    }
  }

  const handleCuotaChange = (id, valorTarjeta) => {
    const nuevasCuotas = arrayCuotas.map((cuota) => {
      if (cuota.id === id) {
        return { ...cuota, valorTarjeta };
      }
      return cuota;
    });
    setArrayCuotas([...nuevasCuotas]);
  };

  const handleDolarChange = (proveedor, precioDolar) => {
    const nuevoValorDolar = arrayDolar.map((dolar) => {
      if (dolar.proveedor === proveedor) {
        return { ...dolar, precioDolar };
      }
      return dolar;
    });
    setArrayDolar([...nuevoValorDolar]);
  };

  async function handleActualizarCuotas() {
    const resVal = await fetch(`/api/nest/quote`, {
      method: "post",
      body: JSON.stringify({
        arrayCuotas,
      }),
    });
    const responseData = await resVal.json();  
    setAlert(responseData.response);
    setShow(true);  
  }
  async function handleActualizarDolar() {
    const resVal = await fetch(`/api/nest/dolar`, {
      method: "post",
      body: JSON.stringify({
        arrayDolar,
      })
    });
    const responseData = await resVal.json();
    if(responseData){
      console.log(responseData);
      setAlert(responseData.response);
      setShow(true);
    }
  }

  async function handleUpdateProvider() {
    const fileInput = document.querySelector('input[type="file"]');
    const file = fileInput.files[0];

    if (!file) {
      console.log("No se seleccionó ningún archivo.");
      return;
    }

    try {
      const base64String = await fileToBase64Async(file);
      const provBody = JSON.stringify({
        nombreProveedor: proveedor, // Asegúrate de tener definida la variable "proveedor".
        base64: base64String,
      });

      const resval = await fetch("/api/nest/products/list", {
        method: "post",
        body: provBody,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (resval.ok) {
        const responseData = await resval.json();
        if(responseData){
          console.log(responseData);
          setAlert(responseData.response);
          setShow(true);
        }
        
      } else {
        setAlert("Error al enviar la solicitud a la API.");
        setShow(true);
      }
    } catch (error) {
      if(error != ""){
        console.log(error);
        setAlert("Error:", error);
        setShow(true);
      }
    }
  }

  // if (error) return <div>oops... {error.message}</div>;
  if (data === undefined)
    return (
      <div className="flex justify-center items-center w-full my-28">
        <p className="text-red-950 text-5xl">Cargando...</p>
      </div>
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
          <table className="border-collapse border border-slate-500">
            <thead>
              <tr>
                <th
                  className="border border-slate-600 text-red-950"
                  colSpan={6}
                >
                  Borrar listado
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="border border-slate-600 w-1/2">
                  <div className="text-red-950 flex justify-center items-center">
                      <select
                        className="w-full rounded-md px-4 py-1"
                        id="inputGroupSelect04"
                        aria-label="Example select with button addon"
                        onChange={handleSelectDeleteOption}
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
                    </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="flex justify-around">
            <button
              className="text-center hover:bg-red-950 hover:text-white p-1 ring-1 ring-red-950 rounded-md my-2"
              type="button"
              id="inputGroupFileAddon04"
              onClick={handleBorrarListado}
            >
              Borrar listado
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
              {arrayCuotas?.map((cuota) => (
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
              onClick={handleActualizarCuotas}
            >
              Actualizar valor de las cuotas
            </button>
          </div>
        </div>
        <div className="flex flex-col  w-3/4 mt-7">
          <table className="border-collapse border border-slate-500 ...">
            <thead>
              <tr>
                <th colSpan={12} className="text-red-950">
                  Valor del dolar por proveedor
                </th>
              </tr>
              <tr>
                <th className="border border-slate-600 text-red-950 font-normal">
                  Proveedor
                </th>
                <th className="border border-slate-600 text-red-950 font-normal">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {arrayDolar?.map((dolar) => (
                <tr key={dolar.proveedor}>
                  <td className="border border-slate-700 text-red-950 text-center w-1/2">
                    {dolar.proveedor}
                  </td>
                  <td className="border border-slate-700 text-red-950">
                    <input
                      className="text-center w-full"
                      value={dolar.precioDolar}
                      onChange={(e) =>
                        handleDolarChange(dolar.proveedor, e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-center mb-7">
            <button
              className="text-center hover:bg-red-950 hover:text-white p-1 ring-1 ring-red-950 rounded-md my-2"
              onClick={handleActualizarDolar}
            >
              Actualizar valor del dolar
            </button>
          </div>
        </div>
        <Alert action={show} alertText={alert} />
      </div>
    );
  }
});
