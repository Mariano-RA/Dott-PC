import { NextResponse } from "next/server";
import { apiUrl } from "../../utils/utils";

export async function GET(req, context) {
  try {
    const params = await context.params;
    const slug = params?.slug ?? [];
    if (!Array.isArray(slug) || slug.length < 2) {
      return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });
    }
    const [proveedor, codigo, ...rest] = slug;
    const extra = rest.map((part) => encodeURIComponent(part)).join("/");
    const upstreamPath = extra
      ? `${apiUrl}/imagenes/${encodeURIComponent(proveedor)}/${encodeURIComponent(codigo)}/${extra}`
      : `${apiUrl}/imagenes/${encodeURIComponent(proveedor)}/${encodeURIComponent(codigo)}`;

    const isMeta = rest[0] === "meta";
    const upstream = await fetch(upstreamPath, {
      method: "GET",
      headers: { accept: isMeta ? "application/json" : "image/*" },
      cache: "no-store",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: isMeta ? "No se pudo cargar la galería" : "No se pudo cargar la imagen" },
        { status: upstream.status || 404 }
      );
    }

    if (isMeta) {
      const payload = await upstream.json();
      return NextResponse.json(payload, { status: 200 });
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
