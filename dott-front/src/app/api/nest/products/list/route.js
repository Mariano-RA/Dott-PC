import { apiUrl } from "../../utils/utils";

export async function GET(page, take, sortType) {
  const response = await fetch(
    `${apiUrl}/api/productos?skip=${page}&take=${take}&orderBy=${sortType}`
  );
  const data = await response.json();
  return data;
}

export async function POST(proveedor, formData, accToken) {
  let config = {
    method: "post",
    url: `${apiPythonUrl}/procesar_archivo_${proveedor}`,
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
