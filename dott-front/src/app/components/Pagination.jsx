import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import React from "react";

export default function Pagination({
  actualPage,
  cantItems,
  itemsPerPage,
  newPage,
}) {
  const totalPages = Math.ceil(cantItems / itemsPerPage);
  const visiblePageRange = 10;
  let startPage = Math.max(1, actualPage - Math.floor(visiblePageRange / 2));
  let endPage = startPage + visiblePageRange - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - visiblePageRange + 1);
  }

  function goToPage(targetPage) {
    if (targetPage < 1 || targetPage > totalPages || targetPage === actualPage) {
      return;
    }

    newPage(targetPage);
  }

  const baseControlClasses =
    "relative inline-flex items-center px-3 py-2 text-sm font-semibold text-red-900 ring-1 ring-inset ring-red-200 transition hover:bg-red-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50";

  const generatePageLinks = () => {
    const pageLinks = [];
    if (startPage > 1) {
      pageLinks.push(
        <button
          key="prevDots"
          type="button"
          className={`${baseControlClasses} px-4`}
          onClick={() => goToPage(Math.max(1, actualPage - visiblePageRange))}
        >
          ...
        </button>
      );
    }
    for (let i = startPage; i <= endPage; i++) {
      pageLinks.push(
        <button
          key={i}
          type="button"
          className={
            actualPage === i
              ? "relative z-10 inline-flex items-center bg-red-950 px-4 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-red-950 focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              : `${baseControlClasses} px-4`
          }
          onClick={() => goToPage(i)}
        >
          {i}
        </button>
      );
    }
    if (endPage < totalPages) {
      pageLinks.push(
        <button
          key="nextDots"
          type="button"
          className={`${baseControlClasses} px-4`}
          onClick={() => goToPage(endPage + 1)}
        >
          ...
        </button>
      );
    }
    return pageLinks;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-red-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          type="button"
          className="relative inline-flex items-center rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-900 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={actualPage === 1}
          onClick={() => goToPage(actualPage - 1)}
        >
          Anterior
        </button>
        <div className="flex items-center justify-center">
          <p className="text-sm text-red-900">
            <span className="font-medium">{actualPage}</span> de{" "}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <button
          type="button"
          className="relative inline-flex items-center rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-900 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={actualPage === totalPages}
          onClick={() => goToPage(actualPage + 1)}
        >
          Siguiente
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-red-900">
            Mostrando{" "}
            <span className="font-medium">
              {Math.min((actualPage - 1) * itemsPerPage + 1, cantItems)}
            </span>{" "}
            a{" "}
            <span className="font-medium">
              {Math.min(actualPage * itemsPerPage, cantItems)}{" "}
            </span>{" "}
            de <span className="font-medium">{cantItems}</span> resultados
          </p>
        </div>
        <div>
          <nav
            className="isolate inline-flex -space-x-px rounded-md shadow-sm"
            aria-label="Pagination"
          >
            <button
              type="button"
              className={baseControlClasses}
              disabled={actualPage === 1}
              onClick={() => goToPage(1)}
            >
              Primera
            </button>
            <button
              type="button"
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-red-900 ring-1 ring-inset ring-red-200 transition hover:bg-red-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={actualPage === 1}
              onClick={() => goToPage(actualPage - 1)}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            {generatePageLinks()}
            <button
              type="button"
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-red-900 ring-1 ring-inset ring-red-200 transition hover:bg-red-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={actualPage === totalPages}
              onClick={() => goToPage(actualPage + 1)}
            >
              <span className="sr-only">Next</span>
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={baseControlClasses}
              disabled={actualPage === totalPages}
              onClick={() => goToPage(totalPages)}
            >
              Ultima
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
