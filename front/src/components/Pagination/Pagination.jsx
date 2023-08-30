/* eslint-disable react/prop-types */
import React from "react";

const Pagination = ({ parametrosPaginado, paginaActual }) => {
  return (
    <nav aria-label="Page navigation example">
      <ul className="pagination">
        <li className="page-item">
          <a
            className="page-link text-success"
            href="#"
            aria-label="Previous"
            onClick={() => parametrosPaginado("reducir", 1)}
          >
            <span aria-hidden="true">&laquo;</span>
          </a>
        </li>
        <li className="page-item">
          <a
            className="page-link text-success"
            href="#"
            onClick={() => parametrosPaginado("cambiar", 1)}
          >
            1
          </a>
        </li>
        <li className="page-item ">
          <a
            className="page-link text-success"
            href="#"
            onClick={() => parametrosPaginado("cambiar", 2)}
          >
            2
          </a>
        </li>
        <li className="page-item">
          <a
            className="page-link text-success"
            href="#"
            onClick={() => parametrosPaginado("cambiar", 3)}
          >
            3
          </a>
        </li>
        {paginaActual > 3 && (
          <>
            <li className="page-item">
              <a className="page-link text-success" href="#">
                ...
              </a>
            </li>
            <li className="page-item">
              <a
                className="page-link text-success"
                href="#"
                onClick={() => parametrosPaginado("cambiar", paginaActual)}
              >
                {paginaActual}
              </a>
            </li>
          </>
        )}
        <li className="page-item">
          <a
            className="page-link text-success"
            href="#"
            aria-label="Next"
            onClick={() => parametrosPaginado("aumentar", 1)}
          >
            <span aria-hidden="true">&raquo;</span>
          </a>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
