import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import React, { useEffect, useState } from "react";

export default function Pagination({ actualPage, cantPages, newPage }) {
  useEffect(() => {
    console.log(actualPage);
  }, [actualPage]);

  function handlePagination(action, cant) {
    switch (action) {
      case "reduce":
        if (actualPage > 1) {
          newPage(actualPage - 1);
        }
        break;
      case "increase":
        newPage(actualPage + 1);
        break;
      case "change":
        newPage(cant);
        break;
      default:
        break;
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <a
          href="#"
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-red-950 hover:bg-gray-50"
        >
          Previous
        </a>
        <a
          href="#"
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-red-950 hover:bg-gray-50"
        >
          Next
        </a>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Mostrando{" "}
            <span className="font-medium">
              {actualPage == 1 ? 1 : actualPage * 20}
            </span>{" "}
            a{" "}
            <span className="font-medium">
              {actualPage ? actualPage * 20 : 20}{" "}
            </span>{" "}
            de <span className="font-medium">{cantPages}</span> resultados
          </p>
        </div>
        <div>
          <nav
            className="isolate inline-flex -space-x-px rounded-md shadow-sm"
            aria-label="Pagination"
          >
            <a
              href="#"
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              onClick={() => handlePagination("reduce", 1)}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href="#"
              aria-current="page"
              className={
                actualPage == 1
                  ? "relative z-10 inline-flex items-center bg-red-950 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  : "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-red-950 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              }
              onClick={() => handlePagination("change", 1)}
            >
              1
            </a>
            <a
              href="#"
              className={
                actualPage == 2
                  ? "relative z-10 inline-flex items-center bg-red-950 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  : "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-red-950 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              }
              onClick={() => handlePagination("change", 2)}
            >
              2
            </a>
            <a
              href="#"
              className={
                actualPage == 3
                  ? "relative z-10 inline-flex items-center bg-red-950 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  : "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-red-950 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              }
              onClick={() => handlePagination("change", 3)}
            >
              3
            </a>
            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-red-950 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
              ...
            </span>
            <a
              href="#"
              className={
                actualPage == 8
                  ? "relative z-10 inline-flex items-center bg-red-950 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  : "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-red-950 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              }
              onClick={() => handlePagination("change", 8)}
            >
              8
            </a>
            <a
              href="#"
              className={
                actualPage == 9
                  ? "relative z-10 inline-flex items-center bg-red-950 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  : "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-red-950 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              }
              onClick={() => handlePagination("change", 9)}
            >
              9
            </a>
            <a
              href="#"
              className={
                actualPage == 10
                  ? "relative z-10 inline-flex items-center bg-red-950 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  : "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-red-950 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              }
              onClick={() => handlePagination("change", 10)}
            >
              10
            </a>
            <a
              href="#"
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              onClick={() => handlePagination("increase", 1)}
            >
              <span className="sr-only">Next</span>
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
}
