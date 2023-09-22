import {
  withApiAuthRequired,
  getAccessToken,
  getSession,
} from "@auth0/nextjs-auth0";
import axios from "axios";
import { apiUrl } from "../utils/route";
import { NextResponse } from "next/server";

export async function POST(request) {
  const { headers } = await request;
  const { precioDolar } = await request.json();

  console.log(headers.get("authorization"));
  console.log(precioDolar);

  const accessToken = headers.get("authorization");
  const valorDolar = precioDolar;

  let config = {
    method: "post",
    url: `${apiUrl}/api/dolar`,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json", // Agregar el Content-Type aquí
      Authorization: accessToken,
    },
    body: JSON.stringify({
      precioDolar: valorDolar,
    }),
  };

  await fetch(`${apiUrl}/api/dolar`, {
    method: "POST",
    headers: {
      Authorization: accessToken,
    },
    body: JSON.stringify({
      precioDolar: valorDolar,
    }),
  });
}

// const POST = withApiAuthRequired(async (req, res) => {
//   const { accessToken } = await getSession(req, res, {
//     authorizationParams: {
//       scope: "create:tablas",
//     },
//   });

//   console.log(req?.text());
// const body = await req.json();
// const { precioDolar } = body;

// console.log(precioDolar);

// console.log(accessToken);

// let config = {
//   method: "post",
//   url: `${apiUrl}/api/dolar`,
//   headers: {
//     Accept: "application/json",
//     "Content-Type": "application/json", // Agregar el Content-Type aquí
//     Authorization: `Bearer ${accessToken}`,
//   },
//   data: JSON.stringify({
//     precioDolar: valorDolar,
//   }),
// };

// await axios.request(config).then((data) => console.log(data));

// await fetch(`${apiUrl}/api/dolar`, config).then((response) =>
//   console.log(response)
// );
// });

// export { POST };
