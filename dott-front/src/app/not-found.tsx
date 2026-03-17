import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-10">
      <div className="rounded-lg border border-red-100 bg-white p-6">
        <p className="text-sm font-semibold text-red-900">404</p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-900">Página no encontrada</h1>
        <p className="mt-2 text-sm text-neutral-700">
          La ruta que buscás no existe o fue movida.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex rounded-md bg-red-950 px-3 py-2 text-sm font-medium text-white hover:bg-red-900"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

