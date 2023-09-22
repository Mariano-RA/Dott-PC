import { apiUrl } from "../utils/utils";

export async function GET() {
  const cuotas = await fetch(`${apiUrl}/api/cuota`);
  const arrCuotas = await cuotas.json();
  return arrCuotas;
}

export async function POST(arrCuotas, accessToken) {
  let config = {
    method: "post",
    url: `${apiUrl}/api/cuota`,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
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
