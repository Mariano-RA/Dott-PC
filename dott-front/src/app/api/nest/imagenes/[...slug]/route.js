import { NextResponse } from "next/server";
import { apiUrl } from "../../utils/utils";

export async function GET(req, context) {
  try {
    const params = await context.params;
    const slug = params?.slug ?? [];
    if (!Array.isArray(slug) || slug.length < 2) {
      return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });
    }
    const [proveedor, codigo] = slug;

    const upstreamPath = `${apiUrl}/imagenes/${encodeURIComponent(
      proveedor
    )}/${encodeURIComponent(codigo)}`;

    const upstream = await fetch(upstreamPath, {
      method: "GET",
      headers: { accept: "image/*" },
      cache: "no-store",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "No se pudo cargar la imagen" },
        { status: upstream.status || 404 }
      );
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const bytes = await upstream.arrayBuffer();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "content-type": contentType,
        "content-disposition": "inline",
        "x-content-type-options": "nosniff",
        "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo cargar la imagen" },
      { status: 404 }
    );
  }
}

