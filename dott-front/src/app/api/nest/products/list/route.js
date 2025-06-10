import axios from "axios";
import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { apiUrl } from "../../utils/utils";

export async function GET(req) {
  try {
    const skip = req.nextUrl.searchParams.get("skip");
    const take = req.nextUrl.searchParams.get("take");
    const orderBy = req.nextUrl.searchParams.get("orderBy");

    const response = await axios.get(`${apiUrl}/productos`, {
      params: { skip, take, orderBy },
      headers: { "Content-Type": "application/json" },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error in GET request:", error);
    return NextResponse.json(
      { message: "Error fetching products", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSession(request);
    if (!session?.accessToken) {
      return NextResponse.json(
        { message: "Unauthorized: Missing access token" },
        { status: 401 }
      );
    }

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
    };

    const datoRequest = await request.json();
    const response = await axios.post(`${apiUrl}/productos`, datoRequest, config);

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json(
      { message: "Error creating product", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession(request);
    if (!session?.accessToken) {
      return NextResponse.json(
        { message: "Unauthorized: Missing access token" },
        { status: 401 }
      );
    }

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
    };

    const proveedor = await request.json();
    const response = await axios.post(`${apiUrl}/productos/delete`, proveedor, config);

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error in DELETE request:", error);
    return NextResponse.json(
      { message: "Error deleting product", error: error.message },
      { status: 500 }
    );
  }
}