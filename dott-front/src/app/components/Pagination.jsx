import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import React, { useEffect, useState } from "react";

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

  function handlePagination(action, cant) {
    switch (action) {
      case "reduce":
        if (actualPage > 1) {
          newPage(actualPage - 1);
        }
        break;
      case "increase":
        if (actualPage < totalPages) {
          newPage(actualPage + 1);
        }
        break;
      case "change":
        newPage(cant);

        break;
      default:
        break;
    }
  }

  const generatePageLinks = () => {
    const pageLinks = [];
    if (startPage > 1) {
      pageLinks.push(
        <a
          key="prevDots"
          href="#"
          className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-red-950 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0"
          onClick={() => {
            actualPage <= 10
              ? handlePagination("change", 1)
              : handlePagination("change", actualPage - visiblePageRange);
          }}
        >
          ...
        </a>
      );
    }
    for (let i = startPage; i <= endPage; i++) {
      pageLinks.push(
        <a
          key={i}
          href="#"
          className={
            actualPage === i
              ? "relative z-10 inline-flex items-center bg-red-950 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              : "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-red-950 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
          }
          onClick={() => handlePagination("change", i)}
        >
          {i}
        </a>
      );
    }
    if (endPage < totalPages) {
      pageLinks.push(
        <a
          key="nextDots"
          href="#"
          className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-red-950 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0"
          onClick={() => handlePagination("change", endPage + 1)}
        >
          ...
        </a>
      );
    }
    return pageLinks;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <a
          href="#"
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-red-950 hover:bg-gray-50"
          onClick={() => handlePagination("reduce", 1)}
        >
          Previous
        </a>
        <a
          href="#"
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-red-950 hover:bg-gray-50"
          onClick={() => handlePagination("increase", 1)}
        >
          Next
        </a>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
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
            <a
              href="#"
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              onClick={() => handlePagination("reduce")}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </a>
            {generatePageLinks()}
            <a
              href="#"
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              onClick={() => handlePagination("increase")}
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
