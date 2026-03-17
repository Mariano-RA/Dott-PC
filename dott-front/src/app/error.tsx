"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page py-10">
      <div className="rounded-lg border border-red-100 bg-white p-6">
        <p className="text-sm font-semibold text-red-900">Ocurrió un error</p>
        <p className="mt-2 text-sm text-neutral-700">{error?.message || "No pudimos cargar esta página."}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-md bg-red-950 px-3 py-2 text-sm font-medium text-white hover:bg-red-900"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

