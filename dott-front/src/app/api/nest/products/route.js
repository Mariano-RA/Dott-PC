import { apiUrl, apiPythonUrl } from "../utils/route";

export async function getProducts(page, take, sortType) {
  const response = await fetch(
    `${apiUrl}/api/productos?skip=${page}&take=${take}&orderBy=${sortType}`
  );
  const data = await response.json();
  return data;
}

export async function getProductsByKeywords(page, take, sortType, keywords) {
  const response = await fetch(
    `${apiUrl}/api/productos/buscarPorPalabrasClaves?keywords=${keywords}&skip=${page}&take=${take}&orderBy=${sortType}`
  );
  const data = await response.json();
  return data;
}

export async function getProductsByCategory(page, take, sortType, id) {
  const response = await fetch(
    `${apiUrl}/api/productos/categoria?category=${id}&skip=${page}&take=${take}&orderBy=${sortType}`
  );
  const data = await response.json();
  return data;
}

export async function updateProducts(proveedor, formData, accToken) {
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
